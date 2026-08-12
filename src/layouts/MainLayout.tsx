import { Outlet } from 'react-router-dom'
import MenuLateral from '../features/library/components/MenuLateral'

function MainLayout() {
  return (
    <div className="app-shell app-shell--library">
      <MenuLateral />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
