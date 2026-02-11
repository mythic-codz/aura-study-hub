

## Comprehensive Anti-Scraping and DevTools Protection System

### Honest Reality Check

No client-side protection can **fully** stop a determined developer -- the browser must receive the code to render it. However, this plan implements **every practical layer** to make it extremely difficult, annoying, and risky for 99% of users. The combination of client-side deterrents + server-side enforcement + persistent banning creates a strong defense-in-depth system.

### What Will Be Built

**Layer 1: Immediate Client-Side Protections (before React loads)**
- Inline script in `index.html` that blocks keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U), disables right-click, and prevents text selection
- This runs before any JS framework loads, so it catches early attempts

**Layer 2: DevTools Detection Engine**
- Multiple detection methods running in parallel:
  - Window outer/inner size difference detection
  - `debugger` statement timing attack (if debugger pauses, timing exceeds threshold)
  - Console log object trick (overriding toString/getter to detect when console evaluates objects)
  - `performance.now()` timing checks
- Runs on a continuous interval (every 1-2 seconds)

**Layer 3: Progressive Ban System (Server-Side)**
- New `banned_devices` database table storing device_id, IP address, violation count, and ban expiry
- **Edge Function: `check-ban`** -- called on every app load to verify if the device/IP is banned
- **Edge Function: `report-violation`** -- called when DevTools are detected; increments violations and calculates ban duration:
  - 1st offense: 1 day
  - 2nd offense: 1 week
  - 3rd offense: 1 month
  - 4th offense: 3 months
  - 5th+ offense: 1 year
- Bans by BOTH device ID AND IP address, so clearing cache/cookies does not help
- IP is resolved server-side (not client-side) so it cannot be faked

**Layer 4: Security Provider Component**
- Wraps the entire app in `SecurityProvider`
- On mount: calls `check-ban` edge function with device_id
- If banned: redirects to `/blocked` (Pirate page) with no way to navigate away
- Starts DevTools detection loop; on detection, calls `report-violation` and redirects

**Layer 5: Pirate/Blocked Page**
- Full-screen blocked page showing a skull/pirate icon
- Displays the violation count and remaining ban time
- Cannot be navigated away from (all routes redirect back)
- Also blocks keyboard shortcuts on this page

**Layer 6: Source Code Obfuscation**
- CSS to disable user-select on the body
- Disable drag events on images/media

---

### Technical Details

#### New Database Migration
```sql
CREATE TABLE banned_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  ip_address text,
  violation_count integer DEFAULT 0,
  banned_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE banned_devices ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access
-- Public can only read their own ban status
CREATE POLICY "Anyone can check bans"
  ON banned_devices FOR SELECT
  USING (true);
```

#### New Edge Function: `check-ban`
- Accepts POST with `{ device_id }`
- Extracts client IP from request headers server-side
- Queries `banned_devices` for matching device_id OR ip_address
- Returns `{ banned, banned_until, violation_count }`

#### New Edge Function: `report-violation`
- Accepts POST with `{ device_id }`
- Gets IP server-side from request headers
- Upserts into `banned_devices`: increments violation_count, calculates new ban duration
- Returns updated ban info

#### New Files
| File | Purpose |
|------|---------|
| `src/lib/devtoolsDetection.ts` | Multi-method DevTools detection engine |
| `src/lib/securityGuard.ts` | Keyboard shortcut blocking, right-click disable, text selection disable |
| `src/components/SecurityProvider.tsx` | App wrapper: ban check on mount, continuous detection, violation reporting |
| `src/pages/BlockedPage.tsx` | Pirate/blocked page with ban timer |
| `supabase/functions/check-ban/index.ts` | Edge function to check ban status |
| `supabase/functions/report-violation/index.ts` | Edge function to record violations and escalate bans |

#### Modified Files
| File | Change |
|------|--------|
| `index.html` | Add inline security script (shortcut blocking before React loads) |
| `src/App.tsx` | Wrap routes with `SecurityProvider`, add `/blocked` route |
| `supabase/config.toml` | Add function configs with `verify_jwt = false` |

### What This Stops
- Casual users pressing F12 or right-clicking
- Users trying to view source with Ctrl+U
- Users opening DevTools from browser menu (detected via size/timing)
- Users clearing cache to bypass ban (IP-based ban persists)
- Users switching browsers on same device (device ID persists via IP fallback)
- Automated scraping tools (rate-limited + ban system)

### What This Cannot Stop
- VPN + fresh browser + disabling JavaScript (but site won't work without JS)
- Network-level packet inspection (would need DRM/encrypted streams for video)
- Extremely determined reverse engineers (no client-side solution can)

