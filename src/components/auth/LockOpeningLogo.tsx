import { motion } from 'framer-motion';
import logo from '@/assets/songchainn-logo.webp';

interface LockOpeningLogoProps {
  isOpening: boolean;
  onComplete?: () => void;
}

export function LockOpeningLogo({ isOpening, onComplete }: LockOpeningLogoProps) {
  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Glow effect behind logo */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isOpening ? {
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1.5, 2, 2.5],
          background: [
            'radial-gradient(circle, hsl(217 91% 60% / 0) 0%, transparent 70%)',
            'radial-gradient(circle, hsl(217 91% 60% / 0.6) 0%, transparent 70%)',
            'radial-gradient(circle, hsl(190 95% 60% / 0.4) 0%, transparent 70%)',
            'radial-gradient(circle, hsl(217 91% 60% / 0) 0%, transparent 70%)',
          ]
        } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* Lock mechanism - left part */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
        initial={{ x: 0, rotateY: 0 }}
        animate={isOpening ? {
          x: -40,
          rotateY: -30,
          opacity: [1, 1, 0],
        } : { x: 0, rotateY: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.3,
          ease: [0.32, 0, 0.67, 0]
        }}
      >
        <img
          src={logo}
          alt=""
          className="w-full h-full object-contain"
          style={{ filter: 'brightness(0.9)' }}
        />
      </motion.div>

      {/* Lock mechanism - right part */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
        initial={{ x: 0, rotateY: 0 }}
        animate={isOpening ? {
          x: 40,
          rotateY: 30,
          opacity: [1, 1, 0],
        } : { x: 0, rotateY: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.3,
          ease: [0.32, 0, 0.67, 0]
        }}
      >
        <img
          src={logo}
          alt=""
          className="w-full h-full object-contain"
          style={{ filter: 'brightness(0.9)' }}
        />
      </motion.div>

      {/* Center keyhole light burst */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={isOpening ? {
          opacity: [0, 1, 1, 0],
          scale: [0.5, 1, 3, 5],
        } : { opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
        onAnimationComplete={() => isOpening && onComplete?.()}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary blur-md" />
      </motion.div>

      {/* Shackle opening animation */}
      <motion.div
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-8"
        initial={{ y: 0, rotateX: 0 }}
        animate={isOpening ? {
          y: -20,
          rotateX: -90,
          opacity: 0,
        } : { y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      >
        <div className="w-full h-full border-4 border-primary rounded-t-full border-b-0" />
      </motion.div>

      {/* Particles explosion */}
      {isOpening && (
        <>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i * 30) * Math.PI / 180) * 100,
                y: Math.sin((i * 30) * Math.PI / 180) * 100,
                opacity: 0,
                scale: 0,
              }}
              transition={{ 
                duration: 0.8, 
                delay: 0.6 + (i * 0.02),
                ease: 'easeOut'
              }}
            />
          ))}
        </>
      )}

      {/* Static logo when not animating */}
      {!isOpening && (
        <motion.img
          src={logo}
          alt="$ongChainn"
          className="w-full h-full object-contain"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        />
      )}
    </div>
  );
}
