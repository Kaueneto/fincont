import { useState } from 'react'
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { lancamentosService } from '../../services/lancamentos.service'
import type { Lancamento, CreateLancamentoDTO, LancamentoTipo, LancamentoStatus } from '../../services/lancamentos.service'
import type { ContaGerencial } from '../../services/contasGerenciais.service'
import { SearchableSelect } from '../../components/SearchableSelect'
import { DatePickerInput } from '../../components/DatePickerInput'

interface Props {
  contas: ContaGerencial[]
  onClose: () => void
  onSuccess: (l: Lancamento) => void
}

type FormErrors = Partial<Record<keyof CreateLancamentoDTO, string>>

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function NovoLancamentoModal({ contas, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<CreateLancamentoDTO>({
    descricao: '',
    conta_gerencial_id: 0,
    valor: 0,
    tipo: 'pagar',
    status: 'aberto',
    data_lancamento: hoje(),
    data_vencimento: null,
    data_pagamento: null,
    valor_pago: null,
    historico: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const showPagamento = form.status === 'pago' || form.status === 'recebido'

  function set<K extends keyof CreateLancamentoDTO>(key: K, value: CreateLancamentoDTO[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.descricao.trim())         e.descricao          = 'Descrição é obrigatória.'
    if (!form.conta_gerencial_id)       e.conta_gerencial_id = 'Conta gerencial é obrigatória.'
    if (!form.valor || form.valor <= 0) e.valor             = 'Valor deve ser maior que zero.'
    if (!form.data_lancamento)          e.data_lancamento    = 'Data de lançamento é obrigatória.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setApiError('')
    setLoading(true)
    try {
      const payload: CreateLancamentoDTO = {
        ...form,
        valor: Number(form.valor),
        conta_gerencial_id: Number(form.conta_gerencial_id),
        valor_pago:      showPagamento && form.valor_pago ? Number(form.valor_pago) : null,
        data_vencimento: form.data_vencimento || null,
        data_pagamento:  showPagamento ? form.data_pagamento || null : null,
        historico:       form.historico?.trim() || null,
      }
      const criado = await lancamentosService.create(payload)
      onSuccess(criado)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Erro ao criar lançamento.')
    } finally {
      setLoading(false)
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  const ghostInput = (err?: string) =>
    `w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400
     ${err ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-slate-300'}`

  const contaOptions = contas.map(c => ({
    value: c.id,
    label: `${c.codigo} — ${c.descricao}`,
    sublabel: c.grupos?.descricao,
  }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50  p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col">

        <div className="px-7 pt-6 pb-6 relative rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>

          <input
            type="text"
            autoFocus
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
            placeholder="Descrição"
            className="w-full bg-transparent border-none outline-none text-2xl font-bold text-slate-800 placeholder:text-slate-300 mb-1.5 pr-8"
          />
          <input
            type="text"
            value={form.historico ?? ''}
            onChange={e => set('historico', e.target.value)}
            placeholder="Histórico"
            className="w-full bg-transparent border-none outline-none text-sm text-slate-400 placeholder:text-slate-300"
          />
          {errors.descricao && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-2">
              <AlertCircle size={11} /> {errors.descricao}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          <div className="px-7 pb-5 flex flex-col gap-4">

            {apiError && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {apiError}
              </div>
            )}
            <div className="flex gap-2">
              {(['pagar', 'receber'] as LancamentoTipo[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tipo', t)}
                  className={`
                    px-4 py-1.5 rounded-md text-sm font-medium border transition-all
                    ${form.tipo === t
                      ? t === 'pagar'
                        ? 'bg-red-100/70 border-red-400 text-red-500'
                        : 'bg-emerald-100/70 border-emerald-400 text-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                    }
                  `}
                >
                  {t === 'pagar' ? 'A pagar' : 'A receber'}
                </button>
              ))}
            </div>


            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">Valor</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={form.valor || ''}
                  onChange={e => set('valor', Number(e.target.value))}
                  placeholder="0,00"
                  className={ghostInput(errors.valor)}
                />
                {errors.valor && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11}/>{errors.valor}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">Vencimento</label>
                <DatePickerInput
                  value={form.data_vencimento}
                  onChange={v => set('data_vencimento', v)}
                  size="md"
                  width="100%"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Conta</label>
              <SearchableSelect
                value={form.conta_gerencial_id || ''}
                onChange={val => set('conta_gerencial_id', Number(val))}
                options={contaOptions}
                placeholder="Selecione a conta..."
                fullWidth
              />
              {errors.conta_gerencial_id && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={11}/>{errors.conta_gerencial_id}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value as LancamentoStatus)}
                  className={ghostInput()}
                >
                  <option value="aberto">Aberto</option>
                  <option value="pago">Pago</option>
                  <option value="recebido">Recebido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">
                  Data lançamento <span className="text-red-400">*</span>
                </label>
                <DatePickerInput
                  value={form.data_lancamento}
                  onChange={v => set('data_lancamento', v)}
                  error={!!errors.data_lancamento}
                  size="md"
                  width="100%"
                />
                {errors.data_lancamento && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={11}/>{errors.data_lancamento}
                  </p>
                )}
              </div>
            </div>

            {showPagamento && (
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-500">Valor pago</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.valor_pago ?? ''}
                    onChange={e => set('valor_pago', e.target.value ? Number(e.target.value) : null)}
                    placeholder="0,00"
                    className={ghostInput()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-500">Data pagamento</label>
                  <DatePickerInput
                    value={form.data_pagamento}
                    onChange={v => set('data_pagamento', v)}
                    size="md"
                    width="100%"
                  />
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-end gap-2 px-7 py-4 border-t border-slate-100 rounded-b-2xl bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                : <><Plus size={14} /> Lançar</>
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
