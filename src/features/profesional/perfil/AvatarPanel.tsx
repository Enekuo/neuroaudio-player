import Avatar from '@mui/material/Avatar'
import { iniciales, type FotoPerfil } from '../../perfilProfesional/modelo'
import { useFotoPerfil } from '../../perfilProfesional/fotos/useFotoPerfil'

type AvatarPanelProps = {
  uid: string
  nombre: string
  fotos: FotoPerfil[]
  fotoPrincipalId: string | null
  tamano: number
}

/** Foto principal del profesional dentro del panel (o sus iniciales). */
function AvatarPanel({
  uid,
  nombre,
  fotos,
  fotoPrincipalId,
  tamano,
}: AvatarPanelProps) {
  const principal = fotos.find((f) => f.id === fotoPrincipalId) ?? null
  const url = useFotoPerfil(uid, principal?.id ?? null, 'cuadrada')
  return (
    <Avatar
      src={url ?? undefined}
      alt={principal?.alt || nombre || 'Foto principal'}
      sx={{
        width: tamano,
        height: tamano,
        fontSize: tamano * 0.34,
        bgcolor: 'primary.light',
        color: 'primary.dark',
      }}
    >
      {iniciales(nombre)}
    </Avatar>
  )
}

export default AvatarPanel
