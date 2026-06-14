import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
}

// Ban durations in days
const BAN_DURATIONS = [1, 7, 30, 90, 365]

function getBanDays(violationCount: number): number {
  const index = Math.min(violationCount - 1, BAN_DURATIONS.length - 1)
  return BAN_DURATIONS[index]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only allow a device to report a violation for ITSELF. Derive the
    // device id from the request header, never from the request body, so a
    // caller cannot ban arbitrary users by passing their device_id.
    const device_id = req.headers.get('x-device-id')

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'device_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get client IP server-side
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || req.headers.get('x-real-ip')
      || 'unknown'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if record already exists for this device
    const { data: existing } = await supabase
      .from('banned_devices')
      .select('*')
      .eq('device_id', device_id)
      .maybeSingle()

    let result

    if (existing) {
      // Increment violation count
      const newCount = existing.violation_count + 1
      const banDays = getBanDays(newCount)
      const bannedUntil = new Date()
      bannedUntil.setDate(bannedUntil.getDate() + banDays)

      const { data, error } = await supabase
        .from('banned_devices')
        .update({
          violation_count: newCount,
          banned_until: bannedUntil.toISOString(),
          ip_address: ip,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // First violation
      const banDays = getBanDays(1)
      const bannedUntil = new Date()
      bannedUntil.setDate(bannedUntil.getDate() + banDays)

      const { data, error } = await supabase
        .from('banned_devices')
        .insert({
          device_id,
          ip_address: ip,
          violation_count: 1,
          banned_until: bannedUntil.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return new Response(JSON.stringify({
      banned: true,
      banned_until: result.banned_until,
      violation_count: result.violation_count,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Report violation error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
