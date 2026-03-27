import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { Trip } from '../types';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: Unsubscribe | null = null;

function normalizeTimestamps(obj: unknown): unknown {
  if (obj instanceof Timestamp) return obj.toMillis();
  if (Array.isArray(obj)) return obj.map(normalizeTimestamps);
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = normalizeTimestamps(v);
    }
    return out;
  }
  return obj;
}

export async function syncTripToFirestore(trip: Trip, immediate = false): Promise<void> {
  if (!db || !isFirebaseConfigured()) return;

  if (debounceTimer) clearTimeout(debounceTimer);

  const doSync = async () => {
    try {
      const tripRef = doc(db!, 'trips', trip.id);
      await setDoc(tripRef, trip);
    } catch (err) {
      console.error('Failed to sync trip:', err);
    }
  };

  if (immediate) {
    await doSync();
  } else {
    debounceTimer = setTimeout(doSync, 500);
  }
}

export async function loadTripFromFirestore(tripId: string): Promise<Trip | null> {
  if (!db || !isFirebaseConfigured()) return null;

  try {
    const tripRef = doc(db!, 'trips', tripId);
    const snapshot = await getDoc(tripRef);
    if (snapshot.exists()) {
      return normalizeTimestamps(snapshot.data()) as Trip;
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
        const remoteTrip = normalizeTimestamps(snapshot.data()) as Trip;
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
