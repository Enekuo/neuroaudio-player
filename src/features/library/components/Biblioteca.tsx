import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import UserAvatar from '../../auth/components/UserAvatar'
import { useSwipeTabs } from '../../../hooks/useSwipeTabs'
import { usePlayer } from '../../player/context/PlayerContext'
import type { LibraryFolder } from '../data/plantillasListas'
import { useLibraryFolders } from '../hooks/useLibraryFolders'
import { type LibraryAudio } from '../hooks/useUserAudios'
import { deleteAudio } from '../services/audioService'
import AudiosConjuntos from './AudiosConjuntos'
import FilaAudio from './FilaAudio'
import LibraryIcon from './LibraryIcon'
import ModalCrearLista from './ModalCrearLista'
import ModalSubirAudio from './ModalSubirAudio'
import TemplateGrid from './TemplateGrid'

type LibraryTab = 'general' | 'listas' | 'audios-conjuntos'

// Orden visual de las pestañas (de izquierda a derecha, tal cual aparecen arriba),
// usado por useSwipeTabs para saber cuál es "siguiente"/"anterior" al deslizar.
const LIBRARY_TAB_ORDER: LibraryTab[] = [
  'listas',
  'general',
  'audios-conjuntos',
]

function Biblioteca() {
  const { user } = useAuth()
  const {
    folders,
    audios,
    isLoadingAudios: isLoading,
    isLoadingListas,
    error: listasError,
  } = useLibraryFolders()
  const { currentTrack, isPlaying, playTrack } = usePlayer()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<LibraryTab>('listas')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'general' || tab === 'listas' || tab === 'audios-conjuntos') {
      setActiveTab(tab)
    }
  }, [searchParams])

  const swipeHandlers = useSwipeTabs(LIBRARY_TAB_ORDER, activeTab, setActiveTab)

  function handlePlay(audio: LibraryAudio) {
    playTrack(audio, audios)
  }

  function handleOpenFolder(folder: LibraryFolder) {
    navigate(`/app/listas/${folder.key}`)
  }

  async function handleDelete(audio: LibraryAudio) {
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

  return (
    <section className="library-screen" aria-label="Biblioteca personal">
      <div className="library-screen__content">
        <header className="library-screen__header">
          <div>
            <h1>
              <span className="library-screen__title-desktop">
                Tu biblioteca
              </span>
              <span className="library-screen__title-movil">Mis audios</span>
            </h1>
          </div>

          <div className="library-screen__actions">
            <UserAvatar user={user} className="library-screen__avatar" />
          </div>
        </header>

        <div
          className="library-tabs"
          role="tablist"
          aria-label="Secciones de la biblioteca"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'listas'}
            className={`library-tabs__tab${activeTab === 'listas' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('listas')}
          >
            Listas
          </button>
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
            aria-selected={activeTab === 'audios-conjuntos'}
            className={`library-tabs__tab${activeTab === 'audios-conjuntos' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('audios-conjuntos')}
          >
            Audios conjuntos
          </button>
        </div>

        {deleteError && <p className="library-screen__error">{deleteError}</p>}

        <div key={activeTab} className="tab-swipe-panel" {...swipeHandlers}>
          {activeTab === 'general' ? (
            isLoading ? (
              <p className="library-screen__loading">
                Cargando tu biblioteca...
              </p>
            ) : audios.length === 0 ? (
              <div className="library-empty-state" role="status">
                <div className="library-empty-state__icon" aria-hidden="true">
                  <LibraryIcon name="music" />
                </div>
                <h2>Tu biblioteca está vacía</h2>
                <p>
                  Añade tu primer audio para empezar a construir tu espacio
                  personal.
                </p>
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
              <div className="library-section__list library-section__list--plana">
                {audios.map((audio) => (
                  <FilaAudio
                    key={audio.id}
                    name={audio.name}
                    duration={audio.duration}
                    isDeleting={deletingId === audio.id}
                    isPlaying={isPlaying && currentTrack?.id === audio.id}
                    onPlay={() => handlePlay(audio)}
                    onDelete={() => handleDelete(audio)}
                  />
                ))}
              </div>
            )
          ) : activeTab === 'listas' ? (
            <>
              {listasError && (
                <p className="library-screen__error">{listasError}</p>
              )}

              {isLoadingListas ? (
                <p className="library-screen__loading">
                  Cargando tus listas...
                </p>
              ) : (
                <div className="library-templates-intro">
                  <TemplateGrid
                    folders={folders}
                    onOpen={handleOpenFolder}
                    onCreateCustom={() => setIsCreateListModalOpen(true)}
                  />
                </div>
              )}
            </>
          ) : (
            <AudiosConjuntos audios={audios} isLoading={isLoading} />
          )}
        </div>
      </div>

      <ModalSubirAudio
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      <ModalCrearLista
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
      />
    </section>
  )
}

export default Biblioteca
