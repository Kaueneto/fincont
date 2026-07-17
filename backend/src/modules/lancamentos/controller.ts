import { Request, Response } from "express";
import { LancamentoService } from "./service.js";
import type { LancamentoFilters } from "./repository.js";

export class LancamentoController {

    constructor(
        private service: LancamentoService
    ) {}

    async findAll(req: Request, res: Response) {
        try {
            const filters: LancamentoFilters = {
                tipo:                req.query.tipo as any,
                conta_gerencial_ids: req.query.conta_gerencial_ids
                    ? String(req.query.conta_gerencial_ids).split(",").map(Number).filter(Boolean)
                    : undefined,
                data_lancamento_ini: req.query.data_lancamento_ini as string,
                data_lancamento_fim: req.query.data_lancamento_fim as string,
                data_vencimento_ini: req.query.data_vencimento_ini as string,
                data_vencimento_fim: req.query.data_vencimento_fim as string,
            };
            const data = await this.service.findAll(filters);
            return res.json(data);
        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }

    async findById(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const data = await this.service.findById(id);
            return res.json(data);
        } catch (err: any) {
            return res.status(404).json({ message: err.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const data = await this.service.create(req.body);
            return res.status(201).json(data);
        } catch (err: any) {
            return res.status(400).json({ message: err.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const data = await this.service.update(id, req.body);
            return res.json(data);
        } catch (err: any) {
            return res.status(400).json({ message: err.message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            await this.service.delete(id);
            return res.status(204).send();
        } catch (err: any) {
            return res.status(400).json({ message: err.message });
        }
    }
}
