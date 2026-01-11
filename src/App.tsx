import { useTransactionNavigation } from "./hooks";
import { UploadScreen } from "./features/upload";
import { ProcessingScreen } from "./features/processing";
import { CategorizeScreen } from "./features/categorize";
import { SuccessScreen } from "./features/complete/SuccessScreen";
import { ColumnMappingScreen } from "./features/mapping";
import { TableEditor } from "./features/mapping/TableEditor";
import { ConfirmDialog } from "./components/ConfirmDialog";

function App() {
  const {
    step,
    transactions,
    deletedTransactions,
    currentIndex,
    slideDirection,
    fileName,
    error,
    uploadedCount,
    fileStructure,
    columnMapping,
    autoDetectedMapping,
    handleFileSelect,
    handleTableEditorConfirm,
    handleTableEditorCancel,
    handleMappingConfirm,
    handleMappingCancel,
    handleCategoryChange,
    handleRecurringChange,
    handleDelete,
    handleRestore,
    handleMassDelete,
    handleMassCategoryChange,
    handleMassRecurringChange,
    handleMassTypeChange,
    handleTypeChange,
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

  if (step === "table-editor" && fileStructure) {
    return (
      <TableEditor
        structure={fileStructure}
        onConfirm={handleTableEditorConfirm}
        onCancel={handleTableEditorCancel}
      />
    );
  }

  if (step === "mapping" && fileStructure && columnMapping) {
    return (
      <ColumnMappingScreen
        structure={fileStructure}
        initialMapping={columnMapping}
        autoDetected={autoDetectedMapping ?? false}
        onConfirm={handleMappingConfirm}
        onCancel={handleMappingCancel}
      />
    );
  }

  if (step === "categorize") {
    return (
      <CategorizeScreen
        transactions={transactions}
        deletedTransactions={deletedTransactions}
        currentIndex={currentIndex}
        slideDirection={slideDirection}
        onCategoryChange={handleCategoryChange}
        onRecurringChange={handleRecurringChange}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onMassDelete={handleMassDelete}
        onPrev={goPrev}
        onNext={goNext}
        onGoToIndex={goToIndex}
        onMassCategoryChange={handleMassCategoryChange}
        onMassRecurringChange={handleMassRecurringChange}
        onMassTypeChange={handleMassTypeChange}
        onTypeChange={handleTypeChange}
        onUploadSuccess={handleUploadSuccess}
      />
    );
  }

  if (step === "complete") {
    return <SuccessScreen uploadedCount={uploadedCount} onReset={reset} />;
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
