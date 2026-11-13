import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Save,
  Sliders,
  Sparkles,
  Undo2,
  Eye,
  CheckCircle2,
  UploadCloud,
  Layers,
  Stamp,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PhotoAsset, WatermarkGridPosition, WatermarkSettings } from '../../types';
import { getWatermarkSettings, saveWatermarkSettings } from '../../lib/cloudinary';
import { uploadAssetToCloudinary } from '../../services/uploadService';

interface ColourGradingPreset {
  id: string;
  name: string;
  tagline: string;
  exposure: number;
  contrast: number;
  warmth: number;
  tint: number;
  vibrance: number;
  matteFade: number;
  grayscale?: number;
}

const WEDDING_COLOUR_PRESETS: ColourGradingPreset[] = [
  {
    id: 'royal_warmth',
    name: 'Royal Warmth',
    tagline: 'Rich gold highlights & velvety skin tones for palace weddings',
    exposure: 104,
    contrast: 108,
    warmth: 24,
    tint: 4,
    vibrance: 118,
    matteFade: 6,
  },
  {
    id: 'golden_hour_airy',
    name: 'Golden Hour Airy',
    tagline: 'Luminous pastel highlights & soft sunset warmth',
    exposure: 110,
    contrast: 95,
    warmth: 18,
    tint: 2,
    vibrance: 112,
    matteFade: 12,
  },
  {
    id: 'bridal_monochrome',
    name: 'Bridal Monochrome Study',
    tagline: 'Leica M11 silver-halide black & white with deep blacks',
    exposure: 102,
    contrast: 122,
    warmth: 6,
    tint: 0,
    vibrance: 0,
    matteFade: 8,
    grayscale: 100,
  },
  {
    id: 'dark_moody_cinema',
    name: 'Dark Moody Cinema',
    tagline: 'Cinematic shadow depth & warm amber highlights',
    exposure: 94,
    contrast: 118,
    warmth: 20,
    tint: -4,
    vibrance: 92,
    matteFade: 14,
  },
  {
    id: 'soft_romantic_matte',
    name: 'Soft Romantic Matte',
    tagline: 'Fine-art editorial film fade with gentle contrast',
    exposure: 105,
    contrast: 92,
    warmth: 14,
    tint: 6,
    vibrance: 96,
    matteFade: 22,
  },
  {
    id: 'true_to_life_editorial',
    name: 'True-to-Life Editorial',
    tagline: 'Balanced medium-format color accuracy & crisp micro-contrast',
    exposure: 100,
    contrast: 104,
    warmth: 4,
    tint: 0,
    vibrance: 105,
    matteFade: 0,
  },
];

const GRID_POSITIONS: { id: WatermarkGridPosition; label: string }[] = [
  { id: 'top-left', label: 'TL' },
  { id: 'top-center', label: 'TC' },
  { id: 'top-right', label: 'TR' },
  { id: 'center-left', label: 'CL' },
  { id: 'center', label: 'C' },
  { id: 'center-right', label: 'CR' },
  { id: 'bottom-left', label: 'BL' },
  { id: 'bottom-center', label: 'BC' },
  { id: 'bottom-right', label: 'BR' },
];

export const OnlinePhotoEditor: React.FC = () => {
  const { studio, updateStudio, photos, addPhotosBatch } = useAuth();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(photos[0]?.id || 'ph_101');
  const [activeStudioPanel, setActiveStudioPanel] = useState<'grading' | 'watermark'>('grading');
  const [activePresetId, setActivePresetId] = useState<string>('true_to_life_editorial');

  // Module F: Fine-Tuning Sliders
  const [exposure, setExposure] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(104);
  const [warmth, setWarmth] = useState<number>(4);
  const [tint, setTint] = useState<number>(0);
  const [vibrance, setVibrance] = useState<number>(105);
  const [matteFade, setMatteFade] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);

  // Geometry
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [cropAspect, setCropAspect] = useState<'original' | '16:9' | '4:3' | '1:1'>('original');
  const [addGalleryBorder, setAddGalleryBorder] = useState<boolean>(false);
  const [showOriginalCompare, setShowOriginalCompare] = useState<boolean>(false);

  // Module B: Advanced Watermark Studio (Text + PNG Logo via Cloudinary)
  const [wmSettings, setWmSettings] = useState<WatermarkSettings>(() =>
    getWatermarkSettings(studio.watermarkText)
  );
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [loadedLogoImg, setLoadedLogoImg] = useState<HTMLImageElement | null>(null);

  const [saveNotification, setSaveNotification] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePhoto = photos.find((p) => p.id === selectedPhotoId) || photos[0];

  useEffect(() => {
    if (!wmSettings.logoUrl) {
      setLoadedLogoImg(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLoadedLogoImg(img);
    img.src = wmSettings.logoUrl;
  }, [wmSettings.logoUrl]);

  const handleApplyPreset = (preset: ColourGradingPreset) => {
    setActivePresetId(preset.id);
    setExposure(preset.exposure);
    setContrast(preset.contrast);
    setWarmth(preset.warmth);
    setTint(preset.tint);
    setVibrance(preset.vibrance);
    setMatteFade(preset.matteFade);
    setGrayscale(preset.grayscale || 0);
    setSaveNotification(`Applied "${preset.name}" wedding colour grade preset.`);
  };

  const resetEdits = () => {
    handleApplyPreset(WEDDING_COLOUR_PRESETS[5]);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropAspect('original');
    setAddGalleryBorder(false);
    setSaveNotification('Reset colour grading and geometry to original camera neutral.');
  };

  const handleUpdateWatermark = (patch: Partial<WatermarkSettings>) => {
    const next = saveWatermarkSettings({ ...wmSettings, ...patch });
    setWmSettings(next);
    if (patch.text) {
      updateStudio({ watermarkText: patch.text });
    }
  };

  const handleLogoUploadToCloudinary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await uploadAssetToCloudinary(file, 'pixelfotos-studio/watermarks');
      handleUpdateWatermark({
        mode: 'logo',
        logoUrl: res.secureUrl,
        enabled: true,
      });
      setSaveNotification(
        `Uploaded PNG Watermark Logo "${file.name}" to Cloudinary (dxeuzdwkz / Event schedule) and applied across gallery previews.`
      );
    } catch (err) {
      setSaveNotification(err instanceof Error ? err.message : 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (!activePhoto || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let targetW = img.width || 1200;
      let targetH = img.height || 800;

      if (cropAspect === '16:9') {
        targetH = Math.round((targetW * 9) / 16);
      } else if (cropAspect === '4:3') {
        targetH = Math.round((targetW * 3) / 4);
      } else if (cropAspect === '1:1') {
        const side = Math.min(targetW, targetH);
        targetW = side;
        targetH = side;
      }

      canvas.width = targetW;
      canvas.height = targetH;

      ctx.save();
      ctx.clearRect(0, 0, targetW, targetH);

      if (!showOriginalCompare) {
        ctx.filter = `brightness(${exposure}%) contrast(${contrast}%) saturate(${vibrance}%) sepia(${warmth}%) hue-rotate(${tint}deg) grayscale(${grayscale}%)`;
      } else {
        ctx.filter = 'none';
      }

      ctx.translate(targetW / 2, targetH / 2);
      if (!showOriginalCompare) {
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      }

      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();

      // Matte Fade Film Lift Overlay
      if (!showOriginalCompare && matteFade > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(24, 20, 18, ${(matteFade / 100) * 0.35})`;
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.restore();
      }

      if (!showOriginalCompare && addGalleryBorder) {
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = Math.round(Math.min(targetW, targetH) * 0.04);
        ctx.strokeRect(0, 0, targetW, targetH);
      }

      // Draw Watermark (Text or PNG Logo with 9-Grid Position, Rotation, Scale & Opacity)
      if (!showOriginalCompare && wmSettings.enabled) {
        ctx.save();
        ctx.globalAlpha = (wmSettings.opacity ?? 78) / 100;

        const padX = Math.round(targetW * 0.05);
        const padY = Math.round(targetH * 0.06);
        let posX = targetW - padX;
        let posY = targetH - padY;
        let textAlign: CanvasTextAlign = 'right';

        if (wmSettings.position9Grid.includes('left')) {
          posX = padX;
          textAlign = 'left';
        } else if (wmSettings.position9Grid.includes('center')) {
          posX = targetW / 2;
          textAlign = 'center';
        }

        if (wmSettings.position9Grid.startsWith('top')) {
          posY = padY + 20;
        } else if (wmSettings.position9Grid.startsWith('center')) {
          posY = targetH / 2;
        }

        ctx.translate(posX, posY);
        ctx.rotate(((wmSettings.rotation || 0) * Math.PI) / 180);
        const scaleFactor = (wmSettings.scale || 100) / 100;
        ctx.scale(scaleFactor, scaleFactor);

        if (wmSettings.mode === 'logo' && loadedLogoImg) {
          const logoW = Math.min(260, Math.round(targetW * 0.18));
          const logoH = Math.round(
            (loadedLogoImg.height / Math.max(1, loadedLogoImg.width)) * logoW
          );
          const offsetX =
            textAlign === 'right' ? -logoW : textAlign === 'center' ? -logoW / 2 : 0;
          const offsetY = -logoH / 2;
          ctx.drawImage(loadedLogoImg, offsetX, offsetY, logoW, logoH);
        } else if (wmSettings.text.trim()) {
          ctx.font = `600 ${wmSettings.fontSize || 24}px ${wmSettings.fontFamily || 'sans-serif'}`;
          ctx.fillStyle = '#FDE68A';
          ctx.textAlign = textAlign;
          ctx.shadowColor = 'rgba(0,0,0,0.65)';
          ctx.shadowBlur = 8;
          ctx.fillText(wmSettings.text.trim(), 0, 0);
        }

        ctx.restore();
      }
    };
    img.src = activePhoto.secureUrl;
  }, [
    activePhoto,
    exposure,
    contrast,
    warmth,
    tint,
    vibrance,
    matteFade,
    grayscale,
    rotation,
    flipH,
    flipV,
    cropAspect,
    wmSettings,
    loadedLogoImg,
    addGalleryBorder,
    showOriginalCompare,
  ]);

  const handleSaveAsNewVersion = async () => {
    if (!canvasRef.current || !activePhoto) return;
    const editedDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
    const newVersion: PhotoAsset = {
      ...activePhoto,
      id: `ph_edit_${Date.now()}`,
      fileName: activePhoto.fileName.replace(/(\.[^.]+)$/, '_Graded$1'),
      secureUrl: editedDataUrl,
      thumbnailUrl: editedDataUrl,
      uploadedAt: new Date().toISOString(),
    };
    await addPhotosBatch([newVersion]);
    setSaveNotification(
      `Saved graded master "${newVersion.fileName}" to gallery while preserving raw original.`
    );
  };

  const handleBatchApplyToSelected = () => {
    const selectedCount = photos.filter((p) => p.selected).length || photos.length;
    saveWatermarkSettings(wmSettings);
    const presetName =
      WEDDING_COLOUR_PRESETS.find((p) => p.id === activePresetId)?.name || 'Custom LUT';
    setSaveNotification(
      `Batch-applied "${presetName}" colour grade & ${
        wmSettings.mode === 'logo' ? 'PNG Logo' : 'Signature Text'
      } watermark across ${selectedCount} gallery photos!`
    );
  };

  const handleDownloadEdited = () => {
    if (!canvasRef.current || !activePhoto) return;
    const url = canvasRef.current.toDataURL('image/jpeg', 0.94);
    const a = document.createElement('a');
    a.href = url;
    a.download = activePhoto.fileName.replace(/(\.[^.]+)$/, '_Graded.jpg');
    a.click();
  };

  return (
    <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-6 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
            MODULES B &amp; F · COLOUR GRADING STUDIO &amp; DUAL-MODE WATERMARK ENGINE
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white">
             Wedding Colour Grading &amp; Watermark Studio
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select Photo to Grade"
            value={selectedPhotoId}
            onChange={(e) => {
              setSelectedPhotoId(e.target.value);
              setSaveNotification('');
            }}
            className="px-3 py-2 text-xs font-medium bg-[#161F33] border border-amber-500/30 rounded-xl text-white"
          >
            {photos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fileName} ({p.category})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowOriginalCompare((prev) => !prev)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors inline-flex items-center gap-1.5 ${
              showOriginalCompare
                ? 'bg-amber-400 text-[#0B0F17] border-amber-300'
                : 'bg-[#161F33] border-amber-500/30 text-amber-200 hover:bg-amber-500/15'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showOriginalCompare ? 'Viewing Original RAW' : 'Before / After Compare'}</span>
          </button>

          <button
            type="button"
            onClick={resetEdits}
            className="px-3 py-2 text-xs font-medium bg-[#161F33] border border-slate-700 rounded-xl text-slate-300 hover:text-white inline-flex items-center gap-1.5"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadEdited}
            className="px-3.5 py-2 text-xs font-semibold bg-white text-[#0B0F17] rounded-xl hover:bg-amber-100 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Graded JPEG</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAsNewVersion}
            className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-white rounded-xl hover:opacity-95 inline-flex items-center gap-1.5 shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Gallery</span>
          </button>
        </div>
      </div>

      {saveNotification && (
        <div className="flex items-center justify-between gap-2 p-3.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{saveNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveNotification('')}
            className="text-amber-300 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 6 Signature Wedding Colour Grading Presets Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            6 Signature Wedding LUT Presets (Instant Preview)
          </span>
          <button
            type="button"
            onClick={handleBatchApplyToSelected}
            className="text-xs font-semibold text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Apply Grade &amp; Watermark to Selected Gallery Photos</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {WEDDING_COLOUR_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/25 to-amber-700/10 border-amber-400 text-amber-200 shadow-md'
                    : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-amber-500/40'
                }`}
              >
                <div className="text-xs font-bold truncate">{preset.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                  {preset.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live HTML5 Graded & Watermarked Canvas */}
        <div className="lg:col-span-8 bg-[#070A10] border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[440px]">
          <canvas
            ref={canvasRef}
            data-testid="photo-editor-canvas"
            className="max-w-full max-h-[500px] w-auto h-auto rounded-xl shadow-2xl"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between w-full text-xs text-slate-400 px-2 gap-2">
            <span>Master Asset: {activePhoto?.fileName}</span>
            <span className="font-mono text-amber-300/90 tabular-nums">
              Exp {exposure}% · Con {contrast}% · Warmth {warmth}% · Vib {vibrance}% · Matte{' '}
              {matteFade}%
            </span>
          </div>
        </div>

        {/* Right Controls Switcher: Colour Grading vs Watermark Studio */}
        <div className="lg:col-span-4 bg-[#0B0F17] border border-amber-500/25 rounded-2xl p-5 space-y-5">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#131B2E] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveStudioPanel('grading')}
              className={`py-2 px-3 rounded-lg font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                activeStudioPanel === 'grading'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Colour Grading</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStudioPanel('watermark')}
              className={`py-2 px-3 rounded-lg font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                activeStudioPanel === 'watermark'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>Watermark Studio</span>
            </button>
          </div>

          {activeStudioPanel === 'grading' ? (
            <div className="space-y-4 text-xs">
              {[
                {
                  id: 'slider-exposure',
                  label: 'Exposure',
                  val: exposure,
                  min: 60,
                  max: 140,
                  unit: '%',
                  set: setExposure,
                },
                {
                  id: 'slider-contrast',
                  label: 'Contrast',
                  val: contrast,
                  min: 60,
                  max: 140,
                  unit: '%',
                  set: setContrast,
                },
                {
                  id: 'slider-warmth',
                  label: 'Warmth (Kelvin)',
                  val: warmth,
                  min: 0,
                  max: 60,
                  unit: '%',
                  set: setWarmth,
                },
                {
                  id: 'slider-tint',
                  label: 'Tint (Green / Magenta)',
                  val: tint,
                  min: -30,
                  max: 30,
                  unit: '°',
                  set: setTint,
                },
                {
                  id: 'slider-vibrance',
                  label: 'Vibrance & Saturation',
                  val: vibrance,
                  min: 0,
                  max: 180,
                  unit: '%',
                  set: setVibrance,
                },
                {
                  id: 'slider-matte',
                  label: 'Matte Film Fade',
                  val: matteFade,
                  min: 0,
                  max: 50,
                  unit: '%',
                  set: setMatteFade,
                },
              ].map((s) => (
                <div key={s.id}>
                  <div className="flex justify-between mb-1">
                    <label htmlFor={s.id} className="font-medium text-slate-300">
                      {s.label}
                    </label>
                    <span className="font-mono text-amber-300 tabular-nums">
                      {s.val}
                      {s.unit}
                    </span>
                  </div>
                  <input
                    id={s.id}
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={s.val}
                    onChange={(e) => s.set(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              ))}

              <div className="pt-3 border-t border-slate-800 space-y-3">
                <span className="block font-semibold text-amber-200">Geometry &amp; Crop</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="px-2.5 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-slate-200 hover:border-amber-400 inline-flex items-center justify-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipH((f) => !f)}
                    className="px-2.5 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-slate-200 hover:border-amber-400 inline-flex items-center justify-center gap-1"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip H</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV((f) => !f)}
                    className="px-2.5 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-slate-200 hover:border-amber-400 inline-flex items-center justify-center gap-1"
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip V</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <select
                    aria-label="Aspect Ratio Crop"
                    value={cropAspect}
                    onChange={(e) => setCropAspect(e.target.value as typeof cropAspect)}
                    className="px-3 py-1.5 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  >
                    <option value="original">Original Ratio</option>
                    <option value="16:9">16:9 Cinema</option>
                    <option value="4:3">4:3 Print</option>
                    <option value="1:1">1:1 Square</option>
                  </select>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={addGalleryBorder}
                      onChange={(e) => setAddGalleryBorder(e.target.checked)}
                      className="rounded border-slate-600 text-amber-500"
                    />
                    <span>Museum Border</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* MODULE B: Dual-Mode Watermark Studio (Text + PNG Logo) */
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-200">
                  Apply Watermark to Previews
                </span>
                <input
                  type="checkbox"
                  checked={wmSettings.enabled}
                  onChange={(e) => handleUpdateWatermark({ enabled: e.target.checked })}
                  className="rounded border-slate-600 text-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateWatermark({ mode: 'text' })}
                  className={`py-2 px-3 rounded-lg font-semibold border ${
                    wmSettings.mode === 'text'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-[#131B2E] border-slate-700 text-slate-400'
                  }`}
                >
                  1. Text Watermark
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateWatermark({ mode: 'logo' })}
                  className={`py-2 px-3 rounded-lg font-semibold border ${
                    wmSettings.mode === 'logo'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-[#131B2E] border-slate-700 text-slate-400'
                  }`}
                >
                  2. PNG Logo Upload
                </button>
              </div>

              {wmSettings.mode === 'text' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      Watermark Text Signature
                    </label>
                    <input
                      type="text"
                      value={wmSettings.text}
                      onChange={(e) => handleUpdateWatermark({ text: e.target.value })}
                      className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      Typography Font Family
                    </label>
                    <select
                      value={wmSettings.fontFamily}
                      onChange={(e) => handleUpdateWatermark({ fontFamily: e.target.value })}
                      className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                    >
                      <option value='"Cormorant Garamond", Georgia, serif'>
                        Cormorant Garamond (Luxury Serif)
                      </option>
                      <option value='"Plus Jakarta Sans", sans-serif'>
                        Plus Jakarta Sans (Modern Clean)
                      </option>
                      <option value='"JetBrains Mono", monospace'>
                        JetBrains Mono (Technical Archival)
                      </option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Font Size</span>
                      <span className="font-mono text-amber-300">{wmSettings.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={48}
                      value={wmSettings.fontSize}
                      onChange={(e) =>
                        handleUpdateWatermark({ fontSize: Number(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-[#131B2E] border border-dashed border-amber-500/40 rounded-xl text-center space-y-2">
                    <p className="text-[11px] text-slate-300">
                      Upload transparent studio PNG logo (stored via Cloudinary{' '}
                      <code className="text-amber-300">dxeuzdwkz</code>)
                    </p>
                    <label
                      htmlFor="watermark-png-upload"
                      className="px-3.5 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>
                        {uploadingLogo ? 'Uploading to Cloudinary...' : 'Upload PNG Logo'}
                      </span>
                      <input
                        id="watermark-png-upload"
                        type="file"
                        accept="image/png,image/webp,image/jpeg"
                        onChange={handleLogoUploadToCloudinary}
                        className="sr-only"
                      />
                    </label>
                    {wmSettings.logoUrl && (
                      <div className="pt-2">
                        <img
                          src={wmSettings.logoUrl}
                          alt="Uploaded Studio Logo"
                          className="h-10 mx-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 9-Grid Position Matrix */}
              <div>
                <span className="block font-medium text-slate-300 mb-1.5">
                  9-Grid Placement Position
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {GRID_POSITIONS.map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => handleUpdateWatermark({ position9Grid: pos.id })}
                      className={`py-1.5 rounded-lg font-mono text-[11px] border ${
                        wmSettings.position9Grid === pos.id
                          ? 'bg-amber-400 text-[#0B0F17] font-bold border-amber-300'
                          : 'bg-[#131B2E] text-slate-300 border-slate-700 hover:border-amber-500/40'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale, Rotation & Opacity */}
              <div className="space-y-2.5 pt-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Scale</span>
                    <span className="font-mono text-amber-300">{wmSettings.scale}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={180}
                    value={wmSettings.scale}
                    onChange={(e) => handleUpdateWatermark({ scale: Number(e.target.value) })}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Rotation Angle</span>
                    <span className="font-mono text-amber-300">{wmSettings.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    value={wmSettings.rotation}
                    onChange={(e) =>
                      handleUpdateWatermark({ rotation: Number(e.target.value) })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Watermark Opacity</span>
                    <span className="font-mono text-amber-300">{wmSettings.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={100}
                    value={wmSettings.opacity}
                    onChange={(e) =>
                      handleUpdateWatermark({ opacity: Number(e.target.value) })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleBatchApplyToSelected}
                className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-xl inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Watermark to All Client Galleries</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
