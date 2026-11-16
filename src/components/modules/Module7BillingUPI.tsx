import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileDown,
  FileText,
  Plus,
  QrCode,
  Receipt,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { InvoiceLineItem, QuotationInvoiceRecord } from '../../types/pixelfotos';
import { BottomSheetModal } from '../shared/BottomSheetModal';
import { QrCodeCanvas } from '../shared/QrCodeCanvas';

function computeDocTotals(doc: QuotationInvoiceRecord) {
  const subtotal = doc.items.reduce((sum, item) => sum + item.qty * item.rateInr, 0);
  const gst = doc.includeGst18 ? Math.round(subtotal * 0.18) : 0;
  const grandTotal = subtotal + gst;
  const balanceDue = Math.max(0, grandTotal - doc.advancePaidInr);
  return { subtotal, gst, grandTotal, balanceDue };
}

export const Module7BillingUPI: React.FC = () => {
  const {
    documents,
    clients,
    deliveryConfig,
    addQuotation,
    convertQuotationToInvoice,
    markInvoicePaid,
    totalCollectedRevenueInr,
  } = usePixelFotos();

  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [showNewModal, setShowNewModal] = useState(false);
  const [upiNotice, setUpiNotice] = useState<string | null>(null);

  // Builder State for New Quotation
  const [clientName, setClientName] = useState(clients[0]?.name || 'Meera & Devansh Kapoor');
  const [eventTitle, setEventTitle] = useState('Royal Palace Wedding Coverage & Live QR');
  const [includeGst18, setIncludeGst18] = useState(true);
  const [upiId, setUpiId] = useState('pixelfotos.studio@okaxis');
  const [draftItems, setDraftItems] = useState<InvoiceLineItem[]>([
    {
      id: 'd_1',
      service: 'Pre-Wedding Editorial Shoot',
      description: 'Heritage venue + LUT grading',
      qty: 1,
      rateInr: 45000,
    },
    {
      id: 'd_2',
      service: 'Candid Photography & AI Face Match',
      description: '2 Shooters + C-to-C Live Gallery',
      qty: 2,
      rateInr: 38000,
    },
    {
      id: 'd_3',
      service: '4K Drone & Traditional Video',
      description: 'Full ceremony + cinematic highlight film',
      qty: 2,
      rateInr: 28000,
    },
  ]);

  const activeDoc = useMemo(
    () => documents.find((d) => d.id === selectedDocId) || documents[0],
    [documents, selectedDocId]
  );

  const activeTotals = useMemo(
    () => (activeDoc ? computeDocTotals(activeDoc) : null),
    [activeDoc]
  );

  const upiUri = useMemo(() => {
    if (!activeDoc || !activeTotals) return '';
    const amount = activeTotals.balanceDue > 0 ? activeTotals.balanceDue : activeTotals.grandTotal;
    return `upi://pay?pa=${encodeURIComponent(
      activeDoc.upiId
    )}&pn=${encodeURIComponent(deliveryConfig.studioName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      `${activeDoc.docNumber} ${activeDoc.clientName}`
    )}`;
  }, [activeDoc, activeTotals, deliveryConfig.studioName]);

  const handleAddDraftRow = () => {
    setDraftItems((prev) => [
      ...prev,
      {
        id: `d_${Date.now()}`,
        service: 'Italian Linen Layflat Album',
        description: '40 thick spreads + AI retouch',
        qty: 1,
        rateInr: 22000,
      },
    ]);
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || draftItems.length === 0) return;
    const num = `QT-2026-${Math.floor(110 + Math.random() * 880)}`;
    addQuotation({
      docNumber: num,
      clientId: clients[0]?.id || 'cli_custom',
      clientName: clientName.trim(),
      eventTitle: eventTitle.trim(),
      stage: 'Quotation',
      status: 'Sent',
      includeGst18,
      items: draftItems,
      advancePaidInr: 0,
      upiId: upiId.trim() || 'pixelfotos.studio@okaxis',
    });
    setShowNewModal(false);
    setUpiNotice(`Created itemized quotation ${num} for ${clientName}.`);
  };

  const handleCopyUpi = async () => {
    if (!upiUri) return;
    try {
      await navigator.clipboard.writeText(upiUri);
      setUpiNotice('Copied UPI payment deep link to clipboard.');
    } catch {
      setUpiNotice(`UPI Link: ${upiUri}`);
    }
  };

  const handleExportPdf = async () => {
    if (!activeDoc || !activeTotals) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // A4 Dark Header Banner
    pdf.setFillColor(9, 11, 16);
    pdf.rect(0, 0, 210, 36, 'F');
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(18);
    pdf.text(deliveryConfig.studioName.toUpperCase(), 14, 16);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text(`PixelFotos Studio OS · ${activeDoc.stage.toUpperCase()} (${activeDoc.status})`, 14, 24);
    pdf.text(`#${activeDoc.docNumber} · ${activeDoc.createdAt}`, 145, 24);

    pdf.setTextColor(20, 20, 20);
    pdf.setFontSize(11);
    pdf.text(`Billed To: ${activeDoc.clientName}`, 14, 48);
    pdf.setFontSize(10);
    pdf.setTextColor(90, 90, 90);
    pdf.text(`Event: ${activeDoc.eventTitle}`, 14, 55);

    let y = 68;
    pdf.setFillColor(245, 244, 240);
    pdf.rect(14, y - 5, 182, 8, 'F');
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(9.5);
    pdf.text('SERVICE & DELIVERABLES', 16, y);
    pdf.text('QTY', 124, y);
    pdf.text('RATE (INR)', 142, y);
    pdf.text('AMOUNT (INR)', 170, y);
    y += 9;

    activeDoc.items.forEach((item) => {
      pdf.setTextColor(20, 20, 20);
      pdf.setFontSize(10);
      pdf.text(item.service.slice(0, 50), 16, y);
      pdf.text(String(item.qty), 126, y);
      pdf.text(item.rateInr.toLocaleString('en-IN'), 142, y);
      pdf.text((item.qty * item.rateInr).toLocaleString('en-IN'), 170, y);
      y += 5;
      pdf.setFontSize(8.5);
      pdf.setTextColor(110, 110, 110);
      pdf.text(item.description.slice(0, 72), 16, y);
      y += 7;
    });

    y += 4;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(14, y, 196, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Subtotal:`, 130, y);
    pdf.text(`INR ${activeTotals.subtotal.toLocaleString('en-IN')}`, 168, y);
    y += 6;
    if (activeDoc.includeGst18) {
      pdf.text(`GST (18%):`, 130, y);
      pdf.text(`INR ${activeTotals.gst.toLocaleString('en-IN')}`, 168, y);
      y += 6;
    }
    pdf.setTextColor(20, 20, 20);
    pdf.setFontSize(11);
    pdf.text(`Grand Total:`, 130, y);
    pdf.text(`INR ${activeTotals.grandTotal.toLocaleString('en-IN')}`, 168, y);
    y += 6;
    pdf.setTextColor(16, 145, 95);
    pdf.setFontSize(10);
    pdf.text(`Advance / Paid:`, 130, y);
    pdf.text(`INR ${activeDoc.advancePaidInr.toLocaleString('en-IN')}`, 168, y);
    y += 7;
    pdf.setTextColor(181, 142, 36);
    pdf.setFontSize(12);
    pdf.text(`Balance Due:`, 130, y);
    pdf.text(`INR ${activeTotals.balanceDue.toLocaleString('en-IN')}`, 168, y);

    // Embed scannable UPI Payment QR inside A4 PDF
    try {
      const qrDataUrl = await QRCode.toDataURL(upiUri, { width: 240, margin: 1 });
      const qrY = Math.min(235, y + 12);
      pdf.addImage(qrDataUrl, 'PNG', 14, qrY, 36, 36);
      pdf.setTextColor(20, 20, 20);
      pdf.setFontSize(10);
      pdf.text('Scan to Pay Instant UPI (0% Fee)', 54, qrY + 10);
      pdf.setFontSize(9);
      pdf.setTextColor(90, 90, 90);
      pdf.text(`UPI ID: ${activeDoc.upiId}`, 54, qrY + 17);
      pdf.text(`Payable: INR ${(activeTotals.balanceDue > 0 ? activeTotals.balanceDue : activeTotals.grandTotal).toLocaleString('en-IN')}`, 54, qrY + 23);
    } catch {
      // fallback text if QR fails
    }

    pdf.save(`${activeDoc.docNumber}_${activeDoc.clientName.replace(/\s+/g, '_')}.pdf`);
    setUpiNotice(`Generated & downloaded A4 PDF (${activeDoc.docNumber}.pdf) with embedded scannable UPI QR.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
            Module 07 · Studio Cashflow
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-editorial font-semibold text-zinc-900 dark:text-white tracking-tight">
            Billing, Quotation &amp; UPI Payment QR
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Draft itemized wedding quotations, convert approved quotes to GST invoices in one click, and collect instant balance payments via dynamic UPI QR codes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-full liquid-glass-subtle text-xs font-mono">
            Ledger Collected:{' '}
            <span className="ml-1.5 font-semibold text-[#10B981] tabular-nums">
              ₹{totalCollectedRevenueInr.toLocaleString('en-IN')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </button>
        </div>
      </div>

      {upiNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[18px] border border-[#10B981]/35 bg-[#10B981]/12 backdrop-blur-md text-sm text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{upiNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setUpiNotice(null)}
            className="min-h-[36px] px-2.5 text-xs font-mono uppercase tracking-wider cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* New Quotation Builder Bottom Sheet Modal */}
      <BottomSheetModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create Itemized Studio Quotation"
        subtitle="Module 07 · Studio Billing & GST"
        maxWidthClass="md:max-w-3xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleAddDraftRow}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full liquid-glass-subtle text-xs font-semibold text-[#B58E24] dark:text-[#D4AF37] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
            <button
              type="submit"
              form="billing-new-quote-form"
              className="flex-1 sm:flex-none min-h-[46px] px-6 py-2.5 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] shadow-sm transition cursor-pointer"
            >
              Save Quotation
            </button>
          </div>
        }
      >
        <form
          id="billing-new-quote-form"
          onSubmit={handleCreateQuotation}
          className="space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Tax &amp; Recipient Details
            </span>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer min-h-[36px]">
              <input
                type="checkbox"
                checked={includeGst18}
                onChange={(e) => setIncludeGst18(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37]"
              />
              Include 18% GST
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Client / Couple Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Event Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Studio UPI ID (e.g. studio@okaxis)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm font-mono text-zinc-900 dark:text-white"
            />
          </div>

          <div className="space-y-3">
            {draftItems.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-[18px] liquid-glass-subtle sm:p-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none"
              >
                <input
                  type="text"
                  value={item.service}
                  onChange={(e) =>
                    setDraftItems((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, service: e.target.value } : row))
                    )
                  }
                  placeholder="Service"
                  className="sm:col-span-5 min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs text-zinc-900 dark:text-white"
                />
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    setDraftItems((prev) =>
                      prev.map((row, i) =>
                        i === idx ? { ...row, description: e.target.value } : row
                      )
                    )
                  }
                  placeholder="Deliverables"
                  className="sm:col-span-3 min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs text-zinc-900 dark:text-white"
                />
                <div className="grid grid-cols-12 sm:contents gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) =>
                      setDraftItems((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, qty: Math.max(1, Number(e.target.value)) } : row
                        )
                      )
                    }
                    className="col-span-4 sm:col-span-1 min-h-[42px] px-2.5 py-2 rounded-xl liquid-input text-xs font-mono text-zinc-900 dark:text-white"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.rateInr}
                    onChange={(e) =>
                      setDraftItems((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, rateInr: Math.max(0, Number(e.target.value)) } : row
                        )
                      )
                    }
                    className="col-span-6 sm:col-span-2 min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs font-mono text-zinc-900 dark:text-white tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDraftItems((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label="Remove line item"
                    className="col-span-2 sm:col-span-1 min-h-[42px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </form>
      </BottomSheetModal>

      {/* Main Split: Document List + Live Invoice & UPI QR */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Quotations & Invoices List */}
        <div className="xl:col-span-4 space-y-3">
          {documents.map((doc) => {
            const totals = computeDocTotals(doc);
            const selected = activeDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`rounded-[22px] p-4 sm:p-5 cursor-pointer transition ${
                  selected
                    ? 'liquid-glass border-[#D4AF37] ring-1 ring-[#D4AF37]/40'
                    : 'liquid-glass-subtle hover:border-[#D4AF37]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-[#B58E24] dark:text-[#D4AF37]">
                    {doc.docNumber} · {doc.stage}
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      doc.status === 'Paid'
                        ? 'text-[#10B981]'
                        : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <p className="mt-1.5 font-semibold text-zinc-900 dark:text-white">
                  {doc.clientName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {doc.eventTitle}
                </p>
                <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Total ₹{totals.grandTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    Due ₹{totals.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Document + UPI Payment QR */}
        {activeDoc && activeTotals && (
          <div className="xl:col-span-8 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Invoice Breakdown */}
            <div className="lg:col-span-7 rounded-[24px] liquid-glass p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      {activeDoc.docNumber} · {activeDoc.stage}
                    </span>
                  </div>
                  <h3 className="mt-1 text-xl font-editorial font-semibold text-zinc-900 dark:text-white">
                    {activeDoc.clientName}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {activeDoc.eventTitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeDoc.stage === 'Quotation' && (
                    <button
                      type="button"
                      onClick={() => {
                        convertQuotationToInvoice(activeDoc.id);
                        setUpiNotice(`Converted ${activeDoc.docNumber} into a GST Invoice.`);
                      }}
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-1.5 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
                    >
                      Convert → Invoice
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-1.5 rounded-full text-xs font-medium border border-black/15 dark:border-white/15 text-zinc-700 dark:text-zinc-200 hover:border-[#D4AF37] cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Export PDF
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {activeDoc.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-2 border-b border-black/5 dark:border-white/8"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {item.service}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.description} · Qty {item.qty} × ₹
                        {item.rateInr.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-medium text-zinc-900 dark:text-white tabular-nums shrink-0">
                      ₹{(item.qty * item.rateInr).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-[18px] liquid-glass-subtle p-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    ₹{activeTotals.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {activeDoc.includeGst18 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>GST (18%)</span>
                    <span className="font-mono tabular-nums">
                      ₹{activeTotals.gst.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-zinc-900 dark:text-white pt-1.5 border-t border-black/10 dark:border-white/10">
                  <span>Grand Total</span>
                  <span className="font-mono tabular-nums">
                    ₹{activeTotals.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#10B981]">
                  <span>Advance / Paid</span>
                  <span className="font-mono tabular-nums">
                    ₹{activeDoc.advancePaidInr.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#B58E24] dark:text-[#D4AF37] pt-1.5 border-t border-black/10 dark:border-white/10">
                  <span>Balance Due</span>
                  <span className="font-mono tabular-nums">
                    ₹{activeTotals.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Scannable UPI Payment QR Panel */}
            <div className="lg:col-span-5 rounded-[24px] liquid-glass border-[#D4AF37]/35 p-5 sm:p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5 text-[#B58E24] dark:text-[#D4AF37]">
                  <QrCode className="w-3.5 h-3.5" />
                  BHIM / GPay / PhonePe
                </span>
                <span>0% Fee UPI</span>
              </div>

              <QrCodeCanvas
                value={upiUri}
                size={188}
                alt={`UPI QR for ${activeDoc.docNumber}`}
              />

              <div>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  Payable to <span className="text-zinc-900 dark:text-white">{activeDoc.upiId}</span>
                </p>
                <p className="mt-1 text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                  ₹
                  {(activeTotals.balanceDue > 0
                    ? activeTotals.balanceDue
                    : activeTotals.grandTotal
                  ).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="w-full space-y-2.5">
                <a
                  href={upiUri}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] hover:opacity-90 transition"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Pay via UPI App Link
                </a>

                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-full text-xs font-medium border border-black/15 dark:border-white/15 text-zinc-700 dark:text-zinc-300 hover:border-[#D4AF37] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy UPI Payment Link
                </button>

                {activeDoc.status !== 'Paid' ? (
                  <button
                    type="button"
                    onClick={() => {
                      markInvoicePaid(activeDoc.id);
                      setUpiNotice(
                        `${activeDoc.docNumber} marked Paid & synced to Module 6 Net Profit Ledger.`
                      );
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Paid &amp; Sync Ledger
                  </button>
                ) : (
                  <div className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    <FileText className="w-3.5 h-3.5" />
                    Settled &amp; Synced to Profit Ledger
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
