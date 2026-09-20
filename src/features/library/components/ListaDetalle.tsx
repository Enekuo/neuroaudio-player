import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { usePlayer } from '../../player/context/PlayerContext'
import { getTemplateById } from '../data/plantillasListas'
import { useLibraryFolders } from '../hooks/useLibraryFolders'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { deleteAudio } from '../services/audioService'
import { eliminarLista, quitarAudioDeLista, renombrarLista, anadirAudioALista } from '../services/listaService'
import FilaAudio from './FilaAudio'
import ListaOptionsMenu from './ListaOptionsMenu'
import PanelAnadirAudios from './PanelAnadirAudios'
import TemplateIcon from './TemplateIcon'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

function ListaDetalle() {
  const { folderKey } = useParams<{ folderKey: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { folders, audios, isLoadingAudios, isLoadingListas, error: listasError } = useLibraryFolders()
  const { playTrack, currentTrack, isPlaying } = usePlayer()

  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const folder = folders.find((item) => item.key === folderKey) ?? null

  const tracks: LibraryAudio[] = folder
    ? folder.audioIds
        .map((id) => audios.find((audio) => audio.id === id))
        .filter((audio): audio is LibraryAudio => Boolean(audio))
    : []

  function handleBack() {
    navigate('/app/biblioteca?tab=listas')
  }

  function handlePlayTrack(audio: LibraryAudio) {
    playTrack(audio, tracks)
  }

  async function handleToggleAudio(audioId: string, incluir: boolean) {
    if (!user || !folder) {
      return
    }

    setActionError(null)

    try {
      if (incluir) {
        await anadirAudioALista(folder.listaId, audioId, {
          uid: user.uid,
          name: folder.name,
          template: folder.template,
        })
      } else {
        await quitarAudioDeLista(folder.listaId, audioId)
      }
    } catch {
      setActionError('No se pudo actualizar la lista. Inténtalo de nuevo.')
    }
  }

  async function handleDeleteTrack(audio: LibraryAudio) {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el audio "${audio.name}"? Esta acción no se puede deshacer.`,
    )

    if (!confirmed) {
      return
    }

    setDeleteError(null)
    setDeletingId(audio.id)

    try {
      await deleteAudio(audio)
    } catch {
      setDeleteError('No se pudo eliminar el audio. Inténtalo de nuevo.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRename() {
    if (!folder) {
      return
    }

    const newName = window.prompt('Nuevo nombre de la lista', folder.name)?.trim()

    if (!newName || newName === folder.name) {
      return
    }

    setActionError(null)

    try {
      await renombrarLista(folder.listaId, newName)
    } catch {
      setActionError('No se pudo renombrar la lista. Inténtalo de nuevo.')
    }
  }

  async function handleDelete() {
    if (!folder) {
      return
    }

    const confirmed = window.confirm(`¿Eliminar la lista "${folder.name}"? Esta acción no se puede deshacer.`)

    if (!confirmed) {
      return
    }

    try {
      await eliminarLista(folder.listaId)
      navigate('/app/biblioteca?tab=listas')
    } catch {
      setActionError('No se pudo eliminar la lista. Inténtalo de nuevo.')
    }
  }

  if (isLoadingAudios || isLoadingListas) {
    return (
      <section className="lista-detalle">
        <p className="lista-detalle__loading">Cargando lista...</p>
      </section>
    )
  }

  if (!folder) {
    return (
      <section className="lista-detalle">
        <div className="lista-detalle__not-found">
          <p>No se ha encontrado esta lista.</p>
          <button type="button" className="lista-detalle__back-link" onClick={handleBack}>
            Volver a Listas
          </button>
        </div>
      </section>
    )
  }

  const template = getTemplateById(folder.template)
  const hasImage = Boolean(template.cardImage)
  const audioLabel = folder.count === 1 ? '1 audio' : `${folder.count} audios`

  return (
    <section className="lista-detalle" aria-label={`Detalle de la lista ${folder.name}`}>
      <div
        className="lista-detalle__hero"
        style={{ background: `linear-gradient(160deg, ${template.gradientFrom}33 0%, #000208 70%)` }}
      >
        <button type="button" className="lista-detalle__back" onClick={handleBack} aria-label="Volver">
          <BackIcon />
        </button>

        <div className="lista-detalle__hero-inner">
          <div className="lista-detalle__hero-main">
            <div
              className="lista-detalle__cover"
              style={
                hasImage
                  ? { backgroundImage: `url(${template.cardImage})` }
                  : { background: `linear-gradient(160deg, ${template.gradientFrom} 0%, ${template.gradientTo} 100%)` }
              }
            >
              {!hasImage ? (
                <span className="lista-detalle__cover-icon" aria-hidden="true">
                  <TemplateIcon name={template.icon} />
                </span>
              ) : null}
            </div>

            <div className="lista-detalle__hero-info">
              <h1>{folder.name}</h1>
              <p>{audioLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lista-detalle__body">
        {listasError ? <p className="lista-detalle__error">{listasError}</p> : null}

        <div className="lista-detalle__toolbar">
          <button type="button" className="lista-detalle__add-button" onClick={() => setIsAddPanelOpen((value) => !value)}>
            Añadir audios
          </button>

          {folder.isCustom ? <ListaOptionsMenu onRename={handleRename} onDelete={handleDelete} /> : null}
        </div>

        {isAddPanelOpen ? (
          <PanelAnadirAudios
            folder={folder}
            audios={audios}
            error={actionError}
            onToggleAudio={handleToggleAudio}
            onClose={() => setIsAddPanelOpen(false)}
          />
        ) : (
          actionError && <p className="lista-detalle__error">{actionError}</p>
        )}

        {deleteError && <p className="lista-detalle__error">{deleteError}</p>}

        {tracks.length === 0 ? (
          <div className="lista-detalle__empty">
            <p>Esta lista todavía no tiene audios.</p>
            <button type="button" className="lista-detalle__add-button" onClick={() => setIsAddPanelOpen(true)}>
              Añadir audios
            </button>
          </div>
        ) : (
          <div className="library-section__list library-section__list--plana">
            {tracks.map((audio) => (
              <FilaAudio
                key={audio.id}
                name={audio.name}
                duration={audio.duration}
                isDeleting={deletingId === audio.id}
                isPlaying={currentTrack?.id === audio.id && isPlaying}
                onPlay={() => handlePlayTrack(audio)}
                onDelete={() => handleDeleteTrack(audio)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ListaDetalle
