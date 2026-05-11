import { useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Medication, MedFreq, MedLog, MedTimes } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Bell, BellOff, Sparkles } from "lucide-react";
import {
  DEFAULT_MED_TIMES,
  useMedicationReminders,
  useNotificationPermission,
} from "@/hooks/use-medication-reminders";
import { uid, todayKey, dayKey } from "@/lib/utils";

const TIMES: MedFreq[] = ["matin", "midi", "soir"];

const MESSAGES = {
  excellent: [
    "Bravo, tu es au top cette semaine ! 🌟",
    "Régularité parfaite, continue comme ça ! ✨",
    "Tu prends soin de toi à merveille. 💎",
  ],
  good: [
    "Belle régularité, continue ! 💪",
    "Tu es sur la bonne voie, bravo ! 🌿",
    "Bel engagement envers ta santé. 🍀",
  ],
  okay: [
    "Quelques oublis, on se remet en route doucement 🌱",
    "Pas de stress, chaque jour est une nouvelle chance 🌤️",
    "Une dose à la fois, tu peux le faire 💚",
  ],
  low: [
    "Pas de jugement, demain est un nouveau jour. Une dose à la fois 💛",
    "Sois doux avec toi-même. On reprend tranquillement 🤍",
    "Petit rappel bienveillant : ta santé compte 💝",
  ],
};

function pickMessage(rate: number) {
  let pool: string[];
  if (rate >= 0.9) pool = MESSAGES.excellent;
  else if (rate >= 0.7) pool = MESSAGES.good;
  else if (rate >= 0.4) pool = MESSAGES.okay;
  else pool = MESSAGES.low;
  // deterministic per day so it doesn't flicker
  const seed = new Date().getDate();
  return pool[seed % pool.length];
}

function RegularityRing({ rate }: { rate: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const dash = c * rate;
  const color =
    rate >= 0.9
      ? "var(--color-accent)"
      : rate >= 0.7
        ? "var(--color-primary)"
        : rate >= 0.4
          ? "var(--color-warning)"
          : "var(--color-destructive)";
  return (
    <svg width={92} height={92} viewBox="0 0 92 92">
      <circle cx={46} cy={46} r={r} fill="none" stroke="var(--color-muted)" strokeWidth={8} />
      <circle
        cx={46}
        cy={46}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 46 46)"
      />
      <text
        x={46}
        y={50}
        textAnchor="middle"
        fontSize={18}
        fontWeight={700}
        fill="var(--color-foreground)"
      >
        {Math.round(rate * 100)}%
      </text>
    </svg>
  );
}

export function PilulierTab() {
  const [meds, setMeds] = useLocalStorage<Medication[]>("sante:meds", []);
  const [log, setLog] = useLocalStorage<MedLog>("sante:medlog", {});
  const [times, setTimes] = useLocalStorage<MedTimes>("sante:medtimes", DEFAULT_MED_TIMES);
  const [remindersOn, setRemindersOn] = useLocalStorage<boolean>("sante:reminders", false);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [pickedTimes, setPickedTimes] = useState<MedFreq[]>([]);

  const day = todayKey();
  const { perm, request } = useNotificationPermission();
  useMedicationReminders(meds, log, times, remindersOn && perm === "granted");

  function toggleTime(t: MedFreq) {
    setPickedTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pickedTimes.length === 0) return;
    setMeds([...meds, { id: uid(), name: name.trim(), quantity: qty.trim(), times: pickedTimes }]);
    setName("");
    setQty("");
    setPickedTimes([]);
    setOpen(false);
  }

  function remove(id: string) {
    setMeds(meds.filter((m) => m.id !== id));
  }

  function toggleTaken(medId: string, t: MedFreq) {
    const k = `${day}|${medId}|${t}`;
    setLog({ ...log, [k]: !log[k] });
  }

  // Régularité 7 et 30 jours
  const stats = useMemo(() => {
    const now = new Date();
    function rateOver(days: number) {
      let total = 0;
      let taken = 0;
      for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = dayKey(d);
        meds.forEach((m) => {
          m.times.forEach((t) => {
            total++;
            if (log[`${k}|${m.id}|${t}`]) taken++;
          });
        });
      }
      return total === 0 ? 0 : taken / total;
    }
    // streak (jours consécutifs avec 100%)
    let streak = 0;
    if (meds.length > 0) {
      for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = dayKey(d);
        let dueToday = 0;
        let takenToday = 0;
        meds.forEach((m) =>
          m.times.forEach((t) => {
            dueToday++;
            if (log[`${k}|${m.id}|${t}`]) takenToday++;
          }),
        );
        if (dueToday === 0) continue;
        if (takenToday === dueToday) streak++;
        else break;
      }
    }
    return { week: rateOver(7), month: rateOver(30), streak };
  }, [meds, log]);

  const message = pickMessage(stats.week);

  async function enableReminders() {
    if (perm !== "granted") await request();
    setRemindersOn(true);
  }

  function testNotification() {
    if (perm !== "granted") return;
    new Notification("Santé+ — Test", {
      body: "Les rappels de médicaments sont bien actifs ✓",
      icon: `${import.meta.env.BASE_URL}icon-192.png`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Aujourd'hui</h3>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1 h-4 w-4" /> Médicament
        </Button>
      </div>

      {/* Bandeau régularité + message */}
      {meds.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-5">
            <RegularityRing rate={stats.week} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Régularité (7 j)
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>30 j : <strong className="text-foreground">{Math.round(stats.month * 100)}%</strong></span>
                <span>Série : <strong className="text-foreground">{stats.streak} j</strong></span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Rappels */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {remindersOn && perm === "granted" ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              Rappels
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {perm === "unsupported"
                ? "Notifications non supportées sur ce navigateur."
                : remindersOn && perm === "granted"
                  ? "Rappels actifs. Vous recevrez une notification aux heures configurées."
                  : "Activez pour recevoir une notification matin / midi / soir."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings((s) => !s)}>
              Heures
            </Button>
            {remindersOn && perm === "granted" ? (
              <>
                <Button variant="ghost" size="sm" onClick={testNotification}>
                  Tester
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRemindersOn(false)}>
                  Désactiver
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={enableReminders} disabled={perm === "unsupported"}>
                Activer
              </Button>
            )}
          </div>
        </div>
        {showSettings && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {TIMES.map((t) => (
              <div key={t}>
                <Label htmlFor={`time-${t}`} className="capitalize">{t}</Label>
                <Input
                  id={`time-${t}`}
                  type="time"
                  value={times[t]}
                  onChange={(e) => setTimes({ ...times, [t]: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {open && (
        <Card className="p-5">
          <form onSubmit={add} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="med-name">Nom</Label>
                <Input
                  id="med-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Doliprane"
                  required
                />
              </div>
              <div>
                <Label htmlFor="med-qty">Quantité</Label>
                <Input
                  id="med-qty"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="Ex: 1 cp / 10 gouttes"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Fréquence</Label>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((t) => {
                  const on = pickedTimes.includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggleTime(t)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-secondary"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </Card>
      )}

      {meds.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun médicament. Ajoutez votre premier traitement ci-dessus.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_repeat(3,56px)_36px] items-center gap-2 border-b bg-secondary/50 px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr_repeat(3,72px)_44px] sm:px-4">
            <div>Médicament</div>
            <div className="text-center">Matin</div>
            <div className="text-center">Midi</div>
            <div className="text-center">Soir</div>
            <div />
          </div>
          {meds.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_repeat(3,56px)_36px] items-center gap-2 border-b px-3 py-3 last:border-b-0 sm:grid-cols-[1fr_repeat(3,72px)_44px] sm:px-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{m.name}</p>
                {m.quantity && (
                  <p className="text-xs text-muted-foreground">{m.quantity}</p>
                )}
              </div>
              {TIMES.map((t) => {
                const required = m.times.includes(t);
                const k = `${day}|${m.id}|${t}`;
                const taken = !!log[k];
                return (
                  <div key={t} className="flex justify-center">
                    {required ? (
                      <Checkbox
                        checked={taken}
                        onCheckedChange={() => toggleTaken(m.id, t)}
                        className="h-6 w-6"
                      />
                    ) : (
                      <span className="text-muted-foreground/40">–</span>
                    )}
                  </div>
                );
              })}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(m.id)}
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
