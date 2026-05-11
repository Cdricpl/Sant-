/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Types ─────────────────────────────────────────────────────────────────────

type MedFreq = "matin" | "midi" | "soir";

interface ReminderMed {
  id: string;
  name: string;
  times: MedFreq[];
}

interface ReminderConfig {
  enabled: boolean;
  times: Record<MedFreq, string>;
  meds: ReminderMed[];
  log: Record<string, boolean>;
}

interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string;
}

// ── IndexedDB helper ──────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("sante-reminders", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("config");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getConfig(): Promise<ReminderConfig | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("config", "readonly");
    const req = tx.objectStore("config").get("main");
    req.onsuccess = () => resolve((req.result as ReminderConfig) ?? null);
    req.onerror = () => reject(req.error);
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ── Reminder check ────────────────────────────────────────────────────────────

async function checkReminders() {
  const config = await getConfig();
  if (!config?.enabled) return;

  const now = new Date();
  const today = localDateKey(now);
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  for (const slot of ["matin", "midi", "soir"] as MedFreq[]) {
    if (config.times[slot] !== hhmm) continue;
    const pending = config.meds.filter(
      (m) => m.times.includes(slot) && !config.log[`${today}|${m.id}|${slot}`],
    );
    if (!pending.length) continue;
    await self.registration.showNotification("Santé+ — Rappel médicament", {
      body: `${slot.charAt(0).toUpperCase() + slot.slice(1)} : ${pending.map((m) => m.name).join(", ")}`,
      icon: "/Sant-/icon-192.png",
      tag: `${today}|${slot}`,
      requireInteraction: false,
    });
  }
}

// ── Periodic Sync listener ────────────────────────────────────────────────────

self.addEventListener("periodicsync", (event) => {
  const e = event as PeriodicSyncEvent;
  if (e.tag === "medication-reminder") {
    e.waitUntil(checkReminders());
  }
});
