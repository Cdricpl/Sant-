import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Child, UserProfile, WeightEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LineChart } from "@/components/charts/LineChart";
import { Trash2 } from "lucide-react";
import { uid } from "@/lib/utils";

function bmi(w: number, h: number) {
  const m = h / 100;
  return w / (m * m);
}

function bmiLabel(v: number) {
  if (v < 18.5) return { label: "Insuffisant", tone: "text-warning" };
  if (v < 25) return { label: "Normal", tone: "text-accent" };
  if (v < 30) return { label: "Surpoids", tone: "text-warning" };
  return { label: "Obésité", tone: "text-destructive" };
}

function storageKey(personId: string) {
  return `sante:suivi:${personId}`;
}

function PersonSuivi({ personId, isAdult }: { personId: string; isAdult: boolean }) {
  const [entries, setEntries] = useLocalStorage<WeightEntry[]>(storageKey(personId), []);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // Migration: only for "moi" — copy old "sante:suivi" once
  useEffect(() => {
    if (personId !== "moi") return;
    if (typeof window === "undefined") return;
    if (entries.length > 0) return;
    const legacy = window.localStorage.getItem("sante:suivi");
    if (!legacy) return;
    try {
      const parsed = JSON.parse(legacy) as WeightEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setEntries(parsed);
      }
    } catch {
      /* ignore */
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastHeight = entries[0]?.height ?? "";

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

  const chronological = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );

  function add(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height || String(lastHeight));
    if (!w || !h) return;
    setEntries([
      { id: uid(), date: new Date().toISOString(), weight: w, height: h },
      ...entries,
    ]);
    setWeight("");
    setHeight("");
  }

  function remove(id: string) {
    setEntries(entries.filter((e) => e.id !== id));
  }

  const points = chronological.map((e) => ({
    x: new Date(e.date).getTime(),
    y: bmi(e.weight, e.height),
    label: new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
  }));

  const refBands = isAdult
    ? [
        { min: 18.5, max: 25, color: "var(--color-accent)", label: "Normal" },
        { min: 25, max: 30, color: "var(--color-warning)", label: "Surpoids" },
      ]
    : undefined;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="mb-4 text-lg font-semibold">Nouvelle mesure</h3>
        <form onSubmit={add} className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="w">Poids (kg)</Label>
            <Input
              id="w"
              type="number"
              step="0.1"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="h">Taille (cm)</Label>
            <Input
              id="h"
              type="number"
              step="0.1"
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={lastHeight ? String(lastHeight) : "ex: 170"}
              required={!lastHeight}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Ajouter</Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="mb-2 text-lg font-semibold">Évolution IMC</h3>
        {!isAdult && points.length > 0 && (
          <p className="mb-2 text-xs text-muted-foreground">
            Pour les enfants, l'IMC s'interprète sur une courbe pédiatrique — à voir avec le médecin.
          </p>
        )}
        <LineChart points={points} refBands={refBands} yLabel="IMC" height={180} />
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-lg font-semibold">Historique</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune mesure pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((e) => {
              const v = bmi(e.weight, e.height);
              const lab = bmiLabel(v);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border bg-secondary/40 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(e.date).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.weight} kg • {e.height} cm
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">IMC {v.toFixed(1)}</p>
                    {isAdult && (
                      <p className={`text-xs font-medium ${lab.tone}`}>{lab.label}</p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)} aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export function SuiviTab() {
  const [children] = useLocalStorage<Child[]>("sante:children", []);
  const [profile, setProfile] = useLocalStorage<UserProfile>("ui:profile", {});
  const [selected, setSelected] = useState<string>(() => {
    return window.localStorage.getItem("ui:suivi:selected") ?? "moi";
  });

  function selectPerson(id: string) {
    setSelected(id);
    window.localStorage.setItem("ui:suivi:selected", id);
  }

  const persons = useMemo(
    () => [{ id: "moi", name: "Moi", isAdult: true }, ...children.map((c) => ({ id: c.id, name: c.name, isAdult: false }))],
    [children],
  );

  const current = persons.find((p) => p.id === selected) ?? persons[0];

  return (
    <div className="space-y-4">
      {persons.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {persons.map((p) => {
            const active = p.id === selected;
            return (
              <button
                key={p.id}
                onClick={() => selectPerson(p.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      )}
      {current.id === "moi" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Sexe</span>
          {(["M", "F"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setProfile({ ...profile, sex: s })}
              className={`rounded-full border px-4 py-1 text-xs font-medium transition ${
                profile.sex === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:bg-secondary"
              }`}
            >
              {s === "M" ? "Homme" : "Femme"}
            </button>
          ))}
          {profile.sex && (
            <button
              onClick={() => setProfile({ ...profile, sex: undefined })}
              className="text-xs text-muted-foreground underline"
            >
              Effacer
            </button>
          )}
        </div>
      )}
      <PersonSuivi key={current.id} personId={current.id} isAdult={current.isAdult} />
    </div>
  );
}
