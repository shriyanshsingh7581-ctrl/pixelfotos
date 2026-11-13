import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  PHOTO_STUDIO_PRESETS,
  OFFICIAL_BACKGROUND_SWATCHES,
  BIOMETRIC_TOLERANCE_SPECS,
  PRINT_SHEET_CAPACITY_RULES,
  resolvePrintSheetLayout,
  PhotoPresetSpec,
  PresetCategoryId,
  PrintSheetSizeId,
} from '../../data/passportExamPresets';
import {
  triggerDirectPhotoDownload,
  getCloudinaryConfig,
} from '../../lib/cloudinary';
import { uploadAssetToCloudinary } from '../../services/uploadService';

interface PassportExamPhotoStudioProps {
  initialPortraitUrl?: string;
}

function buildStudioPortraitSvgDataUri(
  _name: string,
  suitColor: string,
  skinTone: string,
  hairColor: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
    <defs>
      <radialGradient id="faceGrad" cx="50%" cy="42%" r="45%">
        <stop offset="0%" stop-color="${skinTone}" />
        <stop offset="100%" stop-color="#C68E68" />
      </radialGradient>
      <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${suitColor}" />
        <stop offset="100%" stop-color="#0F172A" />
      </linearGradient>
    </defs>
    <path d="M90,750 C95,575 185,520 300,520 C415,520 505,575 510,750 Z" fill="url(#suitGrad)" />
    <polygon points="240,520 300,635 360,520" fill="#F8FAFC" />
    <polygon points="288,555 312,555 318,665 300,685 282,665" fill="#991B1B" />
    <rect x="255" y="435" width="90" height="105" rx="28" fill="#C9936E" />
    <ellipse cx="176" cy="325" rx="18" ry="36" fill="#C9936E" />
    <ellipse cx="424" cy="325" rx="18" ry="36" fill="#C9936E" />
    <ellipse cx="300" cy="315" rx="118" ry="152" fill="url(#faceGrad)" />
    <path d="M182,285 C175,165 235,135 300,135 C365,135 425,165 418,285 C402,215 360,188 300,188 C240,188 198,215 182,285 Z" fill="${hairColor}" />
    <path d="M230,278 Q255,268 278,276" stroke="${hairColor}" stroke-width="6" fill="none" stroke-linecap="round" />
    <path d="M322,276 Q345,268 370,278" stroke="${hairColor}" stroke-width="6" fill="none" stroke-linecap="round" />
    <ellipse cx="254" cy="302" rx="16" ry="9" fill="#FFFFFF" />
    <circle cx="254" cy="302" r="6.5" fill="#1E293B" />
    <circle cx="252" cy="300" r="2" fill="#FFFFFF" />
    <ellipse cx="346" cy="302" rx="16" ry="9" fill="#FFFFFF" />
    <circle cx="346" cy="302" r="6.5" fill="#1E293B" />
    <circle cx="344" cy="300" r="2" fill="#FFFFFF" />
    <path d="M300,298 L294,356 Q300,364 308,356" stroke="#A46E4B" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M268,396 Q300,404 332,396" stroke="#8C4A3E" stroke-width="5.5" fill="none" stroke-linecap="round" />
  </svg>`;
  return `data:image/svg+xml;base64,${btoa( svg )}`;
}

const SAMPLE_PORTRAITS = [
  {
    id: 'sample_indian_male',
    label: 'Studio Portrait — Male Formal',
    url: buildStudioPortraitSvgDataUri('Aarav Sharma', '#1E293B', '#E2B18C', '#18181B'),
  },
  {
    id: 'sample_indian_female',
    label: 'Studio Portrait — Female Formal',
    url: buildStudioPortraitSvgDataUri('Ananya Verma', '#312E81', '#E8BD9B', '#09090B'),
  },
  {
    id: 'sample_exec',
    label: 'Studio Portrait — Civil Services',
    url: buildStudioPortraitSvgDataUri('Vikramaditya Rao', '#1E3A8A', '#D9A17C', '#27272A'),
  },
];

export const PassportExamPhotoStudio: React.FC<PassportExamPhotoStudioProps> = ({
  initialPortraitUrl,
}) => {
  // Active Top Mode: 'workbench' vs 'reference_guide'
  const [studioViewMode, setStudioViewMode] = useState<'workbench' | 'reference_guide'>('workbench');

  // Mobile Tabbed Workflow State ('presets' | 'crop_slate' | 'print_sheet' | 'reference')
  const [mobileStep, setMobileStep] = useState<'presets' | 'crop_slate' | 'print_sheet' | 'reference'>('crop_slate');

  // Search & Category filter
  const [selectedCategory, setSelectedCategory] = useState<PresetCategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ind_passport_seva');
  const activePreset = useMemo<PhotoPresetSpec>(() => {
    return (
      PHOTO_STUDIO_PRESETS.find((p) => p.id === selectedPresetId) || PHOTO_STUDIO_PRESETS[0]
    );
  }, [selectedPresetId]);

  // Portrait Image State
  const [portraitUrl, setPortraitUrl] = useState<string>(
    initialPortraitUrl || SAMPLE_PORTRAITS[0].url
  );
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [uploadingSource, setUploadingSource] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Crop & Framing State
  const [zoom, setZoom] = useState<number>(1.15);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(104);
  const [contrast, setContrast] = useState<number>(104);
  const [bgHex, setBgHex] = useState<string>(activePreset.defaultBgHex);
  const [bgTintStrength, setBgTintStrength] = useState<number>(28);
  const [showBiometricOverlay, setShowBiometricOverlay] = useState<boolean>(true);

  // Exam Name & Date Slate State
  const [enableNameDateSlate, setEnableNameDateSlate] = useState<boolean>(
    Boolean(activePreset.requiresNameDateSlate)
  );
  const [candidateName, setCandidateName] = useState<string>('AARAV SHARMA');
  const [captureDate, setCaptureDate] = useState<string>(
    new Date().toISOString().slice(0, 10).split('-').reverse().join('-')
  );
  const [slateStyle, setSlateStyle] = useState<'white_strip' | 'black_strip'>('white_strip');

  // APPSC / TSPSC Integrated Signature Box (3.5 x 1.5 cm)
  const [enableSignatureBox, setEnableSignatureBox] = useState<boolean>(
    Boolean(activePreset.supportsSignatureBox)
  );
  const [signatureText, setSignatureText] = useState<string>('Aarav Sharma');

  // Canada IRCC Back-Stamp State
  const [studioName, setStudioName] = useState<string>('Lumina Luxury Photo Studio');
  const [studioAddress, setStudioAddress] = useState<string>(
    'Suite 402, Connaught Place, New Delhi / Toronto'
  );
  const [guarantorName] = useState<string>('I certify this is a true likeness');

  // Print Sheet Tiler State
  const [sheetSize, setSheetSize] = useState<PrintSheetSizeId>('4x6_in');
  const [bleedMm, setBleedMm] = useState<number>(2.5);
  const [showCutMarks, setShowCutMarks] = useState<boolean>(true);

  // Smart KB Compressor & Export State
  const [targetMaxKb, setTargetMaxKb] = useState<number>(activePreset.maxKb);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string>('');
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);
  const [compressedQuality, setCompressedQuality] = useState<number>(92);
  const [sheetPreviewDataUrl, setSheetPreviewDataUrl] = useState<string>('');
  const [cloudSaveStatus, setCloudSaveStatus] = useState<string | null>(null);
  const [savingToCloud, setSavingToCloud] = useState<boolean>(false);

  // Pointer drag state for crop canvas
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  // Sync preset defaults when preset changes
  const handleSelectPreset = useCallback((preset: PhotoPresetSpec) => {
    setSelectedPresetId(preset.id);
    setBgHex(preset.defaultBgHex);
    setEnableNameDateSlate(Boolean(preset.requiresNameDateSlate));
    setEnableSignatureBox(Boolean(preset.supportsSignatureBox));
    setTargetMaxKb(preset.maxKb);
    if (preset.id === 'exam_rrb_railway') {
      setSheetSize('5x7_in'); // 12 physical copies standard
    }
  }, []);

  // Load portrait HTMLImageElement for clean canvas rendering
  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    if (portraitUrl.startsWith('http://') || portraitUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (isMounted) setLoadedImage(img);
    };
    img.src = portraitUrl;
    return () => {
      isMounted = false;
    };
  }, [portraitUrl]);

  // Filtered presets list
  const filteredPresets = useMemo(() => {
    return PHOTO_STUDIO_PRESETS.filter((preset) => {
      const matchesCat =
        selectedCategory === 'all' || preset.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCat;
      return (
        matchesCat &&
        (preset.name.toLowerCase().includes(q) ||
          preset.authorityOrCountry.toLowerCase().includes(q) ||
          preset.physicalLabel.toLowerCase().includes(q) ||
          preset.digitalResolutionLabel.toLowerCase().includes(q) ||
          preset.kbLimitLabel.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const activeBiometricSpec = useMemo(() => {
    return BIOMETRIC_TOLERANCE_SPECS[activePreset.biometricStandard];
  }, [activePreset]);

  const activeSheetLayout = useMemo(() => {
    return resolvePrintSheetLayout(activePreset, sheetSize);
  }, [activePreset, sheetSize]);

  // Render Single Photo to an offscreen canvas and perform binary-search KB compression
  const renderSinglePhotoCanvas = useCallback((): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    const outW = activePreset.widthPx300Dpi;
    // If signature box is attached (3.5 x 1.5 cm below 3.5 x 4.5 cm), add 33% height
    const sigBoxExtraH = enableSignatureBox ? Math.round(activePreset.heightPx300Dpi * 0.33) : 0;
    const outH = activePreset.heightPx300Dpi + sigBoxExtraH;
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const photoH = activePreset.heightPx300Dpi;

    // 1. Fill Official Background Swatch
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, outW, outH);

    // 2. Draw Portrait with Zoom, Pan, Brightness & Contrast
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, outW, photoH);
    ctx.clip();

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    if (loadedImage && loadedImage.width > 0 && loadedImage.height > 0) {
      const imgAspect = loadedImage.width / loadedImage.height;
      const targetAspect = outW / photoH;
      let drawW = outW;
      let drawH = photoH;
      if (imgAspect > targetAspect) {
        drawH = photoH * zoom;
        drawW = drawH * imgAspect;
      } else {
        drawW = outW * zoom;
        drawH = drawW / imgAspect;
      }

      const offsetX = (outW - drawW) / 2 + (panX / 100) * outW;
      const offsetY = (photoH - drawH) / 2 + (panY / 100) * photoH;
      ctx.drawImage(loadedImage, offsetX, offsetY, drawW, drawH);
    } else {
      // Synchronous studio vector portrait render before async HTMLImageElement finishes
      const cx = outW * 0.5 + (panX / 100) * outW;
      const cy = photoH * 0.44 + (panY / 100) * photoH;
      const scale = zoom;
      // Shoulders
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(cx, photoH * 0.92, outW * 0.38 * scale, photoH * 0.28 * scale, 0, Math.PI, 0);
      ctx.fill();
      // Neck & Head
      ctx.fillStyle = '#D9A17C';
      ctx.fillRect(cx - outW * 0.08 * scale, cy + photoH * 0.14 * scale, outW * 0.16 * scale, photoH * 0.18 * scale);
      ctx.beginPath();
      ctx.ellipse(cx, cy, outW * 0.21 * scale, photoH * 0.23 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';

    // Subtle studio backdrop harmonization along top/edges when non-white swatch is chosen
    if (bgTintStrength > 0) {
      const grad = ctx.createRadialGradient(
        outW * 0.5,
        photoH * 0.42,
        Math.min(outW, photoH) * 0.28,
        outW * 0.5,
        photoH * 0.45,
        Math.max(outW, photoH) * 0.72
      );
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, bgHex);
      ctx.save();
      ctx.globalAlpha = Math.min(0.65, bgTintStrength / 100);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, outW, photoH);
      ctx.restore();
    }

    // 3. Draw Exam Name & Date Slate Strip at Bottom of Portrait if enabled
    if (enableNameDateSlate) {
      const stripH = Math.max(28, Math.round(photoH * 0.145));
      const stripY = photoH - stripH;

      ctx.fillStyle = slateStyle === 'white_strip' ? '#FFFFFF' : '#111115';
      ctx.fillRect(0, stripY, outW, stripH);

      ctx.strokeStyle = slateStyle === 'white_strip' ? '#111115' : '#D4AF37';
      ctx.lineWidth = Math.max(1, Math.round(outW / 250));
      ctx.beginPath();
      ctx.moveTo(0, stripY);
      ctx.lineTo(outW, stripY);
      ctx.stroke();

      ctx.fillStyle = slateStyle === 'white_strip' ? '#09090B' : '#FFFFFF';
      const nameFontPx = Math.max(9, Math.round(stripH * 0.38));
      const dateFontPx = Math.max(8, Math.round(stripH * 0.33));

      ctx.font = `bold ${nameFontPx}px Inter, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        (candidateName || 'CANDIDATE NAME').toUpperCase(),
        outW / 2,
        stripY + stripH * 0.34
      );

      ctx.font = `600 ${dateFontPx}px JetBrains Mono, Arial, sans-serif`;
      ctx.fillText(
        `DOP: ${captureDate || 'DD-MM-YYYY'}`,
        outW / 2,
        stripY + stripH * 0.74
      );
    }

    ctx.restore();

    // 4. Draw Integrated Signature Box (3.5 x 1.5 cm) for APPSC / TSPSC if enabled
    if (enableSignatureBox && sigBoxExtraH > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, photoH, outW, sigBoxExtraH);
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = Math.max(1, Math.round(outW / 180));
      ctx.strokeRect(1, photoH + 1, outW - 2, sigBoxExtraH - 2);

      // Cursive-style signature rendering
      ctx.fillStyle = '#0F172A';
      const sigFontPx = Math.max(12, Math.round(sigBoxExtraH * 0.42));
      ctx.font = `italic 600 ${sigFontPx}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(signatureText || candidateName, outW / 2, photoH + sigBoxExtraH * 0.48);

      ctx.fillStyle = '#64748B';
      const labelPx = Math.max(7, Math.round(sigBoxExtraH * 0.16));
      ctx.font = `500 ${labelPx}px Inter, sans-serif`;
      ctx.fillText('CANDIDATE SIGNATURE (3.5 x 1.5 cm)', outW / 2, photoH + sigBoxExtraH * 0.84);
    }

    // 5. Crisp 1px border around single photo
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, outW - 1, outH - 1);

    return canvas;
  }, [
    loadedImage,
    activePreset,
    enableSignatureBox,
    bgHex,
    brightness,
    contrast,
    zoom,
    panX,
    panY,
    bgTintStrength,
    enableNameDateSlate,
    slateStyle,
    candidateName,
    captureDate,
    signatureText,
  ]);

  // Smart Binary-Search KB Compressor + Print Sheet Preview Generator
  useEffect(() => {
    const singleCanvas = renderSinglePhotoCanvas();
    if (!singleCanvas) return;

    // Binary search JPEG quality to fit within targetMaxKb (and above minKb when possible)
    let low = 0.12;
    let high = 0.98;
    let bestUrl = singleCanvas.toDataURL('image/jpeg', 0.9);
    let bestQuality = 0.9;
    let bestKb = Math.round(((bestUrl.length - 23) * 0.75) / 1024);

    for (let i = 0; i < 7; i++) {
      const mid = (low + high) / 2;
      const candidateUrl = singleCanvas.toDataURL('image/jpeg', mid);
      const sizeKb = ((candidateUrl.length - 23) * 0.75) / 1024;
      if (sizeKb <= targetMaxKb) {
        bestUrl = candidateUrl;
        bestQuality = mid;
        bestKb = Math.max(1, Math.round(sizeKb * 10) / 10);
        low = mid; // try higher quality that still fits under targetMaxKb
      } else {
        high = mid;
      }
    }

    setCompressedDataUrl(bestUrl);
    setCompressedSizeKb(bestKb);
    setCompressedQuality(Math.round(bestQuality * 100));

    // Render Print Sheet Preview Canvas (scaled for fast high-DPI preview)
    const sheetCanvas = document.createElement('canvas');
    const previewScale = 0.45; // 45% of 300 DPI for crisp UI preview; full 1.0 used on download
    const sheetW = Math.round(activeSheetLayout.sheetWidthPx300Dpi * previewScale);
    const sheetH = Math.round(activeSheetLayout.sheetHeightPx300Dpi * previewScale);
    sheetCanvas.width = sheetW;
    sheetCanvas.height = sheetH;

    const sCtx = sheetCanvas.getContext('2d');
    if (sCtx) {
      // White studio photo paper
      sCtx.fillStyle = '#FFFFFF';
      sCtx.fillRect(0, 0, sheetW, sheetH);

      const pxPerMm = sheetW / activeSheetLayout.sheetWidthMm;
      const tileW = activePreset.widthMm * pxPerMm;
      const tileH =
        (activePreset.heightMm + (enableSignatureBox ? 15 : 0)) * pxPerMm;
      const gapPx = bleedMm * pxPerMm;

      const cols = activeSheetLayout.columns;
      const rows = activeSheetLayout.rows;
      const totalGridW = cols * tileW + (cols - 1) * gapPx;
      const totalGridH = rows * tileH + (rows - 1) * gapPx;

      const startX = Math.max(12, (sheetW - totalGridW) / 2);
      const startY = Math.max(18, (sheetH - totalGridH) / 2);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (tileW + gapPx);
          const y = startY + r * (tileH + gapPx);

          sCtx.drawImage(singleCanvas, x, y, tileW, tileH);

          // Thin outline around each photo
          sCtx.strokeStyle = '#CBD5E1';
          sCtx.lineWidth = 0.8;
          sCtx.strokeRect(x, y, tileW, tileH);

          // Precision corner crop/cut marks
          if (showCutMarks) {
            const markLen = Math.max(4, gapPx * 0.7);
            sCtx.strokeStyle = '#475569';
            sCtx.lineWidth = 0.9;
            sCtx.beginPath();
            // Top-left
            sCtx.moveTo(x - markLen, y);
            sCtx.lineTo(x - 1, y);
            sCtx.moveTo(x, y - markLen);
            sCtx.lineTo(x, y - 1);
            // Top-right
            sCtx.moveTo(x + tileW + 1, y);
            sCtx.lineTo(x + tileW + markLen, y);
            sCtx.moveTo(x + tileW, y - markLen);
            sCtx.lineTo(x + tileW, y - 1);
            // Bottom-left
            sCtx.moveTo(x - markLen, y + tileH);
            sCtx.lineTo(x - 1, y + tileH);
            sCtx.moveTo(x, y + tileH + 1);
            sCtx.lineTo(x, y + tileH + markLen);
            // Bottom-right
            sCtx.moveTo(x + tileW + 1, y + tileH);
            sCtx.lineTo(x + tileW + markLen, y + tileH);
            sCtx.moveTo(x + tileW, y + tileH + 1);
            sCtx.lineTo(x + tileW, y + tileH + markLen);
            sCtx.stroke();
          }
        }
      }

      // Header metadata strip on print sheet margin
      sCtx.fillStyle = '#334155';
      sCtx.font = '600 10px JetBrains Mono, monospace';
      sCtx.fillText(
        `LUMINA STUDIO 300 DPI LAB SHEET • ${activePreset.name} (${activePreset.physicalLabel}) • ${activeSheetLayout.gridLabel}`,
        14,
        13
      );

      // Canada Back-Stamp footer note if Canada preset is active
      if (activePreset.requiresBackStamp) {
        sCtx.fillStyle = '#0F172A';
        sCtx.font = '600 9px Inter, sans-serif';
        sCtx.fillText(
          `CANADA IRCC BACK-STAMP: ${studioName} | ${studioAddress} | Taken: ${captureDate} | ${guarantorName}`,
          14,
          sheetH - 7
        );
      }

      setSheetPreviewDataUrl(sheetCanvas.toDataURL('image/jpeg', 0.92));
    }
  }, [
    renderSinglePhotoCanvas,
    targetMaxKb,
    activeSheetLayout,
    activePreset,
    enableSignatureBox,
    bleedMm,
    showCutMarks,
    studioName,
    studioAddress,
    captureDate,
    guarantorName,
  ]);

  // Handle uploading user's own portrait to Cloudinary (`dxeuzdwkz` / `Event schedule`)
  const handlePortraitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately show local object URL for zero-latency preview
    const localUrl = URL.createObjectURL(file);
    setPortraitUrl(localUrl);

    try {
      setUploadingSource(true);
      setUploadProgress(10);
      const uploaded = await uploadAssetToCloudinary(
        file,
        'pixelfotos-studio/passport-exam',
        (pct: number) => setUploadProgress(pct)
      );
      setPortraitUrl(uploaded.secureUrl);
      setCloudSaveStatus(`Uploaded source portrait to Cloudinary (${getCloudinaryConfig().cloudName})`);
    } catch {
      setCloudSaveStatus('Using local high-res studio buffer (Cloudinary offline fallback)');
    } finally {
      setUploadingSource(false);
    }
  };

  // Download Single KB-Constrained Exam/Passport Photo
  const handleDownloadSinglePhoto = async () => {
    if (!compressedDataUrl) return;
    const safeId = activePreset.id.replace(/[^a-z0-9_-]/gi, '_');
    const filename = `${safeId}_${activePreset.widthPx300Dpi}x${activePreset.heightPx300Dpi}px_${compressedSizeKb}KB.jpg`;
    await triggerDirectPhotoDownload(compressedDataUrl, filename);
  };

  // Generate Full 300 DPI Print Sheet (1.0x scale) and Download as JPEG or Printable PDF
  const generateFull300DpiSheetDataUrl = (): string => {
    const singleCanvas = renderSinglePhotoCanvas();
    if (!singleCanvas) return sheetPreviewDataUrl;

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = activeSheetLayout.sheetWidthPx300Dpi;
    fullCanvas.height = activeSheetLayout.sheetHeightPx300Dpi;
    const ctx = fullCanvas.getContext('2d');
    if (!ctx) return sheetPreviewDataUrl;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, fullCanvas.width, fullCanvas.height);

    const pxPerMm = fullCanvas.width / activeSheetLayout.sheetWidthMm;
    const tileW = activePreset.widthMm * pxPerMm;
    const tileH =
      (activePreset.heightMm + (enableSignatureBox ? 15 : 0)) * pxPerMm;
    const gapPx = bleedMm * pxPerMm;

    const cols = activeSheetLayout.columns;
    const rows = activeSheetLayout.rows;
    const totalGridW = cols * tileW + (cols - 1) * gapPx;
    const totalGridH = rows * tileH + (rows - 1) * gapPx;

    const startX = Math.max(24, (fullCanvas.width - totalGridW) / 2);
    const startY = Math.max(36, (fullCanvas.height - totalGridH) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (tileW + gapPx);
        const y = startY + r * (tileH + gapPx);
        ctx.drawImage(singleCanvas, x, y, tileW, tileH);

        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, tileW, tileH);

        if (showCutMarks) {
          const markLen = Math.max(8, gapPx * 0.72);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x - markLen, y);
          ctx.lineTo(x - 2, y);
          ctx.moveTo(x, y - markLen);
          ctx.lineTo(x, y - 2);

          ctx.moveTo(x + tileW + 2, y);
          ctx.lineTo(x + tileW + markLen, y);
          ctx.moveTo(x + tileW, y - markLen);
          ctx.lineTo(x + tileW, y - 2);

          ctx.moveTo(x - markLen, y + tileH);
          ctx.lineTo(x - 2, y + tileH);
          ctx.moveTo(x, y + tileH + 2);
          ctx.lineTo(x, y + tileH + markLen);

          ctx.moveTo(x + tileW + 2, y + tileH);
          ctx.lineTo(x + tileW + markLen, y + tileH);
          ctx.moveTo(x + tileW, y + tileH + 2);
          ctx.lineTo(x + tileW, y + tileH + markLen);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 20px JetBrains Mono, monospace';
    ctx.fillText(
      `LUMINA 300 DPI LAB SHEET • ${activePreset.name} (${activePreset.physicalLabel}) • ${activeSheetLayout.gridLabel} • Bleed: ${bleedMm}mm`,
      28,
      26
    );

    if (activePreset.requiresBackStamp) {
      ctx.fillStyle = '#0F172A';
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillText(
        `CANADA IRCC BACK-STAMP: ${studioName} | ${studioAddress} | Taken: ${captureDate} | ${guarantorName}`,
        28,
        fullCanvas.height - 16
      );
    }

    return fullCanvas.toDataURL('image/jpeg', 0.95);
  };

  const handleDownloadPrintSheetJpeg = async () => {
    const fullSheetUrl = generateFull300DpiSheetDataUrl();
    const filename = `PrintSheet_${sheetSize}_${activePreset.id}_${activeSheetLayout.totalPhotos}photos_300DPI.jpg`;
    await triggerDirectPhotoDownload(fullSheetUrl, filename);
  };

  // Save Processed Exam Photo or Print Sheet directly to Cloudinary (`dxeuzdwkz` / `Event schedule`) & Download
  const handleSaveToCloudinaryAndDownload = async (mode: 'single' | 'sheet') => {
    try {
      setSavingToCloud(true);
      setCloudSaveStatus('Uploading 300 DPI master to Cloudinary (dxeuzdwkz)...');
      const dataUrl = mode === 'single' ? compressedDataUrl : generateFull300DpiSheetDataUrl();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filename =
        mode === 'single'
          ? `${activePreset.id}_${compressedSizeKb}KB.jpg`
          : `PrintSheet_${sheetSize}_${activePreset.id}_300DPI.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });
      const uploaded = await uploadAssetToCloudinary(file, 'pixelfotos-studio/passport-exam');
      setCloudSaveStatus(`Saved to Cloudinary (${uploaded.publicId}) & downloading...`);
      await triggerDirectPhotoDownload(uploaded.secureUrl, filename);
    } catch {
      // Fallback to direct local download if offline
      if (mode === 'single') {
        await handleDownloadSinglePhoto();
      } else {
        await handleDownloadPrintSheetJpeg();
      }
      setCloudSaveStatus('Downloaded directly to device (local 300 DPI buffer).');
    } finally {
      setSavingToCloud(false);
    }
  };

  // Pointer drag handlers for interactive biometric crop canvas
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanX(Math.max(-45, Math.min(45, Math.round(dragStartRef.current.panX + dx * 0.22))));
    setPanY(Math.max(-45, Math.min(45, Math.round(dragStartRef.current.panY + dy * 0.22))));
  };

  const handleCanvasPointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 pb-28">
      {/* Top Studio Header Bar */}
      <div className="border-b border-amber-500/20 bg-[#0B0B0F]/95 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ICAO 300 DPI Biometric Lab
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                Cloudinary: {getCloudinaryConfig().cloudName}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white mt-1">
              Official ID, Passport &amp; Exam Photo Studio + Print Sheet Generator
            </h1>
            <p className="text-xs text-zinc-400">
              India Passports, PAN, UPSC, SSC, State PSCs &amp; 32+ Global Visa Standards with Biometric Eye-Line Guides, Name-Date Slate &amp; 300 DPI Lab Tiling
            </p>
          </div>

          {/* Primary Mode Switcher (Studio Workbench vs Official Size Reference Guide) */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setStudioViewMode('workbench')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                studioViewMode === 'workbench'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              Interactive Studio Workbench
            </button>
            <button
              type="button"
              onClick={() => setStudioViewMode('reference_guide')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                studioViewMode === 'reference_guide'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              Official Size Reference Guide (5 Tables)
            </button>
          </div>
        </div>

        {/* MOBILE-ONLY STEP DRAWER BAR (Tailored Touch-Friendly Mobile Workflow) */}
        {studioViewMode === 'workbench' && (
          <div className="lg:hidden border-t border-zinc-800/80 px-3 py-2 bg-[#09090D] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'presets', label: '1. Presets (32+)' },
              { id: 'crop_slate', label: '2. Biometric Crop & Slate' },
              { id: 'print_sheet', label: '3. Print Sheet & KB' },
              { id: 'reference', label: '4. Size Guide' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'reference') {
                    setStudioViewMode('reference_guide');
                  } else {
                    setMobileStep(tab.id as 'presets' | 'crop_slate' | 'print_sheet');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  mobileStep === tab.id
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODE A: INTERACTIVE STUDIO WORKBENCH (SPLIT DESKTOP / STEPPED MOBILE)
         ===================================================================== */}
      {studioViewMode === 'workbench' ? (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          {/* Active Preset Summary Banner */}
          <div className="mb-6 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-[#111118] via-[#15141D] to-[#111118] p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activePreset.authorityOrCountry}
                </span>
                <span className="text-xs font-mono text-zinc-300 bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800">
                  Physical: <strong className="text-amber-300">{activePreset.physicalLabel}</strong>
                </span>
                <span className="text-xs font-mono text-zinc-300 bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800">
                  300 DPI: <strong className="text-emerald-300">{activePreset.digitalResolutionLabel}</strong>
                </span>
                <span className="text-xs font-mono text-zinc-300 bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800">
                  KB Limit: <strong className="text-amber-300">{activePreset.kbLimitLabel}</strong>
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-white">{activePreset.name}</h2>
              <p className="text-xs text-zinc-400">
                <span className="text-zinc-200 font-medium">Rules:</span> {activePreset.backgroundRule} •{' '}
                {activePreset.faceCoverageRule}. {activePreset.specialNotes}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs cursor-pointer transition-all">
                {uploadingSource ? `Uploading (${uploadProgress}%)...` : 'Upload Client Portrait'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePortraitFileUpload}
                  className="hidden"
                />
              </label>
              {SAMPLE_PORTRAITS.map((sample, idx) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => setPortraitUrl(sample.url)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-all cursor-pointer ${
                    portraitUrl === sample.url
                      ? 'border-amber-500 bg-amber-500/15 text-amber-200'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Sample {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Split Desktop Workbench (12 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1 (LEFT 4 COLS): SEARCHABLE CATEGORY & PRESET SELECTOR */}
            <div
              className={`lg:col-span-4 space-y-5 ${
                mobileStep !== 'presets' ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="rounded-2xl border border-zinc-800/90 bg-[#0D0D12] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                    1. Official Preset Database ({filteredPresets.length})
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">300 DPI Calibrated</span>
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Passport, PAN, UPSC, SSC, Kerala PSC, USA, UK, Canada..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />

                {/* Category Filter Tabs */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'All Categories (28)' },
                    { id: 'india_national_id', label: 'India IDs & Passports' },
                    { id: 'india_exams_psc', label: 'UPSC / SSC / State PSC' },
                    { id: 'international_passport_visa', label: 'Global Passports & Visas' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as PresetCategoryId | 'all')}
                      className={`px-2.5 py-2 rounded-lg text-[11px] font-medium text-left truncate transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                          : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Scrollable Preset List */}
                <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
                  {filteredPresets.map((preset) => {
                    const isSelected = preset.id === activePreset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          handleSelectPreset(preset);
                          setMobileStep('crop_slate');
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/12 shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                            : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-white leading-snug">
                            {preset.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-amber-300 border border-amber-500/30 shrink-0">
                            {preset.widthMm}x{preset.heightMm}mm
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                          <span>{preset.digitalResolutionLabel}</span>
                          <span>•</span>
                          <span className="text-emerald-300">{preset.kbLimitLabel}</span>
                          {preset.requiresNameDateSlate && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                              +Name/Date Slate
                            </span>
                          )}
                          {preset.supportsSignatureBox && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200">
                              +Signature Box
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUMN 2 (CENTER 4 COLS): BIOMETRIC CROP CANVAS, BACKGROUND SWATCHES & SLATE TOOLS */}
            <div
              className={`lg:col-span-4 space-y-5 ${
                mobileStep !== 'crop_slate' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Biometric Crop & Eye-Line Overlay Workbench */}
              <div className="rounded-2xl border border-zinc-800/90 bg-[#0D0D12] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                      2. Biometric Crop &amp; Eye-Line Guide
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Drag portrait to align crown &amp; eye-line within official biometric bands
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBiometricOverlay((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border cursor-pointer transition-all ${
                      showBiometricOverlay
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {showBiometricOverlay ? 'Guides: ON' : 'Guides: OFF'}
                  </button>
                </div>

                {/* Interactive Crop Canvas Viewport */}
                <div
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerLeave={handleCanvasPointerUp}
                  className="relative mx-auto rounded-xl overflow-hidden border-2 border-amber-500/40 bg-zinc-950 select-none touch-none cursor-grab active:cursor-grabbing shadow-2xl"
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    aspectRatio: `${activePreset.widthMm} / ${
                      activePreset.heightMm + (enableSignatureBox ? 15 : 0)
                    }`,
                  }}
                >
                  {compressedDataUrl ? (
                    <img
                      src={compressedDataUrl}
                      alt={activePreset.name}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                      Rendering 300 DPI Biometric Canvas...
                    </div>
                  )}

                  {/* SVG Biometric Head & Eye-Line Overlay Guide */}
                  {showBiometricOverlay && (
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      {/* Top Crown Margin Line */}
                      <line
                        x1="5"
                        y1={activeBiometricSpec.crownTopRatio * 100}
                        x2="95"
                        y2={activeBiometricSpec.crownTopRatio * 100}
                        stroke="#10B981"
                        strokeWidth="0.6"
                        strokeDasharray="2,1.5"
                      />
                      <text
                        x="7"
                        y={activeBiometricSpec.crownTopRatio * 100 - 1.5}
                        fill="#10B981"
                        fontSize="3.2"
                        fontFamily="monospace"
                      >
                        CROWN TOP ({activeBiometricSpec.topMarginMm})
                      </text>

                      {/* Eye-Line Horizontal Band */}
                      <rect
                        x="8"
                        y={activeBiometricSpec.eyeLineRatioFromTop * 100 - 3}
                        width="84"
                        height="6"
                        fill="rgba(212, 175, 55, 0.14)"
                        stroke="#D4AF37"
                        strokeWidth="0.5"
                        strokeDasharray="1.5,1.5"
                      />
                      <line
                        x1="0"
                        y1={activeBiometricSpec.eyeLineRatioFromTop * 100}
                        x2="100"
                        y2={activeBiometricSpec.eyeLineRatioFromTop * 100}
                        stroke="#F59E0B"
                        strokeWidth="0.7"
                      />
                      <text
                        x="7"
                        y={activeBiometricSpec.eyeLineRatioFromTop * 100 - 1}
                        fill="#FBBF24"
                        fontSize="3.1"
                        fontFamily="monospace"
                      >
                        EYE LINE ({activeBiometricSpec.eyeLineFromBottomMm})
                      </text>

                      {/* Chin Bottom Line */}
                      <line
                        x1="5"
                        y1={activeBiometricSpec.chinBottomRatio * 100}
                        x2="95"
                        y2={activeBiometricSpec.chinBottomRatio * 100}
                        stroke="#10B981"
                        strokeWidth="0.6"
                        strokeDasharray="2,1.5"
                      />
                      <text
                        x="7"
                        y={activeBiometricSpec.chinBottomRatio * 100 + 3.8}
                        fill="#10B981"
                        fontSize="3.2"
                        fontFamily="monospace"
                      >
                        CHIN BASE ({activeBiometricSpec.headHeightMm})
                      </text>

                      {/* Vertical Center Axis */}
                      <line
                        x1="50"
                        y1="4"
                        x2="50"
                        y2="90"
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth="0.4"
                        strokeDasharray="1.5,1.5"
                      />

                      {/* Biometric Head Oval */}
                      <ellipse
                        cx="50"
                        cy={
                          ((activeBiometricSpec.crownTopRatio +
                            activeBiometricSpec.chinBottomRatio) /
                            2) *
                          100
                        }
                        rx={(activeBiometricSpec.headWidthRatio * 100) / 2}
                        ry={
                          ((activeBiometricSpec.chinBottomRatio -
                            activeBiometricSpec.crownTopRatio) /
                            2) *
                          100
                        }
                        fill="none"
                        stroke="#D4AF37"
                        strokeWidth="0.75"
                        strokeDasharray="2.5,1.5"
                      />
                    </svg>
                  )}
                </div>

                {/* Biometric Tolerance Spec Callout */}
                <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 p-3 text-[11px] space-y-1">
                  <div className="font-semibold text-amber-300">{activeBiometricSpec.title}</div>
                  <div className="grid grid-cols-2 gap-2 text-zinc-400 font-mono text-[10px]">
                    <div>Head Height: {activeBiometricSpec.headHeightMm}</div>
                    <div>Top Margin: {activeBiometricSpec.topMarginMm}</div>
                  </div>
                  {activePreset.prohibitsGlasses && (
                    <div className="text-rose-400 font-medium pt-0.5">
                      Strict Rule: Eyeglasses / spectacles are strictly prohibited for this preset.
                    </div>
                  )}
                </div>

                {/* Zoom, Pan, Brightness & Contrast Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Zoom Scale</span>
                      <span className="font-mono text-amber-300">{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="220"
                      value={Math.round(zoom * 100)}
                      onChange={(e) => setZoom(Number(e.target.value) / 100)}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Vertical Pan</span>
                      <span className="font-mono text-amber-300">{panY}%</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={panY}
                      onChange={(e) => setPanY(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Studio Brightness</span>
                      <span className="font-mono text-zinc-300">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="135"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Studio Contrast</span>
                      <span className="font-mono text-zinc-300">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="135"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                {/* Official Background Swatch Selector */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">
                      Official Background Swatch Selector
                    </span>
                    <span className="text-[11px] font-mono text-amber-300">{bgHex}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {OFFICIAL_BACKGROUND_SWATCHES.map((swatch) => {
                      const isActive = bgHex.toUpperCase() === swatch.hex.toUpperCase();
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => setBgHex(swatch.hex)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isActive
                              ? 'border-amber-500 bg-amber-500/15 text-white'
                              : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-zinc-600 shrink-0"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium truncate">{swatch.name}</div>
                            <div className="text-[9px] font-mono text-zinc-500">{swatch.hex}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Backdrop Edge Fill Harmonization</span>
                      <span className="font-mono text-zinc-300">{bgTintStrength}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="65"
                      value={bgTintStrength}
                      onChange={(e) => setBgTintStrength(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                {/* Exam Name & Date Slate Strip Generator (UPSC, SSC, Kerala PSC, TNPSC, NEET) */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        Exam Name &amp; Date Slate Strip (UPSC / SSC / PSC / NEET)
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Prints Candidate Name &amp; Date of Photo at the bottom of the portrait
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableNameDateSlate}
                      onChange={(e) => setEnableNameDateSlate(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {enableNameDateSlate && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Candidate Full Name
                        </label>
                        <input
                          type="text"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="e.g. AARAV SHARMA"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Photo Capture Date (DOP)
                        </label>
                        <input
                          type="text"
                          value={captureDate}
                          onChange={(e) => setCaptureDate(e.target.value)}
                          placeholder="DD-MM-YYYY"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSlateStyle('white_strip')}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer ${
                            slateStyle === 'white_strip'
                              ? 'border-amber-500 bg-white text-black font-semibold'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          White Slate Strip (Black Text)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlateStyle('black_strip')}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer ${
                            slateStyle === 'black_strip'
                              ? 'border-amber-500 bg-zinc-950 text-amber-300 font-semibold'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          Black Slate Strip (White Text)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Integrated Signature Box (3.5 x 1.5 cm) for APPSC / TSPSC */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        Integrated Signature Box (3.5 x 1.5 cm — APPSC / TSPSC)
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Attaches signed white box directly below portrait
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableSignatureBox}
                      onChange={(e) => setEnableSignatureBox(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </div>
                  {enableSignatureBox && (
                    <input
                      type="text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Type signature text..."
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-serif italic"
                    />
                  )}

                  {/* Canada IRCC Back-Stamp Note Editor */}
                  {activePreset.requiresBackStamp && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="text-xs font-semibold text-amber-300">
                        Canada IRCC Mandatory Back-Stamp Note (50 x 70 mm)
                      </div>
                      <input
                        type="text"
                        value={studioName}
                        onChange={(e) => setStudioName(e.target.value)}
                        placeholder="Studio Name"
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={studioAddress}
                        onChange={(e) => setStudioAddress(e.target.value)}
                        placeholder="Studio Address"
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3 (RIGHT 4 COLS): STUDIO PRINT SHEET TILER & SMART KB COMPRESSOR */}
            <div
              className={`lg:col-span-4 space-y-5 ${
                mobileStep !== 'print_sheet' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Smart KB Compressor & Single Exam Photo Export */}
              <div className="rounded-2xl border border-zinc-800/90 bg-[#0D0D12] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                      3. Smart KB Compressor (sRGB JPEG)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Auto-constrains file size to exam portal KB limits
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {compressedSizeKb} KB
                    </span>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Quality: {compressedQuality}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-zinc-300 mb-1">
                    <span>Target Maximum File Size Limit</span>
                    <span className="font-mono text-amber-300">
                      Max {targetMaxKb} KB (Rule: {activePreset.kbLimitLabel})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="500"
                    step="5"
                    value={targetMaxKb}
                    onChange={(e) => setTargetMaxKb(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadSinglePhoto}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all cursor-pointer"
                  >
                    Download Digital JPEG ({compressedSizeKb} KB)
                  </button>
                  <button
                    type="button"
                    disabled={savingToCloud}
                    onClick={() => handleSaveToCloudinaryAndDownload('single')}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-all cursor-pointer"
                  >
                    {savingToCloud ? 'Saving...' : 'Save to Cloudinary & Download'}
                  </button>
                </div>
              </div>

              {/* Studio Print Sheet Tiler (4x6 in, 5x7 in, A4 Sheet) */}
              <div className="rounded-2xl border border-zinc-800/90 bg-[#0D0D12] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                      4. 300 DPI Studio Print Sheet Generator
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Automated lab tiling with {bleedMm} mm cutting bleed &amp; crop marks
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                    {activeSheetLayout.gridLabel}
                  </span>
                </div>

                {/* Sheet Size Selector Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: '4x6_in', label: '4x6 in (102x152mm)' },
                      { id: '5x7_in', label: '5x7 in (127x178mm)' },
                      { id: 'a4_sheet', label: 'A4 (210x297mm)' },
                    ] as const
                  ).map((s) => {
                    const layoutForBtn = resolvePrintSheetLayout(activePreset, s.id);
                    const isSelected = sheetSize === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSheetSize(s.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 text-white'
                            : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">{s.label.split(' ')[0]} Sheet</div>
                        <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                          {layoutForBtn.gridLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Print Sheet Preview Image */}
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 flex flex-col items-center justify-center">
                  {sheetPreviewDataUrl ? (
                    <img
                      src={sheetPreviewDataUrl}
                      alt="300 DPI Print Sheet Preview"
                      className="max-h-[280px] w-auto object-contain rounded shadow-lg border border-zinc-700"
                    />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-xs text-zinc-500">
                      Generating print sheet layout...
                    </div>
                  )}
                  <div className="mt-2 text-[11px] font-mono text-zinc-400 text-center">
                    {activeSheetLayout.sheetName} • {activeSheetLayout.totalPhotos} Copies (
                    {activeSheetLayout.columns} cols × {activeSheetLayout.rows} rows) •{' '}
                    {activeSheetLayout.sheetWidthPx300Dpi}×{activeSheetLayout.sheetHeightPx300Dpi} px
                  </div>
                </div>

                {/* Bleed & Cut Marks Controls */}
                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Cutting Bleed Spacing</span>
                      <span className="font-mono text-amber-300">{bleedMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="4.0"
                      step="0.5"
                      value={bleedMm}
                      onChange={(e) => setBleedMm(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-3">
                    <input
                      type="checkbox"
                      checked={showCutMarks}
                      onChange={(e) => setShowCutMarks(e.target.checked)}
                      className="accent-amber-500"
                    />
                    Cut Marks
                  </label>
                </div>

                {/* Print Sheet Export Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadPrintSheetJpeg}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold text-xs shadow-lg cursor-pointer"
                  >
                    Download {sheetSize.replace('_', ' ').toUpperCase()} Sheet (300 DPI)
                  </button>
                  <button
                    type="button"
                    disabled={savingToCloud}
                    onClick={() => handleSaveToCloudinaryAndDownload('sheet')}
                    className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-500/35 font-semibold text-xs cursor-pointer"
                  >
                    Cloud Save &amp; Download Sheet
                  </button>
                </div>

                {cloudSaveStatus && (
                  <div className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2">
                    {cloudSaveStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =====================================================================
           MODE B: INTERACTIVE "OFFICIAL SIZE REFERENCE GUIDE" TAB (5 TABLES)
           Sleek scannable cards on Mobile, structured reference tables on Desktop
           ===================================================================== */
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-8">
          {/* Table 1, 2, 3: All 3 Official Categories */}
          {(
            [
              {
                category: 'india_national_id',
                title:
                  'Table 1: India National Identity, Passports & Core Government Services (300 DPI)',
                subtitle:
                  'Passport Seva, VFS, OCI Card, NSDL/UTIITSL PAN Card, EPIC Voter ID, Parivahan RTO, Stamp & NEET Postcard',
              },
              {
                category: 'india_exams_psc',
                title:
                  'Table 2: India State-Wise Public Service Commissions & National Exams (UPSC, SSC, IBPS, RRB, PSCs)',
                subtitle:
                  '35 x 45 mm physical print size with exact online pixel resolutions, KB limits, Name-Date slate & Signature Box rules',
              },
              {
                category: 'international_passport_visa',
                title:
                  'Table 3: International Passport & Visa Photo Sizes (USA, UK, Schengen, Canada, UAE, China, SE Asia)',
                subtitle:
                  'ICAO 35x45 mm, 2x2 inch Square, Canada 50x70 mm Back-Stamp, China 33x48 mm & Country-Specific Background Swatches',
              },
            ] as const
          ).map((section) => {
            const rows = PHOTO_STUDIO_PRESETS.filter((p) => p.category === section.category);
            return (
              <div
                key={section.category}
                className="rounded-2xl border border-zinc-800 bg-[#0D0D12] overflow-hidden"
              >
                <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-amber-300">
                      {section.title}
                    </h2>
                    <p className="text-xs text-zinc-400">{section.subtitle}</p>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {rows.length} Official Presets
                  </span>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/70 text-[11px] font-mono uppercase text-zinc-400">
                        <th className="py-3 px-4">Document / Exam / Country</th>
                        <th className="py-3 px-4">Physical Size</th>
                        <th className="py-3 px-4">300 DPI / Online Pixels</th>
                        <th className="py-3 px-4">KB Limit</th>
                        <th className="py-3 px-4">Background &amp; Framing Rules</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {rows.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-900/40">
                          <td className="py-3 px-4 font-semibold text-white">
                            <div>{item.name}</div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              {item.authorityOrCountry}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-amber-300">
                            {item.physicalLabel}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-300">
                            {item.digitalResolutionLabel}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-200">
                            {item.kbLimitLabel}
                          </td>
                          <td className="py-3 px-4 text-zinc-300 max-w-md">
                            <div>
                              <span className="font-medium text-white">{item.backgroundRule}:</span>{' '}
                              {item.faceCoverageRule}
                            </div>
                            {item.slateRuleNote && (
                              <div className="text-[11px] text-amber-300 mt-0.5">
                                {item.slateRuleNote}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectPreset(item);
                                setStudioViewMode('workbench');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-semibold text-[11px] transition-all cursor-pointer"
                            >
                              Load in Studio
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-zinc-800">
                  {rows.map((item) => (
                    <div key={item.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-white">{item.name}</div>
                          <div className="text-[11px] font-mono text-zinc-400">
                            {item.authorityOrCountry}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPreset(item);
                            setStudioViewMode('workbench');
                            setMobileStep('crop_slate');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-[11px] shrink-0"
                        >
                          Use Preset
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-amber-300">
                          {item.physicalLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-emerald-300">
                          {item.digitalResolutionLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-200">
                          {item.kbLimitLabel}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {item.backgroundRule} • {item.faceCoverageRule}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Table 4: Biometric Head & Eye-Line Overlay Tolerances */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0D0D12] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-300">
                Table 4: Biometric Head &amp; Eye-Line Overlay Tolerances
              </h2>
              <p className="text-xs text-zinc-400">
                Exact millimeter crown-to-chin and eye-line calibration used by the interactive studio overlay
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              {Object.values(BIOMETRIC_TOLERANCE_SPECS).map((spec) => (
                <div
                  key={spec.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-2"
                >
                  <div className="text-xs font-mono text-amber-300">{spec.dimensionsMm}</div>
                  <div className="text-sm font-semibold text-white">{spec.title}</div>
                  <div className="text-xs text-zinc-300 space-y-1 font-mono">
                    <div>Head Height: {spec.headHeightMm}</div>
                    <div>Eye-Line: {spec.eyeLineFromBottomMm}</div>
                    <div>Top Margin: {spec.topMarginMm}</div>
                  </div>
                  <p className="text-[11px] text-zinc-400">{spec.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Table 5: Studio Print Sheet Capacities (4x6 in, 5x7 in, A4 Sheet) */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0D0D12] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-300">
                Table 5: Automated Studio Print Sheet Tiling Capacities (with 2–3 mm Cutting Bleed)
              </h2>
              <p className="text-xs text-zinc-400">
                Exact grid layouts across 4x6 in (102x152 mm), 5x7 in (127x178 mm), and A4 (210x297 mm)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-[11px] font-mono uppercase text-zinc-400">
                    <th className="py-3 px-4">Photo Size Standard</th>
                    <th className="py-3 px-4">4x6 in (102 x 152 mm)</th>
                    <th className="py-3 px-4">5x7 in (127 x 178 mm)</th>
                    <th className="py-3 px-4">A4 Sheet (210 x 297 mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70 font-mono">
                  {PRINT_SHEET_CAPACITY_RULES.map((rule) => (
                    <tr key={rule.tileGroup} className="hover:bg-zinc-900/40">
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {rule.photoSizeLabel}
                      </td>
                      <td className="py-3 px-4 text-amber-300">
                        {rule.sheets['4x6_in'].gridLabel}
                      </td>
                      <td className="py-3 px-4 text-emerald-300">
                        {rule.sheets['5x7_in'].gridLabel}
                      </td>
                      <td className="py-3 px-4 text-sky-300">
                        {rule.sheets.a4_sheet.gridLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassportExamPhotoStudio;
