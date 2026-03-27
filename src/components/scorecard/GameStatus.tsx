import { useTripStore } from '../../store/tripStore';
import { formatMatchPlayStatus } from '../../lib/matchPlay';
import { players } from '../../config/players';
import type {
  SkinsState,
  NinesState,
  StablefordState,
  StrokePlayState,
  DailyMatchPlayState,
  FormatState,
} from '../../types';

export function GameStatus() {
  const trip = useTripStore((s) => s.trip);
  const activeRoundIndex = useTripStore((s) => s.activeRoundIndex);

  if (!trip || activeRoundIndex === null) return null;
  const round = trip.rounds[activeRoundIndex];
  if (!round) return null;

  const mp90 = trip.matchPlay90;
  const mp90Label = formatMatchPlayStatus(
    mp90.cumulativeStatus,
    mp90.holesPlayed,
    90,
    'Sam',
    'Cole',
  );

  const formatLabel = getFormatStatusLabel(round.formatState);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 px-4 py-2.5">
      <div className="flex items-center justify-between gap-4 text-xs">
        <StatusChip label="90-Hole" value={mp90Label} />
        {formatLabel && <StatusChip label={getFormatName(round.format)} value={formatLabel} />}
      </div>
    </div>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
        {label}
      </div>
      <div className="text-emerald-400 font-medium truncate">{value}</div>
    </div>
  );
}

function getFormatName(format: string): string {
  switch (format) {
    case 'skins': return 'Skins';
    case 'nines': return 'Nines';
    case 'stableford': return 'Stableford';
    case 'strokePlay': return 'Stroke Play';
    case 'matchPlay': return 'Match Play';
    default: return format;
  }
}

function getFormatStatusLabel(state: FormatState): string {
  if (!state) return '';

  switch (state.type) {
    case 'skins': {
      const s = state as SkinsState;
      const winners = s.results.filter((r) => r.winner);
      const counts: Record<string, number> = {};
      for (const r of winners) {
        counts[r.winner!] = (counts[r.winner!] || 0) + r.value;
      }
      const parts: string[] = Object.entries(counts)
        .map(([pid, val]) => `${getName(pid)} ${val}`);
      if (s.carryover > 0) {
        parts.push(`${s.carryover} carried`);
      }
      return parts.length > 0 ? parts.join(' | ') : 'No skins won yet';
    }
    case 'nines': {
      const n = state as NinesState;
      return Object.entries(n.points)
        .map(([pid, pts]) => `${getName(pid)} ${pts}`)
        .join(' | ');
    }
    case 'stableford': {
      const st = state as StablefordState;
      return Object.entries(st.points)
        .map(([pid, pts]) => `${getName(pid)} ${pts}`)
        .join(' | ');
    }
    case 'strokePlay': {
      const sp = state as StrokePlayState;
      return Object.entries(sp.totals)
        .map(([pid, total]) => `${getName(pid)} ${total > 0 ? '+' : ''}${total}`)
        .join(' | ');
    }
    case 'matchPlay': {
      const mp = state as DailyMatchPlayState;
      return formatMatchPlayStatus(mp.status, mp.holesPlayed, 18, getName(mp.player1), getName(mp.player2));
    }
    default:
      return '';
  }
}

function getName(pid: string): string {
  return players.find((p) => p.id === pid)?.name ?? pid;
}
