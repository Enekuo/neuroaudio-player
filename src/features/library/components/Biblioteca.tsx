import PlanSwitcher from '../../dashboard/components/PlanSwitcher'
import { useUserPlan } from '../../dashboard/context/UserPlanContext'
import LibraryIcon from './LibraryIcon'

function Biblioteca() {
  const { userPlan } = useUserPlan()

  return (
    <section className="library-screen" aria-label="Biblioteca personal">
      <div className="library-screen__content">
        <header className="library-screen__header">
          <div>
            <p className="library-screen__eyebrow">Acceso {userPlan === 'premium' ? 'Premium' : 'Gratis'}</p>
            <h1>Tu biblioteca</h1>
          </div>

          <div className="library-screen__actions">
            <PlanSwitcher />
            <div className="library-screen__avatar" aria-label="Avatar de usuario">
              AG
            </div>
          </div>
        </header>

        <div className="library-empty-state" role="status">
          <div className="library-empty-state__icon" aria-hidden="true">
            <LibraryIcon name="music" />
          </div>
          <h2>Tu biblioteca está vacía</h2>
          <p>
            Añade tu primer audio desde YouTube, un archivo local o un enlace para empezar a construir tu espacio personal.
          </p>
          <div className="library-empty-state__actions">
            <button type="button" className="library-empty-state__button library-empty-state__button--primary">
              Añadir tu primer audio
            </button>
            <button type="button" className="library-empty-state__button">
              YouTube
            </button>
            <button type="button" className="library-empty-state__button">
              Archivo
            </button>
            <button type="button" className="library-empty-state__button">
              Enlace
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Biblioteca
