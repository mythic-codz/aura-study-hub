import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const PROXY_BASE = `${SUPABASE_URL}/functions/v1/content-proxy`

// Block obvious SSRF targets (local / private / metadata addresses)
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (h === '169.254.169.254') return true // cloud metadata
  // IPv4 private ranges
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [parseInt(m[1]), parseInt(m[2])]
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
  }
  return false
}

// Only allow proxying from trusted content delivery hosts. This prevents the
// proxy from being abused as an open HTTP proxy.
const ALLOWED_HOST_SUFFIXES = ['cloudfront.net', 'akamaihd.net', 'akamaized.net']

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`))
}

function validate(raw: string | null): URL | null {
  if (!raw) return null
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  if (isBlockedHost(u.hostname)) return null
  if (!isAllowedHost(u.hostname)) return null
  return u
}

function proxify(absUrl: string): string {
  return `${PROXY_BASE}?url=${encodeURIComponent(absUrl)}&apikey=${ANON_KEY}`
}

function rewriteM3u8(text: string, manifestUrl: URL): string {
  const lines = text.split('\n')
  return lines
    .map((line) => {
      const t = line.trim()
      if (t === '') return line
      if (t.startsWith('#')) {
        // Rewrite URI="..." attributes (EXT-X-KEY, EXT-X-MAP, EXT-X-MEDIA, etc.)
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          try {
            const abs = new URL(uri, manifestUrl).toString()
            return `URI="${proxify(abs)}"`
          } catch {
            return `URI="${uri}"`
          }
        })
      }
      // Segment or variant-playlist URI line
      try {
        const abs = new URL(t, manifestUrl).toString()
        return proxify(abs)
      } catch {
        return line
      }
    })
    .join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const reqUrl = new URL(req.url)
  const target = validate(reqUrl.searchParams.get('url'))

  if (!target) {
    return new Response(JSON.stringify({ error: 'Invalid or disallowed url parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        // Forward a browser-like UA and range for media seeking
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0',
        ...(req.headers.get('range') ? { Range: req.headers.get('range')! } : {}),
        Referer: `${target.protocol}//${target.host}/`,
      },
    })

    const contentType = (upstream.headers.get('content-type') || '').toLowerCase()
    const isManifest =
      target.pathname.endsWith('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('application/x-mpegurl')

    const baseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Cache-Control': 'no-store',
    }

    if (isManifest) {
      const text = await upstream.text()
      const rewritten = rewriteM3u8(text, target)
      return new Response(rewritten, {
        status: upstream.status,
        headers: { ...baseHeaders, 'Content-Type': 'application/vnd.apple.mpegurl' },
      })
    }

    // Binary passthrough (PDF, TS segments, keys, mp4, etc.)
    const passthrough: Record<string, string> = { ...baseHeaders }
    const ct = upstream.headers.get('content-type')
    if (ct) passthrough['Content-Type'] = ct
    const len = upstream.headers.get('content-length')
    if (len) passthrough['Content-Length'] = len
    const acceptRanges = upstream.headers.get('accept-ranges')
    if (acceptRanges) passthrough['Accept-Ranges'] = acceptRanges
    const contentRange = upstream.headers.get('content-range')
    if (contentRange) passthrough['Content-Range'] = contentRange

    return new Response(upstream.body, {
      status: upstream.status,
      headers: passthrough,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: String(e) }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
