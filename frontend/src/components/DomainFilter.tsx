import { Leaf, DollarSign, Zap, LayoutGrid } from 'lucide-react';
import type { DomainFocus } from '../types';

/* ═══════════════════════════════════════════════════════════════════
   Domain Focus Filter — mode pills (light theme)
   ═══════════════════════════════════════════════════════════════════ */

interface DomainFilterProps {
  mode: DomainFocus;
  onChange: (mode: DomainFocus) => void;
}

interface FilterOption {
  id: DomainFocus;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  activeClasses: string;
  description: string;
}

const OPTIONS: FilterOption[] = [
  {
    id: 'all',
    label: 'All Metrics',
    shortLabel: 'All',
    icon: <LayoutGrid className="w-3 h-3" />,
    activeClasses: 'bg-gray-800 text-white border-gray-700 shadow-sm',
    description: 'Full dashboard view',
  },
  {
    id: 'sustainability',
    label: 'Sustainability',
    shortLabel: 'Carbon',
    icon: <Leaf className="w-3 h-3" />,
    activeClasses: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20',
    description: 'Carbon & emissions focus',
  },
  {
    id: 'finance',
    label: 'Finance',
    shortLabel: 'Cost',
    icon: <DollarSign className="w-3 h-3" />,
    activeClasses: 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20',
    description: 'Cost & price analysis',
  },
  {
    id: 'grid',
    label: 'Grid Resilience',
    shortLabel: 'Grid',
    icon: <Zap className="w-3 h-3" />,
    activeClasses: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20',
    description: 'Load & power management',
  },
];

export function DomainFilter({ mode, onChange }: DomainFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mr-1 hidden sm:inline">
        Focus
      </span>
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100/80 border border-gray-200/60">
        {OPTIONS.map((opt) => {
          const isActive = mode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              title={opt.description}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
                text-[12px] font-bold tracking-wide
                transition-all duration-200
                border border-transparent
                ${
                  isActive
                    ? opt.activeClasses
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                }
              `}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
              <span className="sm:hidden">{opt.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
