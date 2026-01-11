import type { ColumnMapping, FileStructure, MappingResult } from "../types/fileMapping";
import { getBestMatch, matchColumn } from "./keywordMatcher";
import { detectDateFormat, normalizeDate } from "../utils/dateUtils";
import { parseAmount } from "../utils/amountUtils";

export const inferColumnMapping = (structure: FileStructure): MappingResult => {
  const { headers, rows } = structure;
  const mapping: ColumnMapping = {
    date: null,
    description: null,
    amount: null,
    cargo: null,
    abono: null,
    dateFormat: "auto" as const,
  };

  let totalConfidence = 0;
  let matchedFields = 0;

  const fields: Array<"date" | "description" | "amount"> = ["date", "description", "amount"];

  for (const field of fields) {
    const match = getBestMatch(field, headers);
    if (match && match.score >= 0.5) {
      mapping[field] = match.columnName;
      totalConfidence += match.score;
      matchedFields++;
    }
  }

  const cargoMatch = getBestMatch("cargo", headers);
  const abonoMatch = getBestMatch("abono", headers);

if (cargoMatch && cargoMatch.score !== undefined && cargoMatch.score >= 0.5) {
    mapping.cargo = cargoMatch.columnName;
    totalConfidence += cargoMatch.score;
    matchedFields++;
  }

if (abonoMatch && abonoMatch.score !== undefined && abonoMatch.score >= 0.5) {
    mapping.abono = abonoMatch.columnName;
    totalConfidence += abonoMatch.score;
    matchedFields++;
  }

  if (mapping.cargo || mapping.abono) {
    mapping.amount = null;
  }

  if (mapping.date) {
    const dateIndex = headers.indexOf(mapping.date);
    if (dateIndex !== -1) {
      const sampleDates = rows
        .slice(0, 20)
        .map(row => String(row[dateIndex] || "").trim())
        .filter(d => d.length > 0);

      if (sampleDates.length > 0) {
        mapping.dateFormat = detectDateFormat(sampleDates);
      }
    }
  }

  const averageConfidence = matchedFields > 0 ? totalConfidence / matchedFields : 0;

  const isAutoDetected =
    mapping.date !== null &&
    mapping.description !== null &&
    matchColumn("date", mapping.date) >= 0.7 &&
    matchColumn("description", mapping.description) >= 0.7 &&
    averageConfidence >= 0.7;

  return { mapping, isAutoDetected, confidence: averageConfidence };
};

export const mapStructureToTransactions = (
  structure: FileStructure,
  mapping: ColumnMapping
): Array<{
  date: string;
  description: string;
  amount: number;
  type: "cargo" | "abono";
}> => {
  const { headers, rows } = structure;
  const transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: "cargo" | "abono";
  }> = [];

  const dateIndex = headers.indexOf(mapping.date || "");
  const descriptionIndex = headers.indexOf(mapping.description || "");
  const amountIndex = mapping.amount ? headers.indexOf(mapping.amount) : -1;
  const cargoIndex = mapping.cargo ? headers.indexOf(mapping.cargo) : -1;
  const abonoIndex = mapping.abono ? headers.indexOf(mapping.abono) : -1;

  if (dateIndex === -1 || descriptionIndex === -1) {
    return transactions;
  }

  let lastValidDate = "";
  const dateFormat = mapping.dateFormat || "auto";

  for (const row of rows) {
    let date = String(row[dateIndex] || "").trim();
    const description = String(row[descriptionIndex] || "").trim();

    if (!description) continue;

    if (!date && lastValidDate) {
      date = lastValidDate;
    }

    if (!date) continue;

    lastValidDate = date;

    let amount = 0;
    let type: "cargo" | "abono" = "cargo";

    if (cargoIndex !== -1 && abonoIndex !== -1) {
      const cargoNum = parseAmount(String(row[cargoIndex] || "").trim());
      const abonoNum = parseAmount(String(row[abonoIndex] || "").trim());

      if (cargoNum > 0) {
        amount = cargoNum;
        type = "cargo";
      } else if (abonoNum > 0) {
        amount = abonoNum;
        type = "abono";
      } else {
        continue;
      }
    } else if (cargoIndex !== -1) {
      amount = parseAmount(String(row[cargoIndex] || "").trim());
      if (amount === 0) continue;
      type = "cargo";
    } else if (abonoIndex !== -1) {
      amount = parseAmount(String(row[abonoIndex] || "").trim());
      if (amount === 0) continue;
      type = "abono";
    } else if (amountIndex !== -1) {
      amount = parseAmount(String(row[amountIndex] || "").trim());
      if (amount === 0) continue;
      type = amount < 0 ? "cargo" : "abono";
      amount = Math.abs(amount);
    } else {
      continue;
    }

    const normalizedDate = normalizeDate(date, dateFormat);
    const normalizedDescription = description.replace(/\s+/g, " ").toUpperCase();

    transactions.push({
      date: normalizedDate,
      description: normalizedDescription,
      amount,
      type,
    });
  }

  return transactions;
};
