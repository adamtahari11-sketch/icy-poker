import { Bot, Eye, UserRound } from 'lucide-react';
import { PlayingCard } from '@/components/poker/PlayingCard';
import { formatChips } from '@/lib/format';
import type { Seat } from '@/poker/types';

const TONES = [
  'from-sky-500 to-sky-800',
  'from-emerald-500 to-emerald-800',
  'from-amber-400 to-amber-700',
  'from-rose-500 to-rose-800',
  'from-cyan-500 to-cyan-800',
  'from-orange-400 to-orange-700',
  'from-teal-400 to-teal-700',
  'from-slate-400 to-slate-700',
];

interface SeatViewProps {
  seat: Seat;
  isDealer: boolean;
  isTurn: boolean;
  isWinner: boolean;
  revealCards: boolean;
  statusLabel: string | null;
}

export function SeatView({ seat, isDealer, isTurn, isWinner, revealCards, statusLabel }: SeatViewProps) {
  const initials = seat.name.slice(0, 2).toUpperCase();
  const showFace = seat.isMe || revealCards;
  const ring = isWinner
    ? 'animate-winner-glow'
    : isTurn
      ? 'animate-turn-pulse'
      : 'shadow-black/50';

  return (
    <div className="flex w-24 flex-col items-center gap-1 sm:w-28">
      <div className="relative flex h-10 min-w-[2.5rem] items-end justify-center gap-0.5">
        {seat.hole.length > 0 && !seat.folded
          ? seat.hole.map((card, index) => (
              <div key={index} className={`${seat.folded ? 'opacity-40' : ''}`}>
                <PlayingCard
                  size="sm"
                  card={showFace ? card : undefined}
                  faceDown={!showFace}
                  delayMs={index * 80}
                />
              </div>
            ))
          : null}
      </div>
      <div
        className={`relative flex w-full flex-col items-center rounded-2xl border border-white/10 bg-slate-950/85 px-2 py-2 shadow-xl transition-all duration-300 ${ring} ${seat.folded ? 'opacity-50' : ''} ${seat.sittingOut ? 'border-dashed' : ''}`}
      >
        {isDealer && (
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gold-300 bg-gold-400 text-[10px] font-black text-slate-900 shadow">
            D
          </span>
        )}
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${TONES[seat.tone % TONES.length]} text-sm font-bold text-white ring-2 ring-white/20 overflow-hidden`}>
          {seat.avatarUrl ? (
            <img src={seat.avatarUrl} alt={seat.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="text-lg">{seat.avatarEmoji}</span>
          )}
        </div>
        <div className="mt-1 flex max-w-full items-center gap-1 truncate text-xs font-semibold text-white">
          {seat.isBot ? <Bot className="h-3 w-3 text-slate-400" /> : seat.sittingOut ? <Eye className="h-3 w-3 text-slate-400" /> : <UserRound className="h-3 w-3 text-gold-300" />}
          <span className="truncate">{seat.isMe ? 'You' : seat.name}</span>
        </div>
        <span className="text-[11px] font-medium tabular-nums text-emerald-300">
          {seat.sittingOut ? 'Watching' : formatChips(seat.stack)}
        </span>
        {statusLabel && (
          <span className="mt-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
}
