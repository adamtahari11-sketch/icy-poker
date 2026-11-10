import type { Card } from '@/poker/cards';
import { categoryOf, evaluateBest } from '@/poker/evaluate';
import { legalActions, potTotal } from '@/poker/engine';
import type { Action, Aggression, TableState } from '@/poker/types';

interface Profile {
  raiseAt: number;
  raiseChance: number;
  foldBelow: number;
  bluffChance: number;
}

const PROFILES: Record<Aggression, Profile> = {
  passive: { raiseAt: 0.8, raiseChance: 0.25, foldBelow: 0.4, bluffChance: 0.02 },
  balanced: { raiseAt: 0.68, raiseChance: 0.45, foldBelow: 0.3, bluffChance: 0.06 },
  aggressive: { raiseAt: 0.58, raiseChance: 0.7, foldBelow: 0.2, bluffChance: 0.2 },
};

export function estimateStrength(hole: Card[], board: Card[]): number {
  if (hole.length < 2) return 0;

  if (board.length === 0) {
    const [high, low] = [...hole].sort((a, b) => b.rank - a.rank);
    if (high.rank === low.rank) return 0.55 + high.rank / 50;
    let strength = (high.rank + low.rank) / 34;
    if (high.suit === low.suit) strength += 0.06;
    if (high.rank - low.rank <= 2) strength += 0.04;
    return Math.min(1, strength);
  }

  const category = categoryOf(evaluateBest([...hole, ...board]));
  return Math.min(1, 0.22 + category * 0.1);
}

export function chooseBotAction(table: TableState, index: number, aggression: Aggression): Action {
  const legal = legalActions(table, index);
  const seat = table.seats[index];
  if (!legal || !seat || !table.hand) return { type: 'fold' };

  const profile = PROFILES[aggression];
  const strength = estimateStrength(seat.hole, table.hand.board);
  const roll = Math.random();

  const wantsValueRaise = strength >= profile.raiseAt && roll < profile.raiseChance;
  const wantsBluff = strength < 0.5 && roll < profile.bluffChance;
  if (legal.canRaise && (wantsValueRaise || wantsBluff)) {
    const pot = potTotal(table);
    const size = Math.round(pot * (0.5 + Math.random() * 0.5));
    const to = Math.min(legal.maxTo, Math.max(legal.minTo, table.hand.currentBet + size));
    return { type: 'raise', to };
  }

  if (legal.canCheck) return { type: 'check' };
  if (strength < profile.foldBelow && roll > profile.bluffChance) return { type: 'fold' };
  return { type: 'call' };
}
