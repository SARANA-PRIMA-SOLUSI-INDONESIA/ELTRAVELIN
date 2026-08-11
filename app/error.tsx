"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-500">
          <i className="ri-error-warning-line" aria-hidden="true"></i>
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-gold-warm">EL Travel</p>
        <h1 className="mt-4 text-3xl font-display font-bold text-navy-deep">Layanan sedang mengalami kendala</h1>
        <p className="mt-4 text-foreground/60 leading-7">
          Terjadi kesalahan saat memuat halaman. Silakan coba lagi atau kembali ke beranda.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="btn-primary rounded-xl px-6 py-3 font-bold text-sm">
            Coba Lagi
          </button>
          <Link href="/" className="rounded-xl border border-outline-ghost bg-white px-6 py-3 font-bold text-sm text-navy-deep">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </section>
  );
}
