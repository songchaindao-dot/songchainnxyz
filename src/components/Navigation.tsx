import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, BookOpen, User, Flame, MessageCircle, Gift, Compass, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Enable swipe gestures for mobile navigation
  useSwipeNavigation();

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
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

              {/* Mobile Hamburger Menu Button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                className="lg:hidden p-2 rounded-xl glass text-foreground hover:bg-primary/10 transition-colors"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Invite Friends Modal */}
        <InviteFriends isOpen={showInvite} onClose={() => setShowInvite(false)} />
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
            />
            
            {/* Menu Panel */}
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 glass-surface border-l border-border/50 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <span className="font-heading font-bold text-foreground">Menu</span>
                <motion.button
                  onClick={() => setMobileMenuOpen(false)}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-xl glass text-foreground"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Mobile Stats */}
              <div className="p-4 border-b border-border/50 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-foreground font-medium">{currentStreak} streak</span>
                </div>
                <div className="px-3 py-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow">
                  {engagementPoints.toLocaleString()} pts
                </div>
              </div>

              {/* Nav Links */}
              <div className="p-4 space-y-2">
                {navItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-all",
                        isActive 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "glass text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}