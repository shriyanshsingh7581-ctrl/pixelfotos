import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FolderCheck,
  FolderSearch,
  Heart,
  ImagePlus,
  MessageCircle,
  Printer,
  ScanFace,
  Send,
  Sparkles,
  Star,
  Upload,
  Usb,
  UserPlus,
  Zap,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { PIXELFOTOS_ASSETS } from '../../data/pixelfotosData';
import { triggerDirectDownload } from '../../lib/cloudinary';
import {
  computeFaceEmbeddings,
  ensureFaceModelsLoaded,
  matchEmbeddingAgainstGallery,
} from '../../lib/faceMatchEngine';
import { analyzeImageOnCanvas, fileToDataUrl } from '../../lib/imageCullingEngine';
import {
  locateAndCopyWithDirectoryPicker,
  matchAndZipFromFileList,
  RawMatchReport,
  supportsDirectoryPicker,
} from '../../lib/rawMatcherEngine';
import { LifecycleStageNumber, ShootPhoto } from '../../types/pixelfotos';
import { MediaFrame } from '../shared/MediaFrame';
import { QrCodeCanvas } from '../shared/QrCodeCanvas';

const STAGES: { num: LifecycleStageNumber; short: string; title: string }[] = [
  { num: 1, short: 'Create Event', title: '1. Create the Event' },
  { num: 2, short: 'Venue QR', title: '2. At the Event · QR Standee' },
  { num: 3, short: 'Live Sync', title: '3. Live C-to-C Uploading' },
  { num: 4, short: 'AI Face Match', title: '4. AI Face Match Gallery' },
  { num: 5, short: 'Locate Originals', title: '5. RAW Original Matcher' },
  { num: 6, short: '2 Months Later', title: '6. Memory Lane & Review' },
];

export const EventLifecycleWorkflow: React.FC = () => {
  const {
    activeLifecycleStage,
    setActiveLifecycleStage,
    microsite,
    setMicrosite,
    createNewEvent,
    photos,
    addPhotos,
    toggleGuestLike,
    updatePhotoEmbeddings,
    registeredGuests,
    registerGuest,
    dispatchLogs,
    triggerFirstPhotoUploadDispatch,
    openMicrositeBySlug,
  } = usePixelFotos();

  const [notice, setNotice] = useState<string | null>(null);

  // Stage 2: Guest QR Registration & Standee QR export
  const [guestName, setGuestName] = useState('');
  const [guestWhatsapp, setGuestWhatsapp] = useState('');
  const [guestSelfiePreview, setGuestSelfiePreview] = useState<string>(
    PIXELFOTOS_ASSETS.weddingBridal
  );
  const [guestSelfieEmbedding, setGuestSelfieEmbedding] = useState<number[] | undefined>(undefined);
  const [standeeQrUrl, setStandeeQrUrl] = useState<string>('');
  const [indexingSelfie, setIndexingSelfie] = useState(false);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  // Stage 3: Live C-to-C Monitor
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(48);
  const tetherFileInputRef = useRef<HTMLInputElement | null>(null);

  // Stage 4: Real face-api.js Guest Experience
  const [faceTab, setFaceTab] = useState<'only_you' | 'all' | 'unknown'>('only_you');
  const [selectedGuestId, setSelectedGuestId] = useState<string>(
    registeredGuests[0]?.id || 'gst_1'
  );
  const [faceStatus, setFaceStatus] = useState<string | null>(null);
  const [indexingGallery, setIndexingGallery] = useState(false);
  const [matchedScores, setMatchedScores] = useState<Map<string, number>>(new Map());
  const stage4SelfieRef = useRef<HTMLInputElement | null>(null);

  // Stage 5: Real File System Access API RAW Matcher
  const [rawReport, setRawReport] = useState<RawMatchReport | null>(null);
  const [matchingRaw, setMatchingRaw] = useState(false);
  const rawFolderInputRef = useRef<HTMLInputElement | null>(null);

  // Stage 6: Retention & 5-Star Google Review
  const [autoSchedule60Days, setAutoSchedule60Days] = useState(true);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('https://g.page/r/pixelfotos-atelier/review');
  const [thankYouMessage, setThankYouMessage] = useState(
    `Thank you, ${microsite.coupleOrHostName}! Two months ago we celebrated your unforgettable story in ${microsite.venueCity}. Your curated Memory Lane highlight reel is now live.`
  );
  const [retentionSentAt, setRetentionSentAt] = useState<string | null>(null);

  const eventUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${microsite.slug}`
      : `https://pixelfotos.online/${microsite.slug}`;

  const slugify = (val: string) =>
    val
      .toLowerCase()
      .replace(/&/g, ' ')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'event-showcase';

  const handleStage1WhatsAppShare = () => {
    const text = `Welcome to ${microsite.coupleOrHostName}'s ${microsite.eventType} Gallery! Save our dedicated portal & register your selfie for instant AI photo alerts: ${eventUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setNotice('Opened WhatsApp share intent for event microsite link.');
  };

  const handleCopyEventLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setNotice(`Copied ${eventUrl} to clipboard.`);
    } catch {
      setNotice(`Share URL: ${eventUrl}`);
    }
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIndexingSelfie(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setGuestSelfiePreview(dataUrl);
      const descriptors = await computeFaceEmbeddings(dataUrl);
      if (descriptors.length > 0) {
        setGuestSelfieEmbedding(descriptors[0]);
        setNotice('Extracted 128-d face vector from uploaded guest selfie using face-api.js.');
      } else {
        setGuestSelfieEmbedding(undefined);
        setNotice('Selfie loaded. Upload a clear front-facing portrait for 128-d biometric matching.');
      }
    } finally {
      setIndexingSelfie(false);
    }
  };

  const handleGuestRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestWhatsapp.trim()) return;

    let embedding = guestSelfieEmbedding;
    if (!embedding) {
      setIndexingSelfie(true);
      const found = await computeFaceEmbeddings(guestSelfiePreview).catch(() => []);
      if (found.length > 0) embedding = found[0];
      setIndexingSelfie(false);
    }

    const created = registerGuest({
      name: guestName,
      whatsapp: guestWhatsapp,
      selfieUrl: guestSelfiePreview,
      faceEmbedding: embedding,
    });
    setSelectedGuestId(created.id);
    setGuestName('');
    setGuestWhatsapp('');
    setNotice(
      `Registered ${created.name} · ${
        embedding ? '128-d Face Vector saved' : 'Profile saved'
      } & queued for WhatsApp updates.`
    );
  };

  const handleDownloadStandeeQr = async () => {
    if (!standeeQrUrl) return;
    await triggerDirectDownload(standeeQrUrl, `PixelFotos_QR_Standee_${microsite.slug}.png`);
    setNotice('Downloaded high-contrast Event QR Standee graphic.');
  };

  // Stage 3: Live C-to-C Camera Frame Push
  const handleSimulateCameraShot = () => {
    setSyncInProgress(true);
    setTimeout(() => {
      const nextNum = 4700 + photos.length;
      const sampleUrls = [
        PIXELFOTOS_ASSETS.heroRoyalWedding,
        PIXELFOTOS_ASSETS.weddingHaldi,
        PIXELFOTOS_ASSETS.weddingSangeet,
        PIXELFOTOS_ASSETS.weddingReception,
      ];
      const chosenUrl = sampleUrls[photos.length % sampleUrls.length];
      const newPhoto: ShootPhoto = {
        id: `tether_${Date.now()}`,
        eventId: microsite.id,
        fileName: `PF_LIVE_${nextNum}.jpg`,
        rawFileName: `DSC_${nextNum}.CR3`,
        url: chosenUrl,
        eventSection: 'Wedding',
        poseClusterId: 'Live C-to-C Stream',
        cullingTag: 'best_pick',
        confidenceScore: 98,
        sharpnessScore: 91,
        starRating: 5,
        aiSelected: true,
        guestLiked: false,
        likesCount: 1,
        faceMatchClusters: ['guest_ananya', 'guest_meera'],
        cameraModel: 'Canon EOS R5 (USB-C)',
        exifSummary: '35mm · f/1.4 · 1/640s · ISO 320',
        capturedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addPhotos([newPhoto]);
      setLastSyncSeconds(42 + (photos.length % 9));
      setSyncInProgress(false);
      setNotice(`Synced ${newPhoto.fileName} from camera over USB-C in ${lastSyncSeconds}s.`);
    }, 350);
  };

  const handleTetherFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const created: ShootPhoto[] = [];
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const base = file.name.replace(/\.[^.]+$/, '');
      const dataUrl = await fileToDataUrl(file);
      const metrics = await analyzeImageOnCanvas(dataUrl);
      const embeddings = await computeFaceEmbeddings(dataUrl).catch(() => []);
      created.push({
        id: `live_up_${Date.now()}_${idx}`,
        eventId: microsite.id,
        fileName: file.name,
        rawFileName: `${base}.CR3`,
        url: dataUrl,
        eventSection: 'Wedding',
        poseClusterId: 'Live C-to-C Stream',
        cullingTag: metrics.suggestedTag,
        confidenceScore: metrics.confidenceScore,
        sharpnessScore: metrics.sharpnessScore,
        brightnessScore: metrics.brightnessScore,
        contrastScore: metrics.contrastScore,
        faceEmbeddings: embeddings,
        starRating: metrics.starRating,
        aiSelected: true,
        guestLiked: false,
        likesCount: 0,
        faceMatchClusters: embeddings.length > 0 ? ['guest_ananya'] : ['unknown'],
        cameraModel: 'USB-C Direct Upload',
        exifSummary: `${metrics.width}×${metrics.height}px`,
        capturedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
    addPhotos(created);
    setNotice(`Uploaded & face-indexed ${created.length} live frame(s) straight into the gallery.`);
  };

  // Stage 4: Real face-api.js Indexing & Selfie Match
  const activeGuest = useMemo(
    () => registeredGuests.find((g) => g.id === selectedGuestId) || registeredGuests[0],
    [registeredGuests, selectedGuestId]
  );

  const handleRunRealFaceIndexingAndMatch = async (customSelfieUrl?: string) => {
    setIndexingGallery(true);
    setFaceStatus('Loading face-api.js TinyFaceDetector & 128-d FaceRecognitionNet models...');
    try {
      const loaded = await ensureFaceModelsLoaded((msg) => setFaceStatus(msg));
      if (!loaded) {
        setFaceStatus('Neural model CDN unreachable offline; using cached guest cluster tags.');
        return;
      }

      const updatedPhotos = [...photos];
      for (let i = 0; i < updatedPhotos.length; i++) {
        const p = updatedPhotos[i];
        if (!p.faceEmbeddings) {
          setFaceStatus(`Computing 128-d embeddings (${i + 1}/${updatedPhotos.length}): ${p.fileName}`);
          const embs = await computeFaceEmbeddings(p.url);
          updatePhotoEmbeddings(p.id, embs);
          updatedPhotos[i] = { ...p, faceEmbeddings: embs };
        }
      }

      const targetSelfie = customSelfieUrl || activeGuest?.selfieUrl || PIXELFOTOS_ASSETS.weddingBridal;
      setFaceStatus('Extracting 128-d descriptor from guest selfie...');
      const selfieVecs = activeGuest?.faceEmbedding && !customSelfieUrl
        ? [activeGuest.faceEmbedding]
        : await computeFaceEmbeddings(targetSelfie);

      if (selfieVecs.length > 0) {
        const results = matchEmbeddingAgainstGallery(selfieVecs[0], updatedPhotos, 0.62);
        const map = new Map<string, number>();
        results.forEach((r) => map.set(r.photoId, r.confidencePct));
        setMatchedScores(map);
        setFaceTab('only_you');
        setFaceStatus(
          `face-api.js matched ${results.length} photo(s) via 128-d Euclidean distance.`
        );
      } else {
        setFaceStatus('No clear face detected in selected selfie. Showing fallback cluster matches.');
      }
    } finally {
      setIndexingGallery(false);
    }
  };

  const handleStage4SelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    await handleRunRealFaceIndexingAndMatch(dataUrl);
  };

  const stage4Photos = useMemo(() => {
    if (faceTab === 'all') return photos;
    if (faceTab === 'unknown') {
      return photos.filter(
        (p) =>
          (p.faceEmbeddings && p.faceEmbeddings.length === 0) ||
          p.faceMatchClusters.includes('unknown')
      );
    }
    if (matchedScores.size > 0) {
      return photos.filter((p) => matchedScores.has(p.id));
    }
    const cluster = activeGuest?.faceClusterKey || 'guest_meera';
    return photos.filter((p) => p.faceMatchClusters.includes(cluster));
  }, [photos, faceTab, activeGuest, matchedScores]);

  // Stage 5: Real File System Access API Locate Originals
  const likedShortlist = useMemo(() => photos.filter((p) => p.guestLiked), [photos]);

  const handleLocateWithDirectoryPicker = async () => {
    if (likedShortlist.length === 0) {
      setNotice('Shortlist is empty. Guests must heart at least 1 photo first.');
      return;
    }
    setMatchingRaw(true);
    try {
      const report = await locateAndCopyWithDirectoryPicker(likedShortlist);
      setRawReport(report);
      setNotice(
        `Scanned ${report.totalScannedFiles} files · Copied ${report.matchedFiles.length} original(s) into "${report.outputFolderName}".`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'UNSUPPORTED_DIRECTORY_PICKER') {
        rawFolderInputRef.current?.click();
      } else {
        setNotice('Folder selection cancelled or blocked by iframe sandbox—use "Select Folder Fallback" below.');
      }
    } finally {
      setMatchingRaw(false);
    }
  };

  const handleFallbackRawFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setMatchingRaw(true);
    try {
      const report = await matchAndZipFromFileList(files, likedShortlist, true);
      setRawReport(report);
      setNotice(
        `Scanned ${report.totalScannedFiles} files · Matched ${report.matchedFiles.length} original(s) & packaged Selected_Originals.zip.`
      );
    } finally {
      setMatchingRaw(false);
    }
  };

  const handleExportCopyScript = async () => {
    const rawNames = likedShortlist.map((p) => p.rawFileName);
    const scriptContent = [
      '# PixelFotos 1-Click Locate Originals — Batch Copy Script',
      `# Event: ${microsite.coupleOrHostName} (${rawNames.length} Guest-Liked RAWs)`,
      'mkdir -p ./Selected_Originals',
      ...rawNames.map((name) => `cp "./${name}" "./Selected_Originals/"`),
    ].join('\n');

    const uri = `data:text/plain;charset=utf-8,${encodeURIComponent(scriptContent)}`;
    await triggerDirectDownload(uri, `PixelFotos_Locate_Originals_${microsite.slug}.sh`);
    setNotice(`Exported batch copy script for ${rawNames.length} shortlisted originals.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
            Main Event Lifecycle · 6 Functional Stages
          </p>
          <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold text-zinc-900 dark:text-white tracking-tight">
            {microsite.coupleOrHostName} — End-to-End Event Command
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Manage live event creation, printable QR standees, C-to-C tethering, real face-api.js biometric matching, File System API RAW matching, and 60-day retention.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openMicrositeBySlug(microsite.slug)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] transition whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
        >
          <ExternalLink className="w-4 h-4" />
          Open /{microsite.slug} Live
        </button>
      </div>

      {/* Horizontal 6-Stage Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STAGES.map((stage) => {
          const active = activeLifecycleStage === stage.num;
          return (
            <button
              key={stage.num}
              type="button"
              onClick={() => setActiveLifecycleStage(stage.num)}
              className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                active
                  ? 'border-[#D4AF37] bg-[#D4AF37]/12 text-zinc-900 dark:text-white'
                  : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
              }`}
            >
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.18em] ${
                  active ? 'text-[#B58E24] dark:text-[#D4AF37]' : 'text-zinc-400'
                }`}
              >
                Stage 0{stage.num}
              </span>
              <p className="mt-1 text-xs font-semibold truncate">{stage.short}</p>
            </button>
          );
        })}
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 text-sm text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-mono uppercase tracking-wider cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STAGE 1: CREATE THE EVENT */}
      {activeLifecycleStage === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Stage 1 · Event Registration &amp; Custom Microsite Slug
              </h3>
              <button
                type="button"
                onClick={() => {
                  const created = createNewEvent({
                    coupleOrHostName: 'New Celebration',
                    eventType: 'Wedding',
                    eventDate: new Date().toISOString().slice(0, 10),
                    venueName: 'Grand Courtyard Lawn',
                    venueCity: 'Udaipur',
                    googleMapsQuery: 'Udaipur Palace Rajasthan',
                    slug: `event-${Date.now().toString().slice(-4)}`,
                    heroImageUrl: PIXELFOTOS_ASSETS.heroRoyalWedding,
                    storyText: 'Welcome to our live celebration gallery & AI photo portal.',
                    youtubeStreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
                    isPublished: true,
                    schedule: microsite.schedule,
                  });
                  setNotice(`Created new saved event slug /${created.slug}. Customize details below!`);
                }}
                className="text-xs font-semibold text-[#B58E24] dark:text-[#D4AF37] hover:underline cursor-pointer"
              >
                + Save As New Event
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Couple / Host Name
                </label>
                <input
                  type="text"
                  value={microsite.coupleOrHostName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setMicrosite((prev) => ({
                      ...prev,
                      coupleOrHostName: name,
                      slug: slugify(name),
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Event Type
                </label>
                <select
                  value={microsite.eventType}
                  onChange={(e) =>
                    setMicrosite((prev) => ({
                      ...prev,
                      eventType: e.target.value as typeof prev.eventType,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Griha Pravesh">Griha Pravesh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Event Date
                </label>
                <input
                  type="date"
                  value={microsite.eventDate}
                  onChange={(e) =>
                    setMicrosite((prev) => ({ ...prev, eventDate: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Custom URL Slug
                </label>
                <div className="flex items-center rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] overflow-hidden">
                  <span className="px-3 text-xs font-mono text-zinc-500">/</span>
                  <input
                    type="text"
                    value={microsite.slug}
                    onChange={(e) =>
                      setMicrosite((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                    }
                    className="flex-1 py-2.5 pr-3 bg-transparent text-sm font-mono text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={microsite.venueName}
                  onChange={(e) =>
                    setMicrosite((prev) => ({ ...prev, venueName: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Venue City
                </label>
                <input
                  type="text"
                  value={microsite.venueCity}
                  onChange={(e) =>
                    setMicrosite((prev) => ({ ...prev, venueCity: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleStage1WhatsAppShare}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                1-Click Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={handleCopyEventLink}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37] cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Copy Event Link
              </button>
              <button
                type="button"
                onClick={() => openMicrositeBySlug(microsite.slug)}
                className="ml-auto text-xs font-semibold text-[#B58E24] dark:text-[#D4AF37] hover:underline cursor-pointer"
              >
                Visit Live /{microsite.slug} →
              </button>
            </div>
          </div>

          <div className="xl:col-span-5 rounded-2xl border border-[#D4AF37]/30 bg-white dark:bg-[#11141D] p-5 space-y-4">
            <MediaFrame
              src={microsite.heroImageUrl}
              alt={microsite.coupleOrHostName}
              className="aspect-[16/10] rounded-xl"
            />
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
                {microsite.eventType} · {microsite.eventDate}
              </p>
              <h4 className="text-2xl font-editorial font-semibold text-zinc-900 dark:text-white">
                {microsite.coupleOrHostName}
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {microsite.venueName} · {microsite.venueCity}
              </p>
              <p className="text-xs font-mono text-[#10B981] pt-1 truncate">{eventUrl}</p>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: AT THE EVENT (QR STANDEE & GUEST SELFIE REGISTRATION) */}
      {activeLifecycleStage === 2 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5 rounded-2xl border border-[#D4AF37]/40 bg-[#090B10] text-white p-7 flex flex-col items-center text-center space-y-5 shadow-xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[#D4AF37]">
              PixelFotos Venue Standee
            </p>
            <div>
              <h3 className="text-3xl font-editorial font-semibold text-white">
                {microsite.coupleOrHostName}
              </h3>
              <p className="mt-1 text-sm text-zinc-300">Scan to get your photos</p>
            </div>

            <QrCodeCanvas
              value={eventUrl}
              size={200}
              onDataUrlReady={(u) => setStandeeQrUrl(u)}
              alt={`Event Standee QR for ${microsite.coupleOrHostName}`}
            />

            <div className="space-y-1">
              <p className="text-xs font-mono text-[#D4AF37] break-all">{eventUrl}</p>
              <p className="text-xs text-zinc-400">
                Register once with a quick selfie · Receive instant WhatsApp alerts as photos go live
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 w-full">
              <button
                type="button"
                onClick={handleDownloadStandeeQr}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR PNG
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-white/20 text-white hover:border-[#D4AF37] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Tent Card
              </button>
            </div>
          </div>

          <div className="xl:col-span-7 space-y-5">
            <form
              onSubmit={handleGuestRegisterSubmit}
              className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Live Guest QR Check-In &amp; 128-d Selfie Registration
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {registeredGuests.length} Guests Indexed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-3 flex flex-col items-center gap-2">
                  <img
                    src={guestSelfiePreview}
                    alt="Guest Selfie Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#D4AF37]"
                  />
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={indexingSelfie}
                    onClick={() => selfieInputRef.current?.click()}
                    className="text-[11px] font-medium text-[#B58E24] dark:text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    {indexingSelfie ? 'Indexing Face...' : 'Upload Selfie'}
                  </button>
                </div>

                <div className="sm:col-span-9 space-y-3">
                  <input
                    type="text"
                    placeholder="Guest Full Name (e.g. Neha Sharma) *"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white"
                  />
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      placeholder="WhatsApp Number (+91 98...) *"
                      value={guestWhatsapp}
                      onChange={(e) => setGuestWhatsapp(e.target.value)}
                      required
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm font-mono text-zinc-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={indexingSelfie}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] transition whitespace-nowrap cursor-pointer disabled:opacity-60"
                    >
                      Register &amp; Extract Vector
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Automated Guest WhatsApp Trigger
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Dispatches personalized gallery links when first event photos arrive.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerFirstPhotoUploadDispatch(photos[0]?.fileName || 'PF_LIVE_001.jpg');
                    setNotice(
                      `Dispatched automated WhatsApp alerts to ${registeredGuests.length} registered guest(s).`
                    );
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Notify Registered Guests
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto">
                {registeredGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10]"
                  >
                    <img
                      src={guest.selfieUrl}
                      alt={guest.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {guest.name}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-500 truncate">
                        {guest.faceEmbedding ? '128-d Vector' : 'Cluster'} ·{' '}
                        {guest.notifiedOnFirstUpload ? 'Sent' : 'Queued'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {dispatchLogs.length > 0 && (
                <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-3 space-y-1.5 max-h-36 overflow-y-auto">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#10B981]">
                    Live WhatsApp Dispatch Log ({dispatchLogs.length})
                  </p>
                  {dispatchLogs.slice(0, 4).map((log) => (
                    <p key={log.id} className="text-xs text-zinc-700 dark:text-zinc-300">
                      <span className="font-mono text-zinc-500">[{log.timestamp}]</span> →{' '}
                      <strong>{log.recipientName}</strong>: {log.messagePreview}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: LIVE UPLOADING */}
      {activeLifecycleStage === 3 && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#10B981]">
                  <Usb className="w-4 h-4" />
                  <span>C-to-C Camera-to-Phone Sync Active · USB-C 10Gbps</span>
                </div>
                <h3 className="text-2xl font-editorial font-semibold text-zinc-900 dark:text-white">
                  Zero-Laptop Live Tethering Monitor
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Every uploaded or tethered frame is analyzed on Canvas, face-indexed, and saved directly into IndexedDB in{' '}
                  <span className="font-mono font-semibold text-[#B58E24] dark:text-[#D4AF37]">
                    {lastSyncSeconds} sec
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSimulateCameraShot}
                  disabled={syncInProgress}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] transition cursor-pointer disabled:opacity-60"
                >
                  <Zap className="w-4 h-4" />
                  {syncInProgress ? 'Syncing Frame...' : 'Simulate Tether Capture'}
                </button>
                <input
                  ref={tetherFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleTetherFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => tetherFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37] cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4" />
                  Upload Live Camera Files
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.slice(0, 10).map((photo) => (
              <div
                key={photo.id}
                className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] overflow-hidden"
              >
                <MediaFrame src={photo.url} alt={photo.fileName} className="aspect-[4/3]" />
                <div className="p-2.5">
                  <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                    {photo.fileName}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500 truncate">
                    {photo.cameraModel} · {photo.capturedAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 4: REAL FACE-API.JS AI FACE MATCH */}
      {activeLifecycleStage === 4 && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <ScanFace className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Real AI Face Match ("Only You") · face-api.js 128-d Embeddings
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loads TinyFaceDetector &amp; FaceRecognitionNet from CDN, extracts 128-d face vectors, and computes Euclidean distance matches.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={activeGuest?.id || ''}
                  onChange={(e) => setSelectedGuestId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-[#090B10] text-xs font-medium text-zinc-900 dark:text-white"
                >
                  {registeredGuests.map((g) => (
                    <option key={g.id} value={g.id}>
                      Guest: {g.name}
                    </option>
                  ))}
                </select>

                <input
                  ref={stage4SelfieRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStage4SelfieUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={indexingGallery}
                  onClick={() => stage4SelfieRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#D4AF37] text-[#B58E24] dark:text-[#D4AF37] cursor-pointer"
                >
                  Match Uploaded Selfie
                </button>

                <button
                  type="button"
                  disabled={indexingGallery}
                  onClick={() => handleRunRealFaceIndexingAndMatch()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer disabled:opacity-60"
                >
                  {indexingGallery ? 'Computing 128-d Vectors...' : 'Index & Match Faces (face-api.js)'}
                </button>
              </div>
            </div>

            {faceStatus && (
              <p className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-2 rounded-lg">
                {faceStatus}
              </p>
            )}

            <div className="inline-flex p-1 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#090B10]">
              {[
                { id: 'only_you' as const, label: `Only You (${matchedScores.size > 0 ? matchedScores.size : stage4Photos.length})` },
                { id: 'all' as const, label: `All Photos (${photos.length})` },
                { id: 'unknown' as const, label: 'Unknown Faces (Owner)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFaceTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    faceTab === t.id
                      ? 'bg-white dark:bg-[#11141D] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stage4Photos.map((photo) => {
              const distConfidence = matchedScores.get(photo.id);
              return (
                <div
                  key={photo.id}
                  className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] overflow-hidden"
                >
                  <MediaFrame src={photo.url} alt={photo.fileName} className="aspect-[4/3]" />
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {photo.fileName}
                      </p>
                      <p className="text-xs font-mono text-zinc-500">
                        {distConfidence
                          ? `${distConfidence}% 128-d match`
                          : photo.faceEmbeddings
                          ? `${photo.faceEmbeddings.length} face(s) indexed`
                          : `${photo.rawFileName}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGuestLike(photo.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shrink-0 ${
                        photo.guestLiked
                          ? 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${photo.guestLiked ? 'fill-current' : ''}`} />
                      {photo.likesCount}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE 5: REAL FILE SYSTEM ACCESS API RAW ORIGINAL MATCHER */}
      {activeLifecycleStage === 5 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
              <FolderSearch className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                1-Click Locate Originals (File System API)
              </h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Picks your local RAW/camera folder via{' '}
              <code className="text-xs font-mono">showDirectoryPicker()</code>, matches base filenames ignoring extension (<code className="text-xs font-mono">.JPG</code> ↔ <code className="text-xs font-mono">.CR3/.NEF/.ARW</code>), and copies matched originals into a real{' '}
              <strong>Selected_Originals</strong> subfolder on your device.
            </p>

            <input
              ref={rawFolderInputRef}
              type="file"
              multiple
              // @ts-expect-error webkitdirectory fallback
              webkitdirectory=""
              onChange={handleFallbackRawFolderChange}
              className="hidden"
            />

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={matchingRaw}
                onClick={handleLocateWithDirectoryPicker}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] transition cursor-pointer disabled:opacity-60"
              >
                <FolderCheck className="w-4 h-4" />
                <span>
                  {matchingRaw
                    ? 'Copying Matched Originals...'
                    : supportsDirectoryPicker()
                    ? 'Pick RAW Folder & Copy to Selected_Originals'
                    : 'Select RAW Folder & Build ZIP'}
                </span>
              </button>

              <button
                type="button"
                disabled={matchingRaw}
                onClick={() => rawFolderInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-300 dark:border-white/15 text-zinc-800 dark:text-zinc-200 hover:border-[#D4AF37] transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Select Folder Fallback (ZIP Output)
              </button>

              <button
                type="button"
                onClick={handleExportCopyScript}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] hover:opacity-90 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Shell Copy Script (.sh)
              </button>
            </div>

            {rawReport && (
              <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-3.5 space-y-1 text-xs">
                <p className="font-semibold text-[#10B981]">
                  Scanned {rawReport.totalScannedFiles} local file(s)
                </p>
                <p className="text-zinc-700 dark:text-zinc-200">
                  Copied <strong>{rawReport.matchedFiles.length}</strong> matched original(s) →{' '}
                  <span className="font-mono">{rawReport.outputFolderName}</span>
                </p>
                {rawReport.missingBaseNames.length > 0 && (
                  <p className="text-zinc-500 font-mono">
                    Missing in folder: {rawReport.missingBaseNames.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="xl:col-span-7 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Guest-Liked Shortlist ({likedShortlist.length} Originals Queued)
              </h4>
              <span className="text-xs font-mono text-[#10B981] tabular-nums">
                Extension-Agnostic Matcher
              </span>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-white/10">
              {likedShortlist.map((photo) => {
                const matchedEntry = rawReport?.matchedFiles.find(
                  (m) => m.shortlistPhotoName === photo.fileName
                );
                return (
                  <div key={photo.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MediaFrame
                        src={photo.url}
                        alt={photo.fileName}
                        className="w-12 h-12 rounded-lg shrink-0"
                      />
                      <div>
                        <p className="text-sm font-mono font-semibold text-[#B58E24] dark:text-[#D4AF37]">
                          {photo.rawFileName}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {photo.fileName} · {photo.likesCount} guest hearts
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono font-semibold ${
                        matchedEntry ? 'text-[#10B981]' : 'text-zinc-500'
                      }`}
                    >
                      {matchedEntry
                        ? `Copied (${matchedEntry.matchedFileName})`
                        : 'Ready to Match'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 6: 2 MONTHS LATER */}
      {activeLifecycleStage === 6 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 rounded-2xl border border-[#D4AF37]/35 bg-[#090B10] text-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-[0.22em] text-[#D4AF37]">
                60-Day Automated Memory Lane
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {microsite.eventDate} + 60 Days
              </span>
            </div>

            <div>
              <h3 className="text-3xl font-editorial font-semibold text-white">
                Thank you, {microsite.coupleOrHostName} — Your memory lane is here
              </h3>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{thankYouMessage}</p>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {photos.slice(0, 4).map((p) => (
                <MediaFrame
                  key={p.id}
                  src={p.url}
                  alt={p.fileName}
                  className="aspect-square rounded-xl border border-white/10"
                />
              ))}
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-xs text-zinc-300">
                  Loved reliving your wedding highlights? Leave us a 5-Star Google Review!
                </p>
              </div>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#D4AF37] text-[#090B10] whitespace-nowrap shrink-0"
              >
                Leave 5★ Review
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="xl:col-span-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-white/10 pb-3">
              Automated Retention &amp; Google Review Scheduler
            </h3>

            <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] p-3.5">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Auto-Trigger at +60 Days
                </p>
                <p className="text-xs text-zinc-500">
                  Schedules Memory Lane &amp; 5-Star Review prompt via WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoSchedule60Days((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  autoSchedule60Days
                    ? 'bg-[#10B981] text-[#090B10]'
                    : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {autoSchedule60Days ? 'Scheduled' : 'Paused'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Personalized Thank-You Note
              </label>
              <textarea
                rows={3}
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Google Business Review Link
              </label>
              <input
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-xs font-mono text-zinc-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const msg = `${thankYouMessage}\n\nRelive your Memory Lane: ${eventUrl}\nLeave a quick 5-star review: ${googleReviewUrl}`;
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(msg)}`,
                  '_blank',
                  'noopener,noreferrer'
                );
                setRetentionSentAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                setNotice('Memory Lane & 5-Star Review prompt prepared on WhatsApp.');
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Send Memory Lane + Review on WhatsApp
            </button>

            {retentionSentAt && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#10B981]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Memory Lane WhatsApp payload queued at {retentionSentAt}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
