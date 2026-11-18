import React, { useMemo, useRef, useState } from 'react';
import {
  Archive,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Download,
  EyeOff,
  FileImage,
  FolderUp,
  Layers,
  Loader2,
  RotateCcw,
  ScanSearch,
  Sparkles,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { PIXELFOTOS_ASSETS } from '../../data/pixelfotosData';
import { triggerDirectDownload } from '../../lib/cloudinary';
import {
  analyzeImageOnCanvas,
  clusterAndFlagDuplicates,
  exportSelectedPhotosAsZip,
  fileToDataUrl,
} from '../../lib/imageCullingEngine';
import { CullingTag, ShootPhoto } from '../../types/pixelfotos';
import { MediaFrame } from '../shared/MediaFrame';

type CullingFilter = 'all' | 'ai_selected' | 'grouped_poses' | 'closed_eyes' | 'blurry';

interface DriveUploadItem {
  id: string;
  fileName: string;
  sizeLabel: string;
  status: 'queued' | 'uploading' | 'completed';
  sharpness?: number;
}

interface DriveUploadTrackerState {
  active: boolean;
  minimized: boolean;
  completed: boolean;
  totalSelected: number;
  uploadedCount: number;
  remainingCount: number;
  progressPercent: number;
  currentFileName: string;
  items: DriveUploadItem[];
}

const TAG_LABELS: Record<CullingTag, string> = {
  best_pick: 'Sharp Best Pick',
  closed_eyes: 'Exposure / Eye Check',
  blurry: 'Low Laplacian Sharpness',
  duplicate: 'Similar Burst Duplicate',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const pauseFrame = (ms = 90) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const Module1AICulling: React.FC = () => {
  const {
    photos,
    setPhotos,
    addPhotos,
    toggleAiSelected,
    updatePhotoRating,
    resetSampleBatch,
  } = usePixelFotos();

  const [filter, setFilter] = useState<CullingFilter>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [cullNotice, setCullNotice] = useState<string | null>(null);
  const [uploadTracker, setUploadTracker] = useState<DriveUploadTrackerState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const counts = useMemo(() => {
    return {
      all: photos.length,
      aiSelected: photos.filter((p) => p.aiSelected).length,
      closedEyes: photos.filter((p) => p.cullingTag === 'closed_eyes').length,
      blurry: photos.filter((p) => p.cullingTag === 'blurry').length,
      clusters: new Set(photos.map((p) => p.poseClusterId)).size,
    };
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (filter === 'ai_selected') return photos.filter((p) => p.aiSelected);
    if (filter === 'closed_eyes') return photos.filter((p) => p.cullingTag === 'closed_eyes');
    if (filter === 'blurry') return photos.filter((p) => p.cullingTag === 'blurry');
    return photos;
  }, [photos, filter]);

  const groupedClusters = useMemo(() => {
    const map = new Map<string, ShootPhoto[]>();
    filteredPhotos.forEach((p) => {
      const existing = map.get(p.poseClusterId) || [];
      existing.push(p);
      map.set(p.poseClusterId, existing);
    });
    return Array.from(map.entries());
  }, [filteredPhotos]);

  const processIncomingFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const total = files.length;

    const initialItems: DriveUploadItem[] = files.map((f, i) => ({
      id: `up_item_${Date.now()}_${i}`,
      fileName: f.name,
      sizeLabel: formatFileSize(f.size || 3400000),
      status: i === 0 ? 'uploading' : 'queued',
    }));

    setAnalyzing(true);
    setUploadTracker({
      active: true,
      minimized: false,
      completed: false,
      totalSelected: total,
      uploadedCount: 0,
      remainingCount: total,
      progressPercent: 0,
      currentFileName: files[0]?.name || '',
      items: initialItems,
    });
    setCullNotice(null);

    try {
      const analyzed: ShootPhoto[] = [];

      for (let idx = 0; idx < total; idx++) {
        const file = files[idx];
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const isRawExt = /\.(cr3|cr2|nef|arw|dng|raf|orf)$/i.test(file.name);
        const fallbackUrl =
          idx % 4 === 0
            ? PIXELFOTOS_ASSETS.heroRoyalWedding
            : idx % 4 === 1
            ? PIXELFOTOS_ASSETS.weddingHaldi
            : idx % 4 === 2
            ? PIXELFOTOS_ASSETS.weddingBridal
            : PIXELFOTOS_ASSETS.weddingSangeet;

        setUploadTracker((prev) =>
          prev
            ? {
                ...prev,
                currentFileName: file.name,
                items: prev.items.map((item, i) =>
                  i === idx ? { ...item, status: 'uploading' } : item
                ),
              }
            : null
        );

        await pauseFrame(75);

        const dataUrl =
          file.type.startsWith('image/') && !isRawExt
            ? await fileToDataUrl(file)
            : fallbackUrl;

        const metrics = await analyzeImageOnCanvas(dataUrl);

        analyzed.push({
          id: `cull_${Date.now()}_${idx}`,
          fileName: isRawExt ? `${baseName}.jpg` : file.name,
          rawFileName: isRawExt ? file.name : `${baseName}.CR3`,
          url: dataUrl,
          eventSection:
            idx % 4 === 0
              ? 'Wedding'
              : idx % 4 === 1
              ? 'Haldi'
              : idx % 4 === 2
              ? 'Portraits'
              : 'Sangeet',
          poseClusterId: 'Analyzing...',
          cullingTag: metrics.suggestedTag,
          confidenceScore: metrics.confidenceScore,
          sharpnessScore: metrics.sharpnessScore,
          brightnessScore: metrics.brightnessScore,
          contrastScore: metrics.contrastScore,
          dHash: metrics.dHash,
          starRating: metrics.starRating,
          aiSelected: metrics.aiSelected,
          guestLiked: false,
          likesCount: 0,
          faceMatchClusters: ['guest_ananya'],
          cameraModel: isRawExt ? 'RAW Import' : 'Uploaded Frame',
          exifSummary: `${metrics.width}×${metrics.height}px · Luma ${metrics.brightnessScore}% · Contrast ${metrics.contrastScore}%`,
          capturedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        const uploaded = idx + 1;
        const remaining = Math.max(0, total - uploaded);
        const pct = Math.round((uploaded / total) * 100);

        setUploadTracker((prev) =>
          prev
            ? {
                ...prev,
                uploadedCount: uploaded,
                remainingCount: remaining,
                progressPercent: pct,
                completed: uploaded === total,
                items: prev.items.map((item, i) =>
                  i === idx
                    ? { ...item, status: 'completed', sharpness: metrics.sharpnessScore }
                    : i === idx + 1
                    ? { ...item, status: 'uploading' }
                    : item
                ),
              }
            : null
        );

        await pauseFrame(55);
      }

      const clustered = clusterAndFlagDuplicates(analyzed);
      addPhotos(clustered);
      const bestCount = clustered.filter((c) => c.aiSelected).length;
      const blurryCount = clustered.filter((c) => c.cullingTag === 'blurry').length;
      setCullNotice(
        `Uploaded & analyzed ${clustered.length} wedding photo(s): ${bestCount} Best Picks auto-selected, ${blurryCount} low-sharpness flagged.`
      );
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSimulateBulkWeddingUpload = async () => {
    if (analyzing) return;
    const sampleNames = [
      'PF_WED_101_BridalEntry.jpg',
      'PF_WED_102_VarmalaPetalShower.jpg',
      'PF_WED_103_MandapRituals.jpg',
      'PF_WED_104_HaldiLaughter.jpg',
      'PF_WED_105_CoupleSunsetArch.jpg',
      'PF_WED_106_SangeetSpotlight.jpg',
    ];
    const syntheticFiles = sampleNames.map(
      (name) => new File(['wedding-frame'], name, { type: 'application/octet-stream' })
    );
    await processIncomingFiles(syntheticFiles);
  };

  const handleAnalyzeExistingBatch = async () => {
    setAnalyzing(true);
    setCullNotice('Computing real Laplacian variance, brightness, contrast & dHash across batch...');
    try {
      const updatedList: ShootPhoto[] = [];
      for (const photo of photos) {
        try {
          const metrics = await analyzeImageOnCanvas(photo.url);
          updatedList.push({
            ...photo,
            sharpnessScore: metrics.sharpnessScore,
            brightnessScore: metrics.brightnessScore,
            contrastScore: metrics.contrastScore,
            dHash: metrics.dHash,
            cullingTag: metrics.suggestedTag,
            confidenceScore: metrics.confidenceScore,
            starRating: metrics.starRating,
            aiSelected: metrics.aiSelected,
          });
        } catch {
          updatedList.push(photo);
        }
      }
      const clustered = clusterAndFlagDuplicates(updatedList);
      setPhotos(clustered);
      setCullNotice(
        `Re-scored ${clustered.length} photos via pixel Laplacian kernel · ${
          clustered.filter((p) => p.aiSelected).length
        } high-score picks selected.`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadSelectedZip = async () => {
    const selected = photos.filter((p) => p.aiSelected);
    if (selected.length === 0) {
      setCullNotice('No photos currently selected. Pick at least 1 photo first.');
      return;
    }
    setZipping(true);
    try {
      const count = await exportSelectedPhotosAsZip(
        selected,
        `PixelFotos_BestPicks_${selected.length}.zip`
      );
      setCullNotice(`Packaged & downloaded ${count} high-score photo(s) as .ZIP archive.`);
    } finally {
      setZipping(false);
    }
  };

  const handleExportCsvShortlist = async () => {
    const selected = photos.filter((p) => p.aiSelected);
    const csvRows = [
      'FileName,RAWOriginal,PoseCluster,SharpnessPct,BrightnessPct,ContrastPct,Rating,Status',
      ...selected.map(
        (p) =>
          `"${p.fileName}","${p.rawFileName}","${p.poseClusterId}",${p.sharpnessScore ?? 85}%,${
            p.brightnessScore ?? 50
          }%,${p.contrastScore ?? 70}%,${p.starRating},${TAG_LABELS[p.cullingTag]}`
      ),
    ].join('\n');
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows)}`;
    await triggerDirectDownload(dataUri, `PixelFotos_Culling_Shortlist_${selected.length}.csv`);
    setCullNotice(`Exported ${selected.length} selected picks metadata to CSV.`);
  };

  const renderPhotoCard = (photo: ShootPhoto) => (
    <div
      key={photo.id}
      className="group liquid-glass rounded-[22px] overflow-hidden hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3]">
        <MediaFrame src={photo.url} alt={photo.fileName} className="w-full h-full" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
        <button
          type="button"
          onClick={() => toggleAiSelected(photo.id)}
          className={`absolute top-3 right-3 min-h-[34px] px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer backdrop-blur-md ${
            photo.aiSelected
              ? 'bg-[#10B981] text-[#090B10] shadow-sm'
              : 'bg-black/60 text-white border border-white/20 hover:bg-black/80'
          }`}
        >
          <Check className="w-3 h-3" />
          <span>{photo.aiSelected ? 'Selected' : 'Pick'}</span>
        </button>
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white font-mono tabular-nums">
          <span className="truncate">{photo.rawFileName}</span>
          <span className="text-[#D4AF37] shrink-0">
            Sharp {photo.sharpnessScore ?? photo.confidenceScore}%
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate text-zinc-900 dark:text-white">
            {photo.fileName}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            {TAG_LABELS[photo.cullingTag]} · {photo.poseClusterId}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums">
            Luma {photo.brightnessScore ?? 52}% · Contrast {photo.contrastScore ?? 72}%
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-black/8 dark:border-white/8">
          <div className="flex items-center gap-1" aria-label="Star Rating">
            {([1, 2, 3, 4, 5] as const).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => updatePhotoRating(photo.id, star)}
                aria-label={`Rate ${star} stars`}
                className="p-1 cursor-pointer"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    star <= photo.starRating
                      ? 'fill-[#D4AF37] text-[#D4AF37]'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
            Score {photo.confidenceScore}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
            Module 01 · Google Drive-Style Bulk Upload &amp; AI Photo Culling
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-0.5">
            AI Photo Culling &amp; Bulk Upload Studio
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Upload bulk wedding photos with a real-time Google Drive-style progress tracker, automatic Laplacian blur detection, duplicate clustering, and 1-click ZIP export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={analyzing}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] active:scale-[0.98] transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{analyzing ? 'Uploading Batch...' : 'Bulk Upload Photos'}</span>
          </button>
          <button
            type="button"
            disabled={analyzing}
            onClick={handleSimulateBulkWeddingUpload}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-medium liquid-glass-subtle hover:border-[#D4AF37] transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <FolderUp className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Demo 6-Photo Batch Upload</span>
          </button>
          <button
            type="button"
            disabled={analyzing}
            onClick={handleAnalyzeExistingBatch}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-medium liquid-glass-subtle hover:border-[#D4AF37] transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ScanSearch className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Re-Scan Batch</span>
          </button>
          <button
            type="button"
            disabled={zipping}
            onClick={handleDownloadSelectedZip}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 active:scale-[0.98] transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{zipping ? 'Building ZIP...' : `Export ZIP (${counts.aiSelected})`}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsvShortlist}
            className="min-h-[44px] px-3.5 py-2 rounded-full text-xs font-medium liquid-glass-subtle hover:border-[#D4AF37] transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={resetSampleBatch}
            className="min-h-[44px] px-3.5 py-2 rounded-full text-xs font-medium liquid-glass-subtle hover:border-zinc-400 transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.cr3,.cr2,.nef,.arw,.dng"
            onChange={(e) => processIncomingFiles(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Google Drive-Style Live Bulk Upload Progress Dashboard Card */}
      {uploadTracker && (
        <div className="rounded-[24px] liquid-glass border border-[#D4AF37]/45 overflow-hidden shadow-xl">
          <div className="px-5 py-4 bg-black/[0.03] dark:bg-white/[0.04] border-b border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                {uploadTracker.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                ) : (
                  <CloudUpload className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {uploadTracker.completed
                    ? `Upload Complete · ${uploadTracker.uploadedCount} of ${uploadTracker.totalSelected} Photos Uploaded`
                    : `Uploading Wedding Photos · ${uploadTracker.currentFileName}`}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Google Drive-style bulk transfer &amp; live Laplacian sharpness indexing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-[#B58E24] dark:text-[#D4AF37] tabular-nums">
                {uploadTracker.progressPercent}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setUploadTracker((prev) =>
                    prev ? { ...prev, minimized: !prev.minimized } : null
                  )
                }
                aria-label="Minimize or expand upload queue"
                className="w-8 h-8 rounded-lg liquid-glass-subtle flex items-center justify-center text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                {uploadTracker.minimized ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                disabled={!uploadTracker.completed}
                onClick={() => setUploadTracker(null)}
                aria-label="Close upload tracker"
                className="w-8 h-8 rounded-lg liquid-glass-subtle flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* 4 Key Google Drive Upload Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl liquid-glass-subtle">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Total Selected
                </p>
                <p className="mt-1 text-xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                  {uploadTracker.totalSelected} Photos
                </p>
              </div>
              <div className="p-3.5 rounded-2xl liquid-glass-subtle">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#10B981]">
                  Photos Uploaded
                </p>
                <p className="mt-1 text-xl font-mono font-semibold text-[#10B981] tabular-nums">
                  {uploadTracker.uploadedCount} Uploaded
                </p>
              </div>
              <div className="p-3.5 rounded-2xl liquid-glass-subtle">
                <p className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Photos Remaining
                </p>
                <p className="mt-1 text-xl font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {uploadTracker.remainingCount} Remaining
                </p>
              </div>
              <div className="p-3.5 rounded-2xl liquid-glass-subtle">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#B58E24] dark:text-[#D4AF37]">
                  Live Progress
                </p>
                <p className="mt-1 text-xl font-mono font-semibold text-[#B58E24] dark:text-[#D4AF37] tabular-nums">
                  {uploadTracker.progressPercent}% Done
                </p>
              </div>
            </div>

            {/* Live Progress Bar with Percentage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-zinc-600 dark:text-zinc-300">
                  {uploadTracker.uploadedCount} / {uploadTracker.totalSelected} uploaded ({uploadTracker.remainingCount} left)
                </span>
                <span className="font-semibold text-[#10B981]">
                  {uploadTracker.progressPercent}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-black/10 dark:bg-white/12 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#10B981] transition-all duration-200 rounded-full"
                  style={{ width: `${uploadTracker.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Expandable Google Drive Per-File Queue List */}
            {!uploadTracker.minimized && (
              <div className="max-h-48 overflow-y-auto divide-y divide-black/8 dark:divide-white/8 rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                {uploadTracker.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileImage className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span className="font-medium truncate text-zinc-900 dark:text-white">
                        {item.fileName}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                        {item.sizeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      {item.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[#10B981]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Uploaded {item.sharpness ? `· Sharp ${item.sharpness}%` : ''}
                        </span>
                      ) : item.status === 'uploading' ? (
                        <span className="inline-flex items-center gap-1 text-[#D4AF37]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        <span className="text-zinc-400">Queued</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liquid Glass Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processIncomingFiles(e.dataTransfer.files);
        }}
        onClick={() => !analyzing && fileInputRef.current?.click()}
        className={`rounded-[24px] p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-dashed cursor-pointer ${
          isDragging
            ? 'border-[#D4AF37] bg-[#D4AF37]/12'
            : 'liquid-glass border-black/15 dark:border-white/20 hover:border-[#D4AF37]/60'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[16px] bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">
              Drag &amp; drop bulk wedding JPEG / PNG / RAW files here, or click to select photos
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
              {counts.all} Total · {counts.aiSelected} Best Picks ·{' '}
              {counts.closedEyes} Exposure Check · {counts.blurry} Blurry · {counts.clusters} Sequential Clusters
            </div>
          </div>
        </div>
        {cullNotice && (
          <div className="text-xs font-mono text-[#10B981]">{cullNotice}</div>
        )}
      </div>

      {/* Scrollable Apple Segmented Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-[18px] liquid-glass-subtle overflow-x-auto w-full sm:w-fit">
        {(
          [
            { id: 'all', label: `All (${counts.all})`, icon: Layers },
            { id: 'ai_selected', label: `Best Picks (${counts.aiSelected})`, icon: Sparkles },
            { id: 'grouped_poses', label: `Grouped (${counts.clusters})`, icon: Layers },
            { id: 'closed_eyes', label: `Exposure (${counts.closedEyes})`, icon: EyeOff },
            { id: 'blurry', label: `Blurry (${counts.blurry})`, icon: EyeOff },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-[13px] text-xs font-semibold inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white dark:bg-[#23252E] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {filter === 'grouped_poses' ? (
        <div className="space-y-6">
          {groupedClusters.map(([clusterName, clusterPhotos]) => (
            <div key={clusterName} className="space-y-3">
              <div className="flex items-center justify-between border-b border-black/8 dark:border-white/10 pb-2">
                <h3 className="text-sm font-semibold">{clusterName}</h3>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {clusterPhotos.length} Similar Frames · dHash Grouped
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {clusterPhotos.map(renderPhotoCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPhotos.map(renderPhotoCard)}
        </div>
      )}
    </div>
  );
};
