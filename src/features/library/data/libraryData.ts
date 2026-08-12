export type PlaylistItem = {
  id: string
  name: string
  audioCount: number
  accent: string
  icon: 'moon' | 'cloud' | 'spark' | 'wave' | 'music' | 'plus'
}

export type AudioItem = {
  id: string
  title: string
  origin: string
  duration: string
  list: string
  icon: 'moon' | 'cloud' | 'spark' | 'wave' | 'music'
}

export const playlists: PlaylistItem[] = [
  {
    id: 'sleep',
    name: 'Para dormir',
    audioCount: 8,
    accent: 'linear-gradient(135deg, #0f426d 0%, #3d8fd3 100%)',
    icon: 'moon',
  },
  {
    id: 'anxiety',
    name: 'Ansiedad',
    audioCount: 5,
    accent: 'linear-gradient(135deg, #185b92 0%, #5fa4de 100%)',
    icon: 'cloud',
  },
  {
    id: 'dr-garcia',
    name: 'Sesión Dr. García',
    audioCount: 3,
    accent: 'linear-gradient(135deg, #12324a 0%, #2476b8 100%)',
    icon: 'spark',
  },
]

export const recentAudios: AudioItem[] = [
  {
    id: 'youtube-1',
    title: 'Meditación guiada para soltar el día',
    origin: 'De YouTube',
    duration: '18 min',
    list: 'Para dormir',
    icon: 'wave',
  },
  {
    id: 'upload-1',
    title: 'Audio reprogramación - autoestima',
    origin: 'Archivo subido',
    duration: '25 min',
    list: 'Ansiedad',
    icon: 'music',
  },
  {
    id: 'youtube-2',
    title: 'Mantra om - 432 Hz',
    origin: 'De YouTube',
    duration: '60 min',
    list: 'Sesión Dr. García',
    icon: 'spark',
  },
]
