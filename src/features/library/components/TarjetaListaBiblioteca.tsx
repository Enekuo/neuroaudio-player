import { getTemplateById } from '../data/plantillasListas'
import type { LibraryLista } from '../hooks/useUserListas'
import ListaOptionsMenu from './ListaOptionsMenu'
import TemplateIcon from './TemplateIcon'

type TarjetaListaBibliotecaProps = {
  lista: LibraryLista
  audioCount: number
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}

function TarjetaListaBiblioteca({ lista, audioCount, onOpen, onRename, onDelete }: TarjetaListaBibliotecaProps) {
  const template = getTemplateById(lista.template)

  return (
    <div
      className="library-list-card"
      style={{ background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.gradientTo})` }}
    >
      <button type="button" className="library-list-card__main" onClick={onOpen}>
        <span className="library-list-card__icon" aria-hidden="true">
          <TemplateIcon name={template.icon} />
        </span>
        <span className="library-list-card__body">
          <span className="library-list-card__name">{lista.name}</span>
          <span className="library-list-card__count">{audioCount} audios</span>
        </span>
      </button>

      <ListaOptionsMenu className="library-list-card__options" onRename={onRename} onDelete={onDelete} />
    </div>
  )
}

export default TarjetaListaBiblioteca
