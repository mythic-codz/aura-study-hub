import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateDeviceId, storeDeviceId } from '@/lib/deviceId';

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

// Simple hash function for password (client-side)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [existingUserName, setExistingUserName] = useState<string | undefined>();

  const fetchUser = useCallback(async () => {
    const deviceId = getOrCreateDeviceId();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setUser(data);
      setNeedsOnboarding(false);
    } else {
      setNeedsOnboarding(true);
    }
    setLoading(false);
  }, []);

  const createUser = useCallback(async (name: string, password: string) => {
    const trimmedName = name.trim().toLowerCase();
    const deviceId = getOrCreateDeviceId();
    const passwordHash = await hashPassword(password);
    
    // First, check if a user with this name already exists
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for user:', searchError);
    }

    // If user with same name exists, verify password
    if (existingUser) {
      if (existingUser.password_hash !== passwordHash) {
        throw new Error('Incorrect password');
      }
      // Update the device ID in localStorage to match the existing user's device
      storeDeviceId(existingUser.device_id);
      setUser(existingUser);
      setNeedsOnboarding(false);
      return existingUser;
    }

    // If we're in login mode but user doesn't exist
    if (authMode === 'login') {
      throw new Error('User not found. Please create an account first.');
    }

    // Try to get IP address (will be null if fetch fails)
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
        name: trimmedName,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    setUser(data);
    setNeedsOnboarding(false);
    return data;
  }, [authMode]);

  const loginUser = useCallback(async (name: string, password: string) => {
    const trimmedName = name.trim().toLowerCase();
    const passwordHash = await hashPassword(password);
    
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('*')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (error) {
      console.error('Error finding user:', error);
      throw new Error('Error finding user');
    }

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (existingUser.password_hash !== passwordHash) {
      throw new Error('Incorrect password');
    }

    // Update device ID to link this device to the account
    storeDeviceId(existingUser.device_id);
    setUser(existingUser);
    setNeedsOnboarding(false);
    return existingUser;
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
    existingUserName,
    createUser,
    loginUser,
    updateUser,
    addXP,
    refetch: fetchUser,
    switchAuthMode,
  };
}