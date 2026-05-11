import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Child } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Baby } from "lucide-react";
import { uid } from "@/lib/utils";

function ageOf(birth: string) {
  if (!birth) return "";
  const b = new Date(birth);
  if (isNaN(b.getTime())) return "";
  const now = new Date();
  if (b > now) return "date invalide";
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
  if (years < 2) {
    let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
    if (now.getDate() < b.getDate()) months--;
    return `${Math.max(0, months)} mois`;
  }
  return `${years} ans`;
}

export function EnfantsTab() {
  const [children, setChildren] = useLocalStorage<Child[]>("sante:children", []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; birthDate: string; sex?: "M" | "F"; notes: string }>({ name: "", birthDate: "", notes: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setChildren([...children, { id: uid(), ...form, name: form.name.trim() }]);
    setForm({ name: "", birthDate: "", sex: undefined, notes: "" });
    setOpen(false);
  }

  function remove(id: string) {
    setChildren(children.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mes enfants</h3>
          <p className="text-sm text-muted-foreground">
            {children.length} enregistré(s)
          </p>
        </div>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1 h-4 w-4" /> Ajouter un enfant
        </Button>
      </div>

      {open && (
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-name">Prénom</Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="c-birth">Date de naissance</Label>
                <Input
                  id="c-birth"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Sexe</Label>
                <div className="mt-1 flex gap-2">
                  {(["M", "F"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, sex: form.sex === s ? undefined : s })}
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                        form.sex === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:bg-secondary"
                      }`}
                    >
                      {s === "M" ? "Garçon" : "Fille"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-notes">Notes (allergies, infos…)</Label>
                <Textarea
                  id="c-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </Card>
      )}

      {children.length === 0 ? (
        <Card className="p-8 text-center">
          <Baby className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun enfant enregistré.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {children.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    c.sex === "M"
                      ? "bg-sky-100 text-sky-700"
                      : c.sex === "F"
                        ? "bg-pink-100 text-pink-600"
                        : "bg-accent-soft text-accent"
                  }`}>
                    <Baby className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {c.name}
                      {c.sex && (
                        <span className={`ml-2 text-xs font-medium ${
                          c.sex === "M" ? "text-sky-600" : "text-pink-500"
                        }`}>
                          {c.sex === "M" ? "Garçon" : "Fille"}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.birthDate
                        ? `${new Date(c.birthDate).toLocaleDateString("fr-FR")} • ${ageOf(c.birthDate)}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(c.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {c.notes && (
                <p className="mt-3 rounded-md bg-secondary/50 p-3 text-sm text-muted-foreground">
                  {c.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
