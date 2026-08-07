"use client";

import { useEffect } from "react";

/** Scrolls to #hash target after navigation (e.g. back from Tambah Jam / Kelola Titik). */
export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const scroll = () => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // Wait a tick so layout/cards are painted
    const t = window.setTimeout(scroll, 80);
    return () => window.clearTimeout(t);
  }, []);

  return null;
}
