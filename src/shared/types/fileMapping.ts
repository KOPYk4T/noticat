export type DateFormat = "MM/DD/YY" | "DD/MM/YYYY" | "auto";

export interface ColumnMapping {
  date: string | null; // Nombre de columna → Fecha
  description: string | null; // Nombre de columna → Descripción
  amount: string | null; // Nombre de columna → Monto
  dateFormat?: DateFormat; // Formato de fecha del archivo (siempre se muestra DD/MM/YYYY en UI)
  // Nota: El tipo (cargo/abono) se calcula automáticamente del monto o columnas cargo/abono
  // O para bancos que tienen cargo/abono separados:
  cargo?: string | null;
  abono?: string | null;
}

export interface FileStructure {
  headers: string[];
  rows: (string | number)[][];
  detectedDelimiter?: string;
}

export interface MappingResult {
  mapping: ColumnMapping;
  isAutoDetected: boolean;
  confidence: number; // 0-1
}

