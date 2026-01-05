interface ProcessingScreenProps {
  fileName: string;
  error?: string | null;
}

export const ProcessingScreen = ({ fileName, error }: ProcessingScreenProps) => {
  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-sans">
        <div className="space-y-8 text-center max-w-md">
          <div className="space-y-2">
            <p className="text-2xl font-light text-red-600">Error al procesar</p>
            <p className="text-sm text-neutral-400 font-light">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="space-y-8 text-center animate-[fadeIn_0.5s_ease-out]">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 border-2 border-neutral-100 rounded-full" />
          <div className="absolute inset-0 border-2 border-neutral-900 rounded-full border-r-transparent border-b-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-light text-neutral-900">Procesando</p>
          <p className="text-sm text-neutral-400 font-light tracking-wide">{fileName}</p>
        </div>
      </div>
    </div>
  );
};

