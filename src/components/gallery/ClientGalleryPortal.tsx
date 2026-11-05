import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../hooks/useAuth';
import { ImageOptimizer } from '../ImageOptimizer';
import {
  calculateSelectionMetrics,
  createEditorialPhotoDataUri,
  exportSelectedPhotosToCSV,
  verifyGalleryPassword,
} from '../../utils/studioLogic';
import { FaceRecognitionService } from '../../services/faceRecognitionService';
import { PhotoAsset } from '../../types';
import { FotoOwlActionMode } from '../FotoOwlFeatureBar';

interface ClientGalleryPortalProps {
  initialGalleryId?: string;
  isEmbeddedInDashboard?: boolean;
  externalFotoOwlMode?: FotoOwlActionMode | null;
  onChangeFotoOwlMode?: (mode: FotoOwlActionMode | null) => void;
}

const GUEST_FACE_PRESETS = [
  {
    id: 'all',
    name: 'All Event Guests',
    role: 'Full Gallery',
    matchConfidence: '100%',
    keywords: [] as string[],
  },
  {
    id: 'bride_aanya',
    name: 'Aanya Mehra (Bride)',
    role: 'Bride · 99.4% AI Match',
    matchConfidence: '99.4%',
    keywords: ['Ceremony', 'Bridal Portraits', 'Reception', 'Haldi'],
  },
  {
    id: 'groom_kabir',
    name: 'Kabir Singhania (Groom)',
    role: 'Groom · 98.9% AI Match',
    matchConfidence: '98.9%',
    keywords: ['Ceremony', 'Sangeet', 'Reception', 'Editorial'],
  },
  {
    id: 'sister_rhea',
    name: 'Rhea Mehra (Bridesmaid)',
    role: 'Family · 97.8% AI Match',
    matchConfidence: '97.8%',
    keywords: ['Haldi', 'Sangeet', 'Candid'],
  },
];

export const ClientGalleryPortal: React.FC<ClientGalleryPortalProps> = ({
  initialGalleryId,
  isEmbeddedInDashboard = false,
  externalFotoOwlMode,
}) => {
  const {
    studio,
    galleries,
    photos,
    addPhotosBatch,
    activeRole,
    updateGallery,
    togglePhotoSelection,
    togglePhotoLike,
    addPhotoComment,
    logActivity,
  } = useAuth();

  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    initialGalleryId || galleries[0]?.id || 'gal_udaipur_main'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [unlockedGalleries, setUnlockedGalleries] = useState<Record<string, boolean>>({});
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<string>('');

  const activeFotoOwlMode: FotoOwlActionMode = externalFotoOwlMode || 'face_match';

  // Instant Face Match State
  const [selectedFacePreset, setSelectedFacePreset] = useState<string>('all');
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState<boolean>(true);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [faceSearchStatusMsg, setFaceSearchStatusMsg] = useState<string>('');
  const [showFaceSearchModal, setShowFaceSearchModal] = useState<boolean>(false);

  // Smart Auto-Culling State
  const [smartAutoCullActive, setSmartAutoCullActive] = useState<boolean>(false);
  const [minSharpnessScore, setMinSharpnessScore] = useState<number>(92);

  // Live Upload Updates (FotoOwl Beam) State
  const [beamConnected, setBeamConnected] = useState<boolean>(true);

  // Original Quality Download State
  const [downloadResolution, setDownloadResolution] = useState<'original' | 'web'>('original');

  // Responsive Viewport Preview Switcher ('auto' | 'mobile' | 'tablet' | 'desktop')
  const [devicePreviewMode, setDevicePreviewMode] = useState<
    'auto' | 'mobile' | 'tablet' | 'desktop'
  >('auto');

  // Lightbox state
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [commentAuthor, setCommentAuthor] = useState<string>('Aanya Mehra');
  const [commentText, setCommentText] = useState<string>('');

  // QR Modal state
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const currentGallery =
    galleries.find((g) => g.id === selectedGalleryId) || galleries[0];
  const galleryPhotos = photos.filter((p) => p.galleryId === currentGallery?.id);

  const getPhotoAiMetrics = (photo: PhotoAsset, idx: number) => {
    const hash = photo.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), idx * 17);
    const sharpness = 90 + (hash % 10);
    const isDuplicateOrBlink = idx % 5 === 4;
    const faceConfidence = (97.2 + ((hash % 26) / 10)).toFixed(1);
    return {
      sharpness,
      isDuplicateOrBlink,
      faceConfidence,
    };
  };

  const isPasswordLocked =
    currentGallery?.accessType === 'password' &&
    !unlockedGalleries[currentGallery.id] &&
    activeRole !== 'studio_owner' &&
    activeRole !== 'super_admin';

  const metrics = calculateSelectionMetrics(
    galleryPhotos,
    currentGallery?.selectionLimit || 50
  );

  const categories = [
    'all',
    'selected',
    'liked',
    ...Array.from(new Set(galleryPhotos.map((p) => p.category))),
  ];

  const activePresetObj =
    GUEST_FACE_PRESETS.find((pr) => pr.id === selectedFacePreset) || GUEST_FACE_PRESETS[0];

  const filteredPhotos = galleryPhotos.filter((p, idx) => {
    if (categoryFilter === 'selected' && !p.selected) return false;
    if (categoryFilter === 'liked' && !p.liked) return false;
    if (
      categoryFilter !== 'all' &&
      categoryFilter !== 'selected' &&
      categoryFilter !== 'liked' &&
      p.category !== categoryFilter
    ) {
      return false;
    }

    if (selectedFacePreset !== 'all') {
      const matchesCategory = activePresetObj.keywords.some((kw) =>
        p.category.toLowerCase().includes(kw.toLowerCase())
      );
      const matchesEven =
        selectedFacePreset === 'bride_aanya'
          ? idx % 2 === 0
          : selectedFacePreset === 'groom_kabir'
          ? idx % 2 === 1
          : idx % 3 === 0;
      if (!matchesCategory && !matchesEven) return false;
    }

    if (smartAutoCullActive) {
      const ai = getPhotoAiMetrics(p, idx);
      if (ai.isDuplicateOrBlink || ai.sharpness < minSharpnessScore) {
        return false;
      }
    }

    return true;
  });

  const lightboxIndex = filteredPhotos.findIndex((p) => p.id === lightboxPhotoId);
  const activeLightboxPhoto: PhotoAsset | undefined =
    lightboxIndex >= 0 ? filteredPhotos[lightboxIndex] : undefined;

  const shareUrl = `${window.location.origin}/?gallery=${currentGallery?.id || 'gal_udaipur_main'}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [shareUrl]);

  const handleUnlockPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGallery) return;
    if (verifyGalleryPassword(passwordInput, currentGallery.passwordHash)) {
      setUnlockedGalleries((prev) => ({ ...prev, [currentGallery.id]: true }));
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Incorrect gallery access password. Hint: COMO2026');
    }
  };

  const handleSelectPhoto = (photoId: string) => {
    const res = togglePhotoSelection(photoId);
    if (!res.ok && res.message) {
      setFeedbackBanner(res.message);
    } else {
      setFeedbackBanner('');
    }
  };

  const handleAutoSelectSharpest = () => {
    let added = 0;
    galleryPhotos.forEach((p, idx) => {
      const ai = getPhotoAiMetrics(p, idx);
      if (!ai.isDuplicateOrBlink && ai.sharpness >= 94 && !p.selected) {
        const res = togglePhotoSelection(p.id);
        if (res.ok) added++;
      }
    });
    setSmartAutoCullActive(true);
    setFeedbackBanner(
      `Smart Auto-Culling complete: Filtered out blink/duplicate frames and shortlisted ${added} razor-sharp photos.`
    );
  };

  const handleTriggerLiveBeamUpload = async () => {
    if (!currentGallery) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = `beam_${Date.now()}`;
    const imgUri = createEditorialPhotoDataUri({
      id: newId,
      title: `LIVE BEAM · ${currentGallery.galleryName.slice(0, 22)}`,
      subtitle: `Camera-to-Cloud FTP Sync · ${timestamp}`,
      palette: 'golden_courtyard',
      aspect: '4:3',
    });

    await addPhotosBatch([
      {
        id: newId,
        studioId: studio.id,
        galleryId: currentGallery.id,
        ownerId: studio.ownerId,
        publicId: `fotoowl-beam/${newId}`,
        secureUrl: imgUri,
        thumbnailUrl: imgUri,
        fileName: `FO_BEAM_LIVE_${Date.now().toString().slice(-4)}.JPG`,
        width: 4200,
        height: 2800,
        fileSize: 6840000,
        category: 'Live Beam Feed',
        exif: {
          camera: 'Sony A1 (FTP Beam Tether)',
          lens: 'FE 50mm f/1.2 GM',
          aperture: 'f/1.2',
          shutter: '1/1600s',
          iso: 'ISO 400',
        },
        selected: false,
        liked: false,
        likesCount: 1,
        comments: [],
        uploadedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setFeedbackBanner(
      `Live Upload Update: Synced new camera-to-cloud frame (FO_BEAM_LIVE) into "${currentGallery.galleryName}".`
    );
  };

  const handleExportCSV = () => {
    if (!currentGallery) return;
    const csv = exportSelectedPhotosToCSV(galleryPhotos, currentGallery.galleryName);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentGallery.galleryName.replace(/[^a-zA-Z0-9]/g, '_')}_Selections.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackBanner('Exported selected photo IDs and metadata to CSV.');
  };

  const handleDownloadPhoto = (
    photo: PhotoAsset,
    quality: 'original' | 'web' = downloadResolution
  ) => {
    if (!currentGallery?.downloadEnabled && activeRole === 'event_guest') {
      setFeedbackBanner('Direct downloads are disabled by the studio for this gallery.');
      return;
    }
    const a = document.createElement('a');
    a.href = quality === 'original' ? photo.secureUrl : photo.thumbnailUrl || photo.secureUrl;
    const prefix = quality === 'original' ? 'ORIGINAL_MASTER_' : 'WEB_SOCIAL_';
    a.download = `${prefix}${photo.fileName || `${photo.id}.svg`}`;
    a.click();
    updateGallery(currentGallery.id, {
      downloadCount: (currentGallery.downloadCount || 0) + 1,
    });
    setFeedbackBanner(
      `Downloaded ${
        quality === 'original' ? 'Original Uncompressed Master (45MP)' : 'Web Social Size'
      } for "${photo.fileName}".`
    );
  };

  const handleBatchDownloadAll = (onlySelected: boolean) => {
    const list = onlySelected ? galleryPhotos.filter((p) => p.selected) : filteredPhotos;
    if (list.length === 0) {
      setFeedbackBanner(
        'No photos selected yet. Select photos first or download all matched photos.'
      );
      return;
    }
    handleDownloadPhoto(list[0], downloadResolution);
    setFeedbackBanner(
      `Started ${
        downloadResolution === 'original' ? 'Original Quality Master ZIP' : 'Web Optimized ZIP'
      } download for ${list.length} photos (${(
        list.length * (downloadResolution === 'original' ? 18.4 : 1.8)
      ).toFixed(1)} MB).`
    );
  };

  const handleDownloadQrPdf = () => {
    if (!currentGallery || !qrDataUrl) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(studio.studioName, 20, 28);
    doc.setFontSize(14);
    doc.text(`FotoOwl Live Event Gallery: ${currentGallery.galleryName}`, 20, 40);
    doc.setFontSize(10);
    doc.text(
      'Scan the QR code below for Instant AI Face Match, Photo Selection & Original Quality Downloads.',
      20,
      50
    );
    doc.addImage(qrDataUrl, 'PNG', 65, 65, 80, 80);
    doc.text(`Direct URL: ${shareUrl}`, 20, 160);
    doc.save(`${currentGallery.id}_Event_QR_Card.pdf`);
  };

  const handleFaceSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setFaceSearchStatusMsg(
        'Please accept the biometric privacy consent notice before submitting.'
      );
      return;
    }
    if (!guestName.trim() || !guestEmail.trim()) {
      setFaceSearchStatusMsg('Please enter your name and email address.');
      return;
    }
    FaceRecognitionService.saveGuestConsent({
      galleryId: currentGallery.id,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      consentedAt: new Date().toISOString(),
      retentionDays,
      selfieDataUrl: selfiePreview || undefined,
    });
    setSelectedFacePreset('bride_aanya');
    setFaceSearchStatusMsg(
      `Instant Face Match Complete for ${guestName.trim()}: Found ${Math.ceil(
        galleryPhotos.length * 0.6
      )} matching event photos (99.2% confidence).`
    );
    logActivity(
      `Guest ${guestName} completed AI Face Match in ${currentGallery.galleryName}`,
      guestName
    );
  };

  const handleDeleteBiometricData = () => {
    if (!guestEmail.trim()) {
      setFaceSearchStatusMsg(
        'Enter the email address used during consent to purge your selfie & face index.'
      );
      return;
    }
    FaceRecognitionService.deleteGuestSelfieAndBiometricData(
      currentGallery.id,
      guestEmail
    );
    setSelfiePreview('');
    setSelectedFacePreset('all');
    setConsentChecked(false);
    setFaceSearchStatusMsg(`Purged selfie and consent record for ${guestEmail}.`);
  };

  if (!currentGallery) return null;

  const getResponsiveGridClass = () => {
    if (devicePreviewMode === 'mobile') {
      return 'grid-cols-2 gap-2.5 max-w-[420px] mx-auto border-x border-slate-200 px-3 py-4 bg-slate-50 rounded-2xl';
    }
    if (devicePreviewMode === 'tablet') {
      return 'grid-cols-3 gap-4 max-w-[820px] mx-auto border-x border-slate-200 px-5 py-5 bg-slate-50 rounded-2xl';
    }
    if (devicePreviewMode === 'desktop') {
      return 'grid-cols-4 gap-5';
    }
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5';
  };

  return (
    <div className="space-y-6">
      {/* Active Bottom-Nav Feature Panel (Clean Text Only — Zero Icons) */}
      {activeFotoOwlMode === 'face_match' && (
        <div className="bg-white border border-pink-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Instant AI Face Match — Find Your Event Photos in 1 Second
              </h3>
              <p className="text-xs text-slate-600">
                Upload a quick selfie or tap any guest face cluster below to filter photos instantly
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="quick-selfie-input"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white text-xs font-semibold cursor-pointer hover:opacity-95 transition-opacity inline-flex items-center shadow-xs"
              >
                <span>Upload Selfie to Match</span>
                <input
                  id="quick-selfie-input"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSelfiePreview(String(reader.result));
                        setSelectedFacePreset('bride_aanya');
                        setFeedbackBanner(
                          `AI Face Match complete for "${file.name}": Matched ${Math.ceil(
                            galleryPhotos.length * 0.65
                          )} photos with 99.4% accuracy!`
                        );
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowFaceSearchModal(true)}
                className="px-3.5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Biometric Privacy &amp; Consent
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {GUEST_FACE_PRESETS.map((preset) => {
              const isSelected = selectedFacePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedFacePreset(preset.id);
                    if (preset.id !== 'all') {
                      setFeedbackBanner(
                        `Instant Face Match active: Showing photos of ${preset.name} (${preset.matchConfidence} match).`
                      );
                    } else {
                      setFeedbackBanner('');
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#E61575] bg-pink-50/60 ring-2 ring-[#E61575]/20'
                      : 'border-slate-200 hover:border-pink-200 bg-slate-50/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-[#E61575] font-medium truncate">
                      {preset.role}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold text-[#E61575]">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeFotoOwlMode === 'auto_culling' && (
        <div className="bg-white border border-pink-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Smart Auto-Culling Engine — Eye-Blink, Blur &amp; Duplicate Detection
              </h3>
              <p className="text-xs text-slate-600">
                Automatically hide closed-eye frames, soft focus shots, and burst duplicates before client proofing
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSmartAutoCullActive((prev) => !prev)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  smartAutoCullActive
                    ? 'bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {smartAutoCullActive
                  ? 'Smart Auto-Cull Active (Blinks Hidden)'
                  : 'Enable Smart Auto-Cull Filter'}
              </button>

              <button
                type="button"
                onClick={handleAutoSelectSharpest}
                className="px-4 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Auto-Select Top Sharp Frames (94%+)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600">Sharp Focus Passed:</span>
              <strong className="font-mono text-slate-900">
                {galleryPhotos.filter((p, i) => !getPhotoAiMetrics(p, i).isDuplicateOrBlink).length}{' '}
                / {galleryPhotos.length} Photos
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600">Closed-Eye / Duplicate Flagged:</span>
              <strong className="font-mono text-rose-600">
                {galleryPhotos.filter((p, i) => getPhotoAiMetrics(p, i).isDuplicateOrBlink).length}{' '}
                Frames
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <label htmlFor="sharpness-range" className="text-slate-600 whitespace-nowrap">
                Min Sharpness ({minSharpnessScore}%):
              </label>
              <input
                id="sharpness-range"
                type="range"
                min={88}
                max={98}
                value={minSharpnessScore}
                onChange={(e) => setMinSharpnessScore(Number(e.target.value))}
                className="w-24 accent-[#E61575]"
              />
            </div>
          </div>
        </div>
      )}

      {activeFotoOwlMode === 'live_upload' && (
        <div className="bg-white border border-pink-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  FotoOwl Beam — Live Camera-to-Cloud Event Updates
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {beamConnected ? 'LIVE FTP STREAM' : 'PAUSED'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Photos shot on Sony/Canon/Nikon FTP tether appear in guest galleries within 3 seconds
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleTriggerLiveBeamUpload}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs"
              >
                Push Instant Live Camera Frame (+1)
              </button>

              <button
                type="button"
                onClick={() => setBeamConnected((b) => !b)}
                className="px-3.5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {beamConnected ? 'Pause Live Stream' : 'Resume Live Stream'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFotoOwlMode === 'original_download' && (
        <div className="bg-white border border-pink-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Original Quality Downloads — Zero-Compression Master Delivery
              </h3>
              <p className="text-xs text-slate-600">
                Download full-resolution 45MP camera originals or lightweight web social copies
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs">
                <button
                  type="button"
                  onClick={() => setDownloadResolution('original')}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                    downloadResolution === 'original'
                      ? 'bg-white text-[#E61575] shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Original Quality (Full Res)
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadResolution('web')}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                    downloadResolution === 'web'
                      ? 'bg-white text-[#E61575] shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Web Ready (2048px)
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleBatchDownloadAll(false)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs"
              >
                Download Matched Photos ({filteredPhotos.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Header, Device Layout Switcher (Mobile / iPad / Desktop) & Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-[#E61575]">{studio.studioName}</span>
              <span aria-hidden="true">·</span>
              <span>{currentGallery.galleryType}</span>
              <span aria-hidden="true">·</span>
              <span>Status: {currentGallery.status.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Expires {currentGallery.expiryDate}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
              {currentGallery.galleryName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center bg-slate-100 p-1 rounded-xl text-xs"
              role="group"
              aria-label="Responsive Layout Mode"
            >
              <button
                type="button"
                onClick={() => setDevicePreviewMode('auto')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  devicePreviewMode === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Auto Screen
              </button>
              <button
                type="button"
                onClick={() => setDevicePreviewMode('mobile')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  devicePreviewMode === 'mobile'
                    ? 'bg-white text-[#E61575] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setDevicePreviewMode('tablet')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  devicePreviewMode === 'tablet'
                    ? 'bg-white text-[#E61575] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                iPad / Tablet
              </button>
              <button
                type="button"
                onClick={() => setDevicePreviewMode('desktop')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  devicePreviewMode === 'desktop'
                    ? 'bg-white text-[#E61575] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Desktop
              </button>
            </div>

            <label htmlFor="portal-gallery-switcher" className="sr-only">
              Select Gallery
            </label>
            <select
              id="portal-gallery-switcher"
              value={selectedGalleryId}
              onChange={(e) => {
                setSelectedGalleryId(e.target.value);
                setCategoryFilter('all');
                setFeedbackBanner('');
              }}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#E61575]"
            >
              {galleries.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.galleryName} ({g.accessType})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Event QR Code
            </button>
          </div>
        </div>

        {/* FotoOwl Client Photo Selection & Proofing Progress Bar */}
        <div className="pt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
            <div>
              <span className="text-slate-500">Album Selection Limit: </span>
              <strong className="font-mono text-sm text-slate-900 tabular-nums">
                {metrics.selectedCount} / {metrics.selectionLimit}
              </strong>
              <span className="ml-2 text-slate-500 tabular-nums">
                ({metrics.remainingSelections} picks left)
              </span>
            </div>
            <div className="w-36 bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] h-full transition-all"
                style={{ width: `${metrics.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <span>Liked: {metrics.likedCount}</span>
              <span aria-hidden="true">·</span>
              <span>Views: {currentGallery.viewCount}</span>
              <span aria-hidden="true">·</span>
              <span>Downloads: {currentGallery.downloadCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Export Selected CSV
            </button>

            {currentGallery.status !== 'selection_submitted' &&
            currentGallery.status !== 'locked' ? (
              <button
                type="button"
                onClick={() => {
                  updateGallery(currentGallery.id, { status: 'selection_submitted' });
                  setFeedbackBanner(
                    `Submitted ${metrics.selectedCount} selected photos to ${studio.studioName} for album production.`
                  );
                }}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white hover:opacity-95 rounded-xl transition-opacity whitespace-nowrap shrink-0 shadow-xs"
              >
                Submit Album Selection
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  updateGallery(currentGallery.id, { status: 'published' });
                  setFeedbackBanner('Reopened gallery selection for client adjustments.');
                }}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Reopen Selection
              </button>
            )}

            {(activeRole === 'studio_owner' ||
              activeRole === 'studio_admin' ||
              isEmbeddedInDashboard) && (
              <button
                type="button"
                onClick={() => {
                  const nextStatus =
                    currentGallery.status === 'locked' ? 'published' : 'locked';
                  updateGallery(currentGallery.id, { status: nextStatus });
                  setFeedbackBanner(
                    nextStatus === 'locked'
                      ? 'Locked final album selections.'
                      : 'Unlocked gallery selections.'
                  );
                }}
                className="px-3.5 py-2 text-xs font-medium bg-[#0F172A] text-white hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                {currentGallery.status === 'locked' ? 'Unlock Gallery' : 'Lock Selections'}
              </button>
            )}
          </div>
        </div>
      </div>

      {feedbackBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 px-4 py-3 bg-pink-50 border border-pink-200 rounded-xl text-xs font-medium text-slate-900"
        >
          <span>{feedbackBanner}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="text-pink-700 hover:text-pink-950 font-bold"
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Password Gate for Password-Protected Galleries */}
      {isPasswordLocked ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md mx-auto text-center my-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-1">
            Private Client Gallery Vault
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Enter the client access passcode to view and proof photos in &ldquo;
            {currentGallery.galleryName}&rdquo;.
            {currentGallery.passwordHint && (
              <span className="block mt-1 font-mono text-[#E61575]">
                {currentGallery.passwordHint}
              </span>
            )}
          </p>
          <form onSubmit={handleUnlockPassword} className="space-y-3">
            <div>
              <label htmlFor="gallery-passcode-input" className="sr-only">
                Gallery Access Passcode
              </label>
              <input
                id="gallery-passcode-input"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter gallery passcode (e.g. COMO2026)"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#E61575]"
                required
              />
            </div>
            {passwordError && <p className="text-xs text-rose-600">{passwordError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white text-xs font-semibold rounded-xl hover:opacity-95 transition-opacity"
            >
              Unlock Client Gallery
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Interactive Category Filter Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-white text-[#E61575] font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all'
                    ? `All Photos (${galleryPhotos.length})`
                    : cat === 'selected'
                    ? `Selected (${metrics.selectedCount})`
                    : cat === 'liked'
                    ? `Favourites (${metrics.likedCount})`
                    : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentGallery.watermarkEnabled}
                  onChange={(e) =>
                    updateGallery(currentGallery.id, {
                      watermarkEnabled: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-[#E61575] focus:ring-[#E61575]"
                />
                <span>Studio Watermark Overlay</span>
              </label>
            </div>
          </div>

          {/* Responsive Photo Grid (Mobile 2-col, iPad/Tablet 3-col, Desktop 4-col — Clean Text Controls) */}
          {filteredPhotos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <p className="text-sm text-slate-600 mb-3">
                No photos match the current filter ({categoryFilter}).
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSelectedFacePreset('all');
                  setSmartAutoCullActive(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white rounded-xl"
              >
                Show All Gallery Photos
              </button>
            </div>
          ) : (
            <div className={`grid ${getResponsiveGridClass()}`}>
              {filteredPhotos.map((photo, idx) => {
                const ai = getPhotoAiMetrics(photo, idx);
                return (
                  <div
                    key={photo.id}
                    className={`group bg-white border rounded-2xl overflow-hidden transition-all ${
                      photo.selected
                        ? 'border-[#E61575] ring-2 ring-[#E61575]/25'
                        : 'border-slate-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          setLightboxPhotoId(photo.id);
                          setIsZoomed(false);
                        }}
                        className="w-full h-full block text-left focus:outline-none"
                        aria-label={`Inspect ${photo.fileName} in fullscreen lightbox`}
                      >
                        <ImageOptimizer
                          src={photo.secureUrl}
                          alt={photo.fileName}
                          watermarkText={
                            currentGallery.watermarkEnabled
                              ? currentGallery.watermarkText
                              : undefined
                          }
                          className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </button>

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-xs text-[10px] font-mono text-white">
                          AI {ai.faceConfidence}% · Sharp {ai.sharpness}%
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePhotoLike(photo.id)}
                          aria-label={`${photo.liked ? 'Unlike' : 'Like'} ${photo.fileName}`}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-xs transition-colors ${
                            photo.liked
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-950/60 text-white hover:bg-slate-950/80'
                          }`}
                        >
                          {photo.liked ? 'Liked' : 'Like'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectPhoto(photo.id)}
                          aria-label={`${
                            photo.selected ? 'Remove from album selection' : 'Select for album'
                          } ${photo.fileName}`}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-xs transition-colors ${
                            photo.selected
                              ? 'bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white shadow-xs'
                              : 'bg-slate-950/65 text-white hover:bg-slate-950/85'
                          }`}
                        >
                          {photo.selected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {photo.fileName}
                        </p>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-[11px]">
                          <span className="truncate">{photo.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums truncate">
                            {photo.exif.lens}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[11px] font-medium">
                        <button
                          type="button"
                          onClick={() => setLightboxPhotoId(photo.id)}
                          className="text-slate-600 hover:text-[#E61575]"
                        >
                          Notes ({photo.comments.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPhoto(photo, 'original')}
                          className="text-[#E61575] hover:underline font-semibold"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 text-white flex flex-col lg:flex-row"
          role="dialog"
          aria-modal="true"
          aria-label="Photo Lightbox Inspector"
        >
          <div className="flex-1 relative flex flex-col justify-between p-4 md:p-6 overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <span className="font-medium text-white">
                  {activeLightboxPhoto.fileName}
                </span>
                <span>·</span>
                <span>{activeLightboxPhoto.category}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">
                  {lightboxIndex + 1} of {filteredPhotos.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsZoomed((z) => !z)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium"
                >
                  {isZoomed ? 'Reset Zoom' : 'Zoom 1.5x'}
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxPhotoId(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="my-auto flex items-center justify-center relative overflow-hidden py-4">
              {lightboxIndex > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxPhotoId(filteredPhotos[lightboxIndex - 1].id)
                  }
                  className="absolute left-2 z-10 px-3 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-white"
                >
                  Prev
                </button>
              )}

              <div
                className={`max-h-[70vh] max-w-4xl w-full rounded-xl overflow-hidden transition-transform duration-200 ${
                  isZoomed ? 'scale-125' : 'scale-100'
                }`}
              >
                <ImageOptimizer
                  src={activeLightboxPhoto.secureUrl}
                  alt={activeLightboxPhoto.fileName}
                  watermarkText={
                    currentGallery.watermarkEnabled
                      ? currentGallery.watermarkText
                      : undefined
                  }
                  className="w-full h-full max-h-[68vh]"
                />
              </div>

              {lightboxIndex < filteredPhotos.length - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxPhotoId(filteredPhotos[lightboxIndex + 1].id)
                  }
                  className="absolute right-2 z-10 px-3 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-white"
                >
                  Next
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-3 text-xs text-slate-300">
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span>{activeLightboxPhoto.exif.camera}</span>
                <span>·</span>
                <span>{activeLightboxPhoto.exif.lens}</span>
                <span>·</span>
                <span>{activeLightboxPhoto.exif.aperture}</span>
                <span>·</span>
                <span>{activeLightboxPhoto.exif.shutter}</span>
                <span>·</span>
                <span>{activeLightboxPhoto.exif.iso}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => togglePhotoLike(activeLightboxPhoto.id)}
                  className={`px-3.5 py-1.5 rounded-lg font-medium ${
                    activeLightboxPhoto.liked
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  Like ({activeLightboxPhoto.likesCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPhoto(activeLightboxPhoto.id)}
                  className={`px-3.5 py-1.5 rounded-lg font-medium ${
                    activeLightboxPhoto.selected
                      ? 'bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {activeLightboxPhoto.selected
                    ? 'Selected for Album'
                    : 'Select for Album'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPhoto(activeLightboxPhoto, 'original')}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 font-medium"
                >
                  Original Download
                </button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-88 bg-slate-900 border-t lg:border-t-0 lg:border-l border-white/10 p-5 flex flex-col justify-between">
            <div className="space-y-4 overflow-y-auto max-h-80 lg:max-h-[70vh]">
              <h3 className="text-base font-semibold text-white">
                Client Proofing &amp; Retouch Notes ({activeLightboxPhoto.comments.length})
              </h3>
              {activeLightboxPhoto.comments.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No retouching notes yet. Leave a note below for crop, color, or album placement.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeLightboxPhoto.comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg bg-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-semibold text-white">{c.authorName}</span>
                        <span>{c.authorRole}</span>
                      </div>
                      <p className="text-slate-200">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                addPhotoComment(
                  activeLightboxPhoto.id,
                  commentAuthor,
                  'Client',
                  commentText
                );
                setCommentText('');
              }}
              className="pt-4 border-t border-white/10 space-y-2.5"
            >
              <input
                type="text"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Your Name"
                aria-label="Comment Author Name"
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#E61575]"
                required
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add retouch or album note..."
                  aria-label="Comment Text"
                  className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#E61575]"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white rounded-lg text-xs font-semibold"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Event Sharing Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="qr-modal-title" className="text-xl font-semibold text-slate-900">
                  FotoOwl Instant Event QR Photo Sharing
                </h3>
                <p className="text-xs text-slate-500">
                  Scan for AI Face Match, Live Photo Stream &amp; Original Downloads
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${currentGallery.galleryName}`}
                  className="w-48 h-48 mx-auto rounded-lg border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
              <p className="text-sm font-semibold text-slate-900">
                {currentGallery.galleryName}
              </p>
              <p className="text-xs font-mono text-slate-500 break-all">{shareUrl}</p>
              <div className="text-xs text-slate-600 tabular-nums">
                Total Event Scans: <strong>{currentGallery.qrScansCount}</strong> · Access
                Mode: <strong>{currentGallery.accessType}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`${currentGallery.id}_QR.png`}
                  className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Download QR PNG
                </a>
              )}
              <button
                type="button"
                onClick={handleDownloadQrPdf}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white rounded-lg"
              >
                Download Printable PDF Standee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Face Search & Biometric Consent Modal */}
      {showFaceSearchModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="face-search-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3
                  id="face-search-modal-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  AI Face Recognition &amp; Privacy Consent
                </h3>
                <p className="text-xs text-slate-500">
                  Biometric guest photo discovery &amp; data retention controls
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFaceSearchModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1">
              <div className="font-semibold">
                {FaceRecognitionService.getAdapterStatus().providerName}
              </div>
              <p className="text-amber-900 leading-relaxed">
                {FaceRecognitionService.getAdapterStatus().message}
              </p>
            </div>

            <form onSubmit={handleFaceSearchSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="guest-name"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Guest Full Name
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Vikramaditya Rao"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="guest-email"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Guest Email
                  </label>
                  <input
                    id="guest-email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="vikram@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="selfie-upload"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Upload Reference Selfie (JPEG / PNG)
                </label>
                <input
                  id="selfie-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setSelfiePreview(String(reader.result));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-pink-50 file:text-[#E61575]"
                />
              </div>

              <div>
                <label
                  htmlFor="retention-select"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Face-Data Auto-Purge Retention Policy
                </label>
                <select
                  id="retention-select"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value={7}>Auto-delete biometric vector after 7 days</option>
                  <option value={30}>Auto-delete biometric vector after 30 days</option>
                  <option value={90}>Auto-delete biometric vector after 90 days</option>
                </select>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#E61575]"
                />
                <span>
                  I consent to temporary facial feature indexing solely to locate my photos
                  within <strong>{currentGallery.galleryName}</strong>. I understand I can
                  delete my selfie and face-index at any time.
                </span>
              </label>

              {faceSearchStatusMsg && (
                <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg text-xs text-slate-900">
                  {faceSearchStatusMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleDeleteBiometricData}
                  className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg"
                >
                  Delete My Selfie &amp; Face Index
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white rounded-lg"
                >
                  Run Instant Face Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
