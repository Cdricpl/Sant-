import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles.css";

// Rechargement automatique quand un nouveau SW remplace l'ancien.
// On n'écoute que si un SW contrôle déjà la page : sinon le premier
// clients.claim() (première visite) provoquerait un rechargement inutile.
if (navigator.serviceWorker?.controller) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <RouterProvider router={router} />
    </AppErrorBoundary>
  </StrictMode>,
);
