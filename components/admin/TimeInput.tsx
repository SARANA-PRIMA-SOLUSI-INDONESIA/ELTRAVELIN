"use client";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function TimeInput({ value, onChange, required, className }: TimeInputProps) {
  const [hh, mm] = value ? value.split(":") : ["08", "00"];

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <select
        value={hh}
        onChange={(e) => onChange(`${e.target.value}:${mm}`)}
        className="flex-1 bg-surface-low rounded-xl py-4 pl-3 pr-10 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm cursor-pointer font-bold text-center"
        required={required}
      >
        {hours.map((h) => (<option key={h} value={h}>{h}</option>))}
      </select>
      <span className="self-center text-xl font-bold text-gray-300">:</span>
      <select
        value={mm}
        onChange={(e) => onChange(`${hh}:${e.target.value}`)}
        className="flex-1 bg-surface-low rounded-xl py-4 pl-3 pr-10 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm cursor-pointer font-bold text-center"
        required={required}
      >
        {minutes.map((m) => (<option key={m} value={m}>{m}</option>))}
      </select>
    </div>
  );
}
