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
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PhotoAsset } from '../../types';

export const OnlinePhotoEditor: React.FC = () => {
  const { studio, photos, addPhotosBatch } = useAuth();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(photos[0]?.id || 'ph_101');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [warmth, setWarmth] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [cropAspect, setCropAspect] = useState<'original' | '16:9' | '4:3' | '1:1'>('original');
  const [overlayText, setOverlayText] = useState<string>(studio.watermarkText);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [addGalleryBorder, setAddGalleryBorder] = useState<boolean>(false);
  const [showOriginalCompare, setShowOriginalCompare] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string>('');
  const [aiAdapterNotice, setAiAdapterNotice] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePhoto = photos.find((p) => p.id === selectedPhotoId) || photos[0];

  const resetEdits = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setWarmth(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropAspect('original');
    setAddGalleryBorder(false);
    setSaveNotification('');
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
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${warmth}%)`;
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

      if (!showOriginalCompare && addGalleryBorder) {
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = Math.round(Math.min(targetW, targetH) * 0.04);
        ctx.strokeRect(0, 0, targetW, targetH);
      }

      if (!showOriginalCompare && showWatermark && overlayText.trim()) {
        ctx.save();
        ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
        ctx.textAlign = 'right';
        ctx.fillText(overlayText.trim(), targetW - 32, targetH - 28);
        ctx.restore();
      }
    };
    img.src = activePhoto.secureUrl;
  }, [
    activePhoto,
    brightness,
    contrast,
    saturation,
    warmth,
    rotation,
    flipH,
    flipV,
    cropAspect,
    overlayText,
    showWatermark,
    addGalleryBorder,
    showOriginalCompare,
  ]);

  const handleSaveAsNewVersion = async () => {
    if (!canvasRef.current || !activePhoto) return;
    const editedDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
    const newVersion: PhotoAsset = {
      ...activePhoto,
      id: `ph_edit_${Date.now()}`,
      fileName: activePhoto.fileName.replace(/(\.[^.]+)$/, '_Edited$1'),
      secureUrl: editedDataUrl,
      thumbnailUrl: editedDataUrl,
      uploadedAt: new Date().toISOString(),
    };
    await addPhotosBatch([newVersion]);
    setSaveNotification(
      `Saved non-destructive edited master "${newVersion.fileName}" to gallery while keeping original intact.`
    );
  };

  const handleDownloadEdited = () => {
    if (!canvasRef.current || !activePhoto) return;
    const url = canvasRef.current.toDataURL('image/jpeg', 0.92);
    const a = document.createElement('a');
    a.href = url;
    a.download = activePhoto.fileName.replace(/(\.[^.]+)$/, '_Graded.jpg');
    a.click();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Online Non-Destructive Photo Editor
          </h2>
          <p className="text-xs text-slate-500">
            HTML5 Canvas color grading, aspect cropping, watermarking &amp; versioned export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="editor-photo-select" className="sr-only">
            Select Photo to Edit
          </label>
          <select
            id="editor-photo-select"
            value={selectedPhotoId}
            onChange={(e) => {
              setSelectedPhotoId(e.target.value);
              setSaveNotification('');
            }}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
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
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
              showOriginalCompare
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showOriginalCompare ? 'Viewing Original' : 'Compare Before / After'}</span>
          </button>

          <button
            type="button"
            onClick={resetEdits}
            className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadEdited}
            className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JPEG</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAsNewVersion}
            className="px-4 py-2 text-xs font-medium bg-[#0D9488] text-white rounded-lg hover:bg-teal-700 inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as New Gallery Version</span>
          </button>
        </div>
      </div>

      {saveNotification && (
        <div className="flex items-center gap-2 p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-950">
          <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span>{saveNotification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Canvas Viewport */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center min-h-[420px]">
          <canvas
            ref={canvasRef}
            data-testid="photo-editor-canvas"
            className="max-w-full max-h-[500px] w-auto h-auto rounded-lg shadow-lg"
          />
          <div className="mt-3 flex items-center justify-between w-full text-xs text-slate-400 px-2">
            <span>Source: {activePhoto?.fileName}</span>
            <span className="font-mono tabular-nums">
              Brightness {brightness}% · Contrast {contrast}% · Sat {saturation}%
            </span>
          </div>
        </div>

        {/* Grading & Transformation Controls */}
        <div className="lg:col-span-4 space-y-5 bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sliders className="w-4 h-4 text-[#0D9488]" />
            <span>Color &amp; Exposure Grading</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="slider-brightness" className="font-medium text-slate-700">
                  Brightness / Exposure
                </label>
                <span className="font-mono tabular-nums">{brightness}%</span>
              </div>
              <input
                id="slider-brightness"
                type="range"
                min={50}
                max={150}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[#0D9488]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="slider-contrast" className="font-medium text-slate-700">
                  Contrast
                </label>
                <span className="font-mono tabular-nums">{contrast}%</span>
              </div>
              <input
                id="slider-contrast"
                type="range"
                min={50}
                max={150}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-[#0D9488]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="slider-saturation" className="font-medium text-slate-700">
                  Vibrance &amp; Saturation
                </label>
                <span className="font-mono tabular-nums">{saturation}%</span>
              </div>
              <input
                id="slider-saturation"
                type="range"
                min={0}
                max={200}
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-[#0D9488]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="slider-warmth" className="font-medium text-slate-700">
                  Editorial Film Warmth
                </label>
                <span className="font-mono tabular-nums">{warmth}%</span>
              </div>
              <input
                id="slider-warmth"
                type="range"
                min={0}
                max={60}
                value={warmth}
                onChange={(e) => setWarmth(Number(e.target.value))}
                className="w-full accent-[#0D9488]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-3 text-xs">
            <span className="block font-semibold text-slate-900">Geometry, Crop &amp; Watermark</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate 90°</span>
              </button>
              <button
                type="button"
                onClick={() => setFlipH((f) => !f)}
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center gap-1"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Flip H</span>
              </button>
              <button
                type="button"
                onClick={() => setFlipV((f) => !f)}
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center gap-1"
              >
                <FlipVertical className="w-3.5 h-3.5" />
                <span>Flip V</span>
              </button>
            </div>

            <div>
              <label htmlFor="crop-aspect-select" className="block font-medium text-slate-700 mb-1">
                Aspect Ratio Crop
              </label>
              <select
                id="crop-aspect-select"
                value={cropAspect}
                onChange={(e) => setCropAspect(e.target.value as typeof cropAspect)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
              >
                <option value="original">Original Ratio</option>
                <option value="16:9">16:9 Widescreen Cinema</option>
                <option value="4:3">4:3 Medium Format Print</option>
                <option value="1:1">1:1 Square Portfolio</option>
              </select>
            </div>

            <div>
              <label htmlFor="watermark-overlay-input" className="block font-medium text-slate-700 mb-1">
                Watermark / Signature Text Overlay
              </label>
              <input
                id="watermark-overlay-input"
                type="text"
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded border-slate-300 text-[#0D9488]"
                />
                <span>Show Watermark</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addGalleryBorder}
                  onChange={(e) => setAddGalleryBorder(e.target.checked)}
                  className="rounded border-slate-300 text-[#0D9488]"
                />
                <span>Fine-Art Border</span>
              </label>
            </div>
          </div>

          {/* External AI Retouching Adapters */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>External AI Retouching Adapters</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['AI Background Removal', 'Skin Smoothing', 'Face Retouch', 'Object Removal'].map(
                (toolName) => (
                  <button
                    key={toolName}
                    type="button"
                    onClick={() =>
                      setAiAdapterNotice(
                        `${toolName} Adapter: External neural retouching API key not configured. Configure your Cloudinary AI / Photoroom endpoint in Super Admin Settings to activate.`
                      )
                    }
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 text-left truncate"
                  >
                    {toolName}
                  </button>
                )
              )}
            </div>
            {aiAdapterNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>{aiAdapterNotice}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
