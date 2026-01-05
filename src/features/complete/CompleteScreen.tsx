import { useState } from "react";
import { Check, Restore } from "../../components/icons";
import type { Transaction } from "../../shared/types";
import { formatMoney } from "../../shared/utils";
import {
  uploadTransactionsToNotion,
  isNotionConfigured,
} from "../../shared/services/notionService";
import { AccountSelectorModal } from "./AccountSelectorModal";

interface CompleteScreenProps {
  transactionCount: number;
  transactions: Transaction[];
  deletedTransactions: Transaction[];
  onRestore: (index: number) => void;
  onGoBack: () => void;
  onUploadAnother: () => void;
  onResetWithoutConfirm?: () => void;
}

export const CompleteScreen = ({
  transactionCount,
  transactions,
  deletedTransactions,
  onRestore,
  onGoBack,
  onUploadAnother,
  onResetWithoutConfirm,
}: CompleteScreenProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    uploaded: 0,
    total: 0,
  });
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const handleUploadClick = () => {
    if (!isNotionConfigured()) {
      setUploadResult({
        success: false,
        message:
          "Notion no está configurado. Verifica las variables de entorno.",
      });
      return;
    }

    if (transactions.length === 0) {
      setUploadResult({
        success: false,
        message: "No hay transacciones para subir.",
      });
      return;
    }

    setShowAccountSelector(true);
  };

  const handleAccountSelected = async (accountId?: string) => {
    setShowAccountSelector(false);
    await uploadToNotion(accountId);
  };

  const uploadToNotion = async (accountId?: string) => {
    if (!isNotionConfigured()) {
      setUploadResult({
        success: false,
        message:
          "Notion no está configurado. Verifica las variables de entorno.",
      });
      return;
    }

    if (transactions.length === 0) {
      setUploadResult({
        success: false,
        message: "No hay transacciones para subir.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ uploaded: 0, total: transactions.length });
    setUploadResult(null);

    try {
      const result = await uploadTransactionsToNotion(
        transactions,
        accountId,
        (uploaded, total) => {
          setUploadProgress({ uploaded, total });
        }
      );

      if (result.success) {
        setUploadResult({
          success: true,
          message: `¡Éxito! ${result.uploaded} transacciones subidas a Notion.`,
        });

        setShowSuccessScreen(true);
      } else {
        setUploadResult({
          success: false,
          message: `Se subieron ${result.uploaded} de ${
            transactions.length
          } transacciones. ${result.errors?.[0] || "Error desconocido"}`,
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al subir a Notion",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Pantalla de éxito después de subir a Notion
  if (showSuccessScreen && uploadResult?.success) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="space-y-10 text-center animate-[scaleIn_0.6s_cubic-bezier(0.16,1,0.3,1)] max-w-2xl w-full">
            <div className="w-20 h-20 bg-green-600 rounded-3xl flex items-center justify-center mx-auto animate-[pop_0.5s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
              <Check className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-3">
              <p className="text-3xl font-light text-neutral-900">
                ¡Subido a Notion!
              </p>
              <p className="text-neutral-400 font-light text-lg">
                {uploadResult.message.replace("¡Éxito! ", "")}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={() => {
                  // Si ya se subió exitosamente, resetear sin confirmación
                  if (onResetWithoutConfirm) {
                    onResetWithoutConfirm();
                  } else {
                    onUploadAnother();
                  }
                }}
                className="px-10 py-4 bg-neutral-900 text-white rounded-2xl font-light text-lg
                         hover:bg-neutral-800 transition-all duration-300
                         hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg shadow-neutral-900/20"
              >
                Subir otra cartola
              </button>

              <p className="text-sm text-neutral-400 font-light">
                Tus transacciones ya están categorizadas en Notion
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AccountSelectorModal
        isOpen={showAccountSelector}
        onConfirm={handleAccountSelected}
        onCancel={() => setShowAccountSelector(false)}
      />
      <div>
        <div className="min-h-screen bg-white flex flex-col font-sans">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="space-y-10 text-center animate-[scaleIn_0.6s_cubic-bezier(0.16,1,0.3,1)] max-w-2xl w-full">
              <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center mx-auto animate-[pop_0.5s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
                <Check className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-3">
                <p className="text-3xl font-light text-neutral-900">Listo</p>
                <p className="text-neutral-400 font-light text-lg">
                  {transactionCount} transacciones categorizadas
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-3">
                  <button
                    onClick={handleUploadClick}
                    disabled={isUploading || transactions.length === 0}
                    className="px-10 py-4 bg-neutral-900 text-white rounded-2xl font-light text-lg
                         hover:bg-neutral-800 transition-all duration-300
                         hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg shadow-neutral-900/20
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isUploading
                      ? `Subiendo... ${uploadProgress.uploaded}/${uploadProgress.total}`
                      : "Subir a Notion"}
                  </button>

                  {isUploading && (
                    <div className="w-full max-w-md mx-auto">
                      <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 transition-all duration-300"
                          style={{
                            width: `${
                              (uploadProgress.uploaded / uploadProgress.total) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadResult && (
                    <div
                      className={`text-sm font-light px-4 py-2 rounded-xl ${
                        uploadResult.success
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {uploadResult.message}
                    </div>
                  )}
                </div>

                {transactions.length > 0 && (
                  <button
                    onClick={onGoBack}
                    className="px-10 py-4 bg-white text-neutral-900 border border-neutral-200 rounded-2xl font-light text-lg
                         hover:bg-neutral-50 transition-all duration-300
                         hover:scale-[1.02] active:scale-[0.98]
                         shadow-sm shadow-neutral-200/50"
                  >
                    Volver a revisar
                  </button>
                )}

                <button
                  onClick={onUploadAnother}
                  className="block mx-auto text-sm text-neutral-400 hover:text-neutral-600 
                       transition-colors duration-300 font-light py-2"
                >
                  Subir otra cartola
                </button>
              </div>
            </div>
          </div>

          {deletedTransactions.length > 0 && (
            <div className="border-t border-neutral-200 p-8">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-light text-neutral-900">
                    Transacciones saltadas ({deletedTransactions.length})
                  </h2>
                </div>

                <div className="space-y-2">
                  {deletedTransactions.map((transaction, index) => (
                    <div
                      key={`deleted-${transaction.id}-${index}`}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl
                           hover:bg-neutral-100 transition-colors duration-200"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-neutral-400 font-light">
                            {transaction.date}
                          </span>
                          <span
                            className={`text-xs font-light px-2 py-0.5 rounded-full ${
                              transaction.type === "cargo"
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            {transaction.type === "cargo" ? "Gasto" : "Ingreso"}
                          </span>
                        </div>
                        <p className="text-sm font-normal text-neutral-900">
                          {transaction.description}
                        </p>
                        <p
                          className={`text-sm font-light tabular-nums ${
                            transaction.type === "cargo"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {transaction.type === "cargo" ? "-" : "+"}
                          {formatMoney(transaction.amount)}
                        </p>
                      </div>

                      <button
                        onClick={() => onRestore(index)}
                        className="ml-4 flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 
                             hover:text-neutral-900 hover:bg-white rounded-lg 
                             transition-all duration-200 font-light active:scale-95"
                      >
                        <Restore className="w-4 h-4" />
                        <span>Restaurar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
