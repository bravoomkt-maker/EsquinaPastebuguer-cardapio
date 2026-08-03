"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Instalação como PWA é um extra - se falhar, o site continua funcionando normalmente.
      });
    }
  }, []);

  return null;
}
