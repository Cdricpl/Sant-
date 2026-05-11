import { useEffect, useRef, useState } from "react";
import type { MedFreq, MedTimes, Medication, MedLog } from "@/lib/types";
import { saveReminderConfig } from "@/lib/reminder-db";

export const DEFAULT_MED_TIMES: MedTimes = {
  matin: "08:00",
  midi: "12:30",
  soir: "19:00",
};

export function useNotificationPermission() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(
    typeof window === "undefined" || !("Notification" in window)
      ? "unsupported"
      : Notification.permission,
  );

  async function request() {
    if (perm === "unsupported") return;
    const r = await Notification.requestPermission();
    setPerm(r);
  }

  return { perm, request };
}

export function useMedicationReminders(
  meds: Medication[],
  log: MedLog,
  times: MedTimes,
  enabled: boolean,
) {
  const fired = useRef<Set<string>>(new Set());

  // Sync config to IndexedDB so the service worker can read it for background notifications
  useEffect(() => {
    saveReminderConfig(enabled, times, meds, log).catch(() => {});
  }, [enabled, times, meds, log]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const interval = setInterval(() => {
      const now = new Date();
      const day = now.toISOString().slice(0, 10);
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      (["matin", "midi", "soir"] as MedFreq[]).forEach((t) => {
        if (times[t] !== hhmm) return;
        const due = meds.filter((m) => m.times.includes(t));
        const pending = due.filter((m) => !log[`${day}|${m.id}|${t}`]);
        if (pending.length === 0) return;
        const key = `${day}|${t}`;
        if (fired.current.has(key)) return;
        fired.current.add(key);
        new Notification("Santé+ — Rappel médicament", {
          body: `${t.charAt(0).toUpperCase() + t.slice(1)} : ${pending.map((m) => m.name).join(", ")}`,
          tag: key,
        });
      });
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [meds, log, times, enabled]);
}
