import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, BookOpen, Flame } from 'lucide-react';
import { useEngagement } from '@/context/EngagementContext';
import logo from '@/assets/songchainn-logo.png';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Discover', icon: Home },
  { path: '/artists', label: 'Artists', icon: Users },
  { path: '/education', label: 'Learn', icon: BookOpen },
];

export function Navigation() {
  const location = useLocation();
  const { engagementPoints, currentStreak } = useEngagement();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={logo} alt="SongChainn" className="w-9 h-9 object-contain" />
            <div className="hidden xs:block">
              <span className="font-heading font-bold text-base text-foreground">SongChainn</span>
              <span className="hidden lg:inline text-xs text-primary ml-2 font-medium">Audience Edition</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-secondary rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Engagement Stats */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{currentStreak} day streak</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                {engagementPoints.toLocaleString()} pts
              </div>
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
                      "p-2 rounded-lg transition-colors",
                      isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
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

      {/* Early Access Banner */}
      <div className="bg-primary/5 border-t border-primary/10 py-2 px-4">
        <div className="container mx-auto">
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            <span className="text-primary font-medium">Early Access</span>
            <span className="hidden sm:inline"> – This is an audience edition designed to build listening behavior and culture before ownership begins.</span>
            <span className="sm:hidden"> – Building culture before ownership.</span>
          </p>
        </div>
      </div>
    </header>
  );
}
