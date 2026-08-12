import PlanSwitcher from './PlanSwitcher'
import { categories } from '../data/categories'
import { useUserPlan } from '../context/UserPlanContext'

function DashboardCategories() {
  const { userPlan } = useUserPlan()

  return (
    <section className="dashboard-home" aria-label="Inicio del dashboard">
      <div className="dashboard-home__header">
        <div>
          <p className="dashboard-home__eyebrow">
            Acceso {userPlan === 'premium' ? 'Premium' : 'Gratis'}
          </p>
          <h1>Tu espacio de calma</h1>
          <p className="dashboard-home__subtitle">
            Descubre categorías pensadas para ayudarte a descansar, enfocar y sentirte mejor.
          </p>
        </div>

        <PlanSwitcher />
      </div>

      <div className="dashboard-home__grid">
        {categories.map((category) => (
          <button key={category.id} type="button" className="dashboard-category-card">
            <div className="dashboard-category-card__visual" style={{ background: category.gradient }}>
              <span aria-hidden="true">{category.icon}</span>
            </div>
            <div className="dashboard-category-card__content">
              <h2>{category.name}</h2>
              <p>{category.description}</p>
            </div>
            <span className="dashboard-category-card__action">Abrir</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default DashboardCategories
