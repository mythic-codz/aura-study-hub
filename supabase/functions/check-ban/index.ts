import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { device_id } = await req.json()
    
    if (!device_id) {
      return new Response(JSON.stringify({ banned: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get client IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || 'unknown'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if device_id OR ip_address is banned
    const { data, error } = await supabase
      .from('banned_devices')
      .select('*')
      .or(`device_id.eq.${device_id},ip_address.eq.${ip}`)
      .order('banned_until', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Check ban error:', error)
      return new Response(JSON.stringify({ banned: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (data && data.banned_until) {
      const bannedUntil = new Date(data.banned_until)
      const now = new Date()

      if (bannedUntil > now) {
        return new Response(JSON.stringify({
          banned: true,
          banned_until: data.banned_until,
          violation_count: data.violation_count,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ banned: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Check ban exception:', e)
    return new Response(JSON.stringify({ banned: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
