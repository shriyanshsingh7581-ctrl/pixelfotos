import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  Download,
  ExternalLink,
  Frame,
  Heart,
  Lock,
  MapPin,
  Moon,
  Radio,
  ScanFace,
  ShoppingBag,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { PRINT_STORE_CATALOG } from '../../data/pixelfotosData';
import { triggerDirectDownload } from '../../lib/cloudinary';
import {
  computeFaceEmbeddings,
  ensureFaceModelsLoaded,
  matchEmbeddingAgainstGallery,
} from '../../lib/faceMatchEngine';
import { fileToDataUrl } from '../../lib/imageCullingEngine';
import { ShootPhoto } from '../../types/pixelfotos';
import { MediaFrame } from '../shared/MediaFrame';

export const ClientMicrositeView: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setViewMode,
    microsite,
    deliveryConfig,
    photos,
    toggleGuestLike,
    updatePhotoEmbeddings,
    registeredGuests,
    registerGuest,
    placePrintOrder,
    luts,
    activeLutId,
    watermark,
    batchExposureMatch,
  } = usePixelFotos();

  // PIN Gate state
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Real AI Face Match Tabs
  const [galleryTab, setGalleryTab] = useState<'only_you' | 'all' | 'unknown'>('all');
  const [selectedGuestId, setSelectedGuestId] = useState<string>(registeredGuests[0]?.id || '');
  const [quickGuestName, setQuickGuestName] = useState('');
  const [quickGuestWhatsapp, setQuickGuestWhatsapp] = useState('');
  const [showFaceCheckin, setShowFaceCheckin] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [matchingFaces, setMatchingFaces] = useState(false);
  const [faceMatchStatus, setFaceMatchStatus] = useState<string | null>(null);
  const [matchedMap, setMatchedMap] = useState<Map<string, number>>(new Map());
  const selfieFileRef = useRef<HTMLInputElement | null>(null);

  // Print Order Modal
  const [printTargetPhoto, setPrintTargetPhoto] = useState<ShootPhoto | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>(PRINT_STORE_CATALOG[0].id);
  const [buyerName, setBuyerName] = useState<string>('Ananya Verma');
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  const activeLut = useMemo(
    () => luts.find((l) => l.id === activeLutId) || luts[0],
    [luts, activeLutId]
  );

  const activeGuest = useMemo(
    () => registeredGuests.find((g) => g.id === selectedGuestId) || registeredGuests[0],
    [registeredGuests, selectedGuestId]
  );

  const visiblePhotos = useMemo(() => {
    const curated = photos.filter((p) => p.aiSelected || p.cullingTag === 'best_pick');
    if (galleryTab === 'only_you') {
      if (matchedMap.size > 0) {
        return curated.filter((p) => matchedMap.has(p.id));
      }
      const cluster = activeGuest?.faceClusterKey || 'guest_ananya';
      return curated.filter((p) => p.faceMatchClusters.includes(cluster));
    }
    if (galleryTab === 'unknown') {
      return photos.filter(
        (p) =>
          (p.faceEmbeddings && p.faceEmbeddings.length === 0) ||
          p.faceMatchClusters.includes('unknown')
      );
    }
    return curated;
  }, [photos, galleryTab, activeGuest, matchedMap]);

  const activePrintProduct = useMemo(
    () => PRINT_STORE_CATALOG.find((p) => p.id === selectedProductId) || PRINT_STORE_CATALOG[0],
    [selectedProductId]
  );

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === deliveryConfig.pinCode) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const runBiometricSelfieMatch = async (selfieDataUrl: string, guestLabel: string) => {
    setMatchingFaces(true);
    setFaceMatchStatus('Loading face-api.js neural models & scanning gallery embeddings...');
    try {
      const ok = await ensureFaceModelsLoaded((s) => setFaceMatchStatus(s));
      if (!ok) {
        setFaceMatchStatus('Unable to reach model CDN; displaying tagged cluster.');
        setGalleryTab('only_you');
        return;
      }

      const selfieEmbs = await computeFaceEmbeddings(selfieDataUrl);
      const indexedPhotos = [...photos];
      for (let i = 0; i < indexedPhotos.length; i++) {
        if (!indexedPhotos[i].faceEmbeddings) {
          const embs = await computeFaceEmbeddings(indexedPhotos[i].url);
          updatePhotoEmbeddings(indexedPhotos[i].id, embs);
          indexedPhotos[i] = { ...indexedPhotos[i], faceEmbeddings: embs };
        }
      }

      if (selfieEmbs.length > 0) {
        const matches = matchEmbeddingAgainstGallery(selfieEmbs[0], indexedPhotos, 0.62);
        const nextMap = new Map<string, number>();
        matches.forEach((m) => nextMap.set(m.photoId, m.confidencePct));
        setMatchedMap(nextMap);
        setGalleryTab('only_you');
        setFaceMatchStatus(
          `AI Face Match complete for ${guestLabel}: ${matches.length} matched photo(s) via 128-d Euclidean distance.`
        );
        return selfieEmbs[0];
      }

      setGalleryTab('only_you');
      setFaceMatchStatus(`No crisp face found in selfie; showing ${guestLabel}'s tagged photos.`);
      return undefined;
    } finally {
      setMatchingFaces(false);
    }
  };

  const handleQuickSelfieFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setSelfiePreview(dataUrl);
  };

  const handleQuickFaceMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGuestName.trim()) return;
    const targetUrl = selfiePreview || activeGuest?.selfieUrl || '';
    let embedding: number[] | undefined;
    if (targetUrl) {
      embedding = await runBiometricSelfieMatch(targetUrl, quickGuestName.trim());
    }

    const g = registerGuest({
      name: quickGuestName.trim(),
      whatsapp: quickGuestWhatsapp.trim() || '+91 98200 12345',
      selfieUrl: targetUrl || undefined,
      faceEmbedding: embedding,
    });
    setSelectedGuestId(g.id);
    setShowFaceCheckin(false);
    setQuickGuestName('');
    setQuickGuestWhatsapp('');
  };

  const handleSubmitPrintOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!printTargetPhoto || !activePrintProduct) return;
    placePrintOrder({
      photoId: printTargetPhoto.id,
      photoFileName: printTargetPhoto.fileName,
      photoUrl: printTargetPhoto.url,
      productId: activePrintProduct.id,
      productName: activePrintProduct.name,
      category: activePrintProduct.category,
      dimensions: activePrintProduct.dimensions,
      quantity: 1,
      clientTotalInr: activePrintProduct.clientPriceInr,
      studioProfitInr: activePrintProduct.clientPriceInr - activePrintProduct.studioCostInr,
      customerName: buyerName.trim() || 'Wedding Guest',
    });
    setOrderNotice(
      `Ordered ${activePrintProduct.name} (₹${activePrintProduct.clientPriceInr.toLocaleString(
        'en-IN'
      )}) · Sent to ${deliveryConfig.studioName} Print Lab!`
    );
    setPrintTargetPhoto(null);
  };

  if (deliveryConfig.pinProtected && !unlocked) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#090B10] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#B58E24] dark:text-[#D4AF37]">
              {deliveryConfig.studioLogoText}
            </p>
            <h2 className="mt-2 text-3xl font-editorial font-semibold text-zinc-900 dark:text-white">
              {microsite.coupleOrHostName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              This private event gallery is PIN protected. (Demo PIN: {deliveryConfig.pinCode})
            </p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter 4-digit Gallery PIN"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-[#090B10] text-center font-mono tracking-[0.4em] text-lg text-zinc-900 dark:text-white"
            />
            {pinError && (
              <p className="text-xs text-rose-500">
                Incorrect PIN. Try {deliveryConfig.pinCode}.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
            >
              Unlock Client Gallery
            </button>
          </form>
          <button
            type="button"
            onClick={() => setViewMode('studio')}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            ← Return to Studio Command Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#090B10] text-zinc-900 dark:text-white">
      <div className="sticky top-0 z-40 border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-[#090B10]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setViewMode('studio')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-[#B58E24] dark:hover:text-[#D4AF37] cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Studio Command
          </button>

          <span className="hidden sm:inline-block text-xs font-mono text-zinc-500 dark:text-zinc-400">
            pixelfotos.online/{microsite.slug} · Branded by {deliveryConfig.studioName}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37] cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-[#D4AF37] cursor-pointer whitespace-nowrap"
            >
              Public Showcase
            </button>
          </div>
        </div>
      </div>

      {/* Editorial Hero */}
      <section className="relative h-[66vh] min-h-[440px] flex items-end overflow-hidden">
        <img
          src={microsite.heroImageUrl}
          alt={microsite.coupleOrHostName}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090B10] via-[#090B10]/45 to-black/25" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-12 text-white">
          <p
            className="text-xs font-mono uppercase tracking-[0.28em]"
            style={{ color: deliveryConfig.accentColor }}
          >
            {deliveryConfig.studioLogoText} · {microsite.eventType} Celebration
          </p>
          <h1 className="mt-2 text-5xl sm:text-7xl font-editorial font-semibold tracking-tight">
            {microsite.coupleOrHostName}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-200 max-w-2xl">
            {microsite.storyText}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              {microsite.eventDate}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              {microsite.venueName}, {microsite.venueCity}
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {orderNotice && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#10B981]/35 bg-[#10B981]/10 text-sm text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#10B981]" />
              <span>{orderNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setOrderNotice(null)}
              className="text-xs font-mono uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Schedule + Google Maps + Live Stream */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-6 space-y-4">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
              Celebration Itinerary
            </p>
            <h2 className="text-3xl font-editorial font-semibold">Event Schedule</h2>
            <div className="space-y-3">
              {microsite.schedule.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10]"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
                    <span>{item.dateLabel}</span>
                    <span>{item.timeLabel}</span>
                  </div>
                  <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {item.venueHall} · Dress: {item.dressCode}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#B58E24] dark:text-[#D4AF37]">
                    Venue Directions
                  </p>
                  <h3 className="text-lg font-semibold">{microsite.venueName}</h3>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    microsite.googleMapsQuery
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B58E24] dark:text-[#D4AF37] hover:underline"
                >
                  Open Google Maps
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <iframe
                title="Venue Google Map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  microsite.googleMapsQuery
                )}&output=embed`}
                className="w-full h-52 rounded-xl border border-zinc-200 dark:border-white/10"
                loading="lazy"
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#10B981]" />
                  <h3 className="text-base font-semibold">Live Ceremony Stream (YouTube / RTMP)</h3>
                </div>
                <span className="text-xs font-mono text-[#10B981]">1080p Live</span>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-black">
                <iframe
                  title="Live Wedding Ceremony Broadcast"
                  src={microsite.youtubeStreamUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        {/* Integrated Guest Gallery + Real face-api.js Match + Print Store */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
                Live Client Gallery &amp; Print Store
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold">
                Moments Captured Live
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFaceCheckin((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
              >
                <ScanFace className="w-4 h-4" />
                Find My Photos (AI Face Match)
              </button>

              <div className="inline-flex p-1 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#11141D]">
                {[
                  { id: 'all' as const, label: 'All Photos' },
                  { id: 'only_you' as const, label: `Only You (${matchedMap.size > 0 ? matchedMap.size : 'AI'})` },
                  { id: 'unknown' as const, label: 'Unknown Faces' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setGalleryTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      galleryTab === t.id
                        ? 'bg-white dark:bg-[#090B10] text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {faceMatchStatus && (
            <div className="px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
              {faceMatchStatus}
            </div>
          )}

          {showFaceCheckin && (
            <form
              onSubmit={handleQuickFaceMatch}
              className="rounded-2xl border border-[#D4AF37]/40 bg-white dark:bg-[#11141D] p-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-center"
            >
              <input
                type="text"
                placeholder="Your Full Name *"
                value={quickGuestName}
                onChange={(e) => setQuickGuestName(e.target.value)}
                required
                className="px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm"
              />
              <input
                type="text"
                placeholder="WhatsApp for updates"
                value={quickGuestWhatsapp}
                onChange={(e) => setQuickGuestWhatsapp(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm font-mono"
              />
              <input
                ref={selfieFileRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleQuickSelfieFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => selfieFileRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/15 text-xs font-semibold cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#D4AF37]" />
                {selfiePreview ? 'Selfie Ready ✓' : 'Upload / Capture Selfie'}
              </button>
              <select
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm"
              >
                {registeredGuests.map((g) => (
                  <option key={g.id} value={g.id}>
                    Profile: {g.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={matchingFaces}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#10B981] text-[#090B10] cursor-pointer disabled:opacity-60"
              >
                {matchingFaces ? 'Scanning 128-d...' : 'Match My Photos'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visiblePhotos.map((photo) => {
              const conf = matchedMap.get(photo.id);
              return (
                <div
                  key={photo.id}
                  className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] overflow-hidden flex flex-col"
                >
                  <MediaFrame
                    src={photo.url}
                    alt={photo.fileName}
                    lut={activeLut}
                    watermark={watermark}
                    batchExposureMatch={batchExposureMatch}
                    className="aspect-[4/3]"
                  />
                  <div className="p-4 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{photo.fileName}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {conf ? `${conf}% Face Match` : photo.eventSection} · {photo.capturedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleGuestLike(photo.id)}
                        aria-label={`Heart ${photo.fileName}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          photo.guestLiked
                            ? 'border-rose-500/40 bg-rose-500/15 text-rose-500'
                            : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${photo.guestLiked ? 'fill-current' : ''}`} />
                        {photo.likesCount}
                      </button>

                      {deliveryConfig.allowHighResDownload && (
                        <button
                          type="button"
                          onClick={() => triggerDirectDownload(photo.url, photo.fileName)}
                          aria-label={`Download ${photo.fileName}`}
                          className="p-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPrintTargetPhoto(photo)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
                      >
                        <Frame className="w-3.5 h-3.5" />
                        Order Print
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {printTargetPhoto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#11141D] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
                  {deliveryConfig.studioName} Print Lab
                </p>
                <h3 className="text-xl font-editorial font-semibold">
                  Order Print or Heirloom Frame
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintTargetPhoto(null)}
                aria-label="Close print modal"
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPrintOrder} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#090B10]">
                <MediaFrame
                  src={printTargetPhoto.url}
                  alt={printTargetPhoto.fileName}
                  className="w-16 h-16 rounded-lg shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold">{printTargetPhoto.fileName}</p>
                  <p className="text-xs text-zinc-500">
                    Museum Archival Print Ready · {printTargetPhoto.rawFileName}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {PRINT_STORE_CATALOG.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                      selectedProductId === product.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : 'border-zinc-200 dark:border-white/10'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-zinc-500">
                        {product.category} · {product.dimensions}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-semibold tabular-nums">
                      ₹{product.clientPriceInr.toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Your Full Name *"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm"
              />

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Confirm Print Order · ₹
                {activePrintProduct.clientPriceInr.toLocaleString('en-IN')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
