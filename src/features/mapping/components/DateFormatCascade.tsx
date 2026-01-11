import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";

const DATE_FORMAT_OPTIONS = [
  { value: "auto" as const, label: "Auto-detectar" },
  { value: "DD/MM/YYYY" as const, label: "DD/MM/YYYY" },
  { value: "MM/DD/YY" as const, label: "MM/DD/YY" },
];

interface DateFormatCascadeProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormat: string;
  onSelect: (format: "auto" | "MM/DD/YY" | "DD/MM/YYYY") => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
}

export const DateFormatCascade = ({
  isOpen,
  onClose,
  currentFormat,
  onSelect,
  parentRef,
}: DateFormatCascadeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // useClickOutside expects RefObject<HTMLElement>, so we cast HTMLDivElement ref
  useClickOutside(containerRef as React.RefObject<HTMLElement>, onClose, isOpen);

  useEffect(() => {
    if (isOpen && parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  }, [isOpen, parentRef]);

  if (!isOpen) return null;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[60] bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden w-[200px]"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="p-2">
        <div className="px-3 py-2 text-xs font-medium text-neutral-500 border-b border-neutral-100 mb-2">
          Formato de fecha
        </div>
        {DATE_FORMAT_OPTIONS.map((option) => {
          const isSelected = currentFormat === option.value || (!currentFormat && option.value === "auto");
          return (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-between ${
                isSelected
                  ? "bg-neutral-900 text-white font-medium"
                  : "hover:bg-neutral-50 text-neutral-700"
              }`}
            >
              <span className="text-sm">{option.label}</span>
              {isSelected && <Check className="w-4 h-4" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
