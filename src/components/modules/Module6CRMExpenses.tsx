import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  MessageSquarePlus,
  Plus,
  Trash2,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { usePixelFotos } from '../../contexts/PixelFotosContext';
import { CRMClient, LeadStatus, StudioExpense, TeamAssignment } from '../../types/pixelfotos';

type CRMTab = 'team' | 'expenses' | 'clients';

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

const QUICK_PROGRESS_STEPS = [0, 25, 50, 75, 100];

export const Module6CRMExpenses: React.FC = () => {
  const {
    clients,
    addClient,
    updateClientStatus,
    deleteClient,
    addClientLog,
    teamAssignments,
    updateTeamProgress,
    addTeamAssignment,
    deleteTeamAssignment,
    expenses,
    addExpense,
    deleteExpense,
    microsite,
    totalCollectedRevenueInr,
    totalExpensesInr,
    totalPrintProfitInr,
    netProfitInr,
  } = usePixelFotos();

  const [tab, setTab] = useState<CRMTab>('team');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [newLogNote, setNewLogNote] = useState('');

  // Quick 1-Line Crew Assignment Form
  const [teamForm, setTeamForm] = useState({
    memberName: '',
    role: 'Candid Shooter' as TeamAssignment['role'],
    assignedEvent: microsite.coupleOrHostName,
    taskTitle: '',
  });

  // Quick 1-Line Expense Logger Form
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'Travel' as StudioExpense['category'],
    eventName: microsite.coupleOrHostName,
    amountInr: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Simple Quick Client Form
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    eventDate: '2026-12-20',
    packageName: 'Signature Wedding + Live QR',
    packageValueInr: 185000,
    leadStatus: 'Booked' as LeadStatus,
  });

  const activeClient: CRMClient | undefined = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || clients[0],
    [clients, selectedClientId]
  );

  const completedTasksCount = useMemo(
    () => teamAssignments.filter((t) => t.progressPercent >= 100).length,
    [teamAssignments]
  );

  const handleAddTeamTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.memberName.trim() || !teamForm.taskTitle.trim()) return;
    addTeamAssignment({
      memberName: teamForm.memberName.trim(),
      role: teamForm.role,
      assignedEvent: teamForm.assignedEvent.trim() || microsite.coupleOrHostName,
      taskTitle: teamForm.taskTitle.trim(),
      progressPercent: 0,
    });
    setTeamForm((prev) => ({ ...prev, memberName: '', taskTitle: '' }));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(expenseForm.amountInr);
    if (!expenseForm.description.trim() || !numericAmount || numericAmount <= 0) return;
    addExpense({
      eventId: microsite.id,
      eventName: expenseForm.eventName.trim() || microsite.coupleOrHostName,
      category: expenseForm.category,
      description: expenseForm.description.trim(),
      amountInr: numericAmount,
      date: expenseForm.date,
    });
    setExpenseForm((prev) => ({ ...prev, description: '', amountInr: '' }));
  };

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
      leadStatus: 'Booked',
    });
    setShowAddClient(false);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !newLogNote.trim()) return;
    addClientLog(activeClient.id, newLogNote);
    setNewLogNote('');
  };

  return (
    <div className="space-y-6">
      {/* Clean Header + 3-Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B58E24] dark:text-[#D4AF37]">
            Module 06 · Streamlined Studio Operations
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-editorial font-semibold text-zinc-900 dark:text-white tracking-tight">
            Team Tasks, Expenses &amp; Client CRM
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Assign crew members in one row, update task status in one click, and log shoot expenses with automatic Net Profit calculation.
          </p>
        </div>

        <div className="inline-flex flex-wrap p-1.5 rounded-full liquid-glass-subtle self-start">
          {[
            { id: 'team' as CRMTab, label: `Team & Tasks (${teamAssignments.length})`, icon: UserCheck },
            { id: 'expenses' as CRMTab, label: `Expenses (${expenses.length})`, icon: Wallet },
            { id: 'clients' as CRMTab, label: `Client Leads (${clients.length})`, icon: Users },
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
                <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact 3-Card Financial & Operations Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="rounded-[22px] liquid-glass p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Crew Tasks Completed
            </p>
            <p className="mt-1.5 text-2xl font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
              {completedTasksCount} / {teamAssignments.length}
            </p>
          </div>
          <span className="text-xs font-mono text-[#D4AF37]">Active Roster</span>
        </div>

        <div className="rounded-[22px] liquid-glass p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Total Logged Expenses
            </p>
            <p className="mt-1.5 text-2xl font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              -₹{totalExpensesInr.toLocaleString('en-IN')}
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">{expenses.length} entries</span>
        </div>

        <div className="rounded-[22px] liquid-glass border-[#10B981]/40 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#10B981]">
              Net Studio Profit
            </p>
            <p
              className={`mt-1.5 text-2xl font-mono font-semibold tabular-nums ${
                netProfitInr >= 0 ? 'text-[#10B981]' : 'text-rose-500'
              }`}
            >
              {netProfitInr >= 0 ? '+' : ''}₹{netProfitInr.toLocaleString('en-IN')}
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 tabular-nums">
            Rev ₹{(totalCollectedRevenueInr + totalPrintProfitInr).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* TAB 1: ULTRA-SIMPLE TEAM & TASK TRACKER */}
      {tab === 'team' && (
        <div className="space-y-4">
          {/* Quick 1-Row Crew Assignment Bar */}
          <form
            onSubmit={handleAddTeamTask}
            className="rounded-[24px] liquid-glass p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
          >
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Team Member Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rohan Nair"
                value={teamForm.memberName}
                onChange={(e) => setTeamForm((p) => ({ ...p, memberName: e.target.value }))}
                required
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Role
              </label>
              <select
                value={teamForm.role}
                onChange={(e) =>
                  setTeamForm((p) => ({ ...p, role: e.target.value as TeamAssignment['role'] }))
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
              >
                {CREW_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Wedding / Event
              </label>
              <input
                type="text"
                placeholder="Event Name"
                value={teamForm.assignedEvent}
                onChange={(e) => setTeamForm((p) => ({ ...p, assignedEvent: e.target.value }))}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Task / Deliverable *
              </label>
              <input
                type="text"
                placeholder="e.g. Cull Day-1 Haldi RAWs"
                value={teamForm.taskTitle}
                onChange={(e) => setTeamForm((p) => ({ ...p, taskTitle: e.target.value }))}
                required
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Assign Task
              </button>
            </div>
          </form>

          {/* Clean Task List with 1-Click Progress Buttons */}
          <div className="rounded-[24px] liquid-glass divide-y divide-black/10 dark:divide-white/10 overflow-hidden">
            {teamAssignments.map((member) => {
              const isDone = member.progressPercent >= 100;
              return (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-zinc-900 dark:text-white">
                        {member.memberName}
                      </span>
                      <span className="text-xs font-mono text-[#B58E24] dark:text-[#D4AF37]">
                        · {member.role}
                      </span>
                      <span className="text-xs text-zinc-400">·</span>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {member.assignedEvent}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        isDone
                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {member.taskTitle}
                    </p>
                  </div>

                  {/* Right: 1-Click Progress Step Buttons + Delete */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="inline-flex items-center p-1 rounded-xl liquid-glass-subtle gap-1">
                      {QUICK_PROGRESS_STEPS.map((pct) => {
                        const active = member.progressPercent === pct;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => updateTeamProgress(member.id, pct)}
                            className={`min-h-[34px] px-2.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer tabular-nums ${
                              active
                                ? pct === 100
                                  ? 'bg-[#10B981] text-[#090B10]'
                                  : 'bg-[#D4AF37] text-[#090B10]'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                          >
                            {pct === 100 ? 'Done ✓' : `${pct}%`}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTeamAssignment(member.id)}
                      aria-label={`Remove task for ${member.memberName}`}
                      className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ULTRA-SIMPLE EXPENSE LOGGER */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          {/* Quick 1-Row Expense Logger */}
          <form
            onSubmit={handleAddExpense}
            className="rounded-[24px] liquid-glass p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
          >
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Expense Item / Description *
              </label>
              <input
                type="text"
                placeholder="e.g. Crew Cab to Venue, Gimbal Rental"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
                required
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Category
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm((p) => ({
                    ...p,
                    category: e.target.value as StudioExpense['category'],
                  }))
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Event
              </label>
              <input
                type="text"
                value={expenseForm.eventName}
                onChange={(e) => setExpenseForm((p) => ({ ...p, eventName: e.target.value }))}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                min={1}
                placeholder="2500"
                value={expenseForm.amountInr}
                onChange={(e) => setExpenseForm((p) => ({ ...p, amountInr: e.target.value }))}
                required
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl liquid-input text-sm font-mono text-zinc-900 dark:text-white tabular-nums"
              />
            </div>

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] hover:bg-[#c39c2b] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Log Expense
              </button>
            </div>
          </form>

          {/* Clean Expense Table */}
          <div className="rounded-[24px] liquid-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.03] dark:bg-white/[0.04] text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-white">
                        {exp.description}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-zinc-600 dark:text-zinc-300">
                        {exp.category}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {exp.eventName}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-zinc-500 tabular-nums">
                        {exp.date}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                        -₹{exp.amountInr.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteExpense(exp.id)}
                          aria-label={`Delete expense ${exp.description}`}
                          className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLEAN CLIENT CRM */}
      {tab === 'clients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              Select any wedding client to update booking status or log call notes.
            </p>
            <button
              type="button"
              onClick={() => setShowAddClient((v) => !v)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddClient ? 'Close Form' : 'Add Client Lead'}
            </button>
          </div>

          {showAddClient && (
            <form
              onSubmit={handleCreateClient}
              className="rounded-[22px] liquid-glass p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end border border-[#D4AF37]/35"
            >
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Couple / Client Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nitya & Pranav"
                  value={clientForm.name}
                  onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs text-zinc-900 dark:text-white"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="+91 98200 00000"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs text-zinc-900 dark:text-white"
                />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  value={clientForm.packageName}
                  onChange={(e) => setClientForm((p) => ({ ...p, packageName: e.target.value }))}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs text-zinc-900 dark:text-white"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Value (₹)
                </label>
                <input
                  type="number"
                  value={clientForm.packageValueInr}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, packageValueInr: Number(e.target.value) }))
                  }
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl liquid-input text-xs font-mono text-zinc-900 dark:text-white tabular-nums"
                />
              </div>
              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#10B981] text-[#090B10] cursor-pointer"
                >
                  Save Client
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-7 rounded-[24px] liquid-glass divide-y divide-black/10 dark:divide-white/10 overflow-hidden">
              {clients.map((client) => {
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
                      <p className="font-semibold text-zinc-900 dark:text-white">{client.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {client.packageName} · Event {client.eventDate} · {client.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center">
                      <span className="text-sm font-mono font-semibold text-zinc-900 dark:text-white tabular-nums">
                        ₹{client.packageValueInr.toLocaleString('en-IN')}
                      </span>
                      <select
                        value={client.leadStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          updateClientStatus(client.id, e.target.value as LeadStatus)
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-xl liquid-input text-xs font-medium text-zinc-900 dark:text-white cursor-pointer"
                      >
                        {LEAD_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {clients.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteClient(client.id);
                          }}
                          aria-label={`Delete ${client.name}`}
                          className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="xl:col-span-5 rounded-[24px] liquid-glass p-5 space-y-4">
              {activeClient ? (
                <>
                  <div className="border-b border-black/10 dark:border-white/10 pb-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#B58E24] dark:text-[#D4AF37]">
                      Client Notes · {activeClient.leadStatus}
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
                      placeholder="Add quick call or WhatsApp note..."
                      value={newLogNote}
                      onChange={(e) => setNewLogNote(e.target.value)}
                      className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl liquid-input text-sm text-zinc-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-full text-xs font-semibold bg-[#D4AF37] text-[#090B10] cursor-pointer shrink-0"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </form>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeClient.communicationLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-[16px] liquid-glass-subtle">
                        <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          {log.date}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
                          {log.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Select a client lead to view notes.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
