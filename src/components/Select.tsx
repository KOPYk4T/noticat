import { useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useClickOutside } from '../shared/hooks/useClickOutside';

interface SelectOption {
  value: string;
  label: string;
  recommended?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export const Select = ({ value, onChange, options, placeholder = "Seleccionar...", className = "" }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useClickOutside(containerRef, () => {
    setIsOpen(false);
    setSearchQuery('');
  }, isOpen);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer border ${
          isOpen
            ? 'border-neutral-900 bg-white'
            : 'border-neutral-200 bg-white hover:border-neutral-300'
        }`}
      >
        <span className="flex-1 text-left text-sm font-normal text-neutral-900">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div className="p-3 border-b border-neutral-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-400">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
                      isSelected
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <span className="flex-1 text-left text-sm">
                      {option.label}
                      {option.recommended && !isSelected && (
                        <span className="ml-2 text-xs text-neutral-400">(Recomendado)</span>
                      )}
                    </span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
