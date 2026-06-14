import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Check, 
  Sliders, 
  Maximize2, 
  Send,
  HelpCircle,
  Clock,
  Heart,
  Globe,
  Share2
} from 'lucide-react';
import { Property, AgencySiteSettings } from '../types';

export default function PublicPortal() {
  const [slug, setSlug] = useState('pak-prime');
  const [settings, setSettings] = useState<AgencySiteSettings | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  
  // Filtering inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Lead Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientMsg, setClientMsg] = useState('');

  useEffect(() => {
    // Parse slug from URL (e.g., /site/pak-prime or similar paths)
    const paths = window.location.pathname.split('/');
    const portalSlug = paths[paths.indexOf('site') + 1] || 'pak-prime';
    setSlug(portalSlug);

    fetchPortalData(portalSlug);
    logEvent(portalSlug, 'page_view', `/site/${portalSlug}`);
  }, []);

  const fetchPortalData = async (targetSlug: string) => {
    setLoading(true);
    try {
      // 1. Fetch live public website configurations from settings
      const settingsRes = await fetch(`/api/public/site/${targetSlug}`);
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // 2. Fetch CRM properties direct list
      const propertiesRes = await fetch('/api/properties');
      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      }
    } catch (e) {
      console.error('Failed to resolve public routing components:', e);
    } finally {
      setLoading(false);
    }
  };

  const logEvent = async (targetSlug: string, eventType: string, path: string, propertyId?: string) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: targetSlug,
          event_type: eventType,
          path,
          property_id: propertyId
        })
      });
    } catch (err) {
      // Background analytic error ignored silently
    }
  };

  const handlePropertyClick = (propertyId: string, title: string) => {
    logEvent(slug, 'property_view', `/site/${slug}/property/${propertyId}`, propertyId);
    alert(`Showing information for "${title}". Your agency advisor is prepared to schedule site visits through simulated WhatsApp logs!`);
  };

  const handleInquiryChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;
    setSubmittingInquiry(true);
    setInquirySuccess(false);

    try {
      // Create a capture Lead transaction in customer records
      const res = await fetch('/api/public/site/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          message: clientMsg || `Inquired regarding listings on ${slug} portal.`
        })
      });

      if (res.ok) {
        // Track the conversion event
        await logEvent(slug, 'lead_inquiry', `/site/${slug}/contact-submitted`);
        
        setClientName('');
        setClientPhone('');
        setClientEmail('');
        setClientMsg('');
        setInquirySuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-slate-50">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-slate-600 font-semibold tracking-wide uppercase">Assembling Agency Portal Showcase...</p>
        </div>
      </div>
    );
  }

  // Handle unpublished portals
  if (settings && settings.is_published === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-slate-900 text-white p-6">
        <div className="max-w-md text-center space-y-4">
          <Globe className="w-12 h-12 text-teal-400 mx-auto animate-pulse" />
          <h1 className="text-xl font-bold">Portal Under Construction</h1>
          <p className="text-xs text-brand-slate-400">
            The workspace administrator for "{slug.toUpperCase()}" has temporarily unpublished this portal. Check back shortly for premium property listings.
          </p>
          <a href="/" className="bg-teal-500 text-brand-slate-950 font-bold px-4 py-2 rounded text-xs inline-block">
            Dashboard Panel login
          </a>
        </div>
      </div>
    );
  }

  // Render Theme configurations
  const themeId = settings?.theme_id || 'classic_agency';
  const primaryColor = settings?.primary_color || '#0d9488';

  const isClassic = themeId === 'classic_agency';
  const isRoyal = themeId === 'royal_estate';
  const isMinimal = themeId === 'modern_minimal';

  // Apply typography classes
  let fontClass = 'font-sans';
  let themeBgClass = 'bg-brand-slate-50';
  let containerInnerClass = 'bg-white rounded-xl border border-brand-slate-205';

  if (isClassic) {
    fontClass = 'font-sans';
    themeBgClass = 'bg-brand-slate-50';
  } else if (isRoyal) {
    fontClass = 'font-serif';
    themeBgClass = 'bg-[#faf6f0]';
  } else if (isMinimal) {
    fontClass = 'font-mono text-xs';
    themeBgClass = 'bg-zinc-50';
  }

  // Filter properties list
  const filteredProperties = properties.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || p.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className={`min-h-screen ${fontClass} ${themeBgClass} text-brand-slate-900 transition-colors duration-300 pb-16`}>
      
      {/* Header element */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b bg-white/90 ${
        isRoyal ? 'border-amber-200 bg-[#fffdfa]/95' : 
        isMinimal ? 'border-black bg-white' : 'border-brand-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow"
              style={{ backgroundColor: primaryColor }}
            >
              {settings?.public_name ? settings.public_name.substring(0, 1).toUpperCase() : 'A'}
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-brand-slate-900 block font-display">
                {settings?.public_name || 'EstateAI Portal'}
              </span>
              <span className="text-[9px] uppercase tracking-wider block font-bold" style={{ color: primaryColor }}>
                Verified Continuity Broker
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-brand-slate-500 font-medium hidden sm:inline flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              {settings?.whatsapp_number || '0300-1234567'}
            </span>
            <a 
              href="#contact-form"
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Book Visit
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className={`relative overflow-hidden ${
        isRoyal ? 'border-b border-amber-100 bg-gradient-to-b from-amber-500/5 to-transparent py-20 pb-24' :
        isMinimal ? 'border-b border-black py-12 md:py-20' :
        'bg-gradient-to-r from-brand-slate-900 to-brand-slate-800 text-white py-16 md:py-24'
      }`}>
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <span className="bg-teal-50 text-teal-700 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded inline-block">
            📍 Welcome to Pakistani Estates Portal
          </span>
          <h1 className={`text-2xl md:text-4xl font-extrabold tracking-tight ${
            isRoyal ? 'text-amber-950 font-serif' : 
            isMinimal ? 'text-black font-mono leading-tight' : 'text-white'
          }`}>
            {settings?.hero_title || 'Premier Property Showcase'}
          </h1>
          <p className={`text-xs md:text-sm max-w-2xl mx-auto leading-relaxed ${
            isRoyal ? 'text-amber-800' :
            isMinimal ? 'text-zinc-600' : 'text-brand-slate-300'
          }`}>
            {settings?.hero_subtitle || 'Authorized listings managed under smart real-time response filters.'}
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Listings display column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-brand-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-brand-slate-900">Featured Properties</h2>
              <p className="text-[10px] text-brand-slate-500">Filtered real estate entries actively synchronized in CRM database.</p>
            </div>

            <div className="flex gap-2 text-xs">
              <input 
                type="text" 
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-brand-slate-50 border border-brand-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none w-36 sm:w-48"
              />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-brand-slate-50 border border-brand-slate-200 text-xs px-2 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="all">All types</option>
                <option value="House">House</option>
                <option value="Apartment">Apartment</option>
                <option value="Plot">Plot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProperties.length === 0 ? (
              <div className="p-10 border border-dashed text-center rounded-xl bg-white col-span-2 text-brand-slate-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-brand-slate-300" />
                <p className="text-xs font-semibold">No property entries matching filters.</p>
              </div>
            ) : (
              filteredProperties.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => handlePropertyClick(p.id, p.title)}
                  className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                    isRoyal ? 'border-amber-100 hover:border-amber-300' :
                    isMinimal ? 'border-black hover:ring-1 hover:ring-black' : 'border-brand-slate-200'
                  }`}
                >
                  <div>
                    {/* Dummy local mock Image Banner */}
                    <div className="bg-brand-slate-900 text-white h-40 flex flex-col justify-between p-3 relative font-sans">
                      <span className="bg-brand-slate-950/80 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider block self-start">
                        {p.type}
                      </span>
                      {p.price && (
                        <span className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded inline-block self-end shadow">
                          PKR {p.price}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1.5 text-xs">
                      <h3 className="font-bold text-brand-slate-900 line-clamp-1">{p.title}</h3>
                      <p className="text-brand-slate-550 flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-brand-slate-400" />
                        {p.location}
                      </p>
                      
                      {/* Metric specs */}
                      <div className="grid grid-cols-3 gap-2 text-[10px] leading-tight text-brand-slate-500 pt-2 border-t border-brand-slate-100 font-semibold font-mono">
                        <div>Beds: {p.beds || 'N/A'}</div>
                        <div>Baths: {p.baths || 'N/A'}</div>
                        <div>Area: {p.size || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-brand-slate-50 flex items-center justify-between">
                    <span className="text-[9px] text-brand-slate-405">Featured</span>
                    <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: primaryColor }}>
                      Request Visit <Maximize2 className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form panel column (1/3 width) */}
        <div id="contact-form" className="space-y-6">
          
          <div className="bg-white p-6 rounded-xl border border-brand-slate-205 shadow-sm space-y-4">
            <div className="border-b border-brand-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-brand-slate-900 flex items-center gap-1.5">
                <Send className="w-4 h-4" style={{ color: primaryColor }} />
                Inquire & Book Consultation
              </h2>
              <p className="text-[11px] text-brand-slate-500 leading-normal">
                Submit an inquiry instantly. Our Continuity Engine locks your ticket and responds over WhatsApp instantly!
              </p>
            </div>

            <form onSubmit={handleInquiryChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Your Full Name</label>
                <input 
                  type="text" 
                  required
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-brand-slate-50 border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500"
                  placeholder="e.g. Chaudhary Bilal"
                />
              </div>

              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">WhatsApp Cell Number</label>
                <input 
                  type="text" 
                  required
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-brand-slate-50 border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500"
                  placeholder="e.g. 0300-1234567"
                />
              </div>

              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Email (Optional)</label>
                <input 
                  type="email" 
                  value={clientEmail} 
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-brand-slate-50 border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500"
                  placeholder="name@gmail.com"
                />
              </div>

              <div>
                <label className="block text-brand-slate-700 font-semibold mb-1">Your Requirements Message</label>
                <textarea 
                  rows={3}
                  value={clientMsg} 
                  onChange={(e) => setClientMsg(e.target.value)}
                  className="w-full bg-brand-slate-50 border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500"
                  placeholder="Detail your pre-requisites: Phase, sector, budget limit, size choice..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingInquiry}
                className="w-full text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow"
                style={{ backgroundColor: primaryColor }}
              >
                {submittingInquiry ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Register Requirements
              </button>
            </form>

            {inquirySuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-lg space-y-1 text-[11px]">
                <strong className="block font-bold">✨ Ticket Created Successfully!</strong>
                <p className="leading-snug">
                  Your requirements are locked on the CRM ledger cache. Simulated WhatsApp follow-ups will log automatically in active panels!
                </p>
              </div>
            )}
          </div>

          {/* About us cards */}
          <div className="bg-white p-6 rounded-xl border border-brand-slate-205 shadow-sm space-y-3">
            <div>
              <h3 className="text-xs font-bold text-brand-slate-900 uppercase tracking-wider">About Our Corporation</h3>
              <div className="w-10 h-0.5 bg-brand-teal-500 mt-1" style={{ backgroundColor: primaryColor }} />
            </div>
            
            <p className="text-[11px] text-brand-slate-500 leading-relaxed italic">
              "{settings?.about_text || 'Professional real estate agency centered around Lahore & Karachi property portfolio.'}"
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}
