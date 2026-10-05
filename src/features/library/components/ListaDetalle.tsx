import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { usePlayer } from '../../player/context/PlayerContext'
import { getTemplateById } from '../data/plantillasListas'
import { useLibraryFolders } from '../hooks/useLibraryFolders'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { deleteAudio } from '../services/audioService'
import { alternarFavorito } from '../services/favoritoService'
import { cambiarPortadaLista, eliminarLista, quitarAudioDeLista, renombrarLista, anadirAudioALista } from '../services/listaService'
import { crearPortadaLista } from '../utils/portadaLista'
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
  const [isSavingCover, setIsSavingCover] = useState(false)
  // Menú de la portada (listas propias): Añadir / Cambiar / Eliminar imagen.
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false)
  const coverMenuRef = useRef<HTMLDivElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const folder = folders.find((item) => item.key === folderKey) ?? null

  const tracks: LibraryAudio[] = folder
    ? folder.audioIds
        .map((id) => audios.find((audio) => audio.id === id))
        .filter((audio): audio is LibraryAudio => Boolean(audio))
    : []

  useEffect(() => {
    if (!isCoverMenuOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (coverMenuRef.current && !coverMenuRef.current.contains(event.target as Node)) {
        setIsCoverMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCoverMenuOpen])

  // "Añadir/Cambiar imagen": abre el selector de fotos del móvil.
  function handlePickCover() {
    setIsCoverMenuOpen(false)
    coverInputRef.current?.click()
  }

  // "Eliminar imagen": la lista vuelve a su icono de siempre.
  async function handleRemoveCover() {
    setIsCoverMenuOpen(false)
    if (!folder) {
      return
    }

    setActionError(null)
    setIsSavingCover(true)

    try {
      await cambiarPortadaLista(folder.listaId, null)
    } catch {
      setActionError('No se pudo eliminar la imagen. Inténtalo de nuevo.')
    } finally {
      setIsSavingCover(false)
    }
  }

  // Portada propia: se reduce en el móvil y se guarda en la lista. Al ser
  // onSnapshot, la imagen aparece sola en cuanto se guarda (aquí y en la
  // tarjeta de Listas).
  async function handleCoverFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !folder) {
      return
    }

    setActionError(null)
    setIsSavingCover(true)

    try {
      const coverImage = await crearPortadaLista(file)
      await cambiarPortadaLista(folder.listaId, coverImage)
    } catch {
      setActionError('No se pudo guardar la imagen. Prueba con otra foto.')
    } finally {
      setIsSavingCover(false)
    }
  }

  // Al volver se indica de qué lista se viene, para que su tarjeta se
  // ilumine un instante en la rejilla (continuidad espacial: "salí de aquí").
  function handleBack() {
    navigate('/app/biblioteca?tab=listas', { state: { fromList: folderKey } })
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
  const coverImage = folder.isCustom ? (folder.coverImage ?? null) : null
  const hasImage = Boolean(coverImage || template.cardImage)

  const coverStyle = coverImage
    ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#000000' }
    : hasImage
      ? {
          backgroundImage: `url(${template.cardImage})`,
          // Fondo negro detrás de la imagen (antes gris #141517): las
          // ilustraciones tienen fondo negro y algunas zonas
          // transparentes; así cualquier hueco o transparencia se
          // funde con ellas en vez de verse gris.
          backgroundColor: '#000000',
          // Ajuste por lista (plantillasListas.ts).
          ...(template.detailImageSize ? { backgroundSize: template.detailImageSize } : {}),
          ...(template.detailImagePosition ? { backgroundPosition: template.detailImagePosition } : {}),
        }
      : { background: `linear-gradient(160deg, ${template.gradientFrom} 0%, ${template.gradientTo} 100%)` }
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
            {folder.isCustom ? (
              // Lista propia: la portada se ve como siempre (icono, o la foto si
              // ya tiene) y al tocarla se abre un menú para añadir, cambiar o
              // eliminar la imagen.
              <div className="lista-detalle__cover-wrap" ref={coverMenuRef}>
                <button
                  type="button"
                  className={`lista-detalle__cover lista-detalle__cover--editable${isSavingCover ? ' is-saving' : ''}`}
                  style={coverStyle}
                  onClick={() => setIsCoverMenuOpen((value) => !value)}
                  aria-haspopup="menu"
                  aria-expanded={isCoverMenuOpen}
                  aria-label="Imagen de la lista"
                  disabled={isSavingCover}
                >
                  {!hasImage ? (
                    <span className="lista-detalle__cover-icon" aria-hidden="true">
                      <TemplateIcon name={template.icon} />
                    </span>
                  ) : null}
                  {isSavingCover ? <span className="lista-detalle__cover-spinner" aria-hidden="true" /> : null}
                </button>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="lista-detalle__cover-input"
                  onChange={handleCoverFile}
                  tabIndex={-1}
                  aria-hidden="true"
                />

                {isCoverMenuOpen ? (
                  <div className="library-audio-row__menu lista-detalle__cover-menu" role="menu">
                    <button type="button" className="library-audio-row__menu-item" role="menuitem" onClick={handlePickCover}>
                      <span className="library-audio-row__menu-item-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="5" width="18" height="14" rx="3" />
                          <circle cx="9" cy="10" r="1.6" />
                          <path d="m21 16-5-5-8 8" />
                        </svg>
                      </span>
                      {coverImage ? 'Cambiar imagen' : 'Añadir imagen'}
                    </button>
                    {coverImage ? (
                      <button
                        type="button"
                        className="library-audio-row__menu-item library-audio-row__menu-item--danger"
                        role="menuitem"
                        onClick={handleRemoveCover}
                      >
                        <span className="library-audio-row__menu-item-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7h16" />
                            <path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
                            <path d="M9 7V4h6v3" />
                          </svg>
                        </span>
                        Eliminar imagen
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="lista-detalle__cover" style={coverStyle}>
                {!hasImage ? (
                  <span className="lista-detalle__cover-icon" aria-hidden="true">
                    <TemplateIcon name={template.icon} />
                  </span>
                ) : null}
              </div>
            )}

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
          <button type="button" className="lista-detalle__add-button" onClick={() => setIsAddPanelOpen(true)}>
            Añadir audios
          </button>

          {folder.isCustom ? <ListaOptionsMenu onRename={handleRename} onDelete={handleDelete} /> : null}
        </div>

        {/* Hoja a pantalla completa (se pinta en <body>, encima de todo). */}
        {isAddPanelOpen ? (
          <PanelAnadirAudios
            folder={folder}
            audios={audios}
            error={actionError}
            onToggleAudio={handleToggleAudio}
            onClose={() => setIsAddPanelOpen(false)}
          />
        ) : null}
        {actionError && !isAddPanelOpen ? <p className="lista-detalle__error">{actionError}</p> : null}

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
                isFavorite={audio.isFavorite}
                onDelete={() => handleDeleteTrack(audio)}
                onToggleFavorite={() => alternarFavorito(audio)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ListaDetalle
