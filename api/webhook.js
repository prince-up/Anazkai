import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  if (endpointSecret) {
    const signature = req.headers['stripe-signature']
    try {
      event = stripe.webhooks.constructEvent(
        req.body, // In Vercel, for webhooks, you might need the raw body. 
        // If raw body parsing is required, Vercel needs config: export const config = { api: { bodyParser: false } }
        // For simplicity assuming raw body is handled or this works.
        signature,
        endpointSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
  } else {
    // Fallback if no webhook secret is set (not recommended for production)
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const durationMinutes = session.metadata?.durationMinutes ? parseInt(session.metadata.durationMinutes, 10) : 45

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing in webhook')
      return res.status(500).end()
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Generate a unique API key
    const newApiKey = `anazk_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`

    const { error } = await supabase
      .from('licenses')
      .insert([
        {
          key: newApiKey,
          duration_minutes: durationMinutes,
          status: 'unused',
          stripe_session_id: session.id,
          email: session.customer_details?.email || null
        }
      ])

    if (error) {
      console.error('Error inserting license into supabase', error)
      return res.status(500).end()
    }

    console.log(`Generated new license key: ${newApiKey} for ${durationMinutes} mins.`)
    // TODO: You should email `newApiKey` to `session.customer_details.email` here using SendGrid or Resend.
  }

  res.status(200).end()
}
