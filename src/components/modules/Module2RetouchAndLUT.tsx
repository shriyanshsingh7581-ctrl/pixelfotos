import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  ImagePlus,
  MoveHorizontal,
  Sliders,
  Upload,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import {
  exportBatchGradedZip,
  exportGradedImageDownload,
  parseCubeLutFile,
  renderGradedCanvas,
} from '../../lib/lutEngine';
import { MediaFrame } from '../shared/MediaFrame';

export const Module2RetouchAndLUT: React.FC = () => {
  const {
    photos,
    luts,
    activeLutId,
    setActiveLutId,
    addCustomLut,
    batchExposureMatch,
    setBatchExposureMatch,
    watermark,
    setWatermark,
  } = usePixelFotos();

  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(photos[0]?.id || '');
  const [splitPercent, setSplitPercent] = useState<number>(52);
  const [lutNotice, setLutNotice] = useState<string | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);
  const [batchZipping, setBatchZipping] = useState<boolean>(false);

  const lutInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const sliderBoxRef = useRef<HTMLDivElement | null>(null);
  const gradedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activePhoto = useMemo(
    () => photos.find((p) => p.id === selectedPhotoId) || photos[0],
    [photos, selectedPhotoId]
  );

  const activeLut = useMemo(
    () => luts.find((l) => l.id === activeLutId) || luts[0],
    [luts, activeLutId]
  );

  // Real pixel-level Canvas rendering whenever photo, LUT, exposure match, or watermark changes
  useEffect(() => {
    if (!activePhoto || !gradedCanvasRef.current) return;
    let cancelled = false;
    setRendering(true);

    renderGradedCanvas({
      imageUrl: activePhoto.url,
      lut: activeLut,
      batchExposureMatch,
      watermark,
      maxWidth: 1100,
      targetCanvas: gradedCanvasRef.current,
    })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activePhoto, activeLut, batchExposureMatch, watermark]);

  const handleCubeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsedLut = parseCubeLutFile(text, file.name);
    addCustomLut(parsedLut);
    const tripletCount = parsedLut.cubeTable ? Math.round(parsedLut.cubeTable.length / 3) : 0;
    setLutNotice(
      `Parsed ${file.name}: ${parsedLut.lutSize}³ 3D LUT (${tripletCount.toLocaleString()} RGB nodes) loaded into Canvas pixel engine.`
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setWatermark((prev) => ({
        ...prev,
        enabled: true,
        mode: 'logo',
        logoDataUrl: String(reader.result),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSplitDrag = (clientX: number) => {
    const rect = sliderBoxRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.max(8, Math.min(92, Math.round(pct))));
  };

  const handleDownloadSingle = async () => {
    if (!activePhoto) return;
    setRendering(true);
    try {
      await exportGradedImageDownload({
        imageUrl: activePhoto.url,
        fileName: activePhoto.fileName,
        lut: activeLut,
        batchExposureMatch,
        watermark,
      });
      setLutNotice(`Exported high-resolution graded & watermarked ${activePhoto.fileName}.`);
    } finally {
      setRendering(false);
    }
  };

  const handleBatchZipExport = async () => {
    const targets = photos.filter((p) => p.aiSelected);
    if (targets.length === 0) return;
    setBatchZipping(true);
    try {
      const count = await exportBatchGradedZip({
        photos: targets,
        lut: activeLut,
        batchExposureMatch,
        watermark,
      });
      setLutNotice(
        `Rendered "${activeLut.name}" + watermark onto ${count} selected photos and downloaded ZIP.`
      );
    } finally {
      setBatchZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
            Module 02 · Real 3D .CUBE Pixel LUT &amp; Watermark Engine
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-0.5">
            Color Grading, .CUBE LUT &amp; Watermark Studio
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Parses real .cube 3D LUT tables via trilinear HTML5 Canvas interpolation, renders logo PNG or text watermarks at pixel level, and exports high-res graded images.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => lutInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold liquid-glass-subtle hover:border-[#D4AF37] transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Upload .cube LUT</span>
          </button>
          <button
            type="button"
            disabled={rendering}
            onClick={handleDownloadSingle}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Graded</span>
          </button>
          <button
            type="button"
            disabled={batchZipping}
            onClick={handleBatchZipExport}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{batchZipping ? 'Rendering ZIP...' : 'Batch Grade & ZIP'}</span>
          </button>
          <input
            ref={lutInputRef}
            type="file"
            accept=".cube,.3dl"
            onChange={handleCubeUpload}
            className="hidden"
          />
        </div>
      </div>

      {lutNotice && (
        <div className="text-xs font-mono text-[#10B981] bg-[#10B981]/12 border border-[#10B981]/30 rounded-[18px] px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{lutNotice}</span>
        </div>
      )}

      {/* Adaptive Split Workbench (Side-by-Side on iPad Landscape & Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Canvas Split View */}
        <div className="md:col-span-7 space-y-4">
          <div className="liquid-glass rounded-[24px] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                Canvas Split View · {activePhoto?.fileName}
              </span>
              <span className="font-mono text-[#B58E24] dark:text-[#D4AF37] shrink-0">
                {rendering ? 'Rendering Pixels...' : `${activeLut.name} (${splitPercent}%)`}
              </span>
            </div>

            <div
              ref={sliderBoxRef}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleSplitDrag(e.clientX);
              }}
              onClick={(e) => handleSplitDrag(e.clientX)}
              className="relative aspect-[16/10] rounded-[18px] overflow-hidden select-none cursor-ew-resize bg-black border border-white/10"
            >
              <canvas
                ref={gradedCanvasRef}
                className="w-full h-full object-cover block"
              />

              {activePhoto && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                >
                  <img
                    src={activePhoto.url}
                    alt={`${activePhoto.fileName} Original`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className="absolute inset-y-0 w-0.5 bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.85)] pointer-events-none"
                style={{ left: `${splitPercent}%` }}
              >
                <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#D4AF37] text-[#090B10] flex items-center justify-center shadow-lg">
                  <MoveHorizontal className="w-4 h-4" />
                </div>
              </div>

              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono pointer-events-none">
                BEFORE
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#D4AF37] text-[11px] font-mono pointer-events-none">
                AFTER CANVAS
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Split</span>
              <input
                type="range"
                min={8}
                max={92}
                value={splitPercent}
                onChange={(e) => setSplitPercent(Number(e.target.value))}
                className="flex-1 accent-[#D4AF37]"
                aria-label="Before and after split slider"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {photos.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPhotoId(p.id)}
                  className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    p.id === activePhoto?.id
                      ? 'border-[#D4AF37]'
                      : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                >
                  <MediaFrame src={p.url} alt={p.fileName} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="md:col-span-5 space-y-5">
          <div className="liquid-glass rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D4AF37]" />
                <span>Color Matrices &amp; .CUBE LUTs</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {luts.length} Profiles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {luts.map((lut) => {
                const isSelected = lut.id === activeLut.id;
                return (
                  <button
                    key={lut.id}
                    type="button"
                    onClick={() => setActiveLutId(lut.id)}
                    className={`min-h-[54px] p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15'
                        : 'border-black/8 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{lut.name}</div>
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {lut.source === 'custom_cube'
                        ? `3D Trilinear ${lut.lutSize || 33}³ .cube`
                        : 'Pixel Color Matrix'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-black/8 dark:border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold">Auto Exposure &amp; Gray-World WB</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Balances RGB histogram exposure &amp; skin balance
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchExposureMatch(!batchExposureMatch)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  batchExposureMatch
                    ? 'bg-[#10B981] text-[#090B10]'
                    : 'liquid-glass-subtle text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {batchExposureMatch ? 'Matched' : 'Enable'}
              </button>
            </div>
          </div>

          <div className="liquid-glass rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Canvas Watermark Compositor</h3>
              <button
                type="button"
                onClick={() => setWatermark((w) => ({ ...w, enabled: !w.enabled }))}
                className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  watermark.enabled
                    ? 'bg-[#D4AF37] text-[#090B10]'
                    : 'liquid-glass-subtle text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {watermark.enabled ? 'Watermark ON' : 'Watermark OFF'}
              </button>
            </div>

            <div className="flex gap-1.5 p-1 rounded-[16px] liquid-glass-subtle">
              <button
                type="button"
                onClick={() => setWatermark((w) => ({ ...w, mode: 'text' }))}
                className={`flex-1 min-h-[40px] py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  watermark.mode === 'text'
                    ? 'bg-white dark:bg-[#23252E] shadow-xs text-zinc-900 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                Custom Text
              </button>
              <button
                type="button"
                onClick={() => setWatermark((w) => ({ ...w, mode: 'logo' }))}
                className={`flex-1 min-h-[40px] py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  watermark.mode === 'logo'
                    ? 'bg-white dark:bg-[#23252E] shadow-xs text-zinc-900 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                Studio Logo PNG
              </button>
            </div>

            {watermark.mode === 'text' ? (
              <input
                type="text"
                value={watermark.text}
                onChange={(e) => setWatermark((w) => ({ ...w, text: e.target.value }))}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl liquid-input text-xs"
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold liquid-glass-subtle inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Upload Logo PNG</span>
                </button>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {watermark.logoDataUrl ? 'Custom PNG loaded' : 'Upload transparent PNG'}
                </span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                  <span>Opacity</span>
                  <span className="font-mono tabular-nums">{watermark.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={100}
                  value={watermark.opacity}
                  onChange={(e) =>
                    setWatermark((w) => ({ ...w, opacity: Number(e.target.value) }))
                  }
                  className="w-full accent-[#D4AF37]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                  <span>Scale</span>
                  <span className="font-mono tabular-nums">{watermark.scale}%</span>
                </div>
                <input
                  type="range"
                  min={65}
                  max={140}
                  value={watermark.scale}
                  onChange={(e) =>
                    setWatermark((w) => ({ ...w, scale: Number(e.target.value) }))
                  }
                  className="w-full accent-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'top-left', label: 'Top Left' },
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'center', label: 'Center' },
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'bottom-right', label: 'Bottom Right' },
                ] as const
              ).map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setWatermark((w) => ({ ...w, position: pos.id }))}
                  className={`min-h-[40px] py-1.5 px-2 rounded-xl text-[11px] font-medium border cursor-pointer ${
                    watermark.position === pos.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37]'
                      : 'border-black/8 dark:border-white/10 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
