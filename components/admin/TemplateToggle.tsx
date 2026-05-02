"use client";

import { updateTemplateStatus } from "@/app/actions/admin-master";
import { useState } from "react";

interface TemplateToggleProps {
  id: string;
  initialStatus: boolean;
}

export default function TemplateToggle({ id, initialStatus }: TemplateToggleProps) {
  const [isActive, setIsActive] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const newStatus = !isActive;
      await updateTemplateStatus(id, newStatus);
      setIsActive(newStatus);
    } catch (error) {
      alert("Gagal update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
        isActive 
          ? 'bg-green-50 text-green-600 hover:bg-green-100' 
          : 'bg-red-50 text-red-500 hover:bg-red-100'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {isActive ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}
