import { useMemo } from 'react';
import { useTripStore } from '../../store/tripStore';
import { players as allPlayers } from '../../config/players';
import { getCourse } from '../../config/courses';
import { getHoleOrder, getCompletedHoles } from '../../lib/scoring';

interface RoundReviewProps {
  onConfirm: () => void;
  onBack: () => void;
}

export function RoundReview({ onConfirm, onBack }: RoundReviewProps) {
  const trip = useTripStore((s) => s.trip);
  const activeRoundIndex = useTripStore((s) => s.activeRoundIndex);

  const round = activeRoundIndex !== null ? trip?.rounds[activeRoundIndex] ?? null : null;
  const course = round ? getCourse(round.courseId) : null;

  const activePlayers = useMemo(
    () => allPlayers.filter((p) => round?.activePlayers.includes(p.id)),
    [round?.activePlayers],
  );

  const holeOrder = useMemo(
    () => getHoleOrder(round?.startingHole ?? 1),
    [round?.startingHole],
  );

  const completedHoles = useMemo(
    () => (round ? getCompletedHoles(round.scores, holeOrder) : []),
    [round?.scores, holeOrder],
  );

  const front9 = holeOrder.slice(0, 9);
  const back9 = holeOrder.slice(9, 18);

  if (!round) return null;

  const holes = round.teeData.holes;

  function getParTotal(holeNums: number[]) {
    return holeNums.reduce((sum, h) => {
      const cfg = holes.find((c) => c.hole === h);
      return sum + (cfg?.par ?? 0);
    }, 0);
  }

  function getGrossTotal(playerId: string, holeNums: number[]) {
    return holeNums.reduce((sum, h) => {
      const scores = round!.scores as Record<string, { hole: number; grossScore: number }[]>;
      const score = scores[playerId]
        ?.find((s) => s.hole === h);
      return sum + (score?.grossScore ?? 0);
    }, 0);
  }

  function getScoreClass(gross: number, par: number): string {
    if (gross === 0) return 'text-slate-600';
    const diff = gross - par;
    if (diff <= -2) return 'text-yellow-400 font-bold';
    if (diff === -1) return 'text-red-400 font-bold';
    if (diff === 0) return 'text-white';
    if (diff === 1) return 'text-slate-400';
    return 'text-slate-500';
  }

  const missingHoles = holeOrder.filter((h) => !completedHoles.includes(h));

  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onBack}
            className="text-slate-400 active:text-white transition-colors p-1 -ml-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-white font-bold text-sm">Review Round</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="flex-1 p-4 pb-8 space-y-4 overflow-y-auto">
        {/* Hero */}
        <div className="rounded-2xl overflow-hidden">
          <img
            src="/cat-putting.png"
            alt="Golf cat finishing the round"
            className="w-full h-36 object-cover object-center"
          />
        </div>

        {/* Course info */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">{course?.name ?? 'Round'}</h2>
          <p className="text-xs text-slate-500 capitalize">{round.format} &middot; {completedHoles.length} holes scored</p>
        </div>

        {missingHoles.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <p className="text-amber-400 text-xs font-medium">
              {missingHoles.length} hole{missingHoles.length > 1 ? 's' : ''} not scored: {missingHoles.join(', ')}
            </p>
          </div>
        )}

        {/* Scorecard table */}
        <div className="overflow-x-auto -mx-4 px-4">
          <NineTable
            label="OUT"
            holeNums={front9}
            holes={holes}
            players={activePlayers}
            round={round}
            parTotal={getParTotal(front9)}
            getGrossTotal={getGrossTotal}
            getScoreClass={getScoreClass}
          />
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <NineTable
            label="IN"
            holeNums={back9}
            holes={holes}
            players={activePlayers}
            round={round}
            parTotal={getParTotal(back9)}
            getGrossTotal={getGrossTotal}
            getScoreClass={getScoreClass}
          />
        </div>

        {/* Totals */}
        <div className="bg-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Totals</div>
          <div className={`grid gap-2 ${activePlayers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {activePlayers.map((p) => {
              const gross = getGrossTotal(p.id, holeOrder);
              const par = getParTotal(holeOrder);
              const diff = gross - par;
              const strokes = round.playingHandicaps[p.id] ?? 0;
              const net = gross - strokes;
              return (
                <div key={p.id} className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-400 mb-0.5">{p.name}</div>
                  <div className="text-xl font-bold text-white">{gross || '--'}</div>
                  <div className="text-[10px] text-slate-500">
                    {diff > 0 ? `+${diff}` : diff === 0 ? 'E' : diff} gross
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    {net || '--'} net ({strokes} strk{strokes !== 1 ? 's' : ''})
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FIR/GIR Summary */}
        <div className="bg-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Stats</div>
          <div className={`grid gap-2 ${activePlayers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {activePlayers.map((p) => {
              const scores = round.scores[p.id] ?? [];
              const fir = scores.filter((s) => s.fairwayHit === true).length;
              const firTotal = scores.filter((s) => s.fairwayHit !== null).length;
              const gir = scores.filter((s) => s.gir === true).length;
              return (
                <div key={p.id} className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-400 mb-0.5">{p.name}</div>
                  <div className="text-xs text-white">FIR: {fir}/{firTotal}</div>
                  <div className="text-xs text-white">GIR: {gir}/{completedHoles.length}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-semibold
              text-lg active:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
          >
            Confirm &amp; Complete Round
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl text-slate-400 text-sm font-medium
              active:text-slate-200 transition-colors"
          >
            Go Back &amp; Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function NineTable({
  label,
  holeNums,
  holes,
  players,
  round,
  parTotal,
  getGrossTotal,
  getScoreClass,
}: {
  label: string;
  holeNums: number[];
  holes: { hole: number; par: number; strokeIndex: number; yardage: number }[];
  players: { id: string; name: string }[];
  round: { scores: Record<string, { hole: number; grossScore: number }[]> };
  parTotal: number;
  getGrossTotal: (pid: string, holes: number[]) => number;
  getScoreClass: (gross: number, par: number) => string;
}) {
  return (
    <table className="w-full text-xs border-collapse min-w-[360px]">
      <thead>
        <tr className="border-b border-slate-700">
          <th className="text-left text-slate-500 py-1 pr-2 font-semibold w-12">Hole</th>
          {holeNums.map((h) => (
            <th key={h} className="text-center text-slate-500 py-1 font-medium w-7">{h}</th>
          ))}
          <th className="text-center text-slate-400 py-1 font-bold w-10">{label}</th>
        </tr>
        <tr className="border-b border-slate-700">
          <td className="text-left text-slate-500 py-1 pr-2 font-medium">Par</td>
          {holeNums.map((h) => {
            const cfg = holes.find((c) => c.hole === h);
            return <td key={h} className="text-center text-slate-500 py-1">{cfg?.par ?? ''}</td>;
          })}
          <td className="text-center text-slate-400 py-1 font-bold">{parTotal}</td>
        </tr>
      </thead>
      <tbody>
        {players.map((p) => {
          const total = getGrossTotal(p.id, holeNums);
          return (
            <tr key={p.id} className="border-b border-slate-800">
              <td className="text-left text-white py-1.5 pr-2 font-medium truncate max-w-[48px]">{p.name}</td>
              {holeNums.map((h) => {
                const cfg = holes.find((c) => c.hole === h);
                const score = round.scores[p.id]?.find((s: { hole: number }) => s.hole === h);
                const gross = score?.grossScore ?? 0;
                return (
                  <td
                    key={h}
                    className={`text-center py-1.5 tabular-nums ${getScoreClass(gross, cfg?.par ?? 4)}`}
                  >
                    {gross || '-'}
                  </td>
                );
              })}
              <td className="text-center text-white py-1.5 font-bold">{total || '-'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
