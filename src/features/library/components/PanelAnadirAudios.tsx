import type { LibraryFolder } from '../data/plantillasListas'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { formatTime } from '../utils/formatTime'
import ListaOptionsMenu from './ListaOptionsMenu'

type PanelAnadirAudiosProps = {
  folder: LibraryFolder
  audios: LibraryAudio[]
  error?: string | null
  onToggleAudio: (audioId: string, incluir: boolean) => void
  onClose: () => void
  onRename?: () => void
  onDelete?: () => void
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function PanelAnadirAudios({
  folder,
  audios,
  error,
  onToggleAudio,
  onClose,
  onRename,
  onDelete,
}: PanelAnadirAudiosProps) {
  const incluidos = new Set(folder.audioIds)
  const nEnLista = audios.reduce((total, audio) => (incluidos.has(audio.id) ? total + 1 : total), 0)
  const showOptions = Boolean(onRename && onDelete)

  return (
    <div className="panel-audios" role="region" aria-label={`Añadir audios a ${folder.name}`}>
      <div className="panel-audios__head">
        <p className="panel-audios__title">
          Pulsa un audio para guardarlo en <strong>{folder.name}</strong>
          <span className="panel-audios__count">{nEnLista}</span>
        </p>

        <div className="panel-audios__head-actions">
          {showOptions ? (
            <ListaOptionsMenu className="panel-audios__options" onRename={onRename!} onDelete={onDelete!} />
          ) : null}
          <button type="button" className="panel-audios__close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      {error ? <p className="panel-audios__error">{error}</p> : null}

      {audios.length === 0 ? (
        <p className="panel-audios__empty">Aún no tienes audios. Súbelos desde «Añadir audio».</p>
      ) : (
        <ul className="panel-audios__list">
          {audios.map((audio) => {
            const incluido = incluidos.has(audio.id)

            return (
              <li key={audio.id}>
                <button
                  type="button"
                  className={`panel-audios__item${incluido ? ' is-included' : ''}`}
                  onClick={() => onToggleAudio(audio.id, !incluido)}
                  aria-pressed={incluido}
                >
                  <span className="panel-audios__item-icon" aria-hidden="true">
                    {incluido ? <CheckIcon /> : <PlusIcon />}
                  </span>
                  <span className="panel-audios__item-name">{audio.name}</span>
                  {audio.duration ? (
                    <span className="panel-audios__item-time">{formatTime(audio.duration)}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default PanelAnadirAudios
