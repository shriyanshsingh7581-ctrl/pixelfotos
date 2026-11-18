import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  ImagePlus,
  MoveHorizontal,
  Palmtree,
  Sliders,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import {
  exportBatchGradedZip,
  exportGradedImageDownload,
  parseCubeLutFile,
  renderGradedCanvas,
} from '../../lib/lutEngine';
import { LutCategory, WatermarkFont } from '../../types/pixelfotos';
import { MediaFrame } from '../shared/MediaFrame';

const WATERMARK_FONTS: { id: WatermarkFont; label: string; sample: string }[] = [
  { id: 'Cormorant Garamond', label: 'Editorial Serif', sample: 'Cormorant Garamond' },
  { id: 'Great Vibes', label: 'Wedding Script', sample: 'Great Vibes Calligraphy' },
  { id: 'Cinzel', label: 'Royal Crest Caps', sample: 'CINZEL ENGRAVED' },
  { id: 'Plus Jakarta Sans', label: 'Modern Studio', sample: 'Plus Jakarta Clean' },
  { id: 'JetBrains Mono', label: 'Archival Proof', sample: 'JETBRAINS BADGE' },
];

const SCALE_PRESETS = [
  { label: 'Subtle 70%', value: 70 },
  { label: 'Standard 100%', value: 100 },
  { label: 'Large 135%', value: 135 },
  { label: 'Signature 175%', value: 175 },
];

export const Module2RetouchAndLUT: React.FC = () => {
  const {
    photos,
    luts,
    activeLutId,
    setActiveLutId,
    addCustomLut,
    deleteLut,
    batchExposureMatch,
    setBatchExposureMatch,
    watermark,
    setWatermark,
  } = usePixelFotos();

  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(photos[0]?.id || '');
  const [lutCategoryTab, setLutCategoryTab] = useState<'All' | LutCategory>('Kerala Wedding Style');
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

  const keralaLuts = useMemo(
    () => luts.filter((l) => l.category === 'Kerala Wedding Style'),
    [luts]
  );

  const filteredLuts = useMemo(() => {
    if (lutCategoryTab === 'All') return luts;
    if (lutCategoryTab === 'Custom .CUBE') {
      return luts.filter((l) => l.source === 'custom_cube' || l.category === 'Custom .CUBE');
    }
    return luts.filter((l) => (l.category || 'Signature Studio') === lutCategoryTab);
  }, [luts, lutCategoryTab]);

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
    setLutCategoryTab('Custom .CUBE');
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
            Module 02 · Kerala Wedding LUTs (.CUBE) &amp; Custom Font Watermark Studio
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-0.5">
            LUTs Color Grading &amp; Watermark Studio
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Grade wedding galleries with dedicated Kerala Wedding Style LUTs, custom .cube 3D tables, and a resizable multi-font watermark compositor synced across client galleries.
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

      {/* Adaptive Split Workbench */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Canvas Split View */}
        <div className="md:col-span-7 space-y-4">
          <div className="liquid-glass rounded-[24px] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                Live Graded Canvas · {activePhoto?.fileName}
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
                ORIGINAL
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#D4AF37] text-[11px] font-mono pointer-events-none">
                {activeLut.name.toUpperCase()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Before / After</span>
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

        {/* Right Controls: Dedicated Kerala Wedding Style LUTs + Resizable Multi-Font Watermark */}
        <div className="md:col-span-5 space-y-5">
          {/* LUTs Card with Dedicated Kerala Wedding Style Section */}
          <div className="liquid-glass rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D4AF37]" />
                <span>Color Grading LUTs (.CUBE)</span>
              </h3>
              <span className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
                {keralaLuts.length} Kerala Presets
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-[16px] liquid-glass-subtle overflow-x-auto">
              {(
                [
                  { id: 'Kerala Wedding Style', label: 'Kerala Wedding Style', icon: Palmtree },
                  { id: 'Signature Studio', label: 'Signature Studio' },
                  { id: 'Custom .CUBE', label: 'Custom .CUBE' },
                  { id: 'All', label: `All (${luts.length})` },
                ] as const
              ).map((tab) => {
                const active = lutCategoryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLutCategoryTab(tab.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer inline-flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#D4AF37] text-[#090B10] shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.id === 'Kerala Wedding Style' && <Palmtree className="w-3.5 h-3.5" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {lutCategoryTab === 'Kerala Wedding Style' && (
              <div className="px-3.5 py-2.5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-zinc-700 dark:text-zinc-200">
                <span className="font-semibold text-[#B58E24] dark:text-[#D4AF37]">
                  Kerala Wedding Color Science:
                </span>{' '}
                Calibrated for Kasavu mundu/saree ivory, 24K temple gold jewelry, tropical backwater greens, and brass nilavilakku warmth.
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredLuts.length === 0 ? (
                <div className="p-4 rounded-2xl liquid-glass-subtle text-center space-y-2">
                  <p className="text-xs text-zinc-500">No custom .CUBE LUTs uploaded yet.</p>
                  <button
                    type="button"
                    onClick={() => lutInputRef.current?.click()}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
                  >
                    Upload .cube File
                  </button>
                </div>
              ) : (
                filteredLuts.map((lut) => {
                  const isSelected = lut.id === activeLut.id;
                  return (
                    <div
                      key={lut.id}
                      onClick={() => setActiveLutId(lut.id)}
                      className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15'
                          : 'border-black/8 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {lut.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#B58E24] dark:text-[#D4AF37] shrink-0">
                            {lut.category || (lut.source === 'custom_cube' ? 'Custom .CUBE' : 'Signature')}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {lut.description ||
                            (lut.source === 'custom_cube'
                              ? `3D Trilinear ${lut.lutSize || 33}³ .cube`
                              : 'Pixel Color Matrix')}
                        </p>
                      </div>

                      {luts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLut(lut.id);
                          }}
                          aria-label={`Delete ${lut.name}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
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

          {/* Upgraded Watermark Tool with Font Family & Scale Controls */}
          <div className="liquid-glass rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-semibold">Watermark Scale &amp; Typography</h3>
              </div>
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
                Custom Text &amp; Font
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
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Watermark Signature Text
                  </label>
                  <input
                    type="text"
                    value={watermark.text}
                    onChange={(e) => setWatermark((w) => ({ ...w, text: e.target.value }))}
                    placeholder="Enter studio or couple watermark..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl liquid-input text-xs"
                  />
                </div>

                {/* Custom Text Font Selector */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Watermark Text Font Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {WATERMARK_FONTS.map((font) => {
                      const active = (watermark.fontFamily || 'Cormorant Garamond') === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() =>
                            setWatermark((w) => ({ ...w, fontFamily: font.id }))
                          }
                          className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition cursor-pointer ${
                            active
                              ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-zinc-900 dark:text-white'
                              : 'border-black/10 dark:border-white/12 text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37]/40'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                            {font.label}
                          </div>
                          <div
                            style={{ fontFamily: `"${font.id}", serif` }}
                            className="text-sm truncate mt-0.5"
                          >
                            {watermark.text || font.sample}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
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

            {/* Enhanced Watermark Scale (Resize) & Opacity Controls */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Watermark Size / Scale</span>
                  <span className="font-mono text-[#B58E24] dark:text-[#D4AF37] tabular-nums">
                    {watermark.scale}%
                  </span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={240}
                  value={watermark.scale}
                  onChange={(e) =>
                    setWatermark((w) => ({ ...w, scale: Number(e.target.value) }))
                  }
                  className="w-full accent-[#D4AF37]"
                  aria-label="Watermark size scale"
                />
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {SCALE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setWatermark((w) => ({ ...w, scale: preset.value }))}
                      className={`py-1 px-2 rounded-lg text-[10px] font-mono border cursor-pointer ${
                        watermark.scale === preset.value
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37]'
                          : 'border-black/8 dark:border-white/10 text-zinc-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Watermark Opacity</span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {watermark.opacity}%
                  </span>
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
                  aria-label="Watermark opacity"
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
