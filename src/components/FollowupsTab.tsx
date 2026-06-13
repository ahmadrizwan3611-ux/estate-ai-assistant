import React, { useState } from 'react';
import { Calendar, Phone, CheckCircle, Trash2, Clock, Plus, Filter, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FollowUp, Lead } from '../types';

interface FollowupsTabProps {
  followups: FollowUp[];
  leads: Lead[];
  onFollowupChanged: () => void;
}

export default function FollowupsTab({ followups, leads, onFollowupChanged }: FollowupsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [type, setType] = useState<'Call' | 'Site Visit' | 'WhatsApp Followup'>('Site Visit');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('All');

  const filtered = followups.filter(f => {
    if (filter === 'All') return true;
    return f.status === filter;
  });

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !date) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          follow_up_date: new Date(date).toISOString(),
          type,
          notes
        })
      });

      if (res.ok) {
        onFollowupChanged();
        setShowAddForm(false);
        // reset
        setLeadId('');
        setDate('');
        setNotes('');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit followup schedule.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Scheduled' ? 'Completed' : 'Scheduled';
    try {
      const res = await fetch(`/api/followups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        onFollowupChanged();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFollowup = async (id: string) => {
    try {
      const res = await fetch(`/api/followups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onFollowupChanged();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="followups-tab" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-display font-medium text-brand-slate-900">Follow-Ups & Site Visits</h1>
          <p className="text-sm text-brand-slate-700">Track scheduled site visits, office meetings, and periodic followups to secure high-value sales deals.</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="bg-brand-teal-500 hover:bg-brand-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(13,148,136,0.15)]"
        >
          <Plus className="w-4 h-4" />
          Schedule Follow-up
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-brand-slate-200 flex flex-wrap gap-2 items-center justify-between mb-6">
        <span className="text-xs text-brand-slate-750 font-bold flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-brand-teal-500" />
          Filter Action Status:
        </span>
        <div className="flex gap-2">
          {['All', 'Scheduled', 'Completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded-lg font-medium border cursor-pointer ${
                filter === s
                  ? 'bg-brand-teal-500 border-brand-teal-500 text-white'
                  : 'bg-brand-slate-100 border-brand-slate-200 text-brand-slate-900 hover:bg-brand-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((f) => {
          const matchedLead = leads.find(l => l.id === f.lead_id);
          const formattedDate = new Date(f.follow_up_date).toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <motion.div
              key={f.id}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-4 rounded-xl border bg-white flex flex-col justify-between h-44 shadow-xs ${
                f.status === 'Completed' ? 'border-emerald-200 bg-emerald-50/5' : 'border-brand-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    f.type === 'Site Visit' ? 'bg-indigo-50 text-indigo-700' :
                    f.type === 'Call' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {f.type}
                  </span>
                  
                  <span className="text-xs text-brand-slate-700 font-mono font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formattedDate}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-brand-slate-900 mt-1">
                  Buyer Profile: {matchedLead ? matchedLead.name : 'Unknown Customer'}
                </h3>
                
                <p className="text-xs text-brand-slate-750 italic line-clamp-2 mt-1.5 pr-2">
                  🗒 "{f.notes || 'No follow-up notes provided.'}"
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-brand-slate-100 mt-2">
                <button
                  onClick={() => handleToggleStatus(f.id, f.status)}
                  className={`text-xs font-bold px-3 py-1 rounded-md cursor-pointer flex items-center gap-1 transition-colors ${
                    f.status === 'Completed'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-brand-slate-100 text-brand-slate-900 hover:bg-brand-slate-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {f.status === 'Completed' ? 'Completed' : 'Mark Complete'}
                </button>

                <button
                  onClick={() => handleDeleteFollowup(f.id)}
                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Remove followup sched file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Manual followup modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-brand-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-brand-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-brand-slate-900 text-white p-4 flex items-center justify-between">
                <h3 className="text-base font-display font-semibold">Schedule Customer Follow-up</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-white hover:opacity-85 text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateFollowup} className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Select Customer
                  </label>
                  <select
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Buyer --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Activity Type
                  </label>
                  <select
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                  >
                    <option value="Site Visit">Site Visit 🏠</option>
                    <option value="Call">Phone Call Enquiry 📞</option>
                    <option value="WhatsApp Followup">WhatsApp check schedule 💬</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Schedule Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500 font-mono"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-slate-900 uppercase tracking-wide mb-1">
                    Coordination Notes & details
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    placeholder="Describe visit notes, meeting places, owner instructions etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-brand-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-brand-slate-100 text-brand-slate-900 py-1.5 px-3.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand-teal-500 hover:bg-brand-teal-600 text-white py-1.5 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {submitting ? 'Scheduling...' : 'Set Schedule'}
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
