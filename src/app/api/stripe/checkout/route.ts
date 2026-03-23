import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { userId } = await auth()
    const { priceId, planName, email, phone } = await req.json()

    const customer = await stripe.customers.create({
      email: email || undefined,
      phone: phone || undefined,
      metadata: { planName, clerkId: userId || '' },
    })

    // Persist Stripe customer ID in our DB so webhooks can find this user
    if (userId) {
      await db.update(users)
        .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
        .where(eq(users.clerkId, userId))
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: { planName },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = subscription.latest_invoice as any
    const pi = invoice.payment_intent as Stripe.PaymentIntent

    return NextResponse.json({
      clientSecret: pi.client_secret,
      subscriptionId: subscription.id,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
