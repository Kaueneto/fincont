import { useEffect, useState } from 'react'
import { Plus, X, AlertCircle, Loader2, Pencil, Trash2 } from 'lucide-react'
import { SearchableSelect } from '../../components/SearchableSelect'
import { contasGerenciaisService } from '../../services/contasGerenciais.service'
import type { ContaGerencial, CreateContaGerencialDTO } from '../../services/contasGerenciais.service'
import { gruposService } from '../../services/grupos.service'
import type { Grupo, CreateGrupoDTO } from '../../services/grupos.service'
import { ContasKanban } from './ContasKanban'


function ghostInput(err?: string) {
  return `w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400
    ${err ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-slate-300'}`
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
  error?: string
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <p className="text-sm text-slate-700">{message}</p>
        {error && (
          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          {!error && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

//modal grupo pra criar ou editar
interface GrupoModalProps {
  initial?: Grupo
  onClose: () => void
  onSuccess: (grupo: Grupo) => void
}

function GrupoModal({ initial, onClose, onSuccess }: GrupoModalProps) {
  const [descricao, setDescricao] = useState(initial?.descricao ?? '')
  const [codigo, setCodigo]       = useState(initial?.codigo ? String(initial.codigo) : '')
  const [apiError, setApiError]   = useState('')
  const [loading, setLoading]     = useState(false)
  const editing = !!initial

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!descricao.trim()) return
    setApiError('')
    setLoading(true)
    try {
      const dto: CreateGrupoDTO = {
        descricao: descricao.trim(),
        ...(codigo ? { codigo: Number(codigo) } : {}),
      }
      const result = editing
        ? await gruposService.update(initial!.id, dto)
        : await gruposService.create(dto)
      onSuccess(result)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Erro ao salvar grupo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        <div className="px-7 pt-6 pb-4 relative rounded-t-2xl">
          <button type="button" onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
          <input
            type="text" autoFocus value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Nome do grupo"
            className="w-full bg-transparent border-none outline-none text-2xl font-bold text-slate-800 placeholder:text-slate-300 pr-8"
          />
          <input
            type="text" value={codigo}
            onChange={e => setCodigo(e.target.value)}
            placeholder="Código (opcional)"
            className="w-full bg-transparent border-none outline-none text-sm text-slate-400 placeholder:text-slate-300 mt-1"
          />
        </div>

  

        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          <div className="px-7 py-3">
            {apiError && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {apiError}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 px-7 py-4 border-t border-slate-100 rounded-b-2xl bg-white">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !descricao.trim()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : (editing ? 'Salvar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// modal de conta pra criar ou editar

interface ContaModalProps {
  grupos: Grupo[]
  initial?: ContaGerencial
  onClose: () => void
  onSuccess: (conta: ContaGerencial) => void
  onGrupoCreated: (grupo: Grupo) => void
}

function ContaModal({ grupos, initial, onClose, onSuccess, onGrupoCreated }: ContaModalProps) {
  const [descricao, setDescricao]   = useState(initial?.descricao ?? '')
  const [codigo, setCodigo]         = useState(initial?.codigo ? String(initial.codigo) : '')
  const [grupoId, setGrupoId]       = useState<number | ''>(initial?.grupo_id ?? '')
  const [errors, setErrors]         = useState<{ descricao?: string; grupo_id?: string }>({})
  const [apiError, setApiError]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [showGrupoModal, setShowGrupoModal] = useState(false)
  const editing = !!initial

  function validate() {
    const e: typeof errors = {}
    if (!descricao.trim()) e.descricao = 'Descrição é obrigatória.'
    if (!grupoId)          e.grupo_id  = 'Selecione um grupo.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    setApiError('')
    setLoading(true)
    try {
      const dto: CreateContaGerencialDTO = {
        grupo_id: Number(grupoId),
        descricao: descricao.trim(),
        ...(codigo ? { codigo: Number(codigo) } : {}),
      }
      const result = editing
        ? await contasGerenciaisService.update(initial!.id, dto)
        : await contasGerenciaisService.create(dto)
      onSuccess(result)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Erro ao salvar conta.')
    } finally {
      setLoading(false)
    }
  }

  function handleGrupoCreated(grupo: Grupo) {
    onGrupoCreated(grupo)
    setGrupoId(grupo.id)
    setShowGrupoModal(false)
  }

  const grupoOptions = grupos.map(g => ({ value: g.id, label: `${g.codigo} — ${g.descricao}` }))

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
        onClick={e => { if (e.target === e.currentTarget && !showGrupoModal) onClose() }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
          <div className="px-7 pt-6 pb-4 relative rounded-t-2xl">
            <button type="button" onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
            <input
              type="text" autoFocus value={descricao}
              onChange={e => { setDescricao(e.target.value); setErrors(ev => ({ ...ev, descricao: undefined })) }}
              placeholder="Descrição"
              className="w-full bg-transparent border-none outline-none text-2xl font-bold text-slate-800 placeholder:text-slate-300 pr-8"
            />
            {errors.descricao && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle size={11} /> {errors.descricao}
              </p>
            )}
            <input
              type="text" value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="Código (opcional)"
              className="w-full bg-transparent border-none outline-none text-sm text-slate-400 placeholder:text-slate-300 mt-1"
            />
          </div>



          <form onSubmit={handleSubmit} noValidate className="flex flex-col">
            <div className="px-7 py-4 flex flex-col gap-3">
              {apiError && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {apiError}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">Grupo</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      value={grupoId === '' ? '' : grupoId}
                      onChange={val => { setGrupoId(Number(val)); setErrors(ev => ({ ...ev, grupo_id: undefined })) }}
                      options={grupoOptions}
                      placeholder="Selecione o grupo..."
                      fullWidth
                    />
                  </div>
                  <button type="button" onClick={() => setShowGrupoModal(true)}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
                    title="Novo grupo">
                    <Plus size={12} />
                  </button>
                </div>
                {errors.grupo_id && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.grupo_id}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-7 py-4 border-t border-slate-100 rounded-b-2xl bg-white">
              <button type="button" onClick={onClose} disabled={loading}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : (editing ? 'Salvar' : 'Cadastrar')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showGrupoModal && (
        <GrupoModal onClose={() => setShowGrupoModal(false)} onSuccess={handleGrupoCreated} />
      )}
    </>
  )
}

type DeleteTarget =
  | { kind: 'conta'; item: ContaGerencial }
  | { kind: 'grupo'; item: Grupo }

export default function ContasGerenciaisPage() {
  const [contas, setContas]                 = useState<ContaGerencial[]>([])
  const [grupos, setGrupos]                 = useState<Grupo[]>([])
  const [loading, setLoading]               = useState(true)
  const [contaModal, setContaModal]         = useState<ContaGerencial | null | 'new'>(null)
  const [grupoModal, setGrupoModal]         = useState<Grupo | null | 'new'>(null)
  const [deleteTarget, setDeleteTarget]     = useState<DeleteTarget | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const [deleteError, setDeleteError]       = useState('')

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
      } catch { /* silencia */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── contas ──

  function handleContaSuccess(saved: ContaGerencial) {
    setContas(prev => {
      const sem = prev.filter(c => c.id !== saved.id)
      return [...sem, saved].sort((a, b) => a.codigo - b.codigo)
    })
    setContaModal(null)
  }

  async function handleContaDelete() {
    if (!deleteTarget || deleteTarget.kind !== 'conta') return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await contasGerenciaisService.delete(deleteTarget.item.id)
      setContas(prev => prev.filter(c => c.id !== deleteTarget.item.id))
      setDeleteTarget(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir conta.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── grupos ──

  function handleGrupoCreated(novo: Grupo) {
    setGrupos(prev => [...prev, novo].sort((a, b) => a.codigo - b.codigo))
  }

  function handleGrupoSuccess(saved: Grupo) {
    setGrupos(prev => {
      const sem = prev.filter(g => g.id !== saved.id)
      return [...sem, saved].sort((a, b) => a.codigo - b.codigo)
    })
    setGrupoModal(null)
  }

  async function handleGrupoDelete() {
    if (!deleteTarget || deleteTarget.kind !== 'grupo') return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await gruposService.delete(deleteTarget.item.id)
      setGrupos(prev => prev.filter(g => g.id !== deleteTarget.item.id))
      setDeleteTarget(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir grupo.')
    } finally {
      setDeleteLoading(false)
    }
  }

  function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    return (
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Editar">
          <Pencil size={12} />
        </button>
        <button onClick={onDelete}
          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          title="Excluir">
          <Trash2 size={12} />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-8">

        {/* ── tabelas grupo e conta lado a lado ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Contas Gerenciais</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">{contas.length} cadastrada{contas.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setContaModal('new')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-300 hover:bg-blue-400 text-white hover:text-slate-800 hover:scale-105 text-xs font-medium transition-colors">
                <Plus size={12} /> Nova
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-10 text-slate-400 text-sm justify-center">
                <Loader2 size={15} className="animate-spin" /> Carregando...
              </div>
            ) : contas.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-400">Nenhuma conta cadastrada.</p>
                <button onClick={() => setContaModal('new')} className="text-xs text-blue-600 hover:underline mt-1">Cadastrar agora</button>
              </div>
            ) : (
              <div className="px-1 py-1 max-h-72 overflow-y-auto">
                {contas.map(conta => (
                  <div key={conta.id}
                    className="group flex items-center gap-3 py-2 px-3 hover:bg-slate-50 transition-colors rounded-lg">
                    <span className="font-mono text-[11px] text-blue-400 w-8 flex-shrink-0">{conta.codigo}</span>
                    <span className="text-sm text-slate-800 flex-1 truncate">{conta.descricao}</span>
                    {conta.grupos && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[110px] flex-shrink-0">
                        {conta.grupos.descricao}
                      </span>
                    )}
                    <RowActions
                      onEdit={() => setContaModal(conta)}
                      onDelete={() => setDeleteTarget({ kind: 'conta', item: conta })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Grupos</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">{grupos.length} cadastrado{grupos.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setGrupoModal('new')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-300 hover:bg-green-400 text-slate-700 hover:text-white hover:scale-105 text-xs font-medium transition-colors">
                <Plus size={12} /> Novo
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-10 text-slate-400 text-sm justify-center">
                <Loader2 size={15} className="animate-spin" /> Carregando...
              </div>
            ) : grupos.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-400">Nenhum grupo cadastrado.</p>
                <button onClick={() => setGrupoModal('new')} className="text-xs text-blue-600 hover:underline mt-1">Cadastrar agora</button>
              </div>
            ) : (
              <div className="px-1 py-1 max-h-72 overflow-y-auto">
                {grupos.map(grupo => (
                  <div key={grupo.id}
                    className="group flex items-center gap-3 py-2 px-3 hover:bg-slate-50 transition-colors rounded-lg">
                    <span className="font-mono text-[11px] text-green-600 w-8 flex-shrink-0">{grupo.codigo}</span>
                    <span className="text-sm text-slate-800 flex-1">{grupo.descricao}</span>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {contas.filter(c => c.grupo_id === grupo.id).length} conta{contas.filter(c => c.grupo_id === grupo.id).length !== 1 ? 's' : ''}
                    </span>
                    <RowActions
                      onEdit={() => setGrupoModal(grupo)}
                      onDelete={() => setDeleteTarget({ kind: 'grupo', item: grupo })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* kanazinho de grupos contas*/}
        {!loading && grupos.length > 0 && (
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Organização por grupo</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Arraste uma conta para mover entre grupos</p>
            </div>
            <ContasKanban grupos={grupos} contas={contas} onContasChange={setContas} />
          </div>
        )}

      </div>

      {contaModal !== null && (
        <ContaModal
          grupos={grupos}
          initial={contaModal === 'new' ? undefined : contaModal}
          onClose={() => setContaModal(null)}
          onSuccess={handleContaSuccess}
          onGrupoCreated={handleGrupoCreated}
        />
      )}

      {grupoModal !== null && (
        <GrupoModal
          initial={grupoModal === 'new' ? undefined : grupoModal}
          onClose={() => setGrupoModal(null)}
          onSuccess={handleGrupoSuccess}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={
            deleteTarget.kind === 'conta'
              ? `Excluir a conta "${deleteTarget.item.descricao}"? Esta ação não pode ser desfeita.`
              : `Excluir o grupo "${deleteTarget.item.descricao}"? Esta ação não pode ser desfeita.`
          }
          onConfirm={deleteTarget.kind === 'conta' ? handleContaDelete : handleGrupoDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </>
  )
}

// silencia warning de variável não usada
void ghostInput
