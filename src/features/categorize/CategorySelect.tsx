import { ChevronRight } from '../../components/icons';
import { categories } from '../../shared/constants';

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
}

export const CategorySelect = ({ value, onChange }: CategorySelectProps) => {
  return (
    <div className="flex justify-center">
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-neutral-50 border border-neutral-200 rounded-2xl 
                   px-8 py-4 pr-12 text-xl font-light text-neutral-900
                   focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2
                   cursor-pointer transition-all duration-300 
                   hover:bg-neutral-100 hover:border-neutral-300"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronRight className="w-5 h-5 text-neutral-400 rotate-90" />
        </div>
      </div>
    </div>
  );
};

