/**
 * create-payment-intent — Supabase Edge Function
 *
 * Creates a Stripe PaymentIntent for a reserved order and stores the PI id on
 * the order. Returns the client_secret for the consumer app's payment sheet.
 *
 * Env required:
 *  - STRIPE_SECRET_KEY
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePaymentIntentRequest {
  order_id?: string;
}

function logError(ctx: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({ level: 'error', context: ctx, message, timestamp: new Date().toISOString() }),
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }
    const token = authHeader.replace('Bearer ', '');

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      throw new Error('Unauthorized');
    }
    const buyerId = userData.user.id;

    const body: CreatePaymentIntentRequest = await req.json().catch(() => ({}));
    const orderId = body.order_id?.trim();
    if (!orderId) {
      throw new Error('order_id is required');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        listing:listings(*),
        location:locations(*, org:merchant_orgs(stripe_connect_account_id))
      `,
      )
      .eq('id', orderId)
      .eq('buyer_id', buyerId)
      .in('status', ['reserved'])
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or not payable');
    }

    const amountSatang = Math.round(Number(order.amount_thb) * 100);
    const applicationFeeSatang = Math.round(Number(order.platform_fee_thb) * 100);
    if (amountSatang <= 0) {
      throw new Error('Invalid order amount');
    }

    const stripeAccountId = (
      order.location as { org?: { stripe_connect_account_id?: string } } | null
    )?.org?.stripe_connect_account_id;

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountSatang,
      currency: 'thb',
      metadata: {
        order_id: orderId,
        buyer_id: buyerId,
      },
      automatic_payment_methods: { enabled: true },
    };

    if (stripeAccountId && applicationFeeSatang > 0) {
      paymentIntentParams.application_fee_amount = applicationFeeSatang;
      paymentIntentParams.transfer_data = { destination: stripeAccountId };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    const { error: updateError } = await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', orderId);

    if (updateError) {
      // Best-effort cleanup: cancel the PI so it cannot be paid.
      await stripe.paymentIntents
        .cancel(paymentIntent.id)
        .catch((e) => logError('pi-cancel-fallback', e));
      throw new Error('Failed to link payment intent');
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    logError('create-payment-intent', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
