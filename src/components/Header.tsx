import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Trophy, User, Sparkles, Award, LogOut } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StreakBadge } from '@/components/StreakBadge';
import logo from '@/assets/logo.png';

export function Header() {
  const { user, logout } = useUser();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/achievements', icon: Award, label: 'Badges' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-40 glass-card rounded-none border-t-0 border-x-0 backdrop-blur-2xl"
    >
      <div className="container mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all duration-500 shadow-lg group-hover:shadow-primary/20">
              <img 
                src={logo} 
                alt="Utkarsh By Trms" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <motion.div
              className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 blur-md -z-10 opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          <div className="hidden sm:flex flex-col">
            <motion.span 
              className="font-display font-bold text-lg gradient-text leading-tight"
              whileHover={{ scale: 1.02 }}
            >
              Utkarsh By Trms
            </motion.span>
            <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wide">
              Free Unlocked Batches • Learn • Excel
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`
                    relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-primary/15 border border-primary/25 rounded-xl shadow-lg shadow-primary/10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </AnimatePresence>
                  <Icon className={`w-4 h-4 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  <span className="hidden md:block text-sm font-medium relative z-10">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <StreakBadge />
              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="xp-badge text-xs sm:text-sm cursor-pointer"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </motion.div>
                <span className="font-bold">{user.xp}</span>
                <span className="hidden sm:inline font-medium">XP</span>
              </motion.div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="relative focus:outline-none"
                  >
                    <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-primary/20 hover:ring-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10 min-w-[160px]">
                  <Link to="/profile">
                    <DropdownMenuItem className="cursor-pointer gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
