import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

const routeLabels: Record<string, string> = {
  '/dashboard':         'Dashboard',
  '/grupos':            'Grupos',
  '/contas-gerenciais': 'Contas Gerenciais',
  '/lancamentos':       'Lançamentos',
  '/recorrencias':      'Recorrências',
  '/reservas':          'Reservas',
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const pageTitle = routeLabels[location.pathname] ?? 'FinCont'

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col">
      {/* topbar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <span className="text-sm font-medium text-slate-700 select-none">
          {pageTitle}
        </span>
      </header>

      {/* conteudo — sempre 100% da largura */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      <Sidebar open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
