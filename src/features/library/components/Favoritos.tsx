import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../../player/context/PlayerContext'
import { useUserAudios, type LibraryAudio } from '../hooks/useUserAudios'
import { deleteAudio } from '../services/audioService'
import { alternarFavorito } from '../services/favoritoService'
import FilaAudio from './FilaAudio'

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 6.5v11l9-5.5-9-5.5z" />
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="M4 4l5 5" />
    </svg>
  )
}

// "12 audios · 1 h 24 min" / "1 audio · 8 min"
function formatResumen(total: number, seconds: number) {
  const audiosLabel = total === 1 ? '1 audio' : `${total} audios`
  if (seconds <= 0) {
    return audiosLabel
  }
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const duracion = hours > 0 ? `${hours} h${minutes > 0 ? ` ${minutes} min` : ''}` : `${minutes} min`
  return `${audiosLabel} · ${duracion}`
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function Favoritos() {
  const navigate = useNavigate()
  const { audios, isLoading, error } = useUserAudios()
  const { currentTrack, isPlaying, playTrack } = usePlayer()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // El último marcado como favorito, primero.
  const favoritos = audios
    .filter((audio) => audio.isFavorite)
    .sort((a, b) => (b.favoritedAt?.getTime() ?? 0) - (a.favoritedAt?.getTime() ?? 0))

  const totalSeconds = favoritos.reduce((total, audio) => total + (audio.duration ?? 0), 0)

  function handlePlay(audio: LibraryAudio) {
    playTrack(audio, favoritos)
  }

  function handlePlayAll() {
    if (favoritos.length > 0) {
      playTrack(favoritos[0], favoritos)
    }
  }

  function handleShuffle() {
    if (favoritos.length > 0) {
      const mezclados = shuffle(favoritos)
      playTrack(mezclados[0], mezclados)
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

  return (
    <section className="library-screen favoritos-screen" aria-label="Favoritos">
      <div className="library-screen__content">
        <header className="favoritos-hero">
          <div className="favoritos-hero__badge" aria-hidden="true">
            <HeartIcon filled />
          </div>
          <div className="favoritos-hero__info">
            <h1>Favoritos</h1>
            <p>{isLoading ? 'Cargando...' : formatResumen(favoritos.length, totalSeconds)}</p>
          </div>
        </header>

        {!isLoading && favoritos.length > 0 ? (
          <div className="favoritos-actions">
            <button type="button" className="favoritos-actions__play" onClick={handlePlayAll}>
              <PlayIcon />
              Reproducir
            </button>
            <button
              type="button"
              className="favoritos-actions__shuffle"
              onClick={handleShuffle}
              disabled={favoritos.length < 2}
            >
              <ShuffleIcon />
              Aleatorio
            </button>
          </div>
        ) : null}

        {error ? <p className="library-screen__error">{error}</p> : null}
        {deleteError ? <p className="library-screen__error">{deleteError}</p> : null}

        {isLoading ? (
          <p className="library-screen__loading">Cargando tus favoritos...</p>
        ) : favoritos.length === 0 ? (
          <div className="library-empty-state favoritos-empty" role="status">
            <div className="library-empty-state__icon" aria-hidden="true">
              <HeartIcon />
            </div>
            <h2>Aún no tienes favoritos</h2>
            <p>
              Toca los tres puntos de cualquier audio y elige «Marcar como favorito» para
              encontrarlo aquí rápidamente.
            </p>
            <div className="library-empty-state__actions">
              <button
                type="button"
                className="library-empty-state__button library-empty-state__button--primary"
                onClick={() => navigate('/app/biblioteca?tab=general')}
              >
                Ir a mi biblioteca
              </button>
            </div>
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
