import { useState, useEffect } from "react";
import { getNotionAccounts, type NotionAccount } from "../../shared/services/notionService";

interface AccountSelectorModalProps {
  isOpen: boolean;
  onConfirm: (accountId?: string) => void;
  onCancel: () => void;
}

export const AccountSelectorModal = ({
  isOpen,
  onConfirm,
  onCancel,
}: AccountSelectorModalProps) => {
  const [accounts, setAccounts] = useState<NotionAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAccounts = await getNotionAccounts();
      setAccounts(fetchedAccounts);
      if (fetchedAccounts.length > 0) {
        setSelectedAccountId(fetchedAccounts[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cuentas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedAccountId || undefined);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-[scaleIn_0.2s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-light text-neutral-900 mb-2">
              Configurar subida a Notion
            </h3>
            <p className="text-sm font-light text-neutral-600">
              Selecciona la cuenta para las transacciones
            </p>
          </div>

          {/* Account Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-light text-neutral-700">
              Cuenta
            </label>
            {isLoading ? (
              <div className="px-4 py-3 bg-neutral-50 rounded-xl text-sm text-neutral-400 font-light">
                Cargando cuentas...
              </div>
            ) : error ? (
              <div className="px-4 py-3 bg-red-50 rounded-xl text-sm text-red-600 font-light">
                {error}
              </div>
            ) : accounts.length === 0 ? (
              <div className="px-4 py-3 bg-amber-50 rounded-xl text-sm text-amber-600 font-light">
                No se encontraron cuentas. Configura VITE_NOTION_ACCOUNTS_DATABASE_ID
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedAccountId("")}
                  className={`w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-200
                           flex items-center gap-3
                           ${
                             selectedAccountId === ""
                               ? "bg-neutral-200 hover:bg-neutral-250"
                               : "hover:bg-neutral-100"
                           }`}
                >
                  <span className="text-sm font-normal text-neutral-600">Sin cuenta</span>
                </button>
                {accounts.map((account) => {
                  const isSelected = selectedAccountId === account.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-200
                               flex items-center gap-3
                               ${
                                 isSelected
                                   ? "bg-neutral-200 hover:bg-neutral-250"
                                   : "hover:bg-neutral-100"
                               }`}
                    >
                      {/* Avatar del dueño */}
                      {account.owner && (
                        <div className="flex-shrink-0">
                          {account.owner.avatar_url ? (
                            <img
                              src={account.owner.avatar_url}
                              alt={account.owner.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-neutral-300 flex items-center justify-center">
                              <span className="text-xs font-medium text-neutral-600">
                                {account.owner.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Nombre de la cuenta */}
                      <span className="text-sm font-normal text-neutral-900 flex-1">
                        {account.name}
                      </span>
                      {/* Indicador de selección */}
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        <div className="flex items-center gap-3 p-6 pt-0 border-t border-neutral-200">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-light text-neutral-600 
                     hover:text-neutral-900 hover:bg-neutral-50 rounded-xl
                     transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm font-light text-white bg-neutral-900
                     hover:bg-neutral-800 rounded-xl
                     transition-all duration-200
                     hover:scale-[1.02] active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

