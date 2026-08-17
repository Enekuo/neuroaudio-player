import { Outlet } from 'react-router-dom'
import MenuLateral from '../features/library/components/MenuLateral'
import Reproductor from '../features/player/components/Reproductor'

function MainLayout() {
  return (
    <div className="app-shell app-shell--library">
      <MenuLateral />
      <main className="content-area">
        <div className="content-area__scroll">
          <Outlet />
        </div>
        <Reproductor />
      </main>
    </div>
  )
}

export default MainLayout
