import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  UserCheck, 
  AlertCircle,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { AgencyMember } from '../types';

interface TeamTabProps {
  onTeamUpdated: () => void;
}

export default function TeamTab({ onTeamUpdated }: TeamTabProps) {
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'manager' | 'agent'>('agent');
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string>('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to grab team registers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setInviting(true);
    setInviteStatus('');

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invited_email: email, name, role })
      });

      if (res.ok) {
        setName('');
        setEmail('');
        setRole('agent');
        setInviteStatus('success');
        fetchMembers();
        onTeamUpdated();
        setTimeout(() => setInviteStatus(''), 3000);
      } else {
        setInviteStatus('error');
      }
    } catch (err) {
      console.error(err);
      setInviteStatus('error');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'active' | 'suspended') => {
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchMembers();
        onTeamUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this team member/invite from your workspace?')) return;
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMembers();
        onTeamUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-slate-500">Checking credentials registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Banner introduction */}
      <div className="bg-white rounded-xl border border-brand-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-brand-teal-500/10 text-brand-teal-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
              Module 4
            </span>
            <span className="text-brand-slate-500 text-xs font-mono">• Multi-Agent Workspace</span>
          </div>
          <h1 className="text-lg font-bold font-display tracking-tight text-brand-slate-900 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-brand-teal-500" />
            Team Members, Roles & Permissions
          </h1>
          <p className="text-xs text-brand-slate-500">
            Invite colleagues, properties specialists, and sales agents to manage CRM records, coordinate site visits, and share leads.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Invite Team Form */}
        <div className="bg-white rounded-xl border border-brand-slate-200 p-6 self-start space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-brand-teal-500" />
              Invite Office Colleague
            </h2>
            <p className="text-[10px] text-brand-slate-500">Add staff access to log in and coordinate with you.</p>
          </div>

          <form onSubmit={handleInvite} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-brand-slate-700 font-semibold mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-brand-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-teal-500 focus:outline-none"
                placeholder="e.g. Rizwan Mughal"
              />
            </div>

            <div>
              <label className="block text-brand-slate-700 font-semibold mb-1">Corporate Email Address</label>
              <input 
                type="email" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-brand-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-teal-500 focus:outline-none"
                placeholder="e.g. rizwan@agency.com"
              />
            </div>

            <div>
              <label className="block text-brand-slate-700 font-semibold mb-1">Assigned Work Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-white border border-brand-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-teal-500 focus:outline-none"
              >
                <option value="agent">Sales Agent (View listings, update logs)</option>
                <option value="manager">Listing Manager (Edit properties catalog)</option>
                <option value="admin">Administrator (Invite team, change builder)</option>
              </select>
            </div>

            {/* Micro information badge */}
            <div className="bg-brand-slate-50 border border-brand-slate-105 p-3 rounded-lg flex gap-2">
              <Info className="w-4 h-4 text-brand-slate-500 flex-shrink-0" />
              <p className="text-[10px] text-brand-slate-500 leading-normal">
                An activation token link will be simulated on client panels, allowing secondary staff authorization immediately.
              </p>
            </div>

            <button
              type="submit"
              disabled={inviting}
              className="w-full bg-brand-slate-900 hover:bg-brand-slate-800 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              {inviting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4 text-brand-teal-400" />
              )}
              Send Agency Invitation
            </button>

            {inviteStatus === 'success' && (
              <p className="text-emerald-600 font-bold text-center mt-1 text-[11px]">Invitation processed successfully!</p>
            )}
            {inviteStatus === 'error' && (
              <p className="text-red-500 text-center mt-1 text-[11px]">Failed to write member record.</p>
            )}
          </form>
        </div>

        {/* Right column: Member lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-brand-slate-200 p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-5 text-brand-teal-500" />
                Active Personnel Directory {members.length > 0 && `(${members.length})`}
              </h2>
              <p className="text-xs text-brand-slate-500">Active and pending coworkers mapped to role access charts.</p>
            </div>

            <div className="space-y-3">
              {members.length === 0 ? (
                <div className="text-center py-10 text-brand-slate-400">
                  <p className="text-xs font-semibold">No coworkers found in database.</p>
                </div>
              ) : (
                members.map((m) => (
                  <div key={m.id} className="border border-brand-slate-100 bg-brand-slate-50/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-teal-500/10 border border-brand-teal-200 flex items-center justify-center text-brand-teal-700 font-bold text-xs uppercase flex-shrink-0">
                        {m.name.substring(0, 2)}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-2">
                          <strong className="text-brand-slate-900 font-bold block">{m.name}</strong>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none ${
                            m.role === 'owner' ? 'bg-indigo-100 text-indigo-700' :
                            m.role === 'admin' ? 'bg-red-100 text-red-700' :
                            m.role === 'manager' ? 'bg-amber-100 text-amber-700' :
                            'bg-brand-slate-100 text-brand-slate-700'
                          }`}>
                            {m.role}
                          </span>
                        </div>
                        <p className="text-brand-slate-500 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {m.invited_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      {/* State labels */}
                      <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                        m.status === 'active' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {m.status === 'active' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        )}
                        <span className="capitalize">{m.status}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        {m.status === 'active' ? (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'suspended')}
                            disabled={m.role === 'owner'}
                            className="bg-white hover:bg-brand-slate-50 text-brand-slate-600 border border-brand-slate-200 py-1 px-2.5 rounded text-[10px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Suspend team member access"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'active')}
                            className="bg-brand-teal-500 hover:bg-brand-teal-400 text-brand-slate-950 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                            title="Activate login credential key"
                          >
                            Activate
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={m.role === 'owner'}
                          className="bg-white hover:bg-red-50 text-red-600 hover:border-red-200 border border-brand-slate-200 p-1.5 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Revoke access completely"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick guide rules segment */}
          <div className="bg-brand-slate-900 text-brand-slate-300 rounded-xl border border-brand-slate-800 p-5 space-y-3.5">
            <div>
              <h3 className="font-bold text-white text-xs flex items-center gap-1.5 font-display">
                <Shield className="w-4 h-4 text-brand-teal-400" />
                Role Permission Reference
              </h3>
              <p className="text-[10px] text-brand-slate-400 leading-normal">System-enforced security boundaries for staff memberships.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] leading-relaxed">
              <div className="space-y-1 p-2.5 bg-brand-slate-950/40 rounded-lg">
                <span className="text-white font-bold block mb-0.5 flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3 text-brand-teal-400" /> Owner / Admin
                </span>
                <p className="text-brand-slate-400">Full write privileges. Can construct public portals, modify WhatsApp config gateways, and handle corporate billing subscriptions.</p>
              </div>
              <div className="space-y-1 p-2.5 bg-brand-slate-950/40 rounded-lg">
                <span className="text-white font-bold block mb-0.5 text-xs">Manager</span>
                <p className="text-brand-slate-400">Can manipulate property listing catalogs and update lead requirements, but restricted from modifying agency settings or viewing team access keys.</p>
              </div>
              <div className="space-y-1 p-2.5 bg-brand-slate-950/40 rounded-lg">
                <span className="text-white font-bold block mb-0.5 text-xs">Agent</span>
                <p className="text-brand-slate-400">View-only properties access. Can communicate with customer accounts inside the Continuity Simulator and schedule visit appointments.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
