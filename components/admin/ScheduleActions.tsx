"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmAction, showError, showInfo } from "@/lib/swal";

export default function ScheduleActions({ scheduleId }: { scheduleId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!(await confirmAction({ title: "Hapus Jadwal", danger: true, text: "Apakah Anda yakin ingin menghapus jadwal ini?" }))) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        await showError({ title: "Gagal", text: "Gagal menghapus jadwal" });
      }
    } catch {
      await showError({ title: "Terjadi Kesalahan", text: "Terjadi kesalahan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
       <button 
         onClick={() => { showInfo({ title: "Info", text: "Fitur edit detail lengkap akan segera hadir" }); }}
         className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center text-navy-deep hover:bg-gold-soft transition-all"
         title="Edit Jadwal"
       >
         <i className="ri-edit-line text-sm"></i>
       </button>
       <button 
         onClick={handleDelete}
         disabled={loading}
         className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
         title="Hapus Jadwal"
       >
         <i className={loading ? "ri-loader-4-line animate-spin" : "ri-delete-bin-line text-sm"}></i>
       </button>
    </div>
  );
}
