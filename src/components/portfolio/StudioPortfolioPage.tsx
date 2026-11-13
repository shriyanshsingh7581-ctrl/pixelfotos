import React, { useState } from 'react';
import {
  CheckCircle2,
  Globe,
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
  Star,
  Download,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ImageOptimizer } from '../ImageOptimizer';
import { triggerDirectPhotoDownload } from '../../lib/cloudinary';

export const StudioPortfolioPage: React.FC<{ onOpenGallery?: (galleryId: string) => void }> = ({
  onOpenGallery,
}) => {
  const { studio, photos, galleries, addClient, addBooking } = useAuth();
  const [portfolioFilter, setPortfolioFilter] = useState<string>('All Works');
  const [inquiryName, setInquiryName] = useState<string>('');
  const [inquiryEmail, setInquiryEmail] = useState<string>('');
  const [inquiryPhone, setInquiryPhone] = useState<string>('');
  const [inquiryDate, setInquiryDate] = useState<string>('2027-01-20');
  const [inquiryLocation, setInquiryLocation] = useState<string>('');
  const [inquiryPackage, setInquiryPackage] = useState<string>('Royal Destination Collective');
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);

  // Module I: Categorized Wedding Galleries
  const filterTabs = [
    'All Works',
    'Pre-Wedding',
    'Haldi',
    'Bridal',
    'Cinematic Highlights',
  ];

  const matchesCategoryTab = (photoCategory: string, activeTab: string) => {
    if (activeTab === 'All Works') return true;
    const lower = photoCategory.toLowerCase();
    if (activeTab === 'Pre-Wedding') return lower.includes('editorial') || lower.includes('pre');
    if (activeTab === 'Haldi') return lower.includes('ceremony') || lower.includes('haldi');
    if (activeTab === 'Bridal') return lower.includes('bridal') || lower.includes('portrait');
    if (activeTab === 'Cinematic Highlights')
      return lower.includes('reception') || lower.includes('sangeet');
    return true;
  };

  const displayedPhotos = photos.filter((p) => matchesCategoryTab(p.category, portfolioFilter));
  const finalPhotos = displayedPhotos.length > 0 ? displayedPhotos : photos;

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryEmail.trim()) return;
    const newClient = addClient({
      name: inquiryName.trim(),
      email: inquiryEmail.trim(),
      phone: inquiryPhone.trim() || '+91 98200 11111',
      whatsapp: (inquiryPhone.trim() || '+919820011111').replace(/\s+/g, ''),
      address: inquiryLocation.trim() || 'Destination Venue',
      eventDate: inquiryDate,
      projectDetails: `Portfolio Website Inquiry — ${inquiryPackage}`,
      notes: 'Submitted via public studio portfolio page',
      followUpDate: inquiryDate,
      totalBilled: 380000,
      totalPaid: 0,
    });
    addBooking({
      clientId: newClient.id,
      clientName: newClient.name,
      bookingType: 'Destination Wedding',
      eventDate: inquiryDate,
      location: inquiryLocation.trim() || 'Udaipur / Destination',
      assignedPhotographer: 'Julian Vance (Lead)',
      assignedEditor: 'Meera Krishnan (Senior Colorist)',
      status: 'inquiry',
      packageAmount: 380000,
      notes: `Package selected: ${inquiryPackage}`,
    });
    setInquirySubmitted(true);
    setInquiryName('');
    setInquiryEmail('');
    setInquiryPhone('');
    setInquiryLocation('');
  };

  return (
    <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl overflow-hidden text-slate-100 shadow-2xl">
      {/* Studio Portfolio Header Bar */}
      <div className="bg-gradient-to-b from-[#070A10] to-[#0F1624] border-b border-amber-500/20 px-6 py-10 md:px-12 md:py-14">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-widest">
              <Globe className="w-3.5 h-3.5" />
              <span className="font-mono">
                MODULE I · {studio.customDomain} · /studio/{studio.slug}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif-editorial font-semibold tracking-tight text-white">
              {studio.studioName}
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">{studio.about}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {studio.address}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                {studio.email}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                {studio.phone}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${studio.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] text-xs font-bold rounded-xl hover:opacity-95 transition-opacity inline-flex items-center gap-1.5 shadow-md"
            >
              <span>WhatsApp Concierge</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            {onOpenGallery && galleries[0] && (
              <button
                type="button"
                onClick={() => onOpenGallery(galleries[0].id)}
                className="px-4 py-2.5 bg-white/10 border border-amber-500/30 text-amber-200 text-xs font-semibold rounded-xl hover:bg-white/15 transition-colors"
              >
                View Client Proofing Portal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Curated Monograph Portfolio Grid */}
      <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white">
              Featured Weddings &amp; Categorized Monograph Galleries
            </h2>
            <p className="text-xs text-slate-400">
              Pre-Wedding · Haldi · Bridal Couture · Cinematic Highlights (Delivered via Cloudinary)
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-xl overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPortfolioFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  portfolioFilter === tab
                    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finalPhotos.map((photo) => (
            <div
              key={photo.id}
              className="border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden bg-[#0B0F17] transition-all group"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <ImageOptimizer
                  src={photo.secureUrl}
                  alt={photo.fileName}
                  watermarkText={studio.watermarkText}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-amber-200 block">{photo.category}</span>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {photo.exif.camera} · {photo.exif.lens}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => triggerDirectPhotoDownload(photo.secureUrl, photo.fileName)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#131B2E] border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 inline-flex items-center gap-1 text-[11px]"
                >
                  <Download className="w-3 h-3" />
                  <span>Master</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Client Testimonials Section */}
        <div className="space-y-4 pt-4 border-t border-amber-500/20">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            VERIFIED COUPLE TESTIMONIALS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                couple: 'Aanya & Kabir — The Oberoi Udaivilas, Udaipur',
                quote:
                  'Every single guest received their AI-matched wedding photos on WhatsApp before the reception dinner even ended. The Italian Linen album spreads are pure museum art.',
              },
              {
                couple: 'Rhea & Siddharth — Lake Como Villa Balbiano',
                quote:
                  'Selecting our top 50 album favourites with the 1-click heart tool and leaving pin notes directly on the spreads saved us weeks of back-and-forth emails.',
              },
              {
                couple: 'Meera & Dev — Rambagh Palace, Jaipur',
                quote:
                  'Our custom wedding invitation microsite (meera-dev.pixelfotos.online) and live camera-to-cloud Haldi gallery blew our families away.',
              },
            ].map((t) => (
              <div
                key={t.couple}
                className="p-5 rounded-2xl bg-[#0B0F17] border border-amber-500/20 space-y-3"
              >
                <div className="flex items-center gap-1 text-amber-400">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="font-serif-editorial text-base italic text-slate-200 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="text-xs font-semibold text-amber-300">{t.couple}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Studio Commission Packages & Live Booking Inquiry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-amber-500/20 items-start">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-2xl font-serif-editorial font-semibold text-white">
              Bespoke Wedding &amp; Editorial Collections
            </h3>
            <div className="space-y-3">
              {[
                {
                  name: 'Intimate Editorial Day',
                  price: '₹1,80,000 + GST',
                  details:
                    '1 Principal Photographer + 1 Documentary Shooter · 400 Color-Graded Masters · Private Online Proofing Gallery',
                },
                {
                  name: 'Royal Destination Collective',
                  price: '₹3,80,000 + GST',
                  details:
                    '3-Day Coverage (5-Person Crew) · Instant Event QR Guest Sharing · 40-Spread Handbound Italian Linen Album',
                },
                {
                  name: 'Architectural & Commercial Monograph',
                  price: '₹1,50,000 + GST',
                  details:
                    'Medium-Format Digital Capture · Full Commercial Licensing · 48-Hour Priority Cloudinary Delivery',
                },
              ].map((pkg) => (
                <div
                  key={pkg.name}
                  className="p-4 bg-[#0B0F17] border border-amber-500/20 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{pkg.name}</span>
                    <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                      {pkg.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{pkg.details}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleInquirySubmit}
            className="lg:col-span-6 bg-[#0B0F17] border border-amber-500/30 rounded-2xl p-6 space-y-4 text-xs"
          >
            <h3 className="text-xl font-serif-editorial font-semibold text-white">
              Direct Booking Inquiry &amp; Date Reservation
            </h3>
            <p className="text-slate-400">
              Submitting this form creates a direct client profile and booking in{' '}
              {studio.studioName}&rsquo;s Studio CRM.
            </p>

            {inquirySubmitted && (
              <div className="p-3.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-amber-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Thank you! Your commission inquiry has been logged directly in our Studio CRM and Shoot Calendar.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="port-name" className="block font-medium text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  id="port-name"
                  type="text"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="Ananya & Veer"
                  className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="port-email" className="block font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  id="port-email"
                  type="email"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="port-phone" className="block font-medium text-slate-300 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  id="port-phone"
                  type="text"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+91 98200..."
                  className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label htmlFor="port-date" className="block font-medium text-slate-300 mb-1">
                  Celebration Date
                </label>
                <input
                  id="port-date"
                  type="date"
                  value={inquiryDate}
                  onChange={(e) => setInquiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="port-location" className="block font-medium text-slate-300 mb-1">
                  Venue &amp; City
                </label>
                <input
                  id="port-location"
                  type="text"
                  value={inquiryLocation}
                  onChange={(e) => setInquiryLocation(e.target.value)}
                  placeholder="Taj Lake Palace, Udaipur"
                  className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="port-pkg" className="block font-medium text-slate-300 mb-1">
                  Preferred Collection
                </label>
                <select
                  id="port-pkg"
                  value={inquiryPackage}
                  onChange={(e) => setInquiryPackage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                >
                  <option value="Intimate Editorial Day">Intimate Editorial Day</option>
                  <option value="Royal Destination Collective">Royal Destination Collective</option>
                  <option value="Architectural & Commercial Monograph">
                    Architectural &amp; Commercial Monograph
                  </option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] font-bold rounded-xl hover:opacity-95 transition-opacity"
            >
              Request Date Availability &amp; Brochure
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
