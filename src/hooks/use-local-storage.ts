import { useEffect, useState, useSyncExternalStore } from "react";
import {
  isProtectedKey,
  isUnlocked,
  getCached,
  setCachedAndPersist,
  subscribe,
} from "@/lib/secure-storage";

export function useLocalStorage<T>(key: string, initial: T) {
  const protectedKey = typeof window !== "undefined" && isProtectedKey(key);

  // For protected keys, subscribe to unlock/lock + cache changes so the
  // component re-renders when data becomes available after unlock.
  const unlockedSnapshot = useSyncExternalStore(
    subscribe,
    () => isUnlocked(),
    () => false,
  );

  const [value, setValueState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    if (protectedKey) {
      const cached = getCached(key);
      if (cached) {
        try {
          return JSON.parse(cached) as T;
        } catch {
          return initial;
        }
      }
      return initial;
    }
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  // When the secure store unlocks (or any cached value changes), refresh from cache.
  useEffect(() => {
    if (!protectedKey) return;
    if (!unlockedSnapshot) return;
    const cached = getCached(key);
    if (cached) {
      try {
        setValueState(JSON.parse(cached) as T);
      } catch {
        /* ignore */
      }
    }
  }, [protectedKey, unlockedSnapshot, key]);

  const setValue: typeof setValueState = (next) => {
    setValueState((prev) => {
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        const serialized = JSON.stringify(resolved);
        if (protectedKey) {
          setCachedAndPersist(key, serialized);
        } else if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serialized);
        }
      } catch {
        /* ignore */
      }
      return resolved;
    });
  };

  return [value, setValue] as const;
}
