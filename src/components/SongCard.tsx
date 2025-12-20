import { motion } from 'framer-motion';
import { Play, Pause, Heart, Sparkles } from 'lucide-react';
import { Song } from '@/data/musicData';
import { usePlayer } from '@/context/PlayerContext';
import { useEngagement } from '@/context/EngagementContext';
import { cn } from '@/lib/utils';
import { SpinningSongArt } from './SpinningSongArt';
import { AIArtwork } from './AIArtwork';

interface SongCardProps {
  song: Song;
  index?: number;
  variant?: 'default' | 'compact' | 'featured';
}

export function SongCard({ song, index = 0, variant = 'default' }: SongCardProps) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { toggleLike, isLiked } = useEngagement();

  const isCurrentSong = currentSong?.id === song.id;
  const liked = isLiked(song.id);

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ scale: 1.01, x: 4 }}
        className={cn(
          "group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer",
          isCurrentSong
            ? "glass-card border-primary/30"
            : "hover:bg-secondary/30"
        )}
        onClick={handlePlay}
      >
        <div className="relative w-14 h-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden shadow-soft shine-overlay">
          {isCurrentSong ? (
            <SpinningSongArt isPlaying={isPlaying} size="lg" />
          ) : (
            <>
              {song.coverImage ? (
                <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary opacity-60" />
              )}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
              >
                <Play className="w-5 h-5 text-foreground ml-0.5" />
              </motion.div>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate text-base",
            isCurrentSong ? "text-primary" : "text-foreground"
          )}>
            {song.title}
          </p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
            {song.plays.toLocaleString()} plays
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(song.id);
            }}
            className={cn(
              "p-2 rounded-full transition-all",
              liked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ y: -4, scale: 1.02 }}
        className="group relative overflow-hidden rounded-2xl glass-card cursor-pointer shine-overlay"
        onClick={handlePlay}
      >
        {/* Ambient glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 gradient-glow" />
        </div>

        {/* AI Artwork section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {isCurrentSong ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-cyan-400/10">
              <SpinningSongArt isPlaying={isPlaying} size="xl" />
            </div>
          ) : (
            <AIArtwork
              songTitle={song.title}
              artistName={song.artist}
              fallbackImage={song.coverImage}
              className="w-full h-full rounded-none"
              showGenerateButton={true}
            />
          )}
          
          {/* Play button overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity"
            initial={false}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow-intense"
            >
              {isCurrentSong && isPlaying ? (
                <Pause className="w-6 h-6 text-primary-foreground" />
              ) : (
                <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
              )}
            </motion.div>
          </motion.div>
        </div>

        <div className="relative z-10 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-heading font-semibold text-foreground truncate">
                {song.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(song.id);
              }}
              className={cn(
                "p-2 rounded-xl transition-all flex-shrink-0",
                liked ? "bg-primary/20 text-primary" : "glass text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
            </motion.button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="tabular-nums">{song.plays.toLocaleString()} plays</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="tabular-nums">{song.likes.toLocaleString()} likes</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -6 }}
      className="group relative glass-card rounded-2xl overflow-hidden hover:shadow-float transition-all duration-300 cursor-pointer shine-overlay"
      onClick={handlePlay}
    >
      <div className="aspect-square bg-secondary relative overflow-hidden">
        {isCurrentSong ? (
          <SpinningSongArt isPlaying={isPlaying} size="xl" className="rounded-none" />
        ) : (
          <>
            {song.coverImage ? (
              <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 gradient-primary opacity-40" />
            )}
          </>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              isCurrentSong && isPlaying
                ? "gradient-primary shadow-glow-intense scale-100 opacity-100"
                : "glass opacity-0 group-hover:opacity-100"
            )}
          >
            {isCurrentSong && isPlaying ? (
              <Pause className="w-7 h-7 text-primary-foreground" />
            ) : (
              <Play className="w-7 h-7 text-foreground ml-1" />
            )}
          </motion.div>
        </div>
      </div>

      <div className="p-4">
        <h3 className={cn(
          "font-heading font-semibold truncate mb-1 text-base",
          isCurrentSong ? "text-primary" : "text-foreground"
        )}>
          {song.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate mb-3">{song.artist}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">
            {song.plays.toLocaleString()} plays
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(song.id);
            }}
            className={cn(
              "p-2 rounded-full transition-all -mr-2",
              liked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}