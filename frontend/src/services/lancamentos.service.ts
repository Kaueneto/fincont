import { api } from "./api";

export type LancamentoTipo   = "pagar" | "receber";
export type LancamentoStatus = "aberto" | "pago" | "recebido" | "cancelado";

export interface Lancamento {
    id: number;
    descricao: string;
    conta_gerencial_id: number;
    valor: number;
    tipo: LancamentoTipo;
    status: LancamentoStatus;
    data_lancamento: string;
    data_vencimento: string | null;
    data_pagamento: string | null;
    valor_pago: number | null;
    historico: string | null;
    created_at: string;
    updated_at: string;
    contas_gerenciais?: {
        id: number;
        codigo: number;
        descricao: string;
        grupos: {
            id: number;
            codigo: number;
            descricao: string;
        };
    };
}

export interface CreateLancamentoDTO {
    descricao: string;
    conta_gerencial_id: number;
    valor: number;
    tipo: LancamentoTipo;
    status?: LancamentoStatus;
    data_lancamento?: string;
    data_vencimento?: string | null;
    data_pagamento?: string | null;
    valor_pago?: number | null;
    historico?: string | null;
}

export interface LancamentoFilters {
    tipo?: LancamentoTipo | "";
    conta_gerencial_ids?: number[];   // mult seleção
    data_lancamento_ini?: string;
    data_lancamento_fim?: string;
    data_vencimento_ini?: string;
    data_vencimento_fim?: string;
}

function buildQuery(filters: LancamentoFilters): string {
    const params = new URLSearchParams();
    if (filters.tipo) params.set("tipo", filters.tipo);
    if (filters.conta_gerencial_ids?.length)
        params.set("conta_gerencial_ids", filters.conta_gerencial_ids.join(","));
    if (filters.data_lancamento_ini) params.set("data_lancamento_ini", filters.data_lancamento_ini);
    if (filters.data_lancamento_fim) params.set("data_lancamento_fim", filters.data_lancamento_fim);
    if (filters.data_vencimento_ini) params.set("data_vencimento_ini", filters.data_vencimento_ini);
    if (filters.data_vencimento_fim) params.set("data_vencimento_fim", filters.data_vencimento_fim);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

export const lancamentosService = {
    findAll: (filters: LancamentoFilters = {}) =>
        api.get<Lancamento[]>(`/lancamentos${buildQuery(filters)}`),
    create: (dto: CreateLancamentoDTO) =>
        api.post<Lancamento>("/lancamentos", dto),
    update: (id: number, dto: Partial<CreateLancamentoDTO>) =>
        api.put<Lancamento>(`/lancamentos/${id}`, dto),
    delete: (id: number) =>
        api.delete<void>(`/lancamentos/${id}`),
};
