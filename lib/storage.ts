export const STORAGE_KEYS = {
  current: "duamaker_current_list",
  comprehensive: "duamaker_comprehensive_list",
  voted: "duamaker_voted_ids",
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

export function getStoredIds(key: "current" | "comprehensive"): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToStoredList(key: "current" | "comprehensive", id: string): boolean {
  const ids = getStoredIds(key);
  if (ids.includes(id)) return false;
  ids.push(id);
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(ids));
  return true;
}

export function removeFromStoredList(key: "current" | "comprehensive", id: string): void {
  const ids = getStoredIds(key).filter((x) => x !== id);
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(ids));
}

export function getVotedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.voted);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markVoted(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const voted = getVotedIds();
    if (voted.has(id)) return false;
    voted.add(id);
    localStorage.setItem(STORAGE_KEYS.voted, JSON.stringify([...voted]));
    return true;
  } catch {
    return false;
  }
}
