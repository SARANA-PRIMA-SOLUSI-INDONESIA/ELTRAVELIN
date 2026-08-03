"use client";

import { useState } from "react";
import { sendTestETicket, sendTestAdminNotification } from "@/app/actions/test-mail";

export default function TestMailPage() {
  const [loading, setLoading] = useState<"eticket" | "admin" | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [email, setEmail] = useState("");

  async function handleTestETicket() {
    setLoading("eticket");
    setStatus(null);
    try {
      const formData = new FormData();
      if (email) formData.set("email", email);
      const res = await sendTestETicket(formData);
      setStatus({ type: res.success ? "success" : "error", message: res.success ? res.message! : res.error || "Gagal" });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(null);
    }
  }

  async function handleTestAdminNotification() {
    setLoading("admin");
    setStatus(null);
    try {
      const formData = new FormData();
      if (email) formData.set("email", email);
      const res = await sendTestAdminNotification(formData);
      setStatus({ type: res.success ? "success" : "error", message: res.success ? res.message! : res.error || "Gagal" });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-navy-deep">Test Email</h1>
        <p className="text-foreground/60 text-sm">Gunakan halaman ini untuk memastikan integrasi SMTP/Resend sudah berjalan.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-ambient border border-outline-ghost flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Email Tujuan (opsional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Kosongkan untuk menggunakan ADMIN_EMAIL default"
            className="w-full p-4 rounded-xl border border-outline-ghost outline-none focus:border-gold-warm"
          />
          <p className="text-[10px] text-foreground/40">
            Default: <code className="bg-surface-low px-1 py-0.5 rounded">muhamadanasmustopa1112@gmail.com</code>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            disabled={loading !== null}
            onClick={handleTestETicket}
            className="btn-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading === "eticket" ? (
              "Mengirim..."
            ) : (
              <><i className="ri-mail-send-line text-lg"></i> Test E-Ticket (Customer)</>
            )}
          </button>

          <button
            disabled={loading !== null}
            onClick={handleTestAdminNotification}
            className="py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 border-2 border-navy-deep text-navy-deep hover:bg-navy-deep hover:text-white transition-colors"
          >
            {loading === "admin" ? (
              "Mengirim..."
            ) : (
              <><i className="ri-notification-3-line text-lg"></i> Test Notifikasi Admin</>
            )}
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-xl text-sm font-medium ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {status.type === "success" ? (
              <p><span className="mr-1">✅</span> {status.message}</p>
            ) : (
              <p><span className="mr-1">❌</span> {status.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="p-6 bg-gold-soft/20 rounded-2xl border border-gold-warm/20">
        <h3 className="text-sm font-bold text-navy-deep mb-2 flex items-center gap-2">
          <i className="ri-information-line"></i> Info Penting
        </h3>
        <ul className="text-xs text-navy-deep/70 flex flex-col gap-2 list-disc pl-4">
          <li>Pastikan <b>SMTP_HOST</b>, <b>SMTP_USER</b>, <b>SMTP_PASS</b> sudah ada di file .env</li>
          <li>Tombol <b>Test E-Ticket</b> mengirim ke email yang diisi / ADMIN_EMAIL</li>
          <li>Tombol <b>Test Notifikasi Admin</b> selalu mengirim ke ADMIN_EMAIL</li>
          <li>Email dikirim melalui <b>Resend SMTP</b> (smtp.resend.com)</li>
        </ul>
      </div>
    </div>
  );
}
