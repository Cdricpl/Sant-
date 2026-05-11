import type { MedFreq, MedLog, MedTimes, Medication } from "@/lib/types";

export interface ReminderConfig {
  enabled: boolean;
  times: MedTimes;
  meds: Pick<Medication, "id" | "name" | "times">[];
  log: MedLog;
  updatedAt: number;
}

const DB_NAME = "sante-reminders";
const STORE = "config";
const KEY = "main";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveReminderConfig(
  enabled: boolean,
  times: MedTimes,
  meds: Medication[],
  log: MedLog,
): Promise<void> {
  const db = await openDB();
  const config: ReminderConfig = {
    enabled,
    times,
    meds: meds.map(({ id, name, times: t }) => ({ id, name, times: t })),
    log,
    updatedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(config, KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getReminderConfig(): Promise<ReminderConfig | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as ReminderConfig) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteReminderConfig(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function registerPeriodicSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  if (!("periodicSync" in reg)) return;
  await (reg as ServiceWorkerRegistration & {
    periodicSync: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
  }).periodicSync.register("medication-reminder", {
    minInterval: 12 * 60 * 60 * 1000,
  });
}

export async function unregisterPeriodicSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  if (!("periodicSync" in reg)) return;
  await (reg as ServiceWorkerRegistration & {
    periodicSync: { unregister: (tag: string) => Promise<void> };
  }).periodicSync.unregister("medication-reminder");
}
