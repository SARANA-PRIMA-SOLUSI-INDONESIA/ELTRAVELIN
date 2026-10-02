"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TourCodeLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/tour/status/${trimmed}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 w-full max-w-xl mx-auto">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Contoh: TQ-123456"
        className="flex-1 bg-white rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border border-outline-ghost"
      />
      <button type="submit" className="btn-primary px-8 py-4 rounded-2xl font-bold text-sm shadow-lg">
        Cek Status
      </button>
    </form>
  );
}
