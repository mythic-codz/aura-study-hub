import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, StickyNote, Brain } from 'lucide-react';
import { Header } from '@/components/Header';
import { VideoPlayer } from '@/components/VideoPlayer';
import { PDFViewer } from '@/components/PDFViewer';
import { QuizModal } from '@/components/QuizModal';
import { NotesDrawer } from '@/components/NotesDrawer';
import { Button } from '@/components/ui/button';
import { useBatch, VideoItem, PdfItem } from '@/hooks/useBatches';
import { useProgress, useUpdateProgress } from '@/hooks/useProgress';
import { useQuiz, useGenerateQuiz, useSubmitQuizAttempt, useQuizAttempts } from '@/hooks/useQuiz';
import { useNotes } from '@/hooks/useNotes';
import { useRecordStudySession } from '@/hooks/useStreak';
import { toast } from 'sonner';

export default function PlayPage() {
  const { batchId, type, index } = useParams<{ batchId: string; type: 'video' | 'pdf'; index: string }>();
  const { data: batch, isLoading } = useBatch(batchId || '');
  const { data: progressData } = useProgress(batchId);
  const updateProgress = useUpdateProgress();
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const videoSeekRef = useRef<((time: number) => void) | null>(null);

  const contentIndex = parseInt(index || '0', 10);

  // Hooks (always called)
  const { data: quiz } = useQuiz(batchId || '', type || '', contentIndex);
  const generateQuiz = useGenerateQuiz();
  const submitAttempt = useSubmitQuizAttempt();
  const { data: attempts } = useQuizAttempts(quiz?.id);
  const { data: notes } = useNotes(batchId || '', type || '', contentIndex);
  const recordSession = useRecordStudySession();

  // Record study session on mount
  const sessionRecorded = useRef(false);
  useEffect(() => {
    if (!sessionRecorded.current) {
      sessionRecorded.current = true;
      recordSession.mutate();
    }
  }, []);

  // Build flat list of content from structured_data OR legacy arrays
  const { allVideos, allPdfs } = useMemo(() => {
    if (batch?.structured_data?.subjects && batch.structured_data.subjects.length > 0) {
      const videos: VideoItem[] = [];
      const pdfs: PdfItem[] = [];
      
      batch.structured_data.subjects.forEach((subject) => {
        subject.topics.forEach((topic) => {
          topic.videos.forEach((video) => videos.push(video));
          topic.pdfs.forEach((pdf) => pdfs.push(pdf));
        });
      });
      
      return { allVideos: videos, allPdfs: pdfs };
    }
    return { allVideos: batch?.videos || [], allPdfs: batch?.pdfs || [] };
  }, [batch]);

  const content = useMemo(() => {
    return type === 'video' ? allVideos[contentIndex] : allPdfs[contentIndex];
  }, [type, contentIndex, allVideos, allPdfs]);

  const existingProgress = progressData?.find(
    p => p.content_type === type && p.content_index === contentIndex
  );
  const initialTime = existingProgress?.last_position || 0;

  const hasAttempted = (attempts?.length || 0) > 0;

  const handleProgress = useCallback((percent: number, currentTime?: number, duration?: number) => {
    if (duration && duration > 0) setVideoDuration(duration);
    if (currentTime !== undefined) setCurrentTimestamp(currentTime);

    updateProgress.mutate({
      batchId: batchId!,
      contentType: type!,
      contentIndex,
      progressPercent: percent,
      lastPosition: currentTime || 0,
      videoDuration: duration || videoDuration,
    });

  }, [batchId, type, contentIndex, videoDuration]);

  const handleQuizComplete = (answers: number[]) => {
    if (!quiz) return;
    submitAttempt.mutate({
      quizId: quiz.id,
      answers,
      questions: quiz.questions,
    });
  };

  const handleManualQuiz = () => {
    if (quiz) {
      setShowQuiz(true);
    } else {
      generateQuiz.mutate({
        batchId: batchId!,
        contentType: type!,
        contentIndex,
        title: content?.title,
        pdfUrl: type === 'pdf' ? content?.url : undefined,
      }, {
        onSuccess: () => setShowQuiz(true),
        onError: () => toast.error('Failed to generate quiz'),
      });
    }
  };

  // Auto-open the quiz when arriving from a "Take Quiz" batch item (?quiz=1)
  const [searchParams] = useSearchParams();
  const quizAutoOpened = useRef(false);
  useEffect(() => {
    if (searchParams.get('quiz') === '1' && content && !quizAutoOpened.current) {
      quizAutoOpened.current = true;
      handleManualQuiz();
    }
  }, [searchParams, content]);

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!batch || !content) {
    return (
      <div className="min-h-screen animated-bg">
        <Header />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">Content not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to={`/batch/${batchId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4" /> Back to {batch.name}
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotes(true)}
              className="gap-2"
            >
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
              {(notes?.length || 0) > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {notes?.length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualQuiz}
              disabled={generateQuiz.isPending}
              className="gap-2"
            >
              {generateQuiz.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Quiz</span>
              {hasAttempted && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">✓</span>
              )}
            </Button>
          </div>
        </div>

        {type === 'video' ? (
          <VideoPlayer 
            src={content.url} 
            title={content.title} 
            onProgress={handleProgress} 
            initialTime={initialTime}
          />
        ) : (
          <PDFViewer src={content.url} title={content.title} onProgress={handleProgress} />
        )}
      </main>

      {/* Notes Drawer */}
      <NotesDrawer
        open={showNotes}
        onClose={() => setShowNotes(false)}
        notes={notes || []}
        batchId={batchId!}
        contentType={type!}
        contentIndex={contentIndex}
        currentTimestamp={currentTimestamp}
        onSeek={(t) => videoSeekRef.current?.(t)}
      />

      {/* Quiz Modal */}
      {showQuiz && quiz && (
        <QuizModal
          questions={quiz.questions}
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
          isSubmitting={submitAttempt.isPending}
        />
      )}
    </div>
  );
}
