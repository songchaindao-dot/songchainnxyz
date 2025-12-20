import { motion } from 'framer-motion';
import { Sparkles, Headphones } from 'lucide-react';
import { SONGS, ARTISTS } from '@/data/musicData';
import { SongCard } from '@/components/SongCard';
import { ArtistCard } from '@/components/ArtistCard';
import { EngagementPanel } from '@/components/EngagementPanel';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { FeaturedTracksSection } from '@/components/FeaturedTracksSection';
import { NotificationBanner } from '@/components/NotificationBanner';
import { DownloadAppBanner } from '@/components/DownloadAppBanner';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const featuredSongs = SONGS.slice(0, 3);
  const allSongs = SONGS;

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <AnimatedBackground variant="default" />
      <Navigation />
      <NotificationBanner />
      <DownloadAppBanner />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-12 shine-overlay">
            {/* Animated gradient orb */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-30">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, hsl(217 91% 60% / 0.4) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  x: [0, 30, 0],
                  y: [0, -20, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-medium text-primary mb-4"
              >
                <Sparkles className="w-4 h-4" />
                <span>Audience Edition</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight"
              >
                Discover Curated Music from{' '}
                <span className="text-gradient">Livingstone Town Square</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base md:text-lg text-muted-foreground max-w-2xl mb-6 leading-relaxed"
              >
                Stream original music from artists in the Create On Base pioneer chapter.
                Your listening activity builds culture and unlocks future ownership.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-4"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm">
                  <Headphones className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">{ARTISTS.length} Artists</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm">
                  <span className="text-foreground font-medium">{SONGS.length} Songs</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                  Zambia
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            className="lg:col-span-2 space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Featured Songs */}
            <motion.section variants={itemVariants}>
              <FeaturedTracksSection songs={featuredSongs} />
            </motion.section>

            {/* All Songs */}
            <motion.section variants={itemVariants}>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-6">All Songs</h2>
              <div className="space-y-2">
                {allSongs.map((song, index) => (
                  <SongCard key={song.id} song={song} index={index} variant="compact" />
                ))}
              </div>
            </motion.section>

            {/* Artists Preview */}
            <motion.section variants={itemVariants}>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-6">Town Square Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ARTISTS.slice(0, 4).map((artist, index) => (
                  <ArtistCard key={artist.id} artist={artist} index={index} />
                ))}
              </div>
            </motion.section>
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <EngagementPanel />

            {/* Phase Info */}
            <div className="glass-card rounded-3xl p-6 shine-overlay">
              <h3 className="font-heading font-semibold text-foreground mb-4">Phase One</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                You're part of the early audience building listening culture.
                Ownership, minting, and rewards activate in later phases.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full gradient-primary shadow-glow" />
                  <span className="text-foreground">Music Discovery</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full gradient-primary shadow-glow" />
                  <span className="text-foreground">Community Participation</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <span className="text-muted-foreground">Ownership (Coming Soon)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <span className="text-muted-foreground">Rewards (Coming Soon)</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>

      <AudioPlayer />
    </div>
  );
}