import { useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import { loadTripFromFirestore, subscribeTripUpdates } from '../../firebase/sync';
import { TampaHero } from '../brand/TampaHero';

interface TripSetupProps {
  onTripReady: () => void;
}

export function TripSetup({ onTripReady }: TripSetupProps) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const createTrip = useTripStore((s) => s.createTrip);
  const loadTrip = useTripStore((s) => s.loadTrip);

  const handleCreate = () => {
    createTrip();
    onTripReady();
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Trip ID must be 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const trip = await loadTripFromFirestore(code);
      if (trip) {
        loadTrip(trip);
        subscribeTripUpdates(code, (updated) => {
          const current = useTripStore.getState().trip;
          if (current && updated.lastUpdated > current.lastUpdated) {
            loadTrip(updated);
          }
        });
        onTripReady();
      } else {
        setError('Trip not found. Check your code and try again.');
      }
    } catch {
      setError('Failed to load trip. You may be offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col">
      {/* Hero Scene */}
      <div className="relative overflow-hidden">
        <TampaHero className="w-full h-auto" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
          <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
              Sam&apos;s Tampa
            </h1>
            <h2 className="text-xl font-extrabold text-emerald-400 tracking-tight leading-tight">
              Golf Extravaganza
            </h2>
            <p className="text-amber-400/70 text-[10px] font-semibold uppercase tracking-[0.25em] mt-1">
              Plunder the Fairways
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Tagline */}
          <p className="text-center text-slate-500 text-xs">
            5 rounds &middot; 90 holes &middot; 3 pirates &middot; 1 champion
          </p>

          <button
            onClick={handleCreate}
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-semibold
              text-lg active:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20
              relative overflow-hidden group"
          >
            <span className="relative z-10">New Trip</span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 opacity-0 group-active:opacity-100 transition-opacity" />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900 px-4 text-sm text-slate-500">or join existing</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Enter Trip ID"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700
                text-white text-center text-xl font-mono tracking-[0.3em] placeholder:tracking-normal
                placeholder:text-slate-500 placeholder:text-base placeholder:font-sans
                focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading || joinCode.length < 6}
              className="w-full py-3.5 rounded-xl bg-slate-700 text-white font-medium
                disabled:opacity-40 disabled:cursor-not-allowed
                active:bg-slate-600 transition-colors"
            >
              {loading ? 'Loading...' : 'Join Trip'}
            </button>
          </div>

          {/* Footer flavor */}
          <div className="text-center pt-4">
            <p className="text-slate-600 text-[10px] tracking-wider uppercase">
              Tampa Bay &middot; March 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
