import { useState, useEffect, useRef } from 'react';
import { useTripStore } from './store/tripStore';
import { subscribeTripUpdates } from './firebase/sync';
import { isFirebaseConfigured } from './firebase/config';
import { TripSetup } from './components/setup/TripSetup';
import { RoundSetup } from './components/setup/RoundSetup';
import { TripDashboard } from './components/setup/TripDashboard';
import { BlindScorecard } from './components/scorecard/BlindScorecard';
import { FullScorecard } from './components/reveal/FullScorecard';

type Screen =
  | 'tripSetup'
  | 'dashboard'
  | 'roundSetup'
  | 'scorecard'
  | 'fullScorecard';

export default function App() {
  const trip = useTripStore((s) => s.trip);
  const activeRoundIndex = useTripStore((s) => s.activeRoundIndex);
  const revealScores = useTripStore((s) => s.revealScores);
  const editRound = useTripStore((s) => s.editRound);
  const loadTrip = useTripStore((s) => s.loadTrip);
  const subscribedTripId = useRef<string | null>(null);

  const [screen, setScreen] = useState<Screen>('tripSetup');

  useEffect(() => {
    if (!trip) {
      setScreen('tripSetup');
    } else if (activeRoundIndex !== null) {
      setScreen('scorecard');
    } else {
      setScreen('dashboard');
    }
  }, [trip, activeRoundIndex]);

  useEffect(() => {
    if (!trip || !isFirebaseConfigured()) return;
    if (subscribedTripId.current === trip.id) return;
    subscribedTripId.current = trip.id;

    return subscribeTripUpdates(trip.id, (updated) => {
      const current = useTripStore.getState().trip;
      if (current && updated.lastUpdated > current.lastUpdated) {
        loadTrip(updated);
      }
    });
  }, [trip?.id, loadTrip]);

  switch (screen) {
    case 'tripSetup':
      return <TripSetup onTripReady={() => setScreen('dashboard')} />;

    case 'dashboard':
      return (
        <TripDashboard
          onNewRound={() => setScreen('roundSetup')}
          onViewScores={() => {
            revealScores();
            setScreen('fullScorecard');
          }}
          onLeaveTrip={() => {
            useTripStore.setState({ trip: null, activeRoundIndex: null, currentHoleIndex: 0 });
            setScreen('tripSetup');
          }}
          onEditRound={(roundIndex) => {
            editRound(roundIndex);
            setScreen('scorecard');
          }}
        />
      );

    case 'roundSetup':
      return (
        <RoundSetup
          onStart={() => setScreen('scorecard')}
          onBack={() => setScreen('dashboard')}
        />
      );

    case 'scorecard':
      return (
        <BlindScorecard
          onComplete={() => setScreen('dashboard')}
          onReveal={() => {
            revealScores();
            setScreen('fullScorecard');
          }}
        />
      );

    case 'fullScorecard':
      return (
        <FullScorecard
          onBack={() => {
            if (activeRoundIndex !== null) {
              setScreen('scorecard');
            } else {
              setScreen('dashboard');
            }
          }}
        />
      );

    default:
      return <TripSetup onTripReady={() => setScreen('dashboard')} />;
  }
}
