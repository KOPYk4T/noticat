import * as XLSX from "xlsx";
import type { FileStructure } from "../types/fileMapping";

export interface ParseCsvResult {
  success: boolean;
  structure?: FileStructure;
  error?: string;
}

/**
 * Parsea un archivo CSV/Excel y extrae su estructura (headers y rows)
 */
export async function parseCsvToStructure(
  file: File
): Promise<ParseCsvResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Intentar detectar delimitador desde la extensión o contenido
    let delimiter: string | undefined;
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      // Leer las primeras líneas para detectar delimitador
      const text = new TextDecoder().decode(arrayBuffer.slice(0, 1024));
      delimiter = detectDelimiter(text);
    }

    // Leer workbook con XLSX (soporta CSV, XLS, XLSX)
    // XLSX.read detecta automáticamente el delimitador para CSV
    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
    });

    // Usar la primera hoja
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      return {
        success: false,
        error: "No se encontró ninguna hoja en el archivo",
      };
    }

    // Convertir a JSON con headers en la primera fila
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as any[][];

    if (data.length === 0) {
      return {
        success: false,
        error: "El archivo está vacío",
      };
    }

    // La primera fila son los headers
    const headers = data[0]
      .map((cell) => String(cell || "").trim())
      .filter((header) => header.length > 0);

    if (headers.length === 0) {
      return {
        success: false,
        error: "No se encontraron headers válidos en la primera fila",
      };
    }

    // Las siguientes filas son los datos
    const rows: (string | number)[][] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Asegurar que todas las filas tengan el mismo número de columnas que headers
      const normalizedRow: (string | number)[] = [];
      for (let j = 0; j < headers.length; j++) {
        const cell = row[j];
        // Intentar convertir a número si es posible
        const numValue = parseFloat(String(cell || ""));
        normalizedRow.push(
          !isNaN(numValue) && String(cell || "").trim() === String(numValue)
            ? numValue
            : String(cell || "").trim()
        );
      }
      // Solo agregar filas que tengan al menos una celda con contenido
      if (normalizedRow.some((cell) => String(cell).trim().length > 0)) {
        rows.push(normalizedRow);
      }
    }

    if (rows.length === 0) {
      return {
        success: false,
        error: "No se encontraron filas de datos válidas",
      };
    }

    return {
      success: true,
      structure: {
        headers,
        rows,
        detectedDelimiter: delimiter,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Error al procesar CSV: ${error.message}`
          : "Error desconocido al procesar CSV",
    };
  }
}

/**
 * Detecta el delimitador más probable en un texto CSV
 */
function detectDelimiter(text: string): string {
  const delimiters = [",", ";", "\t", "|"];
  const counts: Record<string, number> = {};

  for (const delimiter of delimiters) {
    const lines = text.split("\n").slice(0, 10); // Revisar primeras 10 líneas
    const lineCounts = lines.map((line) =>
      (line.match(new RegExp(`\\${delimiter}`, "g")) || []).length
    );
    const avgCount = lineCounts.reduce((a, b) => a + b, 0) / lineCounts.length;

    // Preferir delimitadores que aparezcan consistentemente
    const consistency = lineCounts.every(
      (count) => Math.abs(count - avgCount) <= 1
    );
    counts[delimiter] = consistency ? avgCount : 0;
  }

  // Retornar el delimitador con mayor conteo
  let bestDelimiter = ",";
  let maxCount = 0;

  for (const [delimiter, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

