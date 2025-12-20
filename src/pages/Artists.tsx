import { motion } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';
import { ARTISTS, TOWN_SQUARES } from '@/data/musicData';
import { ArtistCard } from '@/components/ArtistCard';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function Artists() {
  const townSquare = TOWN_SQUARES[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Town Square Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-secondary p-8">
            <div className="absolute inset-0 gradient-glow opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">{townSquare.location}</span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                {townSquare.name}
              </h1>
              <p className="text-muted-foreground mb-4">{townSquare.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{townSquare.artistCount} Artists</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Artist Grid */}
        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
            Featured Artists
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ARTISTS.map((artist, index) => (
              <ArtistCard key={artist.id} artist={artist} index={index} />
            ))}
          </div>
        </section>

        {/* Quality Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 rounded-2xl bg-card border border-border text-center"
        >
          <p className="text-sm text-muted-foreground">
            All music on SongChainn is curated for quality, originality, and cultural value. 
            Only artists who are part of Create On Base Town Squares can be featured.
          </p>
        </motion.div>
      </main>

      <AudioPlayer />
    </div>
  );
}
