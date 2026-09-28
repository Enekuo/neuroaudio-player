type MenuOpcionesAudioProps = {
  isFavorite?: boolean
  onAddToList: () => void
  onFavorite: () => void
  onDelete: () => void
}

// Desplegable de opciones de un audio (Añadir a la lista / Favorito /
// Eliminar). Lo comparten las filas de audio de la biblioteca y el botón de
// tres puntos del reproductor a pantalla completa.
function MenuOpcionesAudio({ isFavorite = false, onAddToList, onFavorite, onDelete }: MenuOpcionesAudioProps) {
  return (
    <div className="library-audio-row__menu" role="menu">
      <button
        type="button"
        className="library-audio-row__menu-item"
        role="menuitem"
        onClick={onAddToList}
      >
        <span className="library-audio-row__menu-item-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h11" />
            <path d="M4 12h11" />
            <path d="M4 18h7" />
            <path d="M18 14v6" />
            <path d="M15 17h6" />
          </svg>
        </span>
        Añadir a la lista
      </button>
      <button
        type="button"
        className="library-audio-row__menu-item"
        role="menuitem"
        onClick={onFavorite}
      >
        <span className="library-audio-row__menu-item-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </span>
        {isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
      </button>
      <button
        type="button"
        className="library-audio-row__menu-item library-audio-row__menu-item--danger"
        role="menuitem"
        onClick={onDelete}
      >
        <span className="library-audio-row__menu-item-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16" />
            <path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
            <path d="M9 7V4h6v3" />
          </svg>
        </span>
        Eliminar
      </button>
    </div>
  )
}

export default MenuOpcionesAudio
