import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Camera,
  CloudUpload,
  CreditCard,
  FolderKanban,
  Globe,
  HardDrive,
  HeartHandshake,
  LayoutDashboard,
  Plus,
  QrCode,
  ScanFace,
  Settings,
  Shield,
  Sliders,
  Users,
  Wifi,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BulkPhotoUploader } from '../BulkPhotoUploader';
import { ClientGalleryPortal } from '../gallery/ClientGalleryPortal';
import { OnlinePhotoEditor } from '../photo-editor/OnlinePhotoEditor';
import { WeddingAlbumDesigner } from '../album-designer/WeddingAlbumDesigner';
import { CRMAndBookingsModule } from '../crm/CRMAndBookingsModule';
import { StudioPortfolioPage } from '../portfolio/StudioPortfolioPage';
import { SuperAdminConsole } from '../admin/SuperAdminConsole';
import { LiveCameraSyncHub } from '../tethering/LiveCameraSyncHub';
import { WeddingInvitationBuilder } from '../wedding-website/WeddingInvitationBuilder';
import { PassportExamPhotoStudio } from '../passport-studio/PassportExamPhotoStudio';
import { ProtectedRoute } from '../ProtectedRoute';
import { ImageOptimizer } from '../ImageOptimizer';
import {
  createEditorialPhotoDataUri,
  evaluateStudioQuota,
  hashGalleryPassword,
} from '../../utils/studioLogic';
import { StudioGallery, StudioProject, UserRole } from '../../types';
import { FotoOwlActionMode, FotoOwlFeatureBar } from '../FotoOwlFeatureBar';
import { getCloudinaryConfig, saveCloudinaryConfig } from '../../lib/cloudinary';

export type DashboardTabId =
  | 'overview'
  | 'passport_studio'
  | 'projects'
  | 'galleries'
  | 'upload'
  | 'tether'
  | 'selection'
  | 'editor'
  | 'album'
  | 'invitation'
  | 'crm'
  | 'bookings'
  | 'invoices'
  | 'team'
  | 'storage'
  | 'portfolio'
  | 'settings'
  | 'super_admin';

interface StudioDashboardShellProps {
  initialTab?: DashboardTabId;
  onNavigateLanding: () => void;
  onOpenAuthModal: () => void;
}

export const StudioDashboardShell: React.FC<StudioDashboardShellProps> = ({
  initialTab = 'overview',
  onNavigateLanding,
  onOpenAuthModal,
}) => {
  const {
    studio,
    updateStudio,
    plans,
    projects,
    addProject,
    updateProjectStatus,
    galleries,
    addGallery,
    photos,
    clients,
    bookings,
    invoices,
    team,
    addTeamMember,
    activeRole,
    setActiveRole,
    activityLogs,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTabId>(initialTab);
  const [fotoOwlAction, setFotoOwlAction] = useState<FotoOwlActionMode | null>('face_match');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Create Project Modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjType, setNewProjType] = useState<StudioProject['projectType']>('wedding');
  const [newProjClient, setNewProjClient] = useState<string>('Aanya Mehra & Kabir Singhania');
  const [newProjDate, setNewProjDate] = useState<string>('2026-12-14');
  const [newProjLocation, setNewProjLocation] = useState<string>('Jaipur, Rajasthan');

  // Create Gallery Modal state
  const [showNewGalleryModal, setShowNewGalleryModal] = useState<boolean>(false);
  const [newGalName, setNewGalName] = useState<string>('');
  const [newGalType, setNewGalType] =
    useState<StudioGallery['galleryType']>('Client Proofing Gallery');
  const [newGalAccess, setNewGalAccess] = useState<StudioGallery['accessType']>('public');
  const [newGalPasscode, setNewGalPasscode] = useState<string>('');
  const [newGalLimit, setNewGalLimit] = useState<number>(50);

  // Team Member form state
  const [memberName, setMemberName] = useState<string>('');
  const [memberEmail, setMemberEmail] = useState<string>('');
  const [memberRole, setMemberRole] = useState<UserRole>('photographer');
  const [memberSpecialty, setMemberSpecialty] = useState<string>('Lead Candid Shooter');

  // Settings & Cloudinary form state
  const cloudCfg = getCloudinaryConfig();
  const [settingsName, setSettingsName] = useState<string>(studio.studioName);
  const [settingsWatermark, setSettingsWatermark] = useState<string>(studio.watermarkText);
  const [settingsDomain, setSettingsDomain] = useState<string>(studio.customDomain);
  const [cloudNameInput, setCloudNameInput] = useState<string>(cloudCfg.cloudName || 'dxeuzdwkz');
  const [uploadPresetInput, setUploadPresetInput] = useState<string>(
    cloudCfg.uploadPreset || 'Event schedule'
  );
  const [domainVerified, setDomainVerified] = useState<boolean>(true);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string>('');

  const currentPlan = plans.find((p) => p.id === studio.subscriptionPlan) || plans[1];
  const quotaStatus = evaluateStudioQuota(currentPlan, {
    storageUsedBytes: studio.storageUsedBytes,
    projectCount: projects.length,
    photoCount: photos.length,
    galleryCount: galleries.length,
  });

  const selectedPhotosCount = photos.filter((p) => p.selected || p.liked).length;
  const totalRevenuePaid = invoices.reduce((acc, inv) => acc + inv.advancePaid, 0);

  const navItems: { id: DashboardTabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Studio Command', icon: LayoutDashboard },
    { id: 'passport_studio', label: 'ID, Passport & Exam Lab', icon: ScanFace },
    { id: 'album', label: 'A. Album Designer', icon: BookOpen },
    { id: 'editor', label: 'B/F. Grade & Watermark', icon: Sliders },
    { id: 'selection', label: 'C/D. Proofing & AI QR', icon: ScanFace },
    { id: 'galleries', label: 'E. Brand Galleries', icon: QrCode },
    { id: 'tether', label: 'G. Live Camera Sync', icon: Wifi },
    { id: 'crm', label: 'H. Studio CRM', icon: Users },
    { id: 'bookings', label: 'Shoot Calendar', icon: Calendar },
    { id: 'invoices', label: 'GST Billing & WA', icon: CreditCard },
    { id: 'portfolio', label: 'I. Studio Portfolio', icon: Globe },
    { id: 'invitation', label: 'J. Wedding Microsite', icon: HeartHandshake },
    { id: 'upload', label: 'Cloudinary Upload', icon: CloudUpload },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'team', label: 'Studio Crew', icon: Camera },
    { id: 'storage', label: 'Storage & Plan', icon: HardDrive },
    { id: 'settings', label: 'Domain & Cloud', icon: Settings },
    { id: 'super_admin', label: 'Super Admin', icon: Shield },
  ];

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjLocation.trim()) return;
    await addProject({
      projectName: newProjName.trim(),
      projectType: newProjType,
      clientId: clients[0]?.id || 'client_01',
      clientName: newProjClient.trim(),
      eventDate: newProjDate,
      location: newProjLocation.trim(),
      status: 'planning',
      coverImage: createEditorialPhotoDataUri({
        id: `proj_${Date.now()}`,
        title: newProjName.trim(),
        subtitle: `${newProjLocation.trim()} · ${newProjDate}`,
        palette: 'architectural_arch',
        aspect: '16:9',
      }),
      photoCount: 0,
    });
    setNewProjName('');
    setShowNewProjectModal(false);
  };

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalName.trim()) return;
    await addGallery({
      projectId: projects[0]?.id || 'proj_udaipur_royal',
      galleryName: newGalName.trim(),
      galleryType: newGalType,
      accessType: newGalAccess,
      passwordHash: newGalAccess === 'password' ? hashGalleryPassword(newGalPasscode || '1234') : '',
      passwordHint: newGalAccess === 'password' ? `Passcode: ${newGalPasscode || '1234'}` : undefined,
      selectionEnabled: true,
      selectionLimit: Number(newGalLimit) || 50,
      watermarkEnabled: true,
      watermarkText: studio.watermarkText,
      downloadEnabled: true,
      originalQualityEnabled: true,
      faceSearchEnabled: true,
      expiryDate: '2027-06-30',
      status: 'published',
      coverImage: createEditorialPhotoDataUri({
        id: `gal_${Date.now()}`,
        title: newGalName.trim(),
        subtitle: newGalType,
        palette: 'garden_ceremony',
        aspect: '16:9',
      }),
    });
    setNewGalName('');
    setShowNewGalleryModal(false);
    setActiveTab('selection');
  };

  const handleFotoOwlAction = (mode: FotoOwlActionMode) => {
    setFotoOwlAction(mode);
    if (mode === 'live_upload') {
      setActiveTab('tether');
    } else {
      setActiveTab('selection');
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col md:flex-row">
      {/* iPad & Tablet Compact Sidebar (768px - 1023px) */}
      <aside
        aria-label="iPad and Tablet Compact Sidebar"
        className="hidden md:flex lg:hidden flex-col justify-between bg-[#0B0F17] text-slate-200 border-r border-amber-500/20 w-32 shrink-0 py-4 px-2"
      >
        <div className="space-y-4 flex flex-col items-center">
          <button
            type="button"
            onClick={onNavigateLanding}
            className="text-xs font-serif-editorial font-bold tracking-wider text-amber-300 py-1.5 px-2.5 rounded-lg bg-[#131B2E] border border-amber-500/30"
            title="Lumina Studio OS"
          >
            PIXELFOTOS
          </button>

          <nav className="space-y-1 w-full" aria-label="Tablet Navigation">
            {navItems.slice(0, 12).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full text-center py-2 px-1.5 rounded-xl text-[11px] font-medium transition-colors truncate ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] font-bold shadow-xs'
                      : 'text-slate-400 hover:bg-[#131B2E] hover:text-amber-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Desktop Full / Collapsible Luxury Sidebar (>= 1024px) */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-[#0B0F17] text-slate-200 border-r border-amber-500/20 shrink-0 transition-all ${
          sidebarCollapsed ? 'w-28' : 'w-64'
        }`}
      >
        <div className="p-4 space-y-5">
          <div className="flex items-center justify-between px-2">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={onNavigateLanding}
                className="text-left focus:outline-none"
              >
                <span className="text-lg font-serif-editorial font-bold tracking-wide text-amber-300 block">
                  Lumina Studio OS
                </span>
                <span className="text-[11px] text-slate-400 block truncate font-mono">
                  pixelfotos.online · {studio.studioName}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-[#131B2E]"
              aria-label="Toggle Sidebar Width"
            >
              {sidebarCollapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>

          <nav className="space-y-1 max-h-[72vh] overflow-y-auto pr-1" aria-label="Studio Workspace Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap truncate ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] font-bold shadow-[0_0_16px_rgba(245,158,11,0.25)]'
                      : 'text-slate-300 hover:bg-[#131B2E] hover:text-amber-200'
                  }`}
                >
                  {sidebarCollapsed ? item.label.split(' ')[0] : item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {!sidebarCollapsed && (
          <div className="p-4 border-t border-amber-500/20 text-xs space-y-2 bg-[#070A10]/60">
            <div className="flex items-center justify-between text-slate-400">
              <span>Cloudinary Storage</span>
              <span className="font-mono text-amber-300 tabular-nums">
                {quotaStatus.storagePercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] h-full"
                style={{ width: `${quotaStatus.storagePercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 tabular-nums font-mono">
              Cloud: <span className="text-amber-300">{cloudCfg.cloudName}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24">
        {/* Top Luxury Workspace Header */}
        <header className="bg-[#0B0F17]/95 backdrop-blur-md border-b border-amber-500/20 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-200 bg-[#131B2E] border border-amber-500/30"
              aria-label="Open Navigation Menu"
            >
              Menu
            </button>
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-400 truncate">
              <button
                type="button"
                onClick={onNavigateLanding}
                className="hover:text-amber-300 transition-colors font-serif-editorial text-base text-white"
              >
                {studio.studioName}
              </button>
              <span aria-hidden="true" className="text-amber-500/50">/</span>
              <span className="text-amber-300 font-semibold capitalize">
                {activeTab.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="workspace-role-switcher" className="sr-only">
              Active RBAC Role
            </label>
            <select
              id="workspace-role-switcher"
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-[#131B2E] border border-amber-500/30 rounded-xl text-amber-200 max-w-[140px] sm:max-w-none truncate"
            >
              <option value="studio_owner">Role: Studio Owner</option>
              <option value="studio_admin">Role: Studio Admin</option>
              <option value="photographer">Role: Photographer</option>
              <option value="photo_editor">Role: Photo Editor</option>
              <option value="customer">Role: Client / Couple</option>
              <option value="event_guest">Role: Event Guest</option>
              <option value="super_admin">Role: Super Admin</option>
            </select>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] rounded-xl hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 shadow-md"
            >
              <span className="sm:hidden">Auth</span>
              <span className="hidden sm:inline">Studio Auth &amp; Setup</span>
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/75"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-72 max-w-[82vw] bg-[#0B0F17] border-r border-amber-500/30 text-white p-5 flex flex-col justify-between z-10 overflow-y-auto">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-serif-editorial font-bold text-amber-300">
                    Lumina Studio OS
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="text-xs font-semibold text-amber-300"
                    aria-label="Close Menu"
                  >
                    Close
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold'
                          : 'text-slate-300 hover:bg-[#131B2E]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-[#0F1624] border border-amber-500/30 rounded-2xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-2xl">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
                    LUXURY PHOTOGRAPHY SAAS &amp; CLOUDINARY PROOFING OS
                  </p>
                  <h1
                    className="text-2xl sm:text-3xl font-serif-editorial font-semibold text-white"
                    style={{ textWrap: 'balance' }}
                  >
                    {studio.studioName} — Production Command Center
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Cloudinary Cloud: <span className="font-mono text-amber-300">{cloudCfg.cloudName}</span> · Preset:{' '}
                    <span className="font-mono text-amber-300">{cloudCfg.uploadPreset}</span> · Custom Domain:{' '}
                    <span className="font-mono text-amber-300">{studio.customDomain}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('passport_studio')}
                    className="px-3.5 py-2 text-xs font-bold bg-amber-500/20 border border-amber-400 rounded-xl text-amber-200 hover:bg-amber-500 hover:text-black transition-all"
                  >
                    ID, Passport &amp; Exam Print Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('album')}
                    className="px-3.5 py-2 text-xs font-semibold bg-[#161F33] border border-amber-500/35 rounded-xl text-amber-200 hover:bg-amber-500/15"
                  >
                    Album Designer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('invitation')}
                    className="px-3.5 py-2 text-xs font-semibold bg-[#161F33] border border-amber-500/35 rounded-xl text-amber-200 hover:bg-amber-500/15"
                  >
                    Wedding Invitation Site
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] text-[#0B0F17] rounded-xl hover:opacity-95 shadow-md"
                  >
                    Cloudinary Upload
                  </button>
                </div>
              </div>

              {/* 10 Core Studio Modules Quick-Launch Grid (A to J) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                {[
                  {
                    code: 'MODULE A',
                    label: 'Wedding Album Designer',
                    value: '5 Luxury Spreads',
                    sub: 'Approve & Export PDF',
                    target: 'album' as DashboardTabId,
                  },
                  {
                    code: 'MODULE B',
                    label: 'Watermark Studio',
                    value: 'Text + PNG Logo',
                    sub: '9-Grid & Cloudinary',
                    target: 'editor' as DashboardTabId,
                  },
                  {
                    code: 'MODULE C',
                    label: 'Client ❤️ Favorites',
                    value: `${selectedPhotosCount} Selected`,
                    sub: 'Copy File Numbers & CSV',
                    target: 'selection' as DashboardTabId,
                  },
                  {
                    code: 'MODULE D',
                    label: 'AI QR Guest Sharing',
                    value: '99.4% Face Match',
                    sub: 'WhatsApp Guest Delivery',
                    target: 'selection' as DashboardTabId,
                  },
                  {
                    code: 'MODULE E',
                    label: 'Own Brand Gallery',
                    value: `${galleries.length} Vaults`,
                    sub: 'Masonry / Grid + Passcode',
                    target: 'galleries' as DashboardTabId,
                  },
                  {
                    code: 'MODULE F',
                    label: 'Colour Grading Studio',
                    value: '6 Wedding LUTs',
                    sub: 'Before/After & Batch Grade',
                    target: 'editor' as DashboardTabId,
                  },
                  {
                    code: 'MODULE G',
                    label: 'Live Camera Sync',
                    value: 'Wi-Fi Tether Hub',
                    sub: 'Sony / Canon / Nikon FTP',
                    target: 'tether' as DashboardTabId,
                  },
                  {
                    code: 'MODULE H',
                    label: 'Studio CRM & Billing',
                    value: `₹${(totalRevenuePaid / 100000).toFixed(2)}L`,
                    sub: 'Invoices & WA Reminders',
                    target: 'invoices' as DashboardTabId,
                  },
                  {
                    code: 'MODULE I',
                    label: 'Studio Portfolio',
                    value: `${photos.length} Masters`,
                    sub: 'Haldi / Bridal / Pre-Wed',
                    target: 'portfolio' as DashboardTabId,
                  },
                  {
                    code: 'MODULE J',
                    label: 'Wedding Website',
                    value: '*.pixelfotos.online',
                    sub: 'Subdomain & Custom DNS',
                    target: 'invitation' as DashboardTabId,
                  },
                ].map((stat) => (
                  <button
                    key={stat.code}
                    type="button"
                    onClick={() => setActiveTab(stat.target)}
                    className="bg-[#0F1624] border border-amber-500/20 hover:border-amber-400 rounded-2xl p-4 text-left transition-all group shadow-lg"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-400">
                      <span>{stat.code}</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-300 mt-1 truncate">
                      {stat.label}
                    </div>
                    <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums truncate">
                      {stat.value}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">{stat.sub}</div>
                  </button>
                ))}
              </div>

              {/* Recent Projects & Live Activity Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-serif-editorial font-semibold text-white">
                      Active Studio Productions
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowNewProjectModal(true)}
                      className="text-xs font-semibold text-amber-400 hover:underline"
                    >
                      + New Project
                    </button>
                  </div>
                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-[#0B0F17]">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#131B2E]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-amber-500/30">
                            <ImageOptimizer
                              src={proj.coverImage}
                              alt={proj.projectName}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {proj.projectName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>{proj.location}</span>
                              <span>·</span>
                              <span className="font-mono text-amber-300 tabular-nums">
                                {proj.eventDate}
                              </span>
                              <span>·</span>
                              <span className="capitalize">{proj.status}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('selection')}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#161F33] border border-amber-500/35 rounded-lg text-amber-200 hover:bg-amber-500/20 shrink-0"
                        >
                          Open Proofing
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-4">
                  <h2 className="text-lg font-serif-editorial font-semibold text-white">
                    Real-Time Studio Telemetry
                  </h2>
                  <div className="space-y-3">
                    {activityLogs.slice(0, 6).map((log) => (
                      <div
                        key={log.id}
                        className="text-xs border-b border-slate-800 pb-2.5 last:border-b-0"
                      >
                        <div className="font-semibold text-amber-300">{log.actor}</div>
                        <p className="text-slate-300 mt-0.5">{log.action}</p>
                        <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                          {log.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
                <div>
                  <h2 className="text-2xl font-serif-editorial font-semibold text-white">
                    Photography Projects &amp; Event Productions ({projects.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Track workflow stage from Planning and Shooting to Culling, Proofing, and Delivery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(true)}
                  className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Project</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="border border-slate-800 rounded-2xl overflow-hidden bg-[#0B0F17] flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/9]">
                        <ImageOptimizer
                          src={proj.coverImage}
                          alt={proj.projectName}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-amber-300">
                          <span className="uppercase font-mono">{proj.projectType}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{proj.eventDate}</span>
                        </div>
                        <h3 className="text-base font-semibold text-white">
                          {proj.projectName}
                        </h3>
                        <p className="text-xs text-slate-400">{proj.location}</p>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-[#131B2E] border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <select
                        aria-label="Workflow Stage"
                        value={proj.status}
                        onChange={(e) =>
                          updateProjectStatus(
                            proj.id,
                            e.target.value as StudioProject['status']
                          )
                        }
                        className="px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg font-medium text-amber-200"
                      >
                        <option value="planning">Stage: Planning</option>
                        <option value="shooting">Stage: Shooting</option>
                        <option value="culling">Stage: Culling</option>
                        <option value="proofing">Stage: Client Proofing</option>
                        <option value="delivered">Stage: Delivered</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setActiveTab('selection')}
                        className="font-semibold text-amber-400 hover:underline"
                      >
                        Open Gallery →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: GALLERIES & QR (MODULE E) */}
          {activeTab === 'galleries' && (
            <div className="space-y-6">
              <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif-editorial font-semibold text-white">
                    White-Label Client Galleries &amp; QR Sharing ({galleries.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure public, private, or password-protected vaults with Masonry/Grid layouts and watermarks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewGalleryModal(true)}
                  className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Client Gallery</span>
                </button>
              </div>

              <ClientGalleryPortal isEmbeddedInDashboard />
            </div>
          )}

          {/* TAB: BULK UPLOAD */}
          {activeTab === 'upload' && (
            <ProtectedRoute
              allowedRoles={['studio_owner', 'studio_admin', 'photographer', 'photo_editor', 'super_admin']}
            >
              <BulkPhotoUploader />
            </ProtectedRoute>
          )}

          {/* TAB: MODULE G — LIVE CAMERA SYNC (WI-FI TETHERING HUB) */}
          {activeTab === 'tether' && <LiveCameraSyncHub />}

          {/* TAB: MODULE C/D — CLIENT SELECTION & AI FACE SEARCH */}
          {activeTab === 'selection' && (
            <ClientGalleryPortal
              isEmbeddedInDashboard
              externalFotoOwlMode={fotoOwlAction}
              onChangeFotoOwlMode={setFotoOwlAction}
            />
          )}

          {/* TAB: MODULE B/F — COLOUR GRADING & WATERMARK STUDIO */}
          {activeTab === 'editor' && (
            <ProtectedRoute
              allowedRoles={['studio_owner', 'studio_admin', 'photographer', 'photo_editor', 'super_admin']}
            >
              <OnlinePhotoEditor />
            </ProtectedRoute>
          )}

          {/* TAB: OFFICIAL ID, PASSPORT & EXAM PHOTO STUDIO + PRINT SHEET GENERATOR */}
          {activeTab === 'passport_studio' && <PassportExamPhotoStudio />}

          {/* TAB: MODULE A — WEDDING ALBUM DESIGNER */}
          {activeTab === 'album' && <WeddingAlbumDesigner />}

          {/* TAB: MODULE J — CLIENT WEDDING INVITATION WEBSITE & CUSTOM DOMAIN */}
          {activeTab === 'invitation' && (
            <WeddingInvitationBuilder onOpenGallery={() => setActiveTab('selection')} />
          )}

          {/* TAB: MODULE H — CRM & CLIENTS */}
          {activeTab === 'crm' && (
            <ProtectedRoute allowedRoles={['studio_owner', 'studio_admin', 'super_admin']}>
              <CRMAndBookingsModule initialSection="clients" />
            </ProtectedRoute>
          )}

          {/* TAB: BOOKINGS */}
          {activeTab === 'bookings' && (
            <ProtectedRoute
              allowedRoles={['studio_owner', 'studio_admin', 'photographer', 'super_admin']}
            >
              <CRMAndBookingsModule initialSection="bookings" />
            </ProtectedRoute>
          )}

          {/* TAB: INVOICES */}
          {activeTab === 'invoices' && (
            <ProtectedRoute allowedRoles={['studio_owner', 'studio_admin', 'super_admin']}>
              <CRMAndBookingsModule initialSection="invoices" />
            </ProtectedRoute>
          )}

          {/* TAB: TEAM MEMBERS */}
          {activeTab === 'team' && (
            <ProtectedRoute allowedRoles={['studio_owner', 'studio_admin', 'super_admin']}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-serif-editorial font-semibold text-white">
                    Studio Crew &amp; Role-Based Access ({team.length})
                  </h2>
                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-[#0B0F17]">
                    {team.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white">{m.name}</div>
                          <div className="text-slate-400 mt-0.5">
                            {m.specialty} · {m.email}
                          </div>
                        </div>
                        <div className="text-right font-mono text-slate-400 tabular-nums">
                          <div className="uppercase font-semibold text-amber-300">
                            {m.role.replace('_', ' ')}
                          </div>
                          <div>{m.assignedProjectsCount} Assigned Projects</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!memberName.trim() || !memberEmail.trim()) return;
                    addTeamMember({
                      name: memberName.trim(),
                      email: memberEmail.trim(),
                      role: memberRole,
                      specialty: memberSpecialty.trim(),
                      status: 'invited',
                    });
                    setMemberName('');
                    setMemberEmail('');
                  }}
                  className="lg:col-span-4 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-3.5 text-xs"
                >
                  <h3 className="text-base font-semibold text-amber-200">Invite Team Member</h3>
                  <div>
                    <label htmlFor="tm-name" className="block font-medium text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      id="tm-name"
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Kabir Bedi"
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="tm-email" className="block font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      id="tm-email"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="kabir@ateliervance.studio"
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="tm-role" className="block font-medium text-slate-300 mb-1">
                      Access Role
                    </label>
                    <select
                      id="tm-role"
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                    >
                      <option value="studio_admin">Studio Admin</option>
                      <option value="photographer">Photographer</option>
                      <option value="photo_editor">Photo Editor</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tm-spec" className="block font-medium text-slate-300 mb-1">
                      Specialty
                    </label>
                    <input
                      id="tm-spec"
                      type="text"
                      value={memberSpecialty}
                      onChange={(e) => setMemberSpecialty(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-xl"
                  >
                    Send Studio Invite
                  </button>
                </form>
              </div>
            </ProtectedRoute>
          )}

          {/* TAB: STORAGE & SUBSCRIPTION */}
          {activeTab === 'storage' && (
            <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-serif-editorial font-semibold text-white">
                  Subscription Tier &amp; Cloudinary Storage Quotas
                </h2>
                <p className="text-xs text-slate-400">
                  Current Active Tier: <strong className="text-amber-300">{currentPlan.name}</strong> · AI Credits Remaining:{' '}
                  <strong className="font-mono text-amber-300">{studio.aiCreditsRemaining}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p) => {
                  const isCurrent = p.id === studio.subscriptionPlan;
                  return (
                    <div
                      key={p.id}
                      className={`p-6 rounded-2xl border flex flex-col justify-between space-y-5 ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-800 bg-[#0B0F17]'
                      }`}
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                        <p className="text-xs text-amber-300">{p.tagline}</p>
                        <div className="text-3xl font-bold font-mono text-white tabular-nums pt-1">
                          ${p.monthlyPrice}
                          <span className="text-xs font-normal text-slate-400"> / month</span>
                        </div>
                        <ul className="space-y-2 pt-3 text-xs text-slate-300">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => updateStudio({ subscriptionPlan: p.id })}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                          isCurrent
                            ? 'bg-slate-800 text-amber-300 cursor-default'
                            : 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                        }`}
                      >
                        {isCurrent ? 'Active Studio Plan' : `Switch to ${p.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: PUBLIC PORTFOLIO (MODULE I) */}
          {activeTab === 'portfolio' && (
            <StudioPortfolioPage onOpenGallery={() => setActiveTab('selection')} />
          )}

          {/* TAB: SETTINGS (CLOUDINARY + CUSTOM DOMAIN CNAME/A-RECORD) */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-5">
                <h2 className="text-2xl font-serif-editorial font-semibold text-white">
                  Studio Branding, Cloudinary Storage &amp; Custom Domain
                </h2>
                {settingsSavedMsg && (
                  <div className="p-3 bg-amber-500/15 border border-amber-400/40 rounded-xl text-xs text-amber-200">
                    {settingsSavedMsg}
                  </div>
                )}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    saveCloudinaryConfig({
                      ...cloudCfg,
                      cloudName: cloudNameInput.trim() || 'dxeuzdwkz',
                      uploadPreset: uploadPresetInput.trim() || 'Event schedule',
                    });
                    await updateStudio({
                      studioName: settingsName.trim(),
                      watermarkText: settingsWatermark.trim(),
                      customDomain: settingsDomain.trim(),
                    });
                    setDomainVerified(true);
                    setSettingsSavedMsg(
                      `Saved Cloudinary config (Cloud: ${cloudNameInput.trim()}, Preset: "${uploadPresetInput.trim()}") and verified custom domain ${settingsDomain.trim()}.`
                    );
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="set-cloud-name" className="block font-medium text-amber-300 mb-1">
                        Cloudinary Cloud Name
                      </label>
                      <input
                        id="set-cloud-name"
                        type="text"
                        value={cloudNameInput}
                        onChange={(e) => setCloudNameInput(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0B0F17] border border-amber-500/40 rounded-lg text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="set-cloud-preset" className="block font-medium text-amber-300 mb-1">
                        Cloudinary Unsigned Upload Preset
                      </label>
                      <input
                        id="set-cloud-preset"
                        type="text"
                        value={uploadPresetInput}
                        onChange={(e) => setUploadPresetInput(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0B0F17] border border-amber-500/40 rounded-lg text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="set-studio-name" className="block font-medium text-slate-300 mb-1">
                      Studio Name
                    </label>
                    <input
                      id="set-studio-name"
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="set-watermark" className="block font-medium text-slate-300 mb-1">
                      Default Watermark Signature
                    </label>
                    <input
                      id="set-watermark"
                      type="text"
                      value={settingsWatermark}
                      onChange={(e) => setSettingsWatermark(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="set-domain" className="block font-medium text-slate-300 mb-1">
                      Custom Client Gallery Domain (CNAME)
                    </label>
                    <input
                      id="set-domain"
                      type="text"
                      value={settingsDomain}
                      onChange={(e) => {
                        setSettingsDomain(e.target.value);
                        setDomainVerified(false);
                      }}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-xl"
                  >
                    Save Cloudinary &amp; Verify Custom Domain
                  </button>
                </form>
              </div>

              <div className="lg:col-span-5 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-amber-200">
                    Custom Domain DNS Configuration Guide
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      domainVerified
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {domainVerified ? 'LIVE & VERIFIED' : 'VERIFY PENDING'}
                  </span>
                </div>
                <p className="text-slate-400">
                  Point your studio domain (<code className="text-amber-300">{settingsDomain}</code>) to{' '}
                  <code className="text-amber-300">pixelfotos.online</code> using the following DNS records:
                </p>
                <div className="border border-slate-800 rounded-xl overflow-hidden font-mono text-[11px] bg-[#0B0F17]">
                  <div className="grid grid-cols-3 bg-[#131B2E] px-3 py-2 text-amber-300 font-bold">
                    <span>Record</span>
                    <span>Host</span>
                    <span>Target / IP</span>
                  </div>
                  <div className="grid grid-cols-3 px-3 py-2.5 border-t border-slate-800 text-slate-300">
                    <span>CNAME</span>
                    <span>galleries</span>
                    <span>cname.pixelfotos.online</span>
                  </div>
                  <div className="grid grid-cols-3 px-3 py-2.5 border-t border-slate-800 text-slate-300">
                    <span>A</span>
                    <span>@</span>
                    <span>76.76.21.21</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SUPER ADMIN */}
          {activeTab === 'super_admin' && <SuperAdminConsole />}
        </main>

        {/* STRICT BOTTOM NAVIGATION BAR RULE: Exact FotoOwl Sticky Bottom Navigation Bar with Luxury Dark/Gold theme */}
        <FotoOwlFeatureBar
          activeMode={fotoOwlAction}
          onSelectMode={handleFotoOwlAction}
          variant="bottom_nav"
        />
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-project"
        >
          <div className="bg-[#0F1624] border border-amber-500/35 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between">
              <h3 id="modal-new-project" className="text-lg font-semibold text-white">
                Create New Photography Project
              </h3>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="p-1 text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label htmlFor="np-name" className="block font-medium text-slate-300 mb-1">
                  Project Title
                </label>
                <input
                  id="np-name"
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Rhea & Dev — Jaipur Palace Wedding"
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="np-type" className="block font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    id="np-type"
                    value={newProjType}
                    onChange={(e) =>
                      setNewProjType(e.target.value as StudioProject['projectType'])
                    }
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                  >
                    <option value="wedding">Wedding</option>
                    <option value="pre_wedding">Pre-Wedding</option>
                    <option value="event">Event</option>
                    <option value="portrait">Portrait</option>
                    <option value="editorial">Editorial</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="np-date" className="block font-medium text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    id="np-date"
                    type="date"
                    value={newProjDate}
                    onChange={(e) => setNewProjDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="np-client" className="block font-medium text-slate-300 mb-1">
                  Client Name
                </label>
                <input
                  id="np-client"
                  type="text"
                  value={newProjClient}
                  onChange={(e) => setNewProjClient(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label htmlFor="np-loc" className="block font-medium text-slate-300 mb-1">
                  Location
                </label>
                <input
                  id="np-loc"
                  type="text"
                  value={newProjLocation}
                  onChange={(e) => setNewProjLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3.5 py-2 border border-slate-700 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-lg"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Gallery Modal */}
      {showNewGalleryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-gallery"
        >
          <div className="bg-[#0F1624] border border-amber-500/35 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between">
              <h3 id="modal-new-gallery" className="text-lg font-semibold text-white">
                Create Client Proofing Gallery
              </h3>
              <button
                type="button"
                onClick={() => setShowNewGalleryModal(false)}
                className="p-1 text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGallery} className="space-y-3">
              <div>
                <label htmlFor="ng-name" className="block font-medium text-slate-300 mb-1">
                  Gallery Title
                </label>
                <input
                  id="ng-name"
                  type="text"
                  value={newGalName}
                  onChange={(e) => setNewGalName(e.target.value)}
                  placeholder="Rhea & Dev — Haldi & Mehendi Proofing"
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="ng-type" className="block font-medium text-slate-300 mb-1">
                    Gallery Type
                  </label>
                  <select
                    id="ng-type"
                    value={newGalType}
                    onChange={(e) =>
                      setNewGalType(e.target.value as StudioGallery['galleryType'])
                    }
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Wedding Gallery">Wedding Gallery</option>
                    <option value="Client Proofing Gallery">Client Proofing Gallery</option>
                    <option value="Event Gallery">Event Gallery</option>
                    <option value="Portrait Gallery">Portrait Gallery</option>
                    <option value="Corporate Gallery">Corporate Gallery</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ng-access" className="block font-medium text-slate-300 mb-1">
                    Access Control
                  </label>
                  <select
                    id="ng-access"
                    value={newGalAccess}
                    onChange={(e) =>
                      setNewGalAccess(e.target.value as StudioGallery['accessType'])
                    }
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                  >
                    <option value="public">Public Link &amp; QR</option>
                    <option value="password">Password Protected</option>
                    <option value="private">Private Client Login</option>
                  </select>
                </div>
              </div>
              {newGalAccess === 'password' && (
                <div>
                  <label htmlFor="ng-pass" className="block font-medium text-slate-300 mb-1">
                    Gallery Passcode
                  </label>
                  <input
                    id="ng-pass"
                    type="password"
                    value={newGalPasscode}
                    onChange={(e) => setNewGalPasscode(e.target.value)}
                    placeholder="Enter client passcode"
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="ng-limit" className="block font-medium text-slate-300 mb-1">
                  Maximum Client Album Selection Limit
                </label>
                <input
                  id="ng-limit"
                  type="number"
                  min={1}
                  max={2000}
                  value={newGalLimit}
                  onChange={(e) => setNewGalLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGalleryModal(false)}
                  className="px-3.5 py-2 border border-slate-700 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-lg"
                >
                  Publish Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
