import { useState } from 'react'
import { useSwipeTabs } from '../hooks/useSwipeTabs'

const tabs = [
  { id: 'calendario', label: 'Calendario' },
  { id: 'rutinas', label: 'Rutinas' },
  { id: 'recordatorios', label: 'Recordatorios' },
  { id: 'rachas', label: 'Rachas' },
] as const

type HabitosTab = (typeof tabs)[number]['id']

// Mismo orden visual que las pestañas de arriba, de izquierda a derecha.
const HABITOS_TAB_ORDER: HabitosTab[] = tabs.map((tab) => tab.id)

function HabitosPage() {
  const [activeTab, setActiveTab] = useState<HabitosTab>('calendario')
  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? ''
  const swipeHandlers = useSwipeTabs(HABITOS_TAB_ORDER, activeTab, setActiveTab)

  return (
    <section className="habitos-page" aria-label="Hábitos">
      <div className="habitos-page__content">
        <h1 className="page__title">Hábitos</h1>

        <div className="library-tabs" role="tablist" aria-label="Secciones de Hábitos">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`habitos-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls="habitos-panel"
              className={`library-tabs__tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          key={activeTab}
          className="habitos-page__panel tab-swipe-panel"
          id="habitos-panel"
          role="tabpanel"
          aria-labelledby={`habitos-tab-${activeTab}`}
          {...swipeHandlers}
        >
          <p className="habitos-page__placeholder">{activeLabel} · Próximamente</p>
        </div>
      </div>
    </section>
  )
}

export default HabitosPage
