import { motion } from 'framer-motion';
import { MapPin, Music } from 'lucide-react';
import { Artist, SONGS } from '@/data/musicData';
import { Link } from 'react-router-dom';

interface ArtistCardProps {
  artist: Artist;
  index?: number;
}

export function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  const artistSongs = SONGS.filter(s => s.artistId === artist.id);
  const totalPlays = artistSongs.reduce((sum, s) => sum + s.plays, 0);

  return (
    <Link to={`/artist/${artist.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ y: -6, scale: 1.02 }}
        className="group glass-card rounded-2xl overflow-hidden hover:shadow-float transition-all duration-300 shine-overlay"
      >
        <div className="aspect-square bg-secondary relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-20 group-hover:opacity-30 transition-opacity" />
          
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, hsl(217 91% 60% / 0.2) 0%, transparent 60%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-20 h-20 rounded-full glass flex items-center justify-center shadow-glow transition-all duration-300"
            >
              <span className="text-3xl font-heading font-bold text-foreground">
                {artist.name.charAt(0)}
              </span>
            </motion.div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-heading font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
            {artist.name}
          </h3>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{artist.location}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              <span>{artistSongs.length} songs</span>
            </div>
            <span className="tabular-nums">{totalPlays.toLocaleString()} plays</span>
          </div>

          <div className="mt-3 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs text-center truncate font-medium">
            {artist.townSquare}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}