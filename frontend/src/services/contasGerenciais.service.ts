import { api } from "./api";

export interface ContaGerencial {
    id: number;
    grupo_id: number;
    codigo: number;
    descricao: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
    grupos?: {
        id: number;
        codigo: number;
        descricao: string;
    };
}

export interface CreateContaGerencialDTO {
    grupo_id: number;
    codigo?: number;
    descricao: string;
}

export const contasGerenciaisService = {
    findAll: ()                               => api.get<ContaGerencial[]>("/contas-gerenciais"),
    create:  (dto: CreateContaGerencialDTO)   => api.post<ContaGerencial>("/contas-gerenciais", dto),
    update:  (id: number, dto: Partial<CreateContaGerencialDTO>) =>
                                                 api.put<ContaGerencial>(`/contas-gerenciais/${id}`, dto),
    toggleAtivo: (id: number)                => api.patch<ContaGerencial>(`/contas-gerenciais/${id}/ativo`),
    delete:  (id: number)                    => api.delete<void>(`/contas-gerenciais/${id}`),
};
