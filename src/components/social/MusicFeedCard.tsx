import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Play, 
  Pause,
  Music,
  Volume2,
  VolumeX,
  MoreHorizontal,
  UserPlus,
  Check,
  Disc3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SocialPostWithProfile, PostComment } from '@/types/social';
import { SONGS, ARTISTS } from '@/data/musicData';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import songArtVideo from '@/assets/song-art.mp4';

interface MusicFeedCardProps {
  post: SocialPostWithProfile;
  onLike: (postId: string) => void;
  onFollow: (userId: string) => void;
  isFollowing: boolean;
  onComment: () => void;
  isVisible?: boolean;
}

export function MusicFeedCard({ 
  post, 
  onLike, 
  onFollow, 
  isFollowing,
  onComment,
  isVisible = true
}: MusicFeedCardProps) {
  const { user } = useAuth();
  const { currentSong, isPlaying, playSong, pause, play } = usePlayer();
  const navigate = useNavigate();
  const [showHeart, setShowHeart] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const song = post.song_id ? SONGS.find(s => s.id === post.song_id) : null;
  const artist = song ? ARTISTS.find(a => a.id === song.artistId) : null;
  const isOwnPost = user?.id === post.user_id;
  const isThisSongPlaying = currentSong?.id === song?.id && isPlaying;

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible && isThisSongPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible, isThisSongPlaying]);

  const handleDoubleTap = () => {
    if (!post.is_liked) {
      onLike(post.id);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const handlePlayPause = () => {
    if (!song) return;
    
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      playSong(song);
    }
  };

  const goToProfile = () => {
    navigate(`/audience/${post.user_id}`);
  };

  return (
    <motion.div 
      className="relative w-full h-[calc(100vh-180px)] min-h-[500px] max-h-[800px] bg-card rounded-3xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Visual */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={handlePlayPause}
        onDoubleClick={handleDoubleTap}
      >
        {song ? (
          <div className="relative w-full h-full">
            <img 
              src={song.coverImage} 
              alt={song.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
            
            {/* Vinyl Animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-foreground/10 shadow-2xl"
                animate={isThisSongPlaying ? { rotate: 360 } : {}}
                transition={isThisSongPlaying ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
              >
                <video
                  ref={videoRef}
                  src={songArtVideo}
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Play/Pause Overlay */}
              <AnimatePresence>
                {!isThisSongPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-background to-primary/10 flex items-center justify-center">
            <Music className="w-24 h-24 text-primary/30" />
          </div>
        )}

        {/* Double Tap Heart Animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-32 h-32 text-red-500 fill-red-500 drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
        {/* Profile */}
        <div className="relative">
          <button onClick={goToProfile}>
            <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
              <AvatarImage src={post.profile?.profile_picture_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {post.profile?.profile_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </button>
          {!isOwnPost && (
            <button
              onClick={() => onFollow(post.user_id)}
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg ${
                isFollowing ? 'bg-muted' : 'bg-primary'
              }`}
            >
              {isFollowing ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Like */}
        <button 
          className="flex flex-col items-center gap-1"
          onClick={() => onLike(post.id)}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            post.is_liked ? 'bg-red-500/20' : 'bg-white/10 backdrop-blur-sm'
          }`}>
            <Heart className={`w-6 h-6 ${post.is_liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </div>
          <span className="text-xs text-white font-medium">{post.likes_count || 0}</span>
        </button>

        {/* Comment */}
        <button 
          className="flex flex-col items-center gap-1"
          onClick={onComment}
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white font-medium">{post.comments_count || 0}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white font-medium">Share</span>
        </button>

        {/* Disc Animation */}
        <motion.div
          animate={isThisSongPlaying ? { rotate: 360 } : {}}
          transition={isThisSongPlaying ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
          className="w-12 h-12 rounded-full border-2 border-white/50 overflow-hidden"
        >
          {song ? (
            <img src={song.coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-white" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-20 p-4">
        {/* User Info */}
        <button onClick={goToProfile} className="flex items-center gap-2 mb-3">
          <span className="font-bold text-white text-lg">
            @{post.profile?.profile_name || 'Anonymous'}
          </span>
          {isFollowing && (
            <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
              Following
            </span>
          )}
        </button>

        {/* Content */}
        {post.content && (
          <p className="text-white/90 text-sm mb-3 line-clamp-2">{post.content}</p>
        )}

        {/* Song Info */}
        {song && (
          <motion.div 
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full py-2 px-3 w-fit"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <Music className="w-4 h-4 text-white" />
            <div className="overflow-hidden max-w-[200px]">
              <motion.p 
                className="text-sm text-white font-medium whitespace-nowrap"
                animate={isThisSongPlaying ? { x: [-200, 0] } : {}}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              >
                {song.title} • {artist?.name}
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Timestamp */}
        <p className="text-white/50 text-xs mt-2">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  );
}
