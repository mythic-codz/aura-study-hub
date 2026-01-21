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
  password_hash?: string | null;
}

// Session storage key for remembering logged in user
const SESSION_USER_KEY = 'aura-study-user-session';

// Simple hash function for password (client-side)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Store session user info
function storeSession(userId: string, deviceId: string) {
  try {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify({ userId, deviceId }));
  } catch {}
}

// Get stored session
function getStoredSession(): { userId: string; deviceId: string } | null {
  try {
    const stored = localStorage.getItem(SESSION_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return null;
}

// Clear session
function clearSession() {
  try {
    localStorage.removeItem(SESSION_USER_KEY);
  } catch {}
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('login'); // Default to login

  const fetchUser = useCallback(async () => {
    // First, check if we have a stored session
    const session = getStoredSession();
    
    if (session) {
      // Ensure device ID is set correctly
      storeDeviceId(session.deviceId);
      
      // Try to fetch user by stored session
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
      
      // Session invalid, clear it
      clearSession();
    }
    
    // Check by device ID as fallback
    const deviceId = getDeviceId();
    
    if (deviceId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (!error && data) {
        // Store session for future
        storeSession(data.id, data.device_id);
        setUser(data);
        setNeedsOnboarding(false);
        setLoading(false);
        return;
      }
    }

    // No user found, show login/register modal
    setNeedsOnboarding(true);
    setAuthMode('login'); // Default to login
    setLoading(false);
  }, []);

  const createOrLogin = useCallback(async (name: string, password: string) => {
    const trimmedName = name.trim().toLowerCase();
    const passwordHash = await hashPassword(password);
    
    // First, check if a user with this name exists
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for user:', searchError);
    }

    // If user with same name exists, verify password and log in
    if (existingUser) {
      if (existingUser.password_hash !== passwordHash) {
        throw new Error('Incorrect password');
      }
      // Update device ID to match existing user's device for RLS
      storeDeviceId(existingUser.device_id);
      storeSession(existingUser.id, existingUser.device_id);
      setUser(existingUser);
      setNeedsOnboarding(false);
      return existingUser;
    }

    // User doesn't exist - create new account (auto-register)
    const newDeviceId = getOrCreateDeviceId();
    
    // Try to get IP address
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
        device_id: newDeviceId,
        ip_address: ipAddress,
        name: trimmedName,
        password_hash: passwordHash,
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
    setAuthMode('login');
    // Generate new device ID for this device
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

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

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

    if (error) {
      console.error('Error adding XP:', error);
      throw error;
    }

    setUser(data);
    return data;
  }, [user]);

  const switchAuthMode = useCallback(() => {
    setAuthMode(mode => mode === 'register' ? 'login' : 'register');
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    needsOnboarding,
    authMode,
    createUser: createOrLogin, // Renamed for backward compatibility
    loginUser: createOrLogin,  // Same function handles both
    updateUser,
    addXP,
    logout,
    refetch: fetchUser,
    switchAuthMode,
  };
}
