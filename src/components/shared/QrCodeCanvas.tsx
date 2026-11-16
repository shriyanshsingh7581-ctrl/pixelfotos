import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeCanvasProps {
  value: string;
  size?: number;
  darkColor?: string;
  lightColor?: string;
  alt?: string;
  className?: string;
  onDataUrlReady?: (url: string) => void;
}

export const QrCodeCanvas: React.FC<QrCodeCanvasProps> = ({
  value,
  size = 180,
  darkColor = '#090B10',
  lightColor = '#FFFFFF',
  alt = 'QR Code',
  className = '',
  onDataUrlReady,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value || 'https://pixelfotos.online', {
      width: size,
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => {
        if (active) {
          setDataUrl(url);
          onDataUrlReady?.(url);
        }
      })
      .catch(() => {
        // ignore QR failure
      });
    return () => {
      active = false;
    };
  }, [value, size, darkColor, lightColor, onDataUrlReady]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse ${className}`}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-xl bg-white p-2 border border-zinc-200 dark:border-white/10 ${className}`}
    />
  );
};
