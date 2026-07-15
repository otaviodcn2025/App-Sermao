import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import the gemini functions
import * as gemini from "./src/lib/gemini";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request bodies
  app.use(express.json({ limit: "10mb" }));

  // API route to check server health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Generic endpoint to execute any non-streaming Gemini function
  app.post("/api/gemini/call", async (req, res) => {
    const { fn, args } = req.body;
    try {
      if (!fn || typeof (gemini as any)[fn] !== "function") {
        res.status(400).json({ error: `Função '${fn}' não encontrada ou não suportada.` });
        return;
      }

      console.log(`[Server] Executando função Gemini: ${fn}`);
      const result = await (gemini as any)[fn](...args);
      res.json({ result });
    } catch (error: any) {
      console.error(`[Server] Erro na função ${fn}:`, error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // Streaming endpoint for sermon outline generation
  app.get("/api/gemini/stream", async (req, res) => {
    const { topic, baseText, context, userPrompt, style } = req.query;
    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      console.log(`[Server] Iniciando transmissão do esboço para: ${topic}`);
      const stream = gemini.generateSermonOutlineStream(
        topic as string,
        (baseText as string) || undefined,
        (context as string) || undefined,
        (userPrompt as string) || undefined,
        (style as any) || "traditional"
      );

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("[Server] Erro na transmissão do esboço:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || String(error) })}\n\n`);
      res.end();
    }
  });

  // Vite middleware setup based on environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
