import { useEffect, useState, useCallback } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, Loader2 } from 'lucide-react'
import { lancamentosService } from '../services/lancamentos.service'
import type { Lancamento } from '../services/lancamentos.service'


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
  if (abs >= 1_000)     return `${(v / 1_000).toFixed(0)} Mil`
  return v.toFixed(0)
}
// Gera meses entre duas datas (inclusivo), máximo 24 meses
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
  // entradas são positivas, saidas são negativas no gráfico
  entradas: number
  saidas: number    // valor negativo para barra abaixo do zero
  saldo: number
}

type ChartVis = 'ambos' | 'receber' | 'pagar'

interface Summary {
  totalEntradas: number; totalSaidas: number; saldo: number
  totalPago: number; totalRecebido: number
  qEntradas: number; qSaidas: number; qAberto: number
}


function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs min-w-[170px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => {
        const v = Math.abs(p.value)
        return (
          <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1.5" style={{ color: p.fill ?? p.color ?? p.stroke }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill ?? p.color ?? p.stroke }} />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums" style={{ color: p.fill ?? p.color ?? p.stroke }}>
              R$ {fmtMoney(v)}
            </span>
          </div>
        )
      })}
    </div>
  )
}


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


export default function DashboardPage() {
  const [periodoIni, setPeriodoIni] = useState(primeiroDiaMes())
  const [periodoFim, setPeriodoFim] = useState(ultimoDiaMes())
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading]         = useState(true)
  const [chartData, setChartData]       = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const [chartVis, setChartVis]         = useState<ChartVis>('ambos')

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
    finally  { setChartLoading(false) }
  }, [periodoIni, periodoFim])

  useEffect(() => { loadPeriodo() }, [loadPeriodo])
  useEffect(() => { loadChart() },   [loadChart])

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

  const inp = 'h-8 px-3 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white text-slate-700 transition-colors'
  const visOpts: { v: ChartVis; label: string }[] = [
    { v: 'ambos', label: 'Ambos' }, { v: 'receber', label: 'A Receber' }, { v: 'pagar', label: 'A Pagar' },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* header e periodo */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 text-xs mt-0.5">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Período</span>
          <input type="date" value={periodoIni} onChange={e => setPeriodoIni(e.target.value)} className={inp} />
          <span className="text-xs text-slate-400">a</span>
          <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className={inp} />
        </div>
      </div>

      {/* KPI Cards */}
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
      <div className="bg-white border border-slate-200 rounded-xl px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Entradas × Saídas</h3>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">Saldo do mês · {mesLabel(periodoIni)}{periodoIni.slice(0,7) !== periodoFim.slice(0,7) ? ` → ${mesLabel(periodoFim)}` : ''}</span>
          </div>
          {/* filtro de visibilidade */}
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
                <Bar dataKey="entradas" name="Entradas" fill="#6366f1" fillOpacity={0.88}
                
                  stackId="fluxo" radius={[4, 4, 0, 0]} barSize={35}/>
              )}
              {(chartVis === 'ambos' || chartVis === 'pagar') && (
                <Bar dataKey="saidas" name="Saídas" fill="#f43f5e" fillOpacity={0.88}
                  stackId="fluxo" radius={[0, 0, 4, 4]} barSize={35}/>
              )}

              {/* linha que mostra o saldo */}
              <Line type="monotone" dataKey="saldo" name="Saldo"
                stroke="#0f172a" strokeWidth={2}
                dot={{ fill: '#0f172a', r: 3.5, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* resumo do periodor */}
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
  )
}
