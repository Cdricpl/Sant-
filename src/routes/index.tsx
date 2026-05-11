import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Home, Activity, Pill, FlaskConical, CalendarDays, Baby, Syringe, Lock } from "lucide-react";
import { LockScreen, useSecureGate } from "@/components/sante/LockScreen";
import { lock as lockApp } from "@/lib/secure-storage";
import { AccueilTab } from "@/components/sante/AccueilTab";
import { SuiviTab } from "@/components/sante/SuiviTab";
import { PilulierTab } from "@/components/sante/PilulierTab";
import { AnalysesTab } from "@/components/sante/AnalysesTab";
import { RdvTab } from "@/components/sante/RdvTab";
import { EnfantsTab } from "@/components/sante/EnfantsTab";
import { VaccinsTab } from "@/components/sante/VaccinsTab";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Santé+ — Votre compagnon santé" },
      {
        name: "description",
        content:
          "Suivi personnel : poids, IMC, médicaments, analyses de sang, rendez-vous médicaux, vaccins et santé des enfants.",
      },
    ],
  }),
  component: Index,
});

const TABS = [
  { id: "accueil", label: "Accueil", icon: Home },
  { id: "suivi", label: "Suivi", icon: Activity },
  { id: "pilulier", label: "Pilulier", icon: Pill },
  { id: "analyses", label: "Analyses", icon: FlaskConical },
  { id: "rdv", label: "RDV", icon: CalendarDays },
  { id: "vaccins", label: "Vaccins", icon: Syringe },
  { id: "enfants", label: "Enfants", icon: Baby },
] as const;

function Index() {
  const [tab, setTab] = useState<string>("accueil");
  const { unlocked, pinExists } = useSecureGate();

  if (!unlocked) {
    return <LockScreen pinExists={pinExists} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              +
            </span>
            <h1 className="text-lg font-bold tracking-tight">
              Santé<span className="text-primary">+</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => lockApp()}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Verrouiller"
          >
            <Lock className="h-4 w-4" />
            Verrouiller
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {tab === "accueil" && <AccueilTab onGo={setTab} />}
        {tab === "suivi" && <SuiviTab />}
        {tab === "pilulier" && <PilulierTab />}
        {tab === "analyses" && <AnalysesTab />}
        {tab === "rdv" && <RdvTab />}
        {tab === "vaccins" && <VaccinsTab />}
        {tab === "enfants" && <EnfantsTab />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between overflow-x-auto px-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 min-w-[52px] flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition`} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
