import { useRef, useState } from "react";
import { Upload as UploadIcon } from "../../components/icons";
import { validateFile } from "../../shared/utils/validationUtils";

interface UploadScreenProps {
  onFileSelect: (file: File) => void;
}

export const UploadScreen = ({ onFileSelect }: UploadScreenProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    } else if (file) {
      alert("Por favor, selecciona un archivo Excel (.xls o .xlsx)");
    }
  };

  const handleClick = () => fileInputRef.current?.click();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    } else if (file) {
        alert("Por favor, selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-2xl space-y-12 animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-extralight tracking-[-0.02em] text-neutral-900">
            FinanzIA
          </h1>
          <p className="text-neutral-500 font-light text-lg">
            Sube tu archivo Excel para comenzar
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`group cursor-pointer block w-full focus:outline-none transition-all duration-300 ${
            isDragging ? "scale-[1.01]" : ""
          }`}
        >
          <div
            className={`border-2 rounded-3xl p-20 transition-all duration-300 ease-out ${
              isDragging
                ? "border-neutral-400 bg-neutral-100 border-dashed"
                : "border-neutral-200 hover:border-neutral-300 hover:bg-white group-hover:shadow-lg group-hover:shadow-neutral-100/50"
            }`}
          >
            <div className="flex flex-col items-center space-y-6">
              <div
                className={`p-5 rounded-2xl transition-colors duration-300 ${
                  isDragging
                    ? "bg-neutral-200"
                    : "bg-neutral-100 group-hover:bg-neutral-200"
                }`}
              >
                <UploadIcon
                  className={`w-10 h-10 transition-colors duration-300 ${
                    isDragging
                      ? "text-neutral-700"
                      : "text-neutral-400 group-hover:text-neutral-600"
                  }`}
                />
              </div>
              <div className="text-center space-y-2">
                <span
                  className={`block font-light text-lg transition-colors duration-300 ${
                    isDragging
                      ? "text-neutral-700"
                      : "text-neutral-400 group-hover:text-neutral-600"
                  }`}
                >
                  {isDragging
                    ? "Suelta el archivo aquí"
                    : "Arrastra tu archivo aquí o haz clic para seleccionar"}
                </span>
                <span className="block text-sm text-neutral-400 font-light">
                  Formatos soportados: Excel (.xlsx, .xls) o CSV (.csv)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

