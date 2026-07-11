import express from "express";
import cors from "cors";
import { supabase } from "./config/supabase.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/teste-banco", async (_, res) => {
    const { data, error } = await supabase
        .from("grupos")
        .select("*");

    if (error) {
        return res.status(500).json(error);
    }

    return res.json(data);
});

app.get("/health", (_, res) => {
    res.status(200).json({
        status: "online",
        message: "API funfano"
    });
});

export default app;