import { lazy, Suspense, useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { EngagementProvider } from "@/context/EngagementContext";
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load pages for better initial load performance
const Home = lazy(() => import("./pages/Home"));
const Discover = lazy(() => import("./pages/Discover"));
const Artists = lazy(() => import("./pages/Artists"));
const ArtistDetail = lazy(() => import("./pages/ArtistDetail"));
const Education = lazy(() => import("./pages/Education"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const Social = lazy(() => import("./pages/Social"));
const AudienceProfile = lazy(() => import("./pages/AudienceProfile"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading spinner component
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: 'easeIn' as const,
    },
  },
};

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artist/:id" element={<ArtistDetail />} />
          <Route path="/education" element={<Education />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/social" element={<Social />} />
          <Route path="/audience/:userId" element={<AudienceProfile />} />
          <Route path="/install" element={<Install />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// Auth transition variants - more dramatic for login flow
const authTransitionVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    filter: 'blur(8px)',
    transition: {
      duration: 0.4,
      ease: 'easeIn' as const,
    },
  },
};

// Curtain reveal animation
function CurtainReveal({ children, show }: { children: React.ReactNode; show: boolean }) {
  return (
    <div className="relative min-h-screen">
      {children}
      
      {/* Curtains that open after auth */}
      <AnimatePresence>
        {show && (
          <>
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
              className="fixed inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background via-card to-card z-50"
            />
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
              className="fixed inset-y-0 right-0 w-1/2 bg-gradient-to-l from-background via-card to-card z-50"
            />
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="w-40 h-40 rounded-full bg-gradient-to-r from-primary/30 to-cyan-400/30 blur-3xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// AppContent must be rendered inside AuthProvider
function AppContent() {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  const [showCurtains, setShowCurtains] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  // Track authentication state changes for curtain reveal
  useEffect(() => {
    if (!wasAuthenticated && isAuthenticated && !isLoading) {
      setShowCurtains(true);
      const timer = setTimeout(() => setShowCurtains(false), 1000);
      return () => clearTimeout(timer);
    }
    setWasAuthenticated(isAuthenticated);
  }, [isAuthenticated, isLoading, wasAuthenticated]);

  // Determine current view state
  const viewState = isLoading ? 'loading' : !isAuthenticated ? 'auth' : needsOnboarding ? 'onboarding' : 'app';

  return (
    <AnimatePresence mode="wait">
      {viewState === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PageLoader />
        </motion.div>
      )}

      {viewState === 'auth' && (
        <motion.div
          key="auth"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={authTransitionVariants}
        >
          <Suspense fallback={<PageLoader />}>
            <Auth />
          </Suspense>
        </motion.div>
      )}

      {viewState === 'onboarding' && (
        <motion.div
          key="onboarding"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={authTransitionVariants}
        >
          <Suspense fallback={<PageLoader />}>
            <Onboarding />
          </Suspense>
        </motion.div>
      )}

      {viewState === 'app' && (
        <motion.div
          key="app"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={authTransitionVariants}
        >
          <CurtainReveal show={showCurtains}>
            <PlayerProvider>
              <EngagementProvider>
                <BrowserRouter>
                  <Suspense fallback={<PageLoader />}>
                    <AnimatedRoutes />
                  </Suspense>
                </BrowserRouter>
              </EngagementProvider>
            </PlayerProvider>
          </CurtainReveal>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
