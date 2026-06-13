import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Brain, Clock, ShieldCheck, MapPin, UserCheck, MessageSquare, Play, HelpCircle, FileText, Settings, Heart, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, ConversationMessage, LeadAIMemory, Property, LeadStatus } from '../types';

interface ConversationsTabProps {
  leads: Lead[];
  onLeadStatusChanged: () => void;
}

export default function ConversationsTab({ leads, onLeadStatusChanged }: ConversationsTabProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [memory, setMemory] = useState<LeadAIMemory | null>(null);
  const [matchedProperties, setMatchedProperties] = useState<Property[]>([]);
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Predefined scenario buttons to test user's requirements with 1-click
  const TEST_SCENARIOS = [
    {
      label: "1. Search DHA (New)",
      msg: "I need a 5 marla house in DHA Lahore under 2 crore. Is anything available?",
      desc: "Starts a new requirement search for DHA Lahore 5 Marla under 2 cr."
    },
    {
      label: "2. Ask Option 2 (Follow-up)",
      msg: "how is 2nd one which price is 1.85 crore?",
      desc: "References Option 2 from last search and parses specific selected option."
    },
    {
      label: "3. Furnished Status? (Missing Info)",
      msg: "is it furnished?",
      desc: "Asks about furnished info. Triggers Missing Info rule."
    },
    {
      label: "4. Map Location Pin (Map)",
      msg: "location pin share kar dein",
      desc: "Fetches and shares map link for the active Option."
    },
    {
      label: "5. Negotiate Price (Negotiation)",
      msg: "price thori kam ho sakti hai?",
      desc: "Asks for discounts. Triggers local owner negotiation disclaimer."
    },
    {
      label: "6. Verification ('Sure?')",
      msg: "are you sure?",
      desc: "Prompts re-verification of original criteria without switching search."
    },
    {
      label: "7. Swap to Bahria (Swap Search)",
      msg: "Actually mujhe Bahria Town mein 10 marla house chahiye",
      desc: "Discards DHA Lahore memory. Swaps to Bahria Town 10 Marla House."
    }
  ];

  // Auto-select first lead on load
  useEffect(() => {
    if (leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads]);

  // Load chat & memory when lead changes
  useEffect(() => {
    if (selectedLeadId) {
      loadLeadConversationContext(selectedLeadId);
    }
  }, [selectedLeadId]);

  // Auto Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadLeadConversationContext = async (leadId: string) => {
    setLoadingChat(true);
    try {
      // 1. Fetch conversations log
      const resChat = await fetch(`/api/leads/${leadId}/chat`);
      const dataChat = await resChat.json();
      setMessages(Array.isArray(dataChat) ? dataChat : []);

      // 2. Fetch Lead AI Memory state
      const resMem = await fetch(`/api/leads/${leadId}/memory`);
      const dataMem = await resMem.json();
      setMemory(dataMem);

      // 3. Query properties matched with the current lead requirement to show live at the top
      if (dataMem && dataMem.current_requirement) {
        queryMatchedCRMProps(dataMem.current_requirement);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChat(false);
    }
  };

  const queryMatchedCRMProps = async (requirement: any) => {
    try {
      const res = await fetch('/api/properties');
      const allProps: Property[] = await res.json();
      
      // Local client-side double check matching to mirror server logic
      const reqCity = requirement.city?.toLowerCase().trim() || null;
      const reqArea = requirement.area?.toLowerCase().trim() || null;
      const reqSize = requirement.size?.toLowerCase().trim() || null;
      const reqType = requirement.property_type?.toLowerCase().trim() || null;
      const maxBudget = requirement.max_budget?.toLowerCase().trim() || '';

      // Simple filter logic for instant visual state matching
      const matches = allProps.filter(p => {
        if (reqCity && p.city.toLowerCase() !== reqCity) return false;
        
        if (reqArea) {
          // handle DHA group synonyms
          if (reqArea.includes('dha') || reqArea.includes('defence')) {
            if (!p.area.toLowerCase().includes('dha') && !p.title.toLowerCase().includes('dha')) return false;
            if (p.city.toLowerCase() !== 'lahore') return false;
          } else {
            const hasArea = p.area.toLowerCase().includes(reqArea) || 
                            p.title.toLowerCase().includes(reqArea) || 
                            reqArea.includes(p.area.toLowerCase());
            if (!hasArea) return false;
          }
        }
        
        if (reqSize) {
          const normPSize = p.size.toLowerCase().replace(/\s+/g, '');
          const normRSize = reqSize.replace(/\s+/g, '');
          if (normPSize !== normRSize && !normPSize.includes(normRSize) && !normRSize.includes(normPSize)) return false;
        }

        if (reqType && p.type.toLowerCase() !== reqType) return false;

        // price check
        if (maxBudget) {
          let reqBudgetNum = Infinity;
          const numMatch = maxBudget.match(/([0-9.]+)/);
          if (numMatch) {
            const val = parseFloat(numMatch[1]);
            if (!isNaN(val)) {
              if (maxBudget.includes('crore') || maxBudget.includes('cr')) reqBudgetNum = val * 10000000;
              else if (maxBudget.includes('lakh') || maxBudget.includes('lac')) reqBudgetNum = val * 100000;
              else if (val < 1000) reqBudgetNum = val * 10000000; // default crore
              else reqBudgetNum = val;
            }
          }
          if (p.price > reqBudgetNum) return false;
        }

        return true;
      });

      setMatchedProperties(matches);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || !selectedLeadId || sending) return;
    setSending(true);

    try {
      // Direct POST API call runs through the server matching and Continuity Memory sequence
      const res = await fetch(`/api/leads/${selectedLeadId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText })
      });

      if (res.ok) {
        setCustomMsg('');
        onLeadStatusChanged(); // Refresh sidebar priority levels
        await loadLeadConversationContext(selectedLeadId);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to trigger simulated continuity response.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleManualRequirementUpdate = async (field: string, val: string | null) => {
    if (!memory || !selectedLeadId) return;
    
    const updatedReq = {
      ...memory.current_requirement,
      [field]: val
    };

    try {
      const res = await fetch(`/api/leads/${selectedLeadId}/memory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_requirement: updatedReq })
      });
      if (res.ok) {
        setMemory(prev => prev ? { ...prev, current_requirement: updatedReq } : null);
        queryMatchedCRMProps(updatedReq);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeLead = leads.find(l => l.id === selectedLeadId);

  return (
    <div id="chat-tab" className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* 1. Left Leads sidebar list */}
      <div className="w-80 bg-white border-r border-brand-slate-200 flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b border-brand-slate-200 bg-brand-slate-50">
          <h2 className="text-sm font-display font-bold text-brand-slate-900 uppercase tracking-wide">
            Leads WhatsApp Logs
          </h2>
          <p className="text-[11px] text-brand-slate-700">Click a customer to preview conversation & matching memory.</p>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-brand-slate-100">
          {leads.map((l) => {
            const isSelected = l.id === selectedLeadId;
            return (
              <button
                key={l.id}
                onClick={() => setSelectedLeadId(l.id)}
                className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 cursor-pointer hover:bg-brand-slate-50 ${
                  isSelected ? 'bg-brand-teal-50 border-l-4 border-brand-teal-500 hover:bg-brand-teal-50' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-brand-slate-900">{l.name}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    l.status === 'Hot' ? 'bg-red-50 text-red-600 border-red-200' :
                    l.status === 'Warm' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {l.status}
                  </span>
                </div>
                <div className="text-[11px] text-brand-slate-700 font-mono truncate w-full">
                  📞 {l.phone}
                </div>
                <div className="text-[11px] text-brand-slate-200/90 truncate w-full italic">
                  {l.requirement_notes || 'Stated requirement analysis...'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Middle live conversations bubble panel */}
      <div className="flex-1 bg-brand-slate-50 flex flex-col h-full overflow-hidden border-r border-brand-slate-200">
        {activeLead ? (
          <>
            {/* Top Bar showing LIVE Matched CRM bento summary */}
            <div className="bg-white p-4 border-b border-brand-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-teal-500" />
                  Live Matched CRM Listings ({matchedProperties.length})
                </span>
                {memory?.current_requirement && (
                  <span className="text-[11px] font-mono font-medium text-brand-teal-700 bg-brand-teal-50 px-2 py-0.5 rounded-md">
                    Filter: {memory.current_requirement.size || 'No Size'} | {memory.current_requirement.area_group || 'No Area'}
                  </span>
                )}
              </div>

              {matchedProperties.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {matchedProperties.slice(0, 3).map((p, pidx) => (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-20 ${
                        memory?.active_property_id === p.id 
                          ? 'border-brand-teal-500 bg-brand-teal-500/5 shadow-xs' 
                          : 'border-brand-slate-200 bg-brand-slate-50'
                      }`}
                    >
                      <div className="truncate text-xs font-bold text-brand-slate-950">
                        Option {pidx + 1}: {p.title}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-brand-slate-750 font-mono">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-brand-slate-200 font-bold">{p.size}</span>
                        <span className="font-extrabold text-brand-teal-700">{p.price_display}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  No exact matched properties found in CRM under stated parameters. AI will ask for alternatives.
                </div>
              )}
            </div>

            {/* Scrollable messages history container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-brand-slate-700 mt-20 text-xs">
                  No conversation logs yet. Trigger one of the scenario simulation buttons below.
                </div>
              ) : (
                messages.map((m) => {
                  const isCustomer = m.sender === 'customer';
                  return (
                    <div
                      key={m.id}
                      className={`flex w-full ${isCustomer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-2xl text-xs line-height-relaxed shadow-xs whitespace-pre-wrap ${
                          isCustomer
                            ? 'bg-brand-slate-800 text-white rounded-tr-none'
                            : 'bg-white border border-brand-slate-200 text-brand-slate-900 rounded-tl-none font-sans'
                        }`}
                      >
                        {m.message}
                        
                        <div className={`mt-2 pt-1.5 border-t text-[10px] flex items-center justify-between ${
                          isCustomer ? 'border-white/10 text-white/50' : 'border-brand-slate-100 text-brand-slate-200'
                        }`}>
                          <span className="font-mono uppercase tracking-widest text-[9px]">
                            {m.sender === 'agent_ai' ? 'Continuity Engine' : m.sender.toUpperCase()}
                          </span>
                          <span>
                            {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick 1-click customer dialogue simulation console */}
            <div className="p-4 border-t border-brand-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-brand-teal-700 uppercase tracking-wider flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" />
                  1-Click Customer Test Scenario Simulator
                </span>
                <span className="text-[10px] text-brand-slate-200 italic">Select to simulate instant customer replies</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {TEST_SCENARIOS.map((ts, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(ts.msg)}
                    disabled={sending}
                    className="bg-brand-slate-100 hover:bg-brand-teal-50 border border-brand-slate-200 hover:border-brand-teal-200 hover:text-brand-teal-700 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold text-brand-slate-900 select-none cursor-pointer transition-colors max-w-[210px] truncate"
                    title={ts.desc}
                  >
                    🚀 {ts.label}
                  </button>
                ))}
              </div>

              {/* Manual input box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="bg-brand-slate-100 border border-brand-slate-200 rounded-xl px-4 py-3 text-xs text-brand-slate-900 focus:outline-none focus:border-brand-teal-500 w-full"
                  placeholder="Type simulated custom Roman Urdu or English text..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(customMsg)}
                  disabled={sending}
                />
                <button
                  onClick={() => handleSendMessage(customMsg)}
                  disabled={sending || !customMsg.trim()}
                  className="bg-brand-teal-500 hover:bg-brand-teal-600 disabled:bg-brand-teal-500/40 text-white rounded-xl px-4 flex items-center justify-center cursor-pointer transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-brand-slate-700 text-xs text-center p-6">
            Please register and select a customer lead first on the Left list to initiate conversations.
          </div>
        )}
      </div>

      {/* 3. Right AI continuity memory database specs */}
      <div className="w-80 bg-white flex flex-col h-full flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-brand-slate-200 bg-brand-slate-50 flex items-center gap-2">
          <Brain className="w-5 h-5 text-brand-teal-500" />
          <div>
            <h2 className="text-xs font-display font-bold text-brand-slate-900 uppercase tracking-wider">
              Continuity Memory Panel
            </h2>
            <p className="text-[10px] text-brand-slate-700">Real-time structured context brain.</p>
          </div>
        </div>

        {memory ? (
          <div className="p-4 space-y-5">
            {/* Stage Indicator */}
            <div>
              <span className="text-[10px] font-semibold text-brand-slate-200/80 uppercase block mb-1">Conversation State</span>
              <div className="bg-brand-teal-50 text-brand-teal-700 py-1.5 px-3 rounded-lg border border-brand-teal-200 text-xs font-bold capitalize flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-teal-500" />
                {memory.conversation_stage.replace(/_/g, ' ')}
              </div>
            </div>

            {/* Requirement list holds inputs */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-brand-slate-200/80 uppercase block mb-0.5">Stated Requirements Filter</span>
              
              <div className="space-y-1.5">
                {/* City */}
                <div className="flex items-center justify-between text-xs py-1 border-b border-brand-slate-100">
                  <span className="text-brand-slate-750 font-medium">City:</span>
                  <input
                    type="text"
                    className="bg-transparent border-none text-right font-bold text-brand-teal-700 focus:outline-none focus:underline w-32 text-xs"
                    value={memory.current_requirement.city || 'None'}
                    onChange={(e) => handleManualRequirementUpdate('city', e.target.value)}
                  />
                </div>

                {/* Area Location */}
                <div className="flex items-center justify-between text-xs py-1 border-b border-brand-slate-100">
                  <span className="text-brand-slate-750 font-medium">Area/Group:</span>
                  <input
                    type="text"
                    className="bg-transparent border-none text-right font-bold text-brand-teal-700 focus:outline-none focus:underline w-32 text-xs"
                    value={memory.current_requirement.area_group || 'None'}
                    onChange={(e) => handleManualRequirementUpdate('area_group', e.target.value)}
                  />
                </div>

                {/* Exact Size */}
                <div className="flex items-center justify-between text-xs py-1 border-b border-brand-slate-100">
                  <span className="text-brand-slate-750 font-medium">Size (Exact Copy):</span>
                  <input
                    type="text"
                    className="bg-transparent border-none text-right font-mono font-bold text-brand-teal-700 focus:outline-none focus:underline w-32 text-xs"
                    value={memory.current_requirement.size || 'None'}
                    onChange={(e) => handleManualRequirementUpdate('size', e.target.value)}
                  />
                </div>

                {/* Type */}
                <div className="flex items-center justify-between text-xs py-1 border-b border-brand-slate-100">
                  <span className="text-brand-slate-750 font-medium">Type:</span>
                  <input
                    type="text"
                    className="bg-transparent border-none text-right font-bold text-brand-teal-700 focus:outline-none focus:underline w-32 text-xs"
                    value={memory.current_requirement.property_type || 'None'}
                    onChange={(e) => handleManualRequirementUpdate('property_type', e.target.value)}
                  />
                </div>

                {/* Budget */}
                <div className="flex items-center justify-between text-xs py-1 border-b border-brand-slate-100">
                  <span className="text-brand-slate-750 font-medium">Max Budget:</span>
                  <input
                    type="text"
                    className="bg-transparent border-none text-right font-bold text-brand-teal-700 focus:outline-none focus:underline w-32 text-xs"
                    value={memory.current_requirement.max_budget || 'None'}
                    onChange={(e) => handleManualRequirementUpdate('max_budget', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Selected Option Tracker */}
            <div className="bg-brand-slate-50 p-3 rounded-lg border border-brand-slate-200">
              <span className="text-[10px] font-semibold text-brand-slate-200/80 uppercase block mb-1">Memory Option Pointer</span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-brand-slate-700">Option Referred:</span>
                <span className="font-bold text-brand-teal-700">
                  {memory.active_option_number ? `Option ${memory.active_option_number}` : 'None Active'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-1 pt-1.5 border-t border-brand-slate-200">
                <span className="text-brand-slate-700">Prop ID Tracked:</span>
                <span className="font-bold text-brand-teal-700 truncate w-32 text-right">
                  {memory.active_property_id || 'None'}
                </span>
              </div>
            </div>

            {/* Visit Schedules Preferences */}
            <div>
              <span className="text-[10px] font-semibold text-brand-slate-200/80 uppercase block mb-1">Site Visit Timing Request</span>
              <div className="text-xs bg-slate-50 italic border border-slate-250 p-2.5 rounded-lg text-brand-slate-900 font-sans">
                {memory.visit_preference || 'No current visits requested.'}
              </div>
            </div>

            {/* Audited Missing details requests queue */}
            <div>
              <span className="text-[10px] font-semibold text-brand-slate-200/80 uppercase block mb-1">Missing details Requests Block</span>
              {memory.missing_info_requests && memory.missing_info_requests.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {memory.missing_info_requests.map((m, midx) => (
                    <span key={midx} className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                      ⚠️ {m}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-brand-slate-200 font-medium italic">No missing lists audited. AI remains on facts.</div>
              )}
            </div>

            {/* Summary */}
            <div>
              <span className="text-[10px] font-semibold text-brand-slate-200/80 uppercase block mb-1">Cognitive Summary</span>
              <p className="text-[11px] text-brand-slate-750 bg-slate-50 border p-2.5 rounded-lg border-brand-slate-100 font-serif leading-relaxed">
                {memory.conversation_summary || 'Dialogue is initiated. Analyzing customer demands...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-brand-slate-750 italic">
            Select a lead to visualize instant memory traces.
          </div>
        )}
      </div>
    </div>
  );
}
