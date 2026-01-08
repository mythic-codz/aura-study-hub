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
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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

  const createUser = useCallback(async (name: string) => {
    const trimmedName = name.trim().toLowerCase();
    const deviceId = getOrCreateDeviceId();
    
    // First, check if a user with this name already exists
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for user:', searchError);
    }

    // If user with same name exists, link this device to that account
    if (existingUser) {
      // Update the device ID in localStorage to match the existing user's device
      storeDeviceId(existingUser.device_id);
      setUser(existingUser);
      setNeedsOnboarding(false);
      return existingUser;
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
    refetch: fetchUser,
  };
}
