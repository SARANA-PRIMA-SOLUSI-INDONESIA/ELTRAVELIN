"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/booking", label: "Pesan Tiket" },
  { href: "/routes", label: "Rute" },
  { href: "/fleet", label: "Armada" },
  { href: "/about", label: "Tentang Kami" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide navbar on booking-related pages to keep focus on the flow
  const hideOnPaths = ["/search", "/seat-selection", "/checkout", "/confirmation"];
  if (hideOnPaths.includes(pathname)) return null;

  return (
    <nav className="w-full py-4 md:py-8 flex justify-center z-50">
      <div className="glass rounded-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shadow-ambient w-[95%] md:w-[90%] max-w-5xl">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <div className="relative w-32 md:w-48 h-10 md:h-12">
            <Image
              src="/images/logo.png"
              alt="EL Travel Logo"
              fill
              sizes="(max-width: 768px) 128px, 192px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="hidden md:block btn-primary px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold shadow-sm"
            suppressHydrationWarning
          >
            Cek Jadwal
          </button>

          <button
            type="button"
            aria-label="Buka menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-full glass"
          >
            <span className={`w-5 h-0.5 bg-navy-deep transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`w-5 h-0.5 bg-navy-deep transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`w-5 h-0.5 bg-navy-deep transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-x-0 top-24 px-3 z-50">
          <div className="bg-white rounded-[2rem] px-6 py-6 flex flex-col gap-5 shadow-ambient">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-black hover:text-black/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              className="btn-primary px-4 py-3 rounded-full text-sm font-bold shadow-sm mt-1"
              suppressHydrationWarning
              onClick={() => setOpen(false)}
            >
              Cek Jadwal
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
