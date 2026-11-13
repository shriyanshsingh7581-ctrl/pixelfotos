import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  CloudUpload,
  FolderSync,
  Play,
  Pause,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getCloudinaryConfig, triggerDirectPhotoDownload } from '../../lib/cloudinary';
import { uploadStudioPhoto } from '../../services/uploadService';
import { createEditorialPhotoDataUri } from '../../utils/studioLogic';
import { ImageOptimizer } from '../ImageOptimizer';

type CameraBrand = 'Sony Alpha FTP / Imaging Edge' | 'Canon EOS Utility Wi-Fi' | 'Nikon NX Tether Wireless';

export const LiveCameraSyncHub: React.FC = () => {
  const { studio, galleries, photos, addPhotosBatch } = useAuth();
  const cfg = getCloudinaryConfig();

  const [selectedCamera, setSelectedCamera] = useState<CameraBrand>(
    'Sony Alpha FTP / Imaging Edge'
  );
  const [targetGalleryId, setTargetGalleryId] = useState<string>(
    galleries[0]?.id || 'gal_udaipur_main'
  );
  const [watchedFolderPath, setWatchedFolderPath] = useState<string>(
    '/Volumes/Tether_Live/Udaipur_Royal_Wedding/HotFolder'
  );
  const [syncActive, setSyncActive] = useState<boolean>(true);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusBanner, setStatusBanner] = useState<string>('');

  const targetGallery =
    galleries.find((g) => g.id === targetGalleryId) || galleries[0];

  const handleWatchedFolderFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !targetGallery) return;
    setUploadingFiles(true);
    setUploadProgress(10);

    const files = Array.from(fileList);
    const uploadedAssets = [];
    for (let i = 0; i < files.length; i++) {
      const asset = await uploadStudioPhoto({
        file: files[i],
        studioId: studio.id,
        projectId: targetGallery.projectId,
        galleryId: targetGallery.id,
        ownerId: studio.ownerId,
        category: 'Live Tether Feed',
        onProgress: (p) =>
          setUploadProgress(Math.round(((i + p / 100) / files.length) * 100)),
      });
      asset.exif.camera = selectedCamera.split(' ')[0] + ' Flagship Tether';
      uploadedAssets.push(asset);
    }

    await addPhotosBatch(uploadedAssets);
    setUploadingFiles(false);
    setUploadProgress(100);
    setStatusBanner(
      `Auto-uploaded ${uploadedAssets.length} tethered frame(s) from ${selectedCamera} directly to Cloudinary (${cfg.cloudName} / "${cfg.uploadPreset}") and synced to "${targetGallery.galleryName}"!`
    );
  };

  const handleSimulateWirelessBurst = async () => {
    if (!targetGallery) return;
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const id = `tether_${Date.now()}`;
    const uri = createEditorialPhotoDataUri({
      id,
      title: `${selectedCamera.split(' ')[0].toUpperCase()} WI-FI TETHER`,
      subtitle: `Synced to ${targetGallery.galleryName} · ${timeLabel}`,
      palette: 'golden_courtyard',
      aspect: '4:3',
    });

    await addPhotosBatch([
      {
        id,
        studioId: studio.id,
        galleryId: targetGallery.id,
        ownerId: studio.ownerId,
        publicId: `pixelfotos-tether/${id}`,
        secureUrl: uri,
        thumbnailUrl: uri,
        fileName: `${selectedCamera.slice(0, 4).toUpperCase()}_WIFI_${Date.now().toString().slice(-4)}.JPG`,
        width: 6000,
        height: 4000,
        fileSize: 8420000,
        category: 'Live Tether Feed',
        exif: {
          camera: selectedCamera,
          lens: '85mm f/1.2 Prime',
          aperture: 'f/1.2',
          shutter: '1/1250s',
          iso: 'ISO 250',
        },
        selected: false,
        liked: false,
        likesCount: 1,
        comments: [],
        uploadedAt: now.toISOString(),
      },
    ]);

    setStatusBanner(
      `Captured live wireless frame from ${selectedCamera} and pushed to QR Event Gallery "${targetGallery.galleryName}".`
    );
  };

  const recentTetherPhotos = photos.slice(0, 6);

  return (
    <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-6 text-slate-100 shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">
            <Wifi className="w-3.5 h-3.5" />
            <span>MODULE G · LIVE CAMERA SYNC (WI-FI TETHERING HUB)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white">
            Sony, Canon &amp; Nikon Wireless Camera-to-Cloudinary Sync
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Watched-folder &amp; FTP hot-stream directly to Cloudinary (
            <code className="text-amber-300">{cfg.cloudName}</code> · Preset:{' '}
            <code className="text-amber-300">{cfg.uploadPreset}</code>)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSyncActive((s) => !s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border ${
              syncActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {syncActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{syncActive ? 'Wi-Fi Tether Active (5GHz)' : 'Tether Paused'}</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateWirelessBurst}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] hover:opacity-95 inline-flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Trigger Instant Camera Shutter Sync (+1)</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-3.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner('')}
            className="text-amber-300 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Configuration & Hot-Folder Dropzone */}
        <div className="lg:col-span-5 bg-[#0B0F17] border border-amber-500/20 rounded-xl p-5 space-y-4 text-xs">
          <div className="font-semibold text-amber-200 text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Camera Body &amp; Hot-Folder Pipeline</span>
          </div>

          <div className="space-y-2">
            <span className="block text-slate-300 font-medium">
              Select Camera Wi-Fi / FTP Protocol
            </span>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  'Sony Alpha FTP / Imaging Edge',
                  'Canon EOS Utility Wi-Fi',
                  'Nikon NX Tether Wireless',
                ] as CameraBrand[]
              ).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedCamera(brand)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedCamera === brand
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold'
                      : 'bg-[#131B2E] border-slate-800 text-slate-300 hover:border-amber-500/30'
                  }`}
                >
                  <span>{brand}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-emerald-400">
                    READY
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="tether-gallery-select" className="block font-medium text-slate-300 mb-1">
              Destination Live Event QR Gallery
            </label>
            <select
              id="tether-gallery-select"
              value={targetGalleryId}
              onChange={(e) => setTargetGalleryId(e.target.value)}
              className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
            >
              {galleries.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.galleryName} ({g.accessType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="watched-folder-input" className="block font-medium text-slate-300 mb-1">
              Watched Hot-Folder Path (Auto-Ingest)
            </label>
            <div className="flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                id="watched-folder-input"
                type="text"
                value={watchedFolderPath}
                onChange={(e) => setWatchedFolderPath(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-amber-200 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Direct Cloudinary Watched Folder Upload Trigger */}
          <div className="p-4 bg-[#131B2E] border-2 border-dashed border-amber-500/40 rounded-xl text-center space-y-2.5">
            <CloudUpload className="w-7 h-7 text-amber-400 mx-auto" />
            <div className="text-slate-200 font-semibold">
              Drop Tethered Camera Files to Auto-Upload to Cloudinary
            </div>
            <p className="text-[11px] text-slate-400">
              Uploads via unsigned preset <code className="text-amber-300">{cfg.uploadPreset}</code>{' '}
              on cloud <code className="text-amber-300">{cfg.cloudName}</code>
            </p>
            <label
              htmlFor="tether-file-input"
              className="px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {uploadingFiles
                  ? `Syncing to Cloudinary (${uploadProgress}%)...`
                  : 'Select / Drop Camera JPEGs'}
              </span>
              <input
                id="tether-file-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleWatchedFolderFiles}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Right Live Incoming Tether Queue */}
        <div className="lg:col-span-7 bg-[#0B0F17] border border-amber-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-200">
              Recent Live Tethered Captures ({recentTetherPhotos.length})
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Instant QR Guest Gallery Sync: ON
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {recentTetherPhotos.map((ph) => (
              <div
                key={ph.id}
                className="bg-[#131B2E] border border-slate-800 rounded-xl overflow-hidden group"
              >
                <div className="aspect-[4/3] relative">
                  <ImageOptimizer
                    src={ph.secureUrl}
                    alt={ph.fileName}
                    className="w-full h-full"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-emerald-300">
                    SYNCED
                  </span>
                </div>
                <div className="p-2.5 flex items-center justify-between text-[11px]">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{ph.fileName}</div>
                    <div className="text-slate-400 truncate">{ph.exif.camera}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerDirectPhotoDownload(ph.secureUrl, ph.fileName)}
                    className="text-amber-400 hover:underline font-semibold shrink-0 ml-2"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
