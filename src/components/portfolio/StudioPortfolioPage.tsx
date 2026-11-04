import React, { useState } from 'react';
import { CheckCircle2, Globe, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ImageOptimizer } from '../ImageOptimizer';

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

  const filterTabs = ['All Works', 'Ceremony', 'Bridal Portraits', 'Reception', 'Editorial'];
  const displayedPhotos =
    portfolioFilter === 'All Works'
      ? photos
      : photos.filter((p) => p.category === portfolioFilter);

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
      totalBilled: 0,
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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Studio Portfolio Header Bar */}
      <div className="bg-[#0F172A] text-white px-6 py-10 md:px-12 md:py-14">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <Globe className="w-3.5 h-3.5" />
              <span className="font-mono">
                {studio.customDomain} · /studio/{studio.slug}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              {studio.studioName}
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">{studio.about}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                {studio.address}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0D9488]" />
                {studio.email}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-[#0D9488]" />
                {studio.phone}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${studio.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-[#0D9488] text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5"
            >
              <span>WhatsApp Concierge</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            {onOpenGallery && galleries[0] && (
              <button
                type="button"
                onClick={() => onOpenGallery(galleries[0].id)}
                className="px-4 py-2.5 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-colors"
              >
                View Client Proofing Portal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Curated Monograph Portfolio Grid */}
      <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Selected Monograph &amp; Editorial Commissions
            </h2>
            <p className="text-xs text-slate-500">
              Curated medium-format wedding, architectural, and portrait series
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPortfolioFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  portfolioFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50"
            >
              <div className="aspect-[4/3]">
                <ImageOptimizer
                  src={photo.secureUrl}
                  alt={photo.fileName}
                  watermarkText={studio.watermarkText}
                  className="w-full h-full"
                />
              </div>
              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-900">{photo.category}</span>
                <span className="font-mono text-slate-500 tabular-nums">
                  {photo.exif.camera} · {photo.exif.lens}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Studio Commission Packages & Live Booking Inquiry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-slate-200 items-start">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-2xl font-semibold text-slate-900">
              Bespoke Photography Collections
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
                <div key={pkg.name} className="p-4 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{pkg.name}</span>
                    <span className="text-xs font-mono font-semibold text-[#0D9488] tabular-nums">
                      {pkg.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{pkg.details}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleInquirySubmit}
            className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4 text-xs"
          >
            <h3 className="text-xl font-semibold text-slate-900">
              Inquire &amp; Reserve Commission Dates
            </h3>
            <p className="text-slate-600">
              Submitting this form creates a direct inquiry in {studio.studioName}&rsquo;s CRM and Booking Calendar.
            </p>

            {inquirySubmitted && (
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                <span>
                  Thank you! Your commission inquiry has been logged directly in our Studio CRM and Booking Calendar.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="port-name" className="block font-medium text-slate-700 mb-1">
                  Your Full Name
                </label>
                <input
                  id="port-name"
                  type="text"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="Ananya & Veer"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label htmlFor="port-email" className="block font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  id="port-email"
                  type="email"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="port-phone" className="block font-medium text-slate-700 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  id="port-phone"
                  type="text"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+91 98200..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="port-date" className="block font-medium text-slate-700 mb-1">
                  Celebration Date
                </label>
                <input
                  id="port-date"
                  type="date"
                  value={inquiryDate}
                  onChange={(e) => setInquiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="port-location" className="block font-medium text-slate-700 mb-1">
                  Venue &amp; City
                </label>
                <input
                  id="port-location"
                  type="text"
                  value={inquiryLocation}
                  onChange={(e) => setInquiryLocation(e.target.value)}
                  placeholder="Taj Lake Palace, Udaipur"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label htmlFor="port-pkg" className="block font-medium text-slate-700 mb-1">
                  Preferred Collection
                </label>
                <select
                  id="port-pkg"
                  value={inquiryPackage}
                  onChange={(e) => setInquiryPackage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
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
              className="w-full py-2.5 bg-[#0F172A] text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Request Date Availability &amp; Brochure
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
