import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CloudUpload,
  QrCode,
  ScanFace,
  ShieldCheck,
  Sliders,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ImageOptimizer } from '../components/ImageOptimizer';
import { ClientGalleryPortal } from '../components/gallery/ClientGalleryPortal';
import { StudioPortfolioPage } from '../components/portfolio/StudioPortfolioPage';
import { DashboardTabId } from '../components/dashboard/StudioDashboardShell';

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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroPreviewIndex, setHeroPreviewIndex] = useState<number>(0);

  const heroPhoto = photos[heroPreviewIndex] || photos[0];

  const faqs = [
    {
      q: 'How does the Cloudinary bulk upload and folder hierarchy work?',
      a: 'Every studio upload is organized automatically under photography-studios/{studioId}/projects/{projectId}/{galleryId}/originals with responsive WebP thumbnails and optional watermark overlays. Super Admins can configure and validate unsigned presets or signed delivery URLs at any time.',
    },
    {
      q: 'Can wedding couples select album photos and leave retouch notes without creating a developer account?',
      a: 'Yes. Photographers share a public, private, or SHA-256 passcode-protected gallery link or printable event QR card. Clients mark favourites, select photos up to the photographer’s exact selection limit, add retouching comments per photo, and submit their final album selection in real time.',
    },
    {
      q: 'How are AI Face Search privacy and biometric consent handled?',
      a: 'Before any guest uploads a reference selfie, Lumina Studio OS enforces an explicit privacy notice, configurable data-retention window (7, 30, or 90 days), and a one-click "Delete My Selfie & Face Index" purge control. Face matching connects via a modular FaceRecognitionService adapter.',
    },
    {
      q: 'Are GST invoices automatically marked as paid when generated?',
      a: 'No. To protect studio accounting integrity, invoices compute 18% GST (9% CGST + 9% SGST), track advance payments and remaining balances, and require a verified bank UTR or payment gateway settlement reference before transitioning to Paid status.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Lumina Studio OS
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#live-proofing"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Client Proofing
            </a>
            <a
              href="#workflows"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Workflows
            </a>
            <button
              type="button"
              onClick={() => onOpenDashboard('editor')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Photo Editor
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('album')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Album Designer
            </button>
            <a
              href="#pricing"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onOpenDashboard('overview')}
              className="px-4 py-2 text-xs font-medium text-white bg-[#0F172A] rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Open Studio Workspace
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: 2-Column Split with items-stretch + Full-Width KPI Strip Below */}
      <section id="top" className="max-w-7xl mx-auto px-6 pt-12 pb-16 md:pt-16 md:pb-20 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Editorial Typographic Hierarchy */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <p className="text-xs font-medium text-[#0D9488] tracking-wide">
                Unified Photography Studio SaaS · Proofing · QR Delivery · Studio CRM
              </p>
              <h1
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight text-slate-900 leading-[1.08]"
                style={{ textWrap: 'balance' }}
              >
                Deliver heirloom galleries, automate client selections, and run your entire studio.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Built for wedding photographers, fine-art studios, and commercial production houses. Combine Groupfie-inspired QR event sharing, FotoOwl-grade client album proofing, and Fotos-style studio CRM &amp; GST billing in one cohesive platform.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenDashboard('overview')}
                  className="px-5 py-3 bg-[#0F172A] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Launch Studio Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-[#0D9488]" />
                </button>

                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="px-5 py-3 bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  6-Step Studio Registration
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Cloudinary Smart Delivery</span>
                <span aria-hidden="true">·</span>
                <span>Zero-Trust Firestore Rules</span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenDashboard('super_admin')}
                  className=" font-medium text-[#0D9488] hover:underline"
                >
                  Super Admin Console →
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Photography Gallery Preview at Matching Height */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex-1 flex flex-col justify-between shadow-xs">
              <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-900">
                {heroPhoto && (
                  <ImageOptimizer
                    src={heroPhoto.secureUrl}
                    alt={heroPhoto.fileName}
                    watermarkText={studio.watermarkText}
                    className="w-full h-full"
                  />
                )}
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/75 text-white text-xs font-medium backdrop-blur-xs">
                  {studio.studioName} — Live Client Gallery Preview
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">{heroPhoto?.fileName}</div>
                  <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                    {heroPhoto?.exif.camera} · {heroPhoto?.exif.lens} · {heroPhoto?.exif.aperture}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {photos.slice(0, 4).map((ph, idx) => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => setHeroPreviewIndex(idx)}
                      aria-label={`Preview photo ${idx + 1}`}
                      className={`w-12 h-9 rounded-md overflow-hidden border-2 transition-all ${
                        heroPreviewIndex === idx
                          ? 'border-[#0D9488] scale-105'
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

        {/* Full-Width 4-Column Quantitative Proof Strip Below Hero Split */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white border border-slate-200 rounded-xl p-6">
          <div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              3.4x Faster
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Wedding album selection turnaround via live limit-enforced client proofing links
            </p>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              100% Isolated
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Multi-tenant Firebase security rules with PII split collections &amp; SHA-256 gallery vaults
            </p>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              7 Role Tiers
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Granular permissions for Super Admin, Studio Owner, Admin, Photographer, Editor, Client &amp; Guest
            </p>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              18% GST Ready
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Automated CGST/SGST tax breakdown, PDF invoices, and verified gateway UTR settlement
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Live Proofing & Public Studio Portfolio Workspace Section */}
      <section id="live-proofing" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#0D9488] mb-1">
                01. Interactive Live Demonstration
              </p>
              <h2 className="text-3xl font-semibold text-slate-900">
                Experience Client Proofing, QR Event Sharing &amp; Studio Portfolio Live
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setActiveShowcaseMode('proofing')}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeShowcaseMode === 'proofing'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Client Proofing Gallery &amp; QR
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseMode('portfolio')}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeShowcaseMode === 'portfolio'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Public Studio Portfolio (/studio/{studio.slug})
              </button>
            </div>
          </div>

          {activeShowcaseMode === 'proofing' ? (
            <ClientGalleryPortal />
          ) : (
            <StudioPortfolioPage onOpenGallery={() => setActiveShowcaseMode('proofing')} />
          )}
        </div>
      </section>

      {/* End-to-End Studio Architecture & Workflows */}
      <section id="workflows" className="max-w-7xl mx-auto px-6 py-16 space-y-10">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-[#0D9488]">
            02. Unified Studio Architecture
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Every tool required to capture, proof, edit, design, and bill.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: '01. Bulk Cloudinary Upload & Watermarking',
              desc: 'Drag-and-drop batch uploader with duplicate detection, progress bars, automatic folder routing, and live studio watermark protection.',
              actionLabel: 'Open Bulk Uploader',
              tab: 'upload' as DashboardTabId,
              icon: CloudUpload,
            },
            {
              title: '02. FotoOwl-Style Album Selection & Proofing',
              desc: 'Enforce maximum selection limits, collect per-photo retouch comments, export selected filenames to CSV, and lock approved selections.',
              actionLabel: 'Open Proofing Manager',
              tab: 'selection' as DashboardTabId,
              icon: QrCode,
            },
            {
              title: '03. Groupfie-Inspired QR & Biometric Consent',
              desc: 'Generate downloadable PNG/PDF event QR cards and manage guest face-search consent with transparent biometric retention controls.',
              actionLabel: 'Manage Event QR',
              tab: 'galleries' as DashboardTabId,
              icon: ScanFace,
            },
            {
              title: '04. Non-Destructive Online Photo Editor',
              desc: 'Grade exposure, contrast, saturation, and film warmth in HTML5 Canvas, apply aspect crops, and save edited masters without overwriting originals.',
              actionLabel: 'Launch Photo Editor',
              tab: 'editor' as DashboardTabId,
              icon: Sliders,
            },
            {
              title: '05. Interactive Wedding Album Designer',
              desc: 'Arrange panoramic spreads, customize Italian Linen or Obsidian covers, collect client revision requests online, and export print-ready PDF proofs.',
              actionLabel: 'Open Album Designer',
              tab: 'album' as DashboardTabId,
              icon: BookOpen,
            },
            {
              title: '06. Studio CRM, Crew Calendar & GST Billing',
              desc: 'Manage client timelines, assign lead photographers and colorists to wedding dates, and issue 18% GST tax invoices with verified UTR settlement.',
              actionLabel: 'Open Studio CRM & Billing',
              tab: 'invoices' as DashboardTabId,
              icon: ShieldCheck,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0F172A] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#0D9488]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDashboard(item.tab)}
                  className="text-xs font-semibold text-[#0F172A] hover:text-[#0D9488] inline-flex items-center gap-1.5 transition-colors self-start"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transparent Subscription Pricing Matrix */}
      <section id="pricing" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#0D9488] mb-1">
                03. Transparent Studio Tiers
              </p>
              <h2 className="text-3xl font-semibold text-slate-900">
                Predictable storage, team seats, and gallery quotas
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
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
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
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
                  className={`rounded-xl border p-6 flex flex-col justify-between space-y-6 ${
                    isHighlighted
                      ? 'border-[#0F172A] bg-slate-900 text-white'
                      : 'border-slate-200 bg-[#F8FAFC] text-slate-900'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-[#0D9488]">{plan.tagline}</div>
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
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

                    <ul className="space-y-2.5 pt-2 text-xs">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#0D9488] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isHighlighted
                        ? 'bg-[#0D9488] text-white hover:bg-teal-700'
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

      {/* Attributable Studio Testimonials & FAQ */}
      <section className="max-w-7xl mx-auto px-6 py-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote:
                'Before Lumina Studio OS, wedding album selection took our couples 11 weeks over WhatsApp spreadsheets. With the FotoOwl-style limit enforcement and CSV export, we now close album approvals in 9 days.',
              author: 'Vikramaditya Sen',
              role: 'Founder & Lead Photographer, House of Sen Weddings (Mumbai & Udaipur)',
            },
            {
              quote:
                'Having our public portfolio, QR table-stand generator, and 18% GST tax invoicing inside one workspace eliminated three separate SaaS subscriptions for our 12-person production team.',
              author: 'kiara D’Souza',
              role: 'Executive Producer, Studio Chiaroscuro (Bengaluru)',
            },
            {
              quote:
                'Our corporate gala clients love scanning the event QR code while respecting strict guest privacy consent. The non-destructive online editor lets our colorists make instant crop tweaks from any browser.',
              author: 'Arjun Malhotra',
              role: 'Creative Director, Prism Commercial Media (New Delhi)',
            },
          ].map((t) => (
            <blockquote
              key={t.author}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
            >
              <p className="text-xs text-slate-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="text-xs border-t border-slate-100 pt-3">
                <div className="font-semibold text-slate-900">{t.author}</div>
                <div className="text-slate-500 mt-0.5">{t.role}</div>
              </footer>
            </blockquote>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900 text-center">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={faq.q} className="p-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-2.5">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong className="text-slate-900">Lumina Studio OS</strong> · Professional Photography Studio Management &amp; Client Proofing SaaS
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => onOpenDashboard('overview')}
              className="hover:text-slate-900"
            >
              Studio Dashboard
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('portfolio')}
              className="hover:text-slate-900"
            >
              Public Portfolio
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('super_admin')}
              className="hover:text-slate-900"
            >
              Super Admin Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
