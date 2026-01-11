import { normalizeString } from "../utils/stringUtils";
import { FIELD_KEYWORDS } from "../constants/categoryKeywords";

export const matchColumn = (field: string, columnName: string): number => {
  const keywords = FIELD_KEYWORDS[field.toLowerCase()];
  if (!keywords || !columnName) return 0;

  const normalizedColumn = normalizeString(columnName);

  if (keywords.some(keyword => normalizeString(keyword) === normalizedColumn)) {
    return 1.0;
  }

  if (keywords.some(keyword => normalizedColumn.includes(normalizeString(keyword)))) {
    return 0.7;
  }

  const columnWords = normalizedColumn.split(/\s+/);
  if (columnWords.some(word =>
    keywords.some(keyword => normalizeString(keyword).split(/\s+/).includes(word))
  )) {
    return 0.5;
  }

  return 0;
};

export const getBestMatch = (
  field: string,
  columnNames: string[]
): { columnName: string; score: number } | null => {
  let bestMatch: { columnName: string; score: number } | null = null;

  for (const columnName of columnNames) {
    const score = matchColumn(field, columnName);
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { columnName, score };
    }
  }

  return bestMatch;
};

export const addCustomKeywords = (field: string, keywords: string[]): void => {
  const fieldKey = field.toLowerCase();
  if (FIELD_KEYWORDS[fieldKey]) {
    FIELD_KEYWORDS[fieldKey].push(...keywords);
  } else {
    FIELD_KEYWORDS[fieldKey] = [...keywords];
  }
};
