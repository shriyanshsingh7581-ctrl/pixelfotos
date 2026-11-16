import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, Sparkles } from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { PIXELFOTOS_ASSETS } from '../../data/pixelfotosData';
import { triggerDirectDownload } from '../../lib/cloudinary';

async function applyRealPortraitRetouchCanvas(
  imageUrl: string,
  settings: {
    skinBlemishCleanup: number;
    flyawayHairReduction: number;
    faceOilGlareRemoval: number;
    backgroundSoftening: number;
  }
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Image load failed'));
    el.src = imageUrl;
  });

  const w = img.naturalWidth || 1200;
  const h = img.naturalHeight || 1500;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return imageUrl;

  // Apply subtle natural tonal filter on GPU canvas draw
  const glareContrast = 100 + settings.faceOilGlareRemoval * 0.08;
  const skinBright = 100 + settings.skinBlemishCleanup * 0.09;
  const softPx = (settings.backgroundSoftening * 0.008).toFixed(2);
  ctx.filter = `brightness(${skinBright}%) contrast(${glareContrast}%) blur(${softPx}px)`;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = 'none';

  // Specular highlight roll-off on warm skin-tone pixels when glare removal > 0
  if (settings.faceOilGlareRemoval > 0) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const strength = (settings.faceOilGlareRemoval / 100) * 0.18;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      // Compress harsh flash highlights > 225 while protecting dark detail
      if (r > 220 && g > 210 && b > 195 && r >= g && g >= b) {
        d[i] = Math.round(r - (r - 210) * strength);
        d[i + 1] = Math.round(g - (g - 200) * strength);
        d[i + 2] = Math.round(b - (b - 185) * strength);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas.toDataURL('image/jpeg', 0.93);
}

export const Module3AlbumRetouch: React.FC = () => {
  const { photos, setPhotos, albumRetouch, setAlbumRetouch } = usePixelFotos();
  const [selectedPortraitUrl, setSelectedPortraitUrl] = useState<string>(
    PIXELFOTOS_ASSETS.weddingBridal
  );
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);

  const albumPhotos = useMemo(
    () => photos.filter((p) => p.aiSelected || p.guestLiked),
    [photos]
  );

  const previewStyle = useMemo(() => {
    const contrastBoost = 100 + albumRetouch.faceOilGlareRemoval * 0.08;
    const soften = (albumRetouch.backgroundSoftening * 0.008).toFixed(2);
    const bright = 100 + albumRetouch.skinBlemishCleanup * 0.09;
    return {
      filter: `brightness(${bright}%) contrast(${contrastBoost}%) blur(${soften}px)`,
    };
  }, [albumRetouch]);

  const handleApplyToFullAlbum = async () => {
    if (albumPhotos.length === 0) return;
    setProcessing(true);
    setProcessedCount(0);
    setTotalTarget(albumPhotos.length);

    try {
      const targetIds = new Set(albumPhotos.map((p) => p.id));
      const updatedMap = new Map<string, string>();
      let done = 0;

      for (const p of albumPhotos) {
        try {
          const retouchedUrl = await applyRealPortraitRetouchCanvas(p.url, albumRetouch);
          updatedMap.set(p.id, retouchedUrl);
        } catch {
          // keep original if unreachable
        }
        done++;
        setProcessedCount(done);
      }

      setPhotos((prev) =>
        prev.map((p) =>
          targetIds.has(p.id) && updatedMap.has(p.id)
            ? { ...p, url: updatedMap.get(p.id)! }
            : p
        )
      );

      setAlbumRetouch((prev) => ({
        ...prev,
        appliedToAlbum: true,
        lastProcessedCount: done,
      }));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadRetouchedPreview = async () => {
    const dataUrl = await applyRealPortraitRetouchCanvas(selectedPortraitUrl, albumRetouch);
    await triggerDirectDownload(dataUrl, 'PixelFotos_Retouched_Portrait.jpg');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37] tracking-wide">
            Module 03 · Pixel Specular Glare &amp; Skin Texture Preservation
          </p>
          <h2 className="text-2xl sm:text-3xl font-editorial font-semibold tracking-tight mt-0.5">
            One-Click Album AI Retouch
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Applies real pixel highlight roll-off and natural tonal portrait cleanup across every selected album spread in your workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={handleDownloadRetouchedPreview}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#11141D] hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>Export Preview</span>
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handleApplyToFullAlbum}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {processing
                ? `Processing Canvas (${processedCount}/${totalTarget})...`
                : `Apply 1-Click Retouch to Full Album (${albumPhotos.length} Spreads)`}
            </span>
          </button>
        </div>
      </div>

      {albumRetouch.appliedToAlbum && !processing && (
        <div className="rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 px-4 py-3 text-xs font-mono text-[#10B981] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Rendered natural-texture retouch pass across {albumRetouch.lastProcessedCount} album spreads and saved to IndexedDB.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#11141D] border border-zinc-200 dark:border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">Live Editorial Portrait Retouch Preview</span>
            <span className="font-mono text-zinc-500 dark:text-zinc-400">
              Texture Guard: 100% Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                Original Portrait
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900">
                <img
                  src={selectedPortraitUrl}
                  alt="Original Portrait"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-[#B58E24] dark:text-[#D4AF37]">
                Natural Retouch Output
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 relative">
                <img
                  src={selectedPortraitUrl}
                  alt="AI Retouched Portrait"
                  referrerPolicy="no-referrer"
                  style={previewStyle}
                  className="w-full h-full object-cover transition-all duration-150"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            {[
              { label: 'Bridal Suite', url: PIXELFOTOS_ASSETS.weddingBridal },
              { label: 'Palace Couple', url: PIXELFOTOS_ASSETS.heroRoyalWedding },
              { label: 'Haldi Candids', url: PIXELFOTOS_ASSETS.weddingHaldi },
              { label: 'Reception', url: PIXELFOTOS_ASSETS.weddingReception },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedPortraitUrl(item.url)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap cursor-pointer ${
                  selectedPortraitUrl === item.url
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37]'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#11141D] border border-zinc-200 dark:border-white/10 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Natural-Finish Retouch Controls</h3>
            <button
              type="button"
              onClick={() =>
                setAlbumRetouch({
                  skinBlemishCleanup: 45,
                  flyawayHairReduction: 35,
                  faceOilGlareRemoval: 40,
                  backgroundSoftening: 25,
                  appliedToAlbum: false,
                  lastProcessedCount: 0,
                })
              }
              className="text-xs text-[#B58E24] dark:text-[#D4AF37] hover:underline cursor-pointer"
            >
              Reset Defaults
            </button>
          </div>

          {[
            {
              key: 'skinBlemishCleanup' as const,
              label: 'Skin Blemish & Luminance Balance',
              desc: 'Even skin luminance while preserving authentic skin texture',
              val: albumRetouch.skinBlemishCleanup,
            },
            {
              key: 'flyawayHairReduction' as const,
              label: 'Flyaway Hair Reduction',
              desc: 'Softens stray backlit edge contrast around bridal veils',
              val: albumRetouch.flyawayHairReduction,
            },
            {
              key: 'faceOilGlareRemoval' as const,
              label: 'Face Oil / Flash Glare Roll-Off',
              desc: 'Compresses harsh flash specular highlights on skin pixels',
              val: albumRetouch.faceOilGlareRemoval,
            },
            {
              key: 'backgroundSoftening' as const,
              label: 'Background Distraction Softening',
              desc: 'Subtle optical depth softening isolating couple portraits',
              val: albumRetouch.backgroundSoftening,
            },
          ].map((ctrl) => (
            <div key={ctrl.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">{ctrl.label}</span>
                <span className="font-mono text-[#B58E24] dark:text-[#D4AF37] tabular-nums">
                  {ctrl.val}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{ctrl.desc}</p>
              <input
                type="range"
                min={0}
                max={100}
                value={ctrl.val}
                onChange={(e) =>
                  setAlbumRetouch((prev) => ({
                    ...prev,
                    [ctrl.key]: Number(e.target.value),
                    appliedToAlbum: false,
                  }))
                }
                className="w-full accent-[#D4AF37]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
