import { useState, useEffect, useMemo } from 'react';
import { useTripStore } from '../../store/tripStore';
import { courses } from '../../config/courses';
import { players } from '../../config/players';
import { calculateAllCourseHandicaps, getTotalPar } from '../../lib/handicap';
import { AppShell } from '../layout/AppShell';
import { CourseEditor } from './CourseEditor';
import type { DailyFormat, PlayerId, TeeConfig } from '../../types';

interface RoundSetupProps {
  onStart: () => void;
  onBack: () => void;
}

const FORMAT_LABELS: Record<DailyFormat, string> = {
  skins: 'Skins',
  nines: 'Nines (5-3-1)',
  stableford: 'Stableford',
  strokePlay: 'Stroke Play',
  matchPlay: 'Match Play',
};

const FORMAT_DESCRIPTIONS: Record<DailyFormat, string> = {
  skins: 'Lowest score wins each hole. Ties carry over.',
  nines: '3-player game: 5 pts (best), 3 pts (middle), 1 pt (worst) per hole.',
  stableford: 'Par = 1 pt, birdie = 2, eagle = 3. Bogey or worse = 0.',
  strokePlay: 'Lowest total score after 18 holes wins.',
  matchPlay: 'Standard 1v1 match play.',
};

export function RoundSetup({ onStart, onBack }: RoundSetupProps) {
  const trip = useTripStore((s) => s.trip);
  const startRound = useTripStore((s) => s.startRound);
  const roundNumber = (trip?.rounds.length ?? 0) + 1;

  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [teeId, setTeeId] = useState(courses[0]?.tees[0]?.id ?? '');
  const [startingHole, setStartingHole] = useState<1 | 10>(1);
  const [format, setFormat] = useState<DailyFormat>('skins');
  const [allowance, setAllowance] = useState(100);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerId[]>(['sam', 'cole', 'niko']);
  const [mpPlayer1, setMpPlayer1] = useState<PlayerId>('sam');
  const [mpPlayer2, setMpPlayer2] = useState<PlayerId>('cole');
  const [showEditor, setShowEditor] = useState(false);

  const togglePlayer = (pid: PlayerId) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(pid)) {
        if (prev.length <= 2) return prev;
        return prev.filter((p) => p !== pid);
      }
      return [...prev, pid];
    });
  };

  const activePlayers = players.filter((p) => selectedPlayers.includes(p.id));

  const selectedCourse = courses.find((c) => c.id === courseId);

  const baseTee = useMemo(() => {
    return selectedCourse?.tees.find((t) => t.id === teeId);
  }, [selectedCourse, teeId]);

  const [localTeeData, setLocalTeeData] = useState<TeeConfig | null>(null);

  useEffect(() => {
    if (baseTee) {
      setLocalTeeData(structuredClone(baseTee));
    }
  }, [baseTee]);

  const activeTee = localTeeData ?? baseTee;

  const previewHandicaps = activeTee
    ? calculateAllCourseHandicaps(
        activePlayers,
        activeTee.slope,
        activeTee.rating,
        getTotalPar(activeTee.holes),
        allowance / 100,
      )
    : null;

  const lowestHcp = previewHandicaps
    ? Math.min(...selectedPlayers.map((pid) => previewHandicaps[pid]))
    : 0;

  const totalPar = activeTee ? getTotalPar(activeTee.holes) : null;

  const handleStart = () => {
    if (!activeTee || selectedPlayers.length < 2) return;
    startRound({
      courseId,
      teeId,
      teeData: activeTee,
      activePlayers: selectedPlayers,
      startingHole,
      format,
      handicapAllowance: allowance / 100,
      matchPlayPlayers: format === 'matchPlay' ? { player1: mpPlayer1, player2: mpPlayer2 } : undefined,
    });
    onStart();
  };

  return (
    <>
      <AppShell title={`Round ${roundNumber} Setup`} onBack={onBack}>
        <div className="flex-1 p-4 pb-8 space-y-5 overflow-y-auto">
          {/* Hero */}
          <div className="rounded-2xl overflow-hidden -mx-0">
            <img
              src="/cat-tee1.png"
              alt="Golf cat ready to tee off"
              className="w-full h-36 object-cover object-top"
            />
          </div>

          {/* Course Selection */}
          <Section label="Course">
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                const c = courses.find((c) => c.id === e.target.value);
                if (c?.tees[0]) {
                  setTeeId(c.tees[0].id);
                  setLocalTeeData(structuredClone(c.tees[0]));
                }
              }}
              className="select-field"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Section>

          {/* Players */}
          <Section label="Players">
            <div className="flex gap-2">
              {players.map((p) => {
                const isSelected = selectedPlayers.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-500 active:bg-slate-700'
                      }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
            {selectedPlayers.length < 3 && (
              <p className="text-xs text-slate-500 mt-1.5">
                {selectedPlayers.length} players selected. Nines (5-3-1) requires 3 players.
              </p>
            )}
          </Section>

          {/* Tee Selection */}
          {selectedCourse && (
            <Section label="Tees">
              <div className="flex gap-2 flex-wrap">
                {selectedCourse.tees.map((tee) => (
                  <button
                    key={tee.id}
                    onClick={() => {
                      setTeeId(tee.id);
                      setLocalTeeData(structuredClone(tee));
                    }}
                    className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${teeId === tee.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 active:bg-slate-700'
                      }`}
                  >
                    {tee.name}
                  </button>
                ))}
              </div>
              {activeTee && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {activeTee.yardage > 0 && <span>{activeTee.yardage.toLocaleString()} yds | </span>}
                    Rating {activeTee.rating} / Slope {activeTee.slope}
                    {totalPar && <span> | Par {totalPar}</span>}
                  </div>
                  <button
                    onClick={() => setShowEditor(true)}
                    className="text-xs text-sky-400 font-medium active:text-sky-300 ml-2 shrink-0"
                  >
                    Edit Course Data
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* Starting Hole */}
          <Section label="Starting Hole">
            <div className="flex gap-2">
              {([1, 10] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setStartingHole(h)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${startingHole === h
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 active:bg-slate-700'
                    }`}
                >
                  Hole {h}
                </button>
              ))}
            </div>
          </Section>

          {/* Daily Format */}
          <Section label="Daily Format">
            <div className="space-y-2">
              {(Object.keys(FORMAT_LABELS) as DailyFormat[]).map((f) => {
                const disabled = f === 'nines' && selectedPlayers.length < 3;
                return (
                  <button
                    key={f}
                    onClick={() => !disabled && setFormat(f)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors
                      ${disabled
                        ? 'bg-slate-800/50 border border-transparent text-slate-600 cursor-not-allowed'
                        : format === f
                          ? 'bg-emerald-600/20 border border-emerald-500 text-white'
                          : 'bg-slate-800 border border-transparent text-slate-300 active:bg-slate-700'
                      }`}
                  >
                    <div className="font-medium text-sm">
                      {FORMAT_LABELS[f]}
                      {disabled && <span className="text-slate-600 ml-1">(3 players)</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{FORMAT_DESCRIPTIONS[f]}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Match Play Players (only for daily match play) */}
          {format === 'matchPlay' && (
            <Section label="Match Play Pairing">
              <div className="flex gap-2 items-center">
                <select
                  value={mpPlayer1}
                  onChange={(e) => setMpPlayer1(e.target.value as PlayerId)}
                  className="select-field flex-1"
                >
                  {activePlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <span className="text-slate-500 text-sm font-medium">vs</span>
                <select
                  value={mpPlayer2}
                  onChange={(e) => setMpPlayer2(e.target.value as PlayerId)}
                  className="select-field flex-1"
                >
                  {activePlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </Section>
          )}

          {/* Handicap Allowance */}
          <Section label={`Handicap Allowance: ${allowance}%`}>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={allowance}
              onChange={(e) => setAllowance(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>50%</span>
              <span>100%</span>
            </div>
          </Section>

          {/* Course Handicap Preview */}
          {previewHandicaps && (
            <Section label="Handicaps">
              <div className={`grid gap-2 ${activePlayers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {activePlayers.map((p) => {
                  const courseHcp = previewHandicaps[p.id];
                  const strokes = courseHcp - lowestHcp;
                  return (
                    <div key={p.id} className="bg-slate-800 rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">{p.name}</div>
                      <div className="text-xl font-bold text-white">{strokes}</div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {strokes === 0 ? 'Low man' : `${strokes} stroke${strokes !== 1 ? 's' : ''}`}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Course HCP: {courseHcp}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Strokes played off low man ({activePlayers.find((p) => previewHandicaps[p.id] === lowestHcp)?.name})
              </p>
            </Section>
          )}

          <button
            onClick={handleStart}
            disabled={!activeTee}
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-semibold
              text-lg active:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 mt-4
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Round {roundNumber}
          </button>
        </div>
      </AppShell>

      {showEditor && activeTee && (
        <CourseEditor
          teeData={activeTee}
          onChange={(updated) => setLocalTeeData(updated)}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
