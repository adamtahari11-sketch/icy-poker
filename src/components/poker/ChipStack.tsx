import { formatChips } from '@/lib/format';

interface ChipStackProps {
  amount: number;
  label?: string;
}

const CHIP_COLORS = ['bg-gold-400', 'bg-rose-500', 'bg-emerald-500', 'bg-sky-500'];

export function ChipStack({ amount, label }: ChipStackProps) {
  const layers = Math.min(4, Math.max(1, Math.ceil(amount / 1000)));
  return (
    <div className="inline-flex items-center gap-1.5 animate-chip-in">
      <div className="relative h-5 w-6">
        {Array.from({ length: layers }).map((_, index) => (
          <span
            key={index}
            style={{ bottom: index * 3 }}
            className={`absolute left-0 h-3.5 w-6 rounded-full border border-black/30 ${CHIP_COLORS[index % CHIP_COLORS.length]} shadow-sm`}
          />
        ))}
      </div>
      <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
        {label ? `${label} ` : ''}
        {formatChips(amount)}
      </span>
    </div>
  );
}
