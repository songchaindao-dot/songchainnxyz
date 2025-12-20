import { motion } from 'framer-motion';
import { Download, Smartphone, Shield, Zap, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function Install() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Get $ongChainn App
            </h1>
            <p className="text-muted-foreground">
              Install our mobile app for the best experience
            </p>
          </div>

          {/* Download Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border mb-6"
          >
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
              Android APK
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Fast & Lightweight</p>
                  <p className="text-xs text-muted-foreground">Optimized for mobile performance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Secure & Safe</p>
                  <p className="text-xs text-muted-foreground">Built with security best practices</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Full Music Experience</p>
                  <p className="text-xs text-muted-foreground">Stream music anywhere, anytime</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full gradient-primary text-primary-foreground font-semibold h-14 rounded-2xl shadow-glow hover-scale press-effect text-base gap-2"
              onClick={() => {
                // For now, show instructions - APK will be available after Capacitor build
                alert('To build the APK:\n\n1. Export project to GitHub\n2. Run: npm install\n3. Run: npx cap add android\n4. Run: npm run build\n5. Run: npx cap sync\n6. Open in Android Studio and build APK');
              }}
            >
              <Download className="w-5 h-5" />
              Download APK
            </Button>
            
            <p className="text-xs text-muted-foreground mt-3">
              Version 1.0.0 • Android 8.0+
            </p>
          </motion.div>

          {/* iOS Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-secondary/50 rounded-xl p-4 text-left"
          >
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">iOS Users:</strong> Add to Home Screen from Safari for the best app-like experience. Tap the share button and select "Add to Home Screen".
            </p>
          </motion.div>

          {/* Build Instructions for Developers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-left"
          >
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
              For Developers
            </h3>
            <div className="bg-card rounded-xl p-4 border border-border">
              <code className="text-xs text-muted-foreground block space-y-1">
                <span className="block">1. Export to GitHub</span>
                <span className="block">2. git pull && npm install</span>
                <span className="block">3. npx cap add android</span>
                <span className="block">4. npm run build && npx cap sync</span>
                <span className="block">5. npx cap open android</span>
                <span className="block">6. Build APK in Android Studio</span>
              </code>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <AudioPlayer />
    </div>
  );
}
