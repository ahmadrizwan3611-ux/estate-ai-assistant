import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Settings, 
  Palette, 
  Eye, 
  Check, 
  FileCheck, 
  BarChart3, 
  TrendingUp, 
  MousePointerClick, 
  Users, 
  ExternalLink,
  Save,
  Globe,
  RefreshCw,
  Clock
} from 'lucide-react';
import { AgencySiteSettings, SiteEvent } from '../types';

interface WebsiteBuilderTabProps {
  onSettingsChanged: () => void;
}

export default function WebsiteBuilderTab({ onSettingsChanged }: WebsiteBuilderTabProps) {
  const [settings, setSettings] = useState<AgencySiteSettings | null>(null);
  const [analytics, setAnalytics] = useState<{ events: SiteEvent[]; usage: any; metrics: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  
  // Form States
  const [publicName, setPublicName] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [themeId, setThemeId] = useState('classic_agency');
  const [primaryColor, setPrimaryColor] = useState('#0d9488');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Template/Theme Catalogs
  const THEMES = [
    { id: 'classic_agency', name: 'Swiss Classic Agency', desc: 'Sober, reliable layouts built on trust. Classic layout for traditional agencies.', previewColor: 'bg-emerald-600' },
    { id: 'royal_estate', name: 'Lahori Royal Estate', desc: 'Golden accents with deep maroon styling, suited for high-budget commercial property.', previewColor: 'bg-amber-600' },
    { id: 'modern_minimal', name: 'Minimalist Silicon Valley', desc: 'Slick mono design with clean spacing. Space-age sans serif branding for developers.', previewColor: 'bg-zinc-800' }
  ];

  const PALETTES = [
    { code: '#0d9488', name: 'Muted Teal' },
    { code: '#b45309', name: 'Imperial Amber' },
    { code: '#4f46e5', name: 'Royal Violet' },
    { code: '#e11d48', name: 'Rosewood Red' },
    { code: '#27272a', name: 'Classic Charcoal' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resWeb = await fetch('/api/website-settings');
      const dataWeb = await resWeb.json();
      setSettings(dataWeb);

      // Populate form controls
      setPublicName(dataWeb.public_name || '');
      setHeroTitle(dataWeb.hero_title || '');
      setHeroSubtitle(dataWeb.hero_subtitle || '');
      setAboutText(dataWeb.about_text || '');
      setThemeId(dataWeb.theme_id || 'classic_agency');
      setPrimaryColor(dataWeb.primary_color || '#0d9488');
      setWhatsappNumber(dataWeb.whatsapp_number || '');
      setIsPublished(dataWeb.is_published !== false);

      const resAnal = await fetch('/api/analytics/overview');
      const dataAnal = await resAnal.json();
      setAnalytics(dataAnal);
    } catch (e) {
      console.error('Failed to grab builder dataset:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('');

    try {
      const res = await fetch('/api/website-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_name: publicName,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          about_text: aboutText,
          theme_id: themeId,
          primary_color: primaryColor,
          whatsapp_number: whatsappNumber,
          is_published: isPublished
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSaveStatus('success');
        onSettingsChanged();
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-slate-500">Constructing content manager panel...</p>
        </div>
      </div>
    );
  }

  // Aggregate event tracking details
  const filteredEvents = analytics?.events || [];
  const pageViews = filteredEvents.filter(ev => ev.event_type === 'page_view').length;
  const propertyClicks = filteredEvents.filter(ev => ev.event_type === 'property_view').length;
  const inquiryConversions = filteredEvents.filter(ev => ev.event_type === 'lead_inquiry').length;

  const publicUrl = `/site/${settings?.slug || 'pak-prime'}`;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-slate-900 text-white p-6 rounded-xl border border-brand-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-brand-teal-500 text-brand-slate-950 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
              Module 1 & 2
            </span>
            <span className="text-brand-slate-400 text-xs font-mono">• Live Sandbox Website</span>
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-teal-400" />
            Agency Website & Custom Themes
          </h1>
          <p className="text-xs text-brand-slate-400">
            Publish interactive property showcases client-side. Custom design palettes sync instantly to our live portal route.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-brand-teal-500 hover:bg-brand-teal-400 text-brand-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            Open Public Portal
            <ExternalLink className="w-3 h-3" />
          </a>
          <button 
            onClick={fetchData}
            className="bg-brand-slate-800 hover:bg-brand-slate-700 text-white font-medium p-2 rounded-lg text-xs transition-all"
            title="Refresh logs & statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Editor panel Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-brand-slate-200 p-6 space-y-6">
          <div className="border-b border-brand-slate-100 pb-3">
            <h2 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-brand-teal-500" />
              Portal Customization settings
            </h2>
            <p className="text-[11px] text-brand-slate-500">Edit elements shown on the public face of your company.</p>
          </div>

          <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Company SEO Title (Slug prefix)</label>
                <input 
                  type="text" 
                  value={settings?.slug || 'pak-prime'} 
                  disabled
                  title="Slug cannot be changed once allocated to standard SaaS workspace."
                  className="w-full bg-brand-slate-50 border border-brand-slate-200 text-brand-slate-400 p-2.5 rounded-lg font-mono focus:outline-none"
                />
                <span className="text-[10px] text-brand-slate-500 mt-1 block">Live Path: /site/{settings?.slug || 'pak-prime'} </span>
              </div>

              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Public Brand Name</label>
                <input 
                  type="text" 
                  required
                  value={publicName} 
                  onChange={(e) => setPublicName(e.target.value)}
                  className="w-full bg-white border border-brand-slate-200 text-brand-slate-900 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-teal-500 focus:outline-none"
                  placeholder="e.g. EstateAI Premier Properties"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Landing Hero Heading</label>
                <input 
                  type="text" 
                  required
                  value={heroTitle} 
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full bg-white border border-brand-slate-200 text-brand-slate-900 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-teal-500 focus:outline-none"
                  placeholder="e.g. Find Your Dream Property"
                />
              </div>

              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Landing Hero Subtitle description</label>
                <input 
                  type="text" 
                  required
                  value={heroSubtitle} 
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full bg-white border border-brand-slate-200 text-brand-slate-900 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-teal-500 focus:outline-none"
                  placeholder="e.g. Direct properties with secure AI continuity"
                />
              </div>
            </div>

            <div>
              <label className="block text-brand-slate-700 font-semibold mb-1">About Our Estate Agency</label>
              <textarea 
                rows={3}
                required
                value={aboutText} 
                onChange={(e) => setAboutText(e.target.value)}
                className="w-full bg-white border border-brand-slate-200 text-brand-slate-900 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-teal-500 focus:outline-none"
                placeholder="Give standard introduction text for visitors..."
              />
            </div>

            {/* Core Theme Template Picker Segment (Module 2) */}
            <div className="space-y-3 bg-brand-slate-50 p-4 rounded-xl border border-brand-slate-200">
              <div>
                <h3 className="font-bold text-brand-slate-900 flex items-center gap-1.5 text-xs">
                  <Palette className="w-3.5 h-3.5 text-brand-teal-500" />
                  Select Public Website Theme Style
                </h3>
                <p className="text-[10px] text-brand-slate-500">Pick layout templates suited for your core demographic target.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {THEMES.map((theme) => (
                  <label 
                    key={theme.id}
                    onClick={() => setThemeId(theme.id)}
                    className={`border rounded-lg p-3 block cursor-pointer transition-all ${
                      themeId === theme.id 
                        ? 'border-brand-teal-500 bg-white ring-1 ring-brand-teal-500/20' 
                        : 'border-brand-slate-200 bg-white hover:border-brand-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-brand-slate-900 block">{theme.name}</span>
                      <div className={`w-3.5 h-3.5 rounded-full ${theme.previewColor} border border-white flex items-center justify-center`}>
                        {themeId === theme.id && <Check className="w-2 h-2 text-white" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-brand-slate-500 leading-tight">{theme.desc}</p>
                  </label>
                ))}
              </div>

              <div className="pt-2 border-t border-brand-slate-200">
                <span className="block text-brand-slate-700 text-[10px] font-semibold mb-1.5 text-xs">Primary Brand Palette:</span>
                <div className="flex items-center gap-2">
                  {PALETTES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setPrimaryColor(c.code)}
                      className={`w-6 h-6 rounded-full border-2 transition-all relative flex items-center justify-center`}
                      style={{ backgroundColor: c.code, borderColor: primaryColor === c.code ? '#ffffff' : 'transparent' }}
                      title={c.name}
                    >
                      {primaryColor === c.code && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </button>
                  ))}
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-6 h-6 rounded-full border-0 cursor-pointer overflow-hidden bg-transparent"
                    title="Choose custom brand hexadecimal"
                  />
                  <span className="text-[10px] font-mono text-brand-slate-600 block pl-1.5">Hex: {primaryColor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Public WhatsApp Contact (Roman / Pak style)</label>
                <input 
                  type="text" 
                  required
                  value={whatsappNumber} 
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-white border border-brand-slate-200 text-brand-slate-900 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-teal-500 focus:outline-none"
                  placeholder="e.g. 0300-1234567"
                />
              </div>

              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Status Settings</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-brand-slate-750">
                    <input 
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded border-brand-slate-300 text-brand-teal-650 focus:ring-brand-teal-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Publish listing portal on web</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-slate-100 flex items-center justify-between">
              <div>
                {saveStatus === 'success' && (
                  <p className="text-emerald-600 font-bold flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    Site settings saved beautifully! Ready on public route.
                  </p>
                )}
                {saveStatus === 'error' && (
                  <p className="text-red-600 font-bold">Failed to synchronize portal variables to databases.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-brand-slate-900 hover:bg-brand-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Commit Brand Updates
              </button>
            </div>

          </form>
        </div>

        {/* Right column: Analytics reporting logs (Module 3) */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-xl border border-brand-slate-200 p-6 space-y-4">
            <div className="border-b border-brand-slate-100 pb-2">
              <h2 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-teal-500" />
                Public Traffic Analytics
              </h2>
              <p className="text-[11px] text-brand-slate-500">Real-time visitor logs from your published portal.</p>
            </div>

            {/* Bento cards for mini counters */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-brand-slate-50 border border-brand-slate-105 p-2 rounded-lg text-center space-y-1">
                <div className="w-6 h-6 rounded-md bg-brand-teal-500/10 text-brand-teal-600 flex items-center justify-center mx-auto">
                  <Eye className="w-3 h-3" />
                </div>
                <span className="text-[18px] font-bold text-brand-slate-900 block">{pageViews}</span>
                <span className="text-[9px] text-brand-slate-500 block leading-none font-semibold">Page Views</span>
              </div>

              <div className="bg-brand-slate-50 border border-brand-slate-105 p-2 rounded-lg text-center space-y-1">
                <div className="w-6 h-6 rounded-md bg-brand-amber-500/10 text-brand-amber-600 flex items-center justify-center mx-auto">
                  <MousePointerClick className="w-3 h-3" />
                </div>
                <span className="text-[18px] font-bold text-brand-slate-900 block">{propertyClicks}</span>
                <span className="text-[9px] text-brand-slate-500 block leading-none font-semibold">Property Opens</span>
              </div>

              <div className="bg-brand-slate-50 border border-brand-slate-105 p-2 rounded-lg text-center space-y-1">
                <div className="w-6 h-6 rounded-md bg-green-500/10 text-green-600 flex items-center justify-center mx-auto">
                  <Users className="w-3 h-3" />
                </div>
                <span className="text-[18px] font-bold text-brand-slate-900 block">{inquiryConversions}</span>
                <span className="text-[9px] text-brand-slate-500 block leading-none font-semibold">Leads Captured</span>
              </div>
            </div>

            {/* Active conversion state metric banner */}
            <div className="bg-brand-teal-50/50 border border-brand-teal-100 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-brand-teal-700 font-bold">
                <span className="flex items-center gap-1 uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3" /> Traffic Conversion rate
                </span>
                <span>{pageViews > 0 ? ((inquiryConversions / pageViews) * 100).toFixed(1) : '0'}%</span>
              </div>
              <div className="w-full bg-brand-teal-200/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-teal-600 h-full rounded-full" 
                  style={{ width: `${pageViews > 0 ? Math.min((inquiryConversions / pageViews) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Activity chronological event logs */}
          <div className="bg-white rounded-xl border border-brand-slate-200 p-6 space-y-4">
            <div className="border-b border-brand-slate-100 pb-2">
              <h3 className="text-xs font-bold text-brand-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-teal-500" />
                Public Event Streaming log
              </h3>
              <p className="text-[10px] text-brand-slate-500">Live feed of visitor sessions logged by standard web counters.</p>
            </div>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 bg-brand-slate-50 rounded-lg border border-dashed border-brand-slate-200 text-brand-slate-500 space-y-1">
                  <p className="text-xs font-semibold">No public clicks collected yet.</p>
                  <p className="text-[9px]">Open your public agency portal is list above to record traffic activity.</p>
                </div>
              ) : (
                filteredEvents.slice().reverse().map((ev) => (
                  <div key={ev.id} className="border-b border-brand-slate-100 pb-2 last:border-0 last:pb-0 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none ${
                        ev.event_type === 'lead_inquiry' ? 'bg-green-100 text-green-700' :
                        ev.event_type === 'property_view' ? 'bg-amber-100 text-amber-700' :
                        'bg-brand-slate-100 text-brand-slate-700'
                      }`}>
                        {ev.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-mono text-brand-slate-500">
                        {new Date(ev.created_at || '').toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-brand-slate-800 leading-snug">
                      {ev.event_type === 'page_view' && <span>Opened portal landing: <strong className="font-mono text-brand-slate-600">{ev.path}</strong></span>}
                      {ev.event_type === 'property_view' && <span>Checked Property card ID: <strong className="font-mono font-bold text-brand-slate-700">{ev.property_id || ev.path}</strong></span>}
                      {ev.event_type === 'lead_inquiry' && <span>Client submitted contact form</span>}
                    </p>
                    
                    {ev.visitor_id && (
                      <p className="text-[9px] text-brand-slate-400 font-mono">Visitor Signature: {ev.visitor_id.substring(0, 8)}...</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
