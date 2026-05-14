"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTimes, setSelectedTimes] = useState<string[]>(
    searchParams.get("times")?.split(",") || []
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "time_asc");

  const timeOptions = [
    { id: "pagi", label: "Pagi", icon: "ri-sun-line", sub: "05:00 - 11:00" },
    { id: "siang", label: "Siang", icon: "ri-sun-fill", sub: "11:00 - 15:00" },
    { id: "sore", label: "Sore", icon: "ri-temp-hot-line", sub: "15:00 - 19:00" },
    { id: "malam", label: "Malam", icon: "ri-moon-line", sub: "19:00 - 05:00" },
  ];

  const sortOptions = [
    { id: "time_asc", label: "Keberangkatan Terawal" },
    { id: "time_desc", label: "Keberangkatan Terakhir" },
    { id: "price_asc", label: "Harga Terendah" },
    { id: "price_desc", label: "Harga Tertinggi" },
  ];

  const updateFilters = (newTimes: string[], newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newTimes.length > 0) {
      params.set("times", newTimes.join(","));
    } else {
      params.delete("times");
    }
    
    params.set("sort", newSort);
    params.set("page", "1"); // Reset to page 1 on filter change
    
    router.push(`/search?${params.toString()}`);
  };

  const toggleTime = (id: string) => {
    const newTimes = selectedTimes.includes(id)
      ? selectedTimes.filter(t => t !== id)
      : [...selectedTimes, id];
    setSelectedTimes(newTimes);
    updateFilters(newTimes, sortBy);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    updateFilters(selectedTimes, newSort);
  };

  return (
    <div className="flex flex-col gap-8 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-display font-bold text-navy-deep">Filter Perjalanan</h3>
          <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest">Temukan jadwal terbaik Anda</p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="text-xs font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap">Urutkan:</label>
          <select 
            value={sortBy}
            onChange={handleSortChange}
            className="bg-surface-low rounded-xl px-4 py-2.5 text-sm font-medium text-navy-deep cursor-pointer border-none focus:ring-2 focus:ring-gold-warm transition-all"
          >
            {sortOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {timeOptions.map((time) => (
          <button
            key={time.id}
            onClick={() => toggleTime(time.id)}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${
              selectedTimes.includes(time.id)
                ? "border-gold-warm bg-gold-warm/5"
                : "border-gray-50 bg-gray-50/50 hover:border-gray-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              selectedTimes.includes(time.id) ? "bg-gold-warm text-white" : "bg-white text-navy-deep/40 group-hover:text-navy-deep"
            }`}>
              <i className={`${time.icon} text-lg`}></i>
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-sm font-bold ${selectedTimes.includes(time.id) ? "text-navy-deep" : "text-navy-deep/60"}`}>
                {time.label}
              </span>
              <span className="text-[10px] font-medium text-foreground/40">{time.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
