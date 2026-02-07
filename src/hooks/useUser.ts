import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateDeviceId, storeDeviceId, getDeviceId } from '@/lib/deviceId';

export interface User {
  id: string;
  device_id: string;
  ip_address: string | null;
  name: string;
  avatar_url: string | null;
  xp: number;
  created_at: string;
}

const SESSION_USER_KEY = 'aura-study-user-session';

function storeSession(userId: string, deviceId: string) {
  try {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify({ userId, deviceId }));
  } catch {}
}

function getStoredSession(): { userId: string; deviceId: string } | null {
  try {
    const stored = localStorage.getItem(SESSION_USER_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function clearSession() {
  try { localStorage.removeItem(SESSION_USER_KEY); } catch {}
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchUser = useCallback(async () => {
    const session = getStoredSession();
    
    if (session) {
      storeDeviceId(session.deviceId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.userId)
        .maybeSingle();

      if (!error && data) {
        setUser(data);
        setNeedsOnboarding(false);
        setLoading(false);
        return;
      }
      clearSession();
    }
    
    const deviceId = getDeviceId();
    if (deviceId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (!error && data) {
        storeSession(data.id, data.device_id);
        setUser(data);
        setNeedsOnboarding(false);
        setLoading(false);
        return;
      }
    }

    setNeedsOnboarding(true);
    setLoading(false);
  }, []);

  const createUser = useCallback(async (name: string) => {
    const deviceId = getOrCreateDeviceId();
    
    let ipAddress = null;
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch (e) {
      console.log('Could not fetch IP address');
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        device_id: deviceId,
        ip_address: ipAddress,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    storeSession(data.id, data.device_id);
    setUser(data);
    setNeedsOnboarding(false);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setNeedsOnboarding(true);
    getOrCreateDeviceId();
  }, []);

  const updateUser = useCallback(async (updates: Partial<Pick<User, 'name' | 'avatar_url'>>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setUser(data);
    return data;
  }, [user]);

  const addXP = useCallback(async (amount: number) => {
    if (!user) return;
    const newXP = user.xp + amount;
    const { data, error } = await supabase
      .from('users')
      .update({ xp: newXP })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setUser(data);
    return data;
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    needsOnboarding,
    createUser,
    updateUser,
    addXP,
    logout,
    refetch: fetchUser,
  };
}
