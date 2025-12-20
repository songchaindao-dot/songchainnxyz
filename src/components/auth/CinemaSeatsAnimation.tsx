import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CinemaSeatsAnimationProps {
  isActive: boolean;
  isComplete: boolean;
  onComplete?: () => void;
}

// Seat component
function Seat({ 
  row, 
  col, 
  isOccupied, 
  isUserSeat, 
  delay 
}: { 
  row: number; 
  col: number; 
  isOccupied: boolean; 
  isUserSeat: boolean;
  delay: number;
}) {
  const seatWidth = 28;
  const seatHeight = 24;
  const gap = 4;
  
  // Curve the rows like a real cinema
  const curveOffset = Math.abs(col - 3.5) * 2;
  const rowY = row * (seatHeight + gap * 2) + curveOffset;
  const colX = col * (seatWidth + gap);
  
  return (
    <motion.div
      className="absolute"
      style={{
        left: colX,
        top: rowY,
        width: seatWidth,
        height: seatHeight,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
      }}
      transition={{ delay: delay * 0.05, duration: 0.3 }}
    >
      {/* Seat back */}
      <motion.div
        className="absolute inset-0 rounded-t-md"
        style={{
          background: isUserSeat 
            ? 'linear-gradient(135deg, hsl(217 91% 50%), hsl(190 95% 50%))'
            : isOccupied 
              ? 'hsl(222 47% 20%)' 
              : 'hsl(222 47% 15%)',
          boxShadow: isUserSeat 
            ? '0 0 20px hsl(217 91% 60% / 0.5)' 
            : 'inset 0 -2px 4px hsl(222 47% 10%)',
        }}
        animate={isUserSeat ? {
          boxShadow: [
            '0 0 20px hsl(217 91% 60% / 0.3)',
            '0 0 40px hsl(217 91% 60% / 0.6)',
            '0 0 20px hsl(217 91% 60% / 0.3)',
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Shadow figure when occupied */}
      <AnimatePresence>
        {isOccupied && !isUserSeat && (
          <motion.div
            className="absolute -top-3 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: delay * 0.05 + 0.2, duration: 0.4 }}
          >
            {/* Head silhouette */}
            <div 
              className="w-4 h-4 rounded-full"
              style={{ background: 'hsl(222 47% 8%)' }}
            />
            {/* Shoulders */}
            <div 
              className="w-6 h-2 rounded-t-full -mt-1 mx-auto"
              style={{ 
                background: 'hsl(222 47% 8%)',
                marginLeft: '-4px'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* User seat glow indicator */}
      {isUserSeat && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-primary to-cyan-400 flex items-center justify-center">
            <span className="text-xs">👤</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function CinemaSeatsAnimation({ isActive, isComplete, onComplete }: CinemaSeatsAnimationProps) {
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set());
  const [userSeat, setUserSeat] = useState<string | null>(null);
  const [showScreen, setShowScreen] = useState(false);
  const [exitAnimation, setExitAnimation] = useState(false);
  
  const rows = 5;
  const cols = 8;
  const userSeatPosition = { row: 2, col: 4 }; // Center-ish seat for user
  
  useEffect(() => {
    if (!isActive) return;
    
    // Show screen first
    setTimeout(() => setShowScreen(true), 200);
    
    // Gradually fill seats with shadows
    const seats: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r !== userSeatPosition.row || c !== userSeatPosition.col) {
          seats.push(`${r}-${c}`);
        }
      }
    }
    
    // Shuffle seats for random fill effect
    const shuffled = seats.sort(() => Math.random() - 0.5);
    
    // Fill seats over time
    shuffled.forEach((seat, index) => {
      setTimeout(() => {
        setOccupiedSeats(prev => new Set([...prev, seat]));
      }, 500 + index * 80);
    });
    
    // Highlight user's seat last
    setTimeout(() => {
      setUserSeat(`${userSeatPosition.row}-${userSeatPosition.col}`);
    }, 500 + shuffled.length * 80 + 500);
    
  }, [isActive]);

  useEffect(() => {
    if (isComplete && userSeat) {
      // Trigger exit animation
      setTimeout(() => {
        setExitAnimation(true);
      }, 500);
      
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    }
  }, [isComplete, userSeat, onComplete]);

  if (!isActive) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: exitAnimation ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Cinema screen */}
      <motion.div
        className="relative mb-8"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ 
          opacity: showScreen ? 1 : 0, 
          scaleX: showScreen ? 1 : 0,
          y: exitAnimation ? -100 : 0,
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div 
          className="w-72 h-16 rounded-lg relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, hsl(222 47% 25%) 0%, hsl(222 47% 15%) 100%)',
            boxShadow: '0 10px 60px hsl(217 91% 60% / 0.3), inset 0 1px 1px hsl(210 40% 98% / 0.1)',
          }}
        >
          {/* Screen glow */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, hsl(217 91% 60% / 0.2) 0%, transparent 100%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* $ongChainn text on screen */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="font-heading text-lg font-bold text-gradient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              $ongChainn
            </motion.span>
          </div>
        </div>
        
        {/* Screen light projection */}
        <motion.div
          className="absolute top-full left-1/2 -translate-x-1/2 w-80 h-40"
          style={{
            background: 'linear-gradient(180deg, hsl(217 91% 60% / 0.1) 0%, transparent 100%)',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Cinema seats container */}
      <motion.div
        className="relative"
        style={{
          width: cols * 32,
          height: rows * 40,
        }}
        animate={{
          scale: exitAnimation ? 0.5 : 1,
          opacity: exitAnimation ? 0 : 1,
          y: exitAnimation ? 100 : 0,
        }}
        transition={{ duration: 0.6 }}
      >
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: cols }).map((_, col) => (
            <Seat
              key={`${row}-${col}`}
              row={row}
              col={col}
              isOccupied={occupiedSeats.has(`${row}-${col}`)}
              isUserSeat={userSeat === `${row}-${col}`}
              delay={row * cols + col}
            />
          ))
        )}
      </motion.div>

      {/* Text overlay */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: exitAnimation ? 0 : 1, 
          y: exitAnimation ? -20 : 0 
        }}
        transition={{ delay: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {!userSeat ? (
            <motion.p
              key="finding"
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Finding your seat...
            </motion.p>
          ) : !isComplete ? (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-foreground font-heading text-lg font-semibold mb-1">
                Your seat is ready!
              </p>
              <p className="text-primary text-sm">
                Preparing your experience...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="entering"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-foreground font-heading text-xl font-bold">
                Welcome to $ongChainn
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ambient particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            opacity: 0,
          }}
          animate={{
            y: -50,
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
        />
      ))}
    </motion.div>
  );
}
