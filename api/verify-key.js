import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const trimmedKey = (key || '').trim()
  const OWNER_MASTER_KEY = (process.env.VITE_OWNER_MASTER_KEY || 'ANAZK-OWNER-VIP-2026').trim()

  // 0. Owner Master Key Bypass
  if (trimmedKey === OWNER_MASTER_KEY) {
    return res.status(200).json({
      valid: true,
      timeRemaining: 'UNLIMITED',
      durationMinutes: 999999,
      isOwner: true
    })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase configuration is missing.' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Fetch the key from the database
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', trimmedKey)
      .single()

    if (error || !license) {
      return res.status(404).json({ error: 'Invalid API Key.' })
    }

    if (license.status === 'expired') {
      return res.status(403).json({ error: 'This API Key has expired.' })
    }

    // 2. Anti-Piracy Check: If bound to another device, reject
    if (deviceId && license.device_id && license.device_id !== deviceId) {
      return res.status(403).json({ error: 'This License Key is already bound to another device.' })
    }

    const now = new Date()
    let activatedAt = license.activated_at

    // 3. If it's the first time using the key, activate and lock to device
    if (!activatedAt || (deviceId && !license.device_id)) {
      activatedAt = activatedAt || now.toISOString()
      const updateData = { activated_at: activatedAt, status: 'active' }
      if (deviceId) updateData.device_id = deviceId

      const { error: updateError } = await supabase
        .from('licenses')
        .update(updateData)
        .eq('key', key.trim())

      if (updateError) {
        return res.status(500).json({ error: 'Failed to activate the key.' })
      }
    }

    // 3. Check if the key has expired based on durationMinutes
    const activationTime = new Date(activatedAt).getTime()
    const currentTime = now.getTime()
    const durationMs = license.duration_minutes * 60 * 1000
    const timeElapsed = currentTime - activationTime
    const timeRemaining = durationMs - timeElapsed

    if (timeRemaining <= 0) {
      // Mark as expired
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('key', key)
      
      return res.status(403).json({ error: 'This API Key has expired.' })
    }

    // 4. Key is valid
    return res.status(200).json({
      valid: true,
      timeRemaining: Math.floor(timeRemaining / 1000 / 60), // remaining in minutes
      durationMinutes: license.duration_minutes,
      activatedAt: activatedAt
    })
  } catch (err) {
    console.error('Verify Key Error:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
