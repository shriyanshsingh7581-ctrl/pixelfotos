import React, { useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Frame,
  Lock,
  Package,
  Palette,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { PRINT_STORE_CATALOG } from '../../data/pixelfotosData';
import { PrintOrder } from '../../types/pixelfotos';
import { MediaFrame } from '../shared/MediaFrame';

const ACCENT_SWATCHES = [
  { label: 'Champagne Gold', hex: '#D4AF37' },
  { label: 'Studio Emerald', hex: '#10B981' },
  { label: 'Obsidian Slate', hex: '#334155' },
  { label: 'Rosewood Copper', hex: '#B45309' },
];

const ORDER_STATUS_SEQUENCE: PrintOrder['status'][] = ['New Order', 'In Print Lab', 'Shipped'];

export const Module5PrintStoreDelivery: React.FC = () => {
  const {
    photos,
    deliveryConfig,
    setDeliveryConfig,
    printOrders,
    placePrintOrder,
    updatePrintOrderStatus,
    totalPrintProfitInr,
    setViewMode,
  } = usePixelFotos();

  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(photos[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<string>(PRINT_STORE_CATALOG[0].id);
  const [orderQty, setOrderQty] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('Kabir Verma');
  const [notice, setNotice] = useState<string | null>(null);

  const bestPhotos = useMemo(
    () => photos.filter((p) => p.aiSelected || p.cullingTag === 'best_pick'),
    [photos]
  );

  const activePhoto = useMemo(
    () => photos.find((p) => p.id === selectedPhotoId) || bestPhotos[0] || photos[0],
    [photos, bestPhotos, selectedPhotoId]
  );

  const activeProduct = useMemo(
    () => PRINT_STORE_CATALOG.find((p) => p.id === selectedProductId) || PRINT_STORE_CATALOG[0],
    [selectedProductId]
  );

  const storeMetrics = useMemo(() => {
    const grossSales = printOrders.reduce((sum, o) => sum + o.clientTotalInr, 0);
    const totalUnits = printOrders.reduce((sum, o) => sum + o.quantity, 0);
    const marginPercent = grossSales > 0 ? Math.round((totalPrintProfitInr / grossSales) * 100) : 0;
    return { grossSales, totalUnits, marginPercent };
  }, [printOrders, totalPrintProfitInr]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePhoto || !activeProduct) return;
    const qty = Math.max(1, orderQty);
    const clientTotalInr = activeProduct.clientPriceInr * qty;
    const studioProfitInr = (activeProduct.clientPriceInr - activeProduct.studioCostInr) * qty;

    placePrintOrder({
      photoId: activePhoto.id,
      photoFileName: activePhoto.fileName,
      photoUrl: activePhoto.url,
      productId: activeProduct.id,
      productName: activeProduct.name,
      category: activeProduct.category,
      dimensions: activeProduct.dimensions,
      quantity: qty,
      clientTotalInr,
      studioProfitInr,
      customerName: customerName.trim() || 'Guest Buyer',
    });

    setNotice(
      `Order logged for ${activeProduct.name} × ${qty} · Studio profit +₹${studioProfitInr.toLocaleString('en-IN')} synced.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
            Module 05 · Deliver & Monetize
          </p>
          <h2 className="mt-1 text-3xl sm:text-4xl font-editorial font-semibold text-zinc-900 dark:text-white tracking-tight">
            Branded Client Gallery & In-Built Print Store
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Configure custom studio branding, PIN protection, high-res download rules, and sell museum-grade frames and heirloom albums directly inside client galleries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode('microsite')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Test Client Gallery & Print Store
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 text-sm text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-mono uppercase tracking-wider opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Print Store Gross
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
            ₹{storeMetrics.grossSales.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {storeMetrics.totalUnits} framed & album units
          </p>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/30 bg-white dark:bg-[#11141D] p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#B58E24] dark:text-[#D4AF37]">
            Studio Net Print Profit
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-[#10B981] tabular-nums">
            +₹{totalPrintProfitInr.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Avg margin {storeMetrics.marginPercent}% · synced to CRM
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Gallery Security
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900 dark:text-white">
            {deliveryConfig.pinProtected ? `PIN ${deliveryConfig.pinCode}` : 'Open Link'}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {deliveryConfig.pinProtected ? '4-digit access gate active' : 'Instant guest entry'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            High-Res Downloads
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900 dark:text-white">
            {deliveryConfig.allowHighResDownload ? 'Enabled' : 'Proofing Only'}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {deliveryConfig.studioLogoText} branded portal
          </p>
        </div>
      </div>

      {/* Main Split: Branding & Security Controls + Interactive Print Product Builder */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Studio Branding & Delivery Permissions */}
        <div className="xl:col-span-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Studio Branding & Delivery Gate
              </h3>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Live Sync
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Studio Brand Name
              </label>
              <input
                type="text"
                value={deliveryConfig.studioName}
                onChange={(e) =>
                  setDeliveryConfig((prev) => ({ ...prev, studioName: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Monogram / Header Wordmark
              </label>
              <input
                type="text"
                value={deliveryConfig.studioLogoText}
                onChange={(e) =>
                  setDeliveryConfig((prev) => ({
                    ...prev,
                    studioLogoText: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm font-mono tracking-widest text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Client Gallery Accent Palette
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {ACCENT_SWATCHES.map((swatch) => {
                  const active =
                    deliveryConfig.accentColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() =>
                        setDeliveryConfig((prev) => ({ ...prev, accentColor: swatch.hex }))
                      }
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        active
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-zinc-900 dark:text-white'
                          : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      {swatch.label}
                    </button>
                  );
                })}
                <input
                  type="color"
                  value={deliveryConfig.accentColor}
                  onChange={(e) =>
                    setDeliveryConfig((prev) => ({ ...prev, accentColor: e.target.value }))
                  }
                  aria-label="Custom studio accent hex"
                  className="w-8 h-8 rounded-lg border border-zinc-300 dark:border-white/10 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {/* PIN Protection Toggle */}
            <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {deliveryConfig.pinProtected ? (
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                  ) : (
                    <Unlock className="w-4 h-4 text-zinc-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      Require 4-Digit Gallery PIN
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Protects client gallery & print checkout behind an unlock screen
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryConfig((prev) => ({ ...prev, pinProtected: !prev.pinProtected }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    deliveryConfig.pinProtected
                      ? 'bg-[#D4AF37] text-[#090B10]'
                      : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {deliveryConfig.pinProtected ? 'PIN Active' : 'Disabled'}
                </button>
              </div>

              {deliveryConfig.pinProtected && (
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-200 dark:border-white/10">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Passcode:</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={deliveryConfig.pinCode}
                    onChange={(e) =>
                      setDeliveryConfig((prev) => ({ ...prev, pinCode: e.target.value }))
                    }
                    className="w-28 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#11141D] text-sm font-mono tracking-widest text-zinc-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Download Permission Toggle */}
            <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    Allow High-Res Original Downloads
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Toggle off for watermarked proofing-only galleries
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDeliveryConfig((prev) => ({
                    ...prev,
                    allowHighResDownload: !prev.allowHighResDownload,
                  }))
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  deliveryConfig.allowHighResDownload
                    ? 'bg-[#10B981] text-[#090B10]'
                    : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {deliveryConfig.allowHighResDownload ? 'Allowed' : 'Blocked'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Interactive Print Store Preview & Order Simulator */}
        <div className="xl:col-span-7 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Frame className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                In-Built Print Store · Live Margin & Order Simulator
              </h3>
            </div>
            <span className="text-xs font-mono text-[#10B981] tabular-nums">
              Margin +₹{(activeProduct.clientPriceInr - activeProduct.studioCostInr).toLocaleString('en-IN')} / unit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Framed Mockup Preview */}
            <div className="md:col-span-6 space-y-3">
              <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-[#F3EFE6] dark:bg-[#0D1017] p-6 flex flex-col items-center justify-center">
                <div
                  className={`w-full aspect-[4/3] overflow-hidden shadow-2xl transition-all ${
                    activeProduct.category === 'Wooden Frame'
                      ? 'p-3 bg-[#4A321F] border-4 border-[#332112]'
                      : activeProduct.category === 'Acrylic Frame'
                      ? 'p-1 bg-white/80 border-2 border-white/60 rounded-lg'
                      : activeProduct.category === 'Canvas Print'
                      ? 'border-r-4 border-b-4 border-zinc-400 dark:border-zinc-700'
                      : 'p-2.5 bg-[#FAF7F0] border border-[#D4AF37]/50 rounded-md'
                  }`}
                >
                  <div className="w-full h-full bg-white p-1.5">
                    {activePhoto && (
                      <MediaFrame
                        src={activePhoto.url}
                        alt={activePhoto.fileName}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs font-mono text-zinc-600 dark:text-zinc-400 text-center">
                  {activeProduct.category} · {activeProduct.dimensions}
                </p>
              </div>

              {/* Select Photo Strip */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-2">
                  Select Shoot Photo to Frame
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {bestPhotos.slice(0, 5).map((photo) => {
                    const selected = activePhoto?.id === photo.id;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setSelectedPhotoId(photo.id)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                          selected
                            ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <MediaFrame src={photo.url} alt={photo.fileName} className="w-full h-full" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Product Selector + Order Form */}
            <form onSubmit={handlePlaceOrder} className="md:col-span-6 space-y-3.5">
              <div className="space-y-2">
                {PRINT_STORE_CATALOG.map((product) => {
                  const selected = product.id === activeProduct.id;
                  const profit = product.clientPriceInr - product.studioCostInr;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                        selected
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {product.category} · {product.dimensions}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                            ₹{product.clientPriceInr.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] font-mono text-[#10B981] tabular-nums">
                            +₹{profit.toLocaleString('en-IN')} profit
                          </p>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[11px] font-mono text-zinc-500 tabular-nums">
                        Lab Cost: ₹{product.studioCostInr.toLocaleString('en-IN')}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="col-span-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                    Buyer / Guest Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#090B10] text-sm font-mono text-zinc-900 dark:text-white tabular-nums"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] transition cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Place Print Order (₹
                {(activeProduct.clientPriceInr * orderQty).toLocaleString('en-IN')})
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Fulfillment Queue Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11141D] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Active Print & Album Fulfillment Queue
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
            {printOrders.length} Orders · Total Profit ₹{totalPrintProfitInr.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-[#090B10] text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3">Order & Photo</th>
                <th className="px-4 py-3">Product Spec</th>
                <th className="px-4 py-3">Client / Guest</th>
                <th className="px-4 py-3 text-right">Client Total</th>
                <th className="px-4 py-3 text-right">Studio Margin</th>
                <th className="px-5 py-3">Lab Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {printOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <MediaFrame
                        src={order.photoUrl}
                        alt={order.photoFileName}
                        className="w-11 h-11 rounded-lg shrink-0"
                      />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {order.photoFileName}
                        </p>
                        <p className="text-xs font-mono text-zinc-500 tabular-nums">
                          {order.id} · {order.createdAt}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-zinc-900 dark:text-white">{order.productName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {order.category} · {order.dimensions} × {order.quantity}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300">
                    {order.customerName}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-medium text-zinc-900 dark:text-white tabular-nums">
                    ₹{order.clientTotalInr.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-[#10B981] tabular-nums">
                    +₹{order.studioProfitInr.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updatePrintOrderStatus(order.id, e.target.value as PrintOrder['status'])
                      }
                      className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-[#090B10] text-xs font-medium text-zinc-900 dark:text-white cursor-pointer"
                    >
                      {ORDER_STATUS_SEQUENCE.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
