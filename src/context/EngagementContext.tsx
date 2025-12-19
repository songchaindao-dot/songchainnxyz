import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface EngagementContextType {
  engagementPoints: number;
  currentStreak: number;
  todayPlays: number;
  totalPlays: number;
  likedSongs: Set<string>;
  addPlay: (songId: string) => void;
  toggleLike: (songId: string) => void;
  isLiked: (songId: string) => boolean;
  getPointsBreakdown: () => PointsBreakdown;
}

interface PointsBreakdown {
  listening: number;
  likes: number;
  streak: number;
  total: number;
}

const EngagementContext = createContext<EngagementContextType | undefined>(undefined);

const POINTS_PER_PLAY = 10;
const POINTS_PER_LIKE = 5;
const STREAK_BONUS = 25;

export function EngagementProvider({ children }: { children: ReactNode }) {
  const [engagementPoints, setEngagementPoints] = useState(() => {
    const saved = localStorage.getItem('songchainn_points');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [currentStreak, setCurrentStreak] = useState(() => {
    const saved = localStorage.getItem('songchainn_streak');
    return saved ? parseInt(saved, 10) : 1;
  });
  
  const [todayPlays, setTodayPlays] = useState(() => {
    const saved = localStorage.getItem('songchainn_today_plays');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [totalPlays, setTotalPlays] = useState(() => {
    const saved = localStorage.getItem('songchainn_total_plays');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [likedSongs, setLikedSongs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('songchainn_likes');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('songchainn_points', engagementPoints.toString());
  }, [engagementPoints]);

  useEffect(() => {
    localStorage.setItem('songchainn_streak', currentStreak.toString());
  }, [currentStreak]);

  useEffect(() => {
    localStorage.setItem('songchainn_today_plays', todayPlays.toString());
  }, [todayPlays]);

  useEffect(() => {
    localStorage.setItem('songchainn_total_plays', totalPlays.toString());
  }, [totalPlays]);

  useEffect(() => {
    localStorage.setItem('songchainn_likes', JSON.stringify([...likedSongs]));
  }, [likedSongs]);

  const addPlay = useCallback((songId: string) => {
    setTodayPlays(prev => prev + 1);
    setTotalPlays(prev => prev + 1);
    setEngagementPoints(prev => prev + POINTS_PER_PLAY);
  }, []);

  const toggleLike = useCallback((songId: string) => {
    setLikedSongs(prev => {
      const newLikes = new Set(prev);
      if (newLikes.has(songId)) {
        newLikes.delete(songId);
        setEngagementPoints(p => Math.max(0, p - POINTS_PER_LIKE));
      } else {
        newLikes.add(songId);
        setEngagementPoints(p => p + POINTS_PER_LIKE);
      }
      return newLikes;
    });
  }, []);

  const isLiked = useCallback((songId: string) => {
    return likedSongs.has(songId);
  }, [likedSongs]);

  const getPointsBreakdown = useCallback((): PointsBreakdown => {
    const listening = totalPlays * POINTS_PER_PLAY;
    const likes = likedSongs.size * POINTS_PER_LIKE;
    const streak = (currentStreak - 1) * STREAK_BONUS;
    return {
      listening,
      likes,
      streak,
      total: listening + likes + streak,
    };
  }, [totalPlays, likedSongs.size, currentStreak]);

  return (
    <EngagementContext.Provider value={{
      engagementPoints,
      currentStreak,
      todayPlays,
      totalPlays,
      likedSongs,
      addPlay,
      toggleLike,
      isLiked,
      getPointsBreakdown,
    }}>
      {children}
    </EngagementContext.Provider>
  );
}

export function useEngagement() {
  const context = useContext(EngagementContext);
  if (context === undefined) {
    throw new Error('useEngagement must be used within an EngagementProvider');
  }
  return context;
}
