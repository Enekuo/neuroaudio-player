import { useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import UserAvatar from '../../auth/components/UserAvatar'
import PlanSwitcher from '../../dashboard/components/PlanSwitcher'
import { useUserPlan } from '../../dashboard/context/UserPlanContext'
import { usePlayer } from '../../player/context/PlayerContext'
import { useUserAudios, type LibraryAudio } from '../hooks/useUserAudios'
import { useUserListas } from '../hooks/useUserListas'
import { deleteAudio } from '../services/audioService'
import FilaAudio from './FilaAudio'
import LibraryIcon from './LibraryIcon'
import ModalCrearLista from './ModalCrearLista'
import ModalSubirAudio from './ModalSubirAudio'
import TarjetaListaBiblioteca from './TarjetaListaBiblioteca'
import TemplateIcon from './TemplateIcon'

type LibraryTab = 'general' | 'listas'

function Biblioteca() {
  const { user } = useAuth()
  const { userPlan } = useUserPlan()
  const { audios, isLoading } = useUserAudios()
  const { listas, isLoading: isLoadingListas } = useUserListas()
  const { playTrack } = usePlayer()
  const [activeTab, setActiveTab] = useState<LibraryTab>('general')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
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
            <UserAvatar user={user} className="library-screen__avatar" />
          </div>
        </header>

        <div className="library-tabs" role="tablist" aria-label="Secciones de la biblioteca">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'general'}
            className={`library-tabs__tab${activeTab === 'general' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'listas'}
            className={`library-tabs__tab${activeTab === 'listas' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('listas')}
          >
            Listas
          </button>
        </div>

        {deleteError && <p className="library-screen__error">{deleteError}</p>}

        {activeTab === 'general' ? (
          isLoading ? (
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
          )
        ) : isLoadingListas ? (
          <p className="library-screen__loading">Cargando tus listas...</p>
        ) : listas.length === 0 ? (
          <div className="library-empty-state" role="status">
            <div className="library-empty-state__icon" aria-hidden="true">
              <TemplateIcon name="lista" />
            </div>
            <h2>Aún no tienes listas</h2>
            <p>Crea tu primera lista para organizar tus audios como quieras.</p>
            <div className="library-empty-state__actions">
              <button
                type="button"
                className="library-empty-state__button library-empty-state__button--primary"
                onClick={() => setIsCreateListModalOpen(true)}
              >
                Crear lista
              </button>
            </div>
          </div>
        ) : (
          <div className="library-lists-grid">
            {listas.map((lista) => (
              <TarjetaListaBiblioteca key={lista.id} lista={lista} />
            ))}
          </div>
        )}
      </div>

      <ModalSubirAudio isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <ModalCrearLista isOpen={isCreateListModalOpen} onClose={() => setIsCreateListModalOpen(false)} />
    </section>
  )
}

export default Biblioteca
