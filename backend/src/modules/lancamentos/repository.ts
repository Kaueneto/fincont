import { supabase } from "../../config/supabase.js";

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
    // joins
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
    tipo?: LancamentoTipo;
    conta_gerencial_ids?: number[];   // múltipla seleção
    data_lancamento_ini?: string;
    data_lancamento_fim?: string;
    data_vencimento_ini?: string;
    data_vencimento_fim?: string;
}

const SELECT_WITH_JOINS = `
    *,
    contas_gerenciais (
        id, codigo, descricao,
        grupos ( id, codigo, descricao )
    )
`;

export class LancamentoRepository {

    async findAll(filters: LancamentoFilters = {}): Promise<Lancamento[]> {
        let query = supabase
            .from("lancamentos")
            .select(SELECT_WITH_JOINS)
            .order("data_lancamento", { ascending: false })
            .order("id", { ascending: false });

        if (filters.tipo)
            query = query.eq("tipo", filters.tipo);

        if (filters.conta_gerencial_ids?.length)
            query = query.in("conta_gerencial_id", filters.conta_gerencial_ids);

        if (filters.data_lancamento_ini)
            query = query.gte("data_lancamento", filters.data_lancamento_ini);

        if (filters.data_lancamento_fim)
            query = query.lte("data_lancamento", filters.data_lancamento_fim);

        if (filters.data_vencimento_ini)
            query = query.gte("data_vencimento", filters.data_vencimento_ini);

        if (filters.data_vencimento_fim)
            query = query.lte("data_vencimento", filters.data_vencimento_fim);

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    }

    async findById(id: number): Promise<Lancamento | null> {
        const { data, error } = await supabase
            .from("lancamentos")
            .select(SELECT_WITH_JOINS)
            .eq("id", id)
            .single();

        if (error) return null;
        return data;
    }

    async create(dto: CreateLancamentoDTO): Promise<Lancamento> {
        const { data, error } = await supabase
            .from("lancamentos")
            .insert({
                descricao:          dto.descricao.trim(),
                conta_gerencial_id: dto.conta_gerencial_id,
                valor:              dto.valor,
                tipo:               dto.tipo,
                status:             dto.status ?? "aberto",
                data_lancamento:    dto.data_lancamento ?? new Date().toISOString().slice(0, 10),
                data_vencimento:    dto.data_vencimento ?? null,
                data_pagamento:     dto.data_pagamento ?? null,
                valor_pago:         dto.valor_pago ?? null,
                historico:          dto.historico?.trim() ?? null,
            })
            .select(SELECT_WITH_JOINS)
            .single();

        if (error) throw error;
        return data;
    }

    async update(id: number, fields: Partial<CreateLancamentoDTO>): Promise<Lancamento> {
        const payload: Record<string, unknown> = {
            ...fields,
            updated_at: new Date().toISOString(),
        };
        if (fields.descricao) payload.descricao = fields.descricao.trim();
        if (fields.historico)  payload.historico  = fields.historico.trim();

        const { data, error } = await supabase
            .from("lancamentos")
            .update(payload)
            .eq("id", id)
            .select(SELECT_WITH_JOINS)
            .single();

        if (error) throw error;
        return data;
    }

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from("lancamentos")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
}
