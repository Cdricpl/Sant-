import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Appointment, Biomarker, Medication, MedLog, Vaccine, WeightEntry, Child } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Pill, CalendarDays, Baby, FlaskConical, Download } from "lucide-react";
import { todayKey } from "@/lib/utils";

export function AccueilTab({ onGo }: { onGo: (tab: string) => void }) {
  const [weightsMoi] = useLocalStorage<WeightEntry[]>("sante:suivi:moi", []);
  const [weightsLegacy] = useLocalStorage<WeightEntry[]>("sante:suivi", []);
  const weights = weightsMoi.length > 0 ? weightsMoi : weightsLegacy;
  const [meds] = useLocalStorage<Medication[]>("sante:meds", []);
  const [log] = useLocalStorage<MedLog>("sante:medlog", {});
  const [rdv] = useLocalStorage<Appointment[]>("sante:rdv", []);
  const [children] = useLocalStorage<Child[]>("sante:children", []);
  const [biomarkers] = useLocalStorage<Biomarker[]>("sante:bio", []);
  const [vaccines] = useLocalStorage<Vaccine[]>("sante:vaccins", []);

  const last = weights[0];
  const bmi =
    last && last.height > 0
      ? (last.weight / Math.pow(last.height / 100, 2)).toFixed(1)
      : "—";

  const day = todayKey();
  const todayDoses = meds.flatMap((m) => m.times.map((t) => ({ medId: m.id, t })));
  const taken = todayDoses.filter((d) => log[`${day}|${d.medId}|${d.t}`]).length;

  const lastRdv = [...rdv].sort((a, b) => b.date.localeCompare(a.date))[0];

  const cards = [
    {
      label: "Poids",
      value: last ? `${last.weight} kg` : "—",
      sub: last ? `IMC ${bmi}` : "Aucune mesure",
      icon: Activity,
      tab: "suivi",
      tone: "bg-primary-soft text-primary",
    },
    {
      label: "Médicaments",
      value: todayDoses.length ? `${taken}/${todayDoses.length}` : "—",
      sub: "Pris aujourd'hui",
      icon: Pill,
      tab: "pilulier",
      tone: "bg-accent-soft text-accent",
    },
    {
      label: "Dernier RDV",
      value: lastRdv ? lastRdv.kind : "—",
      sub: lastRdv
        ? new Date(lastRdv.date).toLocaleDateString("fr-FR")
        : "Aucun rendez-vous",
      icon: CalendarDays,
      tab: "rdv",
      tone: "bg-warning-soft text-warning",
    },
    {
      label: "Enfants",
      value: String(children.length),
      sub: children.map((c) => c.name).join(", ") || "Aucun",
      icon: Baby,
      tab: "enfants",
      tone: "bg-primary-soft text-primary",
    },
    {
      label: "Analyses",
      value: biomarkers.length ? `${biomarkers.length} résultat(s)` : "—",
      sub: "Biomarqueurs de sang",
      icon: FlaskConical,
      tab: "analyses",
      tone: "bg-accent-soft text-accent",
    },
  ];

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      medications: meds,
      medLog: log,
      weights,
      biomarkers,
      appointments: rdv,
      vaccines,
      children,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sante-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bonjour 👋</h2>
          <p className="text-sm text-muted-foreground">
            Voici un aperçu de votre santé aujourd'hui.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportData} className="shrink-0">
          <Download className="mr-1 h-4 w-4" /> Exporter
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onGo(c.tab)}
              className="text-left"
            >
              <Card className="p-4 transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {c.label}
                    </p>
                    <p className="truncate font-semibold">{c.value}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.sub}</p>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

    </div>
  );
}
