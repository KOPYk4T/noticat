import { useTransactionNavigation } from "./hooks";
import { UploadScreen } from "./features/upload";
import { ProcessingScreen } from "./features/processing";
import { CategorizeScreen } from "./features/categorize";
import { CompleteScreen } from "./features/complete";
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
    handleFileSelect,
    handleCategoryChange,
    handleRecurringChange,
    handleDelete,
    handleRestore,
    goNext,
    goPrev,
    goToEnd,
    goToStart,
    goToIndex,
    reset,
    confirmReset,
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
        onGoToEnd={goToEnd}
        onGoToIndex={goToIndex}
      />
    );
  }

  if (step === "complete") {
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
        <CompleteScreen
          transactionCount={transactions.length}
          transactions={transactions}
          deletedTransactions={deletedTransactions}
          onRestore={handleRestore}
          onGoBack={goToStart}
          onUploadAnother={() => confirmReset(() => {})}
          onResetWithoutConfirm={reset}
        />
      </>
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
