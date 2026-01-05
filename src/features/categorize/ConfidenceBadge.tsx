import type { Confidence } from '../../shared/types';

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

export const ConfidenceBadge = ({ confidence }: ConfidenceBadgeProps) => {
  if (confidence === 'ai') {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-500 text-xs font-light">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
        Sugerido por IA
      </span>
    );
  }

  if (confidence === 'low') {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-light">
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        Requiere revisión
      </span>
    );
  }

  return null;
};

