import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Music, Zap } from 'lucide-react';
import { Song } from '@/data/musicData';
import { SongCard } from '@/components/SongCard';

interface FeaturedTracksSectionProps {
  songs: Song[];
}

// Floating particle component
function FloatingParticle({ delay = 0, size = 4, color = 'primary' }: { delay?: number; size?: number; color?: string }) {
  return (
    <motion.div
      className={`absolute rounded-full ${color === 'primary' ? 'bg-primary/40' : 'bg-cyan-400/30'}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        y: [0, -100, -200],
        x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

// Music wave visualizer
function MusicWaveVisualizer() {
  return (
    <div className="flex items-end gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-primary to-cyan-400"
          animate={{
            height: ['20%', '100%', '40%', '80%', '20%'],
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function FeaturedTracksSection({ songs }: FeaturedTracksSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        {/* Main gradient orb */}
        <motion.div
          className="absolute -top-20 -left-20 w-[400px] h-[400px]"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-cyan-500/10 to-transparent blur-[80px]" />
        </motion.div>

        {/* Secondary orb */}
        <motion.div
          className="absolute -bottom-10 -right-10 w-[300px] h-[300px]"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tl from-cyan-400/15 via-primary/10 to-transparent blur-[60px]" />
        </motion.div>

        {/* Floating particles */}
        <div className="absolute bottom-0 left-1/4">
          {[...Array(8)].map((_, i) => (
            <FloatingParticle key={i} delay={i * 0.5} size={3 + Math.random() * 4} color={i % 2 === 0 ? 'primary' : 'cyan'} />
          ))}
        </div>
        <div className="absolute bottom-0 right-1/4">
          {[...Array(6)].map((_, i) => (
            <FloatingParticle key={i} delay={i * 0.7 + 0.3} size={2 + Math.random() * 3} color={i % 2 === 0 ? 'cyan' : 'primary'} />
          ))}
        </div>
      </div>

      {/* Header with enhanced styling */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Animated icon container */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative"
          >
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-cyan-400 blur-lg opacity-50"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary to-cyan-400 shadow-glow">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Featured Tracks
              </h2>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Trending in Livingstone Town Square</p>
          </div>
        </div>

        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full glass"
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-muted-foreground font-medium">Live</span>
          <MusicWaveVisualizer />
        </motion.div>
      </div>

      {/* Featured cards container with glass effect */}
      <div className="relative">
        {/* Decorative elements */}
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-xs text-primary font-medium">Hot This Week</span>
          <Zap className="w-3 h-3 text-primary" />
        </motion.div>

        {/* Cards grid with staggered animation */}
        <div className="grid md:grid-cols-3 gap-6 pt-4">
          {songs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.15,
                duration: 0.5,
                type: 'spring',
                stiffness: 100,
              }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="relative group"
            >
              {/* Card glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
              />
              
              {/* Rank badge */}
              <motion.div
                className="absolute -top-3 -left-3 z-20"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5 + index * 0.15, type: 'spring' }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-glow-intense">
                  <span className="text-xs font-bold text-primary-foreground">#{index + 1}</span>
                </div>
              </motion.div>

              <SongCard song={song} index={index} variant="featured" />
            </motion.div>
          ))}
        </div>

        {/* Bottom decorative line */}
        <motion.div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        />
      </div>

      {/* Floating music notes decoration */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ right: i * 20, top: i * -30 }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Music className="w-4 h-4 text-primary/40" />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
