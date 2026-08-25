import { useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import UserAvatar from '../../auth/components/UserAvatar'
import { usePlayer } from '../../player/context/PlayerContext'
import { CUSTOM_TEMPLATE_ID, type ListTemplate } from '../data/plantillasListas'
import { useCrearLista } from '../hooks/useCrearLista'
import { useUserAudios, type LibraryAudio } from '../hooks/useUserAudios'
import { useUserListas, type LibraryLista } from '../hooks/useUserListas'
import { deleteAudio } from '../services/audioService'
import { eliminarLista, renombrarLista } from '../services/listaService'
import FilaAudio from './FilaAudio'
import LibraryIcon from './LibraryIcon'
import ListaDetalle from './ListaDetalle'
import ModalCrearLista from './ModalCrearLista'
import ModalSubirAudio from './ModalSubirAudio'
import TarjetaListaBiblioteca from './TarjetaListaBiblioteca'
import TemplateGrid from './TemplateGrid'

type LibraryTab = 'general' | 'listas'

function Biblioteca() {
  const { user } = useAuth()
  const { audios, isLoading } = useUserAudios()
  const { listas, isLoading: isLoadingListas, error: listasError } = useUserListas()
  const { playTrack } = usePlayer()
  const { create: createLista, isSaving: isCreatingLista, error: createListaError } = useCrearLista()
  const [activeTab, setActiveTab] = useState<LibraryTab>('listas')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [openListaId, setOpenListaId] = useState<string | null>(null)
  const [listaActionError, setListaActionError] = useState<string | null>(null)
  const isCreatingListaRef = useRef(false)

  function handlePlay(audio: LibraryAudio) {
    playTrack(audio, audios)
  }

  async function handleSelectTemplate(template: ListTemplate) {
    if (template.id === CUSTOM_TEMPLATE_ID) {
      setIsCreateListModalOpen(true)
      return
    }

    if (isCreatingListaRef.current) {
      return
    }

    isCreatingListaRef.current = true
    await createLista(template.label, template.id)
    isCreatingListaRef.current = false
  }

  async function handleRenameLista(lista: LibraryLista) {
    const newName = window.prompt('Nuevo nombre de la lista', lista.name)?.trim()

    if (!newName || newName === lista.name) {
      return
    }

    setListaActionError(null)

    try {
      await renombrarLista(lista.id, newName)
    } catch {
      setListaActionError('No se pudo renombrar la lista. Inténtalo de nuevo.')
    }
  }

  async function handleDeleteLista(lista: LibraryLista) {
    const confirmed = window.confirm(`¿Eliminar la lista "${lista.name}"? Esta acción no se puede deshacer.`)

    if (!confirmed) {
      return
    }

    setListaActionError(null)

    try {
      await eliminarLista(lista.id)
      if (openListaId === lista.id) {
        setOpenListaId(null)
      }
    } catch {
      setListaActionError('No se pudo eliminar la lista. Inténtalo de nuevo.')
    }
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

  const openLista = listas.find((lista) => lista.id === openListaId) ?? null

  return (
    <section className="library-screen" aria-label="Biblioteca personal">
      <div className="library-screen__content">
        <header className="library-screen__header">
          <div>
            <h1>Tu biblioteca</h1>
          </div>

          <div className="library-screen__actions">
            <UserAvatar user={user} className="library-screen__avatar" />
          </div>
        </header>

        <div className="library-tabs" role="tablist" aria-label="Secciones de la biblioteca">
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
        ) : (
          <>
            {listasError && <p className="library-screen__error">{listasError}</p>}
            {createListaError && <p className="library-screen__error">{createListaError}</p>}
            {listaActionError && <p className="library-screen__error">{listaActionError}</p>}

            {isLoadingListas ? (
              <p className="library-screen__loading">Cargando tus listas...</p>
            ) : openLista ? (
              <ListaDetalle
                lista={openLista}
                onBack={() => setOpenListaId(null)}
                onRename={() => handleRenameLista(openLista)}
                onDelete={() => handleDeleteLista(openLista)}
              />
            ) : listas.length === 0 ? (
              <div className="library-templates-intro">
                <h2>Crea tu primera lista</h2>
                <p>Elige un estilo para empezar, o crea una personalizada.</p>
                <TemplateGrid onSelect={handleSelectTemplate} disabled={isCreatingLista} />
              </div>
            ) : (
              <div className="library-lists-grid">
                {listas.map((lista) => (
                  <TarjetaListaBiblioteca
                    key={lista.id}
                    lista={lista}
                    audioCount={0}
                    onOpen={() => setOpenListaId(lista.id)}
                    onRename={() => handleRenameLista(lista)}
                    onDelete={() => handleDeleteLista(lista)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ModalSubirAudio isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <ModalCrearLista isOpen={isCreateListModalOpen} onClose={() => setIsCreateListModalOpen(false)} />
    </section>
  )
}

export default Biblioteca
