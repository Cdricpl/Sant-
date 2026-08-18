import { Component, type ErrorInfo, type ReactNode } from "react";

// Filet de sécurité racine : sans lui, la moindre erreur de rendu démonte tout
// l'arbre React et laisse une page entièrement blanche, sans aucune indication.
// Le bouton de réparation vide caches et service workers — jamais localStorage,
// qui contient les données de santé chiffrées.

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erreur de rendu :", error, info.componentStack);
  }

  async repair() {
    try {
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } finally {
      window.location.reload();
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center text-card-foreground shadow">
          <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            L'application n'a pas pu s'afficher. Vos données de santé sont intactes.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-md bg-muted p-3 text-left font-mono text-xs text-destructive">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.repair()}
            className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réparer et recharger
          </button>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-2 w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
}
