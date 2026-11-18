import React, { useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Frame,
  IndianRupee,
  Lock,
  Package,
  Palette,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Unlock,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { PrintOrder, PrintProduct } from '../../types/pixelfotos';
import { MediaFrame } from '../shared/MediaFrame';

const ACCENT_SWATCHES = [
  { label: 'Champagne Gold', hex: '#D4AF37' },
  { label: 'Studio Emerald', hex: '#10B981' },
  { label: 'Obsidian Slate', hex: '#334155' },
  { label: 'Rosewood Copper', hex: '#B45309' },
];

const ORDER_STATUS_SEQUENCE: PrintOrder['status'][] = ['New Order', 'In Print Lab', 'Shipped'];

const PRODUCT_CATEGORIES: PrintProduct['category'][] = [
  'Fine Art Print',
  'Wooden Frame',
  'Acrylic Frame',
  'Canvas Print',
  'Luxury Album',
];

export const Module5PrintStoreDelivery: React.FC = () => {
  const {
    photos,
    deliveryConfig,
    setDeliveryConfig,
    printProducts,
    addPrintProduct,
    updatePrintProduct,
    deletePrintProduct,
    resetPrintCatalog,
    printOrders,
    placePrintOrder,
    updatePrintOrderStatus,
    totalPrintProfitInr,
    setViewMode,
  } = usePixelFotos();

  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(photos[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<string>(printProducts[0]?.id || '');
  const [orderQty, setOrderQty] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('Kabir Verma');
  const [notice, setNotice] = useState<string | null>(null);

  // Admin New Print Size / Frame / Album State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Fine Art Print' as PrintProduct['category'],
    dimensions: '12 × 18 in · 310gsm Hahnemuhle',
    clientPriceInr: 2400,
    studioCostInr: 750,
  });

  const bestPhotos = useMemo(
    () => photos.filter((p) => p.aiSelected || p.cullingTag === 'best_pick'),
    [photos]
  );

  const activePhoto = useMemo(
    () => photos.find((p) => p.id === selectedPhotoId) || bestPhotos[0] || photos[0],
    [photos, bestPhotos, selectedPhotoId]
  );

  const activeProduct = useMemo(
    () => printProducts.find((p) => p.id === selectedProductId) || printProducts[0],
    [printProducts, selectedProductId]
  );

  const storeMetrics = useMemo(() => {
    const grossSales = printOrders.reduce((sum, o) => sum + o.clientTotalInr, 0);
    const totalUnits = printOrders.reduce((sum, o) => sum + o.quantity, 0);
    const marginPercent = grossSales > 0 ? Math.round((totalPrintProfitInr / grossSales) * 100) : 0;
    return { grossSales, totalUnits, marginPercent };
  }, [printOrders, totalPrintProfitInr]);

  const handleAddPrintProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) return;
    const itemName = newProductForm.name.trim();
    const itemPrice = Math.max(0, Number(newProductForm.clientPriceInr) || 0);
    addPrintProduct({
      name: itemName,
      category: newProductForm.category,
      dimensions: newProductForm.dimensions.trim() || '12 × 18 in',
      clientPriceInr: itemPrice,
      studioCostInr: Math.max(0, Number(newProductForm.studioCostInr) || 0),
    });
    setNewProductForm({
      name: '',
      category: 'Fine Art Print',
      dimensions: '12 × 18 in · 310gsm Hahnemuhle',
      clientPriceInr: 2400,
      studioCostInr: 750,
    });
    setShowAddProduct(false);
    setNotice(
      `Added "${itemName}" (₹${itemPrice.toLocaleString('en-IN')}) to Admin Print Catalog & synced to Client Microsite.`
    );
  };

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
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
            Module 05 · Deliver &amp; Monetize
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-editorial font-semibold text-zinc-900 dark:text-white tracking-tight">
            Branded Client Gallery &amp; In-Built Print Store
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Manage photo print sizes, museum frames, and heirloom album prices in the Admin Price Manager—every price change syncs live to the Client Wedding Microsite store.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode('microsite')}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] shadow-sm transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Test Client Gallery &amp; Print Store
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[18px] border border-[#10B981]/35 bg-[#10B981]/12 backdrop-blur-md text-sm text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="min-h-[36px] px-2.5 text-xs font-mono uppercase tracking-wider opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="rounded-[22px] liquid-glass p-4 sm:p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Print Store Gross
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
            ₹{storeMetrics.grossSales.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {storeMetrics.totalUnits} framed &amp; album units
          </p>
        </div>

        <div className="rounded-[22px] liquid-glass border-[#D4AF37]/40 p-4 sm:p-5">
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

        <div className="rounded-[22px] liquid-glass p-4 sm:p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Active Print Sizes &amp; Albums
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
            {printProducts.length} Items
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Synced to Client Microsite
          </p>
        </div>

        <div className="rounded-[22px] liquid-glass p-4 sm:p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Gallery Security
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900 dark:text-white">
            {deliveryConfig.pinProtected ? `PIN ${deliveryConfig.pinCode}` : 'Open Link'}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {deliveryConfig.allowHighResDownload ? 'High-res downloads active' : 'Proofing only'}
          </p>
        </div>
      </div>

      {/* NEW: Dedicated Admin Print Size, Frame & Album Price Manager */}
      <div className="rounded-[24px] liquid-glass border-[#D4AF37]/40 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
                Admin Print Size, Frame &amp; Album Price Manager
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Edit client prices, print dimensions, or studio lab costs directly below. All updates synchronize immediately with the Client Microsite Print Store.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetPrintCatalog();
                setNotice('Restored default studio print & album price list.');
              }}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-medium liquid-glass-subtle text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37]/50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default Prices
            </button>

            <button
              type="button"
              onClick={() => setShowAddProduct((v) => !v)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-1.5 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddProduct ? 'Close Form' : 'Add Print Size / Album'}
            </button>
          </div>
        </div>

        {/* Add New Print Product Inline Bar */}
        {showAddProduct && (
          <form
            onSubmit={handleAddPrintProduct}
            className="rounded-[20px] liquid-glass-subtle p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end border border-[#D4AF37]/30"
          >
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Product / Print Title *
              </label>
              <input
                type="text"
                placeholder="e.g. 16×24 Archival Matte Print"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Category
              </label>
              <select
                value={newProductForm.category}
                onChange={(e) =>
                  setNewProductForm((p) => ({
                    ...p,
                    category: e.target.value as PrintProduct['category'],
                  }))
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs text-zinc-900 dark:text-white"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Print Size / Spec
              </label>
              <input
                type="text"
                placeholder="e.g. 16 × 24 in · 310gsm"
                value={newProductForm.dimensions}
                onChange={(e) => setNewProductForm((p) => ({ ...p, dimensions: e.target.value }))}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Client Price (₹)
              </label>
              <input
                type="number"
                min={0}
                value={newProductForm.clientPriceInr}
                onChange={(e) =>
                  setNewProductForm((p) => ({ ...p, clientPriceInr: Number(e.target.value) }))
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs font-mono text-zinc-900 dark:text-white tabular-nums"
              />
            </div>

            <div className="lg:col-span-2 flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Lab Cost (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newProductForm.studioCostInr}
                  onChange={(e) =>
                    setNewProductForm((p) => ({ ...p, studioCostInr: Number(e.target.value) }))
                  }
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs font-mono text-zinc-900 dark:text-white tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 cursor-pointer shrink-0 self-end"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Editable Price Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.03] dark:bg-white/[0.04] text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Size / Dimensions</th>
                <th className="px-3 py-3">Client Price (₹)</th>
                <th className="px-3 py-3">Studio Lab Cost (₹)</th>
                <th className="px-3 py-3 text-right">Net Profit / Unit</th>
                <th className="px-3 py-3 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {printProducts.map((product) => {
                const unitProfit = product.clientPriceInr - product.studioCostInr;
                return (
                  <tr key={product.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) =>
                          updatePrintProduct(product.id, { name: e.target.value })
                        }
                        aria-label={`Product name for ${product.name}`}
                        className="w-full min-w-[180px] min-h-[38px] px-2.5 py-1.5 rounded-lg liquid-input text-xs font-semibold text-zinc-900 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={product.category}
                        onChange={(e) =>
                          updatePrintProduct(product.id, {
                            category: e.target.value as PrintProduct['category'],
                          })
                        }
                        aria-label={`Category for ${product.name}`}
                        className="min-h-[38px] px-2.5 py-1.5 rounded-lg liquid-input text-xs text-zinc-800 dark:text-zinc-200"
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        value={product.dimensions}
                        onChange={(e) =>
                          updatePrintProduct(product.id, { dimensions: e.target.value })
                        }
                        aria-label={`Dimensions for ${product.name}`}
                        className="w-full min-w-[150px] min-h-[38px] px-2.5 py-1.5 rounded-lg liquid-input text-xs text-zinc-700 dark:text-zinc-300"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-mono text-zinc-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={product.clientPriceInr}
                          onChange={(e) =>
                            updatePrintProduct(product.id, {
                              clientPriceInr: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          aria-label={`Client price for ${product.name}`}
                          className="w-28 min-h-[38px] pl-6 pr-2.5 py-1.5 rounded-lg liquid-input text-xs font-mono font-semibold text-zinc-900 dark:text-white tabular-nums"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-mono text-zinc-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={product.studioCostInr}
                          onChange={(e) =>
                            updatePrintProduct(product.id, {
                              studioCostInr: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          aria-label={`Studio cost for ${product.name}`}
                          className="w-28 min-h-[38px] pl-6 pr-2.5 py-1.5 rounded-lg liquid-input text-xs font-mono text-zinc-700 dark:text-zinc-300 tabular-nums"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-[#10B981] tabular-nums">
                      +₹{unitProfit.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        disabled={printProducts.length <= 1}
                        onClick={() => {
                          deletePrintProduct(product.id);
                          setNotice(`Removed "${product.name}" from Print Store catalog.`);
                        }}
                        aria-label={`Delete ${product.name}`}
                        className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Split: Branding & Security Controls + Interactive Print Product Simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Studio Branding & Delivery Permissions */}
        <div className="xl:col-span-5 rounded-[24px] liquid-glass p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Studio Branding &amp; Delivery Gate
              </h3>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
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
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
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
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm font-mono tracking-widest text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Client Gallery Accent Palette
              </label>
              <div className="flex flex-wrap items-center gap-2">
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
                      className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-1.5 rounded-full border text-xs font-medium transition cursor-pointer ${
                        active
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-zinc-900 dark:text-white'
                          : 'border-black/10 dark:border-white/12 text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37]/50'
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
                  className="w-10 h-10 rounded-full border border-black/10 dark:border-white/15 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {/* PIN Protection Toggle */}
            <div className="rounded-[18px] liquid-glass-subtle p-4 space-y-3">
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
                      Protects client gallery &amp; print checkout behind an unlock screen
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryConfig((prev) => ({ ...prev, pinProtected: !prev.pinProtected }))
                  }
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                    deliveryConfig.pinProtected
                      ? 'bg-[#D4AF37] text-[#090B10]'
                      : 'bg-black/10 dark:bg-white/12 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {deliveryConfig.pinProtected ? 'PIN Active' : 'Disabled'}
                </button>
              </div>

              {deliveryConfig.pinProtected && (
                <div className="flex items-center gap-3 pt-2 border-t border-black/10 dark:border-white/10">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Passcode:</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={deliveryConfig.pinCode}
                    onChange={(e) =>
                      setDeliveryConfig((prev) => ({ ...prev, pinCode: e.target.value }))
                    }
                    className="w-28 min-h-[40px] px-3 py-1.5 rounded-xl liquid-input text-sm font-mono tracking-widest text-zinc-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Download Permission Toggle */}
            <div className="rounded-[18px] liquid-glass-subtle p-4 flex items-center justify-between gap-3">
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
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                  deliveryConfig.allowHighResDownload
                    ? 'bg-[#10B981] text-[#090B10]'
                    : 'bg-black/10 dark:bg-white/12 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {deliveryConfig.allowHighResDownload ? 'Allowed' : 'Blocked'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Interactive Print Store Preview & Order Simulator */}
        <div className="xl:col-span-7 rounded-[24px] liquid-glass p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Frame className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                In-Built Print Store · Live Margin &amp; Order Simulator
              </h3>
            </div>
            {activeProduct && (
              <span className="text-xs font-mono text-[#10B981] tabular-nums">
                Margin +₹
                {(activeProduct.clientPriceInr - activeProduct.studioCostInr).toLocaleString(
                  'en-IN'
                )}{' '}
                / unit
              </span>
            )}
          </div>

          {activeProduct && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Framed Mockup Preview */}
              <div className="md:col-span-6 space-y-3">
                <div className="rounded-[20px] liquid-glass-subtle p-6 flex flex-col items-center justify-center">
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
                  <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-2">
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
                          className={`aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                            selected
                              ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <MediaFrame
                            src={photo.url}
                            alt={photo.fileName}
                            className="w-full h-full"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Selector + Order Form */}
              <form onSubmit={handlePlaceOrder} className="md:col-span-6 space-y-3.5">
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {printProducts.map((product) => {
                    const selected = product.id === activeProduct.id;
                    const profit = product.clientPriceInr - product.studioCostInr;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProductId(product.id)}
                        className={`w-full text-left p-3.5 rounded-[18px] border transition cursor-pointer ${
                          selected
                            ? 'border-[#D4AF37] bg-[#D4AF37]/12'
                            : 'border-black/10 dark:border-white/12 hover:border-[#D4AF37]/45'
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
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Buyer / Guest Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={orderQty}
                      onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl liquid-input text-sm font-mono text-zinc-900 dark:text-white tabular-nums"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] shadow-sm transition cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Place Print Order (₹
                  {(activeProduct.clientPriceInr * orderQty).toLocaleString('en-IN')})
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Fulfillment Queue Table */}
      <div className="rounded-[24px] liquid-glass overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Active Print &amp; Album Fulfillment Queue
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
            {printOrders.length} Orders · Total Profit ₹{totalPrintProfitInr.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.03] dark:bg-white/[0.04] text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3">Order &amp; Photo</th>
                <th className="px-4 py-3">Product Spec</th>
                <th className="px-4 py-3">Client / Guest</th>
                <th className="px-4 py-3 text-right">Client Total</th>
                <th className="px-4 py-3 text-right">Studio Margin</th>
                <th className="px-5 py-3">Lab Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {printOrders.map((order) => (
                <tr key={order.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <MediaFrame
                        src={order.photoUrl}
                        alt={order.photoFileName}
                        className="w-11 h-11 rounded-xl shrink-0"
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
                      className="min-h-[40px] px-3 py-1.5 rounded-xl liquid-input text-xs font-medium text-zinc-900 dark:text-white cursor-pointer"
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
