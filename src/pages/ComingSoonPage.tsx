import React from 'react';

export const ComingSoonPage: React.FC = () => {
  const letters = Array.from('COMING SOON');

  return (
    <main
      aria-label="Coming Soon"
      className="relative min-h-screen w-full overflow-hidden bg-[#06080F] text-[#F8FAFC] flex items-center justify-center select-none"
    >
      {/* Ambient Breathing Radial Light Halos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[38rem] h-[38rem] md:w-[46rem] md:h-[46rem] rounded-full blur-3xl animate-pulse-halo"
        style={{
          background:
            'radial-gradient(circle, rgba(212, 175, 55, 0.26) 0%, rgba(13, 148, 136, 0.16) 44%, rgba(6, 8, 15, 0) 72%)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[26rem] h-[26rem] rounded-full blur-2xl animate-orbit-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(248, 250, 252, 0.14) 0%, rgba(13, 148, 136, 0.1) 52%, transparent 75%)',
        }}
      />

      {/* Precision Animated Geometric Orbital & Camera Aperture Rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <svg
          viewBox="0 0 600 600"
          className="w-[21rem] h-[21rem] sm:w-[29rem] sm:h-[29rem] md:w-[36rem] md:h-[36rem] opacity-45 animate-orbit-slow"
        >
          <defs>
            <linearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#0D9488" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <circle
            cx="300"
            cy="300"
            r="260"
            fill="none"
            stroke="url(#goldRingGrad)"
            strokeWidth="1.2"
            strokeDasharray="8 14"
          />
          <circle
            cx="300"
            cy="300"
            r="212"
            fill="none"
            stroke="url(#goldRingGrad)"
            strokeWidth="1.2"
          />
          <circle cx="300" cy="40" r="4" fill="#FDE68A" />
          <circle cx="300" cy="560" r="3" fill="#0D9488" />
          <circle cx="40" cy="300" r="3" fill="#F8FAFC" fillOpacity="0.6" />
          <circle cx="560" cy="300" r="3" fill="#FDE68A" fillOpacity="0.6" />
        </svg>

        <svg
          viewBox="0 0 600 600"
          className="absolute w-[16rem] h-[16rem] sm:w-[22rem] sm:h-[22rem] md:w-[27rem] md:h-[27rem] opacity-30 animate-orbit-reverse"
        >
          <circle
            cx="300"
            cy="300"
            r="165"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="0.9"
            strokeDasharray="3 9"
          />
          <polygon
            points="300,110 464,395 136,395"
            fill="none"
            stroke="#FDE68A"
            strokeOpacity="0.28"
            strokeWidth="0.9"
          />
          <polygon
            points="300,490 464,205 136,205"
            fill="none"
            stroke="#0D9488"
            strokeOpacity="0.28"
            strokeWidth="0.9"
          />
        </svg>
      </div>

      {/* Center Animated "Coming Soon" Message (Strictly No Other Text) */}
      <div className="relative z-10 px-6 text-center flex flex-col items-center">
        {/* Top Animated Light Filament */}
        <div
          aria-hidden="true"
          className="w-56 sm:w-72 h-[1px] bg-gradient-to-r from-transparent via-[#FDE68A]/85 to-transparent mb-9 animate-shimmer-filament"
        />

        <h1
          aria-label="Coming Soon"
          className="font-serif-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-[0.22em] sm:tracking-[0.28em] text-white flex flex-wrap items-center justify-center"
        >
          {letters.map((char, index) => (
            <span
              key={index}
              style={{ animationDelay: `${index * 130}ms` }}
              className={
                char === ' '
                  ? 'w-4 sm:w-7 md:w-10 inline-block'
                  : 'inline-block animate-float-letter bg-gradient-to-b from-white via-slate-100 to-[#FDE68A] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(253,230,138,0.22)]'
              }
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>

        {/* Bottom Animated Shimmer Beam */}
        <div
          aria-hidden="true"
          style={{ animationDelay: '1.4s' }}
          className="w-56 sm:w-72 h-[1px] bg-gradient-to-r from-transparent via-[#0D9488]/90 to-transparent mt-9 animate-shimmer-filament"
        />
      </div>
    </main>
  );
};
