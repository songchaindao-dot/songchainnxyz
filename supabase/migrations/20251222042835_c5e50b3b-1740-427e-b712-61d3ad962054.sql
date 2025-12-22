-- Drop and recreate song_popularity view to count likes from song_analytics
DROP VIEW IF EXISTS public.song_popularity;

CREATE OR REPLACE VIEW public.song_popularity AS
SELECT 
    all_songs.song_id,
    COALESCE(p.plays, 0) AS play_count,
    COALESCE(s.shares, 0) AS share_count,
    COALESCE(v.views, 0) AS view_count,
    -- Count likes from both liked_songs table AND song_analytics like events
    COALESCE(l_table.likes, 0) + COALESCE(l_analytics.likes, 0) AS like_count,
    COALESCE(c.comments, 0) AS comment_count,
    (COALESCE(p.plays, 0) * 3 + 
     (COALESCE(l_table.likes, 0) + COALESCE(l_analytics.likes, 0)) * 5 + 
     COALESCE(c.comments, 0) * 4 + 
     COALESCE(s.shares, 0) * 6 + 
     COALESCE(v.views, 0) * 1) AS popularity_score
FROM (
    SELECT DISTINCT song_id FROM song_analytics
    UNION
    SELECT DISTINCT song_id FROM liked_songs
    UNION
    SELECT DISTINCT song_id FROM song_comments
) all_songs
LEFT JOIN (
    SELECT song_id, COUNT(*) AS plays
    FROM song_analytics
    WHERE event_type = 'play'
    GROUP BY song_id
) p USING (song_id)
LEFT JOIN (
    SELECT song_id, COUNT(*) AS shares
    FROM song_analytics
    WHERE event_type = 'share'
    GROUP BY song_id
) s USING (song_id)
LEFT JOIN (
    SELECT song_id, COUNT(*) AS views
    FROM song_analytics
    WHERE event_type = 'view'
    GROUP BY song_id
) v USING (song_id)
LEFT JOIN (
    SELECT song_id, COUNT(*) AS likes
    FROM liked_songs
    GROUP BY song_id
) l_table USING (song_id)
LEFT JOIN (
    SELECT song_id, COUNT(*) AS likes
    FROM song_analytics
    WHERE event_type = 'like'
    GROUP BY song_id
) l_analytics USING (song_id)
LEFT JOIN (
    SELECT song_id, COUNT(*) AS comments
    FROM song_comments
    GROUP BY song_id
) c USING (song_id);