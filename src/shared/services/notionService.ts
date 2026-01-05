import type { Transaction } from "../types";

const NOTION_API_KEY = import.meta.env.VITE_NOTION_TOKEN;
const NOTION_DATABASE_ID = import.meta.env.VITE_NOTION_DATABASE_ID;
const NOTION_ACCOUNTS_DATABASE_ID = import.meta.env
  .VITE_NOTION_ACCOUNTS_DATABASE_ID; // ID de la base de datos de cuentas (opcional)

export interface NotionAccount {
  id: string;
  name: string;
  owner?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

interface NotionPageProperties {
  Descripción?: {
    title: Array<{ text: { content: string } }>;
  };
  Fecha?: {
    date: { start: string };
  };
  Monto?: {
    number: number;
  };
  Tipo?: {
    select: { name: string };
  };
  Subcategoría?: {
    select: { name: string };
  };
  Cuenta?: {
    relation: Array<{ id: string }>;
  };
  Recurrente?: {
    checkbox: boolean;
  };
  Revisado?: {
    checkbox: boolean;
  };
  Automatizado?: {
    checkbox: boolean;
  };
}

interface NotionPageRequest {
  parent: {
    database_id: string;
  };
  properties: NotionPageProperties;
}

export interface UploadToNotionResult {
  success: boolean;
  uploaded: number;
  failed: number;
  errors?: string[];
}

/**
 * Convierte una fecha en formato DD/MM/YYYY a formato ISO para Notion
 */
function formatDateForNotion(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    throw new Error(`Formato de fecha inválido: ${dateStr}`);
  }
  const day = parts[0].padStart(2, "0");
  const month = parts[1].padStart(2, "0");
  const year = parts[2];

  return `${year}-${month}-${day}`;
}

/**
 * Crea una página en Notion para una transacción
 */
async function createNotionPage(
  transaction: Transaction,
  accountId?: string
): Promise<void> {
  if (!NOTION_API_KEY) {
    throw new Error("VITE_NOTION_TOKEN no está configurada");
  }
  if (!NOTION_DATABASE_ID) {
    throw new Error("VITE_NOTION_DATABASE_ID no está configurada");
  }

  try {
    const dateStr = formatDateForNotion(transaction.date);
    const tipo = transaction.type === "cargo" ? "Gasto" : "Ingreso";
    const categoria =
      transaction.selectedCategory || transaction.suggestedCategory || "Otros";

    const properties: NotionPageProperties = {
      Descripción: {
        title: [{ text: { content: transaction.description } }],
      },
      Fecha: {
        date: { start: dateStr },
      },
      Monto: {
        number: transaction.amount,
      },
      Tipo: {
        select: { name: tipo },
      },
      Subcategoría: {
        select: { name: categoria },
      },
      Recurrente: {
        checkbox: transaction.isRecurring || false,
      },
      Revisado: {
        checkbox: true,
      },
      Automatizado: {
        checkbox: true,
      },
    };

    // Agregar relación con Cuenta si está configurada
    // El Dueño se obtendrá automáticamente via Rollup desde la Cuenta relacionada
    if (accountId) {
      properties.Cuenta = {
        relation: [{ id: accountId }],
      };
    }

    const requestBody: NotionPageRequest = {
      parent: {
        database_id: NOTION_DATABASE_ID,
      },
      properties,
    };

    // Usar proxy para evitar CORS (funciona en dev con Vite y en prod con Vercel)
    const apiUrl = `/api/notion/pages`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-notion-token": NOTION_API_KEY || "", // El proxy convertirá esto a Authorization
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error al crear página en Notion: ${response.status} - ${JSON.stringify(
          errorData
        )}`
      );
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(`Error desconocido al crear página en Notion: ${error}`);
  }
}

/**
 * Sube múltiples transacciones a Notion con rate limiting
 */
export async function uploadTransactionsToNotion(
  transactions: Transaction[],
  accountId?: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<UploadToNotionResult> {
  if (!NOTION_API_KEY) {
    return {
      success: false,
      uploaded: 0,
      failed: transactions.length,
      errors: ["VITE_NOTION_TOKEN no está configurada"],
    };
  }

  if (!NOTION_DATABASE_ID) {
    return {
      success: false,
      uploaded: 0,
      failed: transactions.length,
      errors: ["VITE_NOTION_DATABASE_ID no está configurada"],
    };
  }

  if (transactions.length === 0) {
    return {
      success: true,
      uploaded: 0,
      failed: 0,
    };
  }

  let uploaded = 0;
  let failed = 0;
  const errors: string[] = [];

  // Rate limiting: Notion permite ~3 requests/segundo, usamos delay de 350ms entre requests
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    try {
      await createNotionPage(transaction, accountId);
      uploaded++;
      if (onProgress) {
        onProgress(uploaded, transactions.length);
      }

      // Delay para respetar rate limits (excepto en el último)
      if (i < transactions.length - 1) {
        await delay(350);
      }
    } catch (error) {
      failed++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push(`Transacción "${transaction.description}": ${errorMessage}`);

      // Si es un error de rate limit, esperamos un poco más antes de continuar
      if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        await delay(2000);
      }
    }
  }

  return {
    success: failed === 0,
    uploaded,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Obtiene todas las cuentas disponibles de Notion
 */
export async function getNotionAccounts(): Promise<NotionAccount[]> {
  if (!NOTION_API_KEY) {
    throw new Error("VITE_NOTION_TOKEN no está configurada");
  }

  if (!NOTION_ACCOUNTS_DATABASE_ID) {
    return [];
  }

  try {
    // Usar proxy para evitar CORS (funciona en dev con Vite y en prod con Vercel)
    const apiUrl = `/api/notion/databases/${NOTION_ACCOUNTS_DATABASE_ID}/query`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-notion-token": NOTION_API_KEY || "", // El proxy convertirá esto a Authorization
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        page_size: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error al obtener cuentas de Notion: ${
          response.status
        } - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const accounts: NotionAccount[] = [];

    for (const page of data.results || []) {
      // Intentar obtener el nombre desde diferentes propiedades comunes
      const properties = page.properties || {};
      let name = "";

      // Buscar en diferentes posibles nombres de propiedades
      if (properties.Nombre?.title?.[0]?.text?.content) {
        name = properties.Nombre.title[0].text.content;
      } else if (properties.name?.title?.[0]?.text?.content) {
        name = properties.name.title[0].text.content;
      } else if (properties.Cuenta?.title?.[0]?.text?.content) {
        name = properties.Cuenta.title[0].text.content;
      } else if (properties["Title"]?.title?.[0]?.text?.content) {
        name = properties["Title"].title[0].text.content;
      } else {
        // Si no encontramos nombre, usar el ID
        name = `Cuenta ${page.id.slice(0, 8)}`;
      }

      // Extraer información del dueño (People property)
      let owner: NotionAccount["owner"] | undefined;
      const ownerProperty =
        properties.Dueño || properties["Dueño"] || properties.owner;

      if (
        ownerProperty?.people &&
        Array.isArray(ownerProperty.people) &&
        ownerProperty.people.length > 0
      ) {
        const ownerData = ownerProperty.people[0];
        if (ownerData && typeof ownerData === "object" && "id" in ownerData) {
          // La API de Notion puede devolver diferentes estructuras para people
          // Intentamos obtener name y avatar_url de diferentes formas
          const ownerId = String(ownerData.id || "");
          let ownerName = "Usuario";
          let ownerAvatar: string | null = null;

          // Intentar obtener el nombre
          if ("name" in ownerData && typeof ownerData.name === "string") {
            ownerName = ownerData.name;
          } else if (
            "person" in ownerData &&
            typeof ownerData.person === "object" &&
            ownerData.person !== null
          ) {
            const person = ownerData.person as Record<string, unknown>;
            if ("name" in person && typeof person.name === "string") {
              ownerName = person.name;
            }
          }

          // Intentar obtener el avatar
          if (
            "avatar_url" in ownerData &&
            typeof ownerData.avatar_url === "string"
          ) {
            ownerAvatar = ownerData.avatar_url;
          } else if (
            "person" in ownerData &&
            typeof ownerData.person === "object" &&
            ownerData.person !== null
          ) {
            const person = ownerData.person as Record<string, unknown>;
            if (
              "avatar_url" in person &&
              typeof person.avatar_url === "string"
            ) {
              ownerAvatar = person.avatar_url;
            }
          }

          owner = {
            id: ownerId,
            name: ownerName,
            avatar_url: ownerAvatar,
          };
        }
      }

      accounts.push({
        id: page.id,
        name: name || "Sin nombre",
        owner,
      });
    }

    return accounts;
  } catch (error) {
    console.error("Error al obtener cuentas de Notion:", error);
    throw error instanceof Error
      ? error
      : new Error(`Error desconocido al obtener cuentas: ${error}`);
  }
}

/**
 * Verifica si las credenciales de Notion están configuradas
 */
export function isNotionConfigured(): boolean {
  return !!NOTION_API_KEY && !!NOTION_DATABASE_ID;
}
