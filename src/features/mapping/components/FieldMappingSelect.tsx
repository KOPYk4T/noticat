import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, type LucideIcon } from "lucide-react";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";

interface FieldInfo {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface FieldMappingSelectProps {
  field: FieldInfo;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onDateFormatOpen?: () => void;
  dateFormat?: string;
  optional?: boolean;
}

export const FieldMappingSelect = ({
  field,
  value,
  options,
  onChange,
  onDateFormatOpen,
  dateFormat,
  optional = false,
}: FieldMappingSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const Icon = field.icon;

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const handleSelect = (option: string) => {
    onChange(option);
    if (field.key === "date" && onDateFormatOpen) {
      setTimeout(() => onDateFormatOpen(), 150);
    } else {
      setIsOpen(false);
    }
  };

  const formatLabel = dateFormat === "auto" || !dateFormat ? "Auto" : dateFormat;

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer border-2 ${
          isOpen
            ? "border-neutral-900 bg-white shadow-md"
            : value
            ? "border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-white"
            : "border-neutral-200 bg-white hover:border-neutral-300"
        }`}
      >
        <div className="p-2 rounded-lg bg-neutral-100">
          <Icon className="w-4 h-4 text-neutral-600" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs font-medium text-neutral-500 mb-0.5">
            {field.label}
            {optional && <span className="text-neutral-400 ml-1">(Opcional)</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${value ? "text-neutral-900" : "text-neutral-400 italic"}`}>
              {value || (optional ? "Ninguna" : "Seleccionar columna...")}
            </span>
            {field.key === "date" && value && (
              <span className="px-2 py-0.5 text-xs font-medium text-neutral-600 bg-neutral-200 rounded">
                {formatLabel}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              {optional && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-between ${
                    !value
                      ? "bg-neutral-900 text-white font-medium"
                      : "hover:bg-neutral-50 text-neutral-500"
                  }`}
                >
                  <span className="text-sm italic">Ninguna</span>
                  {!value && <Check className="w-4 h-4" />}
                </button>
              )}
              {options.map((option) => {
                const isSelected = option === value;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-neutral-900 text-white font-medium"
                        : "hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <span className="text-sm">{option}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
