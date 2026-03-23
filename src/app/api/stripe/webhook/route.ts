import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const metadata = session.metadata ?? {}
        const planTier = metadata.planName || 'molecule'

        await db.update(users)
          .set({
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            planTier,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeCustomerId, customerId))

        console.log('[stripe-webhook] checkout.session.completed:', session.id, 'customer:', customerId)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'past_due'
          : sub.status === 'canceled' ? 'canceled'
          : sub.status

        const periodEnd = sub.items.data[0]?.current_period_end
        await db.update(users)
          .set({
            subscriptionStatus: status,
            ...(periodEnd ? { subscriptionPeriodEnd: new Date(periodEnd * 1000) } : {}),
            updatedAt: new Date(),
          })
          .where(eq(users.stripeCustomerId, customerId))

        console.log('[stripe-webhook] subscription.updated:', sub.id, status)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        await db.update(users)
          .set({
            subscriptionStatus: 'free',
            planTier: 'free',
            stripeSubscriptionId: null,
            subscriptionPeriodEnd: null,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeCustomerId, customerId))

        console.log('[stripe-webhook] subscription.deleted:', sub.id)
        break
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] DB error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
