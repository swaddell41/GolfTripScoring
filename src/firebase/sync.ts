import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { Trip } from '../types';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: Unsubscribe | null = null;

export async function syncTripToFirestore(trip: Trip): Promise<void> {
  if (!db || !isFirebaseConfigured()) return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    try {
      const tripRef = doc(db!, 'trips', trip.id);
      await setDoc(tripRef, {
        ...trip,
        lastUpdated: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to sync trip:', err);
    }
  }, 500);
}

export async function loadTripFromFirestore(tripId: string): Promise<Trip | null> {
  if (!db || !isFirebaseConfigured()) return null;

  try {
    const tripRef = doc(db!, 'trips', tripId);
    const snapshot = await getDoc(tripRef);
    if (snapshot.exists()) {
      return snapshot.data() as Trip;
    }
    return null;
  } catch (err) {
    console.error('Failed to load trip:', err);
    return null;
  }
}

export function subscribeTripUpdates(
  tripId: string,
  onUpdate: (trip: Trip) => void,
): () => void {
  if (!db || !isFirebaseConfigured()) return () => {};

  if (unsubscribe) unsubscribe();

  const tripRef = doc(db!, 'trips', tripId);
  unsubscribe = onSnapshot(
    tripRef,
    { includeMetadataChanges: false },
    (snapshot) => {
      if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
        const remoteTrip = snapshot.data() as Trip;
        onUpdate(remoteTrip);
      }
    },
    (err) => {
      console.error('Snapshot listener error:', err);
    },
  );

  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}
