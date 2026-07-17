import { useState } from 'react'
import { X, Plus, AlertCircle, Loader2, ArrowLeftRight } from 'lucide-react'
import { lancamentosService } from '../../services/lancamentos.service'
import type { Lancamento, CreateLancamentoDTO, LancamentoTipo, LancamentoStatus } from '../../services/lancamentos.service'
import type { ContaGerencial } from '../../services/contasGerenciais.service'

interface Props {
  contas: ContaGerencial[]
  onClose: () => void
  onSuccess: (l: Lancamento) => void
}

type FormErrors = Partial<Record<keyof CreateLancamentoDTO, string>>

function hoje() {
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

  function set<K extends keyof CreateLancamentoDTO>(key: K, value: CreateLancamentoDTO[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.descricao.trim())      e.descricao          = 'Descrição é obrigatória.'
    if (!form.conta_gerencial_id)    e.conta_gerencial_id = 'Conta gerencial é obrigatória.'
    if (!form.valor || form.valor <= 0) e.valor           = 'Valor deve ser maior que zero.'
    if (!form.data_lancamento)       e.data_lancamento    = 'Data de lançamento é obrigatória.'
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
        valor_pago:     form.valor_pago     ? Number(form.valor_pago) : null,
        data_vencimento: form.data_vencimento || null,
        data_pagamento:  form.data_pagamento  || null,
        historico:       form.historico?.trim() || null,
      }
      const criado = await lancamentosService.create(payload)
      onSuccess(criado)
    } catch (err: any) {
      setApiError(err.message ?? 'Erro ao criar lançamento.')
    } finally {
      setLoading(false)
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  const inputCls = (err?: string) => `
    w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors placeholder:text-slate-300
    ${err ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500 bg-white'}
  `

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-800">Novo Lançamento</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

      
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">

            {apiError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {apiError}
              </div>
            )}

    
            <div className="flex gap-3">
              {(['pagar', 'receber'] as LancamentoTipo[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tipo', t)}
                  className={`
                    flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                    ${form.tipo === t
                      ? t === 'pagar'
                        ? 'border-rose-400 bg-rose-50 text-rose-600'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-600'
                      : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }
                  `}
                >
                  {t === 'pagar' ? '↓ A Pagar' : '↑ A Receber'}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Descrição <span className="text-red-500">*</span></label>
              <input type="text" value={form.descricao} autoFocus
                onChange={e => set('descricao', e.target.value)}
                placeholder="Ex: Conta de energia, Salário..."
                className={inputCls(errors.descricao)}
              />
              {errors.descricao && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/>{errors.descricao}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Conta Gerencial <span className="text-red-500">*</span></label>
                <select value={form.conta_gerencial_id}
                  onChange={e => set('conta_gerencial_id', Number(e.target.value))}
                  className={`${inputCls(errors.conta_gerencial_id)} ${!form.conta_gerencial_id ? 'text-slate-300' : 'text-slate-800'}`}
                >
                  <option value={0} disabled>Selecione...</option>
                  {contas.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} — {c.descricao}</option>
                  ))}
                </select>
                {errors.conta_gerencial_id && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/>{errors.conta_gerencial_id}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Valor <span className="text-red-500">*</span></label>
                <input type="number" min="0.01" step="0.01"
                  value={form.valor || ''}
                  onChange={e => set('valor', Number(e.target.value))}
                  placeholder="0,00"
                  className={inputCls(errors.valor)}
                />
                {errors.valor && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/>{errors.valor}</p>}
              </div>
            </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Data Lançamento <span className="text-red-500">*</span></label>
                <input type="date" value={form.data_lancamento ?? ''}
                  onChange={e => set('data_lancamento', e.target.value)}
                  className={inputCls(errors.data_lancamento)}
                />
                {errors.data_lancamento && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/>{errors.data_lancamento}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Vencimento</label>
                <input type="date" value={form.data_vencimento ?? ''}
                  onChange={e => set('data_vencimento', e.target.value || null)}
                  className={inputCls()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Pagamento</label>
                <input type="date" value={form.data_pagamento ?? ''}
                  onChange={e => set('data_pagamento', e.target.value || null)}
                  className={inputCls()}
                />
              </div>
            </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Valor Pago</label>
                <input type="number" min="0" step="0.01"
                  value={form.valor_pago ?? ''}
                  onChange={e => set('valor_pago', e.target.value ? Number(e.target.value) : null)}
                  placeholder="0,00"
                  className={inputCls()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select value={form.status}
                  onChange={e => set('status', e.target.value as LancamentoStatus)}
                  className={inputCls()}
                >
                  <option value="aberto">Aberto</option>
                  <option value="pago">Pago</option>
                  <option value="recebido">Recebido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>


            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Histórico</label>
              <textarea rows={2} value={form.historico ?? ''}
                onChange={e => set('historico', e.target.value)}
                placeholder="Observações adicionais..."
                className={`${inputCls()} resize-none`}
              />
            </div>
          </div>


          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
              {loading
                ? <><Loader2 size={15} className="animate-spin"/> Salvando...</>
                : <><Plus size={15}/> Cadastrar</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
