import { useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Child, Vaccine } from "@/lib/types";
import { VACCINES_CATALOG, VACCINES_BY_CATEGORY, CATEGORY_LABELS } from "@/lib/vaccines-catalog";
import { colorForPerson } from "@/lib/person-colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Syringe, AlertCircle } from "lucide-react";
import { uid } from "@/lib/utils";

function daysUntil(d?: string) {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function VaccinsTab() {
  const [items, setItems] = useLocalStorage<Vaccine[]>("sante:vaccins", []);
  const [children] = useLocalStorage<Child[]>("sante:children", []);
  const [open, setOpen] = useState(false);

  const whoOptions = useMemo(() => ["Moi", ...children.map((c) => c.name)], [children]);

  const [form, setForm] = useState({
    who: "Moi",
    catalogKey: "",
    customName: "",
    date: new Date().toISOString().slice(0, 10),
    nextDate: "",
    notes: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cat = VACCINES_CATALOG.find((v) => v.key === form.catalogKey);
    const name = cat ? cat.name : form.customName.trim();
    if (!name) return;

    let nextDate = form.nextDate || undefined;
    if (!nextDate && cat?.rappelMonths) {
      const [y, m, day] = form.date.split("-").map(Number);
      const d = new Date(y, m - 1, day);
      d.setMonth(d.getMonth() + cat.rappelMonths);
      nextDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    setItems([
      {
        id: uid(),
        who: form.who,
        name,
        date: form.date,
        nextDate,
        notes: form.notes || undefined,
      },
      ...items,
    ]);
    setForm({ ...form, catalogKey: "", customName: "", nextDate: "", notes: "" });
    setOpen(false);
  }

  function remove(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  const previewNextDate = useMemo(() => {
    if (form.nextDate) return null;
    const cat = VACCINES_CATALOG.find((v) => v.key === form.catalogKey);
    if (!cat?.rappelMonths || !form.date) return null;
    const [y, m, day] = form.date.split("-").map(Number);
    const d = new Date(y, m - 1, day);
    d.setMonth(d.getMonth() + cat.rappelMonths);
    return d.toLocaleDateString("fr-FR");
  }, [form.catalogKey, form.date, form.nextDate]);

  const byPerson = useMemo(() => {
    const g: Record<string, Vaccine[]> = {};
    [...items]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((v) => {
        (g[v.who] ||= []).push(v);
      });
    return g;
  }, [items]);

  // "Moi" en premier, puis les enfants triés alphabétiquement
  const personOrder = useMemo(() => {
    const all = whoOptions.filter((p) => byPerson[p]);
    return ["Moi", ...all.filter((p) => p !== "Moi").sort()];
  }, [whoOptions, byPerson]);

  const upcoming = useMemo(
    () =>
      items
        .map((v) => ({ v, days: daysUntil(v.nextDate) }))
        .filter((x) => x.days !== null && x.days! >= 0 && x.days! <= 60)
        .sort((a, b) => (a.days! - b.days!)),
    [items],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Carnet de vaccination</h3>
          <p className="text-sm text-muted-foreground">{items.length} vaccin(s) enregistré(s)</p>
        </div>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1 h-4 w-4" /> Ajouter
        </Button>
      </div>

      {upcoming.length > 0 && (
        <Card className="border-warning/40 bg-warning-soft p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Rappels à prévoir</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {upcoming.map(({ v, days }) => (
                  <li key={v.id}>
                    <strong>{v.who}</strong> — {v.name} :{" "}
                    {days === 0 ? "aujourd'hui" : `dans ${days} j`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {open && (
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="vac-who">Pour qui</Label>
                <select
                  id="vac-who"
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
                <Label htmlFor="vac-cat">Vaccin</Label>
                <select
                  id="vac-cat"
                  value={form.catalogKey}
                  onChange={(e) => setForm({ ...form, catalogKey: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3"
                >
                  <option value="">— Personnalisé —</option>
                  {(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map((cat) => (
                    <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                      {VACCINES_BY_CATEGORY[cat].map((v) => (
                        <option key={v.key} value={v.key}>{v.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              {!form.catalogKey && (
                <div className="sm:col-span-2">
                  <Label htmlFor="vac-name">Nom du vaccin</Label>
                  <Input
                    id="vac-name"
                    value={form.customName}
                    onChange={(e) => setForm({ ...form, customName: e.target.value })}
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="vac-date">Date</Label>
                <Input
                  id="vac-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vac-next">Prochain rappel (optionnel)</Label>
                <Input
                  id="vac-next"
                  type="date"
                  value={form.nextDate}
                  onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
                />
                {previewNextDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Calculé automatiquement : {previewNextDate}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="vac-notes">Notes</Label>
                <Textarea
                  id="vac-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
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

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <Syringe className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun vaccin enregistré.</p>
        </Card>
      ) : (
        personOrder.map((person) => {
          if (!byPerson[person]) return null;
          const palette = colorForPerson(person, whoOptions);
          return (
            <div key={person} className="space-y-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${palette.badge}`}>
                <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
                {person}
              </span>
              <Card className={`overflow-hidden border-l-4 ${palette.border}`}>
                {byPerson[person].map((v) => {
                  const days = daysUntil(v.nextDate);
                  return (
                    <div
                      key={v.id}
                      className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Fait le {new Date(v.date).toLocaleDateString("fr-FR")}
                        </p>
                        {v.nextDate && (
                          <p className={`mt-1 text-xs ${days !== null && days <= 60 ? "text-warning" : "text-muted-foreground"}`}>
                            Prochain rappel : {new Date(v.nextDate).toLocaleDateString("fr-FR")}
                            {days !== null && days >= 0 && ` (dans ${days} j)`}
                          </p>
                        )}
                        {v.notes && (
                          <p className="mt-1 text-xs text-muted-foreground">{v.notes}</p>
                        )}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => remove(v.id)} aria-label="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </Card>
            </div>
          );
        })
      )}
    </div>
  );
}
