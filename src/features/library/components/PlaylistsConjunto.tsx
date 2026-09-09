import { useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { usePlayer } from '../../player/context/PlayerContext'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { useUserListas } from '../hooks/useUserListas'
import { formatTime } from '../utils/formatTime'
import { crearLista, eliminarLista, guardarAudiosDeLista } from '../services/listaService'

const PLAYLIST_TEMPLATE = 'playlist'

type PlaylistsConjuntoProps = {
  audios: LibraryAudio[]
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 6.5v11l9-5.5-9-5.5z" />
    </svg>
  )
}

/**
 * Creador y lista de playlists dentro de "Audios conjuntos".
 *
 * Flujo: botón "Crear playlist" -> panel con todos los audios; al pulsarlos se
 * numeran 1, 2, 3... en el orden de pulsación -> "Guardar" crea una lista
 * (template 'playlist') con el array `audioIds` en ese orden.
 *
 * Cada playlist guardada tiene un botón de play: reproduce el primer audio con
 * la playlist entera como cola; el reproductor global avanza solo al siguiente
 * cuando cada uno acaba (comportamiento tipo Spotify).
 */
function PlaylistsConjunto({ audios }: PlaylistsConjuntoProps) {
  const { user } = useAuth()
  const { listas } = useUserListas()
  const { playTrack } = usePlayer()

  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playlists = listas.filter((lista) => lista.template === PLAYLIST_TEMPLATE)

  function resetCreator() {
    setIsCreating(false)
    setName('')
    setOrderedIds([])
    setError(null)
  }

  function toggleAudio(audioId: string) {
    setError(null)
    setOrderedIds((current) =>
      current.includes(audioId) ? current.filter((id) => id !== audioId) : [...current, audioId],
    )
  }

  async function handleSave() {
    if (!user || isSaving) {
      return
    }

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Ponle un nombre a la playlist.')
      return
    }
    if (orderedIds.length === 0) {
      setError('Añade al menos un audio.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const listaId = await crearLista({ uid: user.uid, name: trimmed, template: PLAYLIST_TEMPLATE })
      await guardarAudiosDeLista(listaId, orderedIds)
      resetCreator()
    } catch {
      setError('No se pudo guardar la playlist. Inténtalo de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  function handlePlay(audioIds: string[]) {
    const orderedAudios = audioIds
      .map((id) => audios.find((audio) => audio.id === id))
      .filter((audio): audio is LibraryAudio => Boolean(audio))

    if (orderedAudios.length > 0) {
      playTrack(orderedAudios[0], orderedAudios)
    }
  }

  async function handleDelete(listaId: string, listaName: string) {
    const confirmed = window.confirm(`¿Eliminar la playlist "${listaName}"?`)
    if (!confirmed) {
      return
    }
    try {
      await eliminarLista(listaId)
    } catch {
      setError('No se pudo eliminar la playlist.')
    }
  }

  return (
    <div className="playlists-conjunto">
      <div className="playlists-conjunto__head">
        <h3 className="playlists-conjunto__title">Playlists</h3>
        {!isCreating ? (
          <button
            type="button"
            className="playlists-conjunto__new"
            onClick={() => setIsCreating(true)}
          >
            + Crear playlist
          </button>
        ) : null}
      </div>

      {isCreating ? (
        <div className="playlist-creator" role="region" aria-label="Crear playlist">
          <input
            type="text"
            className="playlist-creator__name"
            placeholder="Nombre de la playlist"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
          />

          <p className="playlist-creator__hint">
            Pulsa los audios en el orden en que quieres que suenen.
          </p>

          {audios.length === 0 ? (
            <p className="playlist-creator__empty">Aún no tienes audios.</p>
          ) : (
            <ul className="playlist-creator__list">
              {audios.map((audio) => {
                const position = orderedIds.indexOf(audio.id)
                const selected = position >= 0

                return (
                  <li key={audio.id}>
                    <button
                      type="button"
                      className={`playlist-creator__item${selected ? ' is-selected' : ''}`}
                      onClick={() => toggleAudio(audio.id)}
                      aria-pressed={selected}
                    >
                      <span className="playlist-creator__badge" aria-hidden="true">
                        {selected ? position + 1 : ''}
                      </span>
                      <span className="playlist-creator__item-name">{audio.name}</span>
                      {audio.duration ? (
                        <span className="playlist-creator__item-time">{formatTime(audio.duration)}</span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {error ? <p className="playlist-creator__error">{error}</p> : null}

          <div className="playlist-creator__actions">
            <button
              type="button"
              className="playlist-creator__save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="playlist-creator__cancel" onClick={resetCreator}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {!isCreating && error ? <p className="playlist-creator__error">{error}</p> : null}

      {playlists.length > 0 ? (
        <ul className="playlists-conjunto__list">
          {playlists.map((lista) => (
            <li key={lista.id} className="playlist-row">
              <button
                type="button"
                className="playlist-row__play"
                onClick={() => handlePlay(lista.audioIds)}
                aria-label={`Reproducir ${lista.name}`}
              >
                <PlayIcon />
              </button>
              <span className="playlist-row__info">
                <span className="playlist-row__name">{lista.name}</span>
                <span className="playlist-row__count">
                  {lista.audioIds.length} {lista.audioIds.length === 1 ? 'audio' : 'audios'}
                </span>
              </span>
              <button
                type="button"
                className="playlist-row__delete"
                onClick={() => handleDelete(lista.id, lista.name)}
                aria-label={`Eliminar ${lista.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : !isCreating ? (
        <p className="playlists-conjunto__empty">Todavía no tienes playlists.</p>
      ) : null}
    </div>
  )
}

export default PlaylistsConjunto
