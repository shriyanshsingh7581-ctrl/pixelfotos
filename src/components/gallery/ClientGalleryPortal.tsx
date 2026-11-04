import React, { useEffect, useState } from 'react';
import {
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  Heart,
  Lock,
  MessageSquare,
  QrCode,
  ScanFace,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../hooks/useAuth';
import { ImageOptimizer } from '../ImageOptimizer';
import {
  calculateSelectionMetrics,
  exportSelectedPhotosToCSV,
  verifyGalleryPassword,
} from '../../utils/studioLogic';
import { FaceRecognitionService } from '../../services/faceRecognitionService';
import { PhotoAsset } from '../../types';

interface ClientGalleryPortalProps {
  initialGalleryId?: string;
  isEmbeddedInDashboard?: boolean;
}

export const ClientGalleryPortal: React.FC<ClientGalleryPortalProps> = ({
  initialGalleryId,
  isEmbeddedInDashboard = false,
}) => {
  const {
    studio,
    galleries,
    photos,
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

  // Lightbox state
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [commentAuthor, setCommentAuthor] = useState<string>('Aanya Mehra');
  const [commentText, setCommentText] = useState<string>('');

  // QR Modal state
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // AI Face Search Modal state
  const [showFaceSearchModal, setShowFaceSearchModal] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [faceSearchStatusMsg, setFaceSearchStatusMsg] = useState<string>('');

  const currentGallery =
    galleries.find((g) => g.id === selectedGalleryId) || galleries[0];
  const galleryPhotos = photos.filter((p) => p.galleryId === currentGallery?.id);

  const isPasswordLocked =
    currentGallery?.accessType === 'password' &&
    !unlockedGalleries[currentGallery.id] &&
    activeRole !== 'studio_owner' &&
    activeRole !== 'super_admin';

  const metrics = calculateSelectionMetrics(
    galleryPhotos,
    currentGallery?.selectionLimit || 50
  );

  const categories = ['all', 'selected', 'liked', ...Array.from(new Set(galleryPhotos.map((p) => p.category)))];

  const filteredPhotos = galleryPhotos.filter((p) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'selected') return p.selected;
    if (categoryFilter === 'liked') return p.liked;
    return p.category === categoryFilter;
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

  const handleDownloadPhoto = (photo: PhotoAsset) => {
    if (!currentGallery?.downloadEnabled && activeRole === 'event_guest') {
      setFeedbackBanner('Direct downloads are disabled by the studio for this gallery.');
      return;
    }
    const a = document.createElement('a');
    a.href = photo.secureUrl;
    a.download = photo.fileName || `${photo.id}.svg`;
    a.click();
    updateGallery(currentGallery.id, {
      downloadCount: (currentGallery.downloadCount || 0) + 1,
    });
    setFeedbackBanner(`Downloaded "${photo.fileName}".`);
  };

  const handleDownloadQrPdf = () => {
    if (!currentGallery || !qrDataUrl) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(studio.studioName, 20, 28);
    doc.setFontSize(14);
    doc.text(`Live Event Gallery: ${currentGallery.galleryName}`, 20, 40);
    doc.setFontSize(10);
    doc.text('Scan the QR code below to view, select, or search event photos on your mobile device.', 20, 50);
    doc.addImage(qrDataUrl, 'PNG', 65, 65, 80, 80);
    doc.text(`Direct URL: ${shareUrl}`, 20, 160);
    doc.save(`${currentGallery.id}_Event_QR_Card.pdf`);
  };

  const handleFaceSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setFaceSearchStatusMsg('Please accept the biometric privacy consent notice before submitting.');
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
    const adapter = FaceRecognitionService.getAdapterStatus();
    setFaceSearchStatusMsg(adapter.message);
    logActivity(`Guest ${guestName} registered face-search consent for ${currentGallery.galleryName}`, guestName);
  };

  const handleDeleteBiometricData = () => {
    if (!guestEmail.trim()) {
      setFaceSearchStatusMsg('Enter the email address used during consent to purge your selfie & face index.');
      return;
    }
    FaceRecognitionService.deleteGuestSelfieAndBiometricData(currentGallery.id, guestEmail);
    setSelfiePreview('');
    setConsentChecked(false);
    setFaceSearchStatusMsg(`Purged selfie and consent record for ${guestEmail}.`);
  };

  if (!currentGallery) return null;

  return (
    <div className="space-y-6">
      {/* Gallery Header & Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{studio.studioName}</span>
              <span aria-hidden="true">·</span>
              <span>{currentGallery.galleryType}</span>
              <span aria-hidden="true">·</span>
              <span>Status: {currentGallery.status.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Expires {currentGallery.expiryDate}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
              {currentGallery.galleryName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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
              className="px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#0D9488]"
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
              className="px-3.5 py-2 text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <QrCode className="w-4 h-4 text-[#0D9488]" />
              <span>Event QR Sharing</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFaceSearchModal(true)}
              className="px-3.5 py-2 text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ScanFace className="w-4 h-4 text-[#0D9488]" />
              <span>AI Face Search</span>
            </button>
          </div>
        </div>

        {/* FotoOwl-Inspired Client Selection & Proofing Toolbar */}
        <div className="pt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-500">Album Selection Progress: </span>
              <strong className="font-mono text-sm text-slate-900 tabular-nums">
                {metrics.selectedCount} / {metrics.selectionLimit}
              </strong>
              <span className="ml-2 text-slate-500 tabular-nums">
                ({metrics.remainingSelections} remaining)
              </span>
            </div>
            <div className="w-36 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0D9488] h-full transition-all"
                style={{ width: `${metrics.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <span>Favourites: {metrics.likedCount}</span>
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
              className="px-3.5 py-2 text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Export CSV</span>
            </button>

            {currentGallery.status !== 'selection_submitted' && currentGallery.status !== 'locked' ? (
              <button
                type="button"
                onClick={() => {
                  updateGallery(currentGallery.id, { status: 'selection_submitted' });
                  setFeedbackBanner(
                    `Submitted ${metrics.selectedCount} selected photos to ${studio.studioName} for album production.`
                  );
                }}
                className="px-4 py-2 text-xs font-medium bg-[#0D9488] text-white hover:bg-teal-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit Final Selection</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  updateGallery(currentGallery.id, { status: 'published' });
                  setFeedbackBanner('Reopened gallery selection for client adjustments.');
                }}
                className="px-4 py-2 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Reopen Selection</span>
              </button>
            )}

            {(activeRole === 'studio_owner' || activeRole === 'studio_admin' || isEmbeddedInDashboard) && (
              <button
                type="button"
                onClick={() => {
                  const nextStatus = currentGallery.status === 'locked' ? 'published' : 'locked';
                  updateGallery(currentGallery.id, { status: nextStatus });
                  setFeedbackBanner(
                    nextStatus === 'locked'
                      ? 'Locked final album selections.'
                      : 'Unlocked gallery selections.'
                  );
                }}
                className="px-3.5 py-2 text-xs font-medium bg-[#0F172A] text-white hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{currentGallery.status === 'locked' ? 'Unlock Gallery' : 'Lock Selections'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {feedbackBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-medium text-teal-950"
        >
          <span>{feedbackBanner}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="text-teal-700 hover:text-teal-950"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Password Gate for Password-Protected Galleries */}
      {isPasswordLocked ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto text-center my-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-[#0D9488]" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-1">
            Private Client Gallery Vault
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Enter the client access passcode to view and proof photos in &ldquo;{currentGallery.galleryName}&rdquo;.
            {currentGallery.passwordHint && (
              <span className="block mt-1 font-mono text-[#0D9488]">{currentGallery.passwordHint}</span>
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
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D9488]"
                required
              />
            </div>
            {passwordError && <p className="text-xs text-rose-600">{passwordError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0F172A] text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Unlock Client Gallery
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Interactive Category Filter Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all'
                    ? `All Photos (${galleryPhotos.length})`
                    : cat === 'selected'
                    ? `Selected (${metrics.selectedCount})`
                    : cat === 'liked'
                    ? `Liked (${metrics.likedCount})`
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
                    updateGallery(currentGallery.id, { watermarkEnabled: e.target.checked })
                  }
                  className="rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
                />
                <span>Studio Watermark Overlay</span>
              </label>
            </div>
          </div>

          {/* Responsive Masonry-Style Photo Grid */}
          {filteredPhotos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-sm text-slate-600 mb-3">
                No photos match the current filter ({categoryFilter}).
              </p>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className="px-4 py-2 text-xs font-medium bg-[#0F172A] text-white rounded-lg"
              >
                Show All Gallery Photos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`group bg-white border rounded-xl overflow-hidden transition-all ${
                    photo.selected
                      ? 'border-[#0D9488] ring-2 ring-[#0D9488]/20'
                      : 'border-slate-200 hover:border-slate-300'
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
                          currentGallery.watermarkEnabled ? currentGallery.watermarkText : undefined
                        }
                        className="w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </button>

                    {/* Top-right Quick Selection & Like Actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePhotoLike(photo.id)}
                        aria-label={`${photo.liked ? 'Unlike' : 'Like'} ${photo.fileName}`}
                        className={`p-2 rounded-lg backdrop-blur-xs transition-colors ${
                          photo.liked
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-950/60 text-white hover:bg-slate-950/80'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPhoto(photo.id)}
                        aria-label={`${
                          photo.selected ? 'Remove from album selection' : 'Select for album'
                        } ${photo.fileName}`}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-xs transition-colors inline-flex items-center gap-1.5 ${
                          photo.selected
                            ? 'bg-[#0D9488] text-white'
                            : 'bg-slate-950/65 text-white hover:bg-slate-950/85'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{photo.selected ? 'Selected' : 'Select'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Footer Metadata (Zero-Pill Unboxed Text) */}
                  <div className="p-3.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{photo.fileName}</p>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                        <span>{photo.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{photo.exif.lens}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setLightboxPhotoId(photo.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md inline-flex items-center gap-1"
                        aria-label={`Comments on ${photo.fileName}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-mono tabular-nums">{photo.comments.length}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPhoto(photo)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
                        aria-label={`Download ${photo.fileName}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
          {/* Left / Main Image Canvas */}
          <div className="flex-1 relative flex flex-col justify-between p-4 md:p-6 overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <span className="font-medium text-white">{activeLightboxPhoto.fileName}</span>
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
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                  <span>{isZoomed ? 'Reset Zoom' : 'Zoom 1.5x'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxPhotoId(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="my-auto flex items-center justify-center relative overflow-hidden py-4">
              {lightboxIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setLightboxPhotoId(filteredPhotos[lightboxIndex - 1].id)}
                  className="absolute left-2 z-10 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
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
                    currentGallery.watermarkEnabled ? currentGallery.watermarkText : undefined
                  }
                  className="w-full h-full max-h-[68vh]"
                />
              </div>

              {lightboxIndex < filteredPhotos.length - 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxPhotoId(filteredPhotos[lightboxIndex + 1].id)}
                  className="absolute right-2 z-10 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bottom EXIF & Quick Actions Bar */}
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
                  className={`px-3.5 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 ${
                    activeLightboxPhoto.liked ? 'bg-rose-600 text-white' : 'bg-white/10 text-white'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Like ({activeLightboxPhoto.likesCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPhoto(activeLightboxPhoto.id)}
                  className={`px-3.5 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 ${
                    activeLightboxPhoto.selected ? 'bg-[#0D9488] text-white' : 'bg-white/10 text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {activeLightboxPhoto.selected ? 'Selected for Album' : 'Select for Album'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPhoto(activeLightboxPhoto)}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 font-medium inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Client Retouching Notes & Comments */}
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
                    <div key={c.id} className="p-3 rounded-lg bg-slate-800/80 text-xs space-y-1">
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
                addPhotoComment(activeLightboxPhoto.id, commentAuthor, 'Client', commentText);
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
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#0D9488]"
                required
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add retouch or album note..."
                  aria-label="Comment Text"
                  className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#0D9488]"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#0D9488] text-white rounded-lg text-xs font-medium hover:bg-teal-700"
                  aria-label="Post Comment"
                >
                  <Send className="w-3.5 h-3.5" />
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
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="qr-modal-title" className="text-xl font-semibold text-slate-900">
                  Instant Event QR Photo Sharing
                </h3>
                <p className="text-xs text-slate-500">
                  Groupfie-style table tent &amp; mobile guest access
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
                aria-label="Close QR Modal"
              >
                <X className="w-5 h-5" />
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
              <p className="text-sm font-semibold text-slate-900">{currentGallery.galleryName}</p>
              <p className="text-xs font-mono text-slate-500 break-all">{shareUrl}</p>
              <div className="text-xs text-slate-600 tabular-nums">
                Total Event Scans: <strong>{currentGallery.qrScansCount}</strong> · Access Mode:{' '}
                <strong>{currentGallery.accessType}</strong>
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
                className="px-4 py-2 text-xs font-medium bg-[#0F172A] text-white rounded-lg hover:bg-slate-800"
              >
                Download Printable PDF Card
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
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <ScanFace className="w-5 h-5 text-[#0D9488]" />
                <div>
                  <h3 id="face-search-modal-title" className="text-lg font-semibold text-slate-900">
                    AI Face Recognition &amp; Privacy Consent
                  </h3>
                  <p className="text-xs text-slate-500">
                    Biometric guest photo discovery &amp; data retention controls
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFaceSearchModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
                aria-label="Close Face Search Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Honest Adapter Status Banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{FaceRecognitionService.getAdapterStatus().providerName}</span>
              </div>
              <p className="text-amber-900 leading-relaxed">
                {FaceRecognitionService.getAdapterStatus().message}
              </p>
            </div>

            <form onSubmit={handleFaceSearchSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-name" className="block text-xs font-medium text-slate-700 mb-1">
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
                  <label htmlFor="guest-email" className="block text-xs font-medium text-slate-700 mb-1">
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
                <label htmlFor="selfie-upload" className="block text-xs font-medium text-slate-700 mb-1">
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
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="retention-select" className="block text-xs font-medium text-slate-700 mb-1">
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
                  className="mt-0.5 rounded border-slate-300 text-[#0D9488]"
                />
                <span>
                  I consent to temporary facial feature indexing solely to locate my photos within{' '}
                  <strong>{currentGallery.galleryName}</strong>. I understand I can delete my selfie and face-index at any time.
                </span>
              </label>

              {faceSearchStatusMsg && (
                <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-800">
                  {faceSearchStatusMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleDeleteBiometricData}
                  className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete My Selfie &amp; Face Index</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Verify Consent &amp; Check Adapter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
