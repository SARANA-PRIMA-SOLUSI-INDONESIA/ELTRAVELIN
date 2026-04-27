"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Login gagal");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-low px-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-ambient p-10 flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Admin Login</h1>
          <p className="text-sm text-foreground/60 font-body">Silakan masuk untuk mengelola El Travel</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none transition-all"
              placeholder="admin@eltravelin.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 rounded-xl font-bold text-sm shadow-md disabled:opacity-50"
          >
            {loading ? "Mohon Tunggu..." : "Masuk ke Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
