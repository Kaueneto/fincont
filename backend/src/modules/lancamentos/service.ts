import { LancamentoRepository, CreateLancamentoDTO, LancamentoFilters } from "./repository.js";

export class LancamentoService {

    constructor(
        private repository: LancamentoRepository
    ) {}

    async findAll(filters: LancamentoFilters = {}) {
        return this.repository.findAll(filters);
    }

    async findById(id: number) {
        const lancamento = await this.repository.findById(id);
        if (!lancamento) throw new Error("Lançamento não encontrado.");
        return lancamento;
    }

    async create(dto: CreateLancamentoDTO) {
        if (!dto.descricao?.trim())
            throw new Error("Descrição é obrigatória.");

        if (!dto.conta_gerencial_id)
            throw new Error("Conta gerencial é obrigatória.");

        if (!dto.valor || dto.valor <= 0)
            throw new Error("Valor deve ser maior que zero.");

        if (!["pagar", "receber"].includes(dto.tipo))
            throw new Error("Tipo inválido. Use 'pagar' ou 'receber'.");

        return this.repository.create(dto);
    }

    async update(id: number, dto: Partial<CreateLancamentoDTO>) {
        await this.findById(id);

        if (dto.descricao !== undefined && !dto.descricao.trim())
            throw new Error("Descrição é obrigatória.");

        if (dto.valor !== undefined && dto.valor <= 0)
            throw new Error("Valor deve ser maior que zero.");

        return this.repository.update(id, dto);
    }

    async delete(id: number) {
        await this.findById(id);
        return this.repository.delete(id);
    }
}
