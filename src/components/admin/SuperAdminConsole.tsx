import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Database,
  Shield,
  Tag,
  Building2,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getCloudinaryConfig,
  isCloudinaryConfigured,
  saveCloudinaryConfig,
} from '../../lib/cloudinary';
import { SubscriptionPlanId } from '../../types';

export const SuperAdminConsole: React.FC = () => {
  const {
    allStudiosForAdmin,
    toggleStudioSuspension,
    plans,
    updatePlans,
    coupons,
    addCoupon,
    activityLogs,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'studios' | 'plans' | 'cloudinary' | 'coupons' | 'logs'
  >('studios');

  // Cloudinary Admin configuration form
  const initialCloud = getCloudinaryConfig();
  const [cloudName, setCloudName] = useState<string>(initialCloud.cloudName);
  const [apiKey, setApiKey] = useState<string>(initialCloud.apiKey);
  const [uploadPreset, setUploadPreset] = useState<string>(initialCloud.uploadPreset);
  const [folder, setFolder] = useState<string>(initialCloud.folder);
  const [signedDelivery, setSignedDelivery] = useState<boolean>(
    initialCloud.signedDeliveryEnabled
  );
  const [adminFeedback, setAdminFeedback] = useState<string>('');

  // Coupon form
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(20);
  const [couponPlan, setCouponPlan] = useState<SubscriptionPlanId | 'all'>('pro');

  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveCloudinaryConfig({
      cloudName,
      apiKey,
      uploadPreset,
      folder,
      signedDeliveryEnabled: signedDelivery,
    });
    const isLive = isCloudinaryConfigured(saved);
    setAdminFeedback(
      isLive
        ? `Validated and saved Cloudinary configuration for cloud "${saved.cloudName}" with preset "${saved.uploadPreset}".`
        : 'Saved Cloudinary settings. Provide your live Cloud Name and Unsigned Upload Preset to switch from local Canvas fallback to remote Cloudinary CDN.'
    );
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    addCoupon({
      code: couponCode.trim().toUpperCase(),
      discountPercent: Number(couponDiscount) || 15,
      applicablePlan: couponPlan,
      maxUses: 100,
      expiryDate: '2027-12-31',
      active: true,
    });
    setCouponCode('');
    setAdminFeedback(`Created promotional coupon code ${couponCode.toUpperCase()}.`);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Header */}
      <div className="bg-[#0F172A] text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-teal-400 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Platform Super Admin Governance</span>
          </div>
          <h2 className="text-2xl font-semibold">
            Lumina SaaS Multi-Tenant Control Center
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/90 p-1 rounded-lg text-xs">
          {[
            { id: 'studios', label: 'All Studios', icon: Building2 },
            { id: 'plans', label: 'Plans & Quotas', icon: Layers },
            { id: 'cloudinary', label: 'Cloudinary & Firebase', icon: Cloud },
            { id: 'coupons', label: 'Coupons', icon: Tag },
            { id: 'logs', label: 'Audit Logs', icon: Database },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id as typeof activeTab);
                  setAdminFeedback('');
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors inline-flex items-center gap-1.5 ${
                  activeTab === t.id
                    ? 'bg-[#0D9488] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {adminFeedback && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span>{adminFeedback}</span>
        </div>
      )}

      {/* TAB 1: ALL STUDIOS */}
      {activeTab === 'studios' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Registered Photography Studios ({allStudiosForAdmin.length})
          </h3>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
            {allStudiosForAdmin.map((st) => (
              <div
                key={st.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span>{st.studioName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-xs text-slate-500">/{st.slug}</span>
                  </div>
                  <div className="text-slate-500 flex flex-wrap items-center gap-2">
                    <span>{st.email}</span>
                    <span>·</span>
                    <span>Plan: {st.subscriptionPlan.toUpperCase()}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      Storage Used: {(st.storageUsedBytes / 1024 / 1024 / 1024).toFixed(1)} GB
                    </span>
                    <span>·</span>
                    <span>Status: {st.subscriptionStatus}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStudioSuspension(st.id)}
                  className={`px-3.5 py-2 rounded-lg font-medium transition-colors ${
                    st.subscriptionStatus === 'suspended'
                      ? 'bg-[#0D9488] text-white'
                      : 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  {st.subscriptionStatus === 'suspended' ? 'Reactivate Studio' : 'Suspend Tenant'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTION PLANS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500">{plan.tagline}</p>
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                ${plan.monthlyPrice} <span className="text-xs font-normal text-slate-500">/ mo</span>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div>
                  <label
                    htmlFor={`storage-limit-${plan.id}`}
                    className="block font-medium text-slate-700 mb-1"
                  >
                    Storage Quota (GB)
                  </label>
                  <input
                    id={`storage-limit-${plan.id}`}
                    type="number"
                    value={plan.storageLimitGB}
                    onChange={(e) => {
                      const next = [...plans];
                      next[idx] = { ...plan, storageLimitGB: Number(e.target.value) };
                      updatePlans(next);
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`photo-limit-${plan.id}`}
                    className="block font-medium text-slate-700 mb-1"
                  >
                    Max Photos Quota
                  </label>
                  <input
                    id={`photo-limit-${plan.id}`}
                    type="number"
                    value={plan.photoLimit}
                    onChange={(e) => {
                      const next = [...plans];
                      next[idx] = { ...plan, photoLimit: Number(e.target.value) };
                      updatePlans(next);
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`ai-credits-${plan.id}`}
                    className="block font-medium text-slate-700 mb-1"
                  >
                    Monthly AI Credits
                  </label>
                  <input
                    id={`ai-credits-${plan.id}`}
                    type="number"
                    value={plan.aiCredits}
                    onChange={(e) => {
                      const next = [...plans];
                      next[idx] = { ...plan, aiCredits: Number(e.target.value) };
                      updatePlans(next);
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CLOUDINARY & FIREBASE CONFIGURATION */}
      {activeTab === 'cloudinary' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Cloudinary Storage &amp; Transformation Settings
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure your Cloudinary Cloud Name and Unsigned Upload Preset. API Secrets are kept strictly on backend routes and never exposed in browser code.
            </p>
          </div>

          <form onSubmit={handleSaveCloudinary} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin-cloud-name" className="block font-medium text-slate-700 mb-1">
                  CLOUDINARY_CLOUD_NAME
                </label>
                <input
                  id="admin-cloud-name"
                  type="text"
                  value={cloudName}
                  onChange={(e) => setCloudName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-upload-preset" className="block font-medium text-slate-700 mb-1">
                  CLOUDINARY_UPLOAD_PRESET (Unsigned)
                </label>
                <input
                  id="admin-upload-preset"
                  type="text"
                  value={uploadPreset}
                  onChange={(e) => setUploadPreset(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin-api-key" className="block font-medium text-slate-700 mb-1">
                  CLOUDINARY_API_KEY (Public Identifier)
                </label>
                <input
                  id="admin-api-key"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label htmlFor="admin-root-folder" className="block font-medium text-slate-700 mb-1">
                  CLOUDINARY_FOLDER Root Prefix
                </label>
                <input
                  id="admin-root-folder"
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={signedDelivery}
                onChange={(e) => setSignedDelivery(e.target.checked)}
                className="rounded border-slate-300 text-[#0D9488]"
              />
              <span>Enforce Signed Delivery URLs for Private &amp; Password Galleries</span>
            </label>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0F172A] text-white font-medium rounded-lg hover:bg-slate-800"
              >
                Save &amp; Validate Cloudinary Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Active Subscription Coupons</h3>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
              {coupons.map((cp) => (
                <div key={cp.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{cp.code}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-[#0D9488] font-semibold">
                      {cp.discountPercent}% OFF
                    </span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-500">Plan: {cp.applicablePlan}</span>
                  </div>
                  <span className="font-mono text-slate-500 tabular-nums">
                    Used {cp.usedCount} / {cp.maxUses}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-3.5 text-xs"
          >
            <h3 className="text-base font-semibold text-slate-900">Create Promotional Coupon</h3>
            <div>
              <label htmlFor="cp-code" className="block font-medium text-slate-700 mb-1">
                Coupon Code
              </label>
              <input
                id="cp-code"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="FESTIVAL30"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cp-disc" className="block font-medium text-slate-700 mb-1">
                  Discount (%)
                </label>
                <input
                  id="cp-disc"
                  type="number"
                  min={5}
                  max={80}
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label htmlFor="cp-plan" className="block font-medium text-slate-700 mb-1">
                  Target Plan
                </label>
                <select
                  id="cp-plan"
                  value={couponPlan}
                  onChange={(e) => setCouponPlan(e.target.value as SubscriptionPlanId | 'all')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Studio Collective</option>
                  <option value="studio_max">Enterprise</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0F172A] text-white font-medium rounded-lg hover:bg-slate-800"
            >
              Publish Coupon
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Platform Security &amp; Tenant Activity Audit Trail
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <strong className="text-slate-900">{log.actor}</strong>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-600">{log.action}</span>
                </div>
                <span className="font-mono text-slate-400 tabular-nums shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
