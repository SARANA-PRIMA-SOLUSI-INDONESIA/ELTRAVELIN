"use client";

import { useState } from "react";

export default function PriceEdit({ scheduleId, initialPrice }: { scheduleId: string, initialPrice: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(initialPrice);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      if (res.ok) {
        setIsEditing(false);
      } else {
        alert("Gagal mengupdate harga");
      }
    } catch (err) {
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-24 bg-surface-low rounded-lg px-2 py-1 text-sm font-bold text-navy-deep outline-none focus:ring-1 focus:ring-gold-warm"
          autoFocus
        />
        <button 
          onClick={handleUpdate}
          disabled={loading}
          className="text-green-600 hover:text-green-700"
        >
          <i className="ri-check-line text-lg"></i>
        </button>
        <button 
          onClick={() => { setPrice(initialPrice); setIsEditing(false); }}
          className="text-red-500 hover:text-red-600"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="text-lg font-display font-bold text-navy-deep cursor-pointer hover:text-gold-warm transition-colors"
    >
      Rp {price.toLocaleString('id-ID')}
    </div>
  );
}
