import { categories } from "../constants/categories";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const CATEGORY_EXAMPLES_EXPENSES = `Ejemplos específicos de transacciones bancarias chilenas:

SUPERMERCADO: UNIMARC, FOOD MARKET, PRONTO COPEC, ISIDORA.COPEC, TUU MARKET, ALMACEN, LIDER, JUMBO, TOTTUS, SANTA ISABEL
TRANSPORTE: PAYU UBER TRIP, PAYU *UBER, RECORRIDO, BIPAYTEMUCO, LATAM.COM, TUU TRANSPORTES, COPEC (combustible), SKY AIRLINE
DELIVERY: PAYU UBER EATS, RAPPI, PEDIDOSYA, CORNERSHOP
RESTAURANT: NIU SUSHI, DELI A VARAS, CERVECERA, CERVECERIA, RATIO COFFEE, WONDERLAND CAFE, CAFETERIA, UDON, STARBUCKS, JUAN VALDEZ
STREAMING: MUBI, GOOGLE YOUTUBE, DL GOOGLE YOUTUBE, GOOGLE PLAY YOUTUBE, NEXTORY, NETFLIX, SPOTIFY, HBO MAX, AMAZON PRIME, CRUNCHYROLL, DRUMSCRIBE
TRABAJO: FIGMA, DIGITALOCEAN, CLAUDE.AI, OBSIDIAN, GITHUB, NOTION, AWS, GOOGLE CLOUD
GASTOS BÁSICOS: PAGO CGE, PAGO WOM, WOMPAY, luz, agua, gas, internet, teléfono
JUEGOS: PLAYSTATION NETWORK, PLAYSTATION, PSN, PS4, PS5, STEAM, NINTENDO, SWITCH, XBOX, DISCORD, EPIC GAMES, cualquier transacción relacionada con videojuegos, compras de juegos, suscripciones de juegos
CINE: CINEPLANET, CINES MOVILAND, CINEMARK, CINEPOLIS
SALUD: SALCOBRAND, CRUZ VERDE, C. VERDE, AHUMADA, farmacias
LIBROS: DIGITAL PUBLICATION, KINDLE, BUSCALIBRE, ANTARTICA
DECORACIÓN: CASAIDEAS, IKEA, HOMY, SODIMAC (decoración), muebles
VESTIMENTA: RIPLEY, FALABELLA, ZARA, H&M, PARIS, ropa
INVERSIONES: binance.com, BUDA, crypto, acciones
DEPORTE: Club Esgrima, Araucania Fen, gimnasio, GYM, SMARTFIT, Cualquier cosa relacionada a esgrima.
ARRIENDO: AIRBNB, TRANSF. PARA MIGUEL ARTURO
ESTÉTICA: peluquería, barbería, spa, manicure
LAVANDERÍA: lavandería, tintorería
CONCIERTOS: PUNTOTICKET, TICKETMASTER, eventos en vivo

CASOS AMBIGUOS → "Otros":
- APPLE.COM BILL
- MERCADOPAGO sin contexto
- Transferencias a personas sin contexto`;

const CATEGORY_EXAMPLES_INCOME = `Ejemplos para ingresos:
- "Remuneraciones" → "Sueldo"
- Cualquier otro ingreso → "Otros"`;

interface GroqCategoryResponse {
  category: string;
  reasoning?: string;
}

/**
 * Categoriza una transacción usando Groq AI cuando la categorización por reglas falla
 */
export async function categorizeWithGroq(
  description: string,
  transactionType: "cargo" | "abono"
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("VITE_GROQ_API_KEY no está configurada");
  }

  const isIncome = transactionType === "abono";
  const incomeCategories = ["Sueldo"];
  const availableCategories = isIncome
    ? categories.filter(
        (cat) => incomeCategories.includes(cat) || cat === "Otros"
      )
    : categories.filter(
        (cat) => !incomeCategories.includes(cat) || cat === "Otros"
      );

  const categoryExamples = isIncome
    ? CATEGORY_EXAMPLES_INCOME
    : CATEGORY_EXAMPLES_EXPENSES;

  const prompt = `Eres un asistente experto en categorización de transacciones bancarias chilenas.

Analiza la siguiente transacción bancaria y asigna la categoría más apropiada.

Tipo: ${isIncome ? "Ingreso (Abono)" : "Gasto (Cargo)"}
Descripción: "${description}"

Categorías válidas (debes usar EXACTAMENTE una de estas):
${availableCategories.map((cat, idx) => `  ${idx + 1}. ${cat}`).join("\n")}

${categoryExamples}

INSTRUCCIONES:
1. Analiza la descripción cuidadosamente, palabra por palabra
2. Identifica palabras clave que indiquen el tipo de transacción - busca coincidencias parciales (ej: "PLAYSTATION" dentro de "PLAYSTATION NETWORK SAN MAT")
3. Selecciona la categoría MÁS ESPECÍFICA que coincida con los ejemplos proporcionados
4. EVITA usar "Otros" a toda costa - haz un esfuerzo adicional para encontrar una categoría específica que encaje
5. Si ves palabras clave de los ejemplos (ej: PLAYSTATION, STEAM, NINTENDO para JUEGOS), usa esa categoría inmediatamente
6. Solo usa "Otros" como ÚLTIMO RECURSO si realmente es imposible determinar una categoría específica después de analizar todos los ejemplos y categorías disponibles
7. Prioriza categorías más generales pero específicas (como "Transporte", "Salud", "Trabajo", "Juegos", "Streaming", "Gastos Básicos") antes que "Otros"
8. IMPORTANTE: Busca coincidencias parciales - "PLAYSTATION NETWORK" debe categorizarse como "Juegos", incluso si hay texto adicional

EJEMPLOS DE ANÁLISIS:
- "PLAYSTATION NETWORK SAN MAT" → contiene "PLAYSTATION" → categoría: "Juegos"
- "PAYU UBER TRIP" → contiene "UBER" → categoría: "Transporte"
- "NETFLIX.COM" → contiene "NETFLIX" → categoría: "Streaming"

Responde ÚNICAMENTE con un objeto JSON válido:
{
  "category": "nombre_exacto_de_la_categoria"
}

CRÍTICO: 
- La categoría DEBE coincidir EXACTAMENTE con una de las categorías listadas arriba
- EVITA "Otros" siempre que sea posible - es preferible elegir una categoría específica aunque no sea perfecta
- Busca coincidencias parciales de palabras clave en la descripción`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente especializado en categorización de transacciones bancarias. Siempre respondes con JSON válido y estructurado.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error en la API de Groq: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Respuesta vacía de Groq");
    }

    let parsedResponse: GroqCategoryResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se pudo parsear la respuesta como JSON");
      }
    }

    const aiCategory = parsedResponse.category?.trim();

    if (!aiCategory) {
      throw new Error("La respuesta no contiene una categoría");
    }

    if (availableCategories.includes(aiCategory)) {
      return aiCategory;
    }

    console.warn(
      `Categoría de IA "${aiCategory}" no está en la lista válida, usando "Otros"`
    );
    return "Otros";
  } catch (error) {
    console.error("Error al categorizar con Groq:", error);
    throw error;
  }
}

/**
 * Categoriza múltiples transacciones en batch usando Groq AI
 */
export interface BatchCategoryItem {
  description: string;
  transactionType: "cargo" | "abono";
  batchIndex: number;
  originalIndex: number;
}

export interface BatchCategoryResult {
  batchIndex: number;
  category: string;
}

export async function categorizeBatchWithGroq(
  items: BatchCategoryItem[]
): Promise<BatchCategoryResult[]> {
  if (!GROQ_API_KEY) {
    throw new Error("VITE_GROQ_API_KEY no está configurada");
  }

  if (items.length === 0) {
    return [];
  }

  const incomeCategories = ["Sueldo"];
  const allCategories = categories;

  const itemsList = items
    .map((item, idx) => {
      const isIncome = item.transactionType === "abono";
      const availableCategories = isIncome
        ? allCategories.filter(
            (cat) => incomeCategories.includes(cat) || cat === "Otros"
          )
        : allCategories.filter(
            (cat) => !incomeCategories.includes(cat) || cat === "Otros"
          );

      return `${idx}. Tipo: ${
        isIncome ? "Ingreso (Abono)" : "Gasto (Cargo)"
      } | Descripción: "${
        item.description
      }" | Categorías disponibles: ${availableCategories.join(", ")}`;
    })
    .join("\n\n");

  const prompt = `Eres un asistente experto en categorización de transacciones bancarias chilenas utilizando sus nombres, palabras clave y montos como herramientas de deducción.

Necesito que categorices ${items.length} transacciones bancarias.

${CATEGORY_EXAMPLES_EXPENSES}

Transacciones a categorizar:
${itemsList}

Categorías válidas (debes usar EXACTAMENTE una de estas):
${allCategories.map((cat, idx) => `  ${idx + 1}. ${cat}`).join("\n")}

INSTRUCCIONES:
1. Analiza cada descripción cuidadosamente, palabra por palabra
2. Identifica palabras clave que indiquen el tipo de transacción - busca coincidencias parciales (ej: "PLAYSTATION" dentro de "PLAYSTATION NETWORK SAN MAT")
3. Selecciona la categoría MÁS ESPECÍFICA que coincida según los ejemplos proporcionados
4. EVITA usar "Otros" a toda costa - haz un esfuerzo adicional para encontrar una categoría específica que encaje para cada transacción utilizando ejemplos y categorías disponibles
5. Si ves palabras clave de los ejemplos (ej: PLAYSTATION, STEAM, NINTENDO para JUEGOS), usa esa categoría inmediatamente
6. Solo usa "Otros" como ÚLTIMO RECURSO si realmente es imposible determinar una categoría específica después de analizar todos los ejemplos y categorías disponibles
7. Prioriza categorías más generales pero específicas (como "Transporte", "Salud", "Trabajo", "Gastos Básicos", "Juegos", "Streaming") antes que "Otros"
8. Para ingresos (Abono), prioriza "Sueldo" y solo usa "Otros" si definitivamente no es un sueldo
9. IMPORTANTE: Busca coincidencias parciales - "PLAYSTATION NETWORK" debe categorizarse como "Juegos", incluso si hay texto adicional como "SAN MAT"

EJEMPLOS DE ANÁLISIS:
- "PLAYSTATION NETWORK SAN MAT" → contiene "PLAYSTATION" → categoría: "Juegos"
- "PAYU UBER TRIP" → contiene "UBER" → categoría: "Transporte"
- "NETFLIX.COM" → contiene "NETFLIX" → categoría: "Streaming"

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "categories": [
    {"index": 0, "category": "nombre_exacto_de_la_categoria"},
    {"index": 1, "category": "nombre_exacto_de_la_categoria"},
    ...
  ]
}

CRÍTICO: 
- Cada categoría DEBE coincidir EXACTAMENTE con una de las categorías listadas arriba
- El índice corresponde a la posición en la lista de transacciones (0-based)
- EVITA "Otros" siempre que sea posible - es preferible elegir una categoría específica aunque no sea perfecta
- No agregues texto adicional, solo el JSON`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente especializado en categorización de transacciones bancarias. Siempre respondes con JSON válido y estructurado.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error en la API de Groq: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Respuesta vacía de Groq");
    }

    let parsedResponse: {
      categories: Array<{ index: number; category: string }>;
    };
    try {
      parsedResponse = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se pudo parsear la respuesta como JSON");
      }
    }

    const results: BatchCategoryResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const aiResult = parsedResponse.categories?.find((c) => c.index === i);
      if (aiResult) {
        const aiCategory = aiResult.category?.trim();
        const isIncome = item.transactionType === "abono";
        const availableCategories = isIncome
          ? allCategories.filter(
              (cat) => incomeCategories.includes(cat) || cat === "Otros"
            )
          : allCategories.filter(
              (cat) => !incomeCategories.includes(cat) || cat === "Otros"
            );

        if (availableCategories.includes(aiCategory)) {
          results.push({
            batchIndex: item.batchIndex,
            category: aiCategory,
          });
        } else {
          console.warn(
            `Categoría de IA "${aiCategory}" no válida para ${item.transactionType}, usando "Otros"`
          );
          results.push({
            batchIndex: item.batchIndex,
            category: "Otros",
          });
        }
      } else {
        results.push({
          batchIndex: item.batchIndex,
          category: "Otros",
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error al categorizar batch con Groq:", error);
    throw error;
  }
}

/**
 * Verifica si la API key de Groq está configurada
 */
export function isGroqAvailable(): boolean {
  return !!GROQ_API_KEY;
}
