import Link from "next/link";
import Image from "next/image";

interface RouteCardProps {
  from: string;
  to: string;
  price: string;
  image: string;
}

export default function RouteCard({ from, to, price, image }: RouteCardProps) {
  return (
    <Link href="/search" className="group flex flex-col gap-6 relative p-6 rounded-[2rem] bg-surface-low hover:bg-surface-medium transition-all duration-500 ease-in-out">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <Image 
          src={image}
          alt={`${from} to ${to}`}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-navy-deep/80 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
            Luxury Executive
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-navy-deep leading-tight">
            {from} <span className="text-gold-warm">→</span> {to}
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Mulai Dari</span>
          <span className="text-lg font-display font-bold text-navy-deep">Rp {price}</span>
        </div>
      </div>
      
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 rounded-full bg-gold-warm flex items-center justify-center text-navy-deep shadow-lg">
          <i className="ri-arrow-right-line text-xl"></i>
        </div>
      </div>
    </Link>
  );
}
