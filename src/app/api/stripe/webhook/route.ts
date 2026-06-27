import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, {
    apiVersion: '2026-06-24.dahlia',
  });
}

export async function POST(request: NextRequest) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }


  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : 0;

    if (!userId || !credits || credits <= 0) {
      console.error('Missing metadata in checkout session:', session.metadata);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (!user) {
      console.error('User not found for Stripe credit top-up:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: user.credits + credits })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to add credits:', updateError);
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: credits,
      transaction_type: 'purchase',
      description: `Purchased ${credits} credits via Stripe`,
    });

    console.log(`Added ${credits} credits to user ${userId}`);
  }

  return NextResponse.json({ received: true });
}
