import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/travel_bg.png"
          alt="Travel Background"
          fill
          className="object-cover scale-105 animate-[slow-zoom_20s_ease-in-out_infinite]"
          priority
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Brand Identity */}
          <div className="flex justify-center -mb-12 md:-mb-20">
            <div className="relative w-full max-w-[20rem] h-40 md:max-w-[42rem] md:h-72 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Image
                src="/images/logo eltravel.png"
                alt="EL Travel Logo"
                fill
                className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                priority
              />
            </div>
          </div>

          {/* Status Message */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <h2 className="text-white text-2xl md:text-3xl font-semibold mb-4">
              Sedang dalam Pengembangan
            </h2>
            <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-8">
              Kami sedang mempersiapkan sesuatu yang luar biasa untuk perjalanan Anda.
              Nantikan pengalaman perjalanan premium yang tak terlupakan bersama kami.
            </p>

            {/* Visual Element: Coming Soon indicator */}
            <div className="flex items-center justify-center gap-3 text-white/90">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-sm font-medium tracking-widest uppercase">Coming Soon</span>
            </div>
          </div>

          {/* Footer Info */}
          <p className="mt-12 text-white/50 text-sm font-light tracking-wide animate-in fade-in duration-1000 delay-700">
            © {new Date().getFullYear()} EL Travel. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
