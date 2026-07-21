import { useEffect, useState, useCallback } from 'react'
import {
  ComposedChart, Bar, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Line,
  PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, Loader2, Plus } from 'lucide-react'
import { lancamentosService } from '../services/lancamentos.service'
import type { Lancamento } from '../services/lancamentos.service'
import { contasGerenciaisService } from '../services/contasGerenciais.service'
import type { ContaGerencial } from '../services/contasGerenciais.service'
import { NovoLancamentoModal } from '../modules/lancamentos/NovoLancamentoModal'

function primeiroDiaMes(ref = new Date()) {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-01`
}
function ultimoDiaMes(ref = new Date()) {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0).toISOString().slice(0, 10)
}
function mesLabel(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}
function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtMoneyShort(v: number) {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} Mi`
  if (abs >= 1_000)     return `${(v / 1_000).toFixed(0)} K`
  return v.toFixed(0)
}
function monthsBetween(iniIso: string, fimIso: string) {
  const result = []
  const start  = new Date(iniIso + 'T12:00:00')
  const end    = new Date(fimIso + 'T12:00:00')
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  let limit = 0
  while (cur <= end && limit < 24) {
    const ini = primeiroDiaMes(cur)
    const fim = ultimoDiaMes(cur)
    result.push({ ini, fim, label: mesLabel(ini) })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    limit++
  }
  return result
}

interface ChartPoint {
  mes: string
  entradas: number
  saidas: number
  saldo: number
}

interface ContaChartPoint {
  codigo: string
  nome: string
  saidas: number
}

interface GrupoChartPoint {
  nome: string
  saidas: number
}

interface StatusChartPoint {
  name: string
  value: number
  color: string
}

type ChartVis = 'ambos' | 'receber' | 'pagar'

interface Summary {
  totalEntradas: number; totalSaidas: number; saldo: number
  totalPago: number; totalRecebido: number
  qEntradas: number; qSaidas: number; qAberto: number
}

const COLOR_ENTRADA = '#10b981'
const COLOR_SAIDA   = '#f43f5e'
const COLOR_SALDO   = '#6366f1'

const STATUS_COLORS: Record<string, string> = {
  aberto:    '#f59e0b',
  pago:      '#10b981',
  recebido:  '#6366f1',
  cancelado: '#94a3b8',
}
const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto', pago: 'Pago', recebido: 'Recebido', cancelado: 'Cancelado',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs min-w-[170px]">
      <p className="font-semibold text-slate-700 mb-2 truncate max-w-[200px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5" style={{ color: p.fill ?? p.color ?? p.stroke }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill ?? p.color ?? p.stroke }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums" style={{ color: p.fill ?? p.color ?? p.stroke }}>
            R$ {fmtMoney(Math.abs(p.value))}
          </span>
        </div>
      ))}
    </div>
  )
}

//tooltip do donut

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-3 py-2 text-xs">
      <p className="font-semibold mb-1" style={{ color: p.payload.color }}>{p.name}</p>
      <p className="tabular-nums text-slate-700">{p.value} lançamento{p.value !== 1 ? 's' : ''}</p>
    </div>
  )
}

//KpiCard
function KpiCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 leading-none mb-1">{label}</p>
        <p className="text-base font-bold tabular-nums text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  )
}

//Label customizado do Donut
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.65
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 10, fontWeight: 600 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// grafico total por conta 
type ContaView = 'valores' | 'barras'

function ContaChart({ data, loading }: { data: ContaChartPoint[]; loading: boolean }) {
  const [view, setView] = useState<ContaView>('valores')
  const barH = Math.max(280, data.length * 38)

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col min-w-0">
      {/* cabeçalho com abas */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-sm font-semibold text-slate-700 shrink-0">Por conta gerencial</h3>
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {(['valores', 'barras'] as ContaView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150
                ${view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {v === 'valores' ? 'Valores' : 'Barras'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" /><span className="text-xs">Carregando...</span>
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">Nenhum dado no período</p>
      ) : view === 'valores' ? (
        <div className="flex flex-col gap-0 overflow-y-auto" style={{ maxHeight: 320 }}>
        
          <div className="grid grid-cols-[1fr_auto] gap-x-3 pb-1.5 mb-1 border-b border-slate-100
                          text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1">
            <span>Conta</span>
            <span className="text-right" style={{ color: COLOR_SAIDA }}>Gasto</span>
          </div>
          {data.map((row) => (
            <div
              key={row.codigo + row.nome}
              className="grid grid-cols-[1fr_auto] gap-x-3 items-center px-1 py-1.5
                         rounded-lg hover:bg-slate-50 transition-colors"
            >
     
              <div className="flex items-center gap-1.5 min-w-0">
                {row.codigo && (
                  <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                    {row.codigo}
                  </span>
                )}
                <span className="text-xs text-slate-700 truncate leading-tight">{row.nome}</span>
              </div>

          
              <span className="text-xs font-semibold tabular-nums text-right shrink-0 text-rose-500">
                R$ {fmtMoney(row.saidas)}
              </span>
            </div>
          ))}

         
          <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center px-1 pt-2 mt-1
                          border-t border-slate-200 text-[11px] font-bold">
            <span className="text-slate-500">Total</span>
            <span className="tabular-nums text-right text-rose-500">
              R$ {fmtMoney(data.reduce((s, r) => s + r.saidas, 0))}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ overflowY: data.length > 8 ? 'auto' : 'visible', maxHeight: 320 }}>
          <ResponsiveContainer width="100%" height={barH}>
            <BarChart
              data={data.map(d => ({ ...d, nome: d.codigo ? `${d.codigo} ${d.nome}` : d.nome }))}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtMoneyShort} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="saidas" name="Gasto" fill={COLOR_SAIDA} fillOpacity={0.9} radius={[0, 3, 3, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// grafico totla por grupo
type GrupoView = 'valores' | 'barras'

function GrupoChart({ data, loading }: { data: GrupoChartPoint[]; loading: boolean }) {
  const [view, setView] = useState<GrupoView>('valores')
  const barH = Math.max(200, data.length * 44)

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col min-w-0">
      {/* cabeçalho com abas */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-sm font-semibold text-slate-700 shrink-0">Por grupo</h3>
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {(['valores', 'barras'] as GrupoView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150
                ${view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {v === 'valores' ? 'Valores' : 'Barras'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" /><span className="text-xs">Carregando...</span>
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">Nenhum dado no período</p>
      ) : view === 'valores' ? (
        <div className="flex flex-col gap-0 overflow-y-auto" style={{ maxHeight: 320 }}>
        
          <div className="grid grid-cols-[1fr_auto] gap-x-3 pb-1.5 mb-1 border-b border-slate-100
                          text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1">
            <span>Grupo</span>
            <span className="text-right" style={{ color: COLOR_SAIDA }}>Gasto</span>
          </div>
          {data.map((row) => (
            <div
              key={row.nome}
              className="grid grid-cols-[1fr_auto] gap-x-3 items-center px-1 py-1.5
                         rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs text-slate-700 truncate leading-tight">{row.nome}</span>
              <span className="text-xs font-semibold tabular-nums text-right shrink-0 text-rose-500">
                R$ {fmtMoney(row.saidas)}
              </span>
            </div>
          ))}

          <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center px-1 pt-2 mt-1
                          border-t border-slate-200 text-[11px] font-bold">
            <span className="text-slate-500">Total</span>
            <span className="tabular-nums text-right text-rose-500">
              R$ {fmtMoney(data.reduce((s, r) => s + r.saidas, 0))}
            </span>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={barH}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtMoneyShort} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="nome" width={110} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="saidas" name="Gasto" fill={COLOR_SAIDA} fillOpacity={0.9} radius={[0, 3, 3, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function StatusDonut({ data, loading, total }: { data: StatusChartPoint[]; loading: boolean; total: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col min-w-0">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Status dos lançamentos</h3>
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" /><span className="text-xs">Carregando...</span>
        </div>
      ) : total === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">Nenhum dado no período</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                  dataKey="value" nameKey="name" paddingAngle={2}
                  labelLine={false} label={DonutLabel}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-800 leading-none">{total}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">total</span>
            </div>
          </div>
         <div className="w-full flex flex-col gap-1.5">
            {data.filter(d => d.value > 0).map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-500">{d.name}</span>
                </span>
                <span className="font-semibold tabular-nums" style={{ color: d.color }}>
                  {d.value} <span className="text-slate-300 font-normal">({((d.value/total)*100).toFixed(0)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [periodoIni, setPeriodoIni] = useState(primeiroDiaMes())
  const [periodoFim, setPeriodoFim] = useState(ultimoDiaMes())
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading]         = useState(true)
  const [chartData, setChartData]       = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const [chartVis, setChartVis]         = useState<ChartVis>('ambos')
  const [showModal, setShowModal]       = useState(false)
  const [contas, setContas]             = useState<ContaGerencial[]>([])

  const loadPeriodo = useCallback(async () => {
    setLoading(true)
    try { setLancamentos(await lancamentosService.findAll({ data_lancamento_ini: periodoIni, data_lancamento_fim: periodoFim })) }
    catch { setLancamentos([]) }
    finally { setLoading(false) }
  }, [periodoIni, periodoFim])

  const loadChart = useCallback(async () => {
    setChartLoading(true)
    try {
      const months = monthsBetween(periodoIni, periodoFim)
      const results = await Promise.all(months.map(m => lancamentosService.findAll({ data_lancamento_ini: m.ini, data_lancamento_fim: m.fim })))
      setChartData(months.map((m, i) => {
        const lst      = results[i]
        const entradas = lst.filter(l => l.tipo === 'receber').reduce((s, l) => s + l.valor, 0)
        const saidas   = lst.filter(l => l.tipo === 'pagar').reduce((s, l)   => s + l.valor, 0)
        return { mes: m.label, entradas, saidas: -saidas, saldo: entradas - saidas }
      }))
    } catch { setChartData([]) }
    finally { setChartLoading(false) }
  }, [periodoIni, periodoFim])

  useEffect(() => { loadPeriodo() }, [loadPeriodo])
  useEffect(() => { loadChart() },   [loadChart])
  useEffect(() => { contasGerenciaisService.findAll().then(setContas).catch(() => {}) }, [])

  const summary: Summary = {
    totalEntradas: lancamentos.filter(l => l.tipo === 'receber').reduce((s, l) => s + l.valor, 0),
    totalSaidas:   lancamentos.filter(l => l.tipo === 'pagar').reduce((s, l)   => s + l.valor, 0),
    saldo: 0,
    totalPago:     lancamentos.filter(l => l.status === 'pago').reduce((s, l)     => s + (l.valor_pago ?? l.valor), 0),
    totalRecebido: lancamentos.filter(l => l.status === 'recebido').reduce((s, l) => s + (l.valor_pago ?? l.valor), 0),
    qEntradas: lancamentos.filter(l => l.tipo === 'receber').length,
    qSaidas:   lancamentos.filter(l => l.tipo === 'pagar').length,
    qAberto:   lancamentos.filter(l => l.status === 'aberto').length,
  }
  summary.saldo = summary.totalEntradas - summary.totalSaidas

  const contaData: ContaChartPoint[] = (() => {
    const map = new Map<number, ContaChartPoint>()
    for (const l of lancamentos) {
      if (l.tipo !== 'pagar') continue
      const id     = l.conta_gerencial_id
      const codigo = String(l.contas_gerenciais?.codigo ?? '')
      const nome   = l.contas_gerenciais?.descricao ?? `Conta ${id}`
      if (!map.has(id)) map.set(id, { codigo, nome, saidas: 0 })
      map.get(id)!.saidas += l.valor
    }
    return [...map.values()].sort((a, b) => b.saidas - a.saidas)
  })()

  const grupoData: GrupoChartPoint[] = (() => {
    const map = new Map<string, GrupoChartPoint>()
    for (const l of lancamentos) {
      if (l.tipo !== 'pagar') continue
      const nome = l.contas_gerenciais?.grupos?.descricao ?? 'Sem grupo'
      if (!map.has(nome)) map.set(nome, { nome, saidas: 0 })
      map.get(nome)!.saidas += l.valor
    }
    return [...map.values()].sort((a, b) => b.saidas - a.saidas)
  })()

  const statusData: StatusChartPoint[] = (['aberto', 'pago', 'recebido', 'cancelado'] as const).map(s => ({
    name:  STATUS_LABELS[s],
    value: lancamentos.filter(l => l.status === s).length,
    color: STATUS_COLORS[s],
  }))
  const totalLanc = lancamentos.length

  const inp = 'h-8 px-3 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white text-slate-700 transition-colors'
  const visOpts: { v: ChartVis; label: string }[] = [
    { v: 'ambos', label: 'Ambos' }, { v: 'receber', label: 'A Receber' }, { v: 'pagar', label: 'A Pagar' },
  ]

  return (
    <>
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 text-xs mt-0.5">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 hover:scale-110 transition-colors"
          >
            <Plus size={13} /> Novo
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Período</span>
          <input type="date" value={periodoIni} onChange={e => setPeriodoIni(e.target.value)} className={inp} />
          <span className="text-xs text-slate-400">a</span>
          <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className={inp} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
          <Loader2 size={16} className="animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label={`Entradas · ${summary.qEntradas}`} value={`R$ ${fmtMoney(summary.totalEntradas)}`} color="bg-emerald-50" icon={<TrendingUp size={18} className="text-emerald-600" />} />
          <KpiCard label={`Saídas · ${summary.qSaidas}`}     value={`R$ ${fmtMoney(summary.totalSaidas)}`}   color="bg-rose-50"    icon={<TrendingDown size={18} className="text-rose-500" />} />
          <KpiCard label="Saldo previsto" value={`R$ ${fmtMoney(summary.saldo)}`} color={summary.saldo >= 0 ? 'bg-blue-50' : 'bg-amber-50'} icon={<Wallet size={18} className={summary.saldo >= 0 ? 'text-blue-600' : 'text-amber-500'} />} />
          <KpiCard label={`Em aberto · ${summary.qAberto}`}  value={`R$ ${fmtMoney(summary.totalPago + summary.totalRecebido)}`} color="bg-slate-100" icon={<ArrowLeftRight size={18} className="text-slate-500" />} />
        </div>
      )}

  {/* graf ComposedChart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ContaChart  data={contaData}  loading={loading} />
        <GrupoChart  data={grupoData}  loading={loading} />
        <StatusDonut data={statusData} loading={loading} total={totalLanc} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Entradas × Saídas</h3>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">
              {mesLabel(periodoIni)}{periodoIni.slice(0,7) !== periodoFim.slice(0,7) ? ` → ${mesLabel(periodoFim)}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {visOpts.map(o => (
              <button key={o.v} onClick={() => setChartVis(o.v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150
                  ${chartVis === o.v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {chartLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 size={18} className="animate-spin" /><span className="text-sm">Carregando gráfico...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} stackOffset="sign" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              barCategoryGap="35%" barGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtMoneyShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={58} />
              <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1.5} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
              {(chartVis === 'ambos' || chartVis === 'receber') && (
                <Bar dataKey="entradas" name="Entradas" fill={COLOR_ENTRADA} fillOpacity={0.88}
                  stackId="fluxo" radius={[4, 4, 0, 0]} barSize={35} />
              )}
              {(chartVis === 'ambos' || chartVis === 'pagar') && (
                <Bar dataKey="saidas" name="Saídas" fill={COLOR_SAIDA} fillOpacity={0.88}
                  stackId="fluxo" radius={[0, 0, 4, 4]} barSize={35} />
              )}
              <Line type="monotone" dataKey="saldo" name="Saldo"
                stroke={COLOR_SALDO} strokeWidth={2}
                dot={{ fill: COLOR_SALDO, r: 3.5, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-[11px] text-slate-500 mb-3 font-medium uppercase tracking-wide">A Receber no período</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Aberto',    v: lancamentos.filter(l => l.tipo==='receber'&&l.status==='aberto').reduce((s,l)=>s+l.valor,0), fmt:'money', cls:'text-amber-600' },
                { label: 'Recebido', v: lancamentos.filter(l => l.tipo==='receber'&&l.status==='recebido').reduce((s,l)=>s+(l.valor_pago??l.valor),0), fmt:'money', cls:'text-emerald-600' },
                { label: 'Cancelado',v: lancamentos.filter(l => l.tipo==='receber'&&l.status==='cancelado').length, fmt:'count', cls:'text-slate-400' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`font-semibold tabular-nums ${row.cls}`}>
                    {row.fmt==='count' ? `${row.v} título${row.v!==1?'s':''}` : `R$ ${fmtMoney(row.v)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-[11px] text-slate-500 mb-3 font-medium uppercase tracking-wide">A Pagar no período</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Aberto',    v: lancamentos.filter(l => l.tipo==='pagar'&&l.status==='aberto').reduce((s,l)=>s+l.valor,0), fmt:'money', cls:'text-amber-600' },
                { label: 'Pago',      v: lancamentos.filter(l => l.tipo==='pagar'&&l.status==='pago').reduce((s,l)=>s+(l.valor_pago??l.valor),0), fmt:'money', cls:'text-emerald-600' },
                { label: 'Cancelado', v: lancamentos.filter(l => l.tipo==='pagar'&&l.status==='cancelado').length, fmt:'count', cls:'text-slate-400' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`font-semibold tabular-nums ${row.cls}`}>
                    {row.fmt==='count' ? `${row.v} título${row.v!==1?'s':''}` : `R$ ${fmtMoney(row.v)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-[11px] text-slate-500 mb-3 font-medium uppercase tracking-wide">Liquidez</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Total recebido',  v: summary.totalRecebido, cls: 'text-emerald-600' },
                { label: 'Total pago',      v: summary.totalPago,     cls: 'text-rose-500' },
                { label: 'Resultado caixa', v: summary.totalRecebido - summary.totalPago, cls: (summary.totalRecebido-summary.totalPago)>=0?'text-blue-600':'text-rose-500' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`font-semibold tabular-nums ${row.cls}`}>R$ {fmtMoney(row.v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>

    {showModal && (
      <NovoLancamentoModal
        contas={contas}
        onClose={() => setShowModal(false)}
        onSuccess={() => { setShowModal(false); loadPeriodo(); loadChart() }}
      />
    )}
    </>
  )
}
