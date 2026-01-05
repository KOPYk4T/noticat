import type { Confidence } from "../types";
import type { TransactionType } from "../types/transaction";

interface CategoryRule {
  keywords: string[];
  category: string;
  confidence: Confidence;
}

const categoryRules: CategoryRule[] = [
  {
    keywords: [
      "SUPERMERCADO",
      "UNIMARC",
      "LIDER",
      "JUMBO",
      "SANTA ISABEL",
      "TOTTUS",
      "FOOD MARKET",
      "PRONTO COPEC",
      "ISIDORA.COPEC",
      "TUU MARKET",
      "ALMACEN",
    ],
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
    keywords: [
      "RESTAURANT",
      "RESTORAN",
      "CAFE",
      "SUSHI",
      "PIZZA",
      "MCDONALDS",
      "BURGER",
      "NIU SUSHI",
      "DELI A VARAS",
      "CERVECERA",
      "CERVECERIA",
      "RATIO COFFEE",
      "WONDERLAND CAFE",
      "CAFETERIA",
      "UDON",
      "STARBUCKS",
    ],
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
    keywords: [
      "CLAUDE",
      "OPENAI",
      "GITHUB",
      "NOTION",
      "OBSIDIAN",
      "FIGMA",
      "DIGITALOCEAN",
      "AWS",
      "GOOGLE CLOUD",
    ],
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
    keywords: [
      "GYM",
      "GIMNASIO",
      "SPORT",
      "DEPORTE",
      "FUTBOL",
      "TENIS",
      "ESGRIMA",
    ],
    category: "Deporte",
    confidence: "high",
  },
  {
    keywords: ["LAVANDERIA", "LAVANDERÍA", "DRY CLEAN"],
    category: "Lavandería",
    confidence: "high",
  },
  {
    keywords: ["PAGO", "PAGO CGE", "PAGO WOM", "CUENTA", "SERVICIO", "WOMPAY"],
    category: "Gastos Básicos",
    confidence: "high",
  },
  {
    keywords: [
      "MUBI",
      "GOOGLE YOUTUBE",
      "DL GOOGLE YOUTUBE",
      "GOOGLE PLAY YOUTUBE",
      "NEXTORY",
      "NETFLIX",
      "SPOTIFY",
      "HBO MAX",
      "AMAZON PRIME",
      "CRUNCHYROLL",
      "DRUMSCRIBE",
    ],
    category: "Streaming",
    confidence: "high",
  },
  {
    keywords: ["TRANSFERENCIA", "TRANSF"],
    category: "Otros",
    confidence: "low",
  },
  {
    keywords: ["DIGITAL PUBLICATION", "KINDLE", "BUSCALIBRE", "ANTARTICA"],
    category: "Libros",
    confidence: "high",
  },
  {
    keywords: [
      "PLAYSTATION",
      "PLAY STATION",
      "PSN",
      "PS4",
      "PS5",
      "STEAM",
      "NINTENDO",
      "SWITCH",
      "XBOX",
      "DISCORD",
      "EPIC GAMES",
      "EPICGAMES",
      "JUEGOS",
      "GAME",
      "GAMING",
    ],
    category: "Juegos",
    confidence: "high",
  },
  // Ahorro
  {
    keywords: ["AHORRO"],
    category: "Ahorro",
    confidence: "high",
  },
];

/**
 * Keywords que indican que una transacción es recurrente
 */
const recurringKeywords = [
  "NETFLIX",
  "SPOTIFY",
  "AMAZON PRIME",
  "HBO MAX",
  "DISNEY",
  "YOUTUBE",
  "GOOGLE YOUTUBE",
  "GOOGLE PLAY",
  "APPLE.COM BILL",
  "MUBI",
  "CRUNCHYROLL",
  "NEXTORY",
  "DRUMSCRIBE",
  "FIGMA",
  "NOTION",
  "GITHUB",
  "DIGITALOCEAN",
  "AWS",
  "GOOGLE CLOUD",
  "PAGO CGE",
  "PAGO WOM",
  "WOMPAY",
  "ARRIENDO",
  "AIRBNB",
  "CLUB ESCRIMA",
  "GYM",
  "GIMNASIO",
  "SMARTFIT",
  "SUBSCRIPTION",
  "SUSCRIPCION",
  "MENSUAL",
  "RECURRENTE",
  "RENOVACION",
];

/**
 * Detecta si una transacción es recurrente basándose en keywords
 */
export function detectRecurringTransaction(description: string): boolean {
  const upperDescription = description.toUpperCase();

  for (const keyword of recurringKeywords) {
    if (upperDescription.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Sugiere una categoría para una transacción basándose en su descripción
 * Esta versión NO usa IA, solo reglas/regex
 */
export function suggestCategory(
  description: string,
  transactionType: TransactionType
): { category: string; confidence: Confidence } {
  const upperDescription = description.toUpperCase();

  for (const rule of categoryRules) {
    for (const keyword of rule.keywords) {
      if (upperDescription.includes(keyword)) {
        return {
          category: rule.category,
          confidence: rule.confidence,
        };
      }
    }
  }

  if (transactionType === "abono") {
    if (
      upperDescription.includes("SUELDO") ||
      upperDescription.includes("REMUNERACIONES")
    ) {
      return {
        category: "Sueldo",
        confidence: "high",
      };
    }
  }

  return {
    category: "Otros",
    confidence: "low",
  };
}
