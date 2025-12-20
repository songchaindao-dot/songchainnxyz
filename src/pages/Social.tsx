import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, UserPlus, Headphones } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCard } from '@/components/social/PostCard';
import { UserCard } from '@/components/social/UserCard';
import { useSocial } from '@/hooks/useSocial';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AudienceProfile } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Social() {
  const { user } = useAuth();
  const {
    posts,
    isLoading,
    following,
    followers,
    createPost,
    deletePost,
    toggleLikePost,
    followUser,
    isFollowing,
    getPostComments,
    addComment,
    refetchPosts
  } = useSocial();

  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  const [suggestedUsers, setSuggestedUsers] = useState<AudienceProfile[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user) return;
      
      setLoadingSuggestions(true);
      const { data } = await supabase
        .from('audience_profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(10);

      if (data) {
        const notFollowing = data.filter(
          p => !following.includes(p.user_id)
        ) as AudienceProfile[];
        setSuggestedUsers(notFollowing.slice(0, 5));
      }
      setLoadingSuggestions(false);
    };

    fetchSuggestedUsers();
  }, [user, following]);

  useEffect(() => {
    refetchPosts(feedType);
  }, [feedType]);

  const filteredPosts = feedType === 'following' 
    ? posts.filter(p => following.includes(p.user_id) || p.user_id === user?.id)
    : posts;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Social</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{followers.length} followers</span>
              <span>·</span>
              <span>{following.length} following</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Composer */}
            <PostComposer onPost={createPost} />

            {/* Feed Tabs */}
            <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'all' | 'following')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Discover
                </TabsTrigger>
                <TabsTrigger value="following" className="gap-2">
                  <Users className="w-4 h-4" />
                  Following
                </TabsTrigger>
              </TabsList>

              <TabsContent value={feedType} className="mt-6 space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">
                      {feedType === 'following' ? 'No posts from people you follow' : 'No posts yet'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {feedType === 'following' 
                        ? 'Follow some people to see their posts here'
                        : 'Be the first to share something!'}
                    </p>
                    {feedType === 'following' && (
                      <Button onClick={() => setFeedType('all')}>
                        Discover People
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  filteredPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={toggleLikePost}
                      onDelete={deletePost}
                      onFollow={followUser}
                      isFollowing={isFollowing(post.user_id)}
                      onGetComments={getPostComments}
                      onAddComment={addComment}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Suggested Users */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Suggested for You</h3>
              </div>
              
              {loadingSuggestions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : suggestedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No suggestions right now
                </p>
              ) : (
                <div className="space-y-3">
                  {suggestedUsers.map(profile => (
                    <UserCard
                      key={profile.id}
                      profile={profile}
                      isFollowing={isFollowing(profile.user_id)}
                      onFollow={followUser}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-4">Your Activity</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{posts.filter(p => p.user_id === user?.id).length}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{following.length}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
