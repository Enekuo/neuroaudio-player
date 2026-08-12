import { useUserPlan } from '../context/UserPlanContext'

function PlanSwitcher() {
  const { userPlan, setUserPlan } = useUserPlan()

  return (
    <div className="plan-switcher" role="group" aria-label="Selector de plan de prueba">
      <button
        type="button"
        className={`plan-switcher__chip ${userPlan === 'free' ? 'is-active' : ''}`}
        onClick={() => setUserPlan('free')}
      >
        Free
      </button>
      <button
        type="button"
        className={`plan-switcher__chip ${userPlan === 'premium' ? 'is-active' : ''}`}
        onClick={() => setUserPlan('premium')}
      >
        Premium
      </button>
    </div>
  )
}

export default PlanSwitcher
