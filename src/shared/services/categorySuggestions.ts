import type { Confidence } from "../types";
import type { TransactionType } from "../types/transaction";
import { applyTemplates } from "./templateService";
import { CATEGORY_RULES, RECURRING_KEYWORDS } from "../constants/categoryKeywords";

export const detectRecurringTransaction = (description: string): boolean => {
  const upperDescription = description.toUpperCase();
  return RECURRING_KEYWORDS.some(keyword => upperDescription.includes(keyword));
};

export const suggestCategory = (
  description: string,
  transactionType: TransactionType
): { category: string; confidence: Confidence } => {
  const templateResult = applyTemplates(description);
  if (templateResult) {
    return {
      category: templateResult.category,
      confidence: templateResult.confidence === "high" ? "high" : "low",
    };
  }

  const upperDescription = description.toUpperCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(keyword => upperDescription.includes(keyword))) {
      return { category: rule.category, confidence: rule.confidence };
    }
  }

  if (transactionType === "abono") {
    if (upperDescription.includes("SUELDO") || upperDescription.includes("REMUNERACIONES")) {
      return { category: "Sueldo", confidence: "high" };
    }
  }

  return { category: "Otros", confidence: "low" };
};
