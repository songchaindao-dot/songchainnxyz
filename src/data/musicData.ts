import cover1 from '@/assets/artist-cover-1.jpg';
import cover2 from '@/assets/artist-cover-2.jpg';
import cover3 from '@/assets/artist-cover-3.jpg';
import artist7roo7hBased from '@/assets/artist-7roo7h-based.png';
import artistDenajah from '@/assets/artist-denajah.png';
import artistImanAfrikah from '@/assets/artist-iman-afrikah.png';
import artistNda from '@/assets/artist-nda.png';
import artistPrp from '@/assets/artist-prp.png';
import artistSanchy from '@/assets/artist-sanchy.png';
import artistSantana from '@/assets/artist-santana.png';

export type Genre = 'Afrobeats' | 'Reggae' | 'Hip-Hop' | 'Soul' | 'Electronic' | 'R&B';

export const GENRES: Genre[] = ['Afrobeats', 'Reggae', 'Hip-Hop', 'Soul', 'Electronic', 'R&B'];

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  plays: number;
  likes: number;
  townSquare: string;
  genre: Genre;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  location: string;
  townSquare: string;
  profileImage?: string;
  songs: string[];
}

export interface AudienceProfile {
  id: string;
  displayName: string;
  baseAddress?: string;
  totalListeningTime: number;
  totalPlays: number;
  likedSongs: string[];
  engagementPoints: number;
  currentStreak: number;
  longestStreak: number;
  joinedAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  baseAddress?: string;
  isAdmin: boolean;
}

export const SONGS: Song[] = [
  {
    id: '1',
    title: "Eve's Daughter",
    artist: '7ROO7H BASED',
    artistId: '1',
    audioUrl: "https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/7ROO7H%20BASED%20-%20EVE'S%20DAUGHTER.wav",
    coverImage: cover1,
    plays: 1247,
    likes: 342,
    townSquare: 'Livingstone Town Square',
    genre: 'Electronic',
  },
  {
    id: '2',
    title: 'Dance',
    artist: 'DenaJah',
    artistId: '2',
    audioUrl: 'https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/Denajah%20-%20Dance.wav',
    coverImage: cover2,
    plays: 892,
    likes: 256,
    townSquare: 'Livingstone Town Square',
    genre: 'Reggae',
  },
  {
    id: '3',
    title: 'Endless',
    artist: 'IMan Afrikah',
    artistId: '3',
    audioUrl: 'https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/IMan%20Afrikah%20-%20Endless.wav',
    coverImage: cover3,
    plays: 2103,
    likes: 567,
    townSquare: 'Livingstone Town Square',
    genre: 'Afrobeats',
  },
  {
    id: '4',
    title: 'Shadow Work',
    artist: 'NDA',
    artistId: '4',
    audioUrl: 'https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/NDA%20-%20SHADOW%20WORK.wav',
    coverImage: cover1,
    plays: 756,
    likes: 198,
    townSquare: 'Livingstone Town Square',
    genre: 'Soul',
  },
  {
    id: '5',
    title: 'ALE TI',
    artist: 'PRP',
    artistId: '5',
    audioUrl: 'https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/PRP%20-%20ALE%20TI.wav',
    coverImage: cover2,
    plays: 1534,
    likes: 423,
    townSquare: 'Livingstone Town Square',
    genre: 'Hip-Hop',
  },
  {
    id: '6',
    title: 'Midnight',
    artist: 'Sanchy',
    artistId: '6',
    audioUrl: 'https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/Sanchy%20-%20Midnight.wav',
    coverImage: cover3,
    plays: 1089,
    likes: 312,
    townSquare: 'Livingstone Town Square',
    genre: 'R&B',
  },
  {
    id: '7',
    title: 'Brick By Brick',
    artist: 'Santana',
    artistId: '7',
    audioUrl: 'https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/Santana%20-%20Brick%20By%20Brick.wav',
    coverImage: cover1,
    plays: 1876,
    likes: 489,
    townSquare: 'Livingstone Town Square',
    genre: 'Hip-Hop',
  },
];

export const ARTISTS: Artist[] = [
  {
    id: '1',
    name: '7ROO7H BASED',
    bio: 'A visionary artist from Zambia blending traditional African rhythms with contemporary electronic sounds. 7ROO7H BASED creates music that speaks to the soul and moves the body.',
    location: 'Zambia',
    townSquare: 'Livingstone Town Square',
    profileImage: artist7roo7hBased,
    songs: ['1'],
  },
  {
    id: '2',
    name: 'DenaJah',
    bio: 'DenaJah brings infectious energy to every track, fusing reggae influences with modern Afrobeats. Their sound is a celebration of African heritage and global connection.',
    location: 'Zambia',
    townSquare: 'Livingstone Town Square',
    profileImage: artistDenajah,
    songs: ['2'],
  },
  {
    id: '3',
    name: 'IMan Afrikah',
    bio: 'A pioneer of the Zambian music scene, IMan Afrikah creates timeless melodies that resonate across borders. Their music is a journey through sound and emotion.',
    location: 'Zambia',
    townSquare: 'Livingstone Town Square',
    profileImage: artistImanAfrikah,
    songs: ['3'],
  },
  {
    id: '4',
    name: 'NDA',
    bio: 'NDA explores the depths of introspective music, creating soundscapes that encourage reflection and growth. Their artistry pushes boundaries while staying rooted in authenticity.',
    location: 'Zambia',
    townSquare: 'Livingstone Town Square',
    profileImage: artistNda,
    songs: ['4'],
  },
  {
    id: '5',
    name: 'PRP',
    bio: 'PRP delivers high-energy tracks that get crowds moving. With a unique blend of hip-hop and African influences, their music is both fresh and deeply rooted.',
    location: 'Zambia',
    townSquare: 'Livingstone Town Square',
    profileImage: artistPrp,
    songs: ['5'],
  },
  {
    id: '6',
    name: 'Sanchy',
    bio: 'Sanchy creates atmospheric music that paints pictures with sound. Their late-night vibes and smooth production make every track a sonic experience.',
    location: 'Zambia',
    townSquare: 'Livingstone Town Square',
    profileImage: artistSanchy,
    songs: ['6'],
  },
  {
    id: '7',
    name: 'Santana',
    bio: 'Santana builds their music brick by brick, layering sounds to create powerful compositions. Their dedication to craft shines through in every release.',
    location: 'Zambia',
    townSquare: 'Livingstone Town Square',
    profileImage: artistSantana,
    songs: ['7'],
  },
];

export const TOWN_SQUARES = [
  {
    id: 'livingstone',
    name: 'Livingstone Town Square',
    location: 'Zambia',
    description: 'Pioneer chapter of Create On Base Town Squares',
    artistCount: 7,
  },
];
