import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

export interface StudySession {
  id: string;
  user_id: string;
  study_date: string;
  minutes_studied: number;
  created_at: string;
}

export function useStreak() {
  const { user } = useUser();

  const sessionsQuery = useQuery({
    queryKey: ['studySessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('study_date', { ascending: false })
        .limit(60);

      if (error) throw error;
      return (data || []) as StudySession[];
    },
    enabled: !!user,
  });

  // Calculate streak from sessions
  const currentStreak = (() => {
    const sessions = sessionsQuery.data || [];
    if (sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const dates = new Set(sessions.map(s => s.study_date));

    // Streak must include today or yesterday
    if (!dates.has(todayStr) && !dates.has(yesterdayStr)) return 0;

    let streak = 0;
    const startDate = dates.has(todayStr) ? today : yesterday;

    for (let i = 0; i < 60; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (dates.has(ds)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  })();

  const xpMultiplier = Math.min(1 + (currentStreak * 0.1), 2);

  return {
    sessions: sessionsQuery.data || [],
    currentStreak,
    longestStreak: (user as any)?.longest_streak || 0,
    xpMultiplier,
    isLoading: sessionsQuery.isLoading,
  };
}

export function useRecordStudySession() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');

      const today = new Date().toISOString().split('T')[0];

      // Upsert: if already exists for today, increment minutes
      const { data: existing } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('study_date', today)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('study_sessions')
          .update({ minutes_studied: (existing as any).minutes_studied + 1 })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('study_sessions')
          .insert({ user_id: user.id, study_date: today, minutes_studied: 1 });
        if (error) throw error;
      }

      // Update streak on user
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('study_date')
        .eq('user_id', user.id)
        .order('study_date', { ascending: false })
        .limit(60);

      const dates = new Set((sessions || []).map((s: any) => s.study_date));
      let streak = 0;
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 60; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        if (dates.has(ds)) {
          streak++;
        } else {
          break;
        }
      }

      const longestStreak = Math.max(streak, (user as any).longest_streak || 0);

      await supabase
        .from('users')
        .update({ current_streak: streak, longest_streak: longestStreak })
        .eq('id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
    },
  });
}
