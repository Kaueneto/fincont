import express from "express";
import cors from "cors";
import gruposRouter from "./modules/grupos/routes.js";
import contasGerenciaisRouter from "./modules/contas-gerenciais/routes.js";
import lancamentosRouter from "./modules/lancamentos/routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// rotars
app.use("/grupos", gruposRouter);
app.use("/contas-gerenciais", contasGerenciaisRouter);
app.use("/lancamentos", lancamentosRouter);

app.get("/health", (_, res) => {
    res.status(200).json({
        status: "online",
        message: "API funfando",
    });
});

export default app;
