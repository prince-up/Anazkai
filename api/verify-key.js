import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { key } = req.body
  if (!key) {
    return res.status(400).json({ error: 'API Key is required.' })
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
      .eq('key', key)
      .single()

    if (error || !license) {
      return res.status(404).json({ error: 'Invalid API Key.' })
    }

    if (license.status === 'expired') {
      return res.status(403).json({ error: 'This API Key has expired.' })
    }

    const now = new Date()
    let activatedAt = license.activated_at

    // 2. If it's the first time using the key, activate it
    if (!activatedAt) {
      activatedAt = now.toISOString()
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ activated_at: activatedAt, status: 'active' })
        .eq('key', key)

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
