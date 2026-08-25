import { LIST_TEMPLATES, CUSTOM_TEMPLATE, type ListTemplate } from '../data/plantillasListas'
import TemplateIcon from './TemplateIcon'

type TemplateGridProps = {
  selectedId?: string
  disabled?: boolean
  onSelect: (template: ListTemplate) => void
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function TemplateGrid({ selectedId, disabled, onSelect }: TemplateGridProps) {
  return (
    <div className="template-grid">
      {LIST_TEMPLATES.map((template) => {
        const isSelected = selectedId === template.id
        return (
          <button
            key={template.id}
            type="button"
            className={`template-card${isSelected ? ' is-selected' : ''}`}
            onClick={() => onSelect(template)}
            disabled={disabled}
          >
            <span className="template-card__icon" aria-hidden="true">
              <TemplateIcon name={template.icon} />
            </span>

            <div className="template-card__meta">
              <span className="template-card__label">{template.label}</span>
              <span className="template-card__count">0 audios</span>
            </div>

            <WaveIcon />

            {isSelected ? (
              <span className="template-card__check" aria-hidden="true">
                <CheckIcon />
              </span>
            ) : (
              <span className="template-card__chevron" aria-hidden="true">
                <ChevronIcon />
              </span>
            )}
          </button>
        )
      })}

      <button
        type="button"
        className={`template-card template-card--custom${selectedId === CUSTOM_TEMPLATE.id ? ' is-selected' : ''}`}
        onClick={() => onSelect(CUSTOM_TEMPLATE)}
        disabled={disabled}
      >
        {selectedId === CUSTOM_TEMPLATE.id ? (
          <span className="template-card__check" aria-hidden="true">
            <CheckIcon />
          </span>
        ) : null}
        <span className="template-card__icon" aria-hidden="true">
          <TemplateIcon name="plus" />
        </span>
        <span className="template-card__label">{CUSTOM_TEMPLATE.label}</span>
      </button>
    </div>
  )
}

export default TemplateGrid
