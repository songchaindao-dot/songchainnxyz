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
        transition={{ delay: index * 0.1 }}
        className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all"
      >
        <div className="aspect-square bg-secondary relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-3xl font-heading font-bold text-foreground">
                {artist.name.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-heading font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
            {artist.name}
          </h3>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="w-3 h-3" />
            <span>{artist.location}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              <span>{artistSongs.length} songs</span>
            </div>
            <span>{totalPlays.toLocaleString()} plays</span>
          </div>

          <div className="mt-3 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs text-center truncate">
            {artist.townSquare}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
