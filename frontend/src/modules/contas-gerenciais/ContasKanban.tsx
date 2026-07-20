import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { contasGerenciaisService } from '../../services/contasGerenciais.service'
import type { ContaGerencial } from '../../services/contasGerenciais.service'
import type { Grupo } from '../../services/grupos.service'


function ContaTag({ conta }: { conta: ContaGerencial }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: conta.id,
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  // trunca em 18 chars para o label da tag
  const label = conta.descricao.length > 18
    ? conta.descricao.slice(0, 18).trimEnd() + '…'
    : conta.descricao

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      title={conta.descricao.length > 18 ? `${conta.codigo} — ${conta.descricao}` : undefined}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-lg
        bg-white/80 border border-white shadow-sm
        select-none cursor-grab active:cursor-grabbing transition-opacity
        ${isDragging ? 'opacity-0' : ''}
      `}
    >
      <span className="text-slate-400 font-mono text-[9px] flex-shrink-0 leading-none">{conta.codigo}</span>
      <span className="text-slate-600 text-[10px] font-medium leading-none whitespace-nowrap">{label}</span>
    </div>
  )
}

function GrupoCard({
  grupo,
  contas,
  isOver,
}: {
  grupo: Grupo
  contas: ContaGerencial[]
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: grupo.id })

  return (
    <div
      ref={setNodeRef}
      className={`
        group rounded-xl p-3 flex flex-col gap-2 h-36
        transition-all duration-200 ease-out
        hover:shadow-md hover:scale-[1.010] hover:-translate-y-0.5
        ${isOver
          ? 'bg-amber-100/60 ring ring-amber-200 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200'
        }
      `}
    >
      <div className="flex items-baseline justify-between gap-1 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-600 leading-tight truncate">
            {grupo.descricao}
          </span>
        {contas.length > 0 && (
          <span className="text-[9px] text-slate-400 flex-shrink-0 tabular-nums">
            {contas.length}
          </span>

        )}
        
      </div>

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
      >
        {contas.length === 0 ? (
          <p className={`text-[10px] italic ${isOver ? 'text-orange-400' : 'text-slate-400'}`}>
            {isOver ? 'Solte aqui em qualquer lugar' : ' '}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {contas.map(c => <ContaTag key={c.id} conta={c} />)}
          </div>
        )}
      </div>
    </div>
  )
}

//overlay (fantasma enquanto arrasta)

function OverlayTag({ conta }: { conta: ContaGerencial }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-lg cursor-grabbing">
      <span className="text-slate-400 font-mono text-[9px]">{conta.codigo}</span>
      <span className="text-slate-600 text-[10px] font-medium">{conta.descricao}</span>
    </div>
  )
}

//kanban principal 

interface ContasKanbanProps {
  grupos: Grupo[]
  contas: ContaGerencial[]
  onContasChange: (contas: ContaGerencial[]) => void
}

export function ContasKanban({ grupos, contas, onContasChange }: ContasKanbanProps) {
  const [activeId, setActiveId]       = useState<number | null>(null)
  const [overGroupId, setOverGroupId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const activeConta = activeId != null ? contas.find(c => c.id === activeId) ?? null : null

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as number)
  }

  function handleDragOver(e: DragOverEvent) {
    setOverGroupId(e.over ? e.over.id as number : null)
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    setOverGroupId(null)
    if (!over) return

    const contaId = active.id as number
    const grupoId = over.id as number
    const conta   = contas.find(c => c.id === contaId)
    if (!conta || conta.grupo_id === grupoId) return

    // atualização otimista
    const updated = contas.map(c =>
      c.id === contaId
        ? { ...c, grupo_id: grupoId, grupos: grupos.find(g => g.id === grupoId) }
        : c
    ) as ContaGerencial[]
    onContasChange(updated)

    try {
      await contasGerenciaisService.update(contaId, { grupo_id: grupoId })
    } catch {
      onContasChange(contas) // reverte em erro
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* 1 col mobile → 2 sm → 3 lg → 4 xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {grupos.map(grupo => (
          <GrupoCard
            key={grupo.id}
            grupo={grupo}
            contas={contas.filter(c => c.grupo_id === grupo.id)}
            isOver={overGroupId === grupo.id}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeConta ? <OverlayTag conta={activeConta} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
