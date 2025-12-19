import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { SONGS, ARTISTS } from '@/data/musicData';
import { SongCard } from '@/components/SongCard';
import { ArtistCard } from '@/components/ArtistCard';
import { EngagementPanel } from '@/components/EngagementPanel';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function Home() {
  const featuredSongs = SONGS.slice(0, 3);
  const allSongs = SONGS;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-card to-secondary p-6 md:p-10">
            <div className="absolute inset-0 gradient-glow" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Early Access</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                Discover Curated Music from{' '}
                <span className="text-gradient">Livingstone Town Square</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-5 leading-relaxed">
                Stream original music from artists in the Create On Base pioneer chapter. 
                Your listening activity builds culture and unlocks future ownership.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground">
                <span>{ARTISTS.length} Artists</span>
                <span className="hidden sm:inline">•</span>
                <span>{SONGS.length} Songs</span>
                <span className="hidden sm:inline">•</span>
                <span>Zambia</span>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Featured Songs */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">Featured Tracks</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {featuredSongs.map((song, index) => (
                  <SongCard key={song.id} song={song} index={index} variant="featured" />
                ))}
              </div>
            </section>

            {/* All Songs */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-6">All Songs</h2>
              <div className="space-y-2">
                {allSongs.map((song, index) => (
                  <SongCard key={song.id} song={song} index={index} variant="compact" />
                ))}
              </div>
            </section>

            {/* Artists Preview */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Town Square Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ARTISTS.slice(0, 4).map((artist, index) => (
                  <ArtistCard key={artist.id} artist={artist} index={index} />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <EngagementPanel />

            {/* Phase Info */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-4">Phase One</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You're part of the early audience building listening culture. 
                Ownership, minting, and rewards activate in later phases.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Music Discovery</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Community Participation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <span className="text-muted-foreground/50">Ownership (Coming Soon)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <span className="text-muted-foreground/50">Rewards (Coming Soon)</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AudioPlayer />
    </div>
  );
}
