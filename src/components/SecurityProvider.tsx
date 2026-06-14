import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOrCreateDeviceId } from '@/lib/deviceId';
import { startDetection, stopDetection } from '@/lib/devtoolsDetection';
import { initSecurityGuard } from '@/lib/securityGuard';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const [isBanned, setIsBanned] = useState(false);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const reportingRef = useRef(false);

  // Check ban status on mount
  useEffect(() => {
    const checkBan = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const res = await fetch(`${SUPABASE_URL}/functions/v1/check-ban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: deviceId }),
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.banned) {
            sessionStorage.setItem('ban_info', JSON.stringify({
              banned_until: data.banned_until,
              violation_count: data.violation_count,
            }));
            setIsBanned(true);
            navigate('/blocked', { replace: true });
          }
        }
      } catch (e) {
        console.error('Ban check failed:', e);
      }
      setChecked(true);
    };

    checkBan();
  }, [navigate]);

  // Init security guard (shortcuts, right-click, etc.)
  useEffect(() => {
    if (location.pathname !== '/blocked') {
      initSecurityGuard();
    }
  }, [location.pathname]);

  // Start DevTools detection
  useEffect(() => {
    if (location.pathname === '/blocked') return;

    const handleDetection = async () => {
      if (reportingRef.current) return;
      reportingRef.current = true;

      try {
        const deviceId = getOrCreateDeviceId();
        const res = await fetch(`${SUPABASE_URL}/functions/v1/report-violation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
          body: JSON.stringify({ device_id: deviceId }),
        });

        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem('ban_info', JSON.stringify({
            banned_until: data.banned_until,
            violation_count: data.violation_count,
          }));
          setIsBanned(true);
          navigate('/blocked', { replace: true });
        }
      } catch (e) {
        console.error('Violation report failed:', e);
      }

      reportingRef.current = false;
    };

    startDetection(handleDetection);
    return () => stopDetection();
  }, [navigate, location.pathname]);

  // Force redirect if banned but not on blocked page
  useEffect(() => {
    if (isBanned && location.pathname !== '/blocked') {
      navigate('/blocked', { replace: true });
    }
  }, [isBanned, location.pathname, navigate]);

  if (!checked && location.pathname !== '/blocked') {
    // Show nothing until ban check completes
    return null;
  }

  return <>{children}</>;
}
