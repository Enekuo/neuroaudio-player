import { useUserPlan } from '../../../dashboard/context/UserPlanContext'
import SettingsIcon from '../SettingsIcon'

function SeccionPlan() {
  const { userPlan } = useUserPlan()
  const isPremium = userPlan === 'premium'

  return (
    <div className="settings-section">
      <h3>Plan</h3>
      <p className="settings-section__intro">El plan que tienes activo ahora mismo en tu cuenta.</p>

      <div className="settings-plan-card">
        <span className="settings-plan-card__icon" aria-hidden="true">
          <SettingsIcon name="plan" />
        </span>
        <div>
          <p className="settings-plan-card__label">Tu plan actual</p>
          <p className="settings-plan-card__value">{isPremium ? 'Premium' : 'Free'}</p>
        </div>
        <span className={`settings-plan-card__badge${isPremium ? ' is-premium' : ''}`}>
          {isPremium ? 'Premium' : 'Gratis'}
        </span>
      </div>

      <p className="settings-section__hint">Gestión de suscripción próximamente.</p>
    </div>
  )
}

export default SeccionPlan
