import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileDown,
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
    updateDocument,
    deleteDocument,
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
  const [upiId, setUpiId] = useState(deliveryConfig.upiId || 'pixelfotos.studio@okaxis');
  const [payeeName, setPayeeName] = useState(
    deliveryConfig.upiPayeeName || deliveryConfig.studioName
  );
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

  const effectivePayeeName =
    activeDoc?.payeeName || deliveryConfig.upiPayeeName || deliveryConfig.studioName;

  const payableAmountInr = useMemo(() => {
    if (!activeTotals) return 0;
    return activeTotals.balanceDue > 0 ? activeTotals.balanceDue : activeTotals.grandTotal;
  }, [activeTotals]);

  const upiUri = useMemo(() => {
    if (!activeDoc || !activeTotals) return '';
    return `upi://pay?pa=${encodeURIComponent(
      activeDoc.upiId
    )}&pn=${encodeURIComponent(effectivePayeeName)}&am=${payableAmountInr}&cu=INR&tn=${encodeURIComponent(
      `${activeDoc.docNumber} ${activeDoc.clientName}`
    )}`;
  }, [activeDoc, activeTotals, effectivePayeeName, payableAmountInr]);

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
      payeeName: payeeName.trim() || deliveryConfig.studioName,
    });
    setShowNewModal(false);
    setUpiNotice(`Created itemized quotation ${num} for ${clientName}.`);
  };

  const handleCopyText = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setUpiNotice(`Copied ${label} (${text}) to clipboard.`);
    } catch {
      setUpiNotice(`${label}: ${text}`);
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
    pdf.text(`PixelFotos Studio · ${activeDoc.stage.toUpperCase()} (${activeDoc.status})`, 14, 24);
    pdf.text(`#${activeDoc.docNumber} · ${activeDoc.createdAt}`, 145, 24);

    pdf.setTextColor(20, 20, 20);
    pdf.setFontSize(11);
    pdf.text(`Client: ${activeDoc.clientName}`, 14, 48);
    pdf.setFontSize(10);
    pdf.setTextColor(90, 90, 90);
    pdf.text(`Wedding / Event: ${activeDoc.eventTitle}`, 14, 55);

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
    pdf.text(`Advance Paid:`, 130, y);
    pdf.text(`INR ${activeDoc.advancePaidInr.toLocaleString('en-IN')}`, 168, y);
    y += 7;
    pdf.setTextColor(181, 142, 36);
    pdf.setFontSize(12);
    pdf.text(`Balance Due:`, 130, y);
    pdf.text(`INR ${activeTotals.balanceDue.toLocaleString('en-IN')}`, 168, y);

    // Embed scannable UPI Payment QR + Standard UPI Details inside A4 PDF
    try {
      const qrDataUrl = await QRCode.toDataURL(upiUri, { width: 240, margin: 1 });
      const qrY = Math.min(230, y + 12);
      pdf.addImage(qrDataUrl, 'PNG', 14, qrY, 36, 36);
      pdf.setTextColor(20, 20, 20);
      pdf.setFontSize(10.5);
      pdf.text('STANDARD UPI PAYMENT DETAILS (0% GATEWAY FEE)', 54, qrY + 8);
      pdf.setFontSize(9.5);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Payee Name: ${effectivePayeeName}`, 54, qrY + 15);
      pdf.text(`UPI ID (VPA): ${activeDoc.upiId}`, 54, qrY + 21);
      pdf.text(`Payable Amount: INR ${payableAmountInr.toLocaleString('en-IN')}`, 54, qrY + 27);
      pdf.text(`Reference: ${activeDoc.docNumber} (GPay / PhonePe / Paytm / BHIM)`, 54, qrY + 33);
    } catch {
      // fallback if QR fails
    }

    pdf.save(`${activeDoc.docNumber}_${activeDoc.clientName.replace(/\s+/g, '_')}.pdf`);
    setUpiNotice(`Downloaded clean client A4 PDF (${activeDoc.docNumber}.pdf) with UPI payment details.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
            Module 07 · Clean Client Billing &amp; Instant UPI
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-editorial font-semibold text-zinc-900 dark:text-white tracking-tight">
            Simple Quotations, Invoices &amp; UPI Payment Details
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Designed to be crystal-clear and easy to read for wedding clients—showing itemized deliverables alongside standard UPI payment details (UPI ID, Payee Name, Amount Due &amp; QR).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-full liquid-glass-subtle text-xs font-mono">
            Collected:{' '}
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

      {/* Document Selector Strip (Horizontal, Simple & Scannable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {documents.map((doc) => {
          const totals = computeDocTotals(doc);
          const selected = activeDoc?.id === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`rounded-[22px] p-4 cursor-pointer transition flex flex-col justify-between gap-3 ${
                selected
                  ? 'liquid-glass border-[#D4AF37] ring-1 ring-[#D4AF37]/40'
                  : 'liquid-glass-subtle hover:border-[#D4AF37]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-[#B58E24] dark:text-[#D4AF37]">
                    {doc.docNumber} · {doc.stage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        doc.status === 'Paid'
                          ? 'text-[#10B981]'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {doc.status}
                    </span>
                    {documents.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                        }}
                        aria-label={`Delete ${doc.docNumber}`}
                        className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 font-semibold text-zinc-900 dark:text-white truncate">
                  {doc.clientName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {doc.eventTitle}
                </p>
              </div>

              <div className="pt-2.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-mono tabular-nums">
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

      {/* Main Client-Readable Bill + Standard UPI Payment Card */}
      {activeDoc && activeTotals && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Ultra-Clean Client Quotation / Invoice Sheet */}
          <div className="xl:col-span-7 rounded-[26px] liquid-glass p-5 sm:p-7 space-y-6">
            {/* Sheet Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#B58E24] dark:text-[#D4AF37]">
                    {deliveryConfig.studioName} · {activeDoc.stage}
                  </span>
                </div>
                <h3 className="mt-1.5 text-2xl sm:text-3xl font-editorial font-semibold text-zinc-900 dark:text-white">
                  {activeDoc.clientName}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {activeDoc.eventTitle}
                </p>
                <p className="mt-1 text-xs font-mono text-zinc-500 tabular-nums">
                  Ref: {activeDoc.docNumber} · Date: {activeDoc.createdAt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeDoc.stage === 'Quotation' && (
                  <button
                    type="button"
                    onClick={() => {
                      convertQuotationToInvoice(activeDoc.id);
                      setUpiNotice(`Converted ${activeDoc.docNumber} into an official GST Invoice.`);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
                  >
                    Convert to Invoice
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold border border-black/15 dark:border-white/15 text-zinc-800 dark:text-zinc-200 hover:border-[#D4AF37] cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Download Client PDF
                </button>
              </div>
            </div>

            {/* Easy-to-Read Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-black/10 dark:border-white/10 text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="py-2.5 pr-3">Service &amp; Deliverables</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 pl-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/8">
                  {activeDoc.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3.5 pr-3">
                        <p className="font-semibold text-zinc-900 dark:text-white">
                          {item.service}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {item.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-zinc-700 dark:text-zinc-300 tabular-nums">
                        {item.qty}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-zinc-700 dark:text-zinc-300 tabular-nums">
                        ₹{item.rateInr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 pl-3 text-right font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                        ₹{(item.qty * item.rateInr).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Clear Totals Summary Block */}
            <div className="rounded-[20px] liquid-glass-subtle p-4 sm:p-5 space-y-2.5 text-sm">
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
              <div className="flex justify-between font-semibold text-zinc-900 dark:text-white pt-2 border-t border-black/10 dark:border-white/10">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums">
                  ₹{activeTotals.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#10B981]">
                <span>Advance Paid</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-mono">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={activeDoc.advancePaidInr}
                    onChange={(e) =>
                      updateDocument(activeDoc.id, {
                        advancePaidInr: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    aria-label="Advance paid amount in INR"
                    className="w-28 min-h-[34px] px-2.5 py-1 rounded-lg liquid-input text-right font-mono text-xs font-semibold text-[#10B981] tabular-nums"
                  />
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#B58E24] dark:text-[#D4AF37] pt-2 border-t border-black/10 dark:border-white/10">
                <span>Balance Due</span>
                <span className="font-mono tabular-nums">
                  ₹{activeTotals.balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Standard Client-Readable UPI Payment Details Card */}
          <div className="xl:col-span-5 rounded-[26px] liquid-glass border-[#D4AF37]/40 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3.5">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  Standard UPI Payment Details
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#10B981]">0% Gateway Fee</span>
            </div>

            {/* Scannable QR + Amount Banner */}
            <div className="rounded-[20px] liquid-glass-subtle p-4 flex flex-col items-center text-center space-y-3">
              <QrCodeCanvas
                value={upiUri}
                size={176}
                alt={`UPI QR for ${activeDoc.docNumber}`}
              />
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Scan with GPay · PhonePe · Paytm · BHIM
                </p>
                <p className="mt-1 text-2xl font-mono font-bold text-zinc-900 dark:text-white tabular-nums">
                  ₹{payableAmountInr.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Clear Standard UPI Details Table (Editable by Admin, Easy to Read for Client) */}
            <div className="rounded-[20px] liquid-glass-subtle p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  UPI Payee / Studio Name
                </label>
                <input
                  type="text"
                  value={effectivePayeeName}
                  onChange={(e) =>
                    updateDocument(activeDoc.id, { payeeName: e.target.value })
                  }
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-xl liquid-input text-xs font-semibold text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Official Studio UPI ID (VPA)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeDoc.upiId}
                    onChange={(e) =>
                      updateDocument(activeDoc.id, { upiId: e.target.value })
                    }
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl liquid-input text-xs font-mono font-semibold text-zinc-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeDoc.upiId, 'UPI ID')}
                    className="min-h-[38px] px-3 rounded-xl liquid-glass text-xs font-semibold text-[#B58E24] dark:text-[#D4AF37] hover:border-[#D4AF37] inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy ID
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/10 dark:border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    Invoice Reference
                  </span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                    {activeDoc.docNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    Payment Status
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      activeDoc.status === 'Paid' ? 'text-[#10B981]' : 'text-[#D4AF37]'
                    }`}
                  >
                    {activeDoc.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <a
                href={upiUri}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] hover:opacity-90 transition"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Open in UPI Payment App
              </a>

              <button
                type="button"
                onClick={() => handleCopyText(upiUri, 'UPI Payment Link')}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-full text-xs font-medium border border-black/15 dark:border-white/15 text-zinc-700 dark:text-zinc-300 hover:border-[#D4AF37] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Full UPI Payment Link
              </button>

              {activeDoc.status !== 'Paid' ? (
                <button
                  type="button"
                  onClick={() => {
                    markInvoicePaid(activeDoc.id);
                    setUpiNotice(
                      `${activeDoc.docNumber} marked Paid & synced to Studio Net Profit.`
                    );
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Invoice Paid
                </button>
              ) : (
                <div className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Payment Settled &amp; Verified
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Quotation Builder Bottom Sheet Modal */}
      <BottomSheetModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create Clean Client Quotation"
        subtitle="Module 07 · Simple Billing & Standard UPI"
        maxWidthClass="md:max-w-3xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleAddDraftRow}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full liquid-glass-subtle text-xs font-semibold text-[#B58E24] dark:text-[#D4AF37] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Service Line
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
              Client &amp; Standard UPI Details
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Client / Couple Name *"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Wedding / Event Title *"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Payee Name (e.g. PixelFotos Studio)"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
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
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-[18px] liquid-glass-subtle sm:p-0 sm:bg-transparent sm:border-0"
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
                    onClick={() => setDraftItems((prev) => prev.filter((_, i) => i !== idx))}
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
    </div>
  );
};
