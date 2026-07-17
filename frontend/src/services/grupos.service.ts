import { api } from "./api";

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
}

export const gruposService = {
    findAll: ()                          => api.get<Grupo[]>("/grupos"),
    create:  (dto: CreateGrupoDTO)       => api.post<Grupo>("/grupos", dto),
    update:  (id: number, dto: Partial<CreateGrupoDTO>) =>
                                            api.put<Grupo>(`/grupos/${id}`, dto),
    toggleAtivo: (id: number)            => api.patch<Grupo>(`/grupos/${id}/ativo`),
    delete:  (id: number)                => api.delete<void>(`/grupos/${id}`),
};
