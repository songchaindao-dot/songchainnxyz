import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Camera, User, FileText, Link2, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/songchainn-logo.png';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileName, setProfileName] = useState('');
  const [bio, setBio] = useState('');
  const [xProfileLink, setXProfileLink] = useState('');
  const [baseProfileLink, setBaseProfileLink] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);

  const profilePictureRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileName.trim()) {
      toast({ title: 'Please enter a profile name', variant: 'destructive' });
      return;
    }
    
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      let profilePictureUrl: string | null = null;
      let coverPhotoUrl: string | null = null;
      
      if (profilePicture) {
        profilePictureUrl = await uploadImage(profilePicture, 'profile-pictures');
      }
      
      if (coverPhoto) {
        coverPhotoUrl = await uploadImage(coverPhoto, 'cover-photos');
      }
      
      const { error } = await supabase
        .from('audience_profiles')
        .insert({
          user_id: user.id,
          profile_name: profileName.trim(),
          bio: bio.trim() || null,
          profile_picture_url: profilePictureUrl,
          cover_photo_url: coverPhotoUrl,
          x_profile_link: xProfileLink.trim() || null,
          base_profile_link: baseProfileLink.trim() || null,
          onboarding_completed: true
        });
      
      if (error) {
        throw error;
      }
      
      toast({ title: 'Welcome to the Audience!' });
      await refreshProfile();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast({ 
        title: 'Error creating profile', 
        description: err.message,
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.img
            src={logo}
            alt="SongChainn"
            className="h-12 mx-auto mb-4"
          />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Headphones className="w-6 h-6 text-primary" />
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Prepare Your Seats
            </h1>
          </div>
          <p className="text-muted-foreground">
            Set up your Audience profile and take your place in the SongChainn experience.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Cover Photo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Cover Photo
            </Label>
            <div
              onClick={() => coverPhotoRef.current?.click()}
              className="relative w-full h-32 bg-secondary rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer overflow-hidden transition-colors"
            >
              {coverPhotoPreview ? (
                <img
                  src={coverPhotoPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm">Upload cover photo</span>
                </div>
              )}
            </div>
            <input
              ref={coverPhotoRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setCoverPhoto, setCoverPhotoPreview)}
              className="hidden"
            />
          </div>

          {/* Profile Picture */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile Picture
            </Label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => profilePictureRef.current?.click()}
                className="relative w-24 h-24 bg-secondary rounded-full border-2 border-dashed border-border hover:border-primary/50 cursor-pointer overflow-hidden transition-colors flex-shrink-0"
              >
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Upload className="w-5 h-5" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a photo that represents you as an Audience member
              </p>
            </div>
            <input
              ref={profilePictureRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setProfilePicture, setProfilePicturePreview)}
              className="hidden"
            />
          </div>

          {/* Profile Name */}
          <div className="space-y-2">
            <Label htmlFor="profileName" className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profileName"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Social Links
            </Label>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="xLink" className="text-xs text-muted-foreground">
                  X (Twitter) Profile
                </Label>
                <Input
                  id="xLink"
                  value={xProfileLink}
                  onChange={(e) => setXProfileLink(e.target.value)}
                  placeholder="https://x.com/yourhandle"
                />
              </div>
              
              <div>
                <Label htmlFor="baseLink" className="text-xs text-muted-foreground">
                  Base Profile / Wallet
                </Label>
                <Input
                  id="baseLink"
                  value={baseProfileLink}
                  onChange={(e) => setBaseProfileLink(e.target.value)}
                  placeholder="https://base.app/yourprofile or 0x..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground font-semibold h-12 shadow-glow"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Enter SongChainn'
            )}
          </Button>

          {/* Early Access Note */}
          <p className="text-xs text-muted-foreground text-center">
            You're early — your Audience activity here unlocks future access and ownership.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
