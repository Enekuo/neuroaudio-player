import { NavLink } from 'react-router-dom'

const navigationItems = [
  { to: '/app', label: 'Inicio' },
  { to: '/app/explorar', label: 'Explorar' },
  { to: '/app/biblioteca', label: 'Biblioteca' },
]

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="sidebar__brand">NeuroAudio</div>
      <nav className="sidebar__nav">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' is-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
