import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir solo métodos POST y GET
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Obtener el path desde los parámetros
  const { path } = req.query;
  const notionPath = Array.isArray(path) ? path.join("/") : path || "";

  // Construir la URL de Notion
  const notionUrl = `https://api.notion.com/v1/${notionPath}`;

  // Obtener el token desde el header personalizado
  const notionToken = req.headers["x-notion-token"] as string;

  if (!notionToken) {
    return res.status(401).json({ error: "Notion token required" });
  }

  try {
    // Preparar los headers para Notion
    const headers: Record<string, string> = {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    // Preparar el body si existe
    let body: string | undefined;
    if (req.method === "POST" && req.body) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    // Hacer la petición a Notion
    const response = await fetch(notionUrl, {
      method: req.method,
      headers,
      body,
    });

    // Leer la respuesta
    const data = await response.json();

    // Retornar la respuesta con el mismo status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to Notion:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
