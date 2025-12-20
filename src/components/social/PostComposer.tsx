import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Music, ListMusic, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SONGS, ARTISTS } from '@/data/musicData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PostComposerProps {
  onPost: (content: string, type: 'text' | 'song_share', songId?: string) => void;
}

export function PostComposer({ onPost }: PostComposerProps) {
  const { audienceProfile } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'song_share'>('text');
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!content.trim() && postType === 'text') return;
    if (postType === 'song_share' && !selectedSong) return;

    setIsPosting(true);
    await onPost(content, postType, postType === 'song_share' ? selectedSong : undefined);
    setContent('');
    setSelectedSong('');
    setPostType('text');
    setIsPosting(false);
  };

  const getArtistName = (artistId: string) => {
    return ARTISTS.find(a => a.id === artistId)?.name || 'Unknown Artist';
  };

  const songs = SONGS;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {audienceProfile?.profile_picture_url ? (
            <img 
              src={audienceProfile.profile_picture_url} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary font-bold">
              {audienceProfile?.profile_name?.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Share what you're listening to..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none bg-background/50 border-border/50"
          />
          
          {postType === 'song_share' && (
            <Select value={selectedSong} onValueChange={setSelectedSong}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select a song to share" />
              </SelectTrigger>
              <SelectContent>
                {songs.map(song => (
                  <SelectItem key={song.id} value={song.id}>
                    {song.title} - {getArtistName(song.artistId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div className="flex gap-2">
          <Button
            variant={postType === 'text' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPostType('text')}
            className="gap-1"
          >
            <ListMusic className="w-4 h-4" />
            Text
          </Button>
          <Button
            variant={postType === 'song_share' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPostType('song_share')}
            className="gap-1"
          >
            <Music className="w-4 h-4" />
            Share Song
          </Button>
        </div>
        <Button 
          onClick={handlePost} 
          disabled={isPosting || (!content.trim() && postType === 'text') || (postType === 'song_share' && !selectedSong)}
          size="sm"
          className="gap-1"
        >
          <Send className="w-4 h-4" />
          Post
        </Button>
      </div>
    </div>
  );
}
