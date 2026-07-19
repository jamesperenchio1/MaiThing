/**
 * refund-payment — Supabase Edge Function
 *
 * Refunds a Stripe PaymentIntent linked to an order. Called by the buyer client
 * after cancel_order has restored inventory. Updates the order status to
 * 'refunded' so the webhook idempotency check is satisfied.
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

interface RefundPaymentRequest {
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

    const body: RefundPaymentRequest = await req.json().catch(() => ({}));
    const orderId = body.order_id?.trim();
    if (!orderId) {
      throw new Error('order_id is required');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, status, stripe_payment_intent_id')
      .eq('id', orderId)
      .eq('buyer_id', userData.user.id)
      .in('status', ['paid', 'cancelled', 'refunded'])
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or not refundable');
    }

    if (!order.stripe_payment_intent_id) {
      throw new Error('No payment intent linked to this order');
    }

    // Idempotency: if already refunded, just confirm.
    if (order.status === 'refunded') {
      return new Response(JSON.stringify({ status: 'already_refunded' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      metadata: { order_id: orderId },
    });

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'refunded', cancelled_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      throw new Error('Failed to update order status');
    }

    return new Response(JSON.stringify({ status: 'refunded', refund_id: refund.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logError('refund-payment', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
