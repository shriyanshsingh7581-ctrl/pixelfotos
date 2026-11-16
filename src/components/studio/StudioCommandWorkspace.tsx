import React, { useState } from 'react';
import {
  Aperture,
  Camera,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  ExternalLink,
  Frame,
  Globe,
  Layers,
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
import { EventLifecycleWorkflow } from '../lifecycle/EventLifecycleWorkflow';
import { Module1AICulling } from '../modules/Module1AICulling';
import { Module2RetouchAndLUT } from '../modules/Module2RetouchAndLUT';
import { Module3AlbumRetouch } from '../modules/Module3AlbumRetouch';
import { Module4MicrositeBuilder } from '../modules/Module4MicrositeBuilder';
import { Module5PrintStoreDelivery } from '../modules/Module5PrintStoreDelivery';
import { Module6CRMExpenses } from '../modules/Module6CRMExpenses';
import { Module7BillingUPI } from '../modules/Module7BillingUPI';

interface NavItem {
  id: StudioModuleId;
  shortLabel: string;
  label: string;
  sublabel: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'lifecycle',
    shortLabel: 'Lifecycle',
    label: '6-Stage Event Lifecycle',
    sublabel: 'QR · C-to-C · Face Match · RAW',
    icon: Layers,
  },
  {
    id: 'culling',
    shortLabel: 'AI Cull',
    label: '01 · AI Photo Culling',
    sublabel: 'Sharp Picks · Blink & Blur',
    icon: Sparkles,
  },
  {
    id: 'retouch_lut',
    shortLabel: 'LUT Grade',
    label: '02 · LUT & Watermark',
    sublabel: '.CUBE Upload · Batch Match',
    icon: Palette,
  },
  {
    id: 'album_retouch',
    shortLabel: 'Retouch',
    label: '03 · Album AI Retouch',
    sublabel: 'Natural Skin · Hair · Glare',
    icon: Wand2,
  },
  {
    id: 'microsite_builder',
    shortLabel: 'Microsite',
    label: '04 · Event Microsite',
    sublabel: 'Slug · Maps · Schedule · Live',
    icon: Globe,
  },
  {
    id: 'print_store',
    shortLabel: 'Print Store',
    label: '05 · Gallery & Print Store',
    sublabel: 'PIN Gate · Frames · Profit',
    icon: Frame,
  },
  {
    id: 'crm_expenses',
    shortLabel: 'CRM & P&L',
    label: '06 · CRM, Team & Expenses',
    sublabel: 'Leads · Crew · Net Profit',
    icon: Users,
  },
  {
    id: 'billing_upi',
    shortLabel: 'Billing',
    label: '07 · Billing & UPI QR',
    sublabel: 'Quotes · GST · Instant UPI',
    icon: Receipt,
  },
];

export const StudioCommandWorkspace: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setViewMode,
    openMicrositeBySlug,
    firebaseUser,
    storageStatus,
    connectGoogleCloudSync,
    disconnectGoogleCloudSync,
    activeModule,
    setActiveModule,
    microsite,
    netProfitInr,
  } = usePixelFotos();

  const [collapsed, setCollapsed] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleCloudSyncClick = async () => {
    setSyncBusy(true);
    setSyncError(null);
    try {
      if (firebaseUser) {
        await disconnectGoogleCloudSync();
      } else {
        await connectGoogleCloudSync();
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Google sign-in unavailable.');
    } finally {
      setSyncBusy(false);
    }
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === activeModule) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#090B10] text-zinc-900 dark:text-white flex">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0D1017] transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('landing')}
            className="flex items-center gap-2.5 text-left cursor-pointer min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#090B10] flex items-center justify-center shrink-0">
              <Aperture className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
                  PixelFotos
                </p>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
                  Studio OS
                </p>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                  active
                    ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-zinc-900 dark:text-white'
                    : 'border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#B58E24] dark:text-[#D4AF37]' : 'text-zinc-400'
                  }`}
                />
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{item.label}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate">
                      {item.sublabel}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-zinc-200 dark:border-white/10 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
              Active Event Profit
            </p>
            <p className="text-lg font-mono font-semibold text-[#10B981] tabular-nums">
              ₹{netProfitInr.toLocaleString('en-IN')}
            </p>
            <button
              type="button"
              onClick={() => openMicrositeBySlug(microsite.slug)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Client Portal Preview
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0">
        {/* Top Command Header */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-zinc-200 dark:border-white/10 bg-[#FAF9F6]/90 dark:bg-[#090B10]/90 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className="md:hidden w-8 h-8 rounded-lg bg-[#D4AF37] text-[#090B10] flex items-center justify-center shrink-0"
              aria-label="Back to showcase"
            >
              <Aperture className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 truncate">
                {microsite.coupleOrHostName} · pixelfotos.online/{microsite.slug}
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                {activeNav.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCloudSyncClick}
              disabled={syncBusy}
              title={
                syncError ||
                (firebaseUser
                  ? `Signed in as ${firebaseUser.email || 'Studio Owner'} · Click to disconnect Cloud Sync`
                  : 'Persisted locally in IndexedDB · Click to sync across devices with Google Firestore')
              }
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer whitespace-nowrap ${
                storageStatus === 'firestore_synced'
                  ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
                  : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37]'
              }`}
            >
              {storageStatus === 'firestore_synced' ? (
                <Cloud className="w-3.5 h-3.5" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-[#D4AF37]" />
              )}
              {syncBusy
                ? 'Connecting...'
                : storageStatus === 'firestore_synced'
                ? 'Firestore Synced'
                : 'Cloud Sync'}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Dark or Light Mode"
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37] cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => openMicrositeBySlug(microsite.slug)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#B58E24] dark:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              View Client Microsite
            </button>

            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className="px-3.5 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37] cursor-pointer whitespace-nowrap"
            >
              Showcase
            </button>
          </div>
        </header>

        {/* Active Module Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
          {activeModule === 'lifecycle' && <EventLifecycleWorkflow />}
          {activeModule === 'culling' && <Module1AICulling />}
          {activeModule === 'retouch_lut' && <Module2RetouchAndLUT />}
          {activeModule === 'album_retouch' && <Module3AlbumRetouch />}
          {activeModule === 'microsite_builder' && <Module4MicrositeBuilder />}
          {activeModule === 'print_store' && <Module5PrintStoreDelivery />}
          {activeModule === 'crm_expenses' && <Module6CRMExpenses />}
          {activeModule === 'billing_upi' && <Module7BillingUPI />}
        </main>
      </div>

      {/* Compact Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#090B10]/95 backdrop-blur-md flex items-center overflow-x-auto px-2 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveModule(item.id)}
              className={`flex flex-col items-center justify-center min-w-[68px] h-12 px-2 rounded-xl text-[10px] font-medium shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#D4AF37]/15 text-[#B58E24] dark:text-[#D4AF37]'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[64px]">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
