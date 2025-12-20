import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { immersiveEngine, AudioAnalysis } from '@/audio/ImmersiveAudioEngine';

interface ImmersiveVisualizerProps {
  isPlaying: boolean;
}

export const ImmersiveVisualizer = memo(function ImmersiveVisualizer({ isPlaying }: ImmersiveVisualizerProps) {
  const [analysis, setAnalysis] = useState<AudioAnalysis>({ bass: 0, mids: 0, highs: 0, energy: 0, tempo: 0 });

  useEffect(() => {
    if (!isPlaying) return;
    
    const unsubscribe = immersiveEngine.subscribeToAnalysis(setAnalysis);
    return unsubscribe;
  }, [isPlaying]);

  if (!isPlaying) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Bass pulse - outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 40%, hsl(var(--primary) / ${0.1 + analysis.bass * 0.15}) 70%, transparent 100%)`,
        }}
        animate={{
          scale: [1, 1 + analysis.bass * 0.08, 1],
          opacity: [0.3, 0.5 + analysis.bass * 0.3, 0.3],
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />

      {/* Mids glow - middle layer */}
      <motion.div
        className="absolute inset-[15%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / ${0.05 + analysis.mids * 0.1}) 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1 + analysis.mids * 0.05, 1],
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      />

      {/* Highs shimmer - inner sparkle */}
      <motion.div
        className="absolute inset-[30%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / ${0.1 + analysis.highs * 0.2}) 0%, transparent 50%)`,
          filter: `blur(${2 + analysis.highs * 4}px)`,
        }}
        animate={{
          opacity: [0.4, 0.7 + analysis.highs * 0.3, 0.4],
        }}
        transition={{ duration: 0.08, ease: 'linear' }}
      />

      {/* SongChain Immersive™ branding */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/20 backdrop-blur-sm"
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-foreground/60 font-medium tracking-wide">
            Immersive Sound
          </span>
        </motion.div>
      </div>
    </div>
  );
});
