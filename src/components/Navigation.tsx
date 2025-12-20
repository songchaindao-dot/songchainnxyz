import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, BookOpen, User, Flame, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEngagement } from '@/context/EngagementContext';
import { cn } from '@/lib/utils';
import logo from '@/assets/songchainn-logo.png';

const navItems = [
  { path: '/', label: 'Discover', icon: Home },
  { path: '/artists', label: 'Artists', icon: Users },
  { path: '/social', label: 'Social', icon: MessageCircle },
  { path: '/education', label: 'Learn', icon: BookOpen },
  { path: '/profile', label: 'Profile', icon: User },
];

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { engagementPoints, currentStreak } = useEngagement();

  const handleBack = () => navigate(-1);
  const handleForward = () => navigate(1);

  return (
    <header className="sticky top-0 z-40 glass-surface border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Back/Forward + Logo */}
          <div className="flex items-center gap-2">
            {/* Navigation Controls */}
            <div className="flex items-center gap-1">
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={handleForward}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go forward"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group ml-2">
              <motion.img
                src={logo}
                alt="SongChainn"
                className="w-9 h-9 object-contain"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              />
              <div className="hidden xs:block">
                <span className="font-heading font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  SongChainn
                </span>
                <span className="hidden lg:inline text-xs text-primary ml-2 font-medium px-2 py-0.5 rounded-full bg-primary/10">
                  Audience
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-4 py-2 rounded-xl font-medium text-sm transition-all press-effect",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2 relative z-10">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 glass rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Engagement Stats */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-sm"
              >
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-foreground font-medium">{currentStreak}</span>
                <span className="text-muted-foreground text-xs">day</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow"
              >
                {engagementPoints.toLocaleString()} pts
              </motion.div>
            </div>

            {/* Mobile Menu */}
            <nav className="flex md:hidden items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "p-2.5 rounded-xl transition-all press-effect",
                      isActive ? "text-primary glass" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}