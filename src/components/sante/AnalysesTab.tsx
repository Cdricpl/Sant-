import { useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Biomarker, UserProfile } from "@/lib/types";
import { BIOMARKERS_CATALOG, flagForValue } from "@/lib/biomarkers-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/LineChart";
import { Trash2, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { uid } from "@/lib/utils";

export function AnalysesTab() {
  const [profile] = useLocalStorage<UserProfile>("ui:profile", {});
  const [items, setItems] = useLocalStorage<Biomarker[]>("sante:bio", []);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({});

  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: "", value: "", unit: "", refRange: "", category: "Autre" });

  function saveDay(e: React.FormEvent) {
    e.preventDefault();
    const newOnes: Biomarker[] = [];
    Object.entries(values).forEach(([key, raw]) => {
      const v = raw.trim();
      if (!v) return;
      const cat = BIOMARKERS_CATALOG.find((c) => c.key === key);
      if (!cat) return;
      const num = parseFloat(v.replace(",", "."));
      const flag = !isNaN(num) ? flagForValue(cat, num, profile.sex) : undefined;
      newOnes.push({
        id: uid(),
        category: cat.category,
        name: cat.name,
        value: v,
        unit: cat.unit,
        refRange: cat.refRange,
        date,
        flag,
      });
    });
    if (newOnes.length === 0) return;
    setItems([...newOnes, ...items]);
    setValues({});
    setOpen(false);
  }

  function addCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!custom.name.trim() || !custom.value.trim()) return;
    setItems([
      {
        id: uid(),
        category: custom.category || "Autre",
        name: custom.name.trim(),
        value: custom.value.trim(),
        unit: custom.unit.trim(),
        refRange: custom.refRange.trim(),
        date,
      },
      ...items,
    ]);
    setCustom({ name: "", value: "", unit: "", refRange: "", category: "Autre" });
    setShowCustom(false);
  }

  function remove(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  // Group history by biomarker name
  const byName = useMemo(() => {
    const g: Record<string, Biomarker[]> = {};
    [...items]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((it) => {
        (g[it.name] ||= []).push(it);
      });
    return g;
  }, [items]);

  // Group by category for the catalog form
  const catalogByCat = useMemo(() => {
    const g: Record<string, typeof BIOMARKERS_CATALOG> = {};
    BIOMARKERS_CATALOG.forEach((b) => {
      (g[b.category] ||= []).push(b);
    });
    return g;
  }, []);

  // Summary cards (latest value with sparkline)
  const summaries = useMemo(() => {
    return Object.entries(byName).map(([name, list]) => {
      const last = list[list.length - 1];
      const prev = list[list.length - 2];
      const nums = list.map((x) => parseFloat(x.value.replace(",", "."))).filter((n) => !isNaN(n));
      let trend: "up" | "down" | "flat" = "flat";
      if (prev) {
        const a = parseFloat(prev.value.replace(",", "."));
        const b = parseFloat(last.value.replace(",", "."));
        if (!isNaN(a) && !isNaN(b)) {
          if (b > a * 1.02) trend = "up";
          else if (b < a * 0.98) trend = "down";
        }
      }
      return { name, last, history: list, nums, trend };
    });
  }, [byName]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Analyses de sang</h3>
          <p className="text-sm text-muted-foreground">{items.length} mesure(s) enregistrée(s)</p>
        </div>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1 h-4 w-4" /> Mes résultats
        </Button>
      </div>

      {open && (
        <Card className="p-5">
          <form onSubmit={saveDay} className="space-y-4">
            <div>
              <Label htmlFor="bio-date">Date du prélèvement</Label>
              <Input
                id="bio-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Renseigne uniquement les valeurs que tu as. Les autres restent vides.
            </p>
            {Object.entries(catalogByCat).map(([cat, list]) => (
              <div key={cat} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{cat}</p>
                <div className="grid gap-2">
                  {list.map((b) => (
                    <div key={b.key} className="grid grid-cols-[1fr_110px] items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{b.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {b.unit} • réf {b.refRange}
                        </p>
                      </div>
                      <Input
                        inputMode="decimal"
                        placeholder="—"
                        value={values[b.key] ?? ""}
                        onChange={(e) => setValues({ ...values, [b.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowCustom((s) => !s)}>
          <Plus className="mr-1 h-3 w-3" /> Biomarqueur personnalisé
        </Button>
      </div>

      {showCustom && (
        <Card className="p-5">
          <form onSubmit={addCustom} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nom</Label>
              <Input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} required />
            </div>
            <div>
              <Label>Résultat</Label>
              <Input value={custom.value} onChange={(e) => setCustom({ ...custom, value: e.target.value })} required />
            </div>
            <div>
              <Label>Unité</Label>
              <Input value={custom.unit} onChange={(e) => setCustom({ ...custom, unit: e.target.value })} />
            </div>
            <div>
              <Label>Réf.</Label>
              <Input value={custom.refRange} onChange={(e) => setCustom({ ...custom, refRange: e.target.value })} />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Input value={custom.category} onChange={(e) => setCustom({ ...custom, category: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCustom(false)}>Annuler</Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </Card>
      )}

      {summaries.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Aucune mesure enregistrée.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {summaries.map(({ name, last, history, nums, trend }) => {
            const flagColor =
              last.flag === "high"
                ? "text-destructive"
                : last.flag === "low"
                  ? "text-warning"
                  : "text-accent";
            const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
            return (
              <Card key={name} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {last.unit && `${last.unit} • `}réf {last.refRange}
                    </p>
                  </div>
                  <Sparkline values={nums} />
                  <div className="text-right">
                    <p className={`text-lg font-bold ${flagColor}`}>{last.value}</p>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                      <TrendIcon className="h-3 w-3" />
                      {history.length} mesure(s)
                    </div>
                  </div>
                </div>
                {history.length > 1 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Historique
                    </summary>
                    <div className="mt-2 space-y-1">
                      {[...history].reverse().map((h) => (
                        <div key={h.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(h.date).toLocaleDateString("fr-FR")}
                          </span>
                          <span className="font-medium">
                            {h.value} {h.unit}
                          </span>
                          <Button size="icon" variant="ghost" onClick={() => remove(h.id)} aria-label="Supprimer">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
