import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, FileText, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import type { ColumnMapping, FileStructure } from "../../shared/types/fileMapping";
import { FieldMappingSelect } from "./components/FieldMappingSelect";
import { DateFormatCascade } from "./components/DateFormatCascade";

interface ColumnMapperNotionProps {
  structure: FileStructure;
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  autoDetected?: boolean;
}

const REQUIRED_FIELDS = [
  { key: "date", label: "Fecha", icon: Calendar },
  { key: "description", label: "Descripción", icon: FileText },
  { key: "amount", label: "Monto", icon: DollarSign },
] as const;

const OPTIONAL_FIELDS = [
  { key: "cargo", label: "Gastos", icon: TrendingDown },
  { key: "abono", label: "Ingresos", icon: TrendingUp },
] as const;

export const ColumnMapperNotion = ({
  structure,
  mapping,
  onMappingChange,
  autoDetected = false,
}: ColumnMapperNotionProps) => {
  const [showDateFormatCascade, setShowDateFormatCascade] = useState(false);
  const dateSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapping.dateFormat) {
      onMappingChange({ ...mapping, dateFormat: "auto" });
    }
  }, []);

  const handleFieldChange = (field: string, columnName: string) => {
    const newMapping = { ...mapping };

    if (columnName) {
      Object.keys(newMapping).forEach(key => {
        if (key !== field && key !== 'dateFormat' && newMapping[key as keyof ColumnMapping] === columnName) {
          (newMapping as any)[key] = null;
        }
      });
    }

    if (field === "amount") {
      newMapping.cargo = null;
      newMapping.abono = null;
    } else if (field === "cargo" || field === "abono") {
      newMapping.amount = null;
    }

    (newMapping as any)[field] = columnName || null;
    onMappingChange(newMapping);
  };

  const handleDateFormatChange = (format: "auto" | "MM/DD/YY" | "DD/MM/YYYY") => {
    onMappingChange({ ...mapping, dateFormat: format });
  };

  const formatValue = (value: string | number, fieldKey: string | null): string => {
    const strValue = String(value || "");

    if (fieldKey === "amount") {
      const num = parseFloat(strValue.replace(/[^0-9.-]/g, ""));
      if (!isNaN(num)) {
        return new Intl.NumberFormat("es-CL", {
          style: "currency",
          currency: "CLP",
        }).format(num);
      }
    }

    return strValue;
  };

  const getColumnMapping = (columnName: string): string | null => {
    for (const [key, value] of Object.entries(mapping)) {
      if (value === columnName && key !== "dateFormat") {
        return key;
      }
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex-shrink-0 mb-6">
        {autoDetected && (
          <div className="mb-4 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
            Se mapearon automáticamente las columnas. Puedes ajustarlas si es necesario.
          </div>
        )}

        <div className="flex gap-3">
          {REQUIRED_FIELDS.map((field) => (
            <div
              key={field.key}
              className="flex-1"
              ref={field.key === "date" ? dateSelectRef : null}
            >
              <FieldMappingSelect
                field={field}
                value={mapping[field.key as keyof ColumnMapping] as string || ""}
                options={structure.headers}
                onChange={(value) => handleFieldChange(field.key, value)}
                onDateFormatOpen={field.key === "date" ? () => setShowDateFormatCascade(true) : undefined}
                dateFormat={field.key === "date" ? mapping.dateFormat : undefined}
              />
            </div>
          ))}
          {OPTIONAL_FIELDS.map((field) => (
            <div key={field.key} className="flex-1">
              <FieldMappingSelect
                field={field}
                value={mapping[field.key as keyof ColumnMapping] as string || ""}
                options={structure.headers}
                onChange={(value) => handleFieldChange(field.key, value)}
                optional={true}
              />
            </div>
          ))}
        </div>

        <DateFormatCascade
          isOpen={showDateFormatCascade}
          onClose={() => setShowDateFormatCascade(false)}
          currentFormat={mapping.dateFormat || "auto"}
          onSelect={handleDateFormatChange}
          parentRef={dateSelectRef}
        />
      </div>

      <div className="flex-1 bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-neutral-50 z-10 border-b border-neutral-200">
              <tr>
                {structure.headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-semibold text-neutral-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {structure.rows.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(rowIndex * 0.02, 0.3) }}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  {structure.headers.map((header, colIndex) => {
                    const mappedTo = getColumnMapping(header);
                    const value = row[colIndex];
                    const formattedValue = formatValue(value, mappedTo);

                    return (
                      <td
                        key={colIndex}
                        className="px-4 py-2.5 text-sm text-neutral-700"
                      >
                        <div className="truncate max-w-[200px]">
                          {formattedValue || (
                            <span className="text-neutral-300">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
