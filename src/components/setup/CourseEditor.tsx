import { useState } from 'react';
import type { TeeConfig, HoleConfig } from '../../types';

interface CourseEditorProps {
  teeData: TeeConfig;
  onChange: (updated: TeeConfig) => void;
  onClose: () => void;
}

export function CourseEditor({ teeData, onChange, onClose }: CourseEditorProps) {
  const [editData, setEditData] = useState<TeeConfig>(structuredClone(teeData));

  const updateRating = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) setEditData({ ...editData, rating: num });
  };

  const updateSlope = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) setEditData({ ...editData, slope: num });
  };

  const updateHole = (holeIdx: number, field: keyof HoleConfig, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const holes = [...editData.holes];
    holes[holeIdx] = { ...holes[holeIdx], [field]: num };
    setEditData({ ...editData, holes });
  };

  const handleSave = () => {
    onChange(editData);
    onClose();
  };

  const frontNine = editData.holes.filter((h) => h.hole <= 9);
  const backNine = editData.holes.filter((h) => h.hole >= 10);
  const frontPar = frontNine.reduce((s, h) => s + h.par, 0);
  const backPar = backNine.reduce((s, h) => s + h.par, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={onClose} className="text-slate-400 active:text-white text-sm font-medium">
            Cancel
          </button>
          <h2 className="text-white font-bold text-base">Confirm Course Data</h2>
          <button onClick={handleSave} className="text-emerald-400 active:text-emerald-300 text-sm font-bold">
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-5">
        <p className="text-xs text-slate-400">
          Verify against the actual scorecard. Edit anything that differs.
        </p>

        {/* Rating & Slope */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Rating
            </label>
            <input
              type="number"
              step="0.1"
              value={editData.rating}
              onChange={(e) => updateRating(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700
                text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Slope
            </label>
            <input
              type="number"
              value={editData.slope}
              onChange={(e) => updateSlope(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700
                text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Front Nine */}
        <NineTable
          label={`Front 9 (Par ${frontPar})`}
          holes={frontNine}
          allHoles={editData.holes}
          onUpdate={updateHole}
        />

        {/* Back Nine */}
        <NineTable
          label={`Back 9 (Par ${backPar})`}
          holes={backNine}
          allHoles={editData.holes}
          onUpdate={updateHole}
        />

        <div className="text-center text-sm text-slate-400">
          Total Par: <span className="text-white font-bold">{frontPar + backPar}</span>
        </div>
      </div>
    </div>
  );
}

function NineTable({
  label,
  holes,
  allHoles,
  onUpdate,
}: {
  label: string;
  holes: HoleConfig[];
  allHoles: HoleConfig[];
  onUpdate: (idx: number, field: keyof HoleConfig, val: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-slate-500 py-1.5 pr-1 font-medium w-12">Hole</th>
              {holes.map((h) => (
                <th key={h.hole} className="text-center text-slate-500 py-1.5 px-0.5 font-medium min-w-[32px]">
                  {h.hole}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-700/50">
              <td className="text-left text-slate-400 py-1.5 pr-1 font-medium">Par</td>
              {holes.map((h) => {
                const idx = allHoles.findIndex((ah) => ah.hole === h.hole);
                return (
                  <td key={h.hole} className="text-center py-1 px-0.5">
                    <input
                      type="number"
                      value={h.par}
                      onChange={(e) => onUpdate(idx, 'par', e.target.value)}
                      className="w-full text-center bg-slate-800 border border-slate-700 rounded
                        text-white text-xs py-1 font-mono
                        focus:outline-none focus:border-emerald-500"
                    />
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="text-left text-slate-400 py-1.5 pr-1 font-medium">HDCP</td>
              {holes.map((h) => {
                const idx = allHoles.findIndex((ah) => ah.hole === h.hole);
                return (
                  <td key={h.hole} className="text-center py-1 px-0.5">
                    <input
                      type="number"
                      value={h.strokeIndex}
                      onChange={(e) => onUpdate(idx, 'strokeIndex', e.target.value)}
                      className="w-full text-center bg-slate-800 border border-slate-700 rounded
                        text-white text-xs py-1 font-mono
                        focus:outline-none focus:border-emerald-500"
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
