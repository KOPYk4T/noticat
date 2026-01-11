import type { Transaction } from "../../shared/types";
import { formatMoney } from "../../shared/utils";
import { CategorySelect } from "./CategorySelect";
import { ConfidenceBadge } from "./ConfidenceBadge";

interface TransactionCardProps {
  transaction: Transaction;
  slideDirection: "left" | "right";
  onCategoryChange: (category: string) => void;
  onRecurringChange: (isRecurring: boolean) => void;
  onTypeChange: (type: "cargo" | "abono") => void;
}

export const TransactionCard = ({
  transaction,
  slideDirection,
  onCategoryChange,
  onRecurringChange,
  onTypeChange,
}: TransactionCardProps) => {
  const animationClass =
    slideDirection === "right"
      ? "animate-[slideInRight_0.4s_cubic-bezier(0.16,1,0.3,1)]"
      : "animate-[slideInLeft_0.4s_cubic-bezier(0.16,1,0.3,1)]";

  return (
    <div key={transaction.id} className={`w-full max-w-5xl ${animationClass}`}>
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left Column - Transaction Info */}
        <div className="flex-1 space-y-6">
          {/* Description */}
          <div>
            <p className="text-2xl font-normal text-neutral-900 leading-relaxed">
              {transaction.description}
            </p>
          </div>

          {/* Amount, Date & Type */}
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className={`text-xl font-light tabular-nums ${
                transaction.type === "cargo" ? "text-red-600" : "text-green-600"
              }`}
            >
              {transaction.type === "cargo" ? "-" : "+"}
              {formatMoney(transaction.amount)}
            </span>
            <span className="text-sm text-neutral-400 font-light">
              {transaction.date}
            </span>
            <button
              onClick={() => onTypeChange(transaction.type === "cargo" ? "abono" : "cargo")}
              className={`text-xs font-light px-2.5 py-1 rounded-full cursor-pointer transition-all hover:scale-105 ${
                transaction.type === "cargo"
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
            >
              {transaction.type === "cargo" ? "Gasto" : "Ingreso"}
            </button>
          </div>
        </div>

        {/* Right Column - Controls */}
        <div className="flex-1 space-y-6">
          {/* Category Select */}
          <div className="space-y-3">
            <label className="text-sm font-normal text-neutral-500">
              Categoría
            </label>
            <CategorySelect
              value={
                transaction.selectedCategory || transaction.suggestedCategory
              }
              onChange={onCategoryChange}
            />
          </div>

          {/* Recurring toggle & Confidence badge */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={transaction.isRecurring || false}
                  onChange={(e) => onRecurringChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
              </div>
              <span className="text-sm font-normal text-neutral-600 group-hover:text-neutral-900 transition-colors duration-200">
                Recurrente
              </span>
            </label>

            <ConfidenceBadge confidence={transaction.confidence} />
          </div>
        </div>
      </div>
    </div>
  );
};
