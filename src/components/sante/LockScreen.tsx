import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Lock, ShieldCheck, KeyRound, AlertTriangle } from "lucide-react";
import {
  isPinSet,
  isUnlocked,
  setupPin,
  unlockWithPin,
  lock,
  resetAll,
  subscribe,
} from "@/lib/secure-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const INACTIVITY_MS = 5 * 60 * 1000;

export function useSecureGate() {
  const unlocked = useSyncExternalStore(
    subscribe,
    () => isUnlocked(),
    () => false,
  );
  const [pinExists, setPinExists] = useState(false);

  useEffect(() => {
    setPinExists(isPinSet());
    return subscribe(() => setPinExists(isPinSet()));
  }, []);

  // Inactivity auto-lock
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!unlocked) return;
    const reset = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => lock(), INACTIVITY_MS);
    };
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [unlocked]);

  return { unlocked, pinExists };
}

export function LockScreen({ pinExists }: { pinExists: boolean }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pin.length < 4) {
      setError("Le code doit comporter au moins 4 chiffres.");
      return;
    }
    setBusy(true);
    try {
      if (pinExists) {
        const ok = await unlockWithPin(pin);
        if (!ok) {
          setError("Code incorrect.");
          setPin("");
        }
      } else {
        if (pin !== confirm) {
          setError("Les deux codes ne correspondent pas.");
          setBusy(false);
          return;
        }
        await setupPin(pin);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (window.confirm("Effacer toutes les données et le code PIN ? Cette action est irréversible.")) {
      await resetAll();
      setPin("");
      setConfirm("");
      setShowReset(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {pinExists ? <Lock className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h1 className="text-lg font-semibold">
            {pinExists ? "Application verrouillée" : "Protégez vos données"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {pinExists
              ? "Entrez votre code PIN pour accéder à vos données de santé."
              : "Choisissez un code PIN. Il chiffrera localement vos données médicales."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium" htmlFor="pin">
                Code PIN
              </label>
              <span className="text-xs text-muted-foreground">{pin.length}/12 chiffres</span>
            </div>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="4 chiffres minimum"
              required
            />
          </div>
          {!pinExists && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium" htmlFor="confirm">
                  Confirmer le code
                </label>
                <span className="text-xs text-muted-foreground">{confirm.length}/12 chiffres</span>
              </div>
              <Input
                id="confirm"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="4 chiffres minimum"
                required
              />
            </div>
          )}
          {error && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            <KeyRound className="mr-1 h-4 w-4" />
            {pinExists ? "Déverrouiller" : "Créer le code"}
          </Button>
        </form>

        {pinExists && (
          <div className="mt-4 text-center">
            {!showReset ? (
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setShowReset(true)}
              >
                Code oublié ?
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Sans le code, vos données chiffrées sont irrécupérables.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onReset}
                  className="w-full"
                >
                  Réinitialiser l'application
                </Button>
              </div>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-[10px] text-muted-foreground">
          Vos données restent sur cet appareil, chiffrées avec AES-GCM.
        </p>
      </Card>
    </div>
  );
}
