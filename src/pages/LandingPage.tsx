import React, { useState } from 'react';
import {
  Aperture,
  ArrowRight,
  Calendar,
  Check,
  ExternalLink,
  Frame,
  Globe,
  Heart,
  Layers,
  MapPin,
  Moon,
  Palette,
  QrCode,
  Receipt,
  Settings,
  Sparkles,
  Sun,
  Users,
  Wand2,
} from 'lucide-react';
import { usePixelFotos } from '../contexts/PixelFotosContext';
import { PIXELFOTOS_ASSETS } from '../data/pixelfotosData';
import { LifecycleStageNumber, StudioModuleId } from '../types/pixelfotos';
import { MobileBottomDock } from '../components/shared/MobileBottomDock';

type DemoModeId = 'culling' | 'kerala_lut' | 'album_retouch' | 'print_upi';

const DEMO_TABS: {
  id: DemoModeId;
  label: string;
  headline: string;
  description: string;
  statLabel: string;
  statValue: string;
  imageUrl: string;
  targetModule: StudioModuleId;
  targetStage?: LifecycleStageNumber;
  highlights: string[];
}[] = [
  {
    id: 'culling',
    label: 'Google Drive Style Upload & AI Culling',
    headline: 'Bulk Wedding Photo Upload with Live Progress & Laplacian Culling',
    description:
      'Upload hundreds of wedding photos with a Google Drive-style batch progress tracker showing Total Selected, Uploaded, Remaining, and live percentage (%) while auto-filtering blur and duplicates.',
    statLabel: 'Batch Culling Precision',
    statValue: '98.4%',
    imageUrl: PIXELFOTOS_ASSETS.weddingBridal,
    targetModule: 'culling',
    highlights: [
      'Live Google Drive-style tracker: Selected, Uploaded, Remaining & % bar',
      'Auto-flags Closed Eyes, Motion Blur & Burst Duplicates via dHash',
      '1-Click export of AI Best Picks into a clean client-ready archive',
    ],
  },
  {
    id: 'kerala_lut',
    label: 'Kerala Wedding LUTs & Watermark',
    headline: 'Kerala Wedding Style Color Grading & Scalable Custom Font Watermarks',
    description:
      'Apply dedicated Kerala Wedding Style LUTs (Kochi Backwater Golden, Kasavu Ivory & Temple Gold, Munnar Mist) or upload custom .cube files, paired with a scalable multi-font studio watermark.',
    statLabel: 'Color & Watermark Presets',
    statValue: '10+ .CUBE',
    imageUrl: PIXELFOTOS_ASSETS.weddingHaldi,
    targetModule: 'retouch_lut',
    highlights: [
      'Dedicated "Kerala Wedding Style" LUT collection + custom .cube upload',
      'Resize watermark scale (35%–240%) & switch between 5 luxury fonts live',
      'Real HTML5 Canvas pixel-by-pixel trilinear LUT & watermark baking',
    ],
  },
  {
    id: 'album_retouch',
    label: '1-Click Album AI Retouch',
    headline: 'Instant Bridal Portrait & Silk Saree Retouch with Split Comparison',
    description:
      'Transform raw wedding portraits in one click using curated Bridal Glow and Kerala Kasavu presets, master intensity control, and 7 portrait & fabric clarity sliders.',
    statLabel: 'Retouch Speedup',
    statValue: '10× Faster',
    imageUrl: PIXELFOTOS_ASSETS.weddingSangeet,
    targetModule: 'album_retouch',
    highlights: [
      '4 curated wedding presets + Master Retouch Intensity blend slider',
      '7 granular sliders: Blemish, Skin Tone Warmth, Eye/Teeth & Saree Zari Pop',
      'Interactive draggable Before/After split-screen canvas verification',
    ],
  },
  {
    id: 'print_upi',
    label: 'Admin Print Pricing & Standard UPI',
    headline: 'Custom Print Store Price Manager & Client-Readable UPI Billing',
    description:
      'Set custom prices for every print size, museum frame, and album from the Admin Panel, and send ultra-clean quotations with standard UPI payment details and scannable QR codes.',
    statLabel: 'Print Store Margin',
    statValue: '+64%',
    imageUrl: PIXELFOTOS_ASSETS.studioPrintFrame,
    targetModule: 'print_store',
    highlights: [
      'Admin Print Size & Album Price Manager synced live to Client Microsite',
      'Simplified 1-row Team Task & Expense tracker with live Net Profit',
      'Clean client invoices with UPI ID, Payee Name, Amount Due & QR code',
    ],
  },
];

const CORE_MODULES: {
  id: StudioModuleId;
  num: string;
  title: string;
  summary: string;
  spanClass: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'culling',
    num: '01',
    title: 'Google Drive Upload & AI Culling',
    summary:
      'Live batch upload tracker (Total Selected, Uploaded, Remaining, %) with Laplacian sharpness scoring and dHash duplicate grouping.',
    spanClass: 'md:col-span-1 lg:col-span-6',
    icon: Sparkles,
  },
  {
    id: 'retouch_lut',
    num: '02',
    title: 'Kerala Wedding LUTs & Watermark',
    summary:
      'Dedicated Kerala Wedding Style LUTs, custom .cube uploads, and scalable watermarks with 5 custom typography fonts.',
    spanClass: 'md:col-span-1 lg:col-span-6',
    icon: Palette,
  },
  {
    id: 'album_retouch',
    num: '03',
    title: '1-Click Album AI Retouch',
    summary:
      'Curated bridal retouch presets, master intensity slider, 7 portrait & silk detail controls, and interactive Before/After split view.',
    spanClass: 'md:col-span-1 lg:col-span-4',
    icon: Wand2,
  },
  {
    id: 'microsite_builder',
    num: '04',
    title: 'Luxury Wedding Microsite Builder',
    summary:
      'Bespoke pixelfotos.online/slug wedding microsites with couple story, ceremony schedule, Google Maps, and live stream.',
    spanClass: 'md:col-span-1 lg:col-span-4',
    icon: Globe,
  },
  {
    id: 'print_store',
    num: '05',
    title: 'Client Gallery & Print Price Manager',
    summary:
      'Admin price editor for print sizes, frames, and albums—synchronized live with the client gallery print checkout.',
    spanClass: 'md:col-span-1 lg:col-span-4',
    icon: Frame,
  },
  {
    id: 'crm_expenses',
    num: '06',
    title: 'Simplified CRM, Team & Expenses',
    summary:
      'Clutter-free 1-row crew task assignment, 1-click progress pills, fast expense logging, and real-time Net Studio Profit.',
    spanClass: 'md:col-span-1 lg:col-span-6',
    icon: Users,
  },
  {
    id: 'billing_upi',
    num: '07',
    title: 'Simple Client Billing & Standard UPI',
    summary:
      'Easy-to-read client quotations & GST invoices displaying standard UPI payment details (Payee, UPI ID, Amount Due & QR).',
    spanClass: 'md:col-span-2 lg:col-span-6',
    icon: Receipt,
  },
];

const LIFECYCLE_STEPS: {
  stage: LifecycleStageNumber;
  title: string;
  caption: string;
}[] = [
  { stage: 1, title: 'Create Wedding Microsite', caption: 'Custom couple slug + WhatsApp invite' },
  { stage: 2, title: 'Venue QR Standee', caption: 'Printable card + 128-d selfie scan' },
  { stage: 3, title: 'Live C-to-C Sync', caption: 'USB-C camera-to-phone in 48 sec' },
  { stage: 4, title: 'AI Face Match', caption: '"Only You" guest feed + synced hearts' },
  { stage: 5, title: 'Locate RAW Originals', caption: 'Copy liked RAWs into edit subfolder' },
  { stage: 6, title: 'Anniversary Memory Lane', caption: 'Automated flashback + 5-Star review' },
];

export const LandingPage: React.FC = () => {
  const {
    theme,
    toggleTheme,
    openStudioAt,
    openMicrositeBySlug,
    microsite,
    deliveryConfig,
    photos,
  } = usePixelFotos();
  const [activeDemo, setActiveDemo] = useState<DemoModeId>('culling');

  const currentDemo = DEMO_TABS.find((d) => d.id === activeDemo) || DEMO_TABS[0];

  return (
    <div className="min-h-screen liquid-canvas text-zinc-900 dark:text-[#F5F5F7] pb-[120px] md:pb-0 transition-colors">
      {/* 3-Zone Floating Luxury Wedding & Studio Header */}
      <div className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 pt-2.5 sm:pt-3.5">
        <header className="max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-6 rounded-[20px] sm:rounded-[24px] liquid-glass-dock flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a href="#top" className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4AF37] text-[#090B10] flex items-center justify-center shadow-sm">
              <Aperture className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-editorial font-semibold tracking-tight block leading-none">
                PixelFotos
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#B58E24] dark:text-[#D4AF37] block">
                Wedding Microsite &amp; Admin
              </span>
            </div>
          </a>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#featured-wedding"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition whitespace-nowrap shrink-0"
            >
              Wedding Microsite
            </a>
            <a
              href="#live-demo"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition whitespace-nowrap shrink-0"
            >
              Interactive Demo
            </a>
            <a
              href="#core-modules"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition whitespace-nowrap shrink-0"
            >
              Admin Panel Modules
            </a>
            <a
              href="#event-lifecycle"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition whitespace-nowrap shrink-0"
            >
              Event Workflow
            </a>
          </nav>

          {/* Zone 3: Primary Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Light and Dark Theme"
              className="min-w-[40px] min-h-[40px] rounded-xl liquid-glass-subtle flex items-center justify-center text-zinc-700 dark:text-zinc-200 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => openMicrositeBySlug(microsite.slug)}
              className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold liquid-glass text-zinc-900 dark:text-white hover:border-[#D4AF37] cursor-pointer whitespace-nowrap"
            >
              <Heart className="w-3.5 h-3.5 text-[#D4AF37]" />
              Live Wedding Microsite
            </button>
            <button
              type="button"
              onClick={() => openStudioAt('culling')}
              className="min-h-[40px] inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] active:scale-[0.98] transition whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              Admin Panel
            </button>
          </div>
        </header>
      </div>

      {/* Luxury Editorial Wedding Microsite & Studio Hero */}
      <section
        id="top"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
                {deliveryConfig.studioName} · Luxury Wedding Microsite &amp; Studio OS
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-editorial font-semibold leading-[1.03] tracking-tight text-zinc-900 dark:text-white">
                Bespoke Wedding Microsites &amp; Synchronized Studio Command.
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed">
                Delight high-end wedding couples with an editorial microsite, AI selfie photo matching, and an integrated fine-art print store—fully controlled from a synchronized Admin Panel.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => openMicrositeBySlug(microsite.slug)}
                  className="min-h-[46px] inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] active:scale-[0.98] transition cursor-pointer whitespace-nowrap shadow-lg shadow-[#D4AF37]/15"
                >
                  Explore Wedding Microsite (/{microsite.slug})
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => openStudioAt('culling')}
                  className="min-h-[46px] inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold liquid-glass text-zinc-900 dark:text-white hover:border-[#D4AF37]/60 active:scale-[0.98] transition cursor-pointer whitespace-nowrap"
                >
                  <Settings className="w-4 h-4 text-[#D4AF37]" />
                  Open Studio Admin Panel
                </button>
              </div>
            </div>

            {/* 3-Column Editorial Metric Strip */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="liquid-glass rounded-[20px] p-4">
                <p className="text-xl sm:text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                  {photos.length} Photos
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  Google Drive Style Batch Culling
                </p>
              </div>
              <div className="liquid-glass rounded-[20px] p-4">
                <p className="text-xl sm:text-2xl font-mono font-semibold text-[#B58E24] dark:text-[#D4AF37] tabular-nums">
                  Kerala LUTs
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  + Scalable Font Watermarks
                </p>
              </div>
              <div className="liquid-glass rounded-[20px] p-4">
                <p className="text-xl sm:text-2xl font-mono font-semibold text-[#10B981] tabular-nums">
                  0% Fee UPI
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  Synced Print Store &amp; Invoices
                </p>
              </div>
            </div>
          </div>

          {/* Right Featured Wedding Invitation Card */}
          <div id="featured-wedding" className="lg:col-span-6">
            <div className="relative h-full min-h-[400px] sm:min-h-[460px] rounded-[28px] overflow-hidden liquid-glass p-2">
              <div className="relative w-full h-full rounded-[22px] overflow-hidden">
                <img
                  src={microsite.heroImageUrl || PIXELFOTOS_ASSETS.heroRoyalWedding}
                  alt={microsite.coupleOrHostName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-4 inset-x-4 rounded-[22px] liquid-glass-dock p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
                      Featured Wedding Microsite · {microsite.eventType}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-300 inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {microsite.eventDate}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-editorial font-semibold text-zinc-900 dark:text-white">
                      {microsite.coupleOrHostName}
                    </h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {microsite.venueName}, {microsite.venueCity}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => openMicrositeBySlug(microsite.slug)}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Client Microsite
                    </button>
                    <button
                      type="button"
                      onClick={() => openStudioAt('lifecycle', 2)}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold liquid-glass-subtle text-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Venue QR Standee
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Switcher */}
      <section
        id="live-demo"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
              Synchronized Client &amp; Admin Engines
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold tracking-tight">
              Interactive Studio &amp; Wedding Workflow Preview
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 liquid-glass-subtle p-1.5 rounded-[18px]">
            {DEMO_TABS.map((tab) => {
              const active = tab.id === activeDemo;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDemo(tab.id)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#D4AF37] text-[#090B10] shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="liquid-glass rounded-[28px] p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between border-b border-black/8 dark:border-white/10 pb-3">
              <span className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
                {currentDemo.statLabel}
              </span>
              <span className="text-xl font-mono font-semibold text-[#10B981] tabular-nums">
                {currentDemo.statValue}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-editorial font-semibold tracking-tight">
              {currentDemo.headline}
            </h3>

            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {currentDemo.description}
            </p>

            <ul className="space-y-2.5">
              {currentDemo.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-200">{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => openStudioAt(currentDemo.targetModule, currentDemo.targetStage)}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
            >
              Launch in Admin Panel
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[4/3] rounded-[20px] overflow-hidden border border-black/10 dark:border-white/12">
              <img
                src={currentDemo.imageUrl}
                alt={currentDemo.headline}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7 Core Studio Modules — Admin Control Grid */}
      <section
        id="core-modules"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
              Synchronized Studio Admin Panel · 7 Modules
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold tracking-tight">
              Complete Control Over Every Wedding Deliverable
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openStudioAt('culling')}
            className="text-sm font-semibold text-[#B58E24] dark:text-[#D4AF37] hover:underline self-start sm:self-auto cursor-pointer"
          >
            Open Full Admin Panel →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {CORE_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => openStudioAt(mod.id)}
                className={`${mod.spanClass} group text-left liquid-glass rounded-[24px] p-6 hover:-translate-y-0.5 hover:border-[#D4AF37]/50 flex flex-col justify-between gap-5 cursor-pointer`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
                      Module {mod.num}
                    </span>
                    <div className="w-9 h-9 rounded-xl liquid-glass-subtle flex items-center justify-center text-zinc-500 dark:text-zinc-300 group-hover:text-[#D4AF37] transition">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-editorial font-semibold text-zinc-900 dark:text-white">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {mod.summary}
                  </p>
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#B58E24] dark:group-hover:text-[#D4AF37] inline-flex items-center gap-1.5">
                  Configure in Admin Panel <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6-Stage Event Lifecycle Bento Track */}
      <section
        id="event-lifecycle"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
              End-to-End Wedding Lifecycle
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold tracking-tight">
              6 Automated Stages From Invitation to Memory Lane
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openStudioAt('lifecycle', 1)}
            className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer self-start sm:self-auto"
          >
            <Layers className="w-3.5 h-3.5" />
            Launch 6-Stage Workflow
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {LIFECYCLE_STEPS.map((step) => (
            <button
              key={step.stage}
              type="button"
              onClick={() => openStudioAt('lifecycle', step.stage)}
              className="text-left liquid-glass rounded-[22px] p-4.5 hover:-translate-y-0.5 hover:border-[#D4AF37]/50 space-y-2 cursor-pointer"
            >
              <span className="text-[11px] font-mono text-[#B58E24] dark:text-[#D4AF37]">
                Stage 0{step.stage}
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{step.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {step.caption}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-black/8 dark:border-white/10 py-8 px-4 sm:px-6 lg:px-8 mt-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Aperture className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold text-zinc-900 dark:text-white">PixelFotos</span>
            <span>· www.pixelfotos.online · Luxury Wedding Microsite &amp; Studio Admin OS</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              {theme === 'dark' ? 'Daylight Pearl' : 'Pro Studio Dark'}
            </button>
            <button
              type="button"
              onClick={() => openMicrositeBySlug(microsite.slug)}
              className="hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              Wedding Microsite
            </button>
            <button
              type="button"
              onClick={() => openStudioAt('culling')}
              className="font-semibold text-[#B58E24] dark:text-[#D4AF37] cursor-pointer"
            >
              Admin Panel →
            </button>
          </div>
        </div>
      </footer>

      <MobileBottomDock />
    </div>
  );
};
