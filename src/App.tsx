import { useTransactionNavigation } from "./hooks";
import { UploadScreen } from "./features/upload";
import { ProcessingScreen } from "./features/processing";
import { CategorizeScreen } from "./features/categorize";
import { SuccessScreen } from "./features/complete/SuccessScreen";
import { ConfirmDialog } from "./components/ConfirmDialog";

function App() {
  const {
    step,
    transactions,
    currentIndex,
    slideDirection,
    fileName,
    error,
    uploadedCount,
    handleFileSelect,
    handleCategoryChange,
    handleRecurringChange,
    handleDelete,
    handleMassCategoryChange,
    handleMassRecurringChange,
    handleUploadSuccess,
    goNext,
    goPrev,
    goToIndex,
    reset,
    showConfirmReset,
    handleConfirmReset,
    handleCancelReset,
  } = useTransactionNavigation();

  if (step === "upload") {
    return <UploadScreen onFileSelect={handleFileSelect} />;
  }

  if (step === "processing") {
    return <ProcessingScreen fileName={fileName} error={error} />;
  }

  if (step === "categorize") {
    return (
      <CategorizeScreen
        transactions={transactions}
        currentIndex={currentIndex}
        slideDirection={slideDirection}
        onCategoryChange={handleCategoryChange}
        onRecurringChange={handleRecurringChange}
        onDelete={handleDelete}
        onPrev={goPrev}
        onNext={goNext}
        onGoToIndex={goToIndex}
        onMassCategoryChange={handleMassCategoryChange}
        onMassRecurringChange={handleMassRecurringChange}
        onUploadSuccess={handleUploadSuccess}
      />
    );
  }

  if (step === "complete") {
    return (
      <SuccessScreen
        uploadedCount={uploadedCount}
        onReset={reset}
      />
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirmReset}
        title="¿Perder el progreso?"
        message={`Tienes ${transactions.length} transacciones categorizadas. Si continúas, se perderá todo el progreso. ¿Estás seguro?`}
        confirmText="Sí, perder progreso"
        cancelText="Cancelar"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </>
  );
}

export default App;
