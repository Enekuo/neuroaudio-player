import { useState } from 'react'
import { usePlayer } from '../../player/context/PlayerContext'
import { useUserAudios, type LibraryAudio } from '../hooks/useUserAudios'
import { deleteAudio } from '../services/audioService'
import { alternarFavorito } from '../services/favoritoService'
import FilaAudio from './FilaAudio'

// Página de Favoritos con su diseño original (título + estado vacío dentro de
// .page--simple / .favorites-page); cuando hay favoritos, se listan debajo
// del título con las mismas filas que la Biblioteca.
function Favoritos() {
  const { audios, isLoading, error } = useUserAudios()
  const { currentTrack, isPlaying, playTrack } = usePlayer()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // El último marcado como favorito, primero.
  const favoritos = audios
    .filter((audio) => audio.isFavorite)
    .sort((a, b) => (b.favoritedAt?.getTime() ?? 0) - (a.favoritedAt?.getTime() ?? 0))

  function handlePlay(audio: LibraryAudio) {
    playTrack(audio, favoritos)
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
    <section className="page page--simple" aria-label="Favoritos">
      <div className="favorites-page">
        <h1 className="page__title">Favoritos</h1>

        {error ? <p className="library-screen__error">{error}</p> : null}
        {deleteError ? <p className="library-screen__error">{deleteError}</p> : null}

        {isLoading ? (
          <p className="library-screen__loading">Cargando tus favoritos...</p>
        ) : favoritos.length === 0 ? (
          <div className="library-empty-state" role="status">
            <div className="library-empty-state__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2>Aún no tienes favoritos</h2>
            <p>Marca los audios que más te gusten para encontrarlos aquí rápidamente.</p>
          </div>
        ) : (
          <div className="library-section__list library-section__list--plana">
            {favoritos.map((audio) => (
              <FilaAudio
                key={audio.id}
                name={audio.name}
                duration={audio.duration}
                isDeleting={deletingId === audio.id}
                isPlaying={isPlaying && currentTrack?.id === audio.id}
                isFavorite
                hideFavoriteBadge
                onPlay={() => handlePlay(audio)}
                onDelete={() => handleDelete(audio)}
                onToggleFavorite={() => alternarFavorito(audio)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Favoritos
