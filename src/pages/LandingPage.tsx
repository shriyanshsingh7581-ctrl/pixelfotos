import React, { useState } from 'react';
import {
  Aperture,
  ArrowRight,
  Check,
  ExternalLink,
  Frame,
  Globe,
  Layers,
  Moon,
  Palette,
  QrCode,
  Receipt,
  Sparkles,
  Sun,
  Users,
  Wand2,
} from 'lucide-react';
import { usePixelFotos } from '../contexts/PixelFotosContext';
import { PIXELFOTOS_ASSETS } from '../data/pixelfotosData';
import { LifecycleStageNumber, StudioModuleId } from '../types/pixelfotos';
import { MobileBottomDock } from '../components/shared/MobileBottomDock';

type DemoModeId = 'culling' | 'live_sync' | 'face_match' | 'print_upi';

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
    label: 'AI Culling & LUT Grade',
    headline: 'Human-Like Culling & Custom .CUBE Color Grading',
    description:
      'Automatically filters closed-eye blinks, motion blur, and burst duplicates while grouping poses and applying custom .CUBE LUTs and studio watermarks in one batch.',
    statLabel: 'Batch Culling Accuracy',
    statValue: '98.4%',
    imageUrl: PIXELFOTOS_ASSETS.weddingBridal,
    targetModule: 'culling',
    highlights: [
      'Auto-flags Closed Eyes, Motion Blur & Burst Duplicates',
      'Loads .cube & .3dl LUT files with live Before/After split view',
      '1-Click Natural Album Skin, Flyaway Hair & Glare Retouch',
    ],
  },
  {
    id: 'live_sync',
    label: 'Venue QR & C-to-C Sync',
    headline: 'Camera-to-Cloud in 48 Seconds via USB-C',
    description:
      'Guests scan your luxury venue QR standee once with a selfie. As photographers shoot, frames stream straight from camera to phone over USB-C and alert guests on WhatsApp.',
    statLabel: 'C-to-C Sync Latency',
    statValue: '48 sec',
    imageUrl: PIXELFOTOS_ASSETS.weddingHaldi,
    targetModule: 'lifecycle',
    targetStage: 3,
    highlights: [
      'Printable Venue QR Standee Card ("Scan to get your photos")',
      'USB-C Camera-to-Phone Sync without carrying a heavy laptop',
      'Instant WhatsApp notification triggered on first photo upload',
    ],
  },
  {
    id: 'face_match',
    label: 'AI Face Match ("Only You")',
    headline: '128-d Personalized Guest Streams & RAW Matching',
    description:
      'Guests browse "Only You" instead of scrolling 6,000+ images, heart their favorites, and let your studio locate exact camera RAW filenames (.CR3/.ARW) in one click.',
    statLabel: 'RAW Archive Indexed',
    statValue: '6,240+',
    imageUrl: PIXELFOTOS_ASSETS.weddingSangeet,
    targetModule: 'lifecycle',
    targetStage: 4,
    highlights: [
      '"Only You" personalized feed + "Unknown Faces" owner filter',
      'Guest hearts sync back to Studio RAW Original Matcher',
      '60-Day Automated Memory Lane & 5-Star Google Review prompt',
    ],
  },
  {
    id: 'print_upi',
    label: 'Print Store & UPI Billing',
    headline: 'Sell Framed Prints & Collect Instant 0% Fee UPI',
    description:
      'Convert galleries into profit centers with an in-built Wooden/Acrylic Frame & Linen Album store plus itemized GST quotations with scannable UPI QR payment links.',
    statLabel: 'Print Store Margin',
    statValue: '+62%',
    imageUrl: PIXELFOTOS_ASSETS.studioPrintFrame,
    targetModule: 'print_store',
    highlights: [
      'Wooden, Acrylic, Canvas & Luxury Album storefront in every gallery',
      '1-Click Quotation → GST Invoice with scannable UPI QR code',
      'Expenses & Print Profits sync live to Net Profit per Event',
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
    title: 'AI Photo Culling',
    summary: 'Laplacian blur detection, duplicate dHash clustering, 1–5 star ratings, and instant ZIP export.',
    spanClass: 'md:col-span-1 lg:col-span-6',
    icon: Sparkles,
  },
  {
    id: 'retouch_lut',
    num: '02',
    title: 'AI Retouch & .CUBE LUTs',
    summary: 'Upload custom .cube/.3dl LUTs for trilinear pixel grading, exposure match, and logo/text watermarks.',
    spanClass: 'md:col-span-1 lg:col-span-6',
    icon: Palette,
  },
  {
    id: 'album_retouch',
    num: '03',
    title: '1-Click Album AI Retouch',
    summary: 'Natural skin glare roll-off, flyaway hair refinement, and optical softening across album spreads.',
    spanClass: 'md:col-span-1 lg:col-span-4',
    icon: Wand2,
  },
  {
    id: 'microsite_builder',
    num: '04',
    title: 'Event Microsite Generator',
    summary: 'Custom pixelfotos.online/slug portals with Story, Google Maps, Itinerary & YouTube Live.',
    spanClass: 'md:col-span-1 lg:col-span-4',
    icon: Globe,
  },
  {
    id: 'print_store',
    num: '05',
    title: 'Client Gallery & Print Store',
    summary: 'Studio branding, 4-digit PIN gates, download controls, and museum frame profit margins.',
    spanClass: 'md:col-span-1 lg:col-span-4',
    icon: Frame,
  },
  {
    id: 'crm_expenses',
    num: '06',
    title: 'Studio CRM, Team & P&L',
    summary: 'Client pipeline logs, crew shoot deliverable sliders, and real-time Net Profit per Event.',
    spanClass: 'md:col-span-1 lg:col-span-6',
    icon: Users,
  },
  {
    id: 'billing_upi',
    num: '07',
    title: 'Billing, Quotes & UPI QR',
    summary: 'Itemized GST quotation-to-invoice converter, downloadable A4 PDF, and dynamic 0% fee UPI QR.',
    spanClass: 'md:col-span-2 lg:col-span-6',
    icon: Receipt,
  },
];

const LIFECYCLE_STEPS: {
  stage: LifecycleStageNumber;
  title: string;
  caption: string;
}[] = [
  { stage: 1, title: 'Create the Event', caption: 'Auto-slug microsite + WhatsApp invite' },
  { stage: 2, title: 'At the Event QR', caption: 'Printable standee + 128-d selfie scan' },
  { stage: 3, title: 'Live C-to-C Sync', caption: 'USB-C camera-to-phone in 48 sec' },
  { stage: 4, title: 'AI Face Match', caption: '"Only You" feed + synced hearts' },
  { stage: 5, title: 'Locate Originals', caption: 'Copy matched RAWs into subfolder' },
  { stage: 6, title: '2 Months Later', caption: 'Memory Lane + 5-Star Google Review' },
];

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme, openStudioAt, openMicrositeBySlug, microsite } = usePixelFotos();
  const [activeDemo, setActiveDemo] = useState<DemoModeId>('culling');

  const currentDemo = DEMO_TABS.find((d) => d.id === activeDemo) || DEMO_TABS[0];

  return (
    <div className="min-h-screen liquid-canvas text-zinc-900 dark:text-[#F5F5F7] pb-[120px] md:pb-0 transition-colors">
      {/* Floating Apple.com Frosted Glass Navigation Bar */}
      <div className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 pt-2.5 sm:pt-3.5">
        <header className="max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-6 rounded-[20px] sm:rounded-[24px] liquid-glass-dock flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a href="#top" className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4AF37] text-[#090B10] flex items-center justify-center shadow-sm">
              <Aperture className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-base sm:text-lg font-semibold tracking-tight">PixelFotos</span>
          </a>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#live-demo"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition whitespace-nowrap shrink-0"
            >
              Live Demo
            </a>
            <a
              href="#core-modules"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition whitespace-nowrap shrink-0"
            >
              Core Modules
            </a>
            <a
              href="#event-lifecycle"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition whitespace-nowrap shrink-0"
            >
              Event Lifecycle
            </a>
            <button
              type="button"
              onClick={() => openMicrositeBySlug(microsite.slug)}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              Client Microsite
            </button>
          </nav>

          {/* Zone 3: Primary Action CTA (plus compact theme toggle on mobile top bar) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Light and Dark Theme"
              className="md:hidden min-w-[40px] min-h-[40px] rounded-xl liquid-glass-subtle flex items-center justify-center text-zinc-700 dark:text-zinc-200 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => openStudioAt('lifecycle', 1)}
              className="min-h-[40px] inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] active:scale-[0.98] transition whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              Launch Studio
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </header>
      </div>

      {/* Apple.com Cinematic Split Hero */}
      <section
        id="top"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Narrative Bento Column */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-mono tracking-wide text-[#B58E24] dark:text-[#D4AF37]">
                pixelfotos.online · All-in-One Studio &amp; Event OS
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-semibold leading-[1.04] tracking-tight text-zinc-900 dark:text-white">
                AI Photography, Live Guest Galleries &amp; Studio Command.
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed">
                Cull shoots with HTML5 Canvas Laplacian sharpness detection, grade with real .CUBE 3D LUTs, match guest selfies via 128-d face vectors, and collect instant GST UPI payments.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => openStudioAt('culling')}
                  className="min-h-[46px] inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] active:scale-[0.98] transition cursor-pointer whitespace-nowrap shadow-lg shadow-[#D4AF37]/15"
                >
                  Open Studio Workspace
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => openMicrositeBySlug(microsite.slug)}
                  className="min-h-[46px] inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold liquid-glass text-zinc-900 dark:text-white hover:border-[#D4AF37]/60 active:scale-[0.98] transition cursor-pointer whitespace-nowrap"
                >
                  <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                  Preview /{microsite.slug}
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle Light and Dark Theme"
                  className="hidden md:inline-flex min-h-[46px] items-center gap-2 px-4 py-3 rounded-full text-xs font-medium liquid-glass-subtle text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37]/50 cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-[#D4AF37]" />
                      Daylight Pearl
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-[#B58E24]" />
                      Studio Dark
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3-Column Frosted Bento Metric Strip */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="liquid-glass rounded-[20px] p-4">
                <p className="text-xl sm:text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                  48 sec
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  C-to-C Camera Sync
                </p>
              </div>
              <div className="liquid-glass rounded-[20px] p-4">
                <p className="text-xl sm:text-2xl font-mono font-semibold text-[#B58E24] dark:text-[#D4AF37] tabular-nums">
                  128-d AI
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  Biometric Face Match
                </p>
              </div>
              <div className="liquid-glass rounded-[20px] p-4">
                <p className="text-xl sm:text-2xl font-mono font-semibold text-[#10B981] tabular-nums">
                  0% Fee
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  Direct UPI QR &amp; PDF
                </p>
              </div>
            </div>
          </div>

          {/* Right visionOS Floating Frosted Hero Frame */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[360px] sm:min-h-[440px] rounded-[28px] overflow-hidden liquid-glass p-2">
              <div className="relative w-full h-full rounded-[22px] overflow-hidden">
                <img
                  src={PIXELFOTOS_ASSETS.heroRoyalWedding}
                  alt="Ananya & Kabir Royal Udaipur Wedding Editorial Portrait"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 inset-x-4 rounded-[20px] liquid-glass-dock p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-[#B58E24] dark:text-[#D4AF37]">
                      Live Event Showcase · {microsite.venueCity}
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {microsite.coupleOrHostName} · /{microsite.slug}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openStudioAt('lifecycle', 2)}
                    className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] whitespace-nowrap cursor-pointer shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Inspect Event QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Switcher */}
      <section id="live-demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
              Interactive Platform Preview
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">
              Explore Every Studio Capability Live
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

            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
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
              Open Interactive Workspace
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

      {/* 7 Core Studio Modules — Asymmetric Apple Bento Grid */}
      <section id="core-modules" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
              Part 1 · 7 Core Studio Modules
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">
              Built for Modern Photography Studios
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openStudioAt('culling')}
            className="text-sm font-semibold text-[#B58E24] dark:text-[#D4AF37] hover:underline self-start sm:self-auto cursor-pointer"
          >
            Launch All 7 Modules →
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
                      {mod.num}. Module
                    </span>
                    <div className="w-9 h-9 rounded-xl liquid-glass-subtle flex items-center justify-center text-zinc-500 dark:text-zinc-300 group-hover:text-[#D4AF37] transition">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {mod.summary}
                  </p>
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#B58E24] dark:group-hover:text-[#D4AF37] inline-flex items-center gap-1.5">
                  Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6-Stage Event Lifecycle Bento Track */}
      <section id="event-lifecycle" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
              Part 2 · Main Event Lifecycle Workflow
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">
              6 Automated Stages From Booking to Memory Lane
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openStudioAt('lifecycle', 1)}
            className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer self-start sm:self-auto"
          >
            <Layers className="w-3.5 h-3.5" />
            Walk Through All 6 Stages
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
            <span>· www.pixelfotos.online · All-in-One Studio &amp; Event Solution</span>
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
              Client Microsite
            </button>
            <button
              type="button"
              onClick={() => openStudioAt('lifecycle', 1)}
              className="font-semibold text-[#B58E24] dark:text-[#D4AF37] cursor-pointer"
            >
              Studio Command →
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Glass Bottom Navigation Dock */}
      <MobileBottomDock />
    </div>
  );
};
