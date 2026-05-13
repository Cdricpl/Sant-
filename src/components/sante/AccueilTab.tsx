import { useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Appointment, Biomarker, Medication, MedLog, Vaccine, WeightEntry, Child } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Pill, CalendarDays, Baby, FlaskConical, Download, Upload } from "lucide-react";
import { todayKey } from "@/lib/utils";

export function AccueilTab({ onGo }: { onGo: (tab: string) => void }) {
  const [weightsMoi, setWeightsMoi] = useLocalStorage<WeightEntry[]>("sante:suivi:moi", []);
  const [weightsLegacy] = useLocalStorage<WeightEntry[]>("sante:suivi", []);
  const weights = weightsMoi.length > 0 ? weightsMoi : weightsLegacy;
  const [meds, setMeds] = useLocalStorage<Medication[]>("sante:meds", []);
  const [log, setLog] = useLocalStorage<MedLog>("sante:medlog", {});
  const [rdv, setRdv] = useLocalStorage<Appointment[]>("sante:rdv", []);
  const [children, setChildren] = useLocalStorage<Child[]>("sante:children", []);
  const [biomarkers, setBiomarkers] = useLocalStorage<Biomarker[]>("sante:bio", []);
  const [vaccines, setVaccines] = useLocalStorage<Vaccine[]>("sante:vaccins", []);

  const importRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "confirm" | "done">("idle");
  const [importPreview, setImportPreview] = useState<Record<string, number>>({});
  const [pendingImport, setPendingImport] = useState<Record<string, unknown> | null>(null);

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

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
        const preview: Record<string, number> = {};
        if (Array.isArray(data.medications)) preview["Médicaments"] = data.medications.length;
        if (Array.isArray(data.weights)) preview["Mesures poids"] = data.weights.length;
        if (Array.isArray(data.biomarkers)) preview["Analyses"] = data.biomarkers.length;
        if (Array.isArray(data.appointments)) preview["Rendez-vous"] = data.appointments.length;
        if (Array.isArray(data.vaccines)) preview["Vaccins"] = data.vaccines.length;
        if (Array.isArray(data.children)) preview["Enfants"] = data.children.length;
        if (Object.keys(preview).length === 0) return;
        setPendingImport(data);
        setImportPreview(preview);
        setImportStatus("confirm");
      } catch { /* fichier invalide */ }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!pendingImport) return;
    if (Array.isArray(pendingImport.medications)) setMeds(pendingImport.medications as Medication[]);
    if (pendingImport.medLog && typeof pendingImport.medLog === "object") setLog(pendingImport.medLog as MedLog);
    if (Array.isArray(pendingImport.weights)) setWeightsMoi(pendingImport.weights as WeightEntry[]);
    if (Array.isArray(pendingImport.biomarkers)) setBiomarkers(pendingImport.biomarkers as Biomarker[]);
    if (Array.isArray(pendingImport.appointments)) setRdv(pendingImport.appointments as Appointment[]);
    if (Array.isArray(pendingImport.vaccines)) setVaccines(pendingImport.vaccines as Vaccine[]);
    if (Array.isArray(pendingImport.children)) setChildren(pendingImport.children as Child[]);
    setPendingImport(null);
    setImportStatus("done");
    setTimeout(() => setImportStatus("idle"), 3000);
  }

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
        <div className="flex gap-2 shrink-0">
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" /> Importer
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="mr-1 h-4 w-4" /> Exporter
          </Button>
        </div>
      </div>

      {importStatus === "confirm" && (
        <Card className="border-warning/40 bg-warning-soft p-4">
          <p className="mb-2 text-sm font-semibold">Confirmer l'import ?</p>
          <ul className="mb-3 space-y-0.5 text-xs">
            {Object.entries(importPreview).map(([k, v]) => (
              <li key={k}>{k} : <strong>{v}</strong> entrée(s)</li>
            ))}
          </ul>
          <p className="mb-3 text-xs text-muted-foreground">Les données actuelles seront remplacées.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmImport}>Confirmer</Button>
            <Button size="sm" variant="ghost" onClick={() => { setImportStatus("idle"); setPendingImport(null); }}>Annuler</Button>
          </div>
        </Card>
      )}

      {importStatus === "done" && (
        <Card className="border-accent/40 bg-accent-soft p-3">
          <p className="text-sm font-semibold text-accent">Import réussi</p>
        </Card>
      )}

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
