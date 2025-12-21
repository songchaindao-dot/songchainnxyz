import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, Heart, Share2, Copy, Check, Music, Headphones, Users } from 'lucide-react';
import { SONGS, ARTISTS } from '@/data/musicData';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Button } from '@/components/ui/button';
import { usePlayerState, usePlayerActions } from '@/context/PlayerContext';
import { useEngagement } from '@/context/EngagementContext';
import { useSongPopularity } from '@/hooks/usePopularity';
import { useShare } from '@/hooks/useShare';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SongCard } from '@/components/SongCard';
import { useMemo } from 'react';

export default function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentSong, isPlaying } = usePlayerState();
  const { playSong, togglePlay } = usePlayerActions();
  const { toggleLike, isLiked } = useEngagement();
  const { data: popularityData } = useSongPopularity();
  const { shareSong, copyToClipboard, getShareUrl, shareToX, copied } = useShare();

  const song = SONGS.find(s => s.id === id);
  const artist = song ? ARTISTS.find(a => a.id === song.artistId) : null;
  const isCurrentSong = currentSong?.id === song?.id;
  const liked = song ? isLiked(song.id) : false;

  // Get real stats from database
  const songStats = useMemo(() => {
    if (!song) return { plays: 0, likes: 0 };
    const data = popularityData?.find(p => p.song_id === song.id);
    return {
      plays: data?.play_count || 0,
      likes: data?.like_count || 0,
    };
  }, [popularityData, song]);

  // Get more songs from same artist
  const moreSongs = useMemo(() => {
    if (!song) return [];
    return SONGS.filter(s => s.artistId === song.artistId && s.id !== song.id).slice(0, 4);
  }, [song]);

  if (!song || !artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-3">Song Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find this song. It may have been removed or the link might be incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">Browse Music</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/artists">View Artists</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  const handleShare = () => shareSong(song.title, song.artist, song.id);
  const handleCopyLink = () => copyToClipboard(getShareUrl('song', song.id));
  const handleShareToX = () => shareToX(`Check out "${song.title}" by ${song.artist} on $ongChainn!`, getShareUrl('song', song.id));

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        {/* Song Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Cover Art */}
            <div className="w-64 h-64 md:w-72 md:h-72 rounded-2xl bg-secondary overflow-hidden flex-shrink-0 shadow-float">
              {song.coverImage ? (
                <img 
                  src={song.coverImage} 
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full gradient-primary opacity-40 flex items-center justify-center">
                  <Music className="w-20 h-20 text-foreground/50" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Song</p>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
                {song.title}
              </h1>
              
              <Link 
                to={`/artist/${artist.id}`}
                className="inline-flex items-center gap-3 mb-6 group"
              >
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                  {artist.profileImage ? (
                    <img src={artist.profileImage} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-primary opacity-40 flex items-center justify-center">
                      <span className="text-sm font-bold">{artist.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <span className="text-lg text-foreground group-hover:text-primary transition-colors">
                  {artist.name}
                </span>
              </Link>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Headphones className="w-5 h-5" />
                  <span className="text-lg font-medium">{songStats.plays.toLocaleString()} streams</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="w-5 h-5" />
                  <span className="text-lg font-medium">{songStats.likes.toLocaleString()} likes</span>
                </div>
              </div>

              {/* Genre Badge */}
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="text-sm text-primary font-medium">{song.genre}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={handlePlay}
                  size="lg"
                  className="gap-2 gradient-primary shadow-glow"
                >
                  {isCurrentSong && isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 ml-0.5" />
                      Play
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => toggleLike(song.id)}
                  variant={liked ? "default" : "outline"}
                  size="lg"
                  className={cn("gap-2", liked && "bg-primary/20 text-primary border-primary/30")}
                >
                  <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                  {liked ? 'Liked' : 'Like'}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2">
                      <Share2 className="w-5 h-5" />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={handleShare} className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareToX} className="gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Share on X
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.section>

        {/* More from Artist */}
        {moreSongs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                More from {artist.name}
              </h2>
              <Link 
                to={`/artist/${artist.id}`}
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {moreSongs.map((s, index) => (
                <SongCard key={s.id} song={s} index={index} />
              ))}
            </div>
          </section>
        )}
      </main>

      <AudioPlayer />
    </div>
  );
}