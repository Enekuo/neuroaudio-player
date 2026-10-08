import type { ReactNode } from 'react'
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined'
import LibraryMusicOutlined from '@mui/icons-material/LibraryMusicOutlined'
import QueueMusicOutlined from '@mui/icons-material/QueueMusicOutlined'
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined'
import InsightsOutlined from '@mui/icons-material/InsightsOutlined'
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'

export type SeccionProfesional = {
  /** Segmento de la ruta: /profesional/{path} */
  path: string
  label: string
  /** Texto breve de lo que habrá en la página (placeholder "Próximamente"). */
  description: string
  icon: ReactNode
}

/** Portada del panel: vive en /profesional (ruta índice), arriba del todo en el menú. */
export const DASHBOARD_PROFESIONAL = {
  to: '/profesional',
  label: 'Dashboard',
  icon: <SpaceDashboardOutlined />,
}

// Las 7 páginas del dashboard de profesional, en el orden del menú.
export const SECCIONES_PROFESIONAL: SeccionProfesional[] = [
  {
    path: 'audios',
    label: 'Audios',
    description: 'Aquí podrás subir y gestionar los audios que compartes con tus clientes.',
    icon: <LibraryMusicOutlined />,
  },
  {
    path: 'listas',
    label: 'Listas y programas',
    description: 'Aquí podrás organizar tus audios en listas y programas para cada cliente.',
    icon: <QueueMusicOutlined />,
  },
  {
    path: 'mensajes',
    label: 'Mensajes',
    description: 'Aquí podrás hablar con tus clientes.',
    icon: <ChatBubbleOutlineOutlined />,
  },
  {
    path: 'estadisticas',
    label: 'Estadísticas',
    description: 'Aquí podrás ver cómo escuchan tus clientes tus audios.',
    icon: <InsightsOutlined />,
  },
  {
    path: 'perfil',
    label: 'Perfil público',
    description: 'Aquí podrás preparar el perfil que verán las personas que te encuentren.',
    icon: <AccountCircleOutlined />,
  },
  {
    path: 'ingresos',
    label: 'Ingresos',
    description: 'Aquí podrás consultar tus ingresos y cobros.',
    icon: <PaymentsOutlined />,
  },
  {
    path: 'ajustes',
    label: 'Ajustes',
    description: 'Aquí podrás configurar tu cuenta de profesional.',
    icon: <SettingsOutlined />,
  },
]
