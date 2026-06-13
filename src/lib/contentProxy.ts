// Routes PDF and video (HLS) URLs through the secure content-proxy edge function.
// This hides the original CDN URLs from the network tab and adds an extra
// layer against direct scraping / hot-linking.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const PROXY_BASE = `${SUPABASE_URL}/functions/v1/content-proxy`;

/**
 * Returns a proxied URL for the given content URL.
 * Already-proxied or non-http URLs are returned untouched.
 */
export function proxyUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) return url;
  if (url.startsWith(PROXY_BASE)) return url;
  return `${PROXY_BASE}?url=${encodeURIComponent(url)}&apikey=${ANON_KEY}`;
}
