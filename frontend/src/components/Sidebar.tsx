import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  RefreshCw,
  PiggyBank,
  X,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

const navItems: NavItem[] = [
  { to: '/dashboard',         icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/lancamentos',       icon: <ArrowLeftRight size={18} />,  label: 'Lançamentos' },

  { to: '/contas-gerenciais', icon: <BookOpen size={18} />,        label: 'Contas Gerenciais' },
  { to: '/recorrencias',      icon: <RefreshCw size={18} />,       label: 'Recorrências' },
  { to: '/reservas',          icon: <PiggyBank size={18} />,       label: 'Reservas' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  // Fecha com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Trava scroll do body quando aberta
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
   
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
          transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

    
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={`
          fixed top-0 left-0 z-50 h-full w-72
          bg-white shadow-2xl rounded-r-2xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 flex-shrink-0">
          <span className="font-semibold text-lg tracking-tight text-slate-800 select-none">
            Fin<span className="text-blue-600">Cont</span>
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 select-none">FinCont v0.1</p>
        </div>
      </aside>
    </>
  )
}
