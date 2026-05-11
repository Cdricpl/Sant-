import { useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Appointment, AppointmentKind, Child } from "@/lib/types";
import { colorForPerson } from "@/lib/person-colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, CalendarDays } from "lucide-react";
import { uid } from "@/lib/utils";

const KINDS: AppointmentKind[] = [
  "Médecin",
  "Dentiste",
  "Dermato",
  "ORL",
  "Ophtalmo",
  "Gynéco",
  "Pédiatre",
  "Kiné",
  "Autre",
];

function labelFor(a: Appointment) {
  return a.kind === "Autre" && a.customKind ? a.customKind : a.kind;
}

function formatRelativeDate(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return `dans ${Math.abs(days)} j`;
  if (days === 0) return "aujourd'hui";
  return `il y a ${days} j`;
}

export function RdvTab() {
  const [items, setItems] = useLocalStorage<Appointment[]>("sante:rdv", []);
  const [children] = useLocalStorage<Child[]>("sante:children", []);
  const [open, setOpen] = useState(false);

  const whoOptions = useMemo(() => ["Moi", ...children.map((c) => c.name)], [children]);
  const [filter, setFilter] = useState<string>(() => {
    return window.localStorage.getItem("ui:rdv:filter") ?? "Tous";
  });

  function applyFilter(value: string) {
    setFilter(value);
    window.localStorage.setItem("ui:rdv:filter", value);
  }

  const [form, setForm] = useState({
    who: "Moi",
    kind: "Médecin" as AppointmentKind,
    customKind: "",
    date: new Date().toISOString().slice(0, 10),
    practitioner: "",
    notes: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setItems([
      {
        id: uid(),
        who: form.who,
        kind: form.kind,
        customKind: form.kind === "Autre" ? form.customKind.trim() || undefined : undefined,
        date: form.date,
        practitioner: form.practitioner || undefined,
        notes: form.notes || undefined,
      },
      ...items,
    ]);
    setForm({ ...form, customKind: "", practitioner: "", notes: "" });
    setOpen(false);
  }

  function remove(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  const filtered = useMemo(
    () => (filter === "Tous" ? items : items.filter((i) => i.who === filter)),
    [items, filter],
  );

  // Group by person, then by kind label
  const byPerson = useMemo(() => {
    const g: Record<string, Record<string, Appointment[]>> = {};
    [...filtered]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((a) => {
        const k = labelFor(a);
        ((g[a.who] ||= {})[k] ||= []).push(a);
      });
    return g;
  }, [filtered]);

  const personOrder = useMemo(
    () => ["Moi", ...children.map((c) => c.name)].filter((p) => byPerson[p]),
    [children, byPerson],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Mes rendez-vous</h3>
          <p className="text-sm text-muted-foreground">Suivi des dernières consultations</p>
        </div>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1 h-4 w-4" /> Ajouter
        </Button>
      </div>

      {/* Filtres par personne */}
      {whoOptions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {["Tous", ...whoOptions].map((p) => {
            const palette = p === "Tous" ? null : colorForPerson(p, whoOptions);
            const active = filter === p;
            return (
              <button
                key={p}
                onClick={() => applyFilter(p)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                {palette && <span className={`h-2 w-2 rounded-full ${palette.dot}`} />}
                {p}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="rdv-who">Pour qui</Label>
                <select
                  id="rdv-who"
                  value={form.who}
                  onChange={(e) => setForm({ ...form, who: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3"
                >
                  {whoOptions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="rdv-kind">Type</Label>
                <select
                  id="rdv-kind"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as AppointmentKind })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              {form.kind === "Autre" && (
                <div className="sm:col-span-2">
                  <Label htmlFor="rdv-custom">Préciser</Label>
                  <Input
                    id="rdv-custom"
                    value={form.customKind}
                    onChange={(e) => setForm({ ...form, customKind: e.target.value })}
                    placeholder="Ex: Cardiologue, Ostéopathe…"
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="rdv-date">Date</Label>
                <Input
                  id="rdv-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rdv-prat">Praticien (optionnel)</Label>
                <Input
                  id="rdv-prat"
                  value={form.practitioner}
                  onChange={(e) => setForm({ ...form, practitioner: e.target.value })}
                  placeholder="Dr. Dupont"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="rdv-notes">Notes</Label>
                <Textarea
                  id="rdv-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun rendez-vous enregistré.</p>
        </Card>
      ) : (
        personOrder.map((person) => {
          const palette = colorForPerson(person, whoOptions);
          const groups = byPerson[person];
          return (
            <div key={person} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${palette.badge}`}>
                  <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
                  {person}
                </span>
              </div>
              {Object.entries(groups).map(([kind, list]) => {
                const last = list[0];
                return (
                  <Card key={kind} className={`overflow-hidden border-l-4 ${palette.border}`}>
                    <div className={`flex items-center justify-between px-4 py-2 ${palette.soft}`}>
                      <span className="text-sm font-semibold">{kind}</span>
                      <span className="text-xs text-muted-foreground">
                        Dernier : {formatRelativeDate(last.date)}
                      </span>
                    </div>
                    <div>
                      {list.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {new Date(a.date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            {a.practitioner && (
                              <p className="text-xs text-muted-foreground">{a.practitioner}</p>
                            )}
                            {a.notes && (
                              <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>
                            )}
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => remove(a.id)} aria-label="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
