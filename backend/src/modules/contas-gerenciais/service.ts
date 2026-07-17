import { ContaGerencialRepository, CreateContaGerencialDTO } from "./repository.js";

export class ContaGerencialService {

    constructor(
        private repository: ContaGerencialRepository
    ) {}

    async findAll() {
        return this.repository.findAll();
    }

    async findById(id: number) {
        const conta = await this.repository.findById(id);
        if (!conta) throw new Error("Conta gerencial não encontrada.");
        return conta;
    }

    async create(dto: CreateContaGerencialDTO) {
        if (!dto.descricao?.trim()) {
            throw new Error("Descrição é obrigatória.");
        }

        if (!dto.grupo_id) {
            throw new Error("Grupo é obrigatório.");
        }

        let codigo: number;

        if (dto.codigo) {
            // verif se o cod informado já existe
            const existente = await this.repository.findByCodigo(dto.codigo);
            if (existente) {
                throw new Error(`cod ${dto.codigo} já está em uso.`);
            }
            codigo = dto.codigo;
        } else {
            // gera o prox cod automaticamente
            const maxCodigo = await this.repository.getMaxCodigo();
            codigo = maxCodigo + 1;
        }

        return this.repository.create({ ...dto, codigo });
    }

    async update(id: number, dto: Partial<CreateContaGerencialDTO>) {
        // verifica se existe
        await this.findById(id);

        // se trocou o cod, verifica duplicidade
        if (dto.codigo) {
            const existente = await this.repository.findByCodigo(dto.codigo);
            if (existente && existente.id !== id) {
                throw new Error(`cod ${dto.codigo} já está em uso.`);
            }
        }

        if (dto.descricao !== undefined && !dto.descricao.trim()) {
            throw new Error("Descrição é obrigatória.");
        }

        return this.repository.update(id, dto);
    }

    async toggleAtivo(id: number) {
        const conta = await this.findById(id);
        return this.repository.update(id, { ativo: !conta.ativo });
    }

    async delete(id: number) {
        await this.findById(id);
        return this.repository.delete(id);
    }
}
