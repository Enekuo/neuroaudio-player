import { getTemplateById, type LibraryFolder } from '../data/plantillasListas'
import TemplateIcon from './TemplateIcon'

type TemplateGridProps = {
  folders: LibraryFolder[]
  activeKey?: string | null
  disabled?: boolean
  onOpen: (folder: LibraryFolder) => void
  onCreateCustom: () => void
}

const WAVE_POINTS =
  '0,10 44,10 50,7 54,13 58,4 62,16 66,8 70,12 74,2 78,18 82,6 86,14 90,9 94,11 98,3 102,17 106,7 110,13 114,5 118,15 122,9 126,11 130,8 134,12 140,10 200,10'

function WaveIcon() {
  return (
    <svg className="template-card__wave" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={WAVE_POINTS} />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function TemplateGrid({ folders, activeKey, disabled, onOpen, onCreateCustom }: TemplateGridProps) {
  return (
    <div className="template-grid">
      {folders.map((folder) => {
        const template = getTemplateById(folder.template)
        const hasImage = Boolean(template.cardImage)
        const isActive = folder.key === activeKey
        const audioLabel = folder.count === 1 ? '1 audio' : `${folder.count} audios`

        return (
          <button
            key={folder.key}
            type="button"
            className={`template-card${hasImage ? ' template-card--has-image' : ''}${isActive ? ' is-selected' : ''}`}
            onClick={() => onOpen(folder)}
            disabled={disabled}
          >
            {hasImage ? (
              <>
                <span
                  className="template-card__bg"
                  style={{
                    backgroundImage: `url(${template.cardImage})`,
                    ...(template.cardImageSize ? { backgroundSize: `${template.cardImageSize}%` } : {}),
                    ...(template.cardImagePosition ? { backgroundPosition: template.cardImagePosition } : {}),
                  }}
                  aria-hidden="true"
                />
                <span className="template-card__bg-overlay" aria-hidden="true" />
              </>
            ) : (
              <span className="template-card__icon" aria-hidden="true">
                <TemplateIcon name={template.icon} />
              </span>
            )}

            <div className="template-card__meta">
              <span className="template-card__label">{folder.name}</span>
              <span className="template-card__count">{audioLabel}</span>
            </div>

            <WaveIcon />

            <span className="template-card__chevron" aria-hidden="true">
              <ChevronIcon />
            </span>
          </button>
        )
      })}

      <button
        type="button"
        className="template-card template-card--custom"
        onClick={onCreateCustom}
        disabled={disabled}
      >
        <span className="template-card__icon" aria-hidden="true">
          <TemplateIcon name="plus" />
        </span>
        <span className="template-card__label">Nueva lista</span>
      </button>
    </div>
  )
}

export default TemplateGrid
