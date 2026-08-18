import { LIST_TEMPLATES, CUSTOM_TEMPLATE, type ListTemplate } from '../data/plantillasListas'
import TemplateIcon from './TemplateIcon'

type TemplateGridProps = {
  selectedId?: string
  disabled?: boolean
  onSelect: (template: ListTemplate) => void
}

function TemplateGrid({ selectedId, disabled, onSelect }: TemplateGridProps) {
  return (
    <div className="template-grid">
      {LIST_TEMPLATES.map((template) => (
        <button
          key={template.id}
          type="button"
          className={`template-card${selectedId === template.id ? ' is-selected' : ''}`}
          style={{ background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.gradientTo})` }}
          onClick={() => onSelect(template)}
          disabled={disabled}
        >
          {selectedId === template.id ? (
            <span className="template-card__check" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : null}
          <span className="template-card__icon" aria-hidden="true">
            <TemplateIcon name={template.icon} />
          </span>
          <span className="template-card__label">{template.label}</span>
        </button>
      ))}

      <button
        type="button"
        className={`template-card template-card--custom${selectedId === CUSTOM_TEMPLATE.id ? ' is-selected' : ''}`}
        onClick={() => onSelect(CUSTOM_TEMPLATE)}
        disabled={disabled}
      >
        {selectedId === CUSTOM_TEMPLATE.id ? (
          <span className="template-card__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
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
