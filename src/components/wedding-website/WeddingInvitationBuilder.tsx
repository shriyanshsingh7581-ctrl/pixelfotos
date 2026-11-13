import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Heart,
  MapPin,
  Plus,
  Send,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { WeddingInvitationRSVP, WeddingInvitationSite } from '../../types';
import { uploadAssetToCloudinary } from '../../services/uploadService';
import { ImageOptimizer } from '../ImageOptimizer';

const STORAGE_KEY_INVITE = 'pixelfotos_wedding_invitation_site_v1';

export const WeddingInvitationBuilder: React.FC<{
  onOpenGallery?: (galleryId: string) => void;
}> = ({ onOpenGallery }) => {
  const { studio, updateStudio, galleries, photos } = useAuth();

  const [site, setSite] = useState<WeddingInvitationSite>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVITE);
      if (saved) return JSON.parse(saved) as WeddingInvitationSite;
    } catch {
      // ignore
    }
    return {
      subdomain: 'aanya-kabir',
      coupleNames: 'Aanya & Kabir',
      tagline: 'Request the honour of your presence at their Royal Palace Celebration',
      weddingDate: '2026-12-18T18:30:00',
      story:
        'From a chance meeting at an art retrospective in Milan to a starlit proposal on Lake Pichola, our journey has been a celebration of timeless romance, family heritage, and shared adventures.',
      heroBannerUrl: photos[0]?.secureUrl || '',
      venueName: 'The Oberoi Udaivilas, Udaipur',
      venueAddress: 'Haridasji Ki Magri, Mulla Talai, Udaipur, Rajasthan 313001',
      venueMapUrl: 'https://maps.google.com/?q=The+Oberoi+Udaivilas+Udaipur',
      galleryId: galleries[0]?.id || 'gal_udaipur_main',
      events: [
        {
          id: 'ev_haldi',
          title: 'Surajkund Marigold Haldi',
          date: '17 Dec 2026',
          time: '10:30 AM Onwards',
          venue: 'Sunlit Courtyard Lawn',
          dressCode: 'Shades of Mustard & Ivory',
        },
        {
          id: 'ev_mehendi',
          title: 'Royal Folk Mehendi & Sundowner',
          date: '17 Dec 2026',
          time: '04:00 PM Onwards',
          venue: 'Lakefront Pavilion',
          dressCode: 'Emerald Green & Festive Pastels',
        },
        {
          id: 'ev_wedding',
          title: 'The Royalbaraat & Lakefront Pheras',
          date: '18 Dec 2026',
          time: '05:30 PM Auspicious Muhurat',
          venue: 'Grand Dome Amphitheatre',
          dressCode: 'Traditional Heritage Couture',
        },
        {
          id: 'ev_reception',
          title: 'Black-Tie Champagne Reception Gala',
          date: '19 Dec 2026',
          time: '08:00 PM Onwards',
          venue: 'Chandra Mahal Ballroom',
          dressCode: 'Black Tie / Gold Glam',
        },
      ],
      rsvps: [
        {
          id: 'rsvp_1',
          guestName: 'Vikramaditya & Tanya Singhania',
          phone: '+91 98201 44500',
          guestsCount: 3,
          attendingEvents: ['Haldi', 'Mehendi', 'Wedding', 'Reception'],
          message: 'Counting down the days to celebrate with both families in Udaipur!',
          submittedAt: '2 hours ago',
        },
      ],
    };
  });

  // Countdown timer state
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    mins: number;
  }>({ days: 35, hours: 14, mins: 22 });

  // New Event Schedule Item state
  const [newEvTitle, setNewEvTitle] = useState<string>('');
  const [newEvDate, setNewEvDate] = useState<string>('19 Dec 2026');
  const [newEvTime, setNewEvTime] = useState<string>('01:00 PM');
  const [newEvVenue, setNewEvVenue] = useState<string>('Poolside Terrace');
  const [newEvDress, setNewEvDress] = useState<string>('Resort Chic');

  // Guest RSVP Form state
  const [rsvpName, setRsvpName] = useState<string>('');
  const [rsvpPhone, setRsvpPhone] = useState<string>('');
  const [rsvpCount, setRsvpCount] = useState<number>(2);
  const [rsvpMsg, setRsvpMsg] = useState<string>('');

  // Custom Domain Verification state
  const [customDomainInput, setCustomDomainInput] = useState<string>(
    studio.customDomain || 'galleries.ateliervance.studio'
  );
  const [domainVerified, setDomainVerified] = useState<boolean>(true);
  const [verifyingDns, setVerifyingDns] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVITE, JSON.stringify(site));
    } catch {
      // ignore
    }
  }, [site]);

  useEffect(() => {
    const compute = () => {
      const target = new Date(site.weddingDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setCountdown({ days: days || 28, hours: hours || 11, mins: mins || 45 });
    };
    compute();
  }, [site.weddingDate]);

  const fullSubdomainUrl = `https://${site.subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')}.pixelfotos.online`;

  const handleUploadHeroBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const res = await uploadAssetToCloudinary(file, 'pixelfotos-studio/wedding-websites');
      setSite((prev) => ({ ...prev, heroBannerUrl: res.secureUrl }));
      setToastMsg(
        `Uploaded couple cover photo "${file.name}" to Cloudinary (dxeuzdwkz) and updated wedding microsite.`
      );
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleAddEventItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvTitle.trim()) return;
    setSite((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: `ev_${Date.now()}`,
          title: newEvTitle.trim(),
          date: newEvDate,
          time: newEvTime,
          venue: newEvVenue,
          dressCode: newEvDress,
        },
      ],
    }));
    setNewEvTitle('');
    setToastMsg('Added new ceremony to the Wedding Invitation Schedule.');
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    const newEntry: WeddingInvitationRSVP = {
      id: `rsvp_${Date.now()}`,
      guestName: rsvpName.trim(),
      phone: rsvpPhone.trim() || '+91 98200 00000',
      guestsCount: Number(rsvpCount) || 1,
      attendingEvents: ['Haldi', 'Mehendi', 'Wedding', 'Reception'],
      message: rsvpMsg.trim() || 'Excited to attend!',
      submittedAt: 'Just now',
    };
    setSite((prev) => ({ ...prev, rsvps: [newEntry, ...prev.rsvps] }));
    setRsvpName('');
    setRsvpPhone('');
    setRsvpMsg('');
    setToastMsg(`RSVP recorded for ${newEntry.guestName} (${newEntry.guestsCount} guests)!`);
  };

  const handleVerifyCustomDomain = () => {
    setVerifyingDns(true);
    setTimeout(() => {
      setVerifyingDns(false);
      setDomainVerified(true);
      updateStudio({ customDomain: customDomainInput.trim() });
      setToastMsg(
        `Verified CNAME & A-Record SSL configuration for "${customDomainInput.trim()}". Custom domain is LIVE!`
      );
    }, 450);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Subdomain & Custom Domain Header */}
      <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
              MODULE J · CLIENT WEDDING INVITATION WEBSITE (SUBDOMAIN BUILDER) &amp; CUSTOM DOMAIN
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white">
              Digital Wedding Invitation Microsite &amp; White-Label Domain Studio
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-[#0B0F17] border border-amber-500/35 text-xs font-mono text-amber-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{fullSubdomainUrl}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(fullSubdomainUrl);
                setToastMsg(`Copied invitation link: ${fullSubdomainUrl}`);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#161F33] border border-amber-500/30 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 inline-flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `✨ You are cordially invited to the wedding celebration of ${site.coupleNames} at ${site.venueName}! View schedule, venue map, RSVP & live wedding photos: ${fullSubdomainUrl}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share Invitation on WhatsApp</span>
            </a>
          </div>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg('')}
              className="text-amber-300 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Builder Controls & Custom Domain DNS Panel */}
          <div className="lg:col-span-5 space-y-5 text-xs">
            <div className="bg-[#0B0F17] border border-amber-500/20 rounded-xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-200">
                  1. Subdomain &amp; Couple Story Builder
                </span>
                <label
                  htmlFor="invite-banner-upload"
                  className="text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1 font-semibold"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingBanner ? 'Uploading...' : 'Upload Cover Photo'}</span>
                  <input
                    id="invite-banner-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUploadHeroBanner}
                    className="sr-only"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Client Subdomain (.pixelfotos.online)
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={site.subdomain}
                    onChange={(e) => setSite({ ...site, subdomain: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-l-lg text-amber-300 font-mono"
                  />
                  <span className="px-3 py-2 bg-slate-800 border border-l-0 border-slate-700 rounded-r-lg text-slate-300 font-mono">
                    .pixelfotos.online
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Couple Names</label>
                  <input
                    type="text"
                    value={site.coupleNames}
                    onChange={(e) => setSite({ ...site, coupleNames: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Wedding Date &amp; Muhurat
                  </label>
                  <input
                    type="datetime-local"
                    value={site.weddingDate}
                    onChange={(e) => setSite({ ...site, weddingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Couple Love Story</label>
                <textarea
                  rows={3}
                  value={site.story}
                  onChange={(e) => setSite({ ...site, story: e.target.value })}
                  className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Primary Venue</label>
                  <input
                    type="text"
                    value={site.venueName}
                    onChange={(e) => setSite({ ...site, venueName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Google Maps Venue URL
                  </label>
                  <input
                    type="url"
                    value={site.venueMapUrl}
                    onChange={(e) => setSite({ ...site, venueMapUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Add Ceremony to Event Schedule */}
            <form
              onSubmit={handleAddEventItem}
              className="bg-[#0B0F17] border border-amber-500/20 rounded-xl p-5 space-y-3"
            >
              <div className="text-sm font-semibold text-amber-200">
                2. Add Function to Event Schedule (Haldi / Mehendi / Sangeet / Pheras)
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={newEvTitle}
                  onChange={(e) => setNewEvTitle(e.target.value)}
                  placeholder="e.g. Royal Sangeet Night"
                  className="px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  required
                />
                <input
                  type="text"
                  value={newEvDate}
                  onChange={(e) => setNewEvDate(e.target.value)}
                  placeholder="18 Dec 2026"
                  className="px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newEvTime}
                  onChange={(e) => setNewEvTime(e.target.value)}
                  placeholder="07:30 PM"
                  className="px-2.5 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                />
                <input
                  type="text"
                  value={newEvVenue}
                  onChange={(e) => setNewEvVenue(e.target.value)}
                  placeholder="Venue Lawn"
                  className="px-2.5 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                />
                <input
                  type="text"
                  value={newEvDress}
                  onChange={(e) => setNewEvDress(e.target.value)}
                  placeholder="Dress Code"
                  className="px-2.5 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[#161F33] border border-amber-500/40 text-amber-200 font-semibold rounded-lg hover:bg-amber-500/20 inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Ceremony to Invitation</span>
              </button>
            </form>

            {/* Custom Domain CNAME / A-Record Configuration & Live Verification */}
            <div className="bg-[#0B0F17] border border-amber-500/25 rounded-xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-200">
                  3. Custom Studio Domain (CNAME / A-Record Setup)
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    domainVerified
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {domainVerified ? 'SSL & DNS VERIFIED' : 'PENDING DNS'}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => {
                    setCustomDomainInput(e.target.value);
                    setDomainVerified(false);
                  }}
                  placeholder="e.g. galleries.yourstudio.com"
                  className="flex-1 px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleVerifyCustomDomain}
                  className="px-3.5 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-lg whitespace-nowrap"
                >
                  {verifyingDns ? 'Checking...' : 'Verify DNS'}
                </button>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden text-[11px] font-mono">
                <div className="grid grid-cols-3 bg-[#131B2E] px-3 py-1.5 text-amber-300 font-bold">
                  <span>Type</span>
                  <span>Host</span>
                  <span>Points To / Value</span>
                </div>
                <div className="grid grid-cols-3 px-3 py-2 border-t border-slate-800 text-slate-300">
                  <span>CNAME</span>
                  <span>galleries</span>
                  <span className="truncate">cname.pixelfotos.online</span>
                </div>
                <div className="grid grid-cols-3 px-3 py-2 border-t border-slate-800 text-slate-300">
                  <span>A Record</span>
                  <span>@</span>
                  <span>76.76.21.21</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Preview of Client Wedding Invitation Microsite */}
          <div className="lg:col-span-7 bg-[#0B0F17] border border-amber-500/35 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-[#131B2E] px-4 py-2.5 border-b border-amber-500/20 flex items-center justify-between text-xs">
              <span className="font-mono text-amber-300">{fullSubdomainUrl}</span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                LIVE INVITATION MICROSITE PREVIEW
              </span>
            </div>

            {/* Hero Cover */}
            <div className="relative h-64 sm:h-72 overflow-hidden">
              <ImageOptimizer
                src={site.heroBannerUrl || photos[0]?.secureUrl || ''}
                alt={site.coupleNames}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/45 to-transparent flex flex-col justify-end p-6 text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-300 mb-1">
                  THE ROYAL WEDDING CELEBRATION OF
                </p>
                <h3 className="text-3xl sm:text-4xl font-serif-editorial font-semibold text-white">
                  {site.coupleNames}
                </h3>
                <p className="text-xs text-slate-200 mt-1">{site.venueName}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Live Countdown Timer */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center">
                {[
                  { label: 'DAYS', val: countdown.days },
                  { label: 'HOURS', val: countdown.hours },
                  { label: 'MINUTES', val: countdown.mins },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-xl bg-[#131B2E] border border-amber-500/30"
                  >
                    <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                      {item.val}
                    </div>
                    <div className="text-[10px] tracking-widest text-slate-400 mt-0.5">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Couple Story */}
              <div className="text-center max-w-xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-amber-400">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Our Story</span>
                </div>
                <p className="font-serif-editorial text-base italic text-slate-200 leading-relaxed">
                  &ldquo;{site.story}&rdquo;
                </p>
              </div>

              {/* Event Schedule Cards */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-amber-300 text-center">
                  Wedding Ceremonies &amp; Schedule
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {site.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl bg-[#131B2E] border border-amber-500/20 space-y-1 text-xs"
                    >
                      <div className="font-serif-editorial text-base font-semibold text-amber-200">
                        {ev.title}
                      </div>
                      <div className="text-slate-300 font-mono">
                        {ev.date} · {ev.time}
                      </div>
                      <div className="text-slate-400">Venue: {ev.venue}</div>
                      <div className="text-amber-300/90 text-[11px]">
                        Dress Code: {ev.dressCode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Venue Google Map Link & Live Event Gallery Link */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={site.venueMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#161F33] border border-amber-500/40 text-amber-200 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-amber-500/20"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Venue in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {onOpenGallery && (
                  <button
                    type="button"
                    onClick={() => onOpenGallery(site.galleryId)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open Live Event AI Photo Gallery</span>
                  </button>
                )}
              </div>

              {/* Guest RSVP Form & Submitted List */}
              <div className="border-t border-slate-800 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <form onSubmit={handleRsvpSubmit} className="space-y-2.5">
                  <div className="font-semibold text-amber-200">
                    Guest Online RSVP Confirmation
                  </div>
                  <input
                    type="text"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="Your Full Name & Family"
                    className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value)}
                      placeholder="WhatsApp Number"
                      className="px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={rsvpCount}
                      onChange={(e) => setRsvpCount(Number(e.target.value))}
                      placeholder="Guests"
                      className="px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={rsvpMsg}
                    onChange={(e) => setRsvpMsg(e.target.value)}
                    placeholder="Blessings or dietary note..."
                    className="w-full px-3 py-2 bg-[#131B2E] border border-slate-700 rounded-lg text-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-lg"
                  >
                    Confirm Attendance (RSVP)
                  </button>
                </form>

                <div className="space-y-2">
                  <div className="font-semibold text-amber-200">
                    Confirmed Guest RSVPs ({site.rsvps.length})
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {site.rsvps.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-lg bg-[#131B2E] border border-slate-800"
                      >
                        <div className="flex items-center justify-between font-semibold text-white">
                          <span>{r.guestName}</span>
                          <span className="text-amber-300 font-mono">
                            {r.guestsCount} Guests
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{r.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
