import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ImageOptimizer } from '../components/ImageOptimizer';
import { ClientGalleryPortal } from '../components/gallery/ClientGalleryPortal';
import { StudioPortfolioPage } from '../components/portfolio/StudioPortfolioPage';
import { WeddingInvitationBuilder } from '../components/wedding-website/WeddingInvitationBuilder';
import { PassportExamPhotoStudio } from '../components/passport-studio/PassportExamPhotoStudio';
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
  const [activeShowcaseMode, setActiveShowcaseMode] = useState<
    'proofing' | 'passport_studio' | 'portfolio' | 'invitation'
  >('passport_studio');
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
      q: 'How does Instant AI Face Match & WhatsApp Guest Delivery work at weddings?',
      a: 'Guests scan the venue Display QR poster or personal QR pass, take a 1-second selfie, and our AI matches their face across all event photos with 99.4% accuracy—with 1-click delivery to WhatsApp or direct Cloudinary high-resolution download.',
    },
    {
      q: 'How does Cloudinary storage (dxeuzdwkz) and direct fl_attachment download work?',
      a: 'All uploaded wedding photos, album spreads, PNG watermarks, and portfolio masters are stored on Cloudinary using unsigned preset uploads and delivered with one-click fl_attachment high-res downloads.',
    },
    {
      q: 'Can clients select ❤️ favorites and export exact file numbers for the photographer?',
      a: 'Yes! Clients tap the ❤️ button on any photo, filter by "Selected Only", and export the exact file numbers & filenames list via 1-click Copy, CSV download, or direct WhatsApp message to the photographer.',
    },
    {
      q: 'How do the Interactive Album Designer, Colour Grading Studio, and Wedding Invitation Subdomain Builder work?',
      a: 'Studios can design multi-spread Italian Linen albums with comment pins and PDF export, grade photos with 6 luxury wedding LUT presets, sync Sony/Canon/Nikon cameras over Wi-Fi, and publish couple-name.pixelfotos.online digital wedding invitation websites.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 pb-28">
      {/* Luxury Dark/Gold Editorial Top Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-xl border-b border-amber-500/25">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <a
            href="#top"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <span className="text-lg sm:text-xl font-serif-editorial font-bold tracking-wide text-amber-300">
              Lumina Studio OS
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono text-amber-200">
              pixelfotos.online
            </span>
          </a>

          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            <button
              type="button"
              onClick={() => onOpenDashboard('passport_studio')}
              className="text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap shrink-0"
            >
              ID, Passport &amp; Exam Print Lab
            </button>
            <a
              href="#live-proofing"
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
            >
              AI Face Match &amp; QR
            </a>
            <button
              type="button"
              onClick={() => onOpenDashboard('album')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
            >
              Album Designer
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('editor')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
            >
              Colour Grading &amp; Watermark
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('tether')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
            >
              Live Camera Sync
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('invitation')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
            >
              Wedding Microsite
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenDashboard('overview')}
              className="px-4 py-2 text-xs font-bold text-[#0B0F17] bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] rounded-full hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Open Studio Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Luxury Hero Section */}
      <section
        id="top"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 md:pt-12 md:pb-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                LUXURY PHOTOGRAPHY SAAS · CLOUDINARY DELIVERY · AI QR GUEST SHARING
              </p>
              <h1
                className="text-3xl sm:text-5xl lg:text-[3.4rem] font-serif-editorial font-semibold tracking-tight text-white leading-[1.06]"
                style={{ textWrap: 'balance' }}
              >
                Bespoke Wedding Proofing, AI Face Match &amp; Studio OS.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Deliver high-resolution Cloudinary galleries with 1-click{' '}
                <code className="text-amber-300">fl_attachment</code> downloads, ❤️ client favorite file-number exports, Italian Linen wedding album proofing, 6 wedding colour-grading LUTs, Sony/Canon/Nikon Wi-Fi tethering, and{' '}
                <code className="text-amber-300">couple.pixelfotos.online</code> invitation microsites.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenDashboard('passport_studio')}
                  className="px-5 py-3 bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] text-xs font-bold rounded-full hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 shadow-[0_0_24px_rgba(245,158,11,0.35)]"
                >
                  Open ID, Passport &amp; Exam Studio
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectFotoOwlFeature('face_match')}
                  className="px-5 py-3 bg-[#131B2E] border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-full hover:bg-amber-500/15 transition-colors whitespace-nowrap shrink-0"
                >
                  Try Instant Face Match Live
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDashboard('album')}
                  className="px-5 py-3 bg-[#131B2E] border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-full hover:bg-amber-500/15 transition-colors whitespace-nowrap shrink-0"
                >
                  Launch Album Designer
                </button>

                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="px-4 py-3 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-full hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
                >
                  Studio Auth &amp; Setup
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="font-medium text-amber-200/90">Cloudinary Cloud: dxeuzdwkz</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-200/90">Mobile / iPad / Desktop Adaptive</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-200/90">WhatsApp Instant Guest Delivery</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-[#0F1624] border border-amber-500/30 rounded-2xl p-4 flex-1 flex flex-col justify-between shadow-2xl">
              <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-[#0B0F17]">
                {heroPhoto && (
                  <ImageOptimizer
                    src={heroPhoto.secureUrl}
                    alt={heroPhoto.fileName}
                    watermarkText={studio.watermarkText}
                    className="w-full h-full"
                  />
                )}
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-[#0B0F17]/80 border border-amber-500/30 text-amber-200 text-xs font-medium backdrop-blur-xs">
                  {studio.studioName} — White-Label Proofing Vault
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] text-[11px] font-bold shadow-md">
                  99.4% AI Face Match Ready
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-white">{heroPhoto?.fileName}</div>
                  <div className="text-slate-400 font-mono tabular-nums mt-0.5">
                    {heroPhoto?.exif.camera} · {heroPhoto?.exif.lens} · Cloudinary Master Ready
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
                          ? 'border-amber-400 scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
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

      {/* Interactive Live Proofing, White-Label Portfolio & Wedding Invitation Microsite Switcher */}
      <section id="live-proofing" className="bg-[#0B0F17] border-y border-amber-500/20 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
                LIVE INTERACTIVE STUDIO WORKSPACE
              </p>
              <h2 className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white">
                Client Selection (❤️), AI QR Guest Delivery, Portfolio &amp; Wedding Microsite
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#131B2E] border border-amber-500/30 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setActiveShowcaseMode('passport_studio')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeShowcaseMode === 'passport_studio'
                    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ID, Passport &amp; Exam Print Studio
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseMode('proofing')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeShowcaseMode === 'proofing'
                    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                White-Label Client Gallery
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseMode('portfolio')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeShowcaseMode === 'portfolio'
                    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Studio Portfolio (/studio/{studio.slug})
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseMode('invitation')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeShowcaseMode === 'invitation'
                    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Wedding Invitation (*.pixelfotos.online)
              </button>
            </div>
          </div>

          {activeShowcaseMode === 'passport_studio' ? (
            <PassportExamPhotoStudio />
          ) : activeShowcaseMode === 'proofing' ? (
            <ClientGalleryPortal
              externalFotoOwlMode={activeFotoOwlMode}
              onChangeFotoOwlMode={setActiveFotoOwlMode}
            />
          ) : activeShowcaseMode === 'portfolio' ? (
            <StudioPortfolioPage onOpenGallery={() => setActiveShowcaseMode('proofing')} />
          ) : (
            <WeddingInvitationBuilder onOpenGallery={() => setActiveShowcaseMode('proofing')} />
          )}
        </div>
      </section>

      {/* Complete 10 Studio Modules Showcase (Modules A to J) */}
      <section id="workflows" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
            MODULES A TO J · LUXURY STUDIO OPERATING SYSTEM
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white">
            Every tool required by high-end wedding &amp; editorial studios.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'A. Interactive Wedding Album Designer',
              desc: 'Multi-spread visual builder with 5 templates (Italian Linen Cover, Single Bleed, Dual Portrait, Editorial Trio, Panoramic Grid), zoom/pan, comment pins & PDF export.',
              actionLabel: 'Open Album Designer →',
              onClick: () => onOpenDashboard('album'),
            },
            {
              title: 'B & F. Colour Grading & Watermark Studio',
              desc: '6 signature wedding LUT presets (Royal Warmth, Golden Hour Airy, Bridal Monochrome, Dark Moody Cinema) + Text & PNG Logo Watermark via Cloudinary.',
              actionLabel: 'Open Grading & Watermark →',
              onClick: () => onOpenDashboard('editor'),
            },
            {
              title: 'C & D. ❤️ Selection & AI QR Guest Delivery',
              desc: 'Clients favorite photos with ❤️, copy exact file numbers, and allow wedding guests to scan a venue QR, take a selfie, and receive photos on WhatsApp.',
              actionLabel: 'Open Client Proofing →',
              onClick: () => handleSelectFotoOwlFeature('face_match'),
            },
            {
              title: 'E & G. Brand Galleries & Live Camera Sync',
              desc: 'White-label galleries with Masonry/Grid switcher + Sony, Canon & Nikon Wi-Fi tethering auto-upload to Cloudinary (dxeuzdwkz / Event schedule).',
              actionLabel: 'Open Live Camera Sync →',
              onClick: () => onOpenDashboard('tether'),
            },
            {
              title: 'H & I. Studio CRM, Billing & Portfolio',
              desc: 'Track wedding bookings, shoot calendar, advance paid vs pending balances, generate GST PDF invoices, send WhatsApp payment reminders, and showcase works.',
              actionLabel: 'Open CRM & Billing →',
              onClick: () => onOpenDashboard('invoices'),
            },
            {
              title: 'J. Wedding Invitation Website & Custom DNS',
              desc: 'Publish shareable couple-name.pixelfotos.online digital wedding invitations with Event Schedule, Google Maps, Countdown, RSVP & Custom Domain CNAME setup.',
              actionLabel: 'Open Wedding Website Builder →',
              onClick: () => onOpenDashboard('invitation'),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-[#0F1624] border border-amber-500/20 hover:border-amber-400 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-xl"
            >
              <div className="space-y-2.5">
                <h3 className="text-lg font-serif-editorial font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>

              <button
                type="button"
                onClick={item.onClick}
                className="text-xs font-bold text-amber-400 hover:underline transition-colors self-start"
              >
                {item.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent Subscription Pricing Matrix */}
      <section id="pricing" className="bg-[#0B0F17] border-y border-amber-500/20 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
                TRANSPARENT STUDIO PLANS
              </p>
              <h2 className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white">
                Predictable Cloudinary storage, AI Face Match credits &amp; custom domains
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#131B2E] border border-amber-500/30 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-amber-500 text-[#0B0F17]'
                    : 'text-slate-300'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-amber-500 text-[#0B0F17]'
                    : 'text-slate-300'
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
                      ? 'border-amber-400 bg-[#131B2E] text-white shadow-[0_0_30px_rgba(245,158,11,0.18)]'
                      : 'border-slate-800 bg-[#0F1624] text-slate-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-amber-400">{plan.tagline}</div>
                    <h3 className="text-2xl font-serif-editorial font-bold">{plan.name}</h3>
                    <div className="font-mono text-3xl font-bold tabular-nums pt-1 text-amber-300">
                      ${price}
                      <span className="text-xs font-normal text-slate-400">
                        {' '}
                        / month {billingCycle === 'annual' && '(billed annually)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800 text-xs font-mono tabular-nums text-slate-300">
                      <div>Storage: {plan.storageLimitGB} GB</div>
                      <div>Photos: {plan.photoLimit.toLocaleString()}</div>
                      <div>Projects: {plan.projectLimit}</div>
                      <div>Team Seats: {plan.teamMemberLimit}</div>
                    </div>

                    <ul className="space-y-2 pt-2 text-xs text-slate-300">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-opacity ${
                      isHighlighted
                        ? 'bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] hover:opacity-95'
                        : 'bg-white text-[#0B0F17] hover:bg-amber-100'
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
        <h2 className="text-2xl font-serif-editorial font-bold text-white text-center">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-slate-800 border border-amber-500/25 rounded-2xl bg-[#0F1624] overflow-hidden">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.q} className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left text-sm font-semibold text-white"
                >
                  <span>{faq.q}</span>
                  <span className="text-xs font-mono text-amber-400">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="text-xs text-slate-300 leading-relaxed mt-2.5">{faq.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="bg-[#0B0F17] border-t border-amber-500/20 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <strong className="text-amber-300">Lumina Studio OS (pixelfotos.online)</strong> · Luxury Wedding Proofing, Cloudinary Storage &amp; AI Event Photo Platform
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => onOpenDashboard('overview')}
              className="hover:text-amber-300"
            >
              Studio Dashboard
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('portfolio')}
              className="hover:text-amber-300"
            >
              Public Portfolio
            </button>
            <button
              type="button"
              onClick={() => onOpenDashboard('invitation')}
              className="hover:text-amber-300"
            >
              Wedding Website Builder
            </button>
          </div>
        </div>
      </footer>

      {/* STRICT BOTTOM NAVIGATION BAR RULE: Exact FotoOwl Bottom Navigation Bar with Luxury Dark/Gold theme */}
      <FotoOwlFeatureBar
        activeMode={activeFotoOwlMode}
        onSelectMode={handleSelectFotoOwlFeature}
        variant="bottom_nav"
      />
    </div>
  );
};
