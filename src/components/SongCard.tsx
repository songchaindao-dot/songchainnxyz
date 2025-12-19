import { motion } from 'framer-motion';
import { Play, Pause, Heart } from 'lucide-react';
import { Song } from '@/data/musicData';
import { usePlayer } from '@/context/PlayerContext';
import { useEngagement } from '@/context/EngagementContext';
import { cn } from '@/lib/utils';

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
        transition={{ delay: index * 0.05 }}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
          isCurrentSong ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/50"
        )}
        onClick={handlePlay}
      >
        <div className="relative w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {song.coverImage ? (
            <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-primary opacity-60" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity">
            {isCurrentSong && isPlaying ? (
              <Pause className="w-5 h-5 text-foreground" />
            ) : (
              <Play className="w-5 h-5 text-foreground ml-0.5" />
            )}
          </div>
          {isCurrentSong && isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    animate={{ height: ['40%', '100%', '40%'] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            isCurrentSong ? "text-primary" : "text-foreground"
          )}>
            {song.title}
          </p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{song.plays.toLocaleString()} plays</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(song.id);
            }}
            className={cn(
              "p-2 rounded-full transition-colors",
              liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          </button>
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-secondary to-card p-5 cursor-pointer"
        onClick={handlePlay}
      >
        <div className="absolute inset-0 gradient-glow opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
              <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(song.id);
              }}
              className={cn(
                "p-2.5 rounded-full transition-all flex-shrink-0",
                liked ? "bg-primary/20 text-primary" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
            </button>
          </div>

          <h3 className="text-base font-heading font-semibold text-foreground mb-1 truncate">{song.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 truncate">{song.artist}</p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{song.plays.toLocaleString()} plays</span>
            <span>•</span>
            <span>{song.likes.toLocaleString()} likes</span>
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
      transition={{ delay: index * 0.05 }}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all cursor-pointer"
      onClick={handlePlay}
    >
      <div className="aspect-square bg-secondary relative overflow-hidden">
        {song.coverImage ? (
          <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 gradient-primary opacity-40" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all",
              isCurrentSong && isPlaying ? "gradient-primary shadow-glow" : "bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100"
            )}
          >
            {isCurrentSong && isPlaying ? (
              <Pause className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Play className="w-6 h-6 text-foreground ml-1" />
            )}
          </motion.div>
        </div>
      </div>

      <div className="p-4">
        <h3 className={cn(
          "font-heading font-semibold truncate mb-1",
          isCurrentSong ? "text-primary" : "text-foreground"
        )}>
          {song.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate mb-3">{song.artist}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{song.plays.toLocaleString()} plays</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(song.id);
            }}
            className={cn(
              "p-2 rounded-full transition-colors -mr-2",
              liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
