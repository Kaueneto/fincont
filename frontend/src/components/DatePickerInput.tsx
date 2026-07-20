import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { CalendarDays } from 'lucide-react'
import 'react-day-picker/style.css'

export interface DatePickerInputProps {
  value: string | null        // ISO yyyy-mm-dd
  onChange: (v: string | null) => void
  placeholder?: string
  error?: boolean
}

function isoToBr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function brToIso(br: string): string | null {
  const match = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`)
  if (isNaN(d.getTime())) return null
  return `${yyyy}-${mm}-${dd}`
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  error,
}: DatePickerInputProps) {
  const [calOpen, setCalOpen]   = useState(false)
  const [openUp, setOpenUp]     = useState(false)
  const [inputVal, setInputVal] = useState(value ? isoToBr(value) : '')
  const [inputErr, setInputErr] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = value ? new Date(value + 'T00:00:00') : undefined

  useEffect(() => {
    setInputVal(value ? isoToBr(value) : '')
    setInputErr(false)
  }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setCalOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    // decide se abre pra cima ou pra baixo
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUp(spaceBelow < 320) // calendário ~300px de altura
    }
    setCalOpen(v => !v)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyMask(e.target.value)
    setInputVal(masked)
    setInputErr(false)
    if (masked.length === 10) {
      const iso = brToIso(masked)
      if (iso) onChange(iso)
      else setInputErr(true)
    } else if (masked.length === 0) {
      onChange(null)
    }
  }

  function handleDaySelect(day: Date | undefined) {
    if (!day) { onChange(null); return }
    onChange(day.toLocaleDateString('sv-SE'))
    setCalOpen(false)
  }

  const hasError = error || inputErr

  return (
    <div className="relative" ref={ref}>
      <div className={`
        flex items-center bg-slate-50 border rounded-lg px-3 transition-colors
        ${hasError
          ? 'border-red-300'
          : calOpen
            ? 'border-slate-300 ring-1 ring-slate-200'
            : 'border-slate-100 hover:border-slate-200'
        }
      `}>
          <input
            type="text"
            inputMode="numeric"
            value={inputVal}
            onChange={handleInputChange}
            placeholder={placeholder}
            maxLength={10}
            className="flex-1 bg-transparent outline-none text-sm py-2 text-slate-800 placeholder:text-slate-400 w-0 min-w-0"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={handleOpen}
            className="flex-shrink-0 p-0.5 ml-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <CalendarDays size={14} />
          </button>
      </div>

      {calOpen && (
        <div
          className={`absolute left-0 z-[200] bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden
            ${openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
          `}
          style={{
            // sobrescreve as variáveis CSS do react-day-picker
            ['--rdp-accent-color' as string]:            '#1e293b',
            ['--rdp-accent-background-color' as string]: '#f1f5f9',
            ['--rdp-day-height' as string]:              '32px',
            ['--rdp-day-width' as string]:               '32px',
            ['--rdp-day_button-height' as string]:       '30px',
            ['--rdp-day_button-width' as string]:        '30px',
            ['--rdp-day_button-border-radius' as string]:'6px',
            ['--rdp-day_button-border' as string]:       '1px solid transparent',
            ['--rdp-selected-border' as string]:         'none',
            ['--rdp-nav_button-height' as string]:       '28px',
            ['--rdp-nav_button-width' as string]:        '28px',
            ['--rdp-nav-height' as string]:              '36px',
            ['--rdp-outside-opacity' as string]:         '0.3',
            ['--rdp-today-color' as string]:             '#3b82f6',
            ['--rdp-weekday-opacity' as string]:         '1',
            ['--rdp-weekday-padding' as string]:         '0.25rem 0',
            minWidth: '260px',
          }}
        >
          <style>{`
            /* nav ao redor do caption */
            .rdp-datepicker .rdp-month_caption {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 36px;
              font-size: 0.8rem;
              font-weight: 600;
              color: #334155;
              padding: 0 4px;
              text-transform: capitalize;
            }
            .rdp-datepicker .rdp-nav {
              position: absolute;
              inset-block-start: 0;
              inset-inline-end: 0;
              display: flex;
              align-items: center;
              height: 36px;
              gap: 2px;
            }
            .rdp-datepicker .rdp-button_previous,
            .rdp-datepicker .rdp-button_next {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              color: #64748b;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              transition: background 0.15s;
            }
            .rdp-datepicker .rdp-button_previous:hover,
            .rdp-datepicker .rdp-button_next:hover {
              background: #e2e8f0;
            }
            .rdp-datepicker .rdp-chevron {
              fill: #64748b;
              width: 14px;
              height: 14px;
            }
            /* weekdays */
            .rdp-datepicker .rdp-weekday {
              font-size: 0.65rem;
              font-weight: 500;
              color: #94a3b8;
              text-transform: lowercase;
            }
            /* dia */
            .rdp-datepicker .rdp-day_button {
              font-size: 0.75rem;
              font-weight: 500;
              color: #475569;
              transition: background 0.1s;
            }
            .rdp-datepicker .rdp-day_button:hover {
              background: #f1f5f9;
            }
            /* selecionado */
            .rdp-datepicker .rdp-selected .rdp-day_button {
              background: #1e293b !important;
              color: #fff !important;
              border-color: transparent !important;
            }
            /* hoje */
            .rdp-datepicker .rdp-today:not(.rdp-selected) .rdp-day_button {
              color: #3b82f6;
              font-weight: 700;
            }
            /* fora do mês */
            .rdp-datepicker .rdp-outside .rdp-day_button {
              color: #cbd5e1;
            }
            /* table */
            .rdp-datepicker .rdp-month_grid {
              width: 100%;
              border-collapse: collapse;
            }
          `}</style>

          <div className="rdp-datepicker px-3 pt-2 pb-1">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleDaySelect}
              locale={ptBR}
              showOutsideDays
              navLayout="around"
            />
          </div>

          {/* atalhos rápidos */}
          <div className="flex items-center gap-1 px-3 pb-3 pt-1 flex-wrap border-t border-slate-50">
            {[
              { label: 'Ontem',       days: -1 },
              { label: 'Hoje',        days:  0 },
              { label: 'Amanhã',      days:  1 },
              { label: '+7 dias',     days:  7 },
              { label: '+30 dias',    days: 30 },
            ].map(({ label, days }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() + days)
                  handleDaySelect(d)
                }}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
