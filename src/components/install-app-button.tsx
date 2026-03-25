"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    deferredPwaPrompt?: BeforeInstallPromptEvent;
  }
}

type PlatformKind = "ios" | "android" | "other";

function detectPlatform(): PlatformKind {
  if (typeof navigator === "undefined") {
    return "other";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "other";
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  const iosStandalone = navigatorWithStandalone.standalone === true;
  const displayStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return iosStandalone || displayStandalone;
}

type InstallAppButtonProps = {
  compact?: boolean;
};

export function InstallAppButton({ compact = false }: InstallAppButtonProps) {
  const [platform] = useState<PlatformKind>(() =>
    typeof window === "undefined" ? "other" : detectPlatform(),
  );
  const [isReady, setIsReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.deferredPwaPrompt),
  );
  const [isInstalled, setIsInstalled] = useState(
    () => typeof window !== "undefined" && isStandaloneMode(),
  );
  const [helper, setHelper] = useState<string | null>(null);

  useEffect(() => {
    const handleInstallAvailable = () => {
      setIsReady(true);
      setHelper(null);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsReady(false);
      setHelper("Instalada. Ya puedes abrirla desde la pantalla principal.");
      window.deferredPwaPrompt = undefined;
    };

    const displayModeMedia = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      setIsInstalled(isStandaloneMode());
    };

    window.addEventListener("animocerca-install-available", handleInstallAvailable);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayModeMedia.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("animocerca-install-available", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeMedia.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const handleInstall = async () => {
    if (isInstalled) {
      setHelper("La app ya esta instalada en este telefono.");
      return;
    }

    if (window.deferredPwaPrompt) {
      await window.deferredPwaPrompt.prompt();
      const choice = await window.deferredPwaPrompt.userChoice;
      setIsReady(false);

      if (choice.outcome === "accepted") {
        setHelper("Instalacion iniciada. Busca AnimoCerca en tu pantalla principal.");
        window.deferredPwaPrompt = undefined;
        return;
      }

      setHelper("Puedes instalarla mas tarde desde el menu del navegador.");
      return;
    }

    if (!window.isSecureContext && platform !== "ios") {
      setHelper("Para instalarla en Android necesitas abrirla con HTTPS o en localhost.");
      return;
    }

    if (platform === "ios") {
      setHelper("En iPhone/iPad: abre en Safari, pulsa Compartir y luego 'Anadir a pantalla de inicio'.");
      return;
    }

    if (platform === "android") {
      setHelper("En Android: abre el menu del navegador y pulsa 'Instalar aplicacion' o 'Anadir a pantalla principal'.");
      return;
    }

    setHelper("Busca en el menu del navegador la opcion para instalar o anadir la app a la pantalla principal.");
  };

  const buttonLabel = isInstalled ? "App instalada" : isReady ? "Instalar app" : "Como instalar";
  const buttonClass = compact
    ? "button button-secondary button-small"
    : "button button-secondary";

  return (
    <div>
      <button className={buttonClass} disabled={isInstalled} onClick={handleInstall} type="button">
        {buttonLabel}
      </button>
      {helper ? <p className="install-helper">{helper}</p> : null}
    </div>
  );
}
