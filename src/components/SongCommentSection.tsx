import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSongComments, SongComment } from '@/hooks/useSongComments';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SongCommentSectionProps {
  songId: string;
}

function CommentItem({ 
  comment, 
  onDelete,
  isOwn 
}: { 
  comment: SongComment; 
  onDelete: (id: string) => void;
  isOwn: boolean;
}) {
  const profile = comment.profile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 p-4 rounded-xl glass-card group"
    >
      <Link to={`/audience/${comment.user_id}`}>
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={profile?.profile_picture_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {profile?.profile_name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link 
            to={`/audience/${comment.user_id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {profile?.profile_name || 'Anonymous'}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>

      {isOwn && (
        <button
          onClick={() => onDelete(comment.id)}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/20 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </motion.div>
  );
}

export function SongCommentSection({ songId }: SongCommentSectionProps) {
  const { user } = useAuth();
  const { comments, isLoading, fetchComments, addComment, deleteComment } = useSongComments(songId);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Comments ({comments.length})
        </h2>
      </div>

      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this track..."
            className="flex-1"
            maxLength={500}
          />
          <Button 
            type="submit" 
            disabled={!newComment.trim() || isSubmitting}
            className="gap-2 gradient-primary"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Post</span>
          </Button>
        </form>
      ) : (
        <div className="glass-card p-4 rounded-xl mb-6 text-center">
          <p className="text-muted-foreground">Sign in to leave a comment</p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="glass-card p-8 rounded-xl text-center">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={deleteComment}
                isOwn={user?.id === comment.user_id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}