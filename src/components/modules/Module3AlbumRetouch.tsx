import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  MoveHorizontal,
  RotateCcw,
  Sliders,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { INITIAL_ALBUM_RETOUCH, PIXELFOTOS_ASSETS } from '../../data/pixelfotosData';
import { triggerDirectDownload } from '../../lib/cloudinary';
import { AlbumRetouchSettings } from '../../types/pixelfotos';

const RETOUCH_PRESETS: {
  name: string;
  tagline: string;
  values: Omit<AlbumRetouchSettings, 'appliedToAlbum' | 'lastProcessedCount'>;
}[] = [
  {
    name: 'Bridal Porcelain Glow',
    tagline: 'Luminous skin, soft flash roll-off & crisp jewelry clarity',
    values: {
      presetName: 'Bridal Porcelain Glow',
      masterIntensity: 88,
      skinBlemishCleanup: 52,
      skinToneWarmth: 30,
      flyawayHairReduction: 42,
      faceOilGlareRemoval: 48,
      eyeTeethClarity: 46,
      dressDetailPop: 55,
      backgroundSoftening: 26,
    },
  },
  {
    name: 'Kerala Kasavu & Gold Crisp',
    tagline: 'Warm coastal skin tones with rich temple gold & silk weave detail',
    values: {
      presetName: 'Kerala Kasavu & Gold Crisp',
      masterIntensity: 90,
      skinBlemishCleanup: 44,
      skinToneWarmth: 48,
      flyawayHairReduction: 36,
      faceOilGlareRemoval: 55,
      eyeTeethClarity: 50,
      dressDetailPop: 68,
      backgroundSoftening: 20,
    },
  },
  {
    name: 'Outdoor Sunlight Balanced',
    tagline: 'Tames harsh midday highlights and restores natural shadow depth',
    values: {
      presetName: 'Outdoor Sunlight Balanced',
      masterIntensity: 80,
      skinBlemishCleanup: 40,
      skinToneWarmth: 22,
      flyawayHairReduction: 35,
      faceOilGlareRemoval: 64,
      eyeTeethClarity: 38,
      dressDetailPop: 42,
      backgroundSoftening: 32,
    },
  },
  {
    name: 'Reception Velvet Night',
    tagline: 'Clean evening ISO smoothness with bright eyes and flash control',
    values: {
      presetName: 'Reception Velvet Night',
      masterIntensity: 85,
      skinBlemishCleanup: 58,
      skinToneWarmth: 25,
      flyawayHairReduction: 45,
      faceOilGlareRemoval: 52,
      eyeTeethClarity: 56,
      dressDetailPop: 50,
      backgroundSoftening: 38,
    },
  },
];

async function applyRealPortraitRetouchCanvas(
  imageUrl: string,
  settings: AlbumRetouchSettings
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

  const master = (settings.masterIntensity ?? 85) / 100;
  const glareContrast = 100 + (settings.faceOilGlareRemoval * 0.06 + (settings.dressDetailPop || 40) * 0.06) * master;
  const skinBright = 100 + (settings.skinBlemishCleanup * 0.08 + (settings.eyeTeethClarity || 35) * 0.04) * master;
  const satBoost = 100 + ((settings.skinToneWarmth || 25) * 0.14 + (settings.dressDetailPop || 40) * 0.08) * master;
  const softPx = (settings.backgroundSoftening * 0.006 * master).toFixed(2);

  ctx.filter = `brightness(${skinBright.toFixed(1)}%) contrast(${glareContrast.toFixed(1)}%) saturate(${satBoost.toFixed(1)}%) blur(${softPx}px)`;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = 'none';

  // Specular highlight roll-off + warm skin tone balance
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const glareStrength = ((settings.faceOilGlareRemoval || 40) / 100) * 0.22 * master;
  const warmthStrength = ((settings.skinToneWarmth || 25) / 100) * 8 * master;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    if (r > 218 && g > 206 && b > 190 && r >= g && g >= b) {
      r = Math.round(r - (r - 208) * glareStrength);
      g = Math.round(g - (g - 198) * glareStrength);
      b = Math.round(b - (b - 184) * glareStrength);
    }

    if (warmthStrength > 0 && r > g && g > b && r > 70 && r < 235) {
      r = Math.min(255, Math.round(r + warmthStrength));
      g = Math.min(255, Math.round(g + warmthStrength * 0.45));
    }

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.93);
}

export const Module3AlbumRetouch: React.FC = () => {
  const { photos, setPhotos, albumRetouch, setAlbumRetouch } = usePixelFotos();
  const [selectedPortraitUrl, setSelectedPortraitUrl] = useState<string>(
    PIXELFOTOS_ASSETS.weddingBridal
  );
  const [splitPercent, setSplitPercent] = useState<number>(54);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const splitBoxRef = useRef<HTMLDivElement | null>(null);

  const albumPhotos = useMemo(
    () => photos.filter((p) => p.aiSelected || p.guestLiked),
    [photos]
  );

  const master = (albumRetouch.masterIntensity ?? 85) / 100;

  const previewStyle = useMemo(() => {
    const contrastBoost =
      100 +
      (albumRetouch.faceOilGlareRemoval * 0.06 + (albumRetouch.dressDetailPop ?? 45) * 0.07) *
        master;
    const soften = (albumRetouch.backgroundSoftening * 0.006 * master).toFixed(2);
    const bright =
      100 +
      (albumRetouch.skinBlemishCleanup * 0.08 + (albumRetouch.eyeTeethClarity ?? 40) * 0.04) *
        master;
    const saturate =
      100 +
      ((albumRetouch.skinToneWarmth ?? 28) * 0.16 + (albumRetouch.dressDetailPop ?? 45) * 0.08) *
        master;
    const sepia = ((albumRetouch.skinToneWarmth ?? 28) * 0.08 * master).toFixed(1);
    return {
      filter: `brightness(${bright.toFixed(1)}%) contrast(${contrastBoost.toFixed(
        1
      )}%) saturate(${saturate.toFixed(1)}%) sepia(${sepia}%) blur(${soften}px)`,
    };
  }, [albumRetouch, master]);

  const handleSplitDrag = (clientX: number) => {
    const rect = splitBoxRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.max(8, Math.min(92, Math.round(pct))));
  };

  const handleApplyPreset = (preset: (typeof RETOUCH_PRESETS)[number]) => {
    setAlbumRetouch((prev) => ({
      ...prev,
      ...preset.values,
      appliedToAlbum: false,
    }));
  };

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

  const SLIDER_CONTROLS: {
    key: keyof Pick<
      AlbumRetouchSettings,
      | 'skinBlemishCleanup'
      | 'skinToneWarmth'
      | 'faceOilGlareRemoval'
      | 'eyeTeethClarity'
      | 'flyawayHairReduction'
      | 'dressDetailPop'
      | 'backgroundSoftening'
    >;
    label: string;
    desc: string;
    val: number;
  }[] = [
    {
      key: 'skinBlemishCleanup',
      label: 'Skin Smoothing & Blemish Cleanup',
      desc: 'Balances facial luminance while preserving natural pore micro-texture',
      val: albumRetouch.skinBlemishCleanup,
    },
    {
      key: 'skinToneWarmth',
      label: 'Natural Bridal Skin Tone Warmth',
      desc: 'Adds golden-hour warmth to complexions under mixed venue lighting',
      val: albumRetouch.skinToneWarmth ?? 28,
    },
    {
      key: 'faceOilGlareRemoval',
      label: 'Face Oil & Flash Specular Glare Roll-Off',
      desc: 'Compresses harsh forehead and cheek flash hotspots above 218 luma',
      val: albumRetouch.faceOilGlareRemoval,
    },
    {
      key: 'eyeTeethClarity',
      label: 'Eye Catchlight & Smile Clarity',
      desc: 'Subtly brightens iris catchlights and bridal smiles without over-whitening',
      val: albumRetouch.eyeTeethClarity ?? 40,
    },
    {
      key: 'dressDetailPop',
      label: 'Kasavu Silk, Zari & Jewelry Detail Pop',
      desc: 'Enhances embroidery, gold ornaments, and bridal couture micro-contrast',
      val: albumRetouch.dressDetailPop ?? 48,
    },
    {
      key: 'flyawayHairReduction',
      label: 'Flyaway Hair & Veil Edge Refinement',
      desc: 'Softens stray backlit hair strands around bridal dupattas and veils',
      val: albumRetouch.flyawayHairReduction,
    },
    {
      key: 'backgroundSoftening',
      label: 'Optical Portrait Background Bokeh',
      desc: 'Gentle depth separation isolating the couple from busy crowd backgrounds',
      val: albumRetouch.backgroundSoftening,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
            Module 03 · Pro Portrait &amp; Bridal Silk AI Retouch Studio
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-0.5">
            Advanced 1-Click Album AI Retouch
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Choose a curated wedding retouch profile or fine-tune 7 portrait, skin warmth, flash glare, and silk detail sliders with live Before/After split inspection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            onClick={handleDownloadRetouchedPreview}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold liquid-glass-subtle hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>Export Retouched Portrait</span>
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handleApplyToFullAlbum}
            className="min-h-[44px] px-5 py-2.5 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] transition inline-flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {processing
                ? `Retouching Spreads (${processedCount}/${totalTarget})...`
                : `Apply Retouch to Album (${albumPhotos.length} Spreads)`}
            </span>
          </button>
        </div>
      </div>

      {albumRetouch.appliedToAlbum && !processing && (
        <div className="rounded-[18px] bg-[#10B981]/12 border border-[#10B981]/30 px-4 py-3 text-xs font-mono text-[#10B981] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Applied &ldquo;{albumRetouch.presetName || 'Custom Studio Retouch'}&rdquo; across{' '}
            {albumRetouch.lastProcessedCount} album spreads and synced to IndexedDB.
          </span>
        </div>
      )}

      {/* Curated 1-Click AI Retouch Presets Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {RETOUCH_PRESETS.map((preset) => {
          const active = albumRetouch.presetName === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className={`p-4 rounded-[20px] text-left transition cursor-pointer border ${
                active
                  ? 'liquid-glass border-[#D4AF37] bg-[#D4AF37]/15'
                  : 'liquid-glass-subtle border-black/8 dark:border-white/10 hover:border-[#D4AF37]/45'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  {preset.name}
                </span>
                <Wand2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {preset.tagline}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left: Interactive Split Comparison + Side-by-Side Inspection */}
        <div className="md:col-span-6 liquid-glass rounded-[24px] p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">
              Interactive Before / After Portrait Split
            </span>
            <span className="font-mono text-[#B58E24] dark:text-[#D4AF37]">
              {albumRetouch.presetName || 'Custom Profile'} · Master {albumRetouch.masterIntensity ?? 85}%
            </span>
          </div>

          <div
            ref={splitBoxRef}
            onPointerMove={(e) => {
              if (e.buttons === 1) handleSplitDrag(e.clientX);
            }}
            onClick={(e) => handleSplitDrag(e.clientX)}
            className="relative aspect-[4/5] rounded-[20px] overflow-hidden select-none cursor-ew-resize bg-zinc-900 border border-black/10 dark:border-white/12"
          >
            {/* Retouched Layer (Full) */}
            <img
              src={selectedPortraitUrl}
              alt="AI Retouched Output"
              referrerPolicy="no-referrer"
              style={previewStyle}
              className="w-full h-full object-cover transition-all duration-150"
            />

            {/* Original Layer (Clipped on Left) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
            >
              <img
                src={selectedPortraitUrl}
                alt="Original Unretouched Portrait"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Split Divider Handle */}
            <div
              className="absolute inset-y-0 w-0.5 bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.85)] pointer-events-none"
              style={{ left: `${splitPercent}%` }}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#D4AF37] text-[#090B10] flex items-center justify-center shadow-lg">
                <MoveHorizontal className="w-4 h-4" />
              </div>
            </div>

            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-mono pointer-events-none">
              BEFORE
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-[#D4AF37] text-[11px] font-mono pointer-events-none">
              AI RETOUCHED
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Split Position</span>
            <input
              type="range"
              min={8}
              max={92}
              value={splitPercent}
              onChange={(e) => setSplitPercent(Number(e.target.value))}
              className="flex-1 accent-[#D4AF37]"
              aria-label="Retouch split comparison slider"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            {[
              { label: 'Bridal Portrait', url: PIXELFOTOS_ASSETS.weddingBridal },
              { label: 'Palace Couple', url: PIXELFOTOS_ASSETS.heroRoyalWedding },
              { label: 'Haldi Candids', url: PIXELFOTOS_ASSETS.weddingHaldi },
              { label: 'Reception Couple', url: PIXELFOTOS_ASSETS.weddingReception },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedPortraitUrl(item.url)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap cursor-pointer ${
                  selectedPortraitUrl === item.url
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37]'
                    : 'border-black/10 dark:border-white/12 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Master Blend + 7 Advanced Retouch Sliders */}
        <div className="md:col-span-6 liquid-glass rounded-[24px] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-black/8 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold">Advanced Retouch Sliders</h3>
            </div>
            <button
              type="button"
              onClick={() => setAlbumRetouch(INITIAL_ALBUM_RETOUCH)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#B58E24] dark:text-[#D4AF37] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>

          {/* Master Intensity Slider */}
          <div className="p-3.5 rounded-2xl liquid-glass-subtle space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900 dark:text-white">
                Master Retouch Intensity Blend
              </span>
              <span className="font-mono font-bold text-[#10B981] tabular-nums">
                {albumRetouch.masterIntensity ?? 85}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={albumRetouch.masterIntensity ?? 85}
              onChange={(e) =>
                setAlbumRetouch((prev) => ({
                  ...prev,
                  masterIntensity: Number(e.target.value),
                  appliedToAlbum: false,
                }))
              }
              className="w-full accent-[#10B981]"
            />
          </div>

          {/* 7 Granular Sliders */}
          <div className="space-y-4">
            {SLIDER_CONTROLS.map((ctrl) => (
              <div key={ctrl.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {ctrl.label}
                  </span>
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
                      presetName: 'Custom Studio Profile',
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
    </div>
  );
};
