import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, BookOpen, User, Flame, MessageCircle, ChevronLeft, ChevronRight, Gift, Compass } from 'lucide-react';
import { useEngagement } from '@/context/EngagementContext';
import { cn } from '@/lib/utils';
import logo from '@/assets/songchainn-logo.webp';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { InviteFriends } from '@/components/InviteFriends';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/social', label: 'Feed', icon: MessageCircle },
  { path: '/profile', label: 'Profile', icon: User },
];

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { engagementPoints, currentStreak } = useEngagement();
  const [showInvite, setShowInvite] = useState(false);
  
  // Enable swipe gestures for mobile navigation
  useSwipeNavigation();

  const handleBack = () => navigate(-1);
  const handleForward = () => navigate(1);

  return (
    <header className="sticky top-0 z-40 glass-surface border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo - always visible */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <motion.img
              src={logo}
              alt="$ongChainn"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            />
            <span className="hidden sm:block font-heading font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
              $ongChainn
            </span>
          </Link>

          {/* Desktop Nav Links - hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-3 py-2 rounded-xl font-medium text-sm transition-all press-effect",
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

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop stats - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass text-xs sm:text-sm"
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-foreground font-medium">{currentStreak}</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-2.5 py-1.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-glow"
              >
                {engagementPoints.toLocaleString()} pts
              </motion.div>
            </div>

            {/* Invite button */}
            <motion.button
              onClick={() => setShowInvite(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl glass text-primary hover:bg-primary/10 transition-colors"
              aria-label="Invite friends"
            >
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>

            <NotificationDropdown />

            {/* Mobile Nav - Bottom bar style in header for tablet, icons only */}
            <nav className="flex lg:hidden items-center">
              {navItems.slice(0, 5).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "p-2 rounded-lg transition-all press-effect",
                      isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
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

      {/* Invite Friends Modal */}
      <InviteFriends isOpen={showInvite} onClose={() => setShowInvite(false)} />
    </header>
  );
}