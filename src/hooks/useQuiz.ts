import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  batch_id: string;
  content_type: string;
  content_index: number;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  answers: number[];
  xp_earned: number;
  created_at: string;
}

export function useQuiz(batchId: string, contentType: string, contentIndex: number) {
  return useQuery({
    queryKey: ['quiz', batchId, contentType, contentIndex],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('batch_id', batchId)
        .eq('content_type', contentType)
        .eq('content_index', contentIndex)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Quiz | null;
    },
    enabled: !!batchId,
  });
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId, contentType, contentIndex, title, pdfUrl,
    }: {
      batchId: string;
      contentType: string;
      contentIndex: number;
      title?: string;
      pdfUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          batch_id: batchId,
          content_type: contentType,
          content_index: contentIndex,
          title,
          pdf_url: pdfUrl,
        },
      });

      if (error) throw error;
      return data as Quiz;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['quiz', data.batch_id, data.content_type, data.content_index],
        data
      );
    },
  });
}

export function useQuizAttempts(quizId?: string) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['quizAttempts', quizId, user?.id],
    queryFn: async () => {
      if (!user || !quizId) return [];
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as QuizAttempt[];
    },
    enabled: !!user && !!quizId,
  });
}

export function useSubmitQuizAttempt() {
  const { user, addXP } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quizId, answers, questions,
    }: {
      quizId: string;
      answers: number[];
      questions: QuizQuestion[];
    }) => {
      if (!user) throw new Error('No user');

      let score = 0;
      answers.forEach((answer, i) => {
        if (questions[i] && answer === questions[i].correct_answer) {
          score++;
        }
      });

      const xpEarned = score * 2; // 2 XP per correct answer

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score,
          total_questions: questions.length,
          answers,
          xp_earned: xpEarned,
        })
        .select()
        .single();

      if (error) throw error;

      if (xpEarned > 0) {
        await addXP(xpEarned);
      }

      return data as QuizAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizAttempts'] });
    },
  });
}
