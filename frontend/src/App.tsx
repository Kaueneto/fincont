import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './routes/DashboardPage'
import GruposPage from './modules/grupos/GruposPage'
import ContasGerenciaisPage from './modules/contas-gerenciais/ContasGerenciaisPage'
import LancamentosPage from './modules/lancamentos/LancamentosPage'
import RecorrenciasPage from './modules/recorrencias/RecorrenciasPage'
import ReservasPage from './modules/reservas/ReservasPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"         element={<DashboardPage />} />
          <Route path="grupos"            element={<GruposPage />} />
          <Route path="contas-gerenciais" element={<ContasGerenciaisPage />} />
          <Route path="lancamentos"       element={<LancamentosPage />} />
          <Route path="recorrencias"      element={<RecorrenciasPage />} />
          <Route path="reservas"          element={<ReservasPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
