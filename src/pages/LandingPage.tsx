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
  ScanFace,
  Sparkles,
  Sun,
  Users,
  Wand2,
} from 'lucide-react';
import { usePixelFotos } from '../contexts/PixelFotosContext';
import { PIXELFOTOS_ASSETS } from '../data/pixelfotosData';
import { LifecycleStageNumber, StudioModuleId } from '../types/pixelfotos';

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
    headline: '128+ Personalized Guest Streams & RAW Matching',
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
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'culling',
    num: '01',
    title: 'AI Photo Culling',
    summary: 'Detects closed eyes, blur, duplicates & groups poses with 1–5 star ratings and CSV export.',
    icon: Sparkles,
  },
  {
    id: 'retouch_lut',
    num: '02',
    title: 'AI Retouch & .CUBE LUTs',
    summary: 'Upload custom .cube/.3dl LUTs, batch exposure match, and apply logo/text watermarks.',
    icon: Palette,
  },
  {
    id: 'album_retouch',
    num: '03',
    title: '1-Click Album AI Retouch',
    summary: 'Natural skin blemish, flyaway hair, flash glare & background softening across full albums.',
    icon: Wand2,
  },
  {
    id: 'microsite_builder',
    num: '04',
    title: 'Event Microsite Generator',
    summary: 'Custom pixelfotos.online/slug sites with Couple Story, Google Maps, Schedule & YouTube Live.',
    icon: Globe,
  },
  {
    id: 'print_store',
    num: '05',
    title: 'Client Gallery & Print Store',
    summary: 'Studio branding, 4-digit PIN gates, download controls, and framed print/album profit margins.',
    icon: Frame,
  },
  {
    id: 'crm_expenses',
    num: '06',
    title: 'Studio CRM, Team & P&L',
    summary: 'Client pipeline logs, crew task progress sliders, and real-time Net Profit per Event.',
    icon: Users,
  },
  {
    id: 'billing_upi',
    num: '07',
    title: 'Billing, Quotes & UPI QR',
    summary: 'Itemized GST quotation-to-invoice converter with scannable UPI QR & instant ledger sync.',
    icon: Receipt,
  },
];

const LIFECYCLE_STEPS: {
  stage: LifecycleStageNumber;
  title: string;
  caption: string;
}[] = [
  {
    stage: 1,
    title: 'Create the Event',
    caption: 'Auto-slug microsite + 1-click WhatsApp invite',
  },
  {
    stage: 2,
    title: 'At the Event QR',
    caption: 'Printable standee + guest selfie check-in',
  },
  {
    stage: 3,
    title: 'Live C-to-C Sync',
    caption: 'USB-C camera-to-phone stream in 48 sec',
  },
  {
    stage: 4,
    title: 'AI Face Match',
    caption: '"Only You" guest gallery + live ❤️ hearts',
  },
  {
    stage: 5,
    title: 'Locate Originals',
    caption: 'Match guest likes to 6,240+ RAW files',
  },
  {
    stage: 6,
    title: '2 Months Later',
    caption: 'Memory Lane reel + 5★ Google Review alert',
  },
];

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme, openStudioAt, openMicrositeBySlug, microsite } = usePixelFotos();
  const [activeDemo, setActiveDemo] = useState<DemoModeId>('culling');

  const currentDemo = DEMO_TABS.find((d) => d.id === activeDemo) || DEMO_TABS[0];

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#090B10] text-zinc-900 dark:text-white transition-colors">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-zinc-200 dark:border-white/10 bg-[#FAF9F6]/90 dark:bg-[#090B10]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Identity */}
          <a href="#top" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#090B10] flex items-center justify-center">
              <Aperture className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight whitespace-nowrap">
              PixelFotos
            </span>
          </a>

          {/* Zone 2: 4 Clean Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#live-demo"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-[#B58E24] dark:hover:text-[#D4AF37] whitespace-nowrap shrink-0"
            >
              Live Demo
            </a>
            <a
              href="#core-modules"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-[#B58E24] dark:hover:text-[#D4AF37] whitespace-nowrap shrink-0"
            >
              Core Modules
            </a>
            <a
              href="#event-lifecycle"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-[#B58E24] dark:hover:text-[#D4AF37] whitespace-nowrap shrink-0"
            >
              Event Lifecycle
            </a>
            <button
              type="button"
              onClick={() => openMicrositeBySlug(microsite.slug)}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-[#B58E24] dark:hover:text-[#D4AF37] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Client Microsite
            </button>
          </nav>

          {/* Zone 3: Primary Studio CTA */}
          <button
            type="button"
            onClick={() => openStudioAt('lifecycle', 1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            Launch Studio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Editorial Split Hero */}
      <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-mono uppercase tracking-[0.26em] text-[#B58E24] dark:text-[#D4AF37]">
                pixelfotos.online · All-in-One Studio & Event OS
              </p>

              <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-editorial font-semibold leading-[1.03] tracking-tight text-zinc-900 dark:text-white">
                AI Photography, Live Guest Galleries & Studio Command.
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed">
                Cull thousands of shoots with human-like AI precision, stream USB-C camera shots to guest WhatsApp in 48 seconds, sell framed prints, and manage GST billing with instant UPI QR.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openStudioAt('culling')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] transition cursor-pointer whitespace-nowrap"
                >
                  Launch Studio Command
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => openMicrositeBySlug(microsite.slug)}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#11141D] text-zinc-900 dark:text-white hover:border-[#D4AF37] transition cursor-pointer whitespace-nowrap"
                >
                  <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                  Preview /{microsite.slug}
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle Light and Dark Theme"
                  className="inline-flex items-center gap-2 px-3.5 py-3.5 rounded-xl text-xs font-mono border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#11141D] text-zinc-700 dark:text-zinc-300 hover:border-[#D4AF37] cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-[#D4AF37]" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-[#B58E24]" />
                      Dark
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3-Column Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-200 dark:border-white/10">
              <div>
                <p className="text-2xl sm:text-3xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                  48 sec
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  C-to-C Camera Sync
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-mono font-semibold text-[#B58E24] dark:text-[#D4AF37] tabular-nums">
                  6,240+
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  RAW Original Matcher
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-mono font-semibold text-[#10B981] tabular-nums">
                  7 Modules
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Zero-Commission UPI
                </p>
              </div>
            </div>
          </div>

          {/* Right Editorial Hero Image Card */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[400px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl">
              <img
                src={PIXELFOTOS_ASSETS.heroRoyalWedding}
                alt="Ananya & Kabir Royal Udaipur Wedding Editorial Portrait"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090B10] via-[#090B10]/20 to-transparent" />
              <div className="absolute bottom-5 inset-x-5 rounded-xl border border-white/15 bg-[#090B10]/75 backdrop-blur-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
                    Live Showcase · Udaipur
                  </p>
                  <p className="text-sm font-semibold">
                    {microsite.coupleOrHostName} · pixelfotos.online/{microsite.slug}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openStudioAt('lifecycle', 2)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#D4AF37] text-[#090B10] whitespace-nowrap cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Inspect Event QR
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Switcher */}
      <section
        id="live-demo"
        className="border-y border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0D1017] py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
                Interactive Platform Preview
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold">
                Explore Every Studio Capability Live
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {DEMO_TABS.map((tab) => {
                const active = tab.id === activeDemo;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDemo(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      active
                        ? 'border-[#D4AF37] bg-[#D4AF37] text-[#090B10]'
                        : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl border border-zinc-200 dark:border-white/10 bg-[#FAF9F6] dark:bg-[#11141D] p-6 sm:p-8">
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-[#B58E24] dark:text-[#D4AF37]">
                  {currentDemo.statLabel}
                </span>
                <span className="text-xl font-mono font-semibold text-[#10B981] tabular-nums">
                  {currentDemo.statValue}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-editorial font-semibold">
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
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] hover:opacity-90 transition cursor-pointer"
              >
                Open Interactive Workspace
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-6">
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10">
                <img
                  src={currentDemo.imageUrl}
                  alt={currentDemo.headline}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Core Studio Modules Grid */}
      <section id="core-modules" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
              Part 1 · 7 Core Software Modules
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CORE_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => openStudioAt(mod.id)}
                className="group text-left rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 hover:border-[#D4AF37] transition flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
                      MODULE {mod.num}
                    </span>
                    <Icon className="w-4 h-4 text-zinc-400 group-hover:text-[#D4AF37] transition" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {mod.summary}
                  </p>
                </div>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-[#B58E24] dark:group-hover:text-[#D4AF37] inline-flex items-center gap-1">
                  Open Module <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6-Stage Event Lifecycle Visualizer */}
      <section
        id="event-lifecycle"
        className="border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0D1017] py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
                Part 2 · Main Event Lifecycle Workflow
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold">
                6 Automated Stages From Booking to Memory Lane
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openStudioAt('lifecycle', 1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer self-start sm:self-auto"
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
                className="text-left rounded-2xl border border-zinc-200 dark:border-white/10 bg-[#FAF9F6] dark:bg-[#11141D] p-4 hover:border-[#D4AF37] transition space-y-2 cursor-pointer"
              >
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
                  Stage 0{step.stage}
                </span>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {step.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {step.caption}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Aperture className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold text-zinc-900 dark:text-white">PixelFotos</span>
            <span>· www.pixelfotos.online · All-in-One Studio & Event Solution</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
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
    </div>
  );
};
