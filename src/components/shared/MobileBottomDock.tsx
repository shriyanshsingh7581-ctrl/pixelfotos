import React, { useState } from 'react';
import {
  CalendarHeart,
  Cloud,
  CloudOff,
  ExternalLink,
  Frame,
  Globe,
  Home,
  Layers,
  Menu,
  Moon,
  Palette,
  Receipt,
  Sparkles,
  Sun,
  Users,
  Wand2,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { StudioModuleId } from '../../types/pixelfotos';
import { BottomSheetModal } from './BottomSheetModal';

const ALL_MODULES: {
  id: StudioModuleId;
  label: string;
  caption: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'lifecycle', label: '6-Stage Event Lifecycle', caption: 'QR · C-to-C · Face Match · RAW', icon: Layers },
  { id: 'culling', label: '01 · AI Photo Culling', caption: 'Sharpness · Duplicates · ZIP', icon: Sparkles },
  { id: 'retouch_lut', label: '02 · .CUBE LUT & Watermark', caption: '3D Trilinear · High-Res Export', icon: Palette },
  { id: 'album_retouch', label: '03 · 1-Click Album Retouch', caption: 'Skin Glare · Hair Guard', icon: Wand2 },
  { id: 'microsite_builder', label: '04 · Event Microsite', caption: 'Custom Slug · Maps · Stream', icon: Globe },
  { id: 'print_store', label: '05 · Gallery & Print Store', caption: 'Frames · PIN · Studio Margin', icon: Frame },
  { id: 'crm_expenses', label: '06 · Studio CRM & P&L', caption: 'Pipeline · Crew · Expenses', icon: Users },
  { id: 'billing_upi', label: '07 · Billing & UPI QR', caption: 'Quotes · GST PDF · Instant UPI', icon: Receipt },
];

export const MobileBottomDock: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    activeModule,
    openStudioAt,
    openMicrositeBySlug,
    microsite,
    events,
    setActiveEventId,
    theme,
    toggleTheme,
    firebaseUser,
    storageStatus,
    connectGoogleCloudSync,
    disconnectGoogleCloudSync,
    netProfitInr,
  } = usePixelFotos();

  const [moreOpen, setMoreOpen] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  const isHomeActive = viewMode === 'landing';
  const isAiStudioActive =
    viewMode === 'studio' &&
    (activeModule === 'culling' || activeModule === 'retouch_lut' || activeModule === 'album_retouch');
  const isEventsActive =
    viewMode === 'microsite' ||
    (viewMode === 'studio' &&
      (activeModule === 'lifecycle' || activeModule === 'microsite_builder' || activeModule === 'print_store'));
  const isCrmBillingActive =
    viewMode === 'studio' && (activeModule === 'crm_expenses' || activeModule === 'billing_upi');

  const handleToggleSync = async () => {
    setSyncBusy(true);
    try {
      if (firebaseUser) {
        await disconnectGoogleCloudSync();
      } else {
        await connectGoogleCloudSync();
      }
    } catch {
      // handled cleanly in header
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <>
      {/* Floating Glass Bottom Navigation Dock (< 768px Native Android App Shell) */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pointer-events-none"
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))' }}
      >
        <nav
          aria-label="Mobile app bottom dock"
          className="pointer-events-auto liquid-glass-dock rounded-[28px] px-2 py-1.5 grid grid-cols-5 items-center gap-0.5 max-w-md mx-auto"
        >
          <button
            type="button"
            onClick={() => setViewMode('landing')}
            className={`min-h-[48px] rounded-[20px] flex flex-col items-center justify-center gap-0.5 transition active:scale-[0.96] cursor-pointer ${
              isHomeActive
                ? 'bg-[#D4AF37] text-[#090B10] font-semibold shadow-sm'
                : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <Home className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none whitespace-nowrap">Home</span>
          </button>

          <button
            type="button"
            onClick={() => openStudioAt('culling')}
            className={`min-h-[48px] rounded-[20px] flex flex-col items-center justify-center gap-0.5 transition active:scale-[0.96] cursor-pointer ${
              isAiStudioActive
                ? 'bg-[#D4AF37] text-[#090B10] font-semibold shadow-sm'
                : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <Sparkles className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none whitespace-nowrap">AI Studio</span>
          </button>

          <button
            type="button"
            onClick={() => openStudioAt('lifecycle')}
            className={`min-h-[48px] rounded-[20px] flex flex-col items-center justify-center gap-0.5 transition active:scale-[0.96] cursor-pointer ${
              isEventsActive
                ? 'bg-[#D4AF37] text-[#090B10] font-semibold shadow-sm'
                : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <CalendarHeart className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none whitespace-nowrap">Events</span>
          </button>

          <button
            type="button"
            onClick={() => openStudioAt('crm_expenses')}
            className={`min-h-[48px] rounded-[20px] flex flex-col items-center justify-center gap-0.5 transition active:scale-[0.96] cursor-pointer ${
              isCrmBillingActive
                ? 'bg-[#D4AF37] text-[#090B10] font-semibold shadow-sm'
                : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <Receipt className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none whitespace-nowrap">CRM &amp; Pay</span>
          </button>

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`min-h-[48px] rounded-[20px] flex flex-col items-center justify-center gap-0.5 transition active:scale-[0.96] cursor-pointer ${
              moreOpen
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] font-semibold'
                : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <Menu className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none whitespace-nowrap">More</span>
          </button>
        </nav>
      </div>

      {/* Native Slide-Up More Drawer Bottom Sheet */}
      <BottomSheetModal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="PixelFotos Studio Drawer"
        subtitle={`${microsite.coupleOrHostName} · Net +₹${netProfitInr.toLocaleString('en-IN')}`}
        footer={
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[44px] rounded-2xl liquid-glass-subtle px-3 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-[#B58E24]" />}
              <span>{theme === 'dark' ? 'Daylight Pearl' : 'Pro Studio Dark'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                openMicrositeBySlug(microsite.slug);
              }}
              className="min-h-[44px] rounded-2xl bg-[#D4AF37] text-[#090B10] px-3 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Live /{microsite.slug}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Active Event Switcher */}
          {events.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Active Event Workspace ({events.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {events.map((evt) => {
                  const selected = evt.id === microsite.id;
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => setActiveEventId(evt.id)}
                      className={`min-h-[44px] px-3.5 rounded-2xl text-xs font-semibold border whitespace-nowrap shrink-0 cursor-pointer ${
                        selected
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-zinc-900 dark:text-white'
                          : 'border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {evt.coupleOrHostName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick All-8 Modules Grid */}
          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              All Studio Modules &amp; Workflow
            </p>
            <div className="grid grid-cols-1 gap-2">
              {ALL_MODULES.map((m) => {
                const Icon = m.icon;
                const active = viewMode === 'studio' && activeModule === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      openStudioAt(m.id);
                      setMoreOpen(false);
                    }}
                    className={`min-h-[52px] w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl border text-left transition active:scale-[0.98] cursor-pointer ${
                      active
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-zinc-900 dark:text-white'
                        : 'border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        active ? 'bg-[#D4AF37] text-[#090B10]' : 'bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{m.label}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{m.caption}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cloud Sync Control */}
          <button
            type="button"
            onClick={handleToggleSync}
            disabled={syncBusy}
            className={`min-h-[48px] w-full px-4 py-3 rounded-2xl border flex items-center justify-between text-xs font-semibold cursor-pointer ${
              storageStatus === 'firestore_synced'
                ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
                : 'border-black/10 dark:border-white/12 text-zinc-700 dark:text-zinc-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {storageStatus === 'firestore_synced' ? (
                <Cloud className="w-4 h-4" />
              ) : (
                <CloudOff className="w-4 h-4 text-[#D4AF37]" />
              )}
              {syncBusy
                ? 'Connecting Google Cloud Sync...'
                : storageStatus === 'firestore_synced'
                ? `Firestore Synced (${firebaseUser?.email || 'Owner'})`
                : 'Local IndexedDB · Tap to Connect Cloud Sync'}
            </span>
          </button>
        </div>
      </BottomSheetModal>
    </>
  );
};
