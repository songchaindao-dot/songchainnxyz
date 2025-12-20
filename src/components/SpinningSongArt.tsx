import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import songArtVideo from '@/assets/song-art.mp4';

interface SongArtProps {
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

export function SpinningSongArt({ isPlaying = false, size = 'md', className }: SongArtProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden flex-shrink-0',
        sizeClasses[size],
        className
      )}
    >
      <video
        ref={videoRef}
        src={songArtVideo}
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}
