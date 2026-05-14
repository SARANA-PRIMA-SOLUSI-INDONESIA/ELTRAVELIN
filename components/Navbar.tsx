"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Hide navbar on booking-related pages to keep focus on the flow
  const hideOnPaths = ["/search", "/seat-selection", "/checkout", "/confirmation"];
  if (hideOnPaths.includes(pathname)) return null;

  return (
    <nav className="w-full py-4 md:py-8 flex justify-center z-50">
      <div className="glass rounded-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shadow-ambient w-[95%] md:w-[90%] max-w-5xl">
        <Link href="/" className="flex items-center gap-2 group">
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
          <Link href="/booking" className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
            Pesan Tiket
          </Link>
          <Link href="/routes" className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
            Rute
          </Link>
          <Link href="/fleet" className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
            Armada
          </Link>
          <Link href="/about" className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
            Tentang Kami
          </Link>
        </div>

        <button
          className="btn-primary px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold shadow-sm"
          suppressHydrationWarning
        >
          Cek Jadwal
        </button>
      </div>
    </nav>
  );
}
