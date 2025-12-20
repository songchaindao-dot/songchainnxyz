import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Headphones, TrendingUp, Flame } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { SONGS, ARTISTS } from '@/data/musicData';
import { SongCard } from '@/components/SongCard';
import { ArtistCard } from '@/components/ArtistCard';
import { EngagementPanel } from '@/components/EngagementPanel';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { FeaturedTracksSection } from '@/components/FeaturedTracksSection';
import { TrendingProfiles } from '@/components/TrendingProfiles';
import { usePlayerActions } from '@/context/PlayerContext';
import { NotificationPromptBanner } from '@/components/NotificationPromptBanner';
import { useTrendingSongs, useTrackSongEvent } from '@/hooks/usePopularityRanking';
import { PullToRefresh } from '@/components/PullToRefresh';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { playSong } = usePlayerActions();
  const { data: trendingSongs, refetch } = useTrendingSongs(10);
  const trackEvent = useTrackSongEvent();
  const queryClient = useQueryClient();
  
  // Use trending songs if available, otherwise fall back to static data
  const featuredSongs = trendingSongs?.slice(0, 3) || SONGS.slice(0, 3);
  const allSongs = trendingSongs || SONGS;

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['trending-songs'] });
    await queryClient.invalidateQueries({ queryKey: ['popular-profiles'] });
    await refetch();
  }, [queryClient, refetch]);

  // Handle deep link for shared songs
  useEffect(() => {
    const songId = searchParams.get('song');
    if (songId) {
      const song = SONGS.find(s => s.id === songId);
      if (song) {
        playSong(song);
        // Clear the URL param after playing
        setSearchParams({});
      }
    }
  }, [searchParams, playSong, setSearchParams]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-[100dvh] bg-background pb-24 relative">
      <AnimatedBackground variant="default" />
      <Navigation />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Notification Prompt Banner */}
        <NotificationPromptBanner />

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
            {/* Featured Songs - Top Trending */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Trending Now</span>
              </div>
              <FeaturedTracksSection songs={featuredSongs} />
            </motion.section>

            {/* All Songs - Ranked by Popularity */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-2xl font-semibold text-foreground">Top Charts</h2>
              </div>
              <div className="space-y-2">
                {allSongs.map((song, index) => (
                  <SongCard key={song.id} song={song} index={index} variant="compact" showRank />
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
            
            {/* Trending Profiles */}
            <TrendingProfiles />

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
    </PullToRefresh>
  );
}