import type { ColumnMapping } from "../types/fileMapping";

export const isMappingValid = (mapping: ColumnMapping): boolean => {
  if (!mapping.date || !mapping.description) return false;

  const hasAmount = !!mapping.amount;
  const hasCargo = !!mapping.cargo;
  const hasAbono = !!mapping.abono;

  return hasAmount || hasCargo || hasAbono;
};

export const validateFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return (
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel" ||
    file.type === "text/csv" ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv")
  );
};
