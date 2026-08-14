import { useState } from 'react'
import PlanSwitcher from '../../dashboard/components/PlanSwitcher'
import { useUserPlan } from '../../dashboard/context/UserPlanContext'
import { usePlayer } from '../../player/context/PlayerContext'
import { useUserAudios, type LibraryAudio } from '../hooks/useUserAudios'
import { deleteAudio } from '../services/audioService'
import FilaAudio from './FilaAudio'
import LibraryIcon from './LibraryIcon'
import ModalSubirAudio from './ModalSubirAudio'

function Biblioteca() {
  const { userPlan } = useUserPlan()
  const { audios, isLoading } = useUserAudios()
  const { playTrack } = usePlayer()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handlePlay(audio: LibraryAudio) {
    playTrack(audio, audios)
  }

  async function handleDelete(audio: LibraryAudio) {
    const confirmed = window.confirm(`¿Eliminar "${audio.name}"? Esta acción no se puede deshacer.`)

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

  return (
    <section className="library-screen" aria-label="Biblioteca personal">
      <div className="library-screen__content">
        <header className="library-screen__header">
          <div>
            <p className="library-screen__eyebrow">Acceso {userPlan === 'premium' ? 'Premium' : 'Gratis'}</p>
            <h1>Tu biblioteca</h1>
          </div>

          <div className="library-screen__actions">
            <PlanSwitcher />
            <div className="library-screen__avatar" aria-label="Avatar de usuario">
              AG
            </div>
          </div>
        </header>

        {deleteError && <p className="library-screen__error">{deleteError}</p>}

        {isLoading ? (
          <p className="library-screen__loading">Cargando tu biblioteca...</p>
        ) : audios.length === 0 ? (
          <div className="library-empty-state" role="status">
            <div className="library-empty-state__icon" aria-hidden="true">
              <LibraryIcon name="music" />
            </div>
            <h2>Tu biblioteca está vacía</h2>
            <p>Añade tu primer audio para empezar a construir tu espacio personal.</p>
            <div className="library-empty-state__actions">
              <button
                type="button"
                className="library-empty-state__button library-empty-state__button--primary"
                onClick={() => setIsUploadModalOpen(true)}
              >
                Añadir tu primer audio
              </button>
            </div>
          </div>
        ) : (
          <div className="library-section__list">
            {audios.map((audio) => (
              <FilaAudio
                key={audio.id}
                name={audio.name}
                duration={audio.duration}
                isDeleting={deletingId === audio.id}
                onPlay={() => handlePlay(audio)}
                onDelete={() => handleDelete(audio)}
              />
            ))}
          </div>
        )}
      </div>

      <ModalSubirAudio isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
    </section>
  )
}

export default Biblioteca
