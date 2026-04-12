import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, Loader2, Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/hooks/useQuiz';

interface QuizModalProps {
  questions: QuizQuestion[];
  onComplete: (answers: number[]) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export function QuizModal({ questions, onComplete, onClose, isSubmitting }: QuizModalProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completed, setCompleted] = useState(false);

  const question = questions[currentQ];
  const isCorrect = selectedOption === question?.correct_answer;
  const score = answers.reduce((acc, a, i) => acc + (a === questions[i]?.correct_answer ? 1 : 0), 0);

  const handleSelect = (optionIndex: number) => {
    if (showExplanation) return;
    setSelectedOption(optionIndex);
    setShowExplanation(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selectedOption!];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setCompleted(true);
      onComplete(newAnswers);
    }
  };

  if (completed) {
    const finalScore = answers.reduce((acc, a, i) => acc + (a === questions[i]?.correct_answer ? 1 : 0), 0);
    const xpEarned = finalScore * 2;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="glass-card p-8 rounded-2xl max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Complete!</h2>
          <p className="text-muted-foreground mb-4">
            You got <span className="text-primary font-bold">{finalScore}</span> out of{' '}
            <span className="font-bold">{questions.length}</span> correct
          </p>
          {xpEarned > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-bold">+{xpEarned} XP earned!</span>
            </motion.div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {isSubmitting && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </p>
          )}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card p-6 sm:p-8 rounded-2xl max-w-lg w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Question {currentQ + 1} of {questions.length}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
            Skip Quiz
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQ + (showExplanation ? 1 : 0)) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-5">{question.question}</h3>

            <div className="space-y-3">
              {question.options.map((option, i) => {
                let borderColor = 'border-white/10 hover:border-primary/50';
                let bgColor = 'bg-transparent';
                let icon = null;

                if (showExplanation) {
                  if (i === question.correct_answer) {
                    borderColor = 'border-green-500/50';
                    bgColor = 'bg-green-500/10';
                    icon = <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />;
                  } else if (i === selectedOption && i !== question.correct_answer) {
                    borderColor = 'border-red-500/50';
                    bgColor = 'bg-red-500/10';
                    icon = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
                  }
                } else if (i === selectedOption) {
                  borderColor = 'border-primary/50';
                  bgColor = 'bg-primary/10';
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={showExplanation}
                    whileHover={!showExplanation ? { scale: 1.01 } : {}}
                    whileTap={!showExplanation ? { scale: 0.99 } : {}}
                    className={`w-full text-left p-4 rounded-xl border ${borderColor} ${bgColor} transition-all flex items-center gap-3`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm text-foreground flex-1">{option}</span>
                    {icon}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-xl ${isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}
              >
                <p className="text-sm text-foreground/80">{question.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-end"
          >
            <Button onClick={handleNext} className="gap-2">
              {currentQ < questions.length - 1 ? 'Next Question' : 'See Results'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
