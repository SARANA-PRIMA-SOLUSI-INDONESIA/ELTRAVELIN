"use client";

import { useState } from "react";
import Link from "next/link";

interface Stop {
  id: string;
  name: string;
  sequence: number;
  stopTime?: string | null;
  isActive?: boolean;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  stops?: Stop[];
}

interface Schedule {
  id: string;
  vehicleType: string;
  price: number;
  departureTime: string | Date;
  arrivalTime: string | Date;
  stopTimesJson?: string | null;
  _count: {
    seats: number;
  };
  route: Route;
}

interface ScheduleCardProps {
  schedule: Schedule & {
    originStopId?: string;
    destinationStopId?: string;
  };
  fromName: string;
  toName: string;
  segmentPrice?: number;
  gimmickMarkupPercent?: number;
  gimmickMarkupEnabled?: boolean;
}

export default function ScheduleCard({
  schedule,
  fromName,
  toName,
  segmentPrice,
  gimmickMarkupPercent = 10,
  gimmickMarkupEnabled = true,
}: ScheduleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const routeDepartureDate = new Date(schedule.departureTime);
  const routeArrivalDate = new Date(schedule.arrivalTime);

  // Parse template-specific stop times if available
  const customStopTimes = (() => {
    try {
      if (schedule.stopTimesJson) {
        return JSON.parse(schedule.stopTimesJson) as Record<string, string>;
      }
    } catch (e) {
      console.error("Gagal parse stopTimesJson di ScheduleCard:", e);
    }
    return null;
  })();

  const getStopOverrideTime = (stop: Stop | undefined | null) => {
    if (!stop) return null;
    if (customStopTimes && customStopTimes[stop.id]) {
      return customStopTimes[stop.id];
    }
    return stop.stopTime; // fallback to global stopTime
  };

  // Customer-facing routes must only contain active stops.
  const activeStops = (schedule.route.stops || []).filter(s => s.isActive !== false);

  // Find origin and destination stops from the selected points
  const originStop = activeStops.find(s => s.name === fromName);
  const destStop = activeStops.find(s => s.name === toName);

  // Calculate actual departure time from origin stop
  const getStopTimeAsDate = (stopTime?: string | null, baseDate: Date = routeDepartureDate) => {
    if (!stopTime) return baseDate;
    
    // Check absolute time format
    const timeMatch = stopTime.trim().match(/^(\d{1,2})[:.](\d{2})$/);
    if (timeMatch) {
      const dateCopy = new Date(baseDate);
      dateCopy.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      return dateCopy;
    }

    // Relative time
    const dateCopy = new Date(baseDate);
    const cleanStr = stopTime.toLowerCase().replace('+', '').trim();
    if (cleanStr.includes('menit')) {
      const mins = parseInt(cleanStr);
      if (!isNaN(mins)) dateCopy.setMinutes(dateCopy.getMinutes() + mins);
    } else if (cleanStr.includes('jam')) {
      const hours = parseFloat(cleanStr);
      if (!isNaN(hours)) dateCopy.setMinutes(dateCopy.getMinutes() + Math.round(hours * 60));
    }
    return dateCopy;
  };

  const originStopTime = getStopOverrideTime(originStop);
  // Use origin stop time if available, otherwise route departure
  const departureDate = originStopTime 
    ? getStopTimeAsDate(originStopTime, routeDepartureDate)
    : routeDepartureDate;

  const destStopTime = getStopOverrideTime(destStop);
  // Use destination stop time if available, otherwise route arrival
  const arrivalDate = destStopTime
    ? getStopTimeAsDate(destStopTime, routeDepartureDate)
    : routeArrivalDate;

  // Helper to parse "+20 Menit" or "+1.5 Jam" or absolute "10:30" / "10.30" and format absolute stop time
  const getStopAbsoluteTime = (offsetStr?: string | null) => {
    if (!offsetStr) return departureDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    
    // Check if it's already an absolute time format (e.g. HH:mm or HH.mm)
    const timeMatch = offsetStr.trim().match(/^(\d{1,2})[:.](\d{2})$/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2];
      return `${hours}.${minutes}`;
    }

    const dateCopy = new Date(departureDate);
    const cleanStr = offsetStr.toLowerCase().replace('+', '').trim();
    if (cleanStr.includes('menit')) {
      const mins = parseInt(cleanStr);
      if (!isNaN(mins)) dateCopy.setMinutes(dateCopy.getMinutes() + mins);
      return dateCopy.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    } else if (cleanStr.includes('jam')) {
      const hours = parseFloat(cleanStr);
      if (!isNaN(hours)) dateCopy.setMinutes(dateCopy.getMinutes() + Math.round(hours * 60));
      return dateCopy.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    }
    
    return offsetStr;
  };

  const getStopAbsoluteDate = (offsetStr?: string | null) => {
    const dateCopy = new Date(departureDate);
    if (offsetStr) {
      // Check absolute time format
      const timeMatch = offsetStr.trim().match(/^(\d{1,2})[:.](\d{2})$/);
      if (timeMatch) {
        const stopHour = parseInt(timeMatch[1]);
        const stopMin = parseInt(timeMatch[2]);
        
        // Extract departure time in WIB timezone
        const depWIBStr = departureDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        const [depHour, depMin] = depWIBStr.split(':').map(Number);
        
        // If the stop time is earlier than departure time, it's highly likely the next day
        if (stopHour < depHour || (stopHour === depHour && stopMin < depMin)) {
          dateCopy.setDate(dateCopy.getDate() + 1);
        }
        return dateCopy.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase();
      }

      const cleanStr = offsetStr.toLowerCase().replace('+', '').trim();
      if (cleanStr.includes('menit')) {
        const mins = parseInt(cleanStr);
        if (!isNaN(mins)) dateCopy.setMinutes(dateCopy.getMinutes() + mins);
      } else if (cleanStr.includes('jam')) {
        const hours = parseFloat(cleanStr);
        if (!isNaN(hours)) dateCopy.setMinutes(dateCopy.getMinutes() + Math.round(hours * 60));
      }
    }
    
    return dateCopy.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  // Filter stops to show only between fromName and toName (inclusive)
  const stopsInSegment = activeStops.filter(s => {
    // Find sequence of fromName and toName
    const fromSeq = activeStops.find(st => st.name === fromName)?.sequence ?? 0;
    const toSeq = activeStops.find(st => st.name === toName)?.sequence ?? 999;
    return s.sequence >= fromSeq && s.sequence <= toSeq;
  });

  // Construct timeline items from selected origin to destination
  const timelineItems = stopsInSegment.map(s => {
    const sTime = getStopOverrideTime(s);
    return {
      name: s.name,
      time: getStopAbsoluteTime(sTime),
      date: getStopAbsoluteDate(sTime),
    };
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Left: Info */}
        <div className="p-6 md:p-8 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start md:min-w-[200px] border-b md:border-b-0 md:border-r border-gray-50">
          <h3 className="text-base md:text-lg font-display font-bold text-navy-deep leading-tight mb-0 md:mb-1">{schedule.vehicleType}</h3>
          <span className="text-[10px] md:text-xs font-bold text-foreground/40">{schedule._count.seats} Bangku available</span>
        </div>

        {/* Middle: Timeline Header */}
        <div className="flex-grow p-6 md:p-8 flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-foreground/40 uppercase mb-1">{fromName.split(' ')[0]}</span>
              <span className="text-lg md:text-xl font-display font-bold text-navy-deep">
                {departureDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
              </span>
            </div>

            <div className="flex-grow flex flex-col items-center gap-1 px-2 md:px-4">
              <div className="w-full h-[1px] bg-gray-200 relative flex justify-center">
                <div className="absolute -top-[3px] left-0 w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                <div className="absolute -top-[3px] right-0 w-1.5 h-1.5 rounded-full bg-gold-warm"></div>
                <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-300"></div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-foreground/40 uppercase mb-1">{toName.split(' ')[0]}</span>
              <span className="text-lg md:text-xl font-display font-bold text-navy-deep">
                {arrivalDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-2 md:gap-4">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded">
                <i className="ri-checkbox-circle-fill text-[8px] md:text-[10px] text-green-600"></i>
                <span className="text-[8px] md:text-[10px] font-bold text-green-700 uppercase tracking-tight">Bisa Refund</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded">
                <i className="ri-history-line text-[8px] md:text-[10px] text-blue-600"></i>
                <span className="text-[8px] md:text-[10px] font-bold text-blue-700 uppercase tracking-tight">Bisa Reschedule</span>
              </div>
            </div>

            {/* Accordion Trigger */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-navy-deep text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:text-gold-warm transition-colors"
            >
              Detail Perjalanan 
              <i className={`ri-arrow-down-s-line text-sm transition-transform duration-300 ${isOpen ? 'rotate-180 text-gold-warm' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Right: Price & Select */}
        <div className="p-6 md:p-8 bg-[#FDFDFD] flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-4 md:min-w-[220px] border-t md:border-t-0 md:border-l border-gray-50">
          <div className="flex flex-col items-start md:items-end">
            {(() => {
              const realPrice = segmentPrice || schedule.price;
              const showGimmick =
                gimmickMarkupEnabled && gimmickMarkupPercent > 0;
              const gimmickPrice = showGimmick
                ? Math.round(realPrice * (1 + gimmickMarkupPercent / 100))
                : null;
              return (
                <>
                  {showGimmick && gimmickPrice != null && (
                    <span className="text-sm md:text-base font-display font-medium text-foreground/35 line-through">
                      Rp {gimmickPrice.toLocaleString("id-ID")}
                    </span>
                  )}
                  <span className="text-lg md:text-xl font-display font-bold text-navy-deep">
                    Rp {realPrice.toLocaleString("id-ID")}
                  </span>
                </>
              );
            })()}
            <span className="text-[10px] font-bold text-foreground/40 uppercase">/seat</span>
          </div>
          <Link 
            href={`/seat-selection?scheduleId=${schedule.id}&originStop=${encodeURIComponent(fromName)}&destinationStop=${encodeURIComponent(toName)}${schedule.originStopId ? `&originStopId=${schedule.originStopId}` : ''}${schedule.destinationStopId ? `&destinationStopId=${schedule.destinationStopId}` : ''}${segmentPrice ? `&segmentPrice=${segmentPrice}` : ''}`}
            className="bg-[#EFEFEF] hover:bg-gold-warm hover:text-white text-navy-deep font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-xl text-center transition-all shadow-sm text-sm md:text-base w-auto md:w-full"
          >
            Select
          </Link>
        </div>
      </div>

      {/* Accordion Content: Travel Timeline */}
      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-6 md:p-8 flex flex-col gap-6 animate-slide-down">
          <div className="relative border-l border-gray-200 ml-20 flex flex-col gap-6 py-2">
            {timelineItems.map((item, index) => (
              <div key={index} className="relative flex items-center pl-8 group">
                {/* Left Column: Absolute Date & Time positioned absolute on left of border line */}
                <div className="absolute -left-[90px] flex flex-col items-end text-right w-[75px]">
                  <span className="text-xs font-bold text-navy-deep">{item.time}</span>
                  <span className="text-[9px] font-bold text-foreground/40 uppercase">{item.date}</span>
                </div>

                {/* Timeline Node (Red Dot) */}
                <div className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-[#E53E3E] border-2 border-white group-hover:scale-125 transition-transform"></div>

                {/* Timeline Card Content */}
                <div className="bg-white px-5 py-3.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 w-full max-w-xl group-hover:border-gold-soft transition-all">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#E53E3E]">
                    <i className="ri-map-pin-line text-sm"></i>
                  </div>
                  <span className="text-xs md:text-sm font-bold text-navy-deep uppercase tracking-wider">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
