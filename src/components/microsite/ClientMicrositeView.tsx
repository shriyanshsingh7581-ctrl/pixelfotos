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
  Settings,
  ShoppingBag,
  Sparkles,
  Sun,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { triggerDirectDownload } from '../../lib/cloudinary';
import {
  computeFaceEmbeddings,
  ensureFaceModelsLoaded,
  matchEmbeddingAgainstGallery,
} from '../../lib/faceMatchEngine';
import { fileToDataUrl } from '../../lib/imageCullingEngine';
import { ShootPhoto } from '../../types/pixelfotos';
import { BottomSheetModal } from '../shared/BottomSheetModal';
import { MediaFrame } from '../shared/MediaFrame';
import { MobileBottomDock } from '../shared/MobileBottomDock';

export const ClientMicrositeView: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setViewMode,
    openStudioAt,
    microsite,
    deliveryConfig,
    photos,
    printProducts,
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

  // Print Order Modal / Slide-up Bottom Sheet (Synced with Admin printProducts)
  const [printTargetPhoto, setPrintTargetPhoto] = useState<ShootPhoto | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>(printProducts[0]?.id || '');
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
    () => printProducts.find((p) => p.id === selectedProductId) || printProducts[0],
    [printProducts, selectedProductId]
  );

  const coupleMonogram = useMemo(() => {
    const parts = microsite.coupleOrHostName
      .split(/[&+]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]} & ${parts[1][0]}`.toUpperCase();
    }
    return microsite.coupleOrHostName.slice(0, 2).toUpperCase();
  }, [microsite.coupleOrHostName]);

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
      <div className="min-h-screen liquid-canvas flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-md rounded-[28px] liquid-glass p-7 sm:p-8 text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
              {deliveryConfig.studioLogoText} · Private Wedding Microsite
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-editorial font-semibold text-zinc-900 dark:text-white tracking-tight">
              {microsite.coupleOrHostName}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Private wedding gallery protected by PIN. (Demo PIN: {deliveryConfig.pinCode})
            </p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter 4-digit Gallery PIN"
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl liquid-input text-center font-mono tracking-[0.4em] text-lg"
            />
            {pinError && (
              <p className="text-xs text-rose-500">Incorrect PIN. Try {deliveryConfig.pinCode}.</p>
            )}
            <button
              type="submit"
              className="w-full min-h-[48px] py-3 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
            >
              Unlock Wedding Microsite
            </button>
          </form>
          <button
            type="button"
            onClick={() => setViewMode('studio')}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            ← Return to Studio Admin Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-canvas text-zinc-900 dark:text-[#F5F5F7] pb-[120px] md:pb-10">
      {/* 3-Zone Floating Wedding Microsite Top Navigation Bar */}
      <div className="sticky top-0 z-40 px-3 sm:px-6 pt-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 rounded-[20px] liquid-glass-dock flex items-center justify-between gap-3">
          {/* Zone 1: Couple Monogram & Wedding Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/15 flex items-center justify-center font-editorial font-semibold text-xs text-[#B58E24] dark:text-[#D4AF37] shrink-0">
              {coupleMonogram}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-editorial font-semibold text-zinc-900 dark:text-white truncate">
                {microsite.coupleOrHostName}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 truncate">
                {deliveryConfig.studioName} · /{microsite.slug}
              </p>
            </div>
          </div>

          {/* Zone 2: Wedding Microsite Anchor Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <a href="#wedding-story" className="hover:text-[#D4AF37] transition whitespace-nowrap">
              Our Story &amp; Schedule
            </a>
            <a href="#wedding-venue" className="hover:text-[#D4AF37] transition whitespace-nowrap">
              Venue &amp; Live Stream
            </a>
            <a href="#wedding-gallery" className="hover:text-[#D4AF37] transition whitespace-nowrap">
              Wedding Gallery &amp; Prints
            </a>
          </nav>

          {/* Zone 3: Theme + Admin Panel Sync Switch */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="min-w-[40px] min-h-[40px] rounded-full liquid-glass-subtle flex items-center justify-center text-zinc-600 dark:text-zinc-300 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 px-3.5 rounded-full text-xs font-medium liquid-glass-subtle text-zinc-700 dark:text-zinc-200 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Showcase
            </button>
            <button
              type="button"
              onClick={() => openStudioAt('microsite_builder')}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5" />
              Admin Panel
            </button>
          </div>
        </div>
      </div>

      {/* Luxury Editorial Wedding Hero Banner */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-5">
        <div className="relative h-[62vh] sm:h-[70vh] min-h-[420px] rounded-[30px] overflow-hidden liquid-glass p-1.5">
          <div className="relative w-full h-full rounded-[24px] overflow-hidden flex items-end">
            <img
              src={microsite.heroImageUrl}
              alt={microsite.coupleOrHostName}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

            <div className="relative z-10 w-full p-6 sm:p-12 text-white flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.26em] text-[#D4AF37]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {deliveryConfig.studioLogoText} · {microsite.eventType} Celebration
                  </span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-editorial font-semibold tracking-tight leading-[1.02]">
                  {microsite.coupleOrHostName}
                </h1>
                <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                  {microsite.storyText}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-300">
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

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFaceCheckin(true)}
                  className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] shadow-lg cursor-pointer"
                >
                  <ScanFace className="w-4 h-4" />
                  Find My Wedding Photos
                </button>
                <a
                  href="#wedding-gallery"
                  className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/15 backdrop-blur-md border border-white/25 text-white hover:bg-white/25 transition"
                >
                  <Frame className="w-4 h-4 text-[#D4AF37]" />
                  Browse Print Store
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-8 sm:py-12 space-y-12">
        {orderNotice && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[18px] border border-[#10B981]/35 bg-[#10B981]/12 text-sm text-emerald-800 dark:text-emerald-200">
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

        {/* Schedule + Google Maps + Live Stream Bento */}
        <section id="wedding-story" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 liquid-glass rounded-[26px] p-6 sm:p-7 space-y-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
                Wedding Celebrations
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold tracking-tight">
                Ceremony &amp; Festivities Schedule
              </h2>
            </div>

            <div className="space-y-3.5">
              {microsite.schedule.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-[20px] liquid-glass-subtle space-y-1.5 border-l-2 border-l-[#D4AF37]"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
                    <span>
                      0{idx + 1} · {item.dateLabel}
                    </span>
                    <span>{item.timeLabel}</span>
                  </div>
                  <p className="text-lg font-editorial font-semibold text-zinc-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.venueHall} · Attire: {item.dressCode}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div id="wedding-venue" className="lg:col-span-7 space-y-5">
            <div className="liquid-glass rounded-[26px] p-5 sm:p-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
                    Royal Venue &amp; Navigation
                  </p>
                  <h3 className="text-xl sm:text-2xl font-editorial font-semibold">
                    {microsite.venueName}, {microsite.venueCity}
                  </h3>
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
                className="w-full h-52 rounded-[18px] border border-black/10 dark:border-white/10"
                loading="lazy"
              />
            </div>

            <div className="liquid-glass rounded-[26px] p-5 sm:p-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#10B981]" />
                  <h3 className="text-lg font-editorial font-semibold">
                    Live Wedding Ceremony Broadcast
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#10B981]">1080p Live Stream</span>
              </div>
              <div className="aspect-video rounded-[18px] overflow-hidden border border-black/10 dark:border-white/10 bg-black">
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

        {/* Integrated Guest Gallery + Real face-api.js Match + Synchronized Print Store */}
        <section id="wedding-gallery" className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-black/8 dark:border-white/10 pb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
                Curated Wedding Gallery &amp; Fine-Art Print Store
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold tracking-tight">
                Timeless Moments · Graded with {activeLut?.name || 'Studio LUT'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowFaceCheckin(true)}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
              >
                <ScanFace className="w-4 h-4" />
                Find My Photos (AI Face Match)
              </button>

              <div className="inline-flex p-1 rounded-[16px] liquid-glass-subtle">
                {[
                  { id: 'all' as const, label: `All Curated (${visiblePhotos.length})` },
                  {
                    id: 'only_you' as const,
                    label: `Only You (${matchedMap.size > 0 ? matchedMap.size : 'AI'})`,
                  },
                  { id: 'unknown' as const, label: 'Unindexed' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setGalleryTab(t.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      galleryTab === t.id
                        ? 'bg-white dark:bg-[#1E2028] text-zinc-900 dark:text-white shadow-xs'
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
            <div className="px-4 py-2.5 rounded-[16px] border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
              {faceMatchStatus}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visiblePhotos.map((photo) => {
              const conf = matchedMap.get(photo.id);
              return (
                <div
                  key={photo.id}
                  className="liquid-glass rounded-[24px] overflow-hidden flex flex-col"
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
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {conf ? `${conf}% Face Match` : photo.eventSection} · {photo.capturedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleGuestLike(photo.id)}
                        aria-label={`Heart ${photo.fileName}`}
                        className={`min-h-[40px] inline-flex items-center gap-1 px-2.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          photo.guestLiked
                            ? 'border-rose-500/40 bg-rose-500/15 text-rose-500'
                            : 'border-black/10 dark:border-white/12 text-zinc-600 dark:text-zinc-300'
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
                          className="min-w-[40px] min-h-[40px] rounded-full liquid-glass-subtle flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPrintTargetPhoto(photo)}
                        className="min-h-[40px] inline-flex items-center gap-1 px-3 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
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

      {/* Slide-Up Bottom Sheet for Guest Selfie AI Check-In */}
      <BottomSheetModal
        open={showFaceCheckin}
        onClose={() => setShowFaceCheckin(false)}
        title="Find My Photos (AI Face Match)"
        subtitle="face-api.js 128-d Biometric Check-In"
        footer={
          <button
            type="submit"
            form="guest-face-checkin-form"
            disabled={matchingFaces}
            className="w-full min-h-[48px] rounded-full text-sm font-semibold bg-[#10B981] text-[#090B10] cursor-pointer disabled:opacity-60"
          >
            {matchingFaces ? 'Scanning 128-d Vectors...' : 'Apply & Match My Photos'}
          </button>
        }
      >
        <form id="guest-face-checkin-form" onSubmit={handleQuickFaceMatch} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
              Your Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Meera Kapoor"
              value={quickGuestName}
              onChange={(e) => setQuickGuestName(e.target.value)}
              required
              className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl liquid-input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
              WhatsApp for Instant Alerts
            </label>
            <input
              type="text"
              placeholder="+91 98200 12345"
              value={quickGuestWhatsapp}
              onChange={(e) => setQuickGuestWhatsapp(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl liquid-input text-sm font-mono"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
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
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl liquid-glass-subtle text-xs font-semibold cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#D4AF37]" />
                {selfiePreview ? 'Selfie Ready ✓' : 'Capture / Upload Selfie'}
              </button>
            </div>
            <select
              value={selectedGuestId}
              onChange={(e) => setSelectedGuestId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl liquid-input text-sm"
            >
              {registeredGuests.map((g) => (
                <option key={g.id} value={g.id}>
                  Profile: {g.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </BottomSheetModal>

      {/* Slide-Up Bottom Sheet for Print Order (Reads Admin-Synced printProducts) */}
      <BottomSheetModal
        open={Boolean(printTargetPhoto)}
        onClose={() => setPrintTargetPhoto(null)}
        title="Order Fine-Art Print, Frame or Album"
        subtitle={`${deliveryConfig.studioName} Print Store · Synced with Admin Pricing`}
        footer={
          activePrintProduct ? (
            <button
              type="submit"
              form="client-print-order-form"
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Order {activePrintProduct.name} · ₹
              {activePrintProduct.clientPriceInr.toLocaleString('en-IN')}
            </button>
          ) : null
        }
      >
        {printTargetPhoto && (
          <form id="client-print-order-form" onSubmit={handleSubmitPrintOrder} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-[18px] liquid-glass-subtle">
              <MediaFrame
                src={printTargetPhoto.url}
                alt={printTargetPhoto.fileName}
                className="w-16 h-16 rounded-xl shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{printTargetPhoto.fileName}</p>
                <p className="text-xs text-zinc-500 truncate">
                  Museum Archival Print · {printTargetPhoto.rawFileName}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {printProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProductId(product.id)}
                  className={`w-full min-h-[52px] text-left p-3.5 rounded-[18px] border flex items-center justify-between cursor-pointer ${
                    activePrintProduct?.id === product.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/12'
                      : 'border-black/10 dark:border-white/12'
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
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl liquid-input text-sm"
            />
          </form>
        )}
      </BottomSheetModal>

      <MobileBottomDock />
    </div>
  );
};
