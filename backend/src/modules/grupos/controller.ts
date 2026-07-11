import { Request, Response } from "express";
import { GrupoService } from "./service.js";

export class GrupoController {

    constructor(
        private service: GrupoService
    ) {}

}