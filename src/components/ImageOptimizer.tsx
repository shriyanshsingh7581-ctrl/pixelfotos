import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { getOptimizedPhotoUrl, getWatermarkSettings } from '../lib/cloudinary';
import { WatermarkGridPosition, WatermarkSettings } from '../types';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  watermarkText?: string;
  className?: string;
}

const POSITION_CLASSES: Record<WatermarkGridPosition, string> = {
  'top-left': 'top-3 left-3',
  'top-center': 'top-3 left-1/2 -translate-x-1/2',
  'top-right': 'top-3 right-3',
  'center-left': 'top-1/2 left-3 -translate-y-1/2',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'center-right': 'top-1/2 right-3 -translate-y-1/2',
  'bottom-left': 'bottom-3 left-3',
  'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-3 right-3',
};

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width = 900,
  height,
  watermarkText,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [wmSettings, setWmSettings] = useState<WatermarkSettings>(() =>
    getWatermarkSettings(watermarkText)
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<WatermarkSettings>;
      if (custom.detail) {
        setWmSettings(custom.detail);
      } else {
        setWmSettings(getWatermarkSettings(watermarkText));
      }
    };
    window.addEventListener('pixelfotos-watermark-updated', handler);
    return () => window.removeEventListener('pixelfotos-watermark-updated', handler);
  }, [watermarkText]);

  const optimizedUrl = getOptimizedPhotoUrl(src, { width, height, watermarkText });

  if (hasError || !optimizedUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0F17] via-[#131B2E] to-[#1E1B18] text-amber-200/80 p-6 text-center ${className}`}
      >
        <Camera className="w-7 h-7 text-amber-400 mb-2 opacity-80" />
        <span className="text-xs font-medium tracking-wide">{alt}</span>
      </div>
    );
  }

  const posClass = POSITION_CLASSES[wmSettings.position9Grid || 'bottom-right'];

  return (
    <div className={`relative overflow-hidden bg-[#0B0F17] ${className}`}>
      <img
        src={optimizedUrl}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300"
      />
      {watermarkText && wmSettings.enabled && (
        <div
          className={`pointer-events-none select-none absolute ${posClass} z-10`}
          style={{
            opacity: (wmSettings.opacity ?? 78) / 100,
            transform: `${
              posClass.includes('-translate') ? '' : ''
            } rotate(${wmSettings.rotation || 0}deg) scale(${(wmSettings.scale || 100) / 100})`,
          }}
        >
          {wmSettings.mode === 'logo' && wmSettings.logoUrl ? (
            <img
              src={wmSettings.logoUrl}
              alt="Studio Watermark Logo"
              className="max-h-10 max-w-[130px] object-contain drop-shadow-md"
            />
          ) : (
            <div
              className="px-2.5 py-1 bg-[#0B0F17]/65 backdrop-blur-xs border border-amber-400/25 text-amber-100 rounded tracking-wider shadow-sm"
              style={{
                fontFamily: wmSettings.fontFamily || 'inherit',
                fontSize: `${Math.max(10, Math.min(20, Math.round((wmSettings.fontSize || 18) * 0.65)))}px`,
              }}
            >
              {wmSettings.text || watermarkText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
