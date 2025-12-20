import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Referral {
  id: string;
  referral_code: string;
  referred_user_id: string | null;
  points_earned: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface UserPoints {
  total_points: number;
}

export function useReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate a unique referral code
  const generateReferralCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SC-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  // Fetch user's referral code or create one
  const fetchOrCreateReferralCode = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user already has a referral code
      const { data: existingReferral, error: fetchError } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', user.id)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching referral:', fetchError);
        return;
      }

      if (existingReferral) {
        setReferralCode(existingReferral.referral_code);
      } else {
        // Create a new referral code
        const newCode = generateReferralCode();
        const { error: insertError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: user.id,
            referral_code: newCode,
          });

        if (insertError) {
          // If duplicate, try again with new code
          if (insertError.code === '23505') {
            const retryCode = generateReferralCode();
            await supabase
              .from('referrals')
              .insert({
                referrer_id: user.id,
                referral_code: retryCode,
              });
            setReferralCode(retryCode);
          } else {
            console.error('Error creating referral:', insertError);
          }
        } else {
          setReferralCode(newCode);
        }
      }
    } catch (error) {
      console.error('Error in fetchOrCreateReferralCode:', error);
    }
  }, [user, generateReferralCode]);

  // Fetch user's referrals
  const fetchReferrals = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
      } else {
        setReferrals(data || []);
      }
    } catch (error) {
      console.error('Error in fetchReferrals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch user's points
  const fetchPoints = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching points:', error);
      } else {
        setPoints(data || { total_points: 0 });
      }
    } catch (error) {
      console.error('Error in fetchPoints:', error);
    }
  }, [user]);

  // Get referral invite link
  const getInviteLink = useCallback(() => {
    if (!referralCode) return '';
    return `${window.location.origin}/?ref=${referralCode}`;
  }, [referralCode]);

  // Copy invite link
  const copyInviteLink = useCallback(async () => {
    const link = getInviteLink();
    if (!link) {
      toast({ title: 'No referral code available', variant: 'destructive' });
      return false;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast({ title: 'Invite link copied!' });
      return true;
    } catch {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
      return false;
    }
  }, [getInviteLink]);

  // Share invite link
  const shareInviteLink = useCallback(async () => {
    const link = getInviteLink();
    if (!link) {
      toast({ title: 'No referral code available', variant: 'destructive' });
      return false;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SongChainn!',
          text: 'Join me on SongChainn and discover amazing music! Use my invite link to sign up and we both earn rewards.',
          url: link,
        });
        return true;
      } catch {
        // User cancelled or error - fallback to copy
        return copyInviteLink();
      }
    } else {
      return copyInviteLink();
    }
  }, [getInviteLink, copyInviteLink]);

  // Initialize
  useEffect(() => {
    if (user) {
      fetchOrCreateReferralCode();
      fetchReferrals();
      fetchPoints();
    }
  }, [user, fetchOrCreateReferralCode, fetchReferrals, fetchPoints]);

  return {
    referrals,
    points,
    referralCode,
    isLoading,
    getInviteLink,
    copyInviteLink,
    shareInviteLink,
    completedReferrals: referrals.filter(r => r.status === 'completed').length,
    totalPointsEarned: referrals.reduce((sum, r) => sum + r.points_earned, 0),
  };
}
