import React, { useState } from 'react';
import { Plus, Search, PersonStanding, Phone, Mail, CheckCircle, Tag, Filter, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, LeadStatus } from '../types';

interface LeadTabProps {
  leads: Lead[];
  onLeadAdded: () => void;
  onLeadUpdated: (id: string, status: LeadStatus) => void;
}

export default function LeadTab({ leads, onLeadAdded, onLeadUpdated }: LeadTabProps) {
  const [showAddLead, setShowAddLead] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [reqNotes, setReqNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filtered = leads.filter(l => {
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesStatus;
  });

  const getStatusBadgeClass = (s: LeadStatus) => {
    switch (s) {
      case 'Hot': return 'bg-red-50 text-red-700 border-red-200';
      case 'Warm': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cold': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          status,
          requirement_notes: reqNotes
        })
      });

      if (res.ok) {
        onLeadAdded();
        setShowAddLead(false);
        // reset
        setName('');
        setPhone('');
        setEmail('');
        setReqNotes('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to trigger lead registry');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, s: LeadStatus) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s })
      });
      if (res.ok) {
        onLeadUpdated(id, s);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="leads-tab" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-display font-medium text-brand-slate-900">Leads CRM Database</h1>
          <p className="text-sm text-brand-slate-700">Integrate real buyers, track active interest levels, and audit memory timelines.</p>
        </div>

        <button
          onClick={() => setShowAddLead(true)}
          className="bg-brand-teal-500 hover:bg-brand-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(13,148,136,0.15)]"
        >
          <UserPlus className="w-4 h-4" />
          Add Customer Lead
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-brand-slate-200 flex flex-wrap gap-2 items-center justify-between mb-6">
        <span className="text-xs text-brand-slate-700 font-bold flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-brand-teal-500" />
          Filter Priority Level:
        </span>

        <div className="flex gap-2">
          {['All', 'Hot', 'Warm', 'New', 'Cold'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded-lg font-medium border cursor-pointer ${
                statusFilter === s
                  ? 'bg-brand-teal-500 border-brand-teal-500 text-white'
                  : 'bg-brand-slate-100 border-brand-slate-200 text-brand-slate-900 hover:bg-brand-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white border border-brand-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
              <th className="p-4">Customer Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Status Class</th>
              <th className="p-4">Stated Criteria Summary</th>
              <th className="p-4 text-right">Action Quick-Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-slate-100">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-brand-slate-100/50 transition-colors">
                <td className="p-4 font-bold text-brand-slate-900 text-xs">
                  {l.name}
                </td>
                <td className="p-4 space-y-0.5 text-xs">
                  <div className="flex items-center gap-1 text-brand-slate-900">
                    <Phone className="w-3 h-3 text-brand-teal-500" />
                    <span>{l.phone}</span>
                  </div>
                  {l.email && (
                    <div className="flex items-center gap-1 text-brand-slate-200">
                      <Mail className="w-3 h-3 text-brand-slate-200" />
                      <span>{l.email}</span>
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold border rounded-full ${getStatusBadgeClass(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-brand-slate-700 max-w-sm font-sans truncate" title={l.requirement_notes || ''}>
                  {l.requirement_notes || 'No notes stated.'}
                </td>
                <td className="p-4 text-right">
                  <select
                    className="bg-brand-slate-100 border border-brand-slate-200 text-xs rounded-md p-1 focus:outline-none"
                    value={l.status}
                    onChange={(e) => handleUpdateStatus(l.id, e.target.value as LeadStatus)}
                  >
                    <option value="New">Set New</option>
                    <option value="Hot">Set Hot 🔥</option>
                    <option value="Warm">Set Warm ⚡</option>
                    <option value="Cold">Set Cold ❄️</option>
                    <option value="Closed">Set Closed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAddLead && (
          <div className="fixed inset-0 bg-brand-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-brand-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-brand-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-semibold">Register New Customer</h3>
                  <p className="text-[11px] text-brand-slate-250">Adds lead context directly, triggering welcoming message.</p>
                </div>
                <button
                  onClick={() => setShowAddLead(false)}
                  className="text-white hover:opacity-80 text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    placeholder="e.g. Rizwanar Chaudhry"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Phone (WhatsApp Contact Number)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    placeholder="e.g. 0321-4567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Initial Interest Priority
                  </label>
                  <select
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  >
                    <option value="New">New Contact</option>
                    <option value="Hot">Hot 🔥 (Ready for physical visit)</option>
                    <option value="Warm">Warm ⚡ (Actively questioning pricing)</option>
                    <option value="Cold">Cold ❄️ (Just browsing/unclear)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Initial Requirements Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    placeholder="e.g. Customer wants 5 Marla in DHA Phase 6 under 2 crore."
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-brand-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddLead(false)}
                    className="bg-brand-slate-100 text-brand-slate-900 py-1.5 px-3.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand-teal-500 hover:bg-brand-teal-600 text-white py-1.5 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {submitting ? 'Adding...' : 'Register Lead'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
