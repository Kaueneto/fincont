import { Router } from "express";
import { GrupoRepository } from "./repository.js";
import { GrupoService } from "./service.js";
import { GrupoController } from "./controller.js";

const router = Router();

const repository = new GrupoRepository();
const service = new GrupoService(repository);
const controller = new GrupoController(service);

router.get("/",            (req, res) => controller.findAll(req, res));
router.get("/:id",         (req, res) => controller.findById(req, res));
router.post("/",           (req, res) => controller.create(req, res));
router.put("/:id",         (req, res) => controller.update(req, res));
router.patch("/:id/ativo", (req, res) => controller.toggleAtivo(req, res));
router.delete("/:id",      (req, res) => controller.delete(req, res));

export default router;
