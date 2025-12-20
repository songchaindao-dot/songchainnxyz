import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostComment } from '@/types/social';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: PostComment[];
  isLoading: boolean;
  onAddComment: (content: string) => void;
  commentsCount: number;
}

export function CommentSheet({ 
  isOpen, 
  onClose, 
  comments, 
  isLoading, 
  onAddComment,
  commentsCount 
}: CommentSheetProps) {
  const [newComment, setNewComment] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
  };

  const goToProfile = (userId: string) => {
    onClose();
    navigate(`/audience/${userId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 h-[70vh] bg-background rounded-t-3xl z-50 flex flex-col"
          >
            {/* Handle */}
            <div className="flex items-center justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <h3 className="font-bold text-lg">{commentsCount} Comments</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Comments List */}
            <ScrollArea className="flex-1 px-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No comments yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Be the first to comment!</p>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <button onClick={() => goToProfile(comment.user_id)}>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={comment.profile?.profile_picture_url || ''} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {comment.profile?.profile_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <button 
                              onClick={() => goToProfile(comment.user_id)}
                              className="font-semibold text-sm hover:underline"
                            >
                              {comment.profile?.profile_name || 'Anonymous'}
                            </button>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: 'More Options', description: 'Comment options coming soon.' })}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-foreground/90 mt-1">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button 
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => toast({ title: 'Liked!', description: 'Comment likes coming soon.' })}
                          >
                            <Heart className="w-4 h-4" />
                            <span className="text-xs">Like</span>
                          </button>
                          <button 
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => toast({ title: 'Reply', description: 'Comment replies coming soon.' })}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="flex-1 h-11 rounded-full bg-muted border-0"
                />
                <Button 
                  size="icon" 
                  className="h-11 w-11 rounded-full"
                  onClick={handleSubmit}
                  disabled={!newComment.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
