import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  LayoutDashboard, 
  Home, 
  Users, 
  MessageSquareCode, 
  Calendar, 
  Sliders, 
  Power, 
  MapPin, 
  Clock, 
  Sparkles,
  Info
} from 'lucide-react';
import SaaSLogin from './components/SaaSLogin';
import DashboardTab from './components/DashboardTab';
import PropertyTab from './components/PropertyTab';
import LeadTab from './components/LeadTab';
import ConversationsTab from './components/ConversationsTab';
import FollowupsTab from './components/FollowupsTab';
import SettingsTab from './components/SettingsTab';
import { Property, Lead, FollowUp, Agency } from './types';

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

  // Load active session on init
  useEffect(() => {
    const savedUser = localStorage.getItem('estateai_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Fetch CRM dataset if user is logged in
  useEffect(() => {
    if (user) {
      fetchCRMDataset();
    }
  }, [user]);

  const fetchCRMDataset = async () => {
    setLoading(true);
    try {
      const pProps = fetch('/api/properties').then(r => r.json());
      const pLeads = fetch('/api/leads').then(r => r.json());
      const pFollow = fetch('/api/followups').then(r => r.json());
      const pAgency = fetch('/api/agency').then(r => r.json());

      const [resProps, resLeads, resFollow, resAgency] = await Promise.all([pProps, pLeads, pFollow, pAgency]);

      setProperties(Array.isArray(resProps) ? resProps : []);
      setLeads(Array.isArray(resLeads) ? resLeads : []);
      setFollowups(Array.isArray(resFollow) ? resFollow : []);
      setAgency(resAgency || null);
    } catch (e) {
      console.error('Error synchronizing CRM dataset:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (agencyName: string, email: string, agencyId: string) => {
    const session = { name: agencyName, email, agencyId };
    localStorage.setItem('estateai_user', JSON.stringify(session));
    setUser(session);
  };

  const handleLogout = () => {
    localStorage.removeItem('estateai_user');
    setUser(null);
    setCurrentTab('dashboard');
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCRMDataset();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return <SaaSLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const SIDEBAR_ITEMS = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'Continuity Simulator', icon: MessageSquareCode, badge: true },
    { id: 'properties', label: 'CRM Listings', icon: Home },
    { id: 'leads', label: 'Customer Leads', icon: Users },
    { id: 'followups', label: 'Site Visits', icon: Calendar },
    { id: 'settings', label: 'AI Presets', icon: Sliders }
  ];

  return (
    <div id="full-app-root" className="min-h-screen bg-brand-slate-50 flex text-brand-slate-900">
      
      {/* Dynamic Left Sidebar Panels */}
      <aside className="w-60 bg-brand-slate-900 text-white flex flex-col justify-between border-r border-brand-slate-950 flex-shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-brand-slate-800 flex items-center gap-2.5">
            <div className="bg-brand-teal-500 text-brand-slate-950 w-8 h-8 rounded-lg flex items-center justify-center font-bold italic text-sm shadow-sm">
              E
            </div>
            <div>
              <span className="text-sm font-display font-bold block tracking-tight text-white">EstateAI</span>
              <span className="text-[10px] text-brand-teal-400 block font-bold leading-none uppercase tracking-widest mt-0.5">
                Continuity
              </span>
            </div>
          </div>

          {/* Active Navigation List Tabs */}
          <nav className="p-4 space-y-1 flex-1">
            <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-brand-slate-500 font-bold">Management</div>
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = currentTab === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-brand-teal-500/10 text-brand-teal-400 border-r-2 border-brand-teal-500'
                      : 'text-brand-slate-400 hover:bg-brand-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-brand-teal-400' : 'text-brand-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-brand-teal-500/10 text-brand-teal-400 border border-brand-teal-500/20'
                    }`}>
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Agency Bottom Bar with logout key */}
        <div className="p-4 border-t border-brand-slate-800 bg-brand-slate-950/50">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="truncate pr-2">
              <span className="text-[10px] text-brand-slate-400 block truncate">Logged in Agency:</span>
              <span className="font-bold text-white block truncate">{agency?.name || user.name}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-950/20 hover:bg-red-900/30 border border-red-950 text-red-400 font-semibold py-1.5 rounded-md text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Power className="w-3.5 h-3.5" />
            Logout Workspace
          </button>
        </div>
      </aside>

      {/* Main viewport panels */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Modern ambient Top Bar */}
        <header className="bg-white border-b border-brand-slate-205 h-14 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-brand-slate-500 font-semibold">
              <span>Continuity Engine</span>
              <span className="text-brand-slate-300">/</span>
              <span className="text-brand-slate-900 font-bold block">
                {currentTab === 'dashboard' ? 'Dashboard Overview' : 
                 currentTab === 'chat' ? 'WhatsApp Continuity' : 
                 currentTab === 'properties' ? 'Properties CRM' : 
                 currentTab === 'leads' ? 'Customer Leads' : 
                 currentTab === 'followups' ? 'Scheduled Site Visits' : 
                 'AI Presets'}
              </span>
            </div>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Active Sync
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-brand-slate-705">
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-brand-teal-500 animate-pulse" />
              <span>UTC Sync: 2026</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-brand-slate-900 truncate max-w-[120px]">{agency?.name || 'Pak-Prime'}</span>
              <span className="w-7 h-7 rounded-lg bg-brand-teal-500/10 border border-brand-teal-200 flex items-center justify-center text-brand-teal-700 font-bold uppercase text-xs">
                {agency?.name ? agency.name.substring(0, 2).toUpperCase() : 'AS'}
              </span>
            </div>
          </div>
        </header>

        {/* View Transitioning Tabs view */}
        <div className="flex-1 overflow-y-auto bg-brand-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-brand-slate-700">Synchronizing CRM memory database cache...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {currentTab === 'dashboard' && (
                  <DashboardTab 
                    leads={leads} 
                    properties={properties} 
                    followups={followups} 
                    onNavigateToTab={(tab) => setCurrentTab(tab)} 
                  />
                )}
                {currentTab === 'properties' && (
                  <PropertyTab 
                    properties={properties} 
                    onPropertyAdded={fetchCRMDataset} 
                    onPropertyDeleted={handleDeleteProperty} 
                  />
                )}
                {currentTab === 'leads' && (
                  <LeadTab 
                    leads={leads} 
                    onLeadAdded={fetchCRMDataset} 
                    onLeadUpdated={fetchCRMDataset} 
                  />
                )}
                {currentTab === 'chat' && (
                  <ConversationsTab 
                    leads={leads} 
                    onLeadStatusChanged={fetchCRMDataset} 
                  />
                )}
                {currentTab === 'followups' && (
                  <FollowupsTab 
                    followups={followups} 
                    leads={leads} 
                    onFollowupChanged={fetchCRMDataset} 
                  />
                )}
                {currentTab === 'settings' && (
                  <SettingsTab 
                    onSettingsChanged={fetchCRMDataset} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
