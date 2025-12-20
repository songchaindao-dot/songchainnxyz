import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  variant?: 'default' | 'subtle' | 'intense';
  className?: string;
}

export function AnimatedBackground({ variant = 'default', className = '' }: AnimatedBackgroundProps) {
  const intensity = {
    default: { blur: 100, opacity: 0.15 },
    subtle: { blur: 150, opacity: 0.08 },
    intense: { blur: 80, opacity: 0.2 },
  };

  const config = intensity[variant];

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Primary ambient orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(217 91% 60% / 0.3) 0%, transparent 70%)',
          filter: `blur(${config.blur}px)`,
          opacity: config.opacity,
        }}
        animate={{
          x: ['-10%', '5%', '-5%', '-10%'],
          y: ['-10%', '10%', '-5%', '-10%'],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ left: '10%', top: '10%' }}
      />

      {/* Secondary cyan orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(190 95% 60% / 0.25) 0%, transparent 70%)',
          filter: `blur(${config.blur}px)`,
          opacity: config.opacity,
        }}
        animate={{
          x: ['10%', '-10%', '5%', '10%'],
          y: ['10%', '-5%', '15%', '10%'],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ right: '10%', bottom: '20%' }}
      />

      {/* Tertiary subtle glow */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(217 91% 50% / 0.15) 0%, transparent 70%)',
          filter: `blur(${config.blur + 20}px)`,
          opacity: config.opacity * 0.7,
        }}
        animate={{
          x: ['-5%', '8%', '-3%', '-5%'],
          y: ['5%', '-8%', '10%', '5%'],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}