import { supabase } from "../../config/supabase.js";

export interface ContaGerencial {
    id: number;
    grupo_id: number;
    codigo: number;
    descricao: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateContaGerencialDTO {
    grupo_id: number;
    codigo?: number;
    descricao: string;
}

export class ContaGerencialRepository {

    async findAll(): Promise<ContaGerencial[]> {
        const { data, error } = await supabase
            .from("contas_gerenciais")
            .select("*, grupos(id, descricao, codigo)")
            .order("codigo", { ascending: true });

        if (error) throw error;
        return data ?? [];
    }

    async findById(id: number): Promise<ContaGerencial | null> {
        const { data, error } = await supabase
            .from("contas_gerenciais")
            .select("*, grupos(id, descricao, codigo)")
            .eq("id", id)
            .single();

        if (error) return null;
        return data;
    }

    async findByCodigo(codigo: number): Promise<ContaGerencial | null> {
        const { data, error } = await supabase
            .from("contas_gerenciais")
            .select("*")
            .eq("codigo", codigo)
            .single();

        if (error) return null;
        return data;
    }

    async getMaxCodigo(): Promise<number> {
        const { data, error } = await supabase
            .from("contas_gerenciais")
            .select("codigo")
            .order("codigo", { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return 1000; // próximo será 1001
        return data.codigo;
    }

    async create(dto: CreateContaGerencialDTO & { codigo: number }): Promise<ContaGerencial> {
        const { data, error } = await supabase
            .from("contas_gerenciais")
            .insert({
                grupo_id: dto.grupo_id,
                codigo: dto.codigo,
                descricao: dto.descricao.trim(),
                ativo: true,
            })
            .select("*, grupos(id, descricao, codigo)")
            .single();

        if (error) throw error;
        return data;
    }

    async update(id: number, fields: Partial<Omit<ContaGerencial, "id" | "created_at">>): Promise<ContaGerencial> {
        const { data, error } = await supabase
            .from("contas_gerenciais")
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select("*, grupos(id, descricao, codigo)")
            .single();

        if (error) throw error;
        return data;
    }

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from("contas_gerenciais")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
}
