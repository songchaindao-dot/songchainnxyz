import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Headphones, Users, ArrowRight } from 'lucide-react';
import { SONGS, ARTISTS } from '@/data/musicData';
import { useRankedSongs, useRankedArtists } from '@/hooks/usePopularity';
import { useAuth } from '@/context/AuthContext';
import { SongCard } from '@/components/SongCard';
import { ArtistCard } from '@/components/ArtistCard';
import { EngagementPanel } from '@/components/EngagementPanel';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { FeaturedTracksSection } from '@/components/FeaturedTracksSection';
import { NotificationBanner } from '@/components/NotificationBanner';
import { DownloadAppBanner } from '@/components/DownloadAppBanner';
import { LocationPrompt } from '@/components/LocationPrompt';
import { Button } from '@/components/ui/button';
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
  const { rankedSongs } = useRankedSongs();
  const { rankedArtists } = useRankedArtists();
  const { audienceProfile, refreshProfile } = useAuth();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  
  const featuredSongs = rankedSongs.slice(0, 3);
  const allSongs = rankedSongs;

  // Check if user needs to add location
  useEffect(() => {
    if (audienceProfile && !audienceProfile.location) {
      // Check if user has skipped recently (within last 24 hours)
      const skippedAt = localStorage.getItem('location_prompt_skipped');
      if (skippedAt) {
        const hoursSinceSkip = (Date.now() - parseInt(skippedAt)) / (1000 * 60 * 60);
        if (hoursSinceSkip < 24) {
          return; // Don't show again within 24 hours
        }
      }
      // Show prompt after a short delay
      const timer = setTimeout(() => setShowLocationPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [audienceProfile]);

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <AnimatedBackground variant="default" />
      <Navigation />
      <NotificationBanner />
      <DownloadAppBanner />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="mb-6 sm:mb-12"
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-card p-4 sm:p-8 md:p-12 shine-overlay">
            {/* Animated gradient orb - smaller on mobile */}
            <div className="absolute top-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] opacity-30">
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
                className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full glass text-xs font-medium text-primary mb-3 sm:mb-4"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Audience Edition</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-heading text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 leading-tight"
              >
                Discover Curated Music from{' '}
                <span className="text-gradient">Livingstone Town Square</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mb-4 sm:mb-6 leading-relaxed"
              >
                Stream original music from artists in the Create On Base pioneer chapter.
                Your listening activity builds culture and unlocks future ownership.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-2 sm:gap-4"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl glass text-xs sm:text-sm">
                  <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  <span className="text-foreground font-medium">{ARTISTS.length} Artists</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl glass text-xs sm:text-sm">
                  <span className="text-foreground font-medium">{SONGS.length} Songs</span>
                </div>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                  Zambia
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <motion.div
            className="lg:col-span-2 space-y-6 sm:space-y-12"
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
              <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">All Songs</h2>
              <div className="space-y-1 sm:space-y-2">
                {allSongs.map((song, index) => (
                  <SongCard key={song.id} song={song} index={index} variant="compact" />
                ))}
              </div>
            </motion.section>

            {/* Artists Preview - Ranked by popularity */}
            <motion.section variants={itemVariants}>
              <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">Top Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {rankedArtists.slice(0, 4).map((artist, index) => (
                  <ArtistCard key={artist.id} artist={artist} index={index} />
                ))}
              </div>
            </motion.section>

            {/* Discover Community Section */}
            <motion.section variants={itemVariants}>
              <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shine-overlay relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, transparent 70%)',
                      filter: 'blur(30px)',
                    }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 rounded-xl gradient-primary shadow-glow flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground text-base sm:text-lg mb-1">
                        Discover Community
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                        Connect with fellow music lovers, see who's listening, and build your network in the $ongChainn community.
                      </p>
                    </div>
                  </div>
                  <Link to="/community" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto gradient-primary text-primary-foreground shadow-glow gap-2">
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.section>
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <EngagementPanel />

            {/* Phase Info */}
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shine-overlay">
              <h3 className="font-heading font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Phase One</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                You're part of the early audience building listening culture.
                Ownership, minting, and rewards activate in later phases.
              </p>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full gradient-primary shadow-glow" />
                  <span className="text-foreground">Music Discovery</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full gradient-primary shadow-glow" />
                  <span className="text-foreground">Community Participation</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-muted" />
                  <span className="text-muted-foreground">Ownership (Coming Soon)</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-muted" />
                  <span className="text-muted-foreground">Rewards (Coming Soon)</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>

      <AudioPlayer />

      {/* Location Prompt for existing users */}
      <LocationPrompt
        isOpen={showLocationPrompt}
        onClose={() => setShowLocationPrompt(false)}
        onSuccess={() => {
          setShowLocationPrompt(false);
          refreshProfile();
        }}
      />
    </div>
  );
}