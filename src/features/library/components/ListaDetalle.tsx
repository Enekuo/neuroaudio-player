import { getTemplateById } from '../data/plantillasListas'
import type { LibraryLista } from '../hooks/useUserListas'
import LibraryIcon from './LibraryIcon'
import ListaOptionsMenu from './ListaOptionsMenu'
import TemplateIcon from './TemplateIcon'

type ListaDetalleProps = {
  lista: LibraryLista
  onBack: () => void
  onRename: () => void
  onDelete: () => void
}

function ListaDetalle({ lista, onBack, onRename, onDelete }: ListaDetalleProps) {
  const template = getTemplateById(lista.template)

  return (
    <div className="lista-detail">
      <button type="button" className="lista-detail__back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Volver a listas
      </button>

      <div
        className="lista-detail__header"
        style={{ background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.gradientTo})` }}
      >
        <span className="lista-detail__icon" aria-hidden="true">
          <TemplateIcon name={template.icon} />
        </span>
        <h2>{lista.name}</h2>

        <ListaOptionsMenu className="lista-detail__options" onRename={onRename} onDelete={onDelete} />
      </div>

      <div className="library-empty-state" role="status">
        <div className="library-empty-state__icon" aria-hidden="true">
          <LibraryIcon name="music" />
        </div>
        <h2>Esta lista aún no tiene audios</h2>
        <p>Pronto podrás añadir audios a tus listas.</p>
      </div>
    </div>
  )
}

export default ListaDetalle
