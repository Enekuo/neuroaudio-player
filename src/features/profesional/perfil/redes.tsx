import type { ReactElement } from 'react'
import LanguageRounded from '@mui/icons-material/LanguageRounded'
import Instagram from '@mui/icons-material/Instagram'
import YouTube from '@mui/icons-material/YouTube'
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded'
import type { Red } from '../../perfilProfesional/modelo'

export const ETIQUETA_RED: Record<Red, string> = {
  web: 'Web',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

export const EJEMPLO_RED: Record<Red, string> = {
  web: 'miconsulta.es',
  instagram: 'tuusuario',
  youtube: 'tucanal',
  tiktok: 'tuusuario',
}

// MUI no trae icono de TikTok: se usa una nota musical.
export const ICONO_RED: Record<Red, ReactElement> = {
  web: <LanguageRounded />,
  instagram: <Instagram />,
  youtube: <YouTube />,
  tiktok: <MusicNoteRounded />,
}
