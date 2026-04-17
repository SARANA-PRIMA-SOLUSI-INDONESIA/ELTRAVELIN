import Link from "next/link";

export default function SeatSelection() {
  const seats = [
    { id: "1A", status: "booked" }, { id: "1B", status: "available" }, { id: "1C", status: "available" },
    { id: "2A", status: "available" }, { id: "2B", status: "available" }, { id: "2C", status: "selected" },
    { id: "3A", status: "available" }, { id: "3B", status: "booked" }, { id: "3C", status: "available" },
    { id: "4A", status: "available" }, { id: "4B", status: "available" }, { id: "4C", status: "available" },
  ];

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Pilih Kursi</h1>
        <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest leading-none">Hiace Premio Executive • 11 Kursi</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Seat Layout - Asymmetrical Layout */}
        <div className="flex-grow flex flex-col gap-8 tonal-section p-12 rounded-[3rem] items-center">
          <div className="w-full flex justify-between items-center px-8 border-b border-navy-deep/5 pb-8 mb-4">
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Dashboard</span>
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Supir</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {seats.map((s, i) => (
              <div 
                key={i} 
                className={`w-14 h-16 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer
                  ${s.status === 'booked' ? 'bg-surface-high text-foreground/20 cursor-not-allowed' : ''}
                  ${s.status === 'available' ? 'bg-white text-navy-deep shadow-ambient border border-outline-ghost hover:border-gold-warm' : ''}
                  ${s.status === 'selected' ? 'btn-primary shadow-lg border-2 border-gold-warm' : ''}
                `}
              >
                {s.id}
              </div>
            ))}
          </div>
          
          <div className="flex gap-8 mt-12 text-[10px] font-bold uppercase tracking-widest text-foreground/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-white border border-outline-ghost"></div> Tersedia
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-surface-high"></div> Terisi
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-navy-deep"></div> Dipilih
            </div>
          </div>
        </div>

        {/* Booking Summary - Ambient Shadow */}
        <div className="w-full lg:w-96 flex flex-col gap-8 bg-white p-10 rounded-[2.5rem] shadow-ambient h-fit border border-outline-ghost">
          <h2 className="text-xl font-display font-bold text-navy-deep">Detail Pesanan</h2>
          
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/40 font-medium">Layanan</span>
              <span className="text-navy-deep font-bold italic">Executive</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/40 font-medium">Kursi Dipilih</span>
              <span className="text-navy-deep font-bold">2C</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-6 border-t border-navy-deep/5">
              <span className="text-foreground/40 font-medium">Total Harga</span>
              <span className="text-2xl font-display font-bold text-navy-deep">Rp 150.000</span>
            </div>
          </div>

          <Link 
            href="/confirmation" 
            className="btn-primary w-full py-4 rounded-xl text-center font-bold text-sm shadow-md mt-4"
          >
            Lanjutkan ke Pembayaran
          </Link>
          
          <div className="text-[10px] text-center text-foreground/40 uppercase font-bold tracking-widest">
            Semua kursi dilengkapi Individual Port <br /> & Reading Light
          </div>
        </div>
      </div>
    </div>
  );
}
