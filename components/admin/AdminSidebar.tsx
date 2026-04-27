"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { label: "Overview", icon: "ri-dashboard-3-line", href: "/admin" },
    { label: "Jadwal", icon: "ri-calendar-event-line", href: "/admin/schedules" },
    { label: "Rute & Harga", icon: "ri-map-pin-2-line", href: "/admin/routes" },
    { label: "Pemesanan", icon: "ri-ticket-2-line", href: "/admin/bookings" },
    { label: "Laporan", icon: "ri-bar-chart-box-line", href: "/admin/reports" },
  ];

  const handleLogout = async () => {
    // We'll implement logout via a simple cookie clearing or redirect
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/admin/login");
  };

  return (
    <aside className="w-72 bg-white border-r border-outline-ghost flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="p-8 border-b border-outline-ghost flex items-center gap-3">
        <div className="w-10 h-10 bg-navy-deep rounded-xl flex items-center justify-center">
          <i className="ri-steering-2-line text-white text-xl"></i>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-navy-deep leading-none">Admin Panel</span>
          <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest mt-1">El Travelin</span>
        </div>
      </div>

      <nav className="flex-1 p-6 flex flex-col gap-2">
        {menuItems.map((item: any) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                isActive 
                  ? "bg-navy-deep text-white shadow-lg" 
                  : "text-foreground/60 hover:bg-surface-low hover:text-navy-deep"
              }`}
            >
              <i className={`${item.icon} text-lg ${isActive ? "text-gold-warm" : ""}`}></i>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-outline-ghost flex flex-col gap-4">
         <div className="flex items-center gap-4 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-surface-medium flex items-center justify-center">
               <i className="ri-user-settings-line text-navy-deep"></i>
            </div>
            <div className="flex flex-col truncate">
               <span className="text-sm font-bold text-navy-deep truncate">Super Admin</span>
               <span className="text-[10px] text-foreground/40 font-bold uppercase truncate">Online</span>
            </div>
         </div>
         <button 
           onClick={handleLogout}
           className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
         >
           <i className="ri-logout-box-r-line text-lg"></i>
           Logout
         </button>
      </div>
    </aside>
  );
}
