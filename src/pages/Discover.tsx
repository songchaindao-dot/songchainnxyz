import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, TrendingUp, Clock, Shuffle, Filter, Music2, Heart } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { SongCard } from '@/components/SongCard';
import { ArtistCard } from '@/components/ArtistCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SONGS, ARTISTS, Song } from '@/data/musicData';
import { useTrendingSongs, usePopularProfiles } from '@/hooks/usePopularityRanking';
import { useEngagement } from '@/context/EngagementContext';
import { usePlayerActions } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';
import type { Genre } from '@/audio/ImmersiveAudioEngine';
import { PullToRefresh } from '@/components/PullToRefresh';

// Genre configuration with colors and icons
const GENRES: { id: Genre | 'all'; label: string; color: string; description: string }[] = [
  { id: 'all', label: 'All Genres', color: 'bg-primary', description: 'Explore everything' },
  { id: 'afro', label: 'Afro', color: 'bg-amber-500', description: 'Deep rhythmic bass, warm immersive space' },
  { id: 'trap', label: 'Trap', color: 'bg-purple-500', description: 'Punchy low-end, aggressive width' },
  { id: 'dancehall', label: 'Dancehall', color: 'bg-green-500', description: 'Heavy low-end, forward vocals' },
  { id: 'kali-funk', label: 'Kali-Funk', color: 'bg-orange-500', description: 'Groove-focused bass, rhythmic bounce' },
  { id: 'kalind-rock', label: 'Kalind-Rock', color: 'bg-red-500', description: 'Gritty mids, wide live-stage feel' },
  { id: 'fusion', label: 'Fusion', color: 'bg-cyan-500', description: 'Adaptive spatial depth and clarity' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Discover() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'trending' | 'foryou' | 'new'>('trending');
  
  const { data: trendingSongs, isLoading: loadingTrending, refetch } = useTrendingSongs(20);
  const { data: popularProfiles } = usePopularProfiles(6);
  const { likedSongs } = useEngagement();
  const { playSong } = usePlayerActions();
  const queryClient = useQueryClient();

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['trending-songs'] });
    await queryClient.invalidateQueries({ queryKey: ['popular-profiles'] });
    await refetch();
  }, [queryClient, refetch]);

  // Filter songs by genre
  const filteredSongs = useMemo(() => {
    const songs = trendingSongs || SONGS;
    if (selectedGenre === 'all') return songs;
    return songs.filter(song => song.genre === selectedGenre);
  }, [trendingSongs, selectedGenre]);

  // Personalized "For You" recommendations based on liked songs
  const forYouSongs = useMemo(() => {
    // Get genres of liked songs
    const likedSongsArray = Array.from(likedSongs);
    const likedGenres = new Set(
      likedSongsArray
        .map(id => SONGS.find(s => s.id === id)?.genre)
        .filter(Boolean)
    );
    
    // If no likes, return trending
    if (likedGenres.size === 0) {
      return (trendingSongs || SONGS).slice(0, 10);
    }

    // Prioritize songs matching liked genres that aren't already liked
    const allSongs = trendingSongs || SONGS;
    const recommended = allSongs
      .filter(song => !likedSongs.has(song.id))
      .sort((a, b) => {
        const aMatch = likedGenres.has(a.genre) ? 1 : 0;
        const bMatch = likedGenres.has(b.genre) ? 1 : 0;
        return bMatch - aMatch;
      });

    return recommended.slice(0, 10);
  }, [trendingSongs, likedSongs]);

  // Recently added (simulated - last 3 songs by ID)
  const newSongs = useMemo(() => {
    return [...SONGS].reverse().slice(0, 5);
  }, []);

  // Get display songs based on active tab
  const displaySongs = useMemo(() => {
    switch (activeTab) {
      case 'foryou':
        return selectedGenre === 'all' 
          ? forYouSongs 
          : forYouSongs.filter(s => s.genre === selectedGenre);
      case 'new':
        return selectedGenre === 'all' 
          ? newSongs 
          : newSongs.filter(s => s.genre === selectedGenre);
      default:
        return filteredSongs;
    }
  }, [activeTab, filteredSongs, forYouSongs, newSongs, selectedGenre]);

  // Shuffle play
  const handleShufflePlay = () => {
    if (displaySongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * displaySongs.length);
      playSong(displaySongs[randomIndex]);
    }
  };

  // Artists filtered by genre (based on their songs)
  const filteredArtists = useMemo(() => {
    if (selectedGenre === 'all') return ARTISTS;
    
    const artistsWithGenre = ARTISTS.filter(artist => {
      const artistSongs = SONGS.filter(s => s.artistId === artist.id);
      return artistSongs.some(s => s.genre === selectedGenre);
    });
    
    return artistsWithGenre;
  }, [selectedGenre]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-[100dvh] bg-background pb-24 relative">
      <AnimatedBackground variant="default" />
      <Navigation />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-3xl glass-card p-8 shine-overlay">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] opacity-20">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                }}
                animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-medium text-primary mb-4">
                  <Compass className="w-4 h-4" />
                  <span>Discover Music</span>
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Explore <span className="text-gradient">SongChain</span>
                </h1>
                <p className="text-muted-foreground max-w-lg">
                  Discover trending tracks, personalized recommendations, and explore by genre with 
                  <span className="text-primary font-medium"> SongChain Immersive™</span> audio.
                </p>
              </div>

              <Button
                onClick={handleShufflePlay}
                className="gradient-primary shadow-glow self-start md:self-center"
                size="lg"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Shuffle Play
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Genre Filter */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold text-foreground">Filter by Genre</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <motion.button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  selectedGenre === genre.id
                    ? `${genre.color} text-white shadow-lg`
                    : "glass text-muted-foreground hover:text-foreground"
                )}
              >
                {genre.label}
              </motion.button>
            ))}
          </div>
          
          {selectedGenre !== 'all' && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-sm text-muted-foreground mt-3 flex items-center gap-2"
            >
              <Music2 className="w-4 h-4 text-primary" />
              {GENRES.find(g => g.id === selectedGenre)?.description}
            </motion.p>
          )}
        </motion.section>

        {/* Tabs */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex gap-2 p-1 rounded-2xl glass w-fit">
            <button
              onClick={() => setActiveTab('trending')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === 'trending'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Trending
            </button>
            <button
              onClick={() => setActiveTab('foryou')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === 'foryou'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-4 h-4" />
              For You
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === 'new'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-4 h-4" />
              New
            </button>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Songs List */}
          <motion.div
            className="lg:col-span-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                {activeTab === 'trending' && 'Trending Now'}
                {activeTab === 'foryou' && 'Recommended For You'}
                {activeTab === 'new' && 'Recently Added'}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {displaySongs.length} {displaySongs.length === 1 ? 'track' : 'tracks'}
              </Badge>
            </div>

            {loadingTrending && activeTab === 'trending' ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displaySongs.length > 0 ? (
              <motion.div className="space-y-2" variants={containerVariants}>
                <AnimatePresence mode="popLayout">
                  {displaySongs.map((song, index) => (
                    <motion.div
                      key={song.id}
                      variants={itemVariants}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <SongCard song={song} index={index} variant="compact" showRank={activeTab === 'trending'} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-12 glass-card rounded-3xl">
                <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tracks found for this genre</p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setSelectedGenre('all')}
                >
                  Show all genres
                </Button>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Your Taste Profile */}
            {likedSongs.size > 0 && (
              <div className="glass-card rounded-3xl p-6 shine-overlay">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Your Taste</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(
                    Array.from(likedSongs)
                      .map(id => SONGS.find(s => s.id === id)?.genre)
                      .filter((g): g is Genre => Boolean(g))
                  )).map(genre => (
                    <Badge 
                      key={genre} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSelectedGenre(genre)}
                    >
                      {GENRES.find(g => g.id === genre)?.label || genre}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Based on {likedSongs.size} liked {likedSongs.size === 1 ? 'song' : 'songs'}
                </p>
              </div>
            )}

            {/* Featured Artists */}
            <div className="glass-card rounded-3xl p-6 shine-overlay">
              <h3 className="font-heading font-semibold text-foreground mb-4">
                {selectedGenre === 'all' ? 'Featured Artists' : `${GENRES.find(g => g.id === selectedGenre)?.label} Artists`}
              </h3>
              {filteredArtists.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredArtists.slice(0, 4).map((artist, index) => (
                    <ArtistCard key={artist.id} artist={artist} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No artists found for this genre
                </p>
              )}
            </div>

            {/* Immersive Audio Info */}
            <div className="glass-card rounded-3xl p-6 shine-overlay">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h3 className="font-heading font-semibold text-foreground">SongChain Immersive™</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Every track is enhanced with genre-adaptive spatial audio, binaural processing, and mood-reactive dynamics.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Binaural 3D Spatialization</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Mood-Adaptive Processing</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Genre-Aware Sound Profiles</span>
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
