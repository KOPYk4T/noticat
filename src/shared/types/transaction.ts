export type Confidence = "high" | "ai" | "low";
export type TransactionType = "cargo" | "abono";

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: TransactionType; // cargo = gasto/egreso, abono = ingreso
  suggestedCategory: string;
  confidence: Confidence;
  selectedCategory?: string;
  isRecurring?: boolean; // true si es un pago recurrente (suscripciones, cuentas mensuales, etc.)
}
