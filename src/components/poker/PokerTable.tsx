import { ChipStack } from '@/components/poker/ChipStack';
import { PlayingCard } from '@/components/poker/PlayingCard';
import { SeatView } from '@/components/poker/SeatView';
import { formatChips } from '@/lib/format';
import { potTotal } from '@/poker/engine';
import type { HandState, Seat, TableState } from '@/poker/types';

const SEAT_POSITIONS = [
  { x: 50, y: 86 },
  { x: 14, y: 68 },
  { x: 14, y: 26 },
  { x: 50, y: 10 },
  { x: 86, y: 26 },
  { x: 86, y: 68 },
];

const BET_RATIO = 0.36;

function statusFor(seat: Seat, hand: HandState | null): string | null {
  if (seat.sittingOut) return 'Real player';
  if (!hand || hand.street === 'complete') return null;
  if (seat.folded) return 'Folded';
  if (seat.allIn) return 'All-in';
  return null;
}

interface PokerTableProps {
  table: TableState;
  meIndex: number;
}

export function PokerTable({ table, meIndex }: PokerTableProps) {
  const hand = table.hand;
  const pot = potTotal(table);
  const finished = hand?.street === 'complete';
  const revealCards = !!hand?.showdown && finished;
  const isDealing = hand?.street === 'preflop' && hand.board.length === 0 && !!hand.toAct;

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-4xl sm:aspect-[16/10]">
      <div className="absolute inset-0 rounded-[50%] border-[14px] border-amber-900/80 bg-amber-950 shadow-[0_30px_80px_rgba(0,0,0,0.6)]" />
      <div className="absolute inset-[14px] rounded-[50%] border-2 border-gold-400/50 bg-[radial-gradient(ellipse_at_center,#1d7a62_0%,#0f4a3b_60%,#0a3328_100%)] shadow-inner" />
      <div className="absolute inset-[34px] rounded-[50%] border border-white/10" />

      {/* Dealer image at the top center of the table */}
      <div className="absolute left-1/2 top-[16%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <div className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-gold-400/50 bg-slate-900 shadow-xl transition-transform duration-500 sm:h-20 sm:w-20 ${isDealing ? 'animate-pulse scale-110' : ''}`}>
          <img
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=160&h=160&fit=crop&crop=face"
            alt="Dealer"
            className="h-full w-full rounded-full object-cover"
          />
        </div>
        <span className="mt-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-gold-300">
          Dealer
        </span>
      </div>

      <div className="absolute left-1/2 top-[42%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <div className="flex gap-1.5 sm:gap-2">
          {Array.from({ length: 5 }).map((_, index) => {
            const card = hand?.board[index];
            return card ? (
              <PlayingCard key={`${hand?.number}-${index}-${card.rank}${card.suit}`} card={card} size="sm" delayMs={index * 120} />
            ) : (
              <div key={`slot-${index}`} className="h-[52px] w-9 rounded-md border border-dashed border-white/15 sm:h-[64px] sm:w-11" />
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-300">
            Pot {formatChips(pot)}
          </span>
          {finished && hand && hand.rake > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-emerald-200/70">
              House rake {formatChips(hand.rake)}
            </span>
          )}
        </div>
        {finished && hand && hand.winners.length > 0 && (
          <div className="mt-1 flex flex-col items-center gap-0.5 rounded-xl bg-black/60 px-4 py-2 text-center animate-chip-in">
            {hand.winners.map((award, index) => (
              <span key={`${award.seat}-${index}`} className="text-xs text-white">
                <span className="font-semibold text-gold-300">{table.seats[award.seat]?.name ?? 'Player'}</span>{' '}
                wins {formatChips(award.amount)} <span className="text-slate-300">({award.label})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {table.seats.map((seat, index) => {
        if (!seat || !hand || finished || seat.bet <= 0) return null;
        const position = SEAT_POSITIONS[index];
        const x = position.x + (50 - position.x) * BET_RATIO;
        const y = position.y + (50 - position.y) * BET_RATIO;
        return (
          <div
            key={`bet-${hand.number}-${hand.street}-${index}-${seat.bet}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <ChipStack amount={seat.bet} />
          </div>
        );
      })}

      {table.seats.map((seat, index) => {
        if (!seat) return null;
        const position = SEAT_POSITIONS[index];
        const isWinner = !!hand?.winners.some((award) => award.seat === index);
        return (
          <div
            key={`${seat.id}-${index}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-seat-in"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <SeatView
              seat={seat}
              isDealer={table.dealer === index && !!hand}
              isTurn={hand?.toAct === index}
              isWinner={isWinner}
              revealCards={revealCards && !seat.folded}
              statusLabel={statusFor(seat, hand)}
            />
            {index === meIndex && <span className="sr-only">Your seat</span>}
          </div>
        );
      })}
    </div>
  );
}
