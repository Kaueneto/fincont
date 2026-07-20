import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Search, Loader2, ArrowLeftRight, X, ChevronUp, ChevronDown, ChevronsUpDown, CheckSquare } from 'lucide-react'
import { lancamentosService } from '../../services/lancamentos.service'
import { contasGerenciaisService } from '../../services/contasGerenciais.service'
import type { Lancamento, LancamentoFilters } from '../../services/lancamentos.service'
import type { ContaGerencial } from '../../services/contasGerenciais.service'
import { NovoLancamentoModal } from './NovoLancamentoModal'
import { SearchableSelect } from '../../components/SearchableSelect'

function primeiroDiaMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function ultimoDiaMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  const [y, m, dd] = iso.slice(0, 10).split('-')
  return `${dd}/${m}/${y}`
}
function fmtMoney(v: number | null) {
  if (v === null || v === undefined) return '0,00'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function diasAteVencer(dataVenc: string | null): number | null {
  if (!dataVenc) return null
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVenc + 'T00:00:00')
  return Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
}

const TIPO_CLASS: Record<string, string> = {
  pagar:   'bg-amber-100 text-amber-600',
  receber: 'bg-emerald-100 text-emerald-700',
}
const TIPO_LABEL: Record<string, string> = { pagar: 'Contas a pagar', receber: 'Contas a receber' }
const STATUS_CLASS: Record<string, string> = {
  aberto:    'bg-amber-50 text-amber-700',
  pago:      'bg-green-50 text-green-700',
  recebido:  'bg-blue-50 text-blue-700',
  cancelado: 'bg-slate-100 text-slate-400',
}
const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto', pago: 'Pago', recebido: 'Recebido', cancelado: 'Cancelado',
}


type ColKey = 'data_lancamento' | 'descricao' | 'valor' | 'data_vencimento' | 'dias' | 'tipo' | 'conta' | 'historico' | 'data_pagamento' | 'valor_pago' | 'status'

interface ColDef {
  key: ColKey
  label: string
  sortable: boolean
  align?: 'left' | 'right' | 'center'
  minW?: number
}

const ALL_COLS: ColDef[] = [
  { key: 'data_lancamento', label: 'Dt. lançamento', sortable: true,  minW: 96 },
  { key: 'descricao',       label: 'Descrição',       sortable: true,  minW: 180 },
  { key: 'valor',           label: 'Valor',            sortable: true,  align: 'right', minW: 90 },
  { key: 'data_vencimento', label: 'Dt. vencimento',  sortable: true,  minW: 96 },
  { key: 'dias',            label: 'Dias',             sortable: true,  align: 'center', minW: 50 },
  { key: 'tipo',            label: 'Tipo',             sortable: true,  minW: 90 },
  { key: 'conta',           label: 'Conta gerencial',  sortable: true,  minW: 150 },

  { key: 'data_pagamento',  label: 'Dt. pagamento',    sortable: true,  minW: 96 },
  { key: 'valor_pago',      label: 'Vlr. pago',        sortable: true,  align: 'right', minW: 90 },
  { key: 'status',          label: 'Status',           sortable: true,  align: 'center', minW: 80 },
]

type SortDir = 'asc' | 'desc'

function getSortValue(l: Lancamento, key: ColKey): string | number | null {
  switch (key) {
    case 'data_lancamento': return l.data_lancamento ?? ''
    case 'descricao':       return l.descricao.toLowerCase()
    case 'valor':           return l.valor
    case 'data_vencimento': return l.data_vencimento ?? ''
    case 'dias':            return diasAteVencer(l.data_vencimento) ?? 99999
    case 'tipo':            return l.tipo
    case 'conta':           return l.contas_gerenciais?.descricao.toLowerCase() ?? ''

    case 'data_pagamento':  return l.data_pagamento ?? ''
    case 'valor_pago':      return l.valor_pago ?? -1
    case 'status':          return l.status
    default:                return ''
  }
}


interface FiltersProps {
  filters: LancamentoFilters
  contas: ContaGerencial[]
  onChange: (f: LancamentoFilters) => void
  onSearch: () => void
  onClear: () => void
}

const inp = 'h-7 px-2 text-xs border border-slate-200 rounded-md outline-none focus:border-blue-500 bg-white text-slate-700'

const TIPO_OPTIONS = [
  { value: '',        label: 'Todos' },
  { value: 'pagar',   label: 'A Pagar' },
  { value: 'receber', label: 'A Receber' },
]

function FilterBar({ filters, contas, onChange, onSearch, onClear }: FiltersProps) {
  function set(key: keyof LancamentoFilters, val: unknown) {
    onChange({ ...filters, [key]: val })
  }

  const contaOptions = contas.map(c => ({ value: c.id, label: `${c.codigo} — ${c.descricao}` }))

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-end gap-3">

      <SearchableSelect
        label="Tipo"
        value={filters.tipo ?? ''}
        onChange={val => set('tipo', val as string || undefined)}
        options={TIPO_OPTIONS}
        placeholder="Todos"
        width={120}
      />

      <SearchableSelect
        multi
        label="Contas/categorias"
        value={filters.conta_gerencial_ids ?? []}
        onChange={vals => set('conta_gerencial_ids', vals.length ? vals.map(Number) : undefined)}
        options={contaOptions}
        placeholder="Todas"
        width={220}
        dropdownWidth={280}
      />

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-slate-700  tracking-wide ">Período de vencimento</label>
        <div className="flex items-center gap-1">
          <input type="date" value={filters.data_vencimento_ini ?? ''} onChange={e => set('data_vencimento_ini', e.target.value || undefined)} className={`${inp} transition-transform hover:scale-105`} />
          <span className="text-[10px] text-slate-400">a</span>
          <input type="date" value={filters.data_vencimento_fim ?? ''} onChange={e => set('data_vencimento_fim', e.target.value || undefined)} className={`${inp} transition-transform hover:scale-105`} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-slate-700 tracking-wide">Período de lançamento</label>
        <div className="flex items-center gap-1">
          <input type="date" value={filters.data_lancamento_ini ?? ''} onChange={e => set('data_lancamento_ini', e.target.value || undefined)} className={`${inp} transition-transform hover:scale-105`} />
          <span className="text-[10px] text-slate-400">a</span>
          <input type="date" value={filters.data_lancamento_fim ?? ''} onChange={e => set('data_lancamento_fim', e.target.value || undefined)} className={`${inp} transition-transform hover:scale-105`} />
        </div>
      </div>

      <div className="flex gap-2 ml-auto">
        <button onClick={onSearch} className="h-7 px-4 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 hover:scale-105">
          <Search size={12} /> Buscar
        </button>
        <button onClick={onClear} className="h-7 px-3 text-xs font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5 hover:scale-105">
          <X size={12} /> Limpar filtros
        </button>
      </div>
    </div>
  )
}

// totalizadoresd

function Totais({ lancamentos }: { lancamentos: Lancamento[] }) {
  const aPagar    = lancamentos.filter(l => l.tipo === 'pagar')
  const aReceber  = lancamentos.filter(l => l.tipo === 'receber')
  const pagos     = lancamentos.filter(l => l.status === 'pago')
  const recebidos = lancamentos.filter(l => l.status === 'recebido')

  const sumValor = (arr: Lancamento[]) => arr.reduce((s, l) => s + (l.valor ?? 0), 0)
  const sumPago  = (arr: Lancamento[]) => arr.reduce((s, l) => s + (l.valor_pago ?? 0), 0)

  const totalPagar    = sumValor(aPagar)
  const totalReceber  = sumValor(aReceber)
  const saldo         = totalReceber - totalPagar
  const totalPago     = sumPago(pagos)
  const totalRecebido = sumPago(recebidos)
  const resultadocx   = totalRecebido - totalPago 

  return (
  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">

  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-[11px] text-slate-500">Total a pagar</p>

    <div className="mt-1 flex items-center justify-between">
      <span className="text-base font-bold text-rose-500 tabular-nums">
        {fmtMoney(totalPagar)}
      </span>

      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
        {aPagar.length}
      </span>
    </div>
  </div>

  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-[11px] text-slate-500">Total a receber</p>

    <div className="mt-1 flex items-center justify-between">
      <span className="text-base font-bold text-emerald-600 tabular-nums">
        {fmtMoney(totalReceber)}
      </span>

      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
        {aReceber.length}
      </span>
    </div>
  </div>

  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-[11px] text-slate-500">Saldo previsto</p>

    <div className="mt-1 flex items-center justify-between">
      <span
        className={`text-base font-bold tabular-nums ${
          saldo >= 0 ? "text-blue-600" : "text-rose-500"
        }`}
      >
        {fmtMoney(saldo)}
      </span>

      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          saldo >= 0
            ? "bg-blue-50 text-blue-600"
            : "bg-rose-50 text-rose-600"
        }`}
      >
        {saldo >= 0 ? "+" : "-"}
      </span>
    </div>
  </div>

  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-[11px] text-slate-500">Total pago</p>

    <div className="mt-1 flex items-center justify-between">
      <span className="text-base font-bold text-emerald-600 tabular-nums">
        {fmtMoney(totalPago)}
      </span>

      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
        {pagos.length}
      </span>
    </div>
  </div>

  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-[11px] text-slate-500">Total recebido</p>

    <div className="mt-1 flex items-center justify-between">
      <span className="text-base font-bold text-blue-600 tabular-nums">
        {fmtMoney(totalRecebido)}
      </span>

      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
        {recebidos.length}
      </span>
    </div>
  </div>
   <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-[11px] text-slate-500">Resultado</p>

    <div className="mt-1 flex items-center justify-between">
      <span className="text-base font-bold text-blue-600 tabular-nums">
        {fmtMoney(resultadocx)}
      </span>

      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
        {recebidos.length}
      </span>
    </div>
  </div>

</div>
  )
}

interface TableProps {
  lancamentos: Lancamento[]
  loading: boolean
  onNovo: () => void
  selected: Set<number>
  onSelectAll: (checked: boolean) => void
  onSelectOne: (id: number, checked: boolean) => void
}

function LancamentosTable({ lancamentos, loading, onNovo, selected, onSelectAll, onSelectOne }: TableProps) {
  const [colOrder, setColOrder] = useState<ColKey[]>(ALL_COLS.map(c => c.key))
  const [sortKey, setSortKey]   = useState<ColKey>('data_lancamento')
  const [sortDir, setSortDir]   = useState<SortDir>('desc')
  const dragCol = useRef<ColKey | null>(null)
  const dragOver = useRef<ColKey | null>(null)

  function handleSort(key: ColKey) {
    if (!ALL_COLS.find(c => c.key === key)?.sortable) return
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function onDragStart(key: ColKey) { dragCol.current = key }
  function onDragEnter(key: ColKey) { dragOver.current = key }
  function onDragEnd() {
    const from = dragCol.current; const to = dragOver.current
    if (!from || !to || from === to) return
    setColOrder(prev => {
      const next = [...prev]
      const fi = next.indexOf(from); const ti = next.indexOf(to)
      next.splice(fi, 1); next.splice(ti, 0, from)
      return next
    })
    dragCol.current = null; dragOver.current = null
  }

  const cols = colOrder.map(k => ALL_COLS.find(c => c.key === k)!)

  const sorted = [...lancamentos].sort((a, b) => {
    const av = getSortValue(a, sortKey)
    const bv = getSortValue(b, sortKey)
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const allChecked = lancamentos.length > 0 && lancamentos.every(l => selected.has(l.id))
  const someChecked = !allChecked && lancamentos.some(l => selected.has(l.id))

  function SortIcon({ colKey }: { colKey: ColKey }) {
    if (!ALL_COLS.find(c => c.key === colKey)?.sortable) return null
    if (sortKey !== colKey) return <ChevronsUpDown size={11} className="text-slate-300 ml-1 flex-shrink-0" />
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="text-blue-500 ml-1 flex-shrink-0" />
      : <ChevronDown size={11} className="text-blue-500 ml-1 flex-shrink-0" />
  }

  function renderCell(l: Lancamento, key: ColKey) {
    const dias = diasAteVencer(l.data_vencimento)
    const diasClass = dias === null ? 'text-slate-300'
      : dias < 0 ? 'text-rose-500 font-semibold'
      : dias <= 3 ? 'text-green-500 font-semibold'
      : 'text-slate-500'

    switch (key) {
      case 'data_lancamento': return <span className="tabular-nums text-slate-600">{fmtDate(l.data_lancamento)}</span>
      case 'descricao': return (
        <div>
          <div className="font-medium text-slate-800 leading-snug">{l.descricao}</div>
          {l.historico && <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">{l.historico}</div>}
        </div>
      )
      case 'valor': return <span className="tabular-nums font-medium text-slate-700">{fmtMoney(l.valor)}</span>
      case 'data_vencimento': return <span className="tabular-nums text-slate-600">{fmtDate(l.data_vencimento)}</span>
      case 'dias': return <span className={`tabular-nums ${diasClass}`}>{dias !== null ? dias : '—'}</span>
      case 'tipo': return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${TIPO_CLASS[l.tipo]}`}>
          {TIPO_LABEL[l.tipo]}
        </span>
      )
      case 'conta': return l.contas_gerenciais ? (
        <div>
          <div className="font-medium text-slate-700">{l.contas_gerenciais.codigo} — {l.contas_gerenciais.descricao}</div>
          <div className="text-[11px] text-slate-400">{l.contas_gerenciais.grupos?.descricao}</div>
        </div>
      ) : <span className="text-slate-300">—</span>
      case 'historico': return <span className="text-slate-500 truncate block max-w-[160px]">{l.historico || '—'}</span>
      case 'data_pagamento': return <span className="tabular-nums text-slate-600">{fmtDate(l.data_pagamento)}</span>
      case 'valor_pago': return l.valor_pago !== null
        ? <span className={`tabular-nums font-medium ${l.valor_pago >= l.valor ? 'text-emerald-600' : 'text-amber-500'}`}>{fmtMoney(l.valor_pago)}</span>
        : <span className="text-slate-300">—</span>
      case 'status': return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_CLASS[l.status]}`}>
          {STATUS_LABEL[l.status]}
        </span>
      )
    }
  }

  if (loading) return (
    <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center py-16 gap-2 text-slate-400">
      <Loader2 size={18} className="animate-spin" /><span className="text-sm">Carregando...</span>
    </div>
  )

  if (sorted.length === 0) return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
      <ArrowLeftRight size={36} className="text-slate-200" />
      <p className="text-sm">Nenhum lançamento para os filtros selecionados.</p>
      <button onClick={onNovo} className="text-sm text-blue-600 hover:underline font-medium">Criar lançamento</button>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-medium text-slate-500 select-none">
              {/* Checkbox all */}
              <th className="pl-3 pr-1 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked }}
                  onChange={e => onSelectAll(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                />
              </th>
              {cols.map(col => (
                <th
                  key={col.key}
                  draggable
                  onDragStart={() => onDragStart(col.key)}
                  onDragEnter={() => onDragEnter(col.key)}
                  onDragEnd={onDragEnd}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => handleSort(col.key)}
                  style={{ minWidth: col.minW }}
                  className={`px-3 py-2.5 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${sortKey === col.key ? 'text-blue-600' : ''}
                  `}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    <SortIcon colKey={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, idx) => (
              <tr key={l.id} className={`border-b border-slate-100 transition-colors
                ${selected.has(l.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}
                ${idx === sorted.length - 1 ? 'border-b-0' : ''}
              `}>
                <td className="pl-3 pr-1 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(l.id)}
                    onChange={e => onSelectOne(l.id, e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 cursor-pointer hover:scale-110"
                  />
                </td>
                {cols.map(col => (
                  <td key={col.key} className={`px-3 py-2.5
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  `}>
                    {renderCell(l, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


interface ActionBarProps {
  count: number
  onBaixa: () => void
  onClear: () => void
}

function SelectionBar({ count, onBaixa, onClear }: ActionBarProps) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-3 bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl">
      <CheckSquare size={15} />
      <span className="font-medium">{count} selecionado{count > 1 ? 's' : ''}</span>
      <div className="ml-auto flex gap-2">
        <button
          onClick={onBaixa}
          className="px-3 py-1 text-xs font-semibold bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Dar Baixa
        </button>
        <button
          onClick={onClear}
          className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors"
        >
          Desmarcar
        </button>
      </div>
    </div>
  )
}

const DEFAULT_FILTERS: LancamentoFilters = {
  data_lancamento_ini: primeiroDiaMes(),
  data_lancamento_fim: ultimoDiaMes(),
}

export default function LancamentosPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [contas, setContas]           = useState<ContaGerencial[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [selected, setSelected]       = useState<Set<number>>(new Set())

  const [pendingFilters, setPendingFilters] = useState<LancamentoFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<LancamentoFilters>(DEFAULT_FILTERS)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await lancamentosService.findAll(appliedFilters)
      setLancamentos(data)
    } catch {
      setLancamentos([])
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => { contasGerenciaisService.findAll().then(setContas).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  function handleSearch()  { setAppliedFilters({ ...pendingFilters }) }
  function handleClear()   { setPendingFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS) }
  function handleSuccess() { setShowModal(false); load() }

  function handleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(lancamentos.map(l => l.id)) : new Set())
  }
  function handleSelectOne(id: number, checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  async function handleBaixa() {
    if (selected.size === 0) return
    const hoje = new Date().toISOString().slice(0, 10)
    try {
      await Promise.all(
        [...selected].map(id => {
          const l = lancamentos.find(x => x.id === id)!
          const novoStatus = l.tipo === 'pagar' ? 'pago' : 'recebido'
          return lancamentosService.update(id, {
            status: novoStatus,
            data_pagamento: hoje,
            valor_pago: l.valor_pago ?? l.valor,
          })
        })
      )
      setSelected(new Set())
      load()
    } catch (err: any) {
      alert('Erro ao dar baixa: ' + err.message)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors hover:scale-105"
          >
            <Plus size={15} /> Lançamento
          </button>
        </div>

        <FilterBar filters={pendingFilters} contas={contas} onChange={setPendingFilters} onSearch={handleSearch} onClear={handleClear} />

        <Totais lancamentos={lancamentos} />

        <LancamentosTable
          lancamentos={lancamentos}
          loading={loading}
          onNovo={() => setShowModal(true)}
          selected={selected}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
        />

        <SelectionBar count={selected.size} onBaixa={handleBaixa} onClear={() => setSelected(new Set())} />
      </div>

      {showModal && (
        <NovoLancamentoModal
          contas={contas}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
