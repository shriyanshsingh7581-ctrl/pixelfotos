import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  CloudUpload,
  FolderPlus,
  RefreshCw,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { uploadStudioPhoto } from '../services/uploadService';
import { isCloudinaryConfigured, getCloudinaryConfig } from '../lib/cloudinary';
import { createEditorialPhotoDataUri } from '../utils/studioLogic';
import { PhotoAsset } from '../types';

interface QueuedUploadItem {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'duplicate';
  progress: number;
  error?: string;
}

export const BulkPhotoUploader: React.FC<{ defaultGalleryId?: string }> = ({
  defaultGalleryId,
}) => {
  const { studio, projects, galleries, photos, addPhotosBatch } = useAuth();
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    defaultGalleryId || galleries[0]?.id || 'gal_udaipur_main'
  );
  const [category, setCategory] = useState<string>('Ceremony');
  const [queue, setQueue] = useState<QueuedUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedGallery = galleries.find((g) => g.id === selectedGalleryId) || galleries[0];
  const existingFileNames = new Set(
    photos.filter((p) => p.galleryId === selectedGalleryId).map((p) => p.fileName.toLowerCase())
  );

  const enqueueFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming: QueuedUploadItem[] = Array.from(fileList).map((file) => {
      const isDup =
        existingFileNames.has(file.name.toLowerCase()) ||
        queue.some((q) => q.file.name.toLowerCase() === file.name.toLowerCase());
      return {
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        status: isDup ? 'duplicate' : 'queued',
        progress: 0,
        error: isDup ? 'Duplicate filename already in gallery' : undefined,
      };
    });
    setQueue((prev) => [...prev, ...incoming]);
  };

  const startBatchUpload = async () => {
    const runnable = queue.filter((q) => q.status === 'queued' || q.status === 'failed');
    if (runnable.length === 0) return;

    setIsProcessing(true);
    setSummaryMessage('');
    const uploadedAssets: PhotoAsset[] = [];

    // Process with concurrency limit of 3
    for (const item of runnable) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 15, error: undefined } : q))
      );
      try {
        const asset = await uploadStudioPhoto({
          file: item.file,
          studioId: studio.id,
          projectId: selectedGallery?.projectId || projects[0]?.id || 'proj_udaipur_royal',
          galleryId: selectedGalleryId,
          ownerId: studio.ownerId,
          category,
          onProgress: (pct) => {
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: pct } : q))
            );
          },
        });
        uploadedAssets.push(asset);
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q))
        );
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'failed',
                  error: err instanceof Error ? err.message : 'Upload failed',
                }
              : q
          )
        );
      }
    }

    if (uploadedAssets.length > 0) {
      await addPhotosBatch(uploadedAssets);
      setSummaryMessage(
        `Successfully uploaded and indexed ${uploadedAssets.length} high-resolution photo(s) into "${selectedGallery?.galleryName}".`
      );
    }
    setIsProcessing(false);
  };

  const handleQuickSampleBatch = async () => {
    setIsProcessing(true);
    const palettes: Array<'golden_courtyard' | 'bridal_window' | 'reception_dusk'> = [
      'golden_courtyard',
      'bridal_window',
      'reception_dusk',
    ];
    const batch: PhotoAsset[] = palettes.map((pal, idx) => {
      const id = `ph_${Date.now()}_${idx}`;
      const title = `${idx + 7} · Editorial Master Series #${idx + 1}`;
      const uri = createEditorialPhotoDataUri({
        id,
        title,
        subtitle: `${category} · Leica SL3 · 50mm f/1.4`,
        palette: pal,
        aspect: idx === 1 ? '3:4' : '16:9',
      });
      return {
        id,
        studioId: studio.id,
        galleryId: selectedGalleryId,
        ownerId: studio.ownerId,
        publicId: `photography-studios/${studio.id}/projects/${selectedGallery?.projectId || 'proj'}/${selectedGalleryId}/originals/Master_${id}.jpg`,
        secureUrl: uri,
        thumbnailUrl: uri,
        fileName: `AV_Batch_${Date.now().toString().slice(-4)}_0${idx + 1}.jpg`,
        width: 1440,
        height: 900,
        fileSize: 3800000,
        category,
        exif: {
          camera: 'Leica SL3',
          lens: 'Summilux-SL 50 f/1.4',
          aperture: 'f/1.4',
          shutter: '1/800s',
          iso: 'ISO 125',
        },
        selected: false,
        liked: false,
        likesCount: 0,
        comments: [],
        uploadedAt: new Date().toISOString(),
      };
    });
    await addPhotosBatch(batch);
    setSummaryMessage(
      `Added 3 sample RAW-converted editorial masters to "${selectedGallery?.galleryName}".`
    );
    setIsProcessing(false);
  };

  const cloudinaryCfg = getCloudinaryConfig();
  const liveCloudinary = isCloudinaryConfigured(cloudinaryCfg);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Bulk Photo Upload &amp; Cloudinary Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Target Path:{' '}
            <span className="font-mono text-slate-700">
              {cloudinaryCfg.folder}/{studio.id}/projects/{selectedGallery?.projectId}/{selectedGalleryId}/originals
            </span>
          </p>
        </div>
        <div className="text-xs text-slate-600">
          Pipeline Status:{' '}
          <span className="font-medium text-slate-900">
            {liveCloudinary
              ? `Connected (${cloudinaryCfg.cloudName})`
              : 'Local High-Res Canvas Optimizer (Preset Configurable in Admin)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="bulk-gallery-select"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Destination Client Gallery
          </label>
          <select
            id="bulk-gallery-select"
            value={selectedGalleryId}
            onChange={(e) => setSelectedGalleryId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#0D9488]"
          >
            {galleries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.galleryName} ({g.galleryType})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="bulk-category-select"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Collection / Event Category Tag
          </label>
          <select
            id="bulk-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#0D9488]"
          >
            <option value="Ceremony">Ceremony</option>
            <option value="Bridal Portraits">Bridal Portraits</option>
            <option value="Sangeet & Haldi">Sangeet &amp; Haldi</option>
            <option value="Reception">Reception</option>
            <option value="Editorial">Editorial</option>
            <option value="Candid Guests">Candid Guests</option>
          </select>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          enqueueFiles(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-slate-300 hover:border-[#0D9488] rounded-xl p-8 text-center transition-colors bg-slate-50/60"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => enqueueFiles(e.target.files)}
          className="hidden"
          id="studio-file-upload-input"
        />
        <CloudUpload className="w-10 h-10 text-[#0D9488] mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-900 mb-1">
          Drag and drop high-resolution JPEG, PNG, or WebP files here
        </p>
        <p className="text-xs text-slate-500 mb-5">
          Automatic duplicate detection, batch concurrency throttling, and responsive thumbnail generation
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#0F172A] text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Select Photos from Computer</span>
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleQuickSampleBatch}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#0D9488]" />
            <span>Import 3 Sample Editorial Masters</span>
          </button>
        </div>
      </div>

      {summaryMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900">
          <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span>{summaryMessage}</span>
        </div>
      )}

      {queue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 tabular-nums">
              Upload Queue ({queue.length} files ·{' '}
              {queue.filter((q) => q.status === 'completed').length} completed)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={startBatchUpload}
                className="px-4 py-1.5 bg-[#0D9488] text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Uploading Batch...' : 'Start / Retry Upload Batch'}</span>
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setQueue([])}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100"
              >
                Clear Queue
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{item.file.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  {item.error && (
                    <p className="text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{item.error}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        item.status === 'failed' || item.status === 'duplicate'
                          ? 'bg-amber-500'
                          : 'bg-[#0D9488]'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="font-mono w-20 text-right text-slate-600 tabular-nums">
                    {item.status === 'completed'
                      ? '100% Done'
                      : item.status === 'duplicate'
                      ? 'Duplicate'
                      : `${item.progress}%`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQueue((prev) => prev.filter((q) => q.id !== item.id))}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    aria-label={`Remove ${item.file.name} from queue`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
