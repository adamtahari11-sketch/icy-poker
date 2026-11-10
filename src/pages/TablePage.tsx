import { ArrowLeft, LogOut, Users } from 'lucide-react';
import { ActionBar } from '@/components/poker/ActionBar';
import { PokerTable } from '@/components/poker/PokerTable';
import { SitDownPanel } from '@/components/poker/SitDownPanel';
import { WalletCard } from '@/components/wallet/WalletCard';
import { useTableSettings } from '@/hooks/useTableSettings';
import { usePokerTable } from '@/hooks/usePokerTable';
import { useWallet } from '@/hooks/useWallet';
import { formatChips, formatPeso } from '@/lib/format';
import type { TableConfig } from '@/poker/types';

interface TablePagePlayer {
  id: string;
  name: string;
  avatarUrl: string | null;
  avatarEmoji: string;
}

interface TablePageProps {
  player: TablePagePlayer;
  tableConfig: TableConfig;
  tableName: string;
  tableId: string;
  onLeaveTable: () => void;
}

export function TablePage({ player, tableConfig, tableName, tableId, onLeaveTable }: TablePageProps) {
  const wallet = useWallet(player.id);
  const { settings } = useTableSettings();
  const poker = usePokerTable(player, settings, tableConfig);
  const { table, legal, meIndex } = poker;

  const turnKey = table.hand ? `${table.hand.number}-${table.hand.street}-${table.hand.toAct}-${table.hand.currentBet}` : 'idle';
  const turnSeat = table.hand?.toAct != null ? table.seats[table.hand.toAct] : null;
  const isMyTurn = meIndex !== -1 && table.hand?.toAct === meIndex;
  const waitingFor = turnSeat && !isMyTurn ? turnSeat.name : null;
  const balance = wallet.player?.balance ?? 0;
  const seatCount = table.seats.filter(Boolean).length;

  function handleStandUp() {
    poker.standUp();
    setTimeout(() => onLeaveTable(), 500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={onLeaveTable}
              className="mb-1 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All tables
            </button>
            <h1 className="text-xl font-semibold text-white">{tableName}</h1>
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="h-4 w-4" />
              {poker.seated ? `${seatCount} seated` : 'Table is open'} · Blinds {formatPeso(tableConfig.smallBlind)} / {formatPeso(tableConfig.bigBlind)} · Rake {settings.rakePercent}%
            </p>
          </div>
          {poker.seated && (
            <button
              type="button"
              onClick={handleStandUp}
              disabled={poker.leaving}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-400/60 hover:text-rose-300 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {poker.leaving ? 'Leaving...' : 'Leave table'}
            </button>
          )}
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-slate-900 to-slate-950 p-3 shadow-2xl sm:p-6">
          {poker.seated ? (
            <PokerTable table={table} meIndex={meIndex} />
          ) : (
            <SitDownPanel
              balance={balance}
              minBuyIn={tableConfig.minBuyIn}
              maxBuyIn={tableConfig.maxBuyIn}
              busy={poker.busy}
              error={poker.error}
              onSit={(amount) => void poker.sitDown(amount, tableId)}
            />
          )}
        </div>

        {poker.seated && (
          <>
            {poker.cashOutBlocked ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <span>{poker.error ?? 'Could not cash out. Please try again.'}</span>
                <button type="button" onClick={poker.retryCashOut} className="rounded-lg bg-rose-500/20 px-3 py-1.5 font-semibold text-rose-100 hover:bg-rose-500/30">
                  Try again
                </button>
              </div>
            ) : (
              <ActionBar
                table={table}
                legal={isMyTurn ? legal : null}
                turnKey={turnKey}
                onAct={poker.act}
                waitingFor={waitingFor}
              />
            )}
          </>
        )}
      </section>

      <aside className="space-y-4">
        <WalletCard playerId={player.id} wallet={wallet} />
        {poker.seated && (
          <p className="px-1 text-xs text-slate-500">
            Chips on the table: {formatChips(table.seats.find((seat) => seat?.isMe)?.stack ?? 0)}
          </p>
        )}
      </aside>
    </div>
  );
}
