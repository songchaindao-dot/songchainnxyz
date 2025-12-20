import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import songArtVideo from '@/assets/song-art.mp4';

interface SpinningSongArtProps {
  isPlaying?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
  xl: 'w-full h-full',
};

export function SpinningSongArt({ isPlaying = false, size = 'md', className }: SpinningSongArtProps) {
  return (
    <motion.div
      className={cn(
        'rounded-xl overflow-hidden flex-shrink-0',
        sizeClasses[size],
        className
      )}
      animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
      transition={isPlaying ? { duration: 8, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
    >
      <video
        src={songArtVideo}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ 
          animationPlayState: isPlaying ? 'running' : 'paused',
        }}
      />
    </motion.div>
  );
}
