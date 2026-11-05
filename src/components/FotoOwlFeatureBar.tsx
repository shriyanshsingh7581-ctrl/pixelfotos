import React from 'react';

export type FotoOwlActionMode =
  | 'face_match'
  | 'auto_culling'
  | 'live_upload'
  | 'original_download';

interface FotoOwlFeatureBarProps {
  activeMode?: FotoOwlActionMode | null;
  onSelectMode: (mode: FotoOwlActionMode) => void;
  variant?: 'banner' | 'bottom_nav';
  counts?: {
    faceMatched?: number;
    autoCulled?: number;
    liveUploaded?: number;
    downloads?: number;
  };
}

/**
 * Exact recreation of the FotoOwl "AI-Powered Live Event Photo Matching" UI
 * from the user's reference image:
 * - Circular orange-to-magenta gradient icons (#FF8314 -> #FF385C -> #E81776)
 * - Crisp white vector line icons:
 *   1. Instant Face Match (viewfinder brackets + person silhouette)
 *   2. Smart Auto-Culling (overlapping photo frames + checkmark badge)
 *   3. Live Upload Updates (cloud with upward arrow)
 *   4. Original Quality Downloads (download tray with downward arrow)
 * - Vertical coral/pink separator lines between items
 */
export const FotoOwlFeatureBar: React.FC<FotoOwlFeatureBarProps> = ({
  activeMode,
  onSelectMode,
  variant = 'banner',
  counts,
}) => {
  const items: {
    id: FotoOwlActionMode;
    line1: string;
    line2: string;
    badge?: string | number;
    renderIcon: (sizeClass: string) => React.ReactNode;
  }[] = [
    {
      id: 'face_match',
      line1: 'Instant',
      line2: 'Face Match',
      badge: counts?.faceMatched,
      renderIcon: (sizeClass) => (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={sizeClass}
          aria-hidden="true"
        >
          {/* Top-left bracket */}
          <path
            d="M11 18V13C11 11.8954 11.8954 11 13 11H18"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Top-right bracket */}
          <path
            d="M30 11H35C36.1046 11 37 11.8954 37 13V18"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Bottom-left bracket */}
          <path
            d="M11 30V35C11 36.1046 11.8954 37 13 37H18"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Bottom-right bracket */}
          <path
            d="M30 37H35C36.1046 37 37 36.1046 37 35V30"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Head circle */}
          <circle
            cx="24"
            cy="20"
            r="4.5"
            stroke="white"
            strokeWidth="2.8"
          />
          {/* Shoulders arc */}
          <path
            d="M16.5 33C17.8 29.2 20.6 27.5 24 27.5C27.4 27.5 30.2 29.2 31.5 33"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: 'auto_culling',
      line1: 'Smart',
      line2: 'Auto-Culling',
      badge: counts?.autoCulled,
      renderIcon: (sizeClass) => (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={sizeClass}
          aria-hidden="true"
        >
          {/* Back stacked photo frame */}
          <path
            d="M16 14V11.5C16 10.6716 16.6716 10 17.5 10H33.5C34.3284 10 35 10.6716 35 11.5V24"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Front main photo frame */}
          <rect
            x="11"
            y="15"
            width="20"
            height="17"
            rx="2"
            stroke="white"
            strokeWidth="2.6"
          />
          {/* Checkmark circle badge */}
          <circle
            cx="32.5"
            cy="31.5"
            r="6.5"
            fill="#F12768"
            stroke="white"
            strokeWidth="2.6"
          />
          <path
            d="M29.8 31.5L31.7 33.4L35.5 29.6"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'live_upload',
      line1: 'Live Upload',
      line2: 'Updates',
      badge: counts?.liveUploaded,
      renderIcon: (sizeClass) => (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={sizeClass}
          aria-hidden="true"
        >
          {/* Cloud outline */}
          <path
            d="M15.5 33H14C10.6863 33 8 30.3137 8 27C8 23.9522 10.2725 21.4342 13.2139 21.0519C14.0846 16.4733 18.1066 13 22.95 13C28.1872 13 32.4957 17.0468 32.8732 22.1859C35.758 22.5961 38 25.0699 38 28.08C38 30.7972 35.7972 33 33.08 33H30.5"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Upward upload arrow */}
          <path
            d="M23.5 35V23"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M19 27.5L23.5 23L28 27.5"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'original_download',
      line1: 'Original Quality',
      line2: 'Downloads',
      badge: counts?.downloads,
      renderIcon: (sizeClass) => (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={sizeClass}
          aria-hidden="true"
        >
          {/* Downward arrow shaft */}
          <path
            d="M24 12V28.5"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Downward arrow head */}
          <path
            d="M18.5 23.5L24 29L29.5 23.5"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Download tray */}
          <path
            d="M13 28.5V33C13 34.1046 13.8954 35 15 35H33C34.1046 35 35 34.1046 35 33V28.5"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  if (variant === 'bottom_nav') {
    return (
      <nav
        aria-label="FotoOwl Live Event Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-pink-200/80 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] px-1.5 py-2 md:px-6 md:py-2.5"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-4 items-center">
            {items.map((item, index) => {
              const isSelected = activeMode === item.id;
              return (
                <div
                  key={item.id}
                  className="relative flex items-center justify-center"
                >
                  {/* Vertical Coral/Pink Separator matching screenshot */}
                  {index > 0 && (
                    <div
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[1.5px] bg-gradient-to-b from-[#FF7A18]/30 via-[#E61972]/55 to-[#E61972]/30"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectMode(item.id)}
                    className={`group w-full flex flex-col items-center justify-center py-0.5 px-1 rounded-xl transition-transform active:scale-95 focus:outline-none ${
                      isSelected ? 'scale-[1.03]' : 'hover:scale-[1.02]'
                    }`}
                  >
                    <div
                      className={`relative w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-gradient-to-b from-[#FF851B] via-[#FF385C] to-[#E61575] flex items-center justify-center shadow-md transition-all ${
                        isSelected
                          ? 'ring-3 ring-[#E61575]/35 shadow-pink-500/30'
                          : 'group-hover:shadow-lg'
                      }`}
                    >
                      {item.renderIcon('w-6 h-6 sm:w-7 sm:h-7')}
                      {item.badge !== undefined && Number(item.badge) > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0F172A] text-white text-[10px] font-bold font-mono flex items-center justify-center border border-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div
                      className={`mt-1 text-center leading-[1.15] tracking-tight ${
                        isSelected
                          ? 'font-bold text-[#E61575]'
                          : 'font-semibold text-[#111827]'
                      } text-[10px] sm:text-xs md:text-[13px]`}
                    >
                      <span className="block">{item.line1}</span>
                      <span className="block">{item.line2}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <div className="bg-white border border-pink-100 rounded-2xl px-4 py-6 sm:px-8 sm:py-8 shadow-[0_12px_40px_rgba(230,21,117,0.06)] font-sans">
      <h2 className="font-sans text-center text-xl sm:text-2xl md:text-[28px] font-medium tracking-tight text-[#111827] mb-6 sm:mb-8">
        AI-Powered Live Event Photo Matching
      </h2>

      <div className="grid grid-cols-4 items-start max-w-4xl mx-auto">
        {items.map((item, index) => {
          const isSelected = activeMode === item.id;
          return (
            <div
              key={item.id}
              className="relative flex flex-col items-center justify-start px-1 sm:px-4"
            >
              {/* Exact Vertical Pink/Coral Line Divider between the 4 circles */}
              {index > 0 && (
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-[1.5px] bg-[#D96B8A]/60"
                />
              )}

              <button
                type="button"
                onClick={() => onSelectMode(item.id)}
                className="group flex flex-col items-center text-center focus:outline-none"
              >
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-b from-[#FF851B] via-[#FF385C] to-[#E61575] flex items-center justify-center shadow-md transition-all duration-200 ${
                    isSelected
                      ? 'ring-4 ring-[#E61575]/30 scale-105 shadow-xl'
                      : 'group-hover:scale-105 group-hover:shadow-lg'
                  }`}
                >
                  {item.renderIcon('w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12')}
                </div>

                <div
                  className={`mt-3 sm:mt-4 text-xs sm:text-base md:text-[19px] leading-[1.22] tracking-tight transition-colors ${
                    isSelected
                      ? 'font-bold text-[#E61575]'
                      : 'font-medium text-[#111827] group-hover:text-[#E61575]'
                  }`}
                >
                  <span className="block">{item.line1}</span>
                  <span className="block">{item.line2}</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
