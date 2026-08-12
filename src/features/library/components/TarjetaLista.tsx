import LibraryIcon from './LibraryIcon'

type TarjetaListaProps = {
  name: string
  audioCount: number
  accent: string
  icon: 'moon' | 'cloud' | 'spark' | 'wave' | 'music' | 'plus'
}

function TarjetaLista({ name, audioCount, accent, icon }: TarjetaListaProps) {
  return (
    <article className="library-playlist-card">
      <div className="library-playlist-card__icon" style={{ background: accent }}>
        <span aria-hidden="true">
          <LibraryIcon name={icon} />
        </span>
      </div>
      <div className="library-playlist-card__content">
        <h3>{name}</h3>
        <p>{audioCount} audios</p>
      </div>
    </article>
  )
}

export default TarjetaLista
