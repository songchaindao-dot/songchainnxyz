-- Create referrals table for invite friends system
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user_points table to track points
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Referrals policies
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Anyone can view referral codes for signup"
ON public.referrals
FOR SELECT
USING (status = 'pending');

-- User points policies
CREATE POLICY "Users can view their own points"
ON public.user_points
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points record"
ON public.user_points
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
ON public.user_points
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to award points on referral completion
CREATE OR REPLACE FUNCTION public.complete_referral(p_referral_code TEXT, p_new_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_points_reward INTEGER := 100;
BEGIN
  -- Find the referral
  SELECT id, referrer_id INTO v_referral_id, v_referrer_id
  FROM public.referrals
  WHERE referral_code = p_referral_code AND status = 'pending';
  
  IF v_referral_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update referral status
  UPDATE public.referrals
  SET status = 'completed',
      referred_user_id = p_new_user_id,
      points_earned = v_points_reward,
      completed_at = now()
  WHERE id = v_referral_id;
  
  -- Award points to referrer
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (v_referrer_id, v_points_reward)
  ON CONFLICT (user_id) 
  DO UPDATE SET total_points = user_points.total_points + v_points_reward,
                updated_at = now();
  
  -- Also give some points to the new user
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (p_new_user_id, 50)
  ON CONFLICT (user_id) 
  DO UPDATE SET total_points = user_points.total_points + 50,
                updated_at = now();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;