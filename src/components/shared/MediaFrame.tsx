import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { LutPreset, WatermarkConfig } from '../../types/pixelfotos';

interface MediaFrameProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  lut?: LutPreset;
  watermark?: WatermarkConfig;
  batchExposureMatch?: boolean;
}

export const MediaFrame: React.FC<MediaFrameProps> = ({
  src,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  lut,
  watermark,
  batchExposureMatch = false,
}) => {
  const [failed, setFailed] = useState(false);

  const filterStyle = lut
    ? `brightness(${batchExposureMatch ? Math.min(115, lut.brightness + 3) : lut.brightness}%) contrast(${
        lut.contrast
      }%) saturate(${lut.saturate}%) sepia(${lut.sepia}%) hue-rotate(${lut.hueRotate}deg)`
    : undefined;

  const wmPosClass =
    watermark?.position === 'top-left'
      ? 'top-3 left-3'
      : watermark?.position === 'top-right'
      ? 'top-3 right-3'
      : watermark?.position === 'bottom-left'
      ? 'bottom-3 left-3'
      : watermark?.position === 'center'
      ? 'inset-0 flex items-center justify-center'
      : 'bottom-3 right-3';

  return (
    <div
      className={`relative overflow-hidden bg-zinc-200 dark:bg-[#11141D] ${className}`}
    >
      {!failed && src ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          style={filterStyle ? { filter: filterStyle } : undefined}
          className={imgClassName}
        />
      ) : (
        <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-[#151823] dark:to-[#0D1017] p-4 text-center">
          <Camera className="w-6 h-6 text-[#D4AF37]" />
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-full">
            {alt}
          </span>
        </div>
      )}

      {lut?.warmthOverlay && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ backgroundColor: lut.warmthOverlay }}
        />
      )}

      {watermark?.enabled && (
        <div
          className={`pointer-events-none absolute ${wmPosClass} z-10`}
          style={{
            opacity: watermark.opacity / 100,
            transform: `scale(${watermark.scale / 100})`,
          }}
        >
          {watermark.mode === 'logo' && watermark.logoDataUrl ? (
            <img
              src={watermark.logoDataUrl}
              alt="Studio Watermark"
              className="max-h-10 w-auto object-contain drop-shadow"
            />
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-mono tracking-[0.2em] uppercase text-white/95 bg-black/45 backdrop-blur-xs rounded">
              {watermark.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
