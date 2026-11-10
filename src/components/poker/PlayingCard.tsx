import { isRedSuit, rankLabel, suitSymbol, type Card } from '@/poker/cards';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md';
  delayMs?: number;
}

export function PlayingCard({ card, faceDown = false, size = 'md', delayMs = 0 }: PlayingCardProps) {
  const dimensions = size === 'sm' ? 'h-[52px] w-9 text-[10px]' : 'h-[76px] w-[54px] text-sm sm:h-[92px] sm:w-[66px]';
  const style = { animationDelay: `${delayMs}ms` };

  if (!card || faceDown) {
    return (
      <div
        style={style}
        className={`${dimensions} animate-deal-in rounded-md border border-gold-400/70 bg-gradient-to-br from-felt-700 to-felt-900 shadow-lg shadow-black/40`}
      >
        <div className="m-[3px] h-[calc(100%-6px)] rounded-[4px] border border-gold-400/30 bg-[repeating-linear-gradient(45deg,rgba(232,192,106,0.12)_0_4px,transparent_4px_8px)]" />
      </div>
    );
  }

  const color = isRedSuit(card.suit) ? 'text-rose-600' : 'text-slate-900';
  const label = rankLabel(card.rank);
  return (
    <div
      style={style}
      className={`${dimensions} ${color} animate-deal-in flex flex-col justify-between rounded-md bg-white p-1 shadow-lg shadow-black/40 sm:p-1.5`}
    >
      <div className="flex flex-col items-start leading-none">
        <span className="font-bold">{label}</span>
        <span>{suitSymbol(card.suit)}</span>
      </div>
      <div className="self-center text-lg leading-none sm:text-2xl">{suitSymbol(card.suit)}</div>
      <div className="flex rotate-180 flex-col items-start leading-none">
        <span className="font-bold">{label}</span>
        <span>{suitSymbol(card.suit)}</span>
      </div>
    </div>
  );
}
