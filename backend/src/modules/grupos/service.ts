import { GrupoRepository, CreateGrupoDTO } from "./repository.js";

export class GrupoService {

    constructor(
        private repository: GrupoRepository
    ) {}

    async findAll() {
        return this.repository.findAll();
    }

    async findById(id: number) {
        const grupo = await this.repository.findById(id);
        if (!grupo) throw new Error("Grupo não encontrado.");
        return grupo;
    }

    async create(dto: CreateGrupoDTO) {
        if (!dto.descricao?.trim()) {
            throw new Error("Descrição é obrigatória.");
        }

        let codigo: number;

        if (dto.codigo) {
            const existente = await this.repository.findByCodigo(dto.codigo);
            if (existente) {
                throw new Error(`Código ${dto.codigo} já está em uso.`);
            }
            codigo = dto.codigo;
        } else {
            const maxCodigo = await this.repository.getMaxCodigo();
            codigo = maxCodigo + 1;
        }

        return this.repository.create({ ...dto, codigo });
    }

    async update(id: number, dto: Partial<CreateGrupoDTO>) {
        await this.findById(id);

        if (dto.codigo) {
            const existente = await this.repository.findByCodigo(dto.codigo);
            if (existente && existente.id !== id) {
                throw new Error(`Código ${dto.codigo} já está em uso.`);
            }
        }

        if (dto.descricao !== undefined && !dto.descricao.trim()) {
            throw new Error("Descrição é obrigatória.");
        }

        return this.repository.update(id, dto);
    }

    async toggleAtivo(id: number) {
        const grupo = await this.findById(id);
        return this.repository.update(id, { ativo: !grupo.ativo });
    }

    async delete(id: number) {
        await this.findById(id);

        const count = await this.repository.countContasByGrupo(id);
        if (count > 0) {
            throw new Error(
                `Não é possível excluir este grupo pois ele possui ${count} conta${count > 1 ? 's' : ''} vinculada${count > 1 ? 's' : ''}. Remova ou mova as contas antes de excluir o grupo.`
            );
        }

        return this.repository.delete(id);
    }
}
