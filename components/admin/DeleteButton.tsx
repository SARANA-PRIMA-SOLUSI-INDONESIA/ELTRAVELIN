"use client";

import { deleteRoute, deleteTemplate } from "@/app/actions/admin-master";
import { deletePromo } from "@/app/actions/admin-promo";
import { deleteVehicle } from "@/app/actions/admin-vehicle";
import { useState } from "react";

interface DeleteButtonProps {
  id: string;
  type: 'route' | 'template' | 'promo' | 'vehicle';
}

export default function DeleteButton({ id, type }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    let msg = "";
    if (type === 'route') msg = "Hapus rute ini beserta seluruh jadwal masternya?";
    else if (type === 'template') msg = "Hapus template jadwal ini?";
    else if (type === 'promo') msg = "Hapus kode promo ini?";
    else if (type === 'vehicle') msg = "Hapus armada ini?";
      
    if (!confirm(msg)) return;

    setLoading(true);
    try {
      if (type === 'route') {
        await deleteRoute(id);
      } else if (type === 'template') {
        await deleteTemplate(id);
      } else if (type === 'promo') {
        await deletePromo(id);
      } else if (type === 'vehicle') {
        await deleteVehicle(id);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
      alert("Gagal menghapus: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
    >
      <i className={`ri-delete-bin-line ${loading ? 'animate-pulse' : ''}`}></i>
    </button>
  );
}
