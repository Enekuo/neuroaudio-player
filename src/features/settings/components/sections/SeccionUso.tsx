import { useUserAudios } from '../../../library/hooks/useUserAudios'
import { useUserListas } from '../../../library/hooks/useUserListas'

function formatBytes(bytes: number) {
  if (bytes <= 0) {
    return '0 MB'
  }

  const mb = bytes / (1024 * 1024)

  if (mb < 1024) {
    return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`
  }

  return `${(mb / 1024).toFixed(2)} GB`
}

function SeccionUso() {
  const { audios, isLoading } = useUserAudios()
  const { listas, isLoading: isLoadingListas } = useUserListas()

  const totalBytes = audios.reduce((sum, audio) => sum + (audio.size ?? 0), 0)

  return (
    <div className="settings-section">
      <h3>Uso</h3>
      <p className="settings-section__intro">Un resumen de lo que tienes guardado en NeuroAudio.</p>

      <div className="settings-stat-grid">
        <div className="settings-stat">
          <p className="settings-stat__value">{isLoading ? '—' : audios.length}</p>
          <p className="settings-stat__label">Audios guardados</p>
        </div>
        <div className="settings-stat">
          <p className="settings-stat__value">{isLoadingListas ? '—' : listas.length}</p>
          <p className="settings-stat__label">Listas creadas</p>
        </div>
        <div className="settings-stat">
          <p className="settings-stat__value">{isLoading ? '—' : formatBytes(totalBytes)}</p>
          <p className="settings-stat__label">Espacio usado</p>
        </div>
      </div>

      <p className="settings-section__hint">
        El espacio usado es la suma del tamaño de tus archivos de audio subidos.
      </p>
    </div>
  )
}

export default SeccionUso
