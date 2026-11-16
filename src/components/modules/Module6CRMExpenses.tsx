import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  IndianRupee,
  MessageSquarePlus,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { CRMClient, LeadStatus, StudioExpense, TeamAssignment } from '../../types/pixelfotos';
import { BottomSheetModal } from '../shared/BottomSheetModal';

type CRMTab = 'clients' | 'team' | 'expenses';

const LEAD_STATUSES: LeadStatus[] = ['Inquiry', 'Booked', 'Editing', 'Delivered'];
const CREW_ROLES: TeamAssignment['role'][] = [
  'Lead Photographer',
  'Candid Shooter',
  'Cinematographer',
  'Album Editor',
];
const EXPENSE_CATEGORIES: StudioExpense['category'][] = [
  'Travel',
  'Food',
  'Freelancer Payouts',
  'Equipment Rental',
  'Studio Overhead',
];

export const Module6CRMExpenses: React.FC = () => {
  const {
    clients,
    addClient,
    updateClientStatus,
    addClientLog,
    teamAssignments,
    updateTeamProgress,
    addTeamAssignment,
    expenses,
    addExpense,
    microsite,
    totalCollectedRevenueInr,
    totalExpensesInr,
    totalPrintProfitInr,
    netProfitInr,
  } = usePixelFotos();

  const [tab, setTab] = useState<CRMTab>('clients');
  const [statusFilter, setStatusFilter] = useState<'All' | LeadStatus>('All');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [newLogNote, setNewLogNote] = useState('');

  // New Client Form State
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    eventDate: '2026-12-20',
    packageName: 'Signature Wedding + Live QR',
    packageValueInr: 185000,
    leadStatus: 'Inquiry' as LeadStatus,
  });

  // New Team Task State
  const [teamForm, setTeamForm] = useState({
    memberName: '',
    role: 'Candid Shooter' as TeamAssignment['role'],
    assignedEvent: microsite.coupleOrHostName,
    taskTitle: '',
    progressPercent: 25,
  });

  // New Expense State
  const [expenseForm, setExpenseForm] = useState({
    eventName: microsite.coupleOrHostName,
    category: 'Travel' as StudioExpense['category'],
    description: '',
    amountInr: 4500,
    date: new Date().toISOString().slice(0, 10),
  });

  const filteredClients = useMemo(() => {
    if (statusFilter === 'All') return clients;
    return clients.filter((c) => c.leadStatus === statusFilter);
  }, [clients, statusFilter]);

  const activeClient: CRMClient | undefined = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || filteredClients[0] || clients[0],
    [clients, filteredClients, selectedClientId]
  );

  const pipelineValueInr = useMemo(
    () => clients.reduce((sum, c) => sum + c.packageValueInr, 0),
    [clients]
  );

  const expenseBreakdown = useMemo(() => {
    const map = new Map<StudioExpense['category'], number>();
    EXPENSE_CATEGORIES.forEach((cat) => map.set(cat, 0));
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amountInr));
    return Array.from(map.entries());
  }, [expenses]);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;
    addClient({
      name: clientForm.name.trim(),
      phone: clientForm.phone.trim() || '+91 98200 00000',
      email: clientForm.email.trim() || 'client@example.com',
      eventDate: clientForm.eventDate,
      packageName: clientForm.packageName.trim(),
      packageValueInr: Number(clientForm.packageValueInr) || 0,
      leadStatus: clientForm.leadStatus,
    });
    setClientForm({
      name: '',
      phone: '',
      email: '',
      eventDate: '2026-12-20',
      packageName: 'Signature Wedding + Live QR',
      packageValueInr: 185000,
      leadStatus: 'Inquiry',
    });
    setShowAddClient(false);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !newLogNote.trim()) return;
    addClientLog(activeClient.id, newLogNote);
    setNewLogNote('');
  };

  const handleAddTeamTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.memberName.trim() || !teamForm.taskTitle.trim()) return;
    addTeamAssignment({
      memberName: teamForm.memberName.trim(),
      role: teamForm.role,
      assignedEvent: teamForm.assignedEvent.trim() || microsite.coupleOrHostName,
      taskTitle: teamForm.taskTitle.trim(),
      progressPercent: teamForm.progressPercent,
    });
    setTeamForm((prev) => ({ ...prev, memberName: '', taskTitle: '', progressPercent: 20 }));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || expenseForm.amountInr <= 0) return;
    addExpense({
      eventId: microsite.id,
      eventName: expenseForm.eventName.trim() || microsite.coupleOrHostName,
      category: expenseForm.category,
      description: expenseForm.description.trim(),
      amountInr: Number(expenseForm.amountInr),
      date: expenseForm.date,
    });
    setExpenseForm((prev) => ({ ...prev, description: '', amountInr: 2500 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
            Module 06 · Studio Operations &amp; P&amp;L
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-editorial font-semibold text-zinc-900 dark:text-white tracking-tight">
            Studio CRM, Team &amp; Expense Management
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Track client leads, communication history, crew shoot assignments, and per-event expenses with real-time Net Profit calculation synced to invoices and print sales.
          </p>
        </div>

        {/* Sub-Navigation */}
        <div className="inline-flex flex-wrap p-1.5 rounded-full liquid-glass-subtle self-start">
          {[
            { id: 'clients' as CRMTab, label: 'Client CRM', icon: Users },
            { id: 'team' as CRMTab, label: 'Team & Tasks', icon: UserCheck },
            { id: 'expenses' as CRMTab, label: 'Expenses & Net Profit', icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-[#090B10] shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#D4AF37]' : 'text-[#D4AF37]'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Studio Profit & Pipeline Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="rounded-[22px] liquid-glass p-4 sm:p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            CRM Pipeline Value
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
            ₹{pipelineValueInr.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {clients.length} active client records
          </p>
        </div>

        <div className="rounded-[22px] liquid-glass p-4 sm:p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Collected + Print Profit
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
            ₹{(totalCollectedRevenueInr + totalPrintProfitInr).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            UPI ₹{totalCollectedRevenueInr.toLocaleString('en-IN')} · Print +₹
            {totalPrintProfitInr.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-[22px] liquid-glass p-4 sm:p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Total Event Expenses
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
            -₹{totalExpensesInr.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {expenses.length} logged vouchers
          </p>
        </div>

        <div className="rounded-[22px] liquid-glass border-[#10B981]/40 p-4 sm:p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#10B981]">
            Net Studio Profit
          </p>
          <p
            className={`mt-2 text-2xl font-mono font-semibold tabular-nums ${
              netProfitInr >= 0 ? 'text-[#10B981]' : 'text-rose-500'
            }`}
          >
            {netProfitInr >= 0 ? '+' : ''}₹{netProfitInr.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Updates live with Module 5 &amp; 7
          </p>
        </div>
      </div>

      {/* TAB 1: CLIENT CRM */}
      {tab === 'clients' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['All', ...LEAD_STATUSES] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    statusFilter === status
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-zinc-900 dark:text-white'
                      : 'border-black/10 dark:border-white/12 text-zinc-600 dark:text-zinc-300 hover:border-[#D4AF37]/40'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddClient(true)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Client Lead
            </button>
          </div>

          <BottomSheetModal
            open={showAddClient}
            onClose={() => setShowAddClient(false)}
            title="Add Studio Client Lead"
            subtitle="Module 06 · Client CRM"
            footer={
              <button
                type="submit"
                form="crm-new-client-form"
                className="w-full min-h-[48px] rounded-full text-sm font-semibold bg-[#10B981] text-[#090B10] hover:opacity-90 transition cursor-pointer"
              >
                Save Client Lead
              </button>
            }
          >
            <form
              id="crm-new-client-form"
              onSubmit={handleCreateClient}
              className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
            >
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Couple / Client Name *
                </label>
                <input
                  type="text"
                  placeholder="Couple / Client Name *"
                  value={clientForm.name}
                  onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                  WhatsApp / Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 98200 00000"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Client Email
                </label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={clientForm.email}
                  onChange={(e) => setClientForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Package Name
                </label>
                <input
                  type="text"
                  placeholder="Package Name"
                  value={clientForm.packageName}
                  onChange={(e) => setClientForm((p) => ({ ...p, packageName: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Package Value (INR)
                </label>
                <input
                  type="number"
                  placeholder="185000"
                  value={clientForm.packageValueInr}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, packageValueInr: Number(e.target.value) }))
                  }
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Event Date
                </label>
                <input
                  type="date"
                  value={clientForm.eventDate}
                  onChange={(e) => setClientForm((p) => ({ ...p, eventDate: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
                />
              </div>
            </form>
          </BottomSheetModal>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Client Table */}
            <div className="xl:col-span-7 rounded-[24px] liquid-glass overflow-hidden">
              <div className="divide-y divide-black/10 dark:divide-white/10">
                {filteredClients.map((client) => {
                  const selected = activeClient?.id === client.id;
                  return (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer transition ${
                        selected
                          ? 'bg-[#D4AF37]/10'
                          : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">
                          {client.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {client.packageName} · Event {client.eventDate}
                        </p>
                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {client.phone} · {client.communicationLogs.length} logs
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <span className="text-sm font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                          ₹{client.packageValueInr.toLocaleString('en-IN')}
                        </span>
                        <select
                          value={client.leadStatus}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateClientStatus(client.id, e.target.value as LeadStatus)
                          }
                          className="min-h-[40px] px-3 py-1.5 rounded-xl liquid-input text-xs font-medium text-zinc-900 dark:text-white cursor-pointer"
                        >
                          {LEAD_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Client Communication Log Drawer */}
            <div className="xl:col-span-5 rounded-[24px] liquid-glass p-5 sm:p-6 space-y-4">
              {activeClient ? (
                <>
                  <div className="border-b border-black/10 dark:border-white/10 pb-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#B58E24] dark:text-[#D4AF37]">
                      Communication Log · {activeClient.leadStatus}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                      {activeClient.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {activeClient.email} · {activeClient.phone}
                    </p>
                  </div>

                  <form onSubmit={handleAddLog} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Log call, WhatsApp update, or edit note..."
                      value={newLogNote}
                      onChange={(e) => setNewLogNote(e.target.value)}
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer shrink-0"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      Log
                    </button>
                  </form>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {activeClient.communicationLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-[16px] liquid-glass-subtle"
                      >
                        <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          {log.date}
                        </p>
                        <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{log.note}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-500">Select a client to inspect logs.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM & TASKS */}
      {tab === 'team' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8 space-y-3">
            {teamAssignments.map((member) => (
              <div
                key={member.id}
                className="rounded-[22px] liquid-glass p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {member.memberName}
                      </span>
                      <span className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
                        · {member.role}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {member.assignedEvent} — {member.taskTitle}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                    {member.progressPercent}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/12 overflow-hidden">
                    <div
                      className="h-full bg-[#D4AF37] transition-all"
                      style={{ width: `${member.progressPercent}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={member.progressPercent}
                    onChange={(e) => updateTeamProgress(member.id, Number(e.target.value))}
                    aria-label={`Progress for ${member.memberName}`}
                    className="w-28 accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddTeamTask}
            className="xl:col-span-4 rounded-[24px] liquid-glass p-5 sm:p-6 space-y-3.5 h-fit"
          >
            <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-3">
              <Briefcase className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Assign Crew &amp; Deliverable
              </h3>
            </div>
            <input
              type="text"
              placeholder="Team Member Name *"
              value={teamForm.memberName}
              onChange={(e) => setTeamForm((p) => ({ ...p, memberName: e.target.value }))}
              required
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <select
              value={teamForm.role}
              onChange={(e) =>
                setTeamForm((p) => ({ ...p, role: e.target.value as TeamAssignment['role'] }))
              }
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            >
              {CREW_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Event Name"
              value={teamForm.assignedEvent}
              onChange={(e) => setTeamForm((p) => ({ ...p, assignedEvent: e.target.value }))}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Task / Deliverable *"
              value={teamForm.taskTitle}
              onChange={(e) => setTeamForm((p) => ({ ...p, taskTitle: e.target.value }))}
              required
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              className="w-full min-h-[46px] py-2.5 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] shadow-sm transition cursor-pointer"
            >
              Assign to Shoot Roster
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: EXPENSE LEDGER & NET PROFIT */}
      {tab === 'expenses' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8 space-y-4">
            {/* Formula Card */}
            <div className="rounded-[24px] liquid-glass border-[#10B981]/35 p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[#10B981]">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-[0.18em]">
                    Real-Time Event Net Profit Formula
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 font-mono tabular-nums">
                  Collected ₹{totalCollectedRevenueInr.toLocaleString('en-IN')} + Print Profit ₹
                  {totalPrintProfitInr.toLocaleString('en-IN')} − Expenses ₹
                  {totalExpensesInr.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">NET STUDIO PROFIT</p>
                <p className="text-3xl font-mono font-semibold text-[#10B981] tabular-nums">
                  ₹{netProfitInr.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Category Totals */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {expenseBreakdown.map(([cat, total]) => (
                <div
                  key={cat}
                  className="rounded-[18px] liquid-glass p-3.5"
                >
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                    {cat}
                  </p>
                  <p className="mt-1 text-sm font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                    ₹{total.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            {/* Expense List */}
            <div className="rounded-[24px] liquid-glass divide-y divide-black/10 dark:divide-white/10 overflow-hidden">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {exp.description}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {exp.eventName} · {exp.category} · {exp.date}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
                    -₹{exp.amountInr.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleAddExpense}
            className="xl:col-span-4 rounded-[24px] liquid-glass p-5 sm:p-6 space-y-3.5 h-fit"
          >
            <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-3">
              <IndianRupee className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Log Per-Event Expense
              </h3>
            </div>
            <input
              type="text"
              placeholder="Event Name"
              value={expenseForm.eventName}
              onChange={(e) => setExpenseForm((p) => ({ ...p, eventName: e.target.value }))}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <select
              value={expenseForm.category}
              onChange={(e) =>
                setExpenseForm((p) => ({
                  ...p,
                  category: e.target.value as StudioExpense['category'],
                }))
              }
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Expense description (e.g. Uber, Lens Rental) *"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
              required
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="number"
                min={1}
                placeholder="Amount ₹"
                value={expenseForm.amountInr}
                onChange={(e) =>
                  setExpenseForm((p) => ({ ...p, amountInr: Number(e.target.value) }))
                }
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl liquid-input text-sm font-mono text-zinc-900 dark:text-white tabular-nums"
              />
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[46px] py-2.5 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] shadow-sm transition cursor-pointer"
            >
              Record Expense &amp; Recalculate Profit
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
