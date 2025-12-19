import { motion } from 'framer-motion';
import { Flame, Play, Heart, TrendingUp } from 'lucide-react';
import { useEngagement } from '@/context/EngagementContext';

export function EngagementPanel() {
  const { engagementPoints, currentStreak, totalPlays, likedSongs, getPointsBreakdown } = useEngagement();
  const breakdown = getPointsBreakdown();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 border border-border"
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-semibold text-foreground">Your Activity</h3>
      </div>

      {/* Total Points */}
      <div className="text-center mb-6 pb-6 border-b border-border">
        <p className="text-4xl font-heading font-bold text-gradient mb-1">
          {engagementPoints.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">Engagement Points</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">{totalPlays}</p>
          <p className="text-xs text-muted-foreground">Songs Played</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-pink-500/10 flex items-center justify-center mb-2">
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">{likedSongs.size}</p>
          <p className="text-xs text-muted-foreground">Liked Songs</p>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground mb-3">Points Breakdown</h4>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Listening</span>
          <span className="text-foreground">+{breakdown.listening}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Likes</span>
          <span className="text-foreground">+{breakdown.likes}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Streak Bonus</span>
          <span className="text-foreground">+{breakdown.streak}</span>
        </div>
      </div>

      {/* Unlock Message */}
      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-xs text-muted-foreground text-center">
          Audience activity here unlocks future access and ownership. Keep listening!
        </p>
      </div>
    </motion.div>
  );
}
