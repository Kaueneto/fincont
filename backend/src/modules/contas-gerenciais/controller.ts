import { Request, Response } from "express";
import { ContaGerencialService } from "./service.js";

export class ContaGerencialController {

    constructor(
        private service: ContaGerencialService
    ) {}

    async findAll(req: Request, res: Response) {
        try {
            const data = await this.service.findAll();
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

    async toggleAtivo(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const data = await this.service.toggleAtivo(id);
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
