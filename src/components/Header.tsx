import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Trophy, User, Sparkles, Award, Waves } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logo from '@/assets/logo.png';

export function Header() {
  const { user } = useUser();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/achievements', icon: Award, label: 'Badges' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-card rounded-none border-t-0 border-x-0 backdrop-blur-2xl">
      <div className="container mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all duration-300 shadow-lg">
              <img 
                src={logo} 
                alt="Study Ocean" 
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div
              className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 blur-sm -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          </motion.div>
          <div className="hidden sm:flex flex-col">
            <span className="font-display font-bold text-lg gradient-text leading-tight">
              Study Ocean
            </span>
            <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wide">
              Learn • Grow • Excel
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-primary/15 border border-primary/20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
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
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="xp-badge text-xs sm:text-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-bold">{user.xp}</span>
                <span className="hidden sm:inline font-medium">XP</span>
              </motion.div>
              <Link to="/profile">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-primary/20 hover:ring-primary/50 transition-all duration-300">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
