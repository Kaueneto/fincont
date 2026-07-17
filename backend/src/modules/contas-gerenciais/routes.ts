import { Router } from "express";
import { ContaGerencialRepository } from "./repository.js";
import { ContaGerencialService } from "./service.js";
import { ContaGerencialController } from "./controller.js";

const router = Router();

const repository = new ContaGerencialRepository();
const service = new ContaGerencialService(repository);
const controller = new ContaGerencialController(service);

router.get("/",           (req, res) => controller.findAll(req, res));
router.get("/:id",        (req, res) => controller.findById(req, res));
router.post("/",          (req, res) => controller.create(req, res));
router.put("/:id",        (req, res) => controller.update(req, res));
router.patch("/:id/ativo",(req, res) => controller.toggleAtivo(req, res));
router.delete("/:id",     (req, res) => controller.delete(req, res));

export default router;
