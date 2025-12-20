import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Music } from 'lucide-react';
import { ARTISTS, SONGS } from '@/data/musicData';
import { SongCard } from '@/components/SongCard';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const artist = ARTISTS.find(a => a.id === id);
  const artistSongs = SONGS.filter(s => s.artistId === id);

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-4">Artist not found</h1>
          <Link to="/artists" className="text-primary hover:underline">
            Back to Artists
          </Link>
        </div>
      </div>
    );
  }

  const totalPlays = artistSongs.reduce((sum, s) => sum + s.plays, 0);
  const totalLikes = artistSongs.reduce((sum, s) => sum + s.likes, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          to="/artists" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Artists</span>
        </Link>

        {/* Artist Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Image */}
            <div className="w-48 h-48 rounded-2xl bg-secondary overflow-hidden flex-shrink-0">
              {artist.profileImage ? (
                <img 
                  src={artist.profileImage} 
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full gradient-primary opacity-40 flex items-center justify-center">
                  <span className="text-6xl font-heading font-bold text-foreground">
                    {artist.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-heading text-4xl font-bold text-foreground mb-2">
                {artist.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{artist.location}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Music className="w-4 h-4" />
                  <span>{artistSongs.length} songs</span>
                </div>
              </div>

              <p className="text-muted-foreground mb-6 max-w-2xl">
                {artist.bio}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">
                    {totalPlays.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Plays</p>
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">
                    {totalLikes.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
              </div>

              {/* Town Square Badge */}
              <div className="mt-4 inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm text-primary font-medium">{artist.townSquare}</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Songs */}
        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
            Discography
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artistSongs.map((song, index) => (
              <SongCard key={song.id} song={song} index={index} />
            ))}
          </div>
        </section>
      </main>

      <AudioPlayer />
    </div>
  );
}
