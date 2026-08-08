"use client";

import { useState } from "react";
import { exportBookingsToExcel } from "@/app/actions/export";
import { showError } from "@/lib/swal";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const base64 = await exportBookingsToExcel();
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      await showError({ title: "Gagal", text: "Gagal mengunduh Excel." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="btn-primary px-6 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 disabled:opacity-50"
    >
      <i className={loading ? "ri-loader-4-line animate-spin" : "ri-download-2-line"}></i>
      {loading ? "Exporting..." : "Download Excel"}
    </button>
  );
}
