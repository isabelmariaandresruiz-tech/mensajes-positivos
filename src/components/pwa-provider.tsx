"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    deferredPwaPrompt?: BeforeInstallPromptEvent;
    __animocercaSwReloaded?: boolean;
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function PwaProvider() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const canRegisterServiceWorker = window.isSecureContext || isLocalHostname(window.location.hostname);

    if ("serviceWorker" in navigator && canRegisterServiceWorker) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          void registration.update();

          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }

          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) {
              return;
            }

            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                installing.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });

          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!window.__animocercaSwReloaded) {
              window.__animocercaSwReloaded = true;
              window.location.reload();
            }
          });
        })
        .catch(() => {
          // No-op: app still works without offline cache.
        });
    }

    const handleBeforeInstall = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      window.deferredPwaPrompt = installEvent;
      window.dispatchEvent(new Event("animocerca-install-available"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  return null;
}