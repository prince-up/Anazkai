import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const PLANS = {
  '1-hour': { name: 'Anazk 1 Hour', durationMinutes: 60 },
  '2-hour': { name: 'Anazk 2 Hours', durationMinutes: 120 },
  '10-sessions': { name: 'Anazk 10 Sessions', durationMinutes: 1200 },
  weekly: { name: 'Anazk AI Weekly', durationMinutes: 10080 },
  monthly: { name: 'Anazk AI Monthly', durationMinutes: 43200 },
  yearly: { name: 'Anazk AI Yearly', durationMinutes: 525600 },
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

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    console.error('RAZORPAY_KEY_SECRET is not configured on server')
    return res.status(500).json({ error: 'Server payment configuration is missing.' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const orderId = body.razorpay_order_id || body.order_id
    const paymentId = body.razorpay_payment_id || body.payment_id
    const signature = body.razorpay_signature || body.signature
    const { planId, email } = body

    // 1. Validate required fields
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification parameters (order_id, payment_id, signature).'
      })
    }

    // 2. Generate HMAC-SHA256 signature
    const text = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex')

    // 3. Constant-time signature comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expectedSignature, 'utf-8')
    const signatureBuf = Buffer.from(String(signature), 'utf-8')

    const isAuthentic = 
      expectedBuf.length === signatureBuf.length &&
      crypto.timingSafeEqual(expectedBuf, signatureBuf)

    if (!isAuthentic) {
      console.warn(`Payment signature mismatch for order ${orderId}, payment ${paymentId}`)
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: Invalid signature.'
      })
    }

    // 4. Payment is verified successfully. Generate license key if Supabase is present
    let generatedLicenseKey = `anazk_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
    const durationMinutes = (planId && PLANS[planId]?.durationMinutes) || 60

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { error: dbError } = await supabase
          .from('licenses')
          .insert([
            {
              key: generatedLicenseKey,
              duration_minutes: durationMinutes,
              status: 'unused',
              stripe_session_id: paymentId, // store payment reference
              email: email || null
            }
          ])

        if (dbError) {
          console.error('Warning: Failed to insert license into Supabase:', dbError.message)
        } else {
          console.log(`Generated and saved license key: ${generatedLicenseKey} for ${durationMinutes} mins.`)
        }

        // 4b. Record referral code usage if present
        if (body.referralCode) {
          try {
            const { data: codeData, error: codeErr } = await supabase
              .from('referral_codes')
              .select('*')
              .eq('code', body.referralCode.trim().toUpperCase())
              .single()

            if (codeData && !codeErr) {
              const { error: usageErr } = await supabase
                .from('referral_usages')
                .insert([
                  {
                    code: codeData.code,
                    buyer_email: email || null,
                    order_id: orderId,
                    payment_id: paymentId,
                    discount_amount: codeData.discount_rupees,
                    commission_amount: codeData.commission_rupees,
                    status: 'pending'
                  }
                ])

              if (usageErr) {
                console.error('Warning: Failed to record referral usage in Supabase:', usageErr.message)
              } else {
                console.log(`Successfully recorded referral usage for code ${codeData.code}`)
              }
            }
          } catch (refEx) {
            console.error('Referral record database exception:', refEx.message)
          }
        }
      } catch (dbEx) {
        console.error('Supabase DB operation error during payment verify:', dbEx.message)
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      order_id: orderId,
      payment_id: paymentId,
      key: generatedLicenseKey,
      licenseKey: generatedLicenseKey,
      planId: planId || null
    })
  } catch (err) {
    console.error('Payment Verification Error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during payment verification.'
    })
  }
}
