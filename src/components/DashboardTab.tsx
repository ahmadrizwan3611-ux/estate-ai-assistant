import React from 'react';
import { UserCheck, Flame, Home, CalendarCheck, ShieldAlert, BadgeInfo, TrendingUp, Sparkles, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Lead, Property, FollowUp } from '../types';

interface DashboardTabProps {
  leads: Lead[];
  properties: Property[];
  followups: FollowUp[];
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardTab({ leads, properties, followups, onNavigateToTab }: DashboardTabProps) {
  // Compute analytics numbers
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.status === 'Hot').length;
  const totalProps = properties.length;
  const scheduledVisits = followups.filter(f => f.status === 'Scheduled').length;

  const STATS_DATA = [
    {
      label: 'Database Leads',
      value: totalLeads,
      icon: UserCheck,
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      tab: 'leads'
    },
    {
      label: 'Hot Active Leads',
      value: hotLeads,
      icon: Flame,
      colorClass: 'bg-red-50 text-red-700 border-red-100 animate-pulse',
      tab: 'leads'
    },
    {
      label: 'CRM Property Files',
      value: totalProps,
      icon: Home,
      colorClass: 'bg-teal-50 text-teal-700 border-teal-100',
      tab: 'properties'
    },
    {
      label: 'Scheduled Follow-ups',
      value: scheduledVisits,
      icon: CalendarCheck,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-100',
      tab: 'followups'
    }
  ];

  return (
    <div id="dashboard-tab" className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
        <div>
          <h1 className="text-xl font-display font-medium text-brand-slate-900 flex items-center gap-2">
            EstateAI Continuity Dashboard
            <span className="text-xs bg-brand-teal-50 border border-brand-teal-200 text-brand-teal-700 px-2.5 py-0.5 rounded-full font-bold">
              Secure Active Engine
            </span>
          </h1>
          <p className="text-xs text-brand-slate-700">Real estate continuity automation for high-efficacy closures in Lahore & Islamabad.</p>
        </div>
        <div className="text-xs font-mono font-medium text-brand-slate-200 bg-brand-slate-900 border border-brand-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <ClockIcon className="w-3.5 h-3.5 text-brand-teal-500" />
          Market Clock: 2026 UTC
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_DATA.map((st, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.01 }}
            onClick={() => onNavigateToTab(st.tab)}
            className="p-5 bg-white border border-brand-slate-200 rounded-xl text-left flex items-center justify-between shadow-xs hover:border-brand-teal-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <span className="text-[11px] font-bold text-brand-slate-200 uppercase tracking-widest">{st.label}</span>
              <div className="text-2xl font-display font-bold text-brand-slate-950 mt-1">{st.value}</div>
            </div>

            <div className={`p-3 rounded-lg border ${st.colorClass}`}>
              <st.icon className="w-5 h-5" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Actionable Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column: Quick launch test logs */}
        <div className="bg-white border border-brand-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between col-span-2">
          <div>
            <h3 className="text-sm font-display font-bold text-brand-slate-950 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-teal-500" />
              Continuity Integration Pipeline
            </h3>
            <p className="text-xs text-brand-slate-700 mb-4 font-sans leading-relaxed">
              One real estate deal can be worth crores of Pakistani Rupees, making visual accuracy, context matching, and factual safety paramount. Overwrite or fake details are strictly prohibited by our core matching layers.
            </p>

            <div className="bg-brand-slate-100 rounded-lg p-4 border border-brand-slate-200 space-y-3.5">
              <div className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-brand-teal-50 border border-brand-teal-200 text-brand-teal-600 text-xs font-bold mt-0.5">✔</span>
                <div className="text-xs">
                  <h4 className="font-bold text-brand-slate-900">Exact CRM property matching</h4>
                  <p className="text-brand-slate-700">Filters Lahore/Islamabad properties. Excludes Citi Housing Gujranwala or other unrelated towns unless specified.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-brand-teal-50 border border-brand-teal-200 text-brand-teal-600 text-xs font-bold mt-0.5">✔</span>
                <div className="text-xs">
                  <h4 className="font-bold text-brand-slate-900">Per-Leads Memory Retention</h4>
                  <p className="text-brand-slate-700">Traces preceding Options shown. Detects follow-up option questions and answers solely inside the selected listing details.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-brand-teal-50 border border-brand-teal-200 text-brand-teal-600 text-xs font-bold mt-0.5">✔</span>
                <div className="text-xs">
                  <h4 className="font-bold text-brand-slate-900">Polite Roman Urdu Mix Reply Dialect</h4>
                  <p className="text-brand-slate-700">Engages Roman Urdu dialects ('Walaikum Assalam Sir, picture de deta hoon') paired with WhatsApp bullets.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('chat')}
            className="mt-6 w-full py-2 bg-brand-slate-900 text-white font-bold items-center justify-center rounded-lg text-xs hover:bg-brand-teal-600 hover:text-white transition-colors cursor-pointer flex gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            Launch Interactive WhatsApp Chat Simulator
          </button>
        </div>

        {/* Right Column: Upcoming followups */}
        <div className="bg-white border border-brand-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-display font-bold text-brand-slate-950 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-brand-teal-500" />
              Latest Site Visits Scheduled
            </h3>
            <p className="text-xs text-brand-slate-700 mb-4">Dynamically booked via customer chat commands.</p>

            <div className="space-y-3">
              {followups.slice(0, 3).map((f) => (
                <div key={f.id} className="p-3 rounded-lg bg-brand-slate-100 border border-brand-slate-200 text-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-wide font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 rounded">
                      {f.type}
                    </span>
                    <span className="text-[10px] text-brand-slate-700 font-mono font-medium">
                      {new Date(f.follow_up_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-brand-slate-905 font-bold truncate mt-1">Status: {f.status}</p>
                  <p className="text-[11px] text-brand-slate-700 italic truncate mt-0.5">"{f.notes}"</p>
                </div>
              ))}

              {followups.length === 0 && (
                <div className="p-6 text-center text-xs text-brand-slate-750 italic">No schedules recorded today.</div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('followups')}
            className="mt-4 w-full py-2 bg-brand-slate-100 hover:bg-brand-slate-200 border border-brand-slate-200 text-brand-slate-900 font-bold items-center justify-center rounded-lg text-xs transition-colors cursor-pointer"
          >
            Manage Timeline Follow-ups page
          </button>
        </div>
      </div>
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
