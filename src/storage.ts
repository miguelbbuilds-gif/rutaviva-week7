import { STORAGE_KEY, type Report } from "./model";
import { SEED_REPORTS } from "./seed";

interface StoreShape {
  reports: Report[];
  tripComplete: boolean;
}

function cloneSeed(): Report[] {
  return JSON.parse(JSON.stringify(SEED_REPORTS)) as Report[];
}

export function loadStore(): StoreShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { reports: cloneSeed(), tripComplete: false };
    }
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    if (!Array.isArray(parsed.reports) || parsed.reports.length === 0) {
      return { reports: cloneSeed(), tripComplete: Boolean(parsed.tripComplete) };
    }
    return {
      reports: parsed.reports,
      tripComplete: Boolean(parsed.tripComplete),
    };
  } catch {
    return { reports: cloneSeed(), tripComplete: false };
  }
}

export function saveStore(store: StoreShape): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function resetStore(): StoreShape {
  const next = { reports: cloneSeed(), tripComplete: false };
  saveStore(next);
  return next;
}
