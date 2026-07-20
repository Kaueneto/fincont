import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check, Layers } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  sublabel?: string
}

interface SingleProps {
  multi?: false
  value: string | number
  onChange: (val: string | number) => void
}

interface MultiProps {
  multi: true
  value: (string | number)[]
  onChange: (val: (string | number)[]) => void
}

type Props = (SingleProps | MultiProps) & {
  options: SelectOption[]
  placeholder?: string
  label?: string
  width?: number | string
  dropdownWidth?: number
  fullWidth?: boolean
}

function triggerLabel(
  multi: boolean | undefined,
  value: string | number | (string | number)[],
  options: SelectOption[],
  placeholder: string,
): string {
  if (!multi) {
    const found = options.find(o => o.value === (value as string | number))
    return found ? found.label : placeholder
  }
  const arr = value as (string | number)[]
  if (arr.length === 0) return placeholder
  if (arr.length === 1) return options.find(o => o.value === arr[0])?.label ?? placeholder
  return `${arr.length} selecionados`
}

export function SearchableSelect(props: Props) {
  const { options, placeholder = 'Selecione...', label, width = 160, dropdownWidth, multi, fullWidth } = props

  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState('')
  const [multiMode, setMultiMode] = useState(false)
  const containerRef              = useRef<HTMLDivElement>(null)
  const searchRef                 = useRef<HTMLInputElement>(null)

  const filtered = search
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.sublabel?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : options

  const dw = dropdownWidth ?? (fullWidth ? undefined : Math.max(typeof width === 'number' ? width : 160, 240))

  const multiValues: (string | number)[] = multi ? (props.value as (string | number)[]) : []

  function isChecked(val: string | number): boolean {
    if (!multiMode && !multi) return (props.value as string | number) === val
    return multiValues.includes(val)
  }

  function handleSelect(val: string | number) {
    if (!multiMode && !multi) {
      ;(props as SingleProps).onChange(val)
      setOpen(false)
      setSearch('')
      return
    }
    const current = multiValues
    const next = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val]
    ;(props as MultiProps).onChange(next)
  }

  function handleSelectAll() {
    ;(props as MultiProps).onChange(filtered.map(o => o.value))
  }

  function handleClear() {
    if (multi) {
      ;(props as MultiProps).onChange([])
    } else {
      ;(props as SingleProps).onChange('')
    }
  }

  function handleConcluir() {
    setMultiMode(false)
    setOpen(false)
    setSearch('')
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        setMultiMode(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40)
  }, [open])

  const showMultiBar = multiMode || multi
  const hasSelection = multi
    ? multiValues.length > 0
    : (props.value !== '' && props.value !== undefined && props.value !== null && props.value !== 0)

  const tLabel = triggerLabel(multi, multi ? multiValues : (props as SingleProps).value, options, placeholder)

  // trigger mais alto quando fullWidth (usado dentro de formulários)
  const triggerHeight = fullWidth ? 'h-9' : 'h-7'
  const triggerText   = fullWidth ? 'text-sm' : 'text-xs'

  return (
    <div
      className="flex flex-col gap-1 relative"
      style={fullWidth ? { width: '100%' } : { width }}
      ref={containerRef}
    >
      {label && (
        <label className="text-[11px] text-slate-700 tracking-wide select-none">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          ${triggerHeight} px-2.5 flex items-center justify-between gap-1.5 w-full
          ${triggerText} border rounded-lg outline-none transition-all duration-150 bg-white select-none
          ${fullWidth ? '' : 'hover:scale-105'}
          ${open
            ? 'border-slate-300 ring-2 ring-slate-100 text-slate-700'
            : hasSelection
              ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
              : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        <span className="truncate">{tLabel}</span>
        <ChevronDown
          size={12}
          className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-[200] bg-white border border-slate-200 rounded-xl shadow-xl"
          style={dw ? { width: dw } : { width: '100%' }}
        >
          {/* barra multi/modo */}
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
            {!multi && (
              <button
                type="button"
                onClick={() => setMultiMode(v => !v)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
                  transition-all duration-150 flex-1
                  ${multiMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                `}
              >
                <Layers size={11} />
                {multiMode ? 'Modo: Múltipla Seleção' : 'Múltipla Seleção'}
              </button>
            )}
            {multi && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-100 text-blue-700 flex-1">
                <Layers size={11} />
                Modo: Múltipla Seleção
              </span>
            )}
            {(multiMode || multi) && (
              <button
                type="button"
                onClick={handleConcluir}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
              >
                Concluir
              </button>
            )}
          </div>

          <div className="h-px bg-slate-100 mx-3" />

          {/* busca */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Search size={11} className="text-slate-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* sel todos / limpar */}
          {showMultiBar && (
            <div className="flex items-center justify-between px-4 pb-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Selecionar todos
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-medium text-rose-500 hover:text-rose-700 transition-colors"
              >
                Limpar
              </button>
            </div>
          )}

          <div className="h-px bg-slate-100" />

          <div className="max-h-56 overflow-y-auto overflow-x-hidden py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">Nenhum resultado</div>
            ) : (
              filtered.map(opt => {
                const checked = isChecked(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 text-left text-xs
                      transition-all duration-100 group
                      ${checked
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50 hover:translate-x-0.5'
                      }
                    `}
                  >
                    <span className={`
                      w-4 h-4 flex-shrink-0 rounded flex items-center justify-center border transition-all duration-100
                      ${checked
                        ? 'bg-blue-600 border-blue-600 scale-105'
                        : 'border-slate-300 group-hover:border-slate-400'
                      }
                    `}>
                      {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="truncate text-[10px] text-slate-400 font-normal">{opt.sublabel}</span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
