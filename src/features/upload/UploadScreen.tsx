import { useRef } from "react";
import { Upload as UploadIcon } from "../../components/icons";

interface UploadScreenProps {
  onFileSelect: (file: File) => void;
}

export const UploadScreen = ({ onFileSelect }: UploadScreenProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls"))
    ) {
      onFileSelect(file);
    } else if (file) {
      alert("Por favor, selecciona un archivo Excel (.xls o .xlsx)");
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-md space-y-10 animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-extralight tracking-tight text-neutral-900">
            Cartola
          </h1>
          <p className="text-neutral-400 font-light text-lg">
            Sube tu archivo Excel para comenzar
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleClick}
          className="group cursor-pointer block w-full focus:outline-none"
        >
          <div
            className="border border-neutral-200 rounded-3xl p-16 
                      transition-all duration-500 ease-out
                      hover:border-neutral-300 hover:bg-neutral-50/50
                      group-hover:scale-[1.02] group-active:scale-[0.98]
                      group-hover:shadow-lg group-hover:shadow-neutral-100"
          >
            <div className="flex flex-col items-center space-y-5">
              <div className="p-4 rounded-2xl bg-neutral-50 group-hover:bg-neutral-100 transition-colors duration-300">
                <UploadIcon className="w-7 h-7 text-neutral-400 group-hover:text-neutral-600 transition-colors duration-300" />
              </div>
              <span className="text-neutral-400 font-light text-lg group-hover:text-neutral-600 transition-colors duration-300">
                Seleccionar Excel
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
