import { useState } from "react";
import { Button } from "../../components/Button";
import { ColumnMapperNotion } from "./ColumnMapperNotion";
import { isMappingValid } from "../../shared/utils/validationUtils";
import type { ColumnMapping, FileStructure } from "../../shared/types/fileMapping";

interface ColumnMappingScreenProps {
  structure: FileStructure;
  initialMapping: ColumnMapping;
  autoDetected: boolean;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

export const ColumnMappingScreen = ({
  structure,
  initialMapping,
  autoDetected,
  onCancel,
  onConfirm,
}: ColumnMappingScreenProps) => {
  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);

  const handleConfirm = () => {
    onConfirm(mapping);
  };

  return (
    <div className="h-screen bg-white flex flex-col font-sans overflow-hidden">
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col px-12 pt-8 pb-4 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <ColumnMapperNotion
            structure={structure}
            mapping={mapping}
            onMappingChange={setMapping}
            autoDetected={autoDetected}
          />
        </div>
      </div>

      {/* Footer fijo */}
      <div className="w-full border-t border-neutral-200 bg-white z-30 ">
        <div className="max-w-full mx-auto px-12 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              {["date", "description", "amount"].map((field) => {
                const isMapped = field === "amount"
                  ? !!(mapping.amount || mapping.cargo || mapping.abono)
                  : !!mapping[field as keyof ColumnMapping];

                return (
                  <div
                    key={field}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      isMapped ? "bg-neutral-900" : "bg-neutral-200"
                    }`}
                  />
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={onCancel}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={!isMappingValid(mapping)}>
                Continuar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
