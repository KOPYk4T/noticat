import type { Transaction } from "../../shared/types";
import { formatMoney } from "../../shared/utils";
import { CategorySelect } from "./CategorySelect";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Trash } from "../../components/icons";

interface TransactionCardProps {
  transaction: Transaction;
  slideDirection: "left" | "right";
  onCategoryChange: (category: string) => void;
  onRecurringChange: (isRecurring: boolean) => void;
  onDelete: () => void;
}

export const TransactionCard = ({
  transaction,
  slideDirection,
  onCategoryChange,
  onRecurringChange,
  onDelete,
}: TransactionCardProps) => {
  const animationClass =
    slideDirection === "right"
      ? "animate-[slideInRight_0.4s_cubic-bezier(0.16,1,0.3,1)]"
      : "animate-[slideInLeft_0.4s_cubic-bezier(0.16,1,0.3,1)]";

  return (
    <div
      key={transaction.id}
      className={`w-full max-w-lg space-y-10 ${animationClass}`}
    >
      {/* Date & Amount */}
      <div className="text-center space-y-2">
        <p className="text-sm text-neutral-400 font-light">
          {transaction.date}
        </p>
        <div className="flex flex-col items-center gap-2">
          <span
            className={`text-4xl font-light tabular-nums ${
              transaction.type === "cargo" ? "text-red-600" : "text-green-600"
            }`}
          >
            {transaction.type === "cargo" ? "-" : "+"}
            {formatMoney(transaction.amount)}
          </span>
          <span
            className={`text-xs font-light px-3 py-1 rounded-full ${
              transaction.type === "cargo"
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {transaction.type === "cargo" ? "Gasto" : "Ingreso"}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="text-center space-y-6">
        <p className="text-neutral-400 font-light text-lg">
          Categorizar la transacción
        </p>
        <p className="text-xl font-normal text-neutral-900 leading-relaxed px-4">
          "{transaction.description}"
        </p>
        <p className="text-neutral-400 font-light text-lg">como</p>
      </div>

      {/* Category Select */}
      <CategorySelect
        value={transaction.selectedCategory || transaction.suggestedCategory}
        onChange={onCategoryChange}
      />

      {/* Recurring toggle & Confidence indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={transaction.isRecurring || false}
                onChange={(e) => onRecurringChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
            </div>
            <span className="text-sm font-light text-neutral-500 group-hover:text-neutral-700 transition-colors duration-200">
              Pago recurrente
            </span>
          </label>
        </div>

        <div className="h-6 flex justify-center">
          <ConfidenceBadge confidence={transaction.confidence} />
        </div>
      </div>

      {/* Delete button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-6 py-3 text-sm text-neutral-400 hover:text-red-600 
                   hover:bg-red-50 rounded-xl transition-all duration-300
                   font-light active:scale-95"
        >
          <Trash className="w-4 h-4" />
          <span>Saltar transacción</span>
        </button>
      </div>
    </div>
  );
};
