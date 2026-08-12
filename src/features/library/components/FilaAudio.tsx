import LibraryIcon from './LibraryIcon'

type FilaAudioProps = {
  title: string
  origin: string
  duration: string
  list: string
  icon: 'moon' | 'cloud' | 'spark' | 'wave' | 'music'
}

function FilaAudio({ title, origin, duration, list, icon }: FilaAudioProps) {
  return (
    <div className="library-audio-row">
      <div className="library-audio-row__main">
        <div className="library-audio-row__thumb" aria-hidden="true">
          <LibraryIcon name={icon} />
        </div>
        <div>
          <h4>{title}</h4>
          <p>
            {origin} · {duration}
          </p>
        </div>
      </div>

      <div className="library-audio-row__meta">
        <span>{list}</span>
        <button type="button" className="library-audio-row__options" aria-label="Opciones">
          ⋯
        </button>
      </div>
    </div>
  )
}

export default FilaAudio
