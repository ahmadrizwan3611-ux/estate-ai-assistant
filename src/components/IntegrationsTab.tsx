import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  MessageSquareCode, 
  Settings2, 
  Send, 
  Terminal, 
  Layers, 
  Check, 
  RefreshCw, 
  X,
  Play,
  HelpCircle,
  FileSpreadsheet,
  Facebook,
  Database,
  MapPin,
  Flame,
  Info
} from 'lucide-react';
import { IntegrationCatalogItem, AgencyIntegration, WhatsAppConnection } from '../types';

interface IntegrationsTabProps {
  onIntegrationsChanged: () => void;
}

export default function IntegrationsTab({ onIntegrationsChanged }: IntegrationsTabProps) {
  const [catalog, setCatalog] = useState<IntegrationCatalogItem[]>([]);
  const [connected, setConnected] = useState<AgencyIntegration[]>([]);
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // WhatsApp Settings state
  const [displayPhone, setDisplayPhone] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('estateai_verify_token_secure');
  const [autoReply, setAutoReply] = useState(true);
  
  // Simulator inputs
  const [simContactName, setSimContactName] = useState('Chaudhary Bilal');
  const [simPhoneNumber, setSimPhoneNumber] = useState('923007654321');
  const [simMessageText, setSimMessageText] = useState('A0A! DHA Phase 6 Lahore me 5 Marla modern house available h? Under 1.8 Crore.');
  const [simulating, setSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<Array<{ sender: string; text: string; time: string }>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resCatalog = await fetch('/api/integrations');
      const dataCatalog = await resCatalog.json();
      setCatalog(dataCatalog.catalog || []);
      setConnected(dataCatalog.connected || []);

      const resWa = await fetch('/api/whatsapp/settings');
      const dataWa = await resWa.json();
      setWhatsappSettings(dataWa);
      
      // Populate WhatsApp forms
      setDisplayPhone(dataWa.display_phone_number || '');
      setPhoneNumberId(dataWa.phone_number_id || '');
      setBusinessAccountId(dataWa.business_account_id || '');
      setAccessToken(dataWa.access_token_placeholder || '');
      setVerifyToken(dataWa.webhook_verify_token || 'estateai_verify_token_secure');
      setAutoReply(dataWa.auto_reply_enabled !== false);
    } catch (e) {
      console.error('Failed to fetching integrations catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_phone_number: displayPhone,
          phone_number_id: phoneNumberId,
          business_account_id: businessAccountId,
          access_token_placeholder: accessToken,
          webhook_verify_token: verifyToken,
          auto_reply_enabled: autoReply
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettings(data);
        onIntegrationsChanged();
        alert('Meta WhatsApp credentials saved successfully on secure server keychain.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleIntegration = async (key: string, currentStatus: string) => {
    const isConnected = currentStatus === 'connected' || currentStatus === 'simulation_mode';
    const newStatus = isConnected ? 'not_connected' : 'simulation_mode';
    
    try {
      const res = await fetch(`/api/integrations/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, settings: {} })
      });
      if (res.ok) {
        fetchData();
        onIntegrationsChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // WEBHOOK TESTING LAB SIMULATOR (Module 5)
  const handleTriggerSimulateWebhook = async () => {
    if (!simMessageText.trim()) return;
    setSimulating(true);
    
    // Add client message immediately to local simulated simulator screen logs
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSimulationLogs(prev => [...prev, { sender: 'customer', text: simMessageText, time: nowTime }]);

    // Formulate Meta WhatsApp Webhook Mock payload standard schema
    const webhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: businessAccountId || "8837465261",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: displayPhone || "+92 300 1234567",
                  phone_number_id: phoneNumberId || "10984857263544"
                },
                contacts: [
                  {
                    profile: { name: simContactName },
                    wa_id: simPhoneNumber
                  }
                ],
                messages: [
                  {
                    from: simPhoneNumber,
                    id: `wamid.HBgLOTIzMDA3NjU0MzIxFQIAERgSQjE4MkRCMTlFRUM0NTk...`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: simMessageText },
                    type: "text"
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    };

    try {
      const res = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      
      if (res.ok) {
        // Wait 1.8 seconds to simulate network lag and Groq token generation delay
        setTimeout(async () => {
          // Pull leads list, find our lead, and fetch last message to stream in the debug terminal
          const resLeads = await fetch('/api/leads');
          const dataLeads = await resLeads.json();
          const targetLead = dataLeads.find((l: any) => l.phone.includes(simPhoneNumber) || simPhoneNumber.includes(l.phone));
          
          if (targetLead) {
            const resMsgs = await fetch(`/api/chat/history?leadId=${targetLead.id}`);
            const dataMsgs = await resMsgs.json();
            const lastAIResponse = dataMsgs.slice().reverse().find((m: any) => m.sender === 'agent_ai');
            if (lastAIResponse) {
              setSimulationLogs(prev => [...prev, { 
                sender: 'agent_ai', 
                text: lastAIResponse.message, 
                time: new Date(lastAIResponse.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]);
            }
          }
          setSimulating(false);
          setSimMessageText('');
        }, 1800);
      } else {
        setSimulating(false);
      }
    } catch (err) {
      console.error(err);
      setSimulating(false);
    }
  };

  const clearSimLogs = () => {
    setSimulationLogs([]);
  };

  const getCatalogIcon = (key: string) => {
    switch (key) {
      case 'whatsapp': return <MessageSquareCode className="w-5 h-5 text-brand-teal-500" />;
      case 'fb_leads': return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'g_sheets': return <Database className="w-5 h-5 text-emerald-600" />;
      case 'g_maps': return <MapPin className="w-5 h-5 text-red-500" />;
      case 'sms_gateway': return <Send className="w-5 h-5 text-indigo-500" />;
      case 'csv_helper': return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      default: return <Sliders className="w-5 h-5 text-brand-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-slate-500">Connecting marketplace pipelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Banner summary */}
      <div className="bg-white rounded-xl border border-brand-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-brand-teal-500 text-brand-slate-950 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
              Marketplace Integrations
            </span>
            <span className="text-brand-slate-500 text-xs font-mono">• Active Plugins Extension Hub</span>
          </div>
          <h1 className="text-lg font-bold font-display tracking-tight text-brand-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-teal-500" />
            Connected Apps & Integrations
          </h1>
          <p className="text-xs text-brand-slate-500">
            Link Meta WhatsApp Business endpoints, lead-capture forms, CRM spreadsheets, OLX/Zameen scrapers, and localized SMS portals.
          </p>
        </div>
      </div>

      {/* Grid: First section catalogs (Module 7) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.map((item) => {
          const connRec = connected.find(c => c.integration_key === item.key);
          const isLinked = connRec && connRec.status !== 'not_connected';
          const currentStatus = connRec ? connRec.status : 'not_connected';

          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-xl border p-5 space-y-4 shadow-sm transition-all flex flex-col justify-between ${
                isLinked ? 'border-brand-teal-500 bg-brand-teal-50/5' : 'border-brand-slate-200'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  {getCatalogIcon(item.key)}
                  
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    currentStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' :
                    currentStatus === 'simulation_mode' ? 'bg-amber-105 text-brand-teal-700 border border-brand-teal-500/20' :
                    'bg-brand-slate-100 text-brand-slate-550'
                  }`}>
                    {currentStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-brand-slate-900 leading-tight block">{item.name}</h3>
                  <span className="text-[9px] text-brand-slate-400 font-bold block">{item.category} • Free Plugin</span>
                  <p className="text-[10px] text-brand-slate-500 leading-relaxed pt-1">{item.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-brand-slate-100 flex items-center justify-between">
                <span className="text-[9px] text-brand-slate-400 font-mono">Key: {item.key}</span>
                <button
                  onClick={() => handleToggleIntegration(item.key, currentStatus)}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    isLinked 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' 
                      : 'bg-brand-slate-900 text-white hover:bg-brand-slate-800'
                  }`}
                >
                  {isLinked ? 'Disconnect Plugin' : 'Activate Plugin'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Left column (2/3 width): WhatsApp Meta Credentials Setup Form (Module 5) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-brand-slate-200 p-6 space-y-6">
          <div className="border-b border-brand-slate-100 pb-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-brand-slate-900 flex items-center gap-1.5">
                <MessageSquareCode className="w-5 h-5 text-brand-teal-500" />
                Meta WhatsApp Business Settings API
              </h2>
              <p className="text-[11px] text-brand-slate-500">Configure OAuth webhooks credentials keys to connect real-time messaging.</p>
            </div>
            
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-slate-750 cursor-pointer">
              <input 
                type="checkbox"
                checked={autoReply}
                onChange={(e) => setAutoReply(e.target.checked)}
                className="rounded border-brand-slate-300 text-brand-teal-600 focus:ring-brand-teal-500 cursor-pointer w-4 h-4"
              />
              <span>Auto AI Reply</span>
            </label>
          </div>

          <form onSubmit={handleUpdateWhatsApp} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-brand-slate-700 font-semibold mb-1">Display Call Number</label>
              <input 
                type="text" 
                required
                value={displayPhone} 
                onChange={(e) => setDisplayPhone(e.target.value)}
                className="w-full bg-white border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500"
                placeholder="e.g. +92 300 1234567"
              />
            </div>

            <div>
              <label className="block text-brand-slate-700 font-semibold mb-1">Phone Number ID (Meta API)</label>
              <input 
                type="text" 
                required
                value={phoneNumberId} 
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="w-full bg-white border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500"
                placeholder="e.g. 10984857263544"
              />
            </div>

            <div>
              <label className="block text-brand-slate-700 font-semibold mb-1">Meta Business Account ID</label>
              <input 
                type="text" 
                required
                value={businessAccountId} 
                onChange={(e) => setBusinessAccountId(e.target.value)}
                className="w-full bg-white border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500"
                placeholder="e.g. 8837465261"
              />
            </div>

            <div>
              <label className="block text-brand-slate-700 font-semibold mb-1">Webhook Verify Token String</label>
              <input 
                type="text" 
                required
                value={verifyToken} 
                onChange={(e) => setVerifyToken(e.target.value)}
                className="w-full bg-white border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500 font-mono text-brand-slate-700"
                placeholder="estateai_verify_token_secure"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-brand-slate-700 font-semibold mb-1">Meta System User Access Token Key (EAAGb...)</label>
              <textarea 
                rows={2}
                required
                value={accessToken} 
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full bg-white border border-brand-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-500 font-mono text-[10px]"
                placeholder="EAAGbYvNlWv8BO2... (Meta OAuth Cloud access key)"
              />
            </div>

            <div className="md:col-span-2 pt-2 border-t border-brand-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-brand-slate-400">Meta Callback Webhook URL: (Your deployment domain)/api/webhooks/whatsapp</span>
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-brand-slate-900 hover:bg-brand-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {savingSettings ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sliders className="w-3.5 h-3.5" />
                )}
                Save Meta Config
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Sandbox Webhook Testing Simulator (Module 5 Testing Lab) */}
        <div className="bg-brand-slate-900 border border-brand-slate-950 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg h-[510px]">
          
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <div className="border-b border-brand-slate-800 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5 font-display text-brand-teal-400">
                  <Terminal className="w-4 h-4" />
                  Meta Webhook Sandbox Lab
                </h3>
                <span className="bg-red-500/10 text-red-400 text-[8px] font-bold border border-red-500/20 px-1.5 py-0.5 rounded uppercase leading-none font-mono">
                  Sandbox Active
                </span>
              </div>
              <p className="text-[10px] text-brand-slate-400 leading-normal pt-1">
                Fires authentic Meta webhook SMS schemas directly to our node endpoint to verify AI Continuity algorithms.
              </p>
            </div>

            {/* Simulated Live Messaging Terminal window */}
            <div className="flex-1 bg-brand-slate-950 border border-brand-slate-850 rounded-lg p-3 overflow-y-auto space-y-2.5 min-h-[140px]">
              {simulationLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-brand-slate-600 px-4">
                  <p className="text-[10px] italic">No sandboxed events recorded. Type a client request below to activate real-time test loops.</p>
                </div>
              ) : (
                simulationLogs.map((log, index) => (
                  <div key={index} className={`flex flex-col space-y-0.5 max-w-[85%] ${log.sender === 'customer' ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
                    <span className="text-[8px] tracking-wide text-brand-slate-500 font-bold uppercase leading-none font-mono flex items-center gap-1">
                      {log.sender === 'customer' ? '👨 Client Webhook text' : '🤖 Groq Continuity AI'} • {log.time}
                    </span>
                    
                    <div className={`p-2 rounded-lg text-[10.5px] leading-relaxed whitespace-pre-wrap ${
                      log.sender === 'customer' 
                        ? 'bg-brand-slate-800 text-brand-slate-100 rounded-tl-none border border-brand-slate-700' 
                        : 'bg-brand-teal-950/40 text-brand-teal-300 border border-brand-teal-900 rounded-tr-none'
                    }`}>
                      {log.text}
                    </div>
                  </div>
                ))
              )}
              {simulating && (
                <div className="mr-auto items-start max-w-[80%] flex flex-col space-y-1">
                  <span className="text-[8px] text-brand-slate-500 font-bold uppercase leading-none font-mono animate-pulse">Running Groq Continuity Engine...</span>
                  <div className="bg-brand-slate-900 border border-brand-slate-800 text-brand-slate-400 p-2.5 rounded-lg rounded-tl-none text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-brand-teal-500 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-brand-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-1 bg-brand-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      <span className="italic text-[10px] pl-1 text-brand-slate-500">Matching CRM data & crafting Urdu mix reply...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sender form fields */}
          <div className="space-y-2 border-t border-brand-slate-800 pt-3">
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
              <div>
                <span className="text-brand-slate-500 block mb-0.5 font-bold">Simulator Name:</span>
                <input 
                  type="text" 
                  value={simContactName} 
                  onChange={(e) => setSimContactName(e.target.value)}
                  className="w-full bg-brand-slate-950 border border-brand-slate-800 text-brand-slate-150 p-1.5 rounded text-[10px] focus:outline-none focus:border-brand-teal-500"
                />
              </div>
              
              <div>
                <span className="text-brand-slate-500 block mb-0.5 font-bold">Client Pakistan PK Number:</span>
                <input 
                  type="text" 
                  value={simPhoneNumber} 
                  onChange={(e) => setSimPhoneNumber(e.target.value)}
                  className="w-full bg-brand-slate-950 border border-brand-slate-800 text-brand-slate-150 p-1.5 rounded text-[10px] focus:outline-none focus:border-brand-teal-500"
                />
              </div>
            </div>

            <div>
              <span className="text-brand-slate-550 block mb-0.5 text-[9px] font-mono font-bold">Type Client Prompt (Urdu/Roman/Eng):</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={simMessageText} 
                  onChange={(e) => setSimMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTriggerSimulateWebhook()}
                  disabled={simulating}
                  placeholder="e.g. Mujhe Phase 6 dha me shop chahye..."
                  className="flex-1 bg-brand-slate-950 border border-brand-slate-800 text-brand-slate-200 p-2 rounded text-[10.5px] focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500/20 disabled:opacity-50"
                />
                
                <button
                  type="button"
                  disabled={simulating || !simMessageText.trim()}
                  onClick={handleTriggerSimulateWebhook}
                  className="bg-brand-teal-500 hover:bg-brand-teal-400 text-brand-slate-950 font-bold p-2.5 rounded-lg transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-brand-slate-500">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Webhook triggers POST `/api/webhooks/whatsapp`
              </span>
              
              {simulationLogs.length > 0 && (
                <button 
                  onClick={clearSimLogs} 
                  className="text-brand-slate-400 hover:text-red-400 font-mono font-bold"
                >
                  Clear Console
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
