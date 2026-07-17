import { supabase } from "../../config/supabase.js";

export interface Grupo {
    id: number;
    codigo: number;
    descricao: string;
    icone: string | null;
    cor: string | null;
    ordem: number;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateGrupoDTO {
    codigo?: number;
    descricao: string;
    icone?: string;
    cor?: string;
    ordem?: number;
}

export class GrupoRepository {

    async findAll(): Promise<Grupo[]> {
        const { data, error } = await supabase
            .from("grupos")
            .select("*")
            .order("codigo", { ascending: true });

        if (error) throw error;
        return data ?? [];
    }

    async findById(id: number): Promise<Grupo | null> {
        const { data, error } = await supabase
            .from("grupos")
            .select("*")
            .eq("id", id)
            .single();

        if (error) return null;
        return data;
    }

    async findByCodigo(codigo: number): Promise<Grupo | null> {
        const { data, error } = await supabase
            .from("grupos")
            .select("*")
            .eq("codigo", codigo)
            .single();

        if (error) return null;
        return data;
    }

    async getMaxCodigo(): Promise<number> {
        const { data, error } = await supabase
            .from("grupos")
            .select("codigo")
            .order("codigo", { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return 1000;
        return data.codigo;
    }

    async create(dto: CreateGrupoDTO & { codigo: number }): Promise<Grupo> {
        const { data, error } = await supabase
            .from("grupos")
            .insert({
                codigo: dto.codigo,
                descricao: dto.descricao.trim(),
                icone: dto.icone ?? null,
                cor: dto.cor ?? null,
                ordem: dto.ordem ?? 0,
                ativo: true,
            })
            .select("*")
            .single();

        if (error) throw error;
        return data;
    }

    async update(id: number, fields: Partial<Omit<Grupo, "id" | "created_at">>): Promise<Grupo> {
        const { data, error } = await supabase
            .from("grupos")
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select("*")
            .single();

        if (error) throw error;
        return data;
    }

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from("grupos")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
}
