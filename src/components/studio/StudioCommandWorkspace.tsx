import React, { useEffect, useState } from 'react';
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
import { MobileBottomDock } from '../shared/MobileBottomDock';

interface NavItem {
  id: StudioModuleId;
  shortLabel: string;
  label: string;
  sublabel: string;
  group: 'ai' | 'events' | 'crm';
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'lifecycle',
    shortLabel: 'Lifecycle',
    label: '6-Stage Event Lifecycle',
    sublabel: 'QR · C-to-C · Face Match · RAW',
    group: 'events',
    icon: Layers,
  },
  {
    id: 'culling',
    shortLabel: 'AI Cull',
    label: '01 · Upload & AI Culling',
    sublabel: 'Drive Progress · Blur · ZIP',
    group: 'ai',
    icon: Sparkles,
  },
  {
    id: 'retouch_lut',
    shortLabel: 'LUT Grade',
    label: '02 · Kerala LUTs & Watermark',
    sublabel: 'Kerala .CUBE · Scale & Font',
    group: 'ai',
    icon: Palette,
  },
  {
    id: 'album_retouch',
    shortLabel: 'Retouch',
    label: '03 · 1-Click Album Retouch',
    sublabel: 'Bridal Presets · Split View',
    group: 'ai',
    icon: Wand2,
  },
  {
    id: 'microsite_builder',
    shortLabel: 'Microsite',
    label: '04 · Wedding Microsite',
    sublabel: 'Slug · Maps · Schedule · Live',
    group: 'events',
    icon: Globe,
  },
  {
    id: 'print_store',
    shortLabel: 'Print Store',
    label: '05 · Print Price Manager',
    sublabel: 'Edit Sizes · Frames · Profit',
    group: 'events',
    icon: Frame,
  },
  {
    id: 'crm_expenses',
    shortLabel: 'CRM & P&L',
    label: '06 · Team, Tasks & Expenses',
    sublabel: 'Simple Tasks · Expenses · P&L',
    group: 'crm',
    icon: Users,
  },
  {
    id: 'billing_upi',
    shortLabel: 'Billing',
    label: '07 · Simple Billing & UPI',
    sublabel: 'Standard UPI · QR · Client PDF',
    group: 'crm',
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

  // iPadOS defaults compact 76px rail (expandable to 240px), Desktop expands 260px sidebar cleanly
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [visualHeight, setVisualHeight] = useState<number | null>(null);

  // Sync mobile native 3-zone shell viewport with window.visualViewport
  useEffect(() => {
    const syncViewport = () => {
      if (window.innerWidth < 768 && window.visualViewport) {
        setVisualHeight(Math.round(window.visualViewport.height));
      } else {
        setVisualHeight(null);
      }
    };
    syncViewport();
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.addEventListener('resize', syncViewport);
    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.removeEventListener('resize', syncViewport);
    };
  }, []);

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
  const mobileGroupItems = NAV_ITEMS.filter((n) => n.group === activeNav.group);

  return (
    <div
      style={
        visualHeight
          ? { height: `${visualHeight}px`, maxHeight: `${visualHeight}px` }
          : undefined
      }
      className="h-[100dvh] max-h-[100dvh] overflow-hidden md:h-auto md:max-h-none md:min-h-screen md:overflow-visible liquid-canvas text-zinc-900 dark:text-[#F5F5F7] flex flex-col md:flex-row transition-colors"
    >
      {/* Floating Translucent Glass Sidebar Rail: iPadOS (76px/240px) & Desktop (260px/76px) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 sticky top-3 lg:top-4 h-[calc(100vh-24px)] lg:h-[calc(100vh-32px)] my-3 ml-3 lg:my-4 lg:ml-4 rounded-[24px] liquid-glass transition-all duration-200 z-30 ${
          tabletExpanded ? 'md:w-[240px]' : 'md:w-[76px]'
        } ${desktopCollapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'}`}
      >
        {/* Brand + Rail Toggle */}
        <div className="h-16 px-3.5 flex items-center justify-between border-b border-black/8 dark:border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('landing')}
            className="flex items-center gap-2.5 text-left cursor-pointer min-w-0"
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#D4AF37] text-[#090B10] flex items-center justify-center shrink-0 shadow-sm">
              <Aperture className="w-5 h-5" />
            </div>
            <div
              className={`min-w-0 ${tabletExpanded ? 'md:block' : 'md:hidden'} ${
                desktopCollapsed ? 'lg:hidden' : 'lg:block'
              }`}
            >
              <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
                PixelFotos
              </p>
              <p className="text-[11px] font-mono text-[#B58E24] dark:text-[#D4AF37] truncate">
                Studio OS
              </p>
            </div>
          </button>

          {/* Tablet collapse/expand button */}
          <button
            type="button"
            onClick={() => setTabletExpanded((v) => !v)}
            aria-label="Toggle iPad navigation rail"
            className="hidden md:flex lg:hidden w-8 h-8 rounded-xl liquid-glass-subtle items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer shrink-0"
          >
            {tabletExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Desktop collapse/expand button */}
          <button
            type="button"
            onClick={() => setDesktopCollapsed((v) => !v)}
            aria-label="Toggle desktop sidebar"
            className="hidden lg:flex w-8 h-8 rounded-xl liquid-glass-subtle items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer shrink-0"
          >
            {desktopCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                title={item.label}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-[14px] text-left transition cursor-pointer ${
                  active
                    ? 'bg-[#D4AF37]/18 border border-[#D4AF37]/45 text-zinc-900 dark:text-white shadow-xs'
                    : 'border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    active ? 'text-[#B58E24] dark:text-[#D4AF37]' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                />
                <div
                  className={`min-w-0 ${tabletExpanded ? 'md:block' : 'md:hidden'} ${
                    desktopCollapsed ? 'lg:hidden' : 'lg:block'
                  }`}
                >
                  <p className="text-xs font-semibold truncate">{item.label}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {item.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profit & Quick Microsite Preview Card */}
        <div
          className={`p-3.5 border-t border-black/8 dark:border-white/10 space-y-2.5 ${
            tabletExpanded ? 'md:block' : 'md:hidden'
          } ${desktopCollapsed ? 'lg:hidden' : 'lg:block'}`}
        >
          <div className="rounded-[16px] liquid-glass-subtle p-3">
            <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              Active Event Profit
            </p>
            <p className="text-lg font-mono font-semibold text-[#10B981] tabular-nums mt-0.5">
              ₹{netProfitInr.toLocaleString('en-IN')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openMicrositeBySlug(microsite.slug)}
            className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] hover:opacity-90 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Client Portal Preview
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden md:overflow-visible">
        {/* Compact Glass Top App Bar (56px on mobile Android shell; spacious 64px bar on iPad/Desktop) */}
        <header className="h-[56px] md:h-16 px-3.5 sm:px-6 liquid-glass-header md:mx-4 md:mt-3 lg:mt-4 md:rounded-[20px] md:border md:border-black/8 dark:md:border-white/12 flex items-center justify-between gap-2.5 shrink-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className="md:hidden min-w-[40px] min-h-[40px] rounded-xl bg-[#D4AF37] text-[#090B10] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Back to showcase"
            >
              <Aperture className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                {microsite.coupleOrHostName} · /{microsite.slug}
              </p>
              <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white truncate">
                {activeNav.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCloudSyncClick}
              disabled={syncBusy}
              title={
                syncError ||
                (firebaseUser
                  ? `Signed in as ${firebaseUser.email || 'Studio Owner'} · Click to disconnect Cloud Sync`
                  : 'Local IndexedDB · Click to connect Google Firestore Sync')
              }
              className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 rounded-full text-xs font-medium border transition cursor-pointer whitespace-nowrap ${
                storageStatus === 'firestore_synced'
                  ? 'border-[#10B981]/40 bg-[#10B981]/12 text-[#10B981]'
                  : 'liquid-glass-subtle text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37]/50'
              }`}
            >
              {storageStatus === 'firestore_synced' ? (
                <Cloud className="w-4 h-4" />
              ) : (
                <CloudOff className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span className="hidden lg:inline">
                {syncBusy
                  ? 'Connecting...'
                  : storageStatus === 'firestore_synced'
                  ? 'Firestore Synced'
                  : 'Cloud Sync'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Dark or Light Mode"
              className="min-w-[40px] min-h-[40px] rounded-full liquid-glass-subtle flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37]/50 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => openMicrositeBySlug(microsite.slug)}
              className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 px-4 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c59f2c] transition cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              View Client Microsite
            </button>

            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className="hidden md:inline-flex min-h-[40px] items-center px-3.5 rounded-full text-xs font-medium liquid-glass-subtle text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37]/50 cursor-pointer whitespace-nowrap"
            >
              Showcase
            </button>
          </div>
        </header>

        {/* Smooth App Momentum Scroll Body (pb-[120px] clears Floating Mobile Dock) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain md:overflow-visible px-3.5 pt-4 pb-[120px] md:pb-8 md:px-5 lg:px-7 max-w-7xl w-full mx-auto space-y-5">
          {/* Mobile Segmented Sub-Tab Bar for instant 1-thumb module switching inside current group */}
          {mobileGroupItems.length > 1 && (
            <div className="md:hidden flex items-center gap-1.5 p-1 rounded-[18px] liquid-glass-subtle overflow-x-auto">
              {mobileGroupItems.map((sub) => {
                const active = activeModule === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setActiveModule(sub.id)}
                    className={`flex-1 min-h-[40px] px-3 rounded-[14px] text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'bg-[#D4AF37] text-[#090B10] shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {sub.shortLabel}
                  </button>
                );
              })}
            </div>
          )}

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

      {/* Floating Glass Bottom Navigation Dock on Mobile (< 768px) */}
      <MobileBottomDock />
    </div>
  );
};
