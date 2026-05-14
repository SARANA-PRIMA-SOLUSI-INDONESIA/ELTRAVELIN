"use client";

import { useEffect, useState } from "react";

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW Registered", reg))
        .catch((err) => console.log("SW Register Error", err));
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowButton(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-8 right-8 z-[9999] flex items-center gap-3 bg-navy-deep text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group animate-fade-in border border-gold-warm/20"
    >
      <div className="w-10 h-10 rounded-full bg-gold-warm flex items-center justify-center text-navy-deep">
        <i className="ri-download-cloud-2-line text-xl"></i>
      </div>
      <div className="flex flex-col items-start">
        <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest leading-none mb-1">Dapatkan Aplikasi</span>
        <span className="text-sm font-bold tracking-tight">Install EL Travel</span>
      </div>
      <div className="ml-2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <i className="ri-close-line text-xs"></i>
      </div>
    </button>
  );
}
