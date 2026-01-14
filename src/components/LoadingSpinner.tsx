import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  showLogo?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export function LoadingSpinner({ size = 'md', message, showLogo = true }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer ring animation */}
        <motion.div
          className={`${sizeClasses[size]} rounded-2xl`}
          animate={{
            boxShadow: [
              '0 0 0 0 hsl(var(--primary) / 0.4)',
              '0 0 0 12px hsl(var(--primary) / 0)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        
        {/* Logo or spinner */}
        {showLogo ? (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-2xl overflow-hidden ring-2 ring-primary/30 shadow-lg`}
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <img src={logo} alt="Loading" className="w-full h-full object-cover" />
          </motion.div>
        ) : (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-2xl border-2 border-primary/30 border-t-primary`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-sm font-medium text-foreground/80">{message}</span>
        </motion.div>
      )}
    </div>
  );
}
