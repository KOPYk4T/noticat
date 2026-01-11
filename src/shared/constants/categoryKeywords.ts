import type { Confidence } from "../types";

export interface CategoryRule {
  keywords: string[];
  category: string;
  confidence: Confidence;
}

export const CATEGORY_RULES: CategoryRule[] = [
  {
    keywords: ["SUPERMERCADO", "UNIMARC", "LIDER", "JUMBO", "SANTA ISABEL", "TOTTUS", "FOOD MARKET", "PRONTO COPEC", "ISIDORA.COPEC", "TUU MARKET", "ALMACEN"],
    category: "Supermercado",
    confidence: "high",
  },
  {
    keywords: ["DELIVERY", "RAPPI", "UBER EATS", "PEDIDOS YA"],
    category: "Delivery",
    confidence: "high",
  },
  {
    keywords: ["UBER TRIP", "TAXI", "TRANSPORTE", "METRO", "BUS", "RECORRIDO"],
    category: "Transporte",
    confidence: "high",
  },
  {
    keywords: ["RESTAURANT", "RESTORAN", "CAFE", "SUSHI", "PIZZA", "MCDONALDS", "BURGER", "NIU SUSHI", "DELI A VARAS", "CERVECERA", "CERVECERIA", "RATIO COFFEE", "WONDERLAND CAFE", "CAFETERIA", "UDON", "STARBUCKS"],
    category: "Restaurant",
    confidence: "high",
  },
  {
    keywords: ["AIRBNB", "HOTEL", "HOSPEDAJE", "MIGUEL ARTURO", "BRAVO GI SPA"],
    category: "Arriendo",
    confidence: "high",
  },
  {
    keywords: ["SUELDO", "REMUNERACIONES", "TRANSFERENCIA SUELDO"],
    category: "Sueldo",
    confidence: "high",
  },
  {
    keywords: ["CLAUDE", "OPENAI", "GITHUB", "NOTION", "OBSIDIAN", "FIGMA", "DIGITALOCEAN", "AWS", "GOOGLE CLOUD"],
    category: "Trabajo",
    confidence: "high",
  },
  {
    keywords: ["CINE", "MOVILAND", "HOYTS"],
    category: "Cine",
    confidence: "high",
  },
  {
    keywords: ["FARMACIA", "FARMA", "CRUZ VERDE", "SALCOBRAND"],
    category: "Salud",
    confidence: "high",
  },
  {
    keywords: ["GYM", "GIMNASIO", "SPORT", "DEPORTE", "FUTBOL", "TENIS", "ESGRIMA"],
    category: "Deporte",
    confidence: "high",
  },
  {
    keywords: ["LAVANDERIA", "LAVANDERÍA", "DRY CLEAN"],
    category: "Lavandería",
    confidence: "high",
  },
  {
    keywords: ["TRANSFERENCIA", "TRANSF", "MERCADO PAGO"],
    category: "Otros",
    confidence: "low",
  },
  {
    keywords: ["PAGO", "PAGO CGE", "PAGO WOM", "CUENTA", "SERVICIO", "WOMPAY"],
    category: "Gastos Básicos",
    confidence: "high",
  },
  {
    keywords: ["MUBI", "GOOGLE YOUTUBE", "DL GOOGLE YOUTUBE", "GOOGLE PLAY YOUTUBE", "NEXTORY", "NETFLIX", "SPOTIFY", "HBO MAX", "AMAZON PRIME", "CRUNCHYROLL", "DRUMSCRIBE"],
    category: "Streaming",
    confidence: "high",
  },
  {
    keywords: ["DIGITAL PUBLICATION", "KINDLE", "BUSCALIBRE", "ANTARTICA"],
    category: "Libros",
    confidence: "high",
  },
  {
    keywords: ["PLAYSTATION", "PLAY STATION", "PSN", "PS4", "PS5", "STEAM", "NINTENDO", "SWITCH", "XBOX", "DISCORD", "EPIC GAMES", "EPICGAMES", "JUEGOS", "GAME", "GAMING"],
    category: "Juegos",
    confidence: "high",
  },
  {
    keywords: ["AHORRO"],
    category: "Ahorro",
    confidence: "high",
  },
];

export const RECURRING_KEYWORDS = [
  "NETFLIX", "SPOTIFY", "AMAZON PRIME", "HBO MAX", "DISNEY", "YOUTUBE", "GOOGLE YOUTUBE", "GOOGLE PLAY", "APPLE.COM BILL", "MUBI", "CRUNCHYROLL", "NEXTORY", "DRUMSCRIBE",
  "FIGMA", "NOTION", "GITHUB", "DIGITALOCEAN", "AWS", "GOOGLE CLOUD",
  "PAGO CGE", "PAGO WOM", "WOMPAY",
  "ARRIENDO", "AIRBNB",
  "CLUB ESCRIMA", "GYM", "GIMNASIO", "SMARTFIT",
  "SUBSCRIPTION", "SUSCRIPCION", "MENSUAL", "RECURRENTE", "RENOVACION",
];

export const FIELD_KEYWORDS: Record<string, string[]> = {
  date: ["fecha", "date", "fecha pago", "fecha operación", "fecha transacción", "fecha operacion", "fecha transaccion", "fecha de operación", "fecha de pago", "fecha de transacción", "fecha operativa", "fecha valor"],
  description: ["descripción", "descripcion", "description", "concepto", "detalle", "glosa", "desc", "concept", "detalle de operación", "detalle de operacion", "descripción de operación", "motivo"],
  amount: ["monto", "amount", "valor", "importe", "cargo", "abono", "debe", "haber", "valor de operación", "valor de operacion", "total", "saldo"],
  type: ["tipo", "type", "tipo de operación", "tipo de operacion", "tipo operación", "operación", "operacion"],
  cargo: ["cargo", "debe", "egreso", "débito", "debito", "retiro", "salida"],
  abono: ["abono", "haber", "ingreso", "crédito", "credito", "depósito", "deposito", "entrada"],
};
