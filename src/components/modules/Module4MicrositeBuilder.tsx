import React, { useState } from 'react';
import { Calendar, Check, ExternalLink, MapPin, Plus, Trash2, Video } from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { PIXELFOTOS_ASSETS } from '../../data/pixelfotosData';

export const Module4MicrositeBuilder: React.FC = () => {
  const {
    events,
    activeEventId,
    setActiveEventId,
    microsite,
    setMicrosite,
    createNewEvent,
    openMicrositeBySlug,
  } = usePixelFotos();

  const [newSchTitle, setNewSchTitle] = useState('');
  const [newSchDate, setNewSchDate] = useState('12 Dec 2026');
  const [newSchTime, setNewSchTime] = useState('06:00 PM');
  const [newSchVenue, setNewSchVenue] = useState('Courtyard Lawn');

  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newCoupleName, setNewCoupleName] = useState('');
  const [newEventType, setNewEventType] = useState<'Wedding' | 'Engagement' | 'Birthday' | 'Griha Pravesh'>('Wedding');
  const [newEventDate, setNewEventDate] = useState('2026-12-28');
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCity, setNewVenueCity] = useState('Jaipur, Rajasthan');
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  const handleSlugify = (name: string) =>
    name
      .toLowerCase()
      .replace(/&/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleCreateCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupleName.trim()) return;
    const slug = handleSlugify(newCoupleName) || `event-${Date.now()}`;
    const venue = newVenueName.trim() || 'Rambagh Palace Lawns';
    const created = createNewEvent({
      coupleOrHostName: newCoupleName.trim(),
      eventType: newEventType,
      eventDate: newEventDate,
      venueName: venue,
      venueCity: newVenueCity.trim() || 'India',
      googleMapsQuery: `${venue} ${newVenueCity}`,
      slug,
      heroImageUrl: PIXELFOTOS_ASSETS.heroRoyalWedding,
      storyText: `Welcome to ${newCoupleName.trim()}'s ${newEventType.toLowerCase()} portal. Browse live photos, find yourself via AI Face Match, and order archival prints.`,
      youtubeStreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
      isPublished: true,
      schedule: [
        {
          id: `sch_${Date.now()}`,
          title: `${newEventType} Ceremony & Reception`,
          dateLabel: newEventDate,
          timeLabel: '06:30 PM',
          venueHall: venue,
          dressCode: 'Festive Formal',
        },
      ],
    });
    setCreatedNotice(`Published live microsite at /${created.slug} (saved to IndexedDB & Cloud Sync).`);
    setNewCoupleName('');
    setNewVenueName('');
    setShowNewEventForm(false);
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchTitle.trim()) return;
    setMicrosite((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          id: `sch_${Date.now()}`,
          title: newSchTitle.trim(),
          dateLabel: newSchDate.trim(),
          timeLabel: newSchTime.trim(),
          venueHall: newSchVenue.trim(),
          dressCode: 'Festive Formal',
        },
      ],
    }));
    setNewSchTitle('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37] tracking-wide">
            Module 04 · Live Route &amp; Multi-Event Publisher
          </p>
          <h2 className="text-2xl sm:text-3xl font-editorial font-semibold tracking-tight mt-0.5">
            Dedicated Event Micro-Website Generator
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Create any custom client slug (saved to IndexedDB &amp; Firestore) and open it directly at its live route with Google Maps, schedule, live stream, and AI Face Match gallery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={() => setShowNewEventForm((v) => !v)}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold border border-[#D4AF37] text-[#B58E24] dark:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showNewEventForm ? 'Close Event Creator' : 'New Custom Event Slug'}</span>
          </button>
          <button
            type="button"
            onClick={() => openMicrositeBySlug(microsite.slug)}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Live Route: /{microsite.slug}</span>
          </button>
        </div>
      </div>

      {/* Multi-Event Switcher Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-zinc-500 mr-1">Saved Events ({events.length}):</span>
        {events.map((evt) => {
          const active = evt.id === activeEventId;
          return (
            <button
              key={evt.id}
              type="button"
              onClick={() => setActiveEventId(evt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                active
                  ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-zinc-900 dark:text-white'
                  : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {evt.coupleOrHostName} (/{evt.slug})
            </button>
          );
        })}
      </div>

      {createdNotice && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 text-xs font-mono text-[#10B981]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{createdNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => openMicrositeBySlug(microsite.slug)}
            className="underline font-semibold cursor-pointer"
          >
            Visit /{microsite.slug} →
          </button>
        </div>
      )}

      {showNewEventForm && (
        <form
          onSubmit={handleCreateCustomEvent}
          className="rounded-2xl border border-[#D4AF37]/40 bg-white dark:bg-[#11141D] p-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
        >
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Couple / Host Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Diya & Vikram"
              value={newCoupleName}
              onChange={(e) => setNewCoupleName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">Event Type</label>
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value as typeof newEventType)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
            >
              <option value="Wedding">Wedding</option>
              <option value="Engagement">Engagement</option>
              <option value="Birthday">Birthday</option>
              <option value="Griha Pravesh">Griha Pravesh</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">Venue Name</label>
            <input
              type="text"
              placeholder="e.g. Taj Falaknuma"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="flex-1 px-2.5 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#10B981] text-[#090B10] cursor-pointer"
            >
              Publish
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#11141D] border border-zinc-200 dark:border-white/10 p-6 space-y-5">
          <h3 className="text-base font-semibold">Event Identity &amp; Custom Slug</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Couple / Host Name
              </label>
              <input
                type="text"
                value={microsite.coupleOrHostName}
                onChange={(e) => {
                  const val = e.target.value;
                  setMicrosite((prev) => ({
                    ...prev,
                    coupleOrHostName: val,
                    slug: handleSlugify(val) || prev.slug,
                  }));
                }}
                className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Event Category
              </label>
              <select
                value={microsite.eventType}
                onChange={(e) =>
                  setMicrosite((prev) => ({
                    ...prev,
                    eventType: e.target.value as typeof prev.eventType,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              >
                <option value="Wedding">Wedding</option>
                <option value="Engagement">Engagement</option>
                <option value="Birthday">Birthday</option>
                <option value="Griha Pravesh">Griha Pravesh</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Custom URL Slug
              </label>
              <div className="flex items-center rounded-lg overflow-hidden border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-[#090B10]">
                <span className="px-2.5 py-2 text-[11px] font-mono text-zinc-500 border-r border-zinc-300 dark:border-white/15">
                  pixelfotos.online/
                </span>
                <input
                  type="text"
                  value={microsite.slug}
                  onChange={(e) =>
                    setMicrosite((prev) => ({
                      ...prev,
                      slug: handleSlugify(e.target.value),
                    }))
                  }
                  className="flex-1 px-2.5 py-2 text-xs font-mono bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Primary Event Date
              </label>
              <input
                type="date"
                value={microsite.eventDate}
                onChange={(e) =>
                  setMicrosite((prev) => ({ ...prev, eventDate: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                value={microsite.venueName}
                onChange={(e) =>
                  setMicrosite((prev) => ({ ...prev, venueName: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Google Maps Location Query
              </label>
              <input
                type="text"
                value={microsite.googleMapsQuery}
                onChange={(e) =>
                  setMicrosite((prev) => ({ ...prev, googleMapsQuery: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
              Couple / Host Welcome Story
            </label>
            <textarea
              rows={2}
              value={microsite.storyText}
              onChange={(e) =>
                setMicrosite((prev) => ({ ...prev, storyText: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
              Live YouTube / RTMP Embed URL
            </label>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <input
                type="url"
                value={microsite.youtubeStreamUrl}
                onChange={(e) =>
                  setMicrosite((prev) => ({ ...prev, youtubeStreamUrl: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
              Hero Cover Artwork
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Royal Palace Arch', url: PIXELFOTOS_ASSETS.heroRoyalWedding },
                { label: 'Haldi Marigold', url: PIXELFOTOS_ASSETS.weddingHaldi },
                { label: 'Reception Lights', url: PIXELFOTOS_ASSETS.weddingReception },
                { label: 'Sangeet Celebration', url: PIXELFOTOS_ASSETS.weddingSangeet },
              ].map((cover) => (
                <button
                  key={cover.label}
                  type="button"
                  onClick={() =>
                    setMicrosite((prev) => ({ ...prev, heroImageUrl: cover.url }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                    microsite.heroImageUrl === cover.url
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37]'
                      : 'border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {cover.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl bg-white dark:bg-[#11141D] border border-zinc-200 dark:border-white/10 p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>Multi-Day Event Schedule ({microsite.schedule.length})</span>
            </h3>

            <div className="space-y-2.5">
              {microsite.schedule.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-[#090B10] border border-zinc-200 dark:border-white/10 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-semibold">{item.title}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {item.dateLabel} · {item.timeLabel} · {item.venueHall}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove schedule item"
                    onClick={() =>
                      setMicrosite((prev) => ({
                        ...prev,
                        schedule: prev.schedule.filter((s) => s.id !== item.id),
                      }))
                    }
                    className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddSchedule}
              className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-white/10"
            >
              <input
                type="text"
                value={newSchTitle}
                onChange={(e) => setNewSchTitle(e.target.value)}
                placeholder="Function title (e.g. Mehendi)"
                className="col-span-2 px-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
              <input
                type="text"
                value={newSchDate}
                onChange={(e) => setNewSchDate(e.target.value)}
                placeholder="Date"
                className="px-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
              <input
                type="text"
                value={newSchTime}
                onChange={(e) => setNewSchTime(e.target.value)}
                placeholder="Time"
                className="px-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
              <input
                type="text"
                value={newSchVenue}
                onChange={(e) => setNewSchVenue(e.target.value)}
                placeholder="Venue hall"
                className="col-span-2 px-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-[#090B10] border border-zinc-300 dark:border-white/15"
              />
              <button
                type="submit"
                className="col-span-2 py-2 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Timeline Event</span>
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#11141D] border border-zinc-200 dark:border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Interactive Venue Map Preview</span>
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  microsite.googleMapsQuery
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-[#B58E24] dark:text-[#D4AF37] hover:underline"
              >
                Open Directions
              </a>
            </div>
            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 h-40 bg-zinc-100 dark:bg-[#090B10]">
              <iframe
                title="Event Venue Google Map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  microsite.googleMapsQuery
                )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
