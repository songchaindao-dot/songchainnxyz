import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Flame } from 'lucide-react';
import { usePopularProfiles } from '@/hooks/usePopularityRanking';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export const TrendingProfiles = memo(function TrendingProfiles() {
  const { data: profiles, isLoading } = usePopularProfiles(5);

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-6 shine-overlay">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return null;
  }

  return (
    <motion.div 
      className="glass-card rounded-3xl p-6 shine-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-heading font-semibold text-foreground">Trending People</h3>
      </div>

      <div className="space-y-3">
        {profiles.map((profile, index) => (
          <Link
            key={profile.profile_id}
            to={`/profile/${profile.user_id}`}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors group"
          >
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-background">
                <AvatarImage src={profile.profile_picture_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile.profile_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {index < 3 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">{index + 1}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {profile.profile_name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {profile.follower_count}
                </span>
                {profile.popularity_score > 0 && (
                  <span className="flex items-center gap-1 text-primary">
                    <Flame className="w-3 h-3" />
                    {profile.popularity_score}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
});
