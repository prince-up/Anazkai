import Stripe from 'stripe'

const PLANS = {
  '1-hour': { name: 'Anazk 1 Hour', amount: 30000, interval: 'day', durationMinutes: 60 },
  '2-hour': { name: 'Anazk 2 Hours', amount: 60000, interval: 'day', durationMinutes: 120 },
  '10-sessions': { name: 'Anazk 10 Sessions', amount: 290000, interval: 'day', durationMinutes: 1200 },
  weekly: { name: 'Anazk AI Weekly', amount: 150000, interval: 'week', durationMinutes: 10080 },
  monthly: { name: 'Anazk AI Monthly', amount: 300000, interval: 'month', durationMinutes: 43200 },
  yearly: { name: 'Anazk AI Yearly', amount: 600000, interval: 'year', durationMinutes: 525600 },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe is not configured on this deployment.' })
  }

  try {
    const { planId } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const plan = PLANS[planId]
    if (!plan) return res.status(400).json({ error: 'Choose a valid subscription plan.' })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin = req.headers.origin || `https://${req.headers.host}`
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'inr',
            unit_amount: plan.amount,
            recurring: { interval: plan.interval },
            product_data: { name: plan.name, description: 'Anazk AI desktop interview copilot' },
          },
        }],
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?payment=cancelled`,
        billing_address_collection: 'auto',
        integration_identifier: `anazk_${Math.random().toString(36).slice(2, 10)}`,
        metadata: {
          durationMinutes: plan.durationMinutes.toString()
        }
      },
      { idempotencyKey: `anazk-${planId}-${Date.now()}` },
    )

    return res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('[v0] Stripe checkout error:', error)
    return res.status(500).json({ error: 'Unable to start checkout. Please try again.' })
  }
}
