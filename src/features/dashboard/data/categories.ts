export type CategoryItem = {
  id: string
  name: string
  description: string
  icon: string
  gradient: string
}

export const categories: CategoryItem[] = [
  {
    id: 'meditacion',
    name: 'Meditación',
    description: 'Encuentra calma y enfoque en minutos.',
    icon: '🧘',
    gradient: 'linear-gradient(135deg, #0f426d 0%, #3d8fd3 100%)',
  },
  {
    id: 'hipnosis',
    name: 'Hipnosis',
    description: 'Sesiones suaves para soltar tensiones.',
    icon: '🌙',
    gradient: 'linear-gradient(135deg, #185b92 0%, #5fa4de 100%)',
  },
  {
    id: 'mantras',
    name: 'Mantras',
    description: 'Repeticiones guiadas para centrarte.',
    icon: '🕊️',
    gradient: 'linear-gradient(135deg, #12324a 0%, #2476b8 100%)',
  },
  {
    id: 'subliminales',
    name: 'Subliminales',
    description: 'Entrenamiento sutil para reforzar hábitos.',
    icon: '✨',
    gradient: 'linear-gradient(135deg, #1b5e84 0%, #6ac7f6 100%)',
  },
  {
    id: 'reprogramacion',
    name: 'Reprogramación',
    description: 'Audios para transformar patrones.',
    icon: '🔄',
    gradient: 'linear-gradient(135deg, #0d3558 0%, #3f8fcf 100%)',
  },
  {
    id: 'suenio',
    name: 'Sueño',
    description: 'Ritmos suaves para cerrar el día.',
    icon: '🌤️',
    gradient: 'linear-gradient(135deg, #1f4d73 0%, #86c4ff 100%)',
  },
]
