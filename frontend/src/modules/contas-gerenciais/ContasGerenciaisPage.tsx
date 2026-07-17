import { useEffect, useState } from 'react'
import { Plus, Search, BookOpen, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { contasGerenciaisService } from '../../services/contasGerenciais.service'
import type { ContaGerencial, CreateContaGerencialDTO } from '../../services/contasGerenciais.service'
import { gruposService } from '../../services/grupos.service'
import type { Grupo } from '../../services/grupos.service'


interface ModalProps {
  grupos: Grupo[]
  onClose: () => void
  onSuccess: (conta: ContaGerencial) => void
}

function NovaContaModal({ grupos, onClose, onSuccess }: ModalProps) {
  const [form, setForm] = useState<CreateContaGerencialDTO>({
    grupo_id: 0,
    codigo: undefined,
    descricao: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CreateContaGerencialDTO, string>>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.descricao.trim()) e.descricao = 'Descrição é obrigatória.'
    if (!form.grupo_id)         e.grupo_id  = 'Selecione um grupo.'
    if (form.codigo !== undefined && form.codigo !== null && Number(form.codigo) < 1)
      e.codigo = 'Código deve ser maior que zero.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setApiError('')
    setLoading(true)
    try {
      const payload: CreateContaGerencialDTO = {
        grupo_id: Number(form.grupo_id),
        descricao: form.descricao.trim(),
        ...(form.codigo ? { codigo: Number(form.codigo) } : {}),
      }
      const criada = await contasGerenciaisService.create(payload)
      onSuccess(criada)
    } catch (err: any) {
      setApiError(err.message ?? 'Erro ao cadastrar conta.')
    } finally {
      setLoading(false)
    }
  }

  // fecha ao clicar fora
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-800">Nova Conta Gerencial</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 flex flex-col gap-4">

  
            {apiError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Descrição <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Mercado, Salário, Farmácia..."
                className={`
                  w-full px-3 py-2.5 rounded-lg border text-sm outline-none
                  transition-colors placeholder:text-slate-300
                  ${errors.descricao
                    ? 'border-red-400 focus:border-red-500 bg-red-50'
                    : 'border-slate-200 focus:border-blue-500 bg-white'
                  }
                `}
              />
              {errors.descricao && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.descricao}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Grupo <span className="text-red-500">*</span>
              </label>
              <select
                value={form.grupo_id}
                onChange={(e) => setForm({ ...form, grupo_id: Number(e.target.value) })}
                className={`
                  w-full px-3 py-2.5 rounded-lg border text-sm outline-none
                  transition-colors bg-white
                  ${errors.grupo_id
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-slate-200 focus:border-blue-500'
                  }
                  ${!form.grupo_id ? 'text-slate-300' : 'text-slate-800'}
                `}
              >
                <option value={0} disabled>Selecione um grupo...</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.codigo} — {g.descricao}
                  </option>
                ))}
              </select>
              {errors.grupo_id && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.grupo_id}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Código
                <span className="ml-1.5 text-xs font-normal text-slate-400">(opcional — gerado automaticamente)</span>
              </label>
              <input
                type="number"
                value={form.codigo ?? ''}
                onChange={(e) => setForm({ ...form, codigo: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Ex: 1001"
                min={1}
                className={`
                  w-full px-3 py-2.5 rounded-lg border text-sm outline-none
                  transition-colors placeholder:text-slate-300
                  ${errors.codigo
                    ? 'border-red-400 focus:border-red-500 bg-red-50'
                    : 'border-slate-200 focus:border-blue-500 bg-white'
                  }
                `}
              />
              {errors.codigo && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.codigo}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
                : <><Plus size={15} /> Cadastrar</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
//toast de mensagem
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-fade-in">
      <CheckCircle2 size={18} className="text-green-500" />
      {message}
    </div>
  )
}

export default function ContasGerenciaisPage() {
  const [contas, setContas]       = useState<ContaGerencial[]>([])
  const [grupos, setGrupos]       = useState<Grupo[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast]         = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [cs, gs] = await Promise.all([
          contasGerenciaisService.findAll(),
          gruposService.findAll(),
        ])
        setContas(cs)
        setGrupos(gs)
      } catch {
        // silencia — exibe lista vazia
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleSuccess(nova: ContaGerencial) {
    setContas((prev) => [...prev, nova].sort((a, b) => a.codigo - b.codigo))
    setShowModal(false)
    setToast('Conta gerencial cadastrada com sucesso!')
  }

  const filtered = contas.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.descricao.toLowerCase().includes(q) ||
      String(c.codigo).includes(q) ||
      c.grupos?.descricao.toLowerCase().includes(q) ||
      false
    )
  })

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Contas Gerenciais</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? 'Carregando...' : `${contas.length} conta${contas.length !== 1 ? 's' : ''} cadastrada${contas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nova Conta
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição, código ou grupo..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors placeholder:text-slate-300 bg-white"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Carregando contas...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <BookOpen size={40} className="text-slate-200" />
              <p className="text-sm">
                {search ? 'Nenhuma conta encontrada para essa busca.' : 'Nenhuma conta cadastrada ainda.'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowModal(true)}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Cadastrar primeira conta
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-5 py-3 font-medium text-slate-500 w-24">Código</th>
                    <th className="px-5 py-3 font-medium text-slate-500">Descrição</th>
                    <th className="px-5 py-3 font-medium text-slate-500">Grupo</th>
                    <th className="px-5 py-3 font-medium text-slate-500 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((conta, idx) => (
                    <tr
                      key={conta.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx === filtered.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-mono text-slate-600 font-medium">
                        {conta.codigo}
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 font-medium">
                        {conta.descricao}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {conta.grupos
                          ? <span>{conta.grupos.codigo} — {conta.grupos.descricao}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            conta.ativo
                              ? 'bg-green-50 text-green-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {conta.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NovaContaModal
          grupos={grupos}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
