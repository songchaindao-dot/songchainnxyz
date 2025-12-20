import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 10,
  },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
      when: 'beforeChildren' as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    y: -10,
    transition: {
      duration: 0.3,
      ease: 'easeIn' as const,
    },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Auth transition wrapper - more dramatic for login/logout
interface AuthTransitionProps {
  children: ReactNode;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const authVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    filter: 'blur(10px)',
    transition: {
      duration: 0.4,
      ease: 'easeIn' as const,
    },
  },
};

const loadingVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

export function AuthTransition({ children, isAuthenticated, isLoading }: AuthTransitionProps) {
  // Create a key that changes when auth state changes
  const stateKey = isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stateKey}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={isLoading ? loadingVariants : authVariants}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Curtain reveal animation for dramatic entrance
export function CurtainReveal({ children, isReady }: { children: ReactNode; isReady: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isReady ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {children}
      </motion.div>

      {/* Curtain overlays */}
      <AnimatePresence>
        {!isReady && (
          <>
            {/* Left curtain */}
            <motion.div
              initial={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
              className="fixed inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background to-card z-50"
            />
            {/* Right curtain */}
            <motion.div
              initial={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
              className="fixed inset-y-0 right-0 w-1/2 bg-gradient-to-l from-background to-card z-50"
            />
            {/* Center logo glow */}
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
