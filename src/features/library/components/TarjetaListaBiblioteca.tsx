import { getTemplateById } from '../data/plantillasListas'
import type { LibraryLista } from '../hooks/useUserListas'
import TemplateIcon from './TemplateIcon'

type TarjetaListaBibliotecaProps = {
  lista: LibraryLista
}

function TarjetaListaBiblioteca({ lista }: TarjetaListaBibliotecaProps) {
  const template = getTemplateById(lista.template)

  return (
    <button
      type="button"
      className="library-list-card"
      style={{ background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.gradientTo})` }}
    >
      <span className="library-list-card__icon" aria-hidden="true">
        <TemplateIcon name={template.icon} />
      </span>
      <span className="library-list-card__name">{lista.name}</span>
    </button>
  )
}

export default TarjetaListaBiblioteca
