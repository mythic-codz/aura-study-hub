import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, User, Anchor, Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo.png';

interface OnboardingModalProps {
  onComplete: (name: string, password: string) => Promise<any>;
  mode?: 'register' | 'login';
  existingUserName?: string;
  onSwitchMode?: () => void;
}
  existingUserName?: string;
  onSwitchMode?: () => void;
}

export function OnboardingModal({ onComplete, mode = 'register', existingUserName, onSwitchMode }: OnboardingModalProps) {
  const [name, setName] = useState(existingUserName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onComplete(name, password);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Floating particles for visual interest
  const particles = [...Array(6)].map((_, i) => ({
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animated-bg overflow-hidden">
      {/* Floating particles */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          style={{ left: `${particle.x}%` }}
          initial={{ y: '100vh', opacity: 0 }}
          animate={{ 
            y: '-100vh', 
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-md p-8 mx-4 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center mb-8">
          {/* Logo with entrance animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="relative"
          >
            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-6 ring-4 ring-primary/30 shadow-2xl shadow-primary/20">
              <img src={logo} alt="Study Ocean" className="w-full h-full object-cover" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/30 to-accent/30 blur-xl -z-10"
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.9, 1.05, 0.9] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-display font-bold gradient-text mb-2"
          >
            {mode === 'login' ? 'Welcome Back' : 'Welcome to Study Ocean'}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            {mode === 'login' ? 'Enter your credentials to continue' : 'Dive deep into knowledge, emerge wiser'}
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label className="block text-sm font-medium mb-2 text-foreground/80">
              {mode === 'login' ? 'Your name' : 'What should we call you, explorer?'}
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12 bg-secondary/50 border-white/10 focus:border-primary h-12 rounded-xl text-base"
                autoFocus={mode !== 'login'}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            <label className="block text-sm font-medium mb-2 text-foreground/80">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 bg-secondary/50 border-white/10 focus:border-primary h-12 rounded-xl text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <label className="block text-sm font-medium mb-2 text-foreground/80">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 bg-secondary/50 border-white/10 focus:border-primary h-12 rounded-xl text-base"
                />
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-destructive text-sm flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 btn-ocean text-base relative overflow-hidden group"
            >
              {loading ? (
                <motion.div 
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <Anchor className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">{mode === 'login' ? 'Login' : 'Set Sail'}</span>
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {onSwitchMode && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="relative z-10 text-sm text-muted-foreground text-center mt-4"
          >
            {mode === 'login' ? "New here? " : "Already have an account? "}
            <button
              type="button"
              onClick={onSwitchMode}
              className="text-primary hover:underline font-medium"
            >
              {mode === 'login' ? 'Create account' : 'Login'}
            </button>
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="relative z-10 text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-2"
        >
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-muted-foreground/30" />
          Your voyage is saved automatically
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-muted-foreground/30" />
        </motion.p>

        {/* Decorative waves */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.15, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden"
        >
          <motion.div
            animate={{ x: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Waves className="w-full h-full text-primary" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}