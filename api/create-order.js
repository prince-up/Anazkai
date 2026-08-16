import Razorpay from 'razorpay'

const PLANS = {
  '1-hour': { name: 'Anazk 1 Hour', amount: 30000, durationMinutes: 60 },
  '2-hour': { name: 'Anazk 2 Hours', amount: 60000, durationMinutes: 120 },
  '10-sessions': { name: 'Anazk 10 Sessions', amount: 290000, durationMinutes: 1200 },
  weekly: { name: 'Anazk AI Weekly', amount: 150000, durationMinutes: 10080 },
  monthly: { name: 'Anazk AI Monthly', amount: 300000, durationMinutes: 43200 },
  yearly: { name: 'Anazk AI Yearly', amount: 600000, durationMinutes: 525600 },
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader?.('Access-Control-Allow-Credentials', 'true')
  res.setHeader?.('Access-Control-Allow-Origin', '*')
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader?.(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    console.error('Razorpay credentials missing in server environment')
    return res.status(500).json({ error: 'Razorpay credentials not configured on server.' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    let { amount, currency = 'INR', receipt, planId, notes = {} } = body

    // If planId is provided, resolve amount and notes from PLANS
    if (planId && PLANS[planId]) {
      amount = PLANS[planId].amount
      notes = {
        ...notes,
        planId,
        planName: PLANS[planId].name,
        durationMinutes: String(PLANS[planId].durationMinutes)
      }
    }

    // Ensure amount is parsed as integer
    amount = parseInt(amount, 10)

    // Validate minimum amount (>= 100 paise = 1 INR)
    if (isNaN(amount) || amount < 100) {
      return res.status(400).json({ 
        error: 'Invalid amount. Minimum amount is 100 paise (₹1.00).' 
      })
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const options = {
      amount,
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes
    }

    const order = await razorpay.orders.create(options)

    return res.status(200).json({
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      keyId: keyId,
      status: order.status
    })
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error)
    if (error.statusCode === 401 || error?.error?.code === 'BAD_REQUEST_ERROR' && error?.error?.description?.includes('auth')) {
      return res.status(401).json({ error: 'Razorpay authentication failed. Invalid API credentials.' })
    }
    return res.status(error.statusCode || 500).json({
      error: error.message || error?.error?.description || 'Failed to create Razorpay order'
    })
  }
}
