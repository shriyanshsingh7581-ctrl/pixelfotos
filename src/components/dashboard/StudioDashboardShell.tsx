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
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  Plus,
  QrCode,
  ScanFace,
  Settings,
  Shield,
  Sliders,
  Users,
  X,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BulkPhotoUploader } from '../BulkPhotoUploader';
import { ClientGalleryPortal } from '../gallery/ClientGalleryPortal';
import { OnlinePhotoEditor } from '../photo-editor/OnlinePhotoEditor';
import { WeddingAlbumDesigner } from '../album-designer/WeddingAlbumDesigner';
import { CRMAndBookingsModule } from '../crm/CRMAndBookingsModule';
import { StudioPortfolioPage } from '../portfolio/StudioPortfolioPage';
import { SuperAdminConsole } from '../admin/SuperAdminConsole';
import { ProtectedRoute } from '../ProtectedRoute';
import { PWAInstallButton } from '../PWAInstallButton';
import { ImageOptimizer } from '../ImageOptimizer';
import {
  createEditorialPhotoDataUri,
  evaluateStudioQuota,
  hashGalleryPassword,
} from '../../utils/studioLogic';
import { StudioGallery, StudioProject, UserRole } from '../../types';
import { FotoOwlActionMode, FotoOwlFeatureBar } from '../FotoOwlFeatureBar';

export type DashboardTabId =
  | 'overview'
  | 'projects'
  | 'galleries'
  | 'upload'
  | 'selection'
  | 'editor'
  | 'album'
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

  // Settings form state
  const [settingsName, setSettingsName] = useState<string>(studio.studioName);
  const [settingsWatermark, setSettingsWatermark] = useState<string>(studio.watermarkText);
  const [settingsDomain, setSettingsDomain] = useState<string>(studio.customDomain);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string>('');

  const currentPlan = plans.find((p) => p.id === studio.subscriptionPlan) || plans[1];
  const quotaStatus = evaluateStudioQuota(currentPlan, {
    storageUsedBytes: studio.storageUsedBytes,
    projectCount: projects.length,
    photoCount: photos.length,
    galleryCount: galleries.length,
  });

  const selectedPhotosCount = photos.filter((p) => p.selected).length;
  const totalRevenuePaid = invoices.reduce((acc, inv) => acc + inv.advancePaid, 0);

  const navItems: { id: DashboardTabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'galleries', label: 'Galleries & QR', icon: QrCode },
    { id: 'upload', label: 'Bulk Upload', icon: CloudUpload },
    { id: 'selection', label: 'Client Proofing', icon: ScanFace },
    { id: 'editor', label: 'Online Editor', icon: Sliders },
    { id: 'album', label: 'Album Designer', icon: BookOpen },
    { id: 'crm', label: 'CRM & Clients', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'invoices', label: 'GST Billing', icon: CreditCard },
    { id: 'team', label: 'Studio Team', icon: Camera },
    { id: 'storage', label: 'Storage & Plan', icon: HardDrive },
    { id: 'portfolio', label: 'Public Portfolio', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
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
      setActiveTab('upload');
    } else {
      setActiveTab('selection');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* iPad & Tablet Compact Sidebar (768px - 1023px) */}
      <aside
        aria-label="iPad and Tablet Compact Sidebar"
        className="hidden md:flex lg:hidden flex-col justify-between bg-[#0F172A] text-slate-200 border-r border-slate-800 w-28 shrink-0 py-4 px-2"
      >
        <div className="space-y-5 flex flex-col items-center">
          <button
            type="button"
            onClick={onNavigateLanding}
            className="text-xs font-extrabold tracking-tight text-white py-1.5 px-2.5 rounded-lg bg-slate-800"
            title="FotoOwl Studio OS"
          >
            FotoOwl
          </button>

          <nav className="space-y-1.5 w-full" aria-label="Tablet Navigation">
            {navItems.slice(0, 10).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full text-center py-2 px-1.5 rounded-xl text-[11px] font-medium transition-colors truncate ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Desktop Full / Collapsible Sidebar (>= 1024px) */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-[#0F172A] text-slate-200 border-r border-slate-800 shrink-0 transition-all ${
          sidebarCollapsed ? 'w-28' : 'w-64'
        }`}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={onNavigateLanding}
                className="text-left focus:outline-none"
              >
                <span className="text-lg font-bold tracking-tight text-white block">
                  FotoOwl Studio OS
                </span>
                <span className="text-[11px] text-[#FF6A3D] block truncate">
                  {studio.studioName}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Sidebar Width"
            >
              {sidebarCollapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>

          <nav className="space-y-1" aria-label="Studio Workspace Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap truncate ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {sidebarCollapsed ? item.label.split(' ')[0] : item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Cloud Storage</span>
              <span className="font-mono text-white tabular-nums">
                {quotaStatus.storagePercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] h-full"
                style={{ width: `${quotaStatus.storagePercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 tabular-nums">
              {(studio.storageUsedBytes / 1024 / 1024 / 1024).toFixed(0)} GB of{' '}
              {currentPlan.storageLimitGB} GB ({currentPlan.name})
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24">
        {/* Top Workspace Header (Strict 3-Zone Contract) */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30">
          {/* Left Zone: Breadcrumb & Mobile Menu Trigger */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              aria-label="Open Navigation Menu"
            >
              Menu
            </button>
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-600 truncate">
              <button
                type="button"
                onClick={onNavigateLanding}
                className="hover:text-slate-900 transition-colors"
              >
                {studio.studioName}
              </button>
              <span aria-hidden="true">/</span>
              <span className="text-slate-900 font-semibold capitalize">
                {activeTab.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Right Zone: Role Switcher & Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="workspace-role-switcher" className="sr-only">
              Active RBAC Role
            </label>
            <select
              id="workspace-role-switcher"
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-slate-100 border border-slate-200 rounded-lg text-slate-800 max-w-[140px] sm:max-w-none truncate"
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
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white rounded-lg hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
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
              className="fixed inset-0 bg-slate-950/60"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-72 max-w-[82vw] bg-[#0F172A] text-white p-5 flex flex-col justify-between z-10 overflow-y-auto">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">FotoOwl Studio OS</span>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-white"
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
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white'
                          : 'text-slate-300 hover:bg-slate-800'
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
              {/* Welcome & Quick Action Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h1
                    className="text-2xl font-semibold text-slate-900"
                    style={{ textWrap: 'balance' }}
                  >
                    {studio.studioName} — Production Command Center
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time studio telemetry · Plan: {currentPlan.name} · Custom Domain:{' '}
                    <span className="font-mono text-slate-700">{studio.customDomain}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(true)}
                    className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-50"
                  >
                    New Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewGalleryModal(true)}
                    className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-50"
                  >
                    Create Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF851B] via-[#FF385C] to-[#E61575] text-white rounded-lg hover:opacity-95"
                  >
                    Bulk Upload Photos
                  </button>
                </div>
              </div>

              {/* 8 Actionable Studio KPI Cards (Clean Text — No Icons) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total Projects',
                    value: String(projects.length),
                    sub: `${projects.filter((p) => p.status === 'proofing').length} in client proofing`,
                    target: 'projects' as DashboardTabId,
                  },
                  {
                    label: 'Active Galleries',
                    value: String(galleries.length),
                    sub: `${galleries.reduce((a, g) => a + g.viewCount, 0)} total gallery views`,
                    target: 'galleries' as DashboardTabId,
                  },
                  {
                    label: 'Indexed Photos',
                    value: String(photos.length),
                    sub: 'Cloudinary + Local High-Res',
                    target: 'upload' as DashboardTabId,
                  },
                  {
                    label: 'Storage Used',
                    value: `${(studio.storageUsedBytes / 1024 / 1024 / 1024).toFixed(0)} GB`,
                    sub: `of ${currentPlan.storageLimitGB} GB quota (${quotaStatus.storagePercent}%)`,
                    target: 'storage' as DashboardTabId,
                  },
                  {
                    label: 'Active Clients',
                    value: String(clients.length),
                    sub: 'CRM profiles & timelines',
                    target: 'crm' as DashboardTabId,
                  },
                  {
                    label: 'Album Selections',
                    value: `${selectedPhotosCount} Photos`,
                    sub: 'Live client proofing sync',
                    target: 'selection' as DashboardTabId,
                  },
                  {
                    label: 'Upcoming Bookings',
                    value: String(bookings.length),
                    sub: 'Confirmed crew schedules',
                    target: 'bookings' as DashboardTabId,
                  },
                  {
                    label: 'Verified Revenue',
                    value: `₹${(totalRevenuePaid / 100000).toFixed(2)}L`,
                    sub: `${invoices.length} GST tax invoices`,
                    target: 'invoices' as DashboardTabId,
                  },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => setActiveTab(stat.target)}
                    className="bg-white border border-slate-200 hover:border-[#E61575] rounded-xl p-4 text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{stat.label}</span>
                      <span className="text-slate-400 group-hover:text-[#E61575]">→</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
                      {stat.value}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">{stat.sub}</div>
                  </button>
                ))}
              </div>

              {/* Recent Projects & Live Activity Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Active Studio Productions
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('projects')}
                      className="text-xs font-medium text-[#0D9488] hover:underline"
                    >
                      View All Projects →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0">
                            <ImageOptimizer
                              src={proj.coverImage}
                              alt={proj.projectName}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 truncate">
                              {proj.projectName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>{proj.location}</span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">{proj.eventDate}</span>
                              <span>·</span>
                              <span className="capitalize">{proj.status}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('selection')}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                        >
                          Open Proofing
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Real-Time Studio Activity
                  </h2>
                  <div className="space-y-3">
                    {activityLogs.slice(0, 6).map((log) => (
                      <div
                        key={log.id}
                        className="text-xs border-b border-slate-100 pb-2.5 last:border-b-0"
                      >
                        <div className="font-semibold text-slate-900">{log.actor}</div>
                        <p className="text-slate-600 mt-0.5">{log.action}</p>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Photography Projects &amp; Event Productions ({projects.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track workflow stage from Planning and Shooting to Culling, Proofing, and Delivery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(true)}
                  className="px-4 py-2 text-xs font-medium bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Project</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between"
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
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="uppercase font-mono">{proj.projectType}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{proj.eventDate}</span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {proj.projectName}
                        </h3>
                        <p className="text-xs text-slate-600">{proj.location}</p>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                      <label htmlFor={`proj-stage-${proj.id}`} className="sr-only">
                        Workflow Stage
                      </label>
                      <select
                        id={`proj-stage-${proj.id}`}
                        value={proj.status}
                        onChange={(e) =>
                          updateProjectStatus(
                            proj.id,
                            e.target.value as StudioProject['status']
                          )
                        }
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
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
                        className="font-medium text-[#0D9488] hover:underline"
                      >
                        Open Gallery →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: GALLERIES & QR */}
          {activeTab === 'galleries' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Client Proofing Galleries &amp; QR Sharing ({galleries.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure public, private, or password-protected vaults with selection limits and watermarks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewGalleryModal(true)}
                  className="px-4 py-2 text-xs font-medium bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5"
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

          {/* TAB: CLIENT SELECTION & AI FACE SEARCH */}
          {activeTab === 'selection' && (
            <ClientGalleryPortal
              isEmbeddedInDashboard
              externalFotoOwlMode={fotoOwlAction}
              onChangeFotoOwlMode={setFotoOwlAction}
            />
          )}

          {/* TAB: ONLINE PHOTO EDITOR */}
          {activeTab === 'editor' && (
            <ProtectedRoute
              allowedRoles={['studio_owner', 'studio_admin', 'photographer', 'photo_editor', 'super_admin']}
            >
              <OnlinePhotoEditor />
            </ProtectedRoute>
          )}

          {/* TAB: WEDDING ALBUM DESIGNER */}
          {activeTab === 'album' && <WeddingAlbumDesigner />}

          {/* TAB: CRM & CLIENTS */}
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
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Studio Crew &amp; Role-Based Access ({team.length})
                  </h2>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                    {team.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                          <div className="text-slate-500 mt-0.5">
                            {m.specialty} · {m.email}
                          </div>
                        </div>
                        <div className="text-right font-mono text-slate-600 tabular-nums">
                          <div className="uppercase font-semibold text-slate-900">
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
                  className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-3.5 text-xs"
                >
                  <h3 className="text-base font-semibold text-slate-900">Invite Team Member</h3>
                  <div>
                    <label htmlFor="tm-name" className="block font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="tm-name"
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Kabir Bedi"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="tm-email" className="block font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="tm-email"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="kabir@ateliervance.studio"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="tm-role" className="block font-medium text-slate-700 mb-1">
                      Access Role
                    </label>
                    <select
                      id="tm-role"
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="studio_admin">Studio Admin</option>
                      <option value="photographer">Photographer</option>
                      <option value="photo_editor">Photo Editor</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tm-spec" className="block font-medium text-slate-700 mb-1">
                      Specialty
                    </label>
                    <input
                      id="tm-spec"
                      type="text"
                      value={memberSpecialty}
                      onChange={(e) => setMemberSpecialty(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0F172A] text-white font-medium rounded-lg hover:bg-slate-800"
                  >
                    Send Studio Invite
                  </button>
                </form>
              </div>
            </ProtectedRoute>
          )}

          {/* TAB: STORAGE & SUBSCRIPTION */}
          {activeTab === 'storage' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Subscription Tier &amp; Cloud Storage Quotas
                </h2>
                <p className="text-xs text-slate-500">
                  Current Active Tier: <strong>{currentPlan.name}</strong> · AI Credits Remaining:{' '}
                  <strong className="font-mono">{studio.aiCreditsRemaining}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p) => {
                  const isCurrent = p.id === studio.subscriptionPlan;
                  return (
                    <div
                      key={p.id}
                      className={`p-6 rounded-xl border flex flex-col justify-between space-y-5 ${
                        isCurrent ? 'border-[#0D9488] bg-teal-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
                        <p className="text-xs text-slate-500">{p.tagline}</p>
                        <div className="text-3xl font-bold font-mono text-slate-900 tabular-nums pt-1">
                          ${p.monthlyPrice}
                          <span className="text-xs font-normal text-slate-500"> / month</span>
                        </div>
                        <ul className="space-y-2 pt-3 text-xs text-slate-600">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => updateStudio({ subscriptionPlan: p.id })}
                        className={`w-full py-2.5 rounded-lg text-xs font-medium transition-colors ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-500 cursor-default'
                            : 'bg-[#0F172A] text-white hover:bg-slate-800'
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

          {/* TAB: PUBLIC PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <StudioPortfolioPage onOpenGallery={() => setActiveTab('selection')} />
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-5">
              <h2 className="text-2xl font-semibold text-slate-900">
                Studio Branding, Custom Domain &amp; Watermark Settings
              </h2>
              {settingsSavedMsg && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-950">
                  {settingsSavedMsg}
                </div>
              )}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await updateStudio({
                    studioName: settingsName.trim(),
                    watermarkText: settingsWatermark.trim(),
                    customDomain: settingsDomain.trim(),
                  });
                  setSettingsSavedMsg('Saved studio profile and synced with Firebase.');
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label htmlFor="set-studio-name" className="block font-medium text-slate-700 mb-1">
                    Studio Name
                  </label>
                  <input
                    id="set-studio-name"
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="set-watermark" className="block font-medium text-slate-700 mb-1">
                    Default Watermark Signature
                  </label>
                  <input
                    id="set-watermark"
                    type="text"
                    value={settingsWatermark}
                    onChange={(e) => setSettingsWatermark(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="set-domain" className="block font-medium text-slate-700 mb-1">
                    Custom Client Gallery Domain (CNAME)
                  </label>
                  <input
                    id="set-domain"
                    type="text"
                    value={settingsDomain}
                    onChange={(e) => setSettingsDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F172A] text-white font-medium rounded-lg hover:bg-slate-800"
                >
                  Save Studio Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB: SUPER ADMIN */}
          {activeTab === 'super_admin' && <SuperAdminConsole />}
        </main>

        {/* Exact FotoOwl Sticky Bottom Navigation Bar */}
        <FotoOwlFeatureBar
          activeMode={fotoOwlAction}
          onSelectMode={handleFotoOwlAction}
          variant="bottom_nav"
        />
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-project"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 id="modal-new-project" className="text-lg font-semibold text-slate-900">
                Create New Photography Project
              </h3>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label htmlFor="np-name" className="block font-medium text-slate-700 mb-1">
                  Project Title
                </label>
                <input
                  id="np-name"
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Rhea & Dev — Jaipur Palace Wedding"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="np-type" className="block font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    id="np-type"
                    value={newProjType}
                    onChange={(e) =>
                      setNewProjType(e.target.value as StudioProject['projectType'])
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
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
                  <label htmlFor="np-date" className="block font-medium text-slate-700 mb-1">
                    Event Date
                  </label>
                  <input
                    id="np-date"
                    type="date"
                    value={newProjDate}
                    onChange={(e) => setNewProjDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="np-client" className="block font-medium text-slate-700 mb-1">
                  Client Name
                </label>
                <input
                  id="np-client"
                  type="text"
                  value={newProjClient}
                  onChange={(e) => setNewProjClient(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="np-loc" className="block font-medium text-slate-700 mb-1">
                  Location
                </label>
                <input
                  id="np-loc"
                  type="text"
                  value={newProjLocation}
                  onChange={(e) => setNewProjLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F172A] text-white font-medium rounded-lg"
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
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-gallery"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 id="modal-new-gallery" className="text-lg font-semibold text-slate-900">
                Create Client Proofing Gallery
              </h3>
              <button
                type="button"
                onClick={() => setShowNewGalleryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGallery} className="space-y-3">
              <div>
                <label htmlFor="ng-name" className="block font-medium text-slate-700 mb-1">
                  Gallery Title
                </label>
                <input
                  id="ng-name"
                  type="text"
                  value={newGalName}
                  onChange={(e) => setNewGalName(e.target.value)}
                  placeholder="Rhea & Dev — Haldi & Mehendi Proofing"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="ng-type" className="block font-medium text-slate-700 mb-1">
                    Gallery Type
                  </label>
                  <select
                    id="ng-type"
                    value={newGalType}
                    onChange={(e) =>
                      setNewGalType(e.target.value as StudioGallery['galleryType'])
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Wedding Gallery">Wedding Gallery</option>
                    <option value="Client Proofing Gallery">Client Proofing Gallery</option>
                    <option value="Event Gallery">Event Gallery</option>
                    <option value="Portrait Gallery">Portrait Gallery</option>
                    <option value="Corporate Gallery">Corporate Gallery</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ng-access" className="block font-medium text-slate-700 mb-1">
                    Access Control
                  </label>
                  <select
                    id="ng-access"
                    value={newGalAccess}
                    onChange={(e) =>
                      setNewGalAccess(e.target.value as StudioGallery['accessType'])
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="public">Public Link &amp; QR</option>
                    <option value="password">Password Protected</option>
                    <option value="private">Private Client Login</option>
                  </select>
                </div>
              </div>
              {newGalAccess === 'password' && (
                <div>
                  <label htmlFor="ng-pass" className="block font-medium text-slate-700 mb-1">
                    Gallery Passcode (Stored as SHA-256 Hash)
                  </label>
                  <input
                    id="ng-pass"
                    type="password"
                    value={newGalPasscode}
                    onChange={(e) => setNewGalPasscode(e.target.value)}
                    placeholder="Enter client passcode"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="ng-limit" className="block font-medium text-slate-700 mb-1">
                  Maximum Client Album Selection Limit
                </label>
                <input
                  id="ng-limit"
                  type="number"
                  min={1}
                  max={2000}
                  value={newGalLimit}
                  onChange={(e) => setNewGalLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGalleryModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D9488] text-white font-medium rounded-lg"
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
