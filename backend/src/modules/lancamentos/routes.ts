import { Router } from "express";
import { LancamentoRepository } from "./repository.js";
import { LancamentoService } from "./service.js";
import { LancamentoController } from "./controller.js";

const router = Router();

const repository = new LancamentoRepository();
const service    = new LancamentoService(repository);
const controller = new LancamentoController(service);

router.get("/",    (req, res) => controller.findAll(req, res));
router.get("/:id", (req, res) => controller.findById(req, res));
router.post("/",   (req, res) => controller.create(req, res));
router.put("/:id", (req, res) => controller.update(req, res));
router.delete("/:id", (req, res) => controller.delete(req, res));

export default router;
