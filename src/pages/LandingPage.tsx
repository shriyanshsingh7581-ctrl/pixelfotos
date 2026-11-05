import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ImageOptimizer } from '../components/ImageOptimizer';
import { ClientGalleryPortal } from '../components/gallery/ClientGalleryPortal';
import { StudioPortfolioPage } from '../components/portfolio/StudioPortfolioPage';
import { DashboardTabId } from '../components/dashboard/StudioDashboardShell';
import { FotoOwlActionMode, FotoOwlFeatureBar } from '../components/FotoOwlFeatureBar';

interface LandingPageProps {
  onOpenDashboard: (tab?: DashboardTabId) => void;
  onOpenOnboarding: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenDashboard,
  onOpenOnboarding,
}) => {
  const { studio, photos, plans } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activeShowcaseMode, setActiveShowcaseMode] = useState<'proofing' | 'portfolio'>(
    'proofing'
  );
  const [activeFotoOwlMode, setActiveFotoOwlMode] =
    useState<FotoOwlActionMode | null>('face_match');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroPreviewIndex, setHeroPreviewIndex] = useState<number>(0);

  const heroPhoto = photos[heroPreviewIndex] || photos[0];

  const handleSelectFotoOwlFeature = (mode: FotoOwlActionMode) => {
    setActiveFotoOwlMode(mode);
    setActiveShowcaseMode('proofing');
    const el = document.getElementById('live-proofing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const faqs = [
    {
      q: 'How does Instant AI Face Match & QR Event Sharing work for wedding and corporate guests?',
      a: 'Guests simply scan the event QR code or open the gallery link on their mobile browser—no app download required. By uploading a quick selfie, FotoOwl AI scans thousands of event photos in under a second and groups every photo they appear in with 99.4% accuracy.',
    },
    {
      q: 'How does Smart Auto-Culling help photographers before client photo selection?',
      a: 'Our Smart Auto-Culling engine analyzes every uploaded photo for focus sharpness, closed eyes (blink detection), and burst duplicates. Photographers and clients can filter out soft frames with one click and enforce package selection limits effortlessly.',
    },
    {
      q: 'What is Live Upload Updates (FotoOwl Beam) and Original Quality Downloads?',
      a: 'With FotoOwl Beam camera-to-cloud FTP tethering, photos shot on your camera appear live in the event gallery within seconds. Clients and guests can download either uncompressed Original Quality masters (45MP+) or Web-Ready social copies.',
    },
    {
      q: 'How does the platform adapt across Mobile, iPad/Tablet, and Desktop screens?',
      a: 'Mobile devices open with a touch-first 2-column gallery and the signature FotoOwl bottom navigation bar. iPad & Tablets open with a dedicated 3-column proofing grid. Desktop screens open with the full widescreen studio command center and 4-column inspection workspace.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-28">
      {/* Clean Text-Only Top Header (Zero Icons) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-pink-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <a
            href="#top"
            className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            FotoOwl Studio OS
          </a>

          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#live-proofing"
              className="hover:text-[#E61575] transition-colors whitespace-nowrap shrink-0"
            >
              AI Face Match
            </a>
            <a
              href="#live-proofing"
              className="hover:text-[#E61575] transition-colors whitespace-nowrap shrink-0"
            >
              Photo Selection
            </a>
            <button
              type="button"
              onClick={() => onOpenDashboard('upload')}
              className="hover:text-[#E61575] transition-colors whitespace-nowrap shrink-0"
            >
              Live Beam Upload
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('album')}
              className="hover:text-[#E61575] transition-colors whitespace-nowrap shrink-0"
            >
              Album Designer
            </button>
            <a
              href="#pricing"
              className="hover:text-[#E61575] transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onOpenDashboard('overview')}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] rounded-full hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 shadow-xs"
            >
              Open Studio Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Clean Typography & Gallery Preview — No Extra Icons) */}
      <section
        id="top"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 md:pt-12 md:pb-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E61575]">
                AI-Powered Event Photo Sharing · Smart Culling · Client Selection
              </p>
              <h1
                className="text-3xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-slate-900 leading-[1.08]"
                style={{ textWrap: 'balance' }}
              >
                AI-Powered Live Event Photo Matching &amp; Studio Proofing.
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Deliver event photos in real time with Instant Face Match, automate eye-blink &amp; duplicate filtering with Smart Auto-Culling, stream camera-to-cloud Live Upload Updates, and provide Original Quality Downloads across Mobile, iPad, and Desktop.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectFotoOwlFeature('face_match')}
                  className="px-5 py-3 bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white text-xs font-semibold rounded-full hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 shadow-sm"
                >
                  Try Instant Face Match Live
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDashboard('overview')}
                  className="px-5 py-3 bg-[#0F172A] text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Open Photographer Dashboard
                </button>

                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="px-4 py-3 bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-full hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  Create Studio Account
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <span className="font-medium text-slate-700">Mobile 2-Column Layout</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">iPad &amp; Tablet 3-Column Layout</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">Desktop 4-Column Studio OS</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-white border border-pink-100 rounded-2xl p-4 flex-1 flex flex-col justify-between shadow-sm">
              <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-900">
                {heroPhoto && (
                  <ImageOptimizer
                    src={heroPhoto.secureUrl}
                    alt={heroPhoto.fileName}
                    watermarkText={studio.watermarkText}
                    className="w-full h-full"
                  />
                )}
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-slate-950/75 text-white text-xs font-medium backdrop-blur-xs">
                  {studio.studioName} — FotoOwl Live Event Stream
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white text-[11px] font-semibold shadow-xs">
                  99.4% AI Face Match Ready
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">{heroPhoto?.fileName}</div>
                  <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                    {heroPhoto?.exif.camera} · {heroPhoto?.exif.lens} · Original 45MP Ready
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {photos.slice(0, 4).map((ph, idx) => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => setHeroPreviewIndex(idx)}
                      aria-label={`Preview photo ${idx + 1}`}
                      className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                        heroPreviewIndex === idx
                          ? 'border-[#E61575] scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <ImageOptimizer
                        src={ph.thumbnailUrl}
                        alt={ph.fileName}
                        className="w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live FotoOwl Event Gallery, Face Match, Auto-Culling & Proofing Workspace */}
      <section id="live-proofing" className="bg-white border-y border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E61575] mb-1">
                Live Interactive FotoOwl Workspace
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Instant Face Match, Smart Auto-Culling, Live Upload &amp; Original Downloads
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setActiveShowcaseMode('proofing')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeShowcaseMode === 'proofing'
                    ? 'bg-white text-[#E61575] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                FotoOwl Live Event Gallery
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseMode('portfolio')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeShowcaseMode === 'portfolio'
                    ? 'bg-white text-[#E61575] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Public Studio Portfolio (/studio/{studio.slug})
              </button>
            </div>
          </div>

          {activeShowcaseMode === 'proofing' ? (
            <ClientGalleryPortal
              externalFotoOwlMode={activeFotoOwlMode}
              onChangeFotoOwlMode={setActiveFotoOwlMode}
            />
          ) : (
            <StudioPortfolioPage onOpenGallery={() => setActiveShowcaseMode('proofing')} />
          )}
        </div>
      </section>

      {/* Complete FotoOwl Ecosystem Workflows (Clean Typography — No Extra Icons) */}
      <section id="workflows" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#E61575]">
            Complete FotoOwl Feature Suite
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Everything built for Mobile, iPad/Tablet, and Desktop photography teams.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: '01. Instant AI Face Match & QR Sharing',
              desc: 'Guests scan an event QR code and take a selfie to find all their photos in 1 second with 99.4% facial recognition accuracy.',
              actionLabel: 'Launch Face Match →',
              onClick: () => handleSelectFotoOwlFeature('face_match'),
            },
            {
              title: '02. Smart Auto-Culling & Blink Filter',
              desc: 'Automatically detect closed eyes, motion blur, and duplicate burst shots so clients only review your sharpest frames.',
              actionLabel: 'Open Smart Auto-Cull →',
              onClick: () => handleSelectFotoOwlFeature('auto_culling'),
            },
            {
              title: '03. Live Upload Updates (FotoOwl Beam)',
              desc: 'Stream photos straight from camera FTP or bulk drag-and-drop uploader to the live event gallery while the event is happening.',
              actionLabel: 'Open Live Upload Stream →',
              onClick: () => handleSelectFotoOwlFeature('live_upload'),
            },
            {
              title: '04. Original Quality Master Downloads',
              desc: 'Allow couples and event guests to download uncompressed 45MP+ original camera masters or web-optimized social copies.',
              actionLabel: 'Open Download Manager →',
              onClick: () => handleSelectFotoOwlFeature('original_download'),
            },
            {
              title: '05. Collaborative Client Photo Selection',
              desc: 'Replace messy WhatsApp chats with package selection limits, favourites, per-photo retouch comments, and 1-click CSV export.',
              actionLabel: 'Open Selection Manager →',
              onClick: () => onOpenDashboard('selection'),
            },
            {
              title: '06. Online Editor, Album Designer & GST CRM',
              desc: 'Fine-tune exposure in HTML5 Canvas, lay out panoramic wedding album spreads, and generate 18% GST tax invoices.',
              actionLabel: 'Open Studio Dashboard →',
              onClick: () => onOpenDashboard('overview'),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white border border-slate-200 hover:border-pink-300 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-colors"
            >
              <div className="space-y-2.5">
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>

              <button
                type="button"
                onClick={item.onClick}
                className="text-xs font-bold text-[#E61575] hover:underline transition-colors self-start"
              >
                {item.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent Subscription Pricing Matrix (Clean Text — Zero Extra Icons) */}
      <section id="pricing" className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E61575] mb-1">
                Transparent Studio Plans
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Predictable storage, AI Face Match credits &amp; unlimited QR galleries
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Annual (2 Months Free)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price =
                billingCycle === 'monthly'
                  ? plan.monthlyPrice
                  : Math.round(plan.yearlyPrice / 12);
              const isHighlighted = plan.id === 'pro';
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between space-y-6 ${
                    isHighlighted
                      ? 'border-[#E61575] bg-slate-900 text-white shadow-lg'
                      : 'border-slate-200 bg-[#F8FAFC] text-slate-900'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#FF6A3D]">{plan.tagline}</div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <div className="font-mono text-3xl font-bold tabular-nums pt-1">
                      ${price}
                      <span
                        className={`text-xs font-normal ${
                          isHighlighted ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {' '}
                        / month {billingCycle === 'annual' && '(billed annually)'}
                      </span>
                    </div>

                    <div
                      className={`grid grid-cols-2 gap-2 py-3 border-y text-xs font-mono tabular-nums ${
                        isHighlighted
                          ? 'border-slate-800 text-slate-300'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div>Storage: {plan.storageLimitGB} GB</div>
                      <div>Photos: {plan.photoLimit.toLocaleString()}</div>
                      <div>Projects: {plan.projectLimit}</div>
                      <div>Team Seats: {plan.teamMemberLimit}</div>
                    </div>

                    <ul className="space-y-2 pt-2 text-xs">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <span className="text-[#FF385C] font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-opacity ${
                      isHighlighted
                        ? 'bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white hover:opacity-95'
                        : 'bg-[#0F172A] text-white hover:bg-slate-800'
                    }`}
                  >
                    Start with {plan.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl bg-white overflow-hidden">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.q} className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900"
                >
                  <span>{faq.q}</span>
                  <span className="text-xs font-mono text-slate-500">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-2.5">{faq.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong className="text-slate-900">FotoOwl Studio OS</strong> · AI-Powered Live Event Photo Matching &amp; Client Proofing Platform
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => onOpenDashboard('overview')}
              className="hover:text-[#E61575]"
            >
              Studio Dashboard
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('portfolio')}
              className="hover:text-[#E61575]"
            >
              Public Portfolio
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('super_admin')}
              className="hover:text-[#E61575]"
            >
              Super Admin Console
            </button>
          </div>
        </div>
      </footer>

      {/* ONLY Bottom Navigation Bar has the Icons */}
      <FotoOwlFeatureBar
        activeMode={activeFotoOwlMode}
        onSelectMode={handleSelectFotoOwlFeature}
        variant="bottom_nav"
      />
    </div>
  );
};
