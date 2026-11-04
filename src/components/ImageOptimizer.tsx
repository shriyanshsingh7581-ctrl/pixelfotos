import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { getOptimizedPhotoUrl } from '../lib/cloudinary';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  watermarkText?: string;
  className?: string;
}

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width = 900,
  height,
  watermarkText,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const optimizedUrl = getOptimizedPhotoUrl(src, { width, height, watermarkText });

  if (hasError || !optimizedUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-slate-200 p-6 text-center ${className}`}
      >
        <Camera className="w-7 h-7 text-teal-400 mb-2 opacity-80" />
        <span className="text-xs font-medium tracking-wide">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      <img
        src={optimizedUrl}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300"
      />
      {watermarkText && (
        <div className="pointer-events-none select-none absolute bottom-3 right-3 px-2.5 py-1 bg-slate-950/55 backdrop-blur-xs text-[11px] font-medium text-white/85 rounded">
          {watermarkText}
        </div>
      )}
    </div>
  );
};
