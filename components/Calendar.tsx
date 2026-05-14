"use client";

import { useState } from "react";

interface CalendarProps {
  selected?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function Calendar({ selected, onChange, minDate, maxDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isDisabled = (day: number) => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    const date = new Date(year, month, day);
    return date.toDateString() === selected.toDateString();
  };

  const isToday = (day: number) => {
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  };

  const selectDate = (day: number) => {
    if (isDisabled(day)) return;
    const date = new Date(year, month, day);
    onChange(date);
  };

  const days = [];
  for (let i = 0; i < startPadding; i++) {
    days.push(<div key={`pad-${i}`} />);
  }
  for (let day = 1; day <= totalDays; day++) {
    const disabled = isDisabled(day);
    const selectedDay = isSelected(day);
    const todayDay = isToday(day);
    days.push(
      <button
        key={day}
        onClick={() => selectDate(day)}
        disabled={disabled}
        className={`
          w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all
          ${disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gold-soft cursor-pointer'}
          ${selectedDay ? 'bg-gold-warm text-white shadow-md' : ''}
          ${!selectedDay && todayDay && !disabled ? 'border border-gold-warm text-navy-deep' : ''}
          ${!selectedDay && !todayDay && !disabled ? 'text-navy-deep' : ''}
        `}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 text-navy-deep transition-colors"
        >
          <i className="ri-arrow-left-s-line text-xl"></i>
        </button>
        <h3 className="text-lg font-display font-bold text-navy-deep">
          {monthName}
        </h3>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 text-navy-deep transition-colors"
        >
          <i className="ri-arrow-right-s-line text-xl"></i>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
          <div key={day} className="w-10 h-8 flex items-center justify-center text-[10px] font-bold text-foreground/40 uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
