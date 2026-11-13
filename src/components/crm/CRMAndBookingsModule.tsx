import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  AlertCircle,
  Send,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../hooks/useAuth';
import { calculateGSTInvoice } from '../../utils/studioLogic';
import { PaymentVerificationService } from '../../services/paymentService';
import { BookingRecord, InvoiceRecord } from '../../types';

interface CRMAndBookingsModuleProps {
  initialSection?: 'clients' | 'bookings' | 'invoices';
}

export const CRMAndBookingsModule: React.FC<CRMAndBookingsModuleProps> = ({
  initialSection = 'clients',
}) => {
  const {
    studio,
    clients,
    addClient,
    deleteClient,
    bookings,
    addBooking,
    updateBookingStatus,
    invoices,
    addInvoice,
    updateInvoice,
  } = useAuth();

  const [section, setSection] = useState<'clients' | 'bookings' | 'invoices'>(initialSection);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFeedback, setStatusFeedback] = useState<string>('');

  // New Client form state
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEventDate, setClientEventDate] = useState<string>('2026-12-18');
  const [clientDetails, setClientDetails] = useState<string>('');

  // New Booking form state
  const [bkClientName, setBkClientName] = useState<string>('');
  const [bkType, setBkType] = useState<BookingRecord['bookingType']>('Wedding');
  const [bkDate, setBkDate] = useState<string>('2026-12-22');
  const [bkLocation, setBkLocation] = useState<string>('');
  const [bkPhotographer, setBkPhotographer] = useState<string>('Julian Vance (Lead)');
  const [bkEditor, setBkEditor] = useState<string>('Meera Krishnan (Senior Colorist)');
  const [bkAmount, setBkAmount] = useState<number>(280000);

  // New Invoice form state
  const [invClientName, setInvClientName] = useState<string>('');
  const [invClientGstin, setInvClientGstin] = useState<string>('27AADCS2290K1Z2');
  const [invDescription, setInvDescription] = useState<string>(
    'Wedding Photography & Fine-Art Album Package'
  );
  const [invAmount, setInvAmount] = useState<number>(220000);
  const [invAdvance, setInvAdvance] = useState<number>(100000);

  // Payment Verification Modal state
  const [verifyingInvoice, setVerifyingInvoice] = useState<InvoiceRecord | null>(null);
  const [utrReference, setUtrReference] = useState<string>('UTR_2026884920');
  const [verifyError, setVerifyError] = useState<string>('');

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectDetails.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;
    addClient({
      name: clientName.trim(),
      email: clientEmail.trim(),
      phone: clientPhone.trim() || '+91 98200 00000',
      whatsapp: (clientPhone.trim() || '+919820000000').replace(/\s+/g, ''),
      address: 'Mumbai, Maharashtra',
      eventDate: clientEventDate,
      projectDetails: clientDetails.trim() || 'Bespoke Wedding Commission',
      notes: 'Added via Studio CRM',
      followUpDate: clientEventDate,
      totalBilled: 250000,
      totalPaid: 100000,
    });
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientDetails('');
    setStatusFeedback('Created new client CRM profile.');
  };

  const handleAddBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bkClientName.trim() || !bkLocation.trim()) return;
    addBooking({
      clientId: clients[0]?.id || 'client_01',
      clientName: bkClientName.trim(),
      bookingType: bkType,
      eventDate: bkDate,
      location: bkLocation.trim(),
      assignedPhotographer: bkPhotographer,
      assignedEditor: bkEditor,
      status: 'confirmed',
      packageAmount: Number(bkAmount) || 150000,
      notes: 'Confirmed in Studio Booking Calendar',
    });
    setBkClientName('');
    setBkLocation('');
    setStatusFeedback('Scheduled new event booking and assigned crew.');
  };

  const handleAddInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invClientName.trim() || !invDescription.trim()) return;
    const invNum = `INV-2026-${Math.floor(100 + Math.random() * 899)}`;
    addInvoice({
      invoiceNumber: invNum,
      clientId: clients[0]?.id || 'client_01',
      clientName: invClientName.trim(),
      clientGstin: invClientGstin.trim(),
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: '2026-12-30',
      gstRatePercent: 18,
      advancePaid: Number(invAdvance) || 0,
      status: Number(invAdvance) > 0 ? 'partially_paid' : 'unpaid',
      items: [
        {
          id: `li_${Date.now()}`,
          description: invDescription.trim(),
          quantity: 1,
          unitPrice: Number(invAmount) || 100000,
        },
      ],
    });
    setInvClientName('');
    setStatusFeedback(`Generated GST tax invoice ${invNum}.`);
  };

  const handleDownloadInvoicePdf = (inv: InvoiceRecord) => {
    const calc = calculateGSTInvoice(
      inv.items,
      inv.gstRatePercent,
      inv.advancePaid,
      Boolean(inv.paymentTransactionId)
    );
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(studio.studioName, 20, 24);
    doc.setFontSize(10);
    doc.text(`Studio GSTIN: ${studio.gstNumber} | Email: ${studio.email}`, 20, 32);
    doc.setFontSize(14);
    doc.text(`TAX INVOICE: ${inv.invoiceNumber}`, 20, 46);
    doc.setFontSize(10);
    doc.text(`Billed To: ${inv.clientName} (Client GSTIN: ${inv.clientGstin || 'N/A'})`, 20, 56);
    doc.text(`Issue Date: ${inv.issueDate} | Due Date: ${inv.dueDate}`, 20, 63);

    let y = 78;
    doc.text('Description', 20, y);
    doc.text('Amount (INR)', 155, y);
    y += 8;
    inv.items.forEach((item) => {
      doc.text(`${item.description.slice(0, 62)} (x${item.quantity})`, 20, y);
      doc.text(`Rs. ${(item.quantity * item.unitPrice).toLocaleString('en-IN')}`, 155, y);
      y += 8;
    });

    y += 6;
    doc.text(`Subtotal: Rs. ${calc.subtotal.toLocaleString('en-IN')}`, 125, y);
    y += 7;
    doc.text(`CGST (9%): Rs. ${calc.cgstAmount.toLocaleString('en-IN')}`, 125, y);
    y += 7;
    doc.text(`SGST (9%): Rs. ${calc.sgstAmount.toLocaleString('en-IN')}`, 125, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Grand Total: Rs. ${calc.grandTotal.toLocaleString('en-IN')}`, 125, y);
    y += 7;
    doc.setFontSize(10);
    doc.text(`Advance Paid: Rs. ${calc.advancePaid.toLocaleString('en-IN')}`, 125, y);
    y += 7;
    doc.text(`Balance Due: Rs. ${calc.balanceDue.toLocaleString('en-IN')}`, 125, y);
    y += 10;
    doc.text(
      `Payment Status: ${calc.derivedStatus.toUpperCase()} ${
        inv.paymentTransactionId ? `(Verified Ref: ${inv.paymentTransactionId})` : ''
      }`,
      20,
      y
    );

    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  const handleConfirmPaymentVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingInvoice) return;
    const calc = calculateGSTInvoice(
      verifyingInvoice.items,
      verifyingInvoice.gstRatePercent,
      verifyingInvoice.advancePaid,
      false
    );
    const res = await PaymentVerificationService.verifyTransactionReference(
      verifyingInvoice.id,
      utrReference,
      calc.grandTotal
    );
    if (!res.verified) {
      setVerifyError(res.message);
      return;
    }
    updateInvoice(verifyingInvoice.id, {
      advancePaid: calc.grandTotal,
      status: 'paid',
      paymentTransactionId: res.transactionId,
      verifiedAt: res.verifiedAt,
    });
    setVerifyingInvoice(null);
    setVerifyError('');
    setStatusFeedback(res.message);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Sub-navigation bar */}
      <div className="bg-[#0F1624] border border-amber-500/25 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSection('clients')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              section === 'clients'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            CRM &amp; Client Profiles ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('bookings')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              section === 'bookings'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Shoot Calendar &amp; Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('invoices')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              section === 'invoices'
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            GST Invoices &amp; WhatsApp Reminders ({invoices.length})
          </button>
        </div>

        {statusFeedback && (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{statusFeedback}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: CRM & CLIENTS */}
      {section === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                  MODULE H · STUDIO CRM &amp; CLIENT LEDGER
                </p>
                <h3 className="text-xl font-serif-editorial font-semibold text-white">
                  Studio Client Directory &amp; Balance Tracker
                </h3>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients or events..."
                  aria-label="Search clients"
                  className="pl-9 pr-3.5 py-2 text-xs bg-[#0B0F17] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-[#0B0F17]">
              {filteredClients.map((client) => {
                const pendingBalance = Math.max(0, client.totalBilled - client.totalPaid);
                const waReminderUrl = `https://wa.me/${client.whatsapp.replace(
                  /[^0-9]/g,
                  ''
                )}?text=${encodeURIComponent(
                  `Greetings ${client.name}, this is a polite reminder from ${studio.studioName} regarding your upcoming wedding commission (${client.projectDetails}). Total Package: Rs. ${client.totalBilled.toLocaleString('en-IN')} | Advance Received: Rs. ${client.totalPaid.toLocaleString('en-IN')} | Pending Balance: Rs. ${pendingBalance.toLocaleString('en-IN')}.`
                )}`;

                return (
                  <div
                    key={client.id}
                    className="p-4 hover:bg-[#131B2E] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span>{client.name}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-mono text-amber-300 tabular-nums">
                          Event: {client.eventDate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{client.projectDetails}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{client.email}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{client.phone}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums text-emerald-400">
                          Advance Paid: ₹{client.totalPaid.toLocaleString('en-IN')}
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums text-amber-300">
                          Pending: ₹{pendingBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={waReminderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>WhatsApp Reminder</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteClient(client.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                        aria-label={`Delete client ${client.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleAddClientSubmit}
            className="lg:col-span-4 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-3.5 text-xs"
          >
            <div className="flex items-center gap-2 text-base font-semibold text-amber-200">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Add New Client Profile</span>
            </div>

            <div>
              <label htmlFor="crm-client-name" className="block font-medium text-slate-300 mb-1">
                Client / Couple Name
              </label>
              <input
                id="crm-client-name"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Rhea & Siddharth"
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="crm-client-email" className="block font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                id="crm-client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="rhea@example.com"
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="crm-client-phone" className="block font-medium text-slate-300 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  id="crm-client-phone"
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98201..."
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label htmlFor="crm-client-date" className="block font-medium text-slate-300 mb-1">
                  Primary Event Date
                </label>
                <input
                  id="crm-client-date"
                  type="date"
                  value={clientEventDate}
                  onChange={(e) => setClientEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="crm-client-details" className="block font-medium text-slate-300 mb-1">
                Commission Scope &amp; Deliverables
              </label>
              <textarea
                id="crm-client-details"
                rows={3}
                value={clientDetails}
                onChange={(e) => setClientDetails(e.target.value)}
                placeholder="2-Day Palace Wedding + Pre-wedding shoot..."
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-xl"
            >
              Save Client Profile
            </button>
          </form>
        </div>
      )}

      {/* SECTION 2: BOOKINGS & CALENDAR */}
      {section === 'bookings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-serif-editorial font-semibold text-white">
              Shoot Bookings &amp; Crew Assignment Schedule
            </h3>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-[#0B0F17]">
              {bookings.map((bk) => (
                <div
                  key={bk.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span>{bk.clientName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs font-normal text-amber-300">{bk.bookingType}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      <span className="font-mono tabular-nums">Date: {bk.eventDate}</span>
                      <span>·</span>
                      <span>{bk.location}</span>
                      <span>·</span>
                      <span className="font-mono text-emerald-400 tabular-nums">
                        ₹{bk.packageAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Lead: <strong>{bk.assignedPhotographer}</strong> · Editor:{' '}
                      <strong>{bk.assignedEditor}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Booking Status"
                      value={bk.status}
                      onChange={(e) =>
                        updateBookingStatus(bk.id, e.target.value as BookingRecord['status'])
                      }
                      className="px-3 py-1.5 text-xs bg-[#131B2E] border border-amber-500/30 rounded-lg font-medium text-amber-200"
                    >
                      <option value="inquiry">Inquiry</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleAddBookingSubmit}
            className="lg:col-span-4 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-3.5 text-xs"
          >
            <div className="flex items-center gap-2 text-base font-semibold text-amber-200">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Schedule Event Booking</span>
            </div>

            <div>
              <label htmlFor="bk-client-name" className="block font-medium text-slate-300 mb-1">
                Client Name
              </label>
              <input
                id="bk-client-name"
                type="text"
                value={bkClientName}
                onChange={(e) => setBkClientName(e.target.value)}
                placeholder="e.g. Tara & Dev"
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="bk-type" className="block font-medium text-slate-300 mb-1">
                  Event Type
                </label>
                <select
                  id="bk-type"
                  value={bkType}
                  onChange={(e) => setBkType(e.target.value as BookingRecord['bookingType'])}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Destination Wedding">Destination Wedding</option>
                  <option value="Pre-Wedding">Pre-Wedding</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Editorial Portrait">Editorial Portrait</option>
                </select>
              </div>
              <div>
                <label htmlFor="bk-date" className="block font-medium text-slate-300 mb-1">
                  Event Date
                </label>
                <input
                  id="bk-date"
                  type="date"
                  value={bkDate}
                  onChange={(e) => setBkDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bk-location" className="block font-medium text-slate-300 mb-1">
                Venue &amp; City
              </label>
              <input
                id="bk-location"
                type="text"
                value={bkLocation}
                onChange={(e) => setBkLocation(e.target.value)}
                placeholder="Rambagh Palace, Jaipur"
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="bk-photog" className="block font-medium text-slate-300 mb-1">
                  Assign Photographer
                </label>
                <input
                  id="bk-photog"
                  type="text"
                  value={bkPhotographer}
                  onChange={(e) => setBkPhotographer(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label htmlFor="bk-amount" className="block font-medium text-slate-300 mb-1">
                  Package Fee (INR)
                </label>
                <input
                  id="bk-amount"
                  type="number"
                  value={bkAmount}
                  onChange={(e) => setBkAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-xl"
            >
              Confirm Booking &amp; Crew
            </button>
          </form>
        </div>
      )}

      {/* SECTION 3: GST INVOICES & WHATSAPP PAYMENT REMINDERS */}
      {section === 'invoices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-serif-editorial font-semibold text-white">
              GST Tax Invoices, Advance Balances &amp; WhatsApp Payment Reminders
            </h3>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-[#0B0F17]">
              {invoices.map((inv) => {
                const calc = calculateGSTInvoice(
                  inv.items,
                  inv.gstRatePercent,
                  inv.advancePaid,
                  Boolean(inv.paymentTransactionId)
                );
                const waInvoiceReminderUrl = `https://wa.me/${studio.whatsapp.replace(
                  /[^0-9]/g,
                  ''
                )}?text=${encodeURIComponent(
                  `Dear ${inv.clientName}, greetings from ${studio.studioName}. Here is the payment summary for GST Invoice ${inv.invoiceNumber} (${inv.items[0]?.description || 'Wedding Package'}):\n• Grand Total (incl. 18% GST): Rs. ${calc.grandTotal.toLocaleString('en-IN')}\n• Advance Paid: Rs. ${calc.advancePaid.toLocaleString('en-IN')}\n• Balance Due: Rs. ${calc.balanceDue.toLocaleString('en-IN')} (Due by ${inv.dueDate}).`
                )}`;

                return (
                  <div
                    key={inv.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span className="font-mono text-amber-300">{inv.invoiceNumber}</span>
                        <span className="text-slate-600">·</span>
                        <span>{inv.clientName}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-medium text-emerald-400 uppercase">
                          {calc.derivedStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-300">{inv.items[0]?.description}</p>
                      <div className="font-mono text-slate-400 tabular-nums flex flex-wrap items-center gap-2">
                        <span>Subtotal: ₹{calc.subtotal.toLocaleString('en-IN')}</span>
                        <span>·</span>
                        <span>GST (18%): ₹{calc.totalGstAmount.toLocaleString('en-IN')}</span>
                        <span>·</span>
                        <strong className="text-white">
                          Total: ₹{calc.grandTotal.toLocaleString('en-IN')}
                        </strong>
                        <span>·</span>
                        <span className="text-emerald-400">
                          Advance: ₹{calc.advancePaid.toLocaleString('en-IN')}
                        </span>
                        <span>·</span>
                        <span className="text-amber-300 font-bold">
                          Pending: ₹{calc.balanceDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {inv.paymentTransactionId && (
                        <p className="text-[11px] font-mono text-emerald-400">
                          Verified Settlement Ref: {inv.paymentTransactionId}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={waInvoiceReminderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp Reminder</span>
                      </a>

                      {calc.derivedStatus !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyingInvoice(inv);
                            setVerifyError('');
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] rounded-lg inline-flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify Settlement</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoicePdf(inv)}
                        className="px-3 py-1.5 text-xs font-medium bg-[#131B2E] border border-slate-700 rounded-lg text-slate-200 hover:text-white inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Invoice PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleAddInvoiceSubmit}
            className="lg:col-span-4 bg-[#0F1624] border border-amber-500/25 rounded-2xl p-6 space-y-3.5 text-xs"
          >
            <div className="flex items-center gap-2 text-base font-semibold text-amber-200">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Generate GST Invoice / Quotation</span>
            </div>

            <div>
              <label htmlFor="inv-client-name" className="block font-medium text-slate-300 mb-1">
                Billed Client Name
              </label>
              <input
                id="inv-client-name"
                type="text"
                value={invClientName}
                onChange={(e) => setInvClientName(e.target.value)}
                placeholder="e.g. Aanya Mehra"
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="inv-gstin" className="block font-medium text-slate-300 mb-1">
                Client GSTIN (Optional)
              </label>
              <input
                id="inv-gstin"
                type="text"
                value={invClientGstin}
                onChange={(e) => setInvClientGstin(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label htmlFor="inv-desc" className="block font-medium text-slate-300 mb-1">
                Line Item Description
              </label>
              <input
                id="inv-desc"
                type="text"
                value={invDescription}
                onChange={(e) => setInvDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="inv-amount" className="block font-medium text-slate-300 mb-1">
                  Base Fee (Excl. 18% GST)
                </label>
                <input
                  id="inv-amount"
                  type="number"
                  value={invAmount}
                  onChange={(e) => setInvAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
              <div>
                <label htmlFor="inv-advance" className="block font-medium text-slate-300 mb-1">
                  Advance Received (INR)
                </label>
                <input
                  id="inv-advance"
                  type="number"
                  value={invAdvance}
                  onChange={(e) => setInvAdvance(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] font-bold rounded-xl inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Official GST Invoice</span>
            </button>
          </form>
        </div>
      )}

      {/* Payment Verification Modal */}
      {verifyingInvoice && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-verify-title"
        >
          <div className="bg-[#0F1624] border border-amber-500/35 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100">
            <h3 id="payment-verify-title" className="text-lg font-semibold text-white">
              Verify Gateway / Bank UTR Settlement
            </h3>
            <p className="text-xs text-slate-300">
              Verify payment reference for <strong>{verifyingInvoice.invoiceNumber}</strong>.
            </p>
            <form onSubmit={handleConfirmPaymentVerification} className="space-y-3">
              <div>
                <label htmlFor="utr-input" className="block text-xs font-medium text-slate-300 mb-1">
                  Gateway / Bank Settlement Reference (UTR_ / RZP_ / STRP_)
                </label>
                <input
                  id="utr-input"
                  type="text"
                  value={utrReference}
                  onChange={(e) => setUtrReference(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              {verifyError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{verifyError}</span>
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingInvoice(null)}
                  className="px-3.5 py-2 text-xs border border-slate-700 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F17] rounded-lg"
                >
                  Verify &amp; Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
