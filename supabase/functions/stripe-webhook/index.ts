/**
 * stripe-webhook — Supabase Edge Function
 *
 * Verifies Stripe webhook signatures and keeps order/subscription statuses in
 * sync. Idempotent: skips events that have already been applied.
 *
 * Env required:
 *  - STRIPE_WEBHOOK_SECRET
 *  - STRIPE_SECRET_KEY (for fetching PaymentIntents when needed)
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16.0.0?target=denonext';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

function logError(ctx: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({ level: 'error', context: ctx, message, timestamp: new Date().toISOString() }),
  );
}

function logInfo(ctx: string, payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      level: 'info',
      context: ctx,
      ...payload,
      timestamp: new Date().toISOString(),
    }),
  );
}

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

async function updateOrderStatusByPaymentIntent(
  paymentIntentId: string,
  targetStatus: 'paid' | 'cancelled' | 'refunded',
) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status')
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (error) throw error;
  if (!orders || orders.length === 0) {
    logInfo('order-not-found', { payment_intent_id: paymentIntentId });
    return;
  }

  for (const order of orders) {
    // Idempotency: only move forward in the state machine.
    if (order.status === targetStatus) {
      logInfo('already-in-target-status', { order_id: order.id, status: targetStatus });
      continue;
    }
    if (targetStatus === 'paid' && order.status !== 'reserved') {
      logInfo('skip-paid-transition', { order_id: order.id, current_status: order.status });
      continue;
    }
    if (
      (targetStatus === 'cancelled' || targetStatus === 'refunded') &&
      order.status === 'collected'
    ) {
      logInfo('skip-post-collection-refund', { order_id: order.id, current_status: order.status });
      continue;
    }

    const update: { status: string; cancelled_at?: string; collected_at?: string } = {
      status: targetStatus,
    };
    if (targetStatus === 'cancelled' || targetStatus === 'refunded') {
      update.cancelled_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase.from('orders').update(update).eq('id', order.id);
    if (updateError) throw updateError;
    logInfo('order-status-updated', { order_id: order.id, new_status: targetStatus });
  }
}

async function handleConnectAccount(event: StripeEvent) {
  const account = event.data.object as {
    id: string;
    details_submitted?: boolean;
    charges_enabled?: boolean;
  };
  logInfo('connect-account-event', { account_id: account.id, type: event.type });

  if (event.type === 'account.updated') {
    const { data: orgs, error } = await supabase
      .from('merchant_orgs')
      .select('id')
      .eq('stripe_connect_account_id', account.id);
    if (error) throw error;
    if (!orgs || orgs.length === 0) return;

    const update = {
      subscription_status:
        account.details_submitted && account.charges_enabled ? 'active' : 'pending',
    };
    const { error: updateError } = await supabase
      .from('merchant_orgs')
      .update(update)
      .eq('id', orgs[0].id);
    if (updateError) throw updateError;
  }
}

async function handleSubscriptionEvent(event: StripeEvent) {
  const subscription = event.data.object as {
    id: string;
    status: string;
    current_period_end?: number;
  };
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id);
  if (error) throw error;
  if (!subs || subs.length === 0) {
    logInfo('subscription-not-found', { stripe_subscription_id: subscription.id });
    return;
  }

  const update = {
    status: subscription.status,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  };
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update(update)
    .eq('id', subs[0].id);
  if (updateError) throw updateError;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    const body = await req.text();
    let event: StripeEvent;
    try {
      const constructedEvent = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
      );
      event = constructedEvent as unknown as StripeEvent;
    } catch (err) {
      logError('signature-verification', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    logInfo('webhook-received', { event_id: event.id, event_type: event.type });

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as { id: string };
        await updateOrderStatusByPaymentIntent(pi.id, 'paid');
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string };
        await updateOrderStatusByPaymentIntent(pi.id, 'cancelled');
        break;
      }
      case 'payment_intent.canceled': {
        const pi = event.data.object as { id: string };
        await updateOrderStatusByPaymentIntent(pi.id, 'cancelled');
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as { payment_intent: string | null };
        if (charge.payment_intent) {
          await updateOrderStatusByPaymentIntent(charge.payment_intent, 'refunded');
        }
        break;
      }
      case 'account.updated':
      case 'account.application.authorized':
      case 'account.application.deauthorized': {
        await handleConnectAccount(event);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await handleSubscriptionEvent(event);
        break;
      }
      default:
        logInfo('unhandled-event', { event_type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logError('stripe-webhook', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
