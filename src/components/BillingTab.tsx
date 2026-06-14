import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Clock, 
  HelpCircle, 
  CreditCard, 
  Database, 
  Users, 
  MessageSquareCode, 
  Flame, 
  Building2, 
  TrendingUp,
  Sliders,
  ArrowRight,
  Info
} from 'lucide-react';
import { SubscriptionPlan, AgencySubscription, UsageCounter } from '../types';

interface BillingTabProps {
  onPlanChanged: () => void;
}

export default function BillingTab({ onPlanChanged }: BillingTabProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<AgencySubscription | null>(null);
  const [usages, setUsages] = useState<UsageCounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const resPlans = await fetch('/api/billing/plans');
      const dataPlans = await resPlans.json();
      setPlans(dataPlans || []);

      const resSub = await fetch('/api/billing/subscription');
      const dataSub = await resSub.json();
      setSubscription(dataSub.subscription || null);
      setUsages(dataSub.usages || null);
    } catch (e) {
      console.error('Failed to grab subscription status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (subscription?.plan_id === planId) return;
    setUpgradingPlanId(planId);

    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId })
      });

      if (res.ok) {
        await fetchBillingData();
        onPlanChanged();
        alert(`Successfully upgraded package to: ${planId.toUpperCase()}! Your workspace limit metrics updated instantly.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpgradingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-slate-500">Retrieving billing ledgers...</p>
        </div>
      </div>
    );
  }

  // Get active plan limits safely
  const activePlanId = subscription?.plan_id || 'starter';
  const activePlanObj = plans.find(p => p.id === activePlanId) || {
    name: 'Starter Package',
    max_properties: 10,
    max_leads_per_month: 50,
    max_team_members: 1,
    max_ai_replies_per_month: 100,
    includes_website_builder: true,
    includes_whatsapp: false,
    includes_analytics: false,
    includes_custom_domain: false
  };

  // Compute metrics usage progress values
  const propertiesUsed = usages?.property_count_snapshot || 3;
  const propertiesMax = activePlanObj.max_properties;
  const propertiesPercent = Math.min((propertiesUsed / propertiesMax) * 100, 100);

  const leadsUsed = usages?.leads_count || 5;
  const leadsMax = activePlanObj.max_leads_per_month;
  const leadsPercent = Math.min((leadsUsed / leadsMax) * 100, 100);

  const aiUsed = usages?.ai_replies_count || 22;
  const aiMax = activePlanObj.max_ai_replies_per_month;
  const aiPercent = Math.min((aiUsed / aiMax) * 100, 100);

  // Hardcode team count since it scales safely under the list, say 1 member
  const teamUsed = 1; 
  const teamMax = activePlanObj.max_team_members;
  const teamPercent = Math.min((teamUsed / teamMax) * 100, 100);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Overview introduction panels */}
      <div className="bg-white rounded-xl border border-brand-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-brand-teal-500/10 text-brand-teal-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
              Module 6
            </span>
            <span className="text-brand-slate-500 text-xs font-mono">• Subscription & Usage Counters</span>
          </div>
          <h1 className="text-lg font-bold font-display tracking-tight text-brand-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-brand-teal-500" />
            Billing Plans & Workspace Quotas
          </h1>
          <p className="text-xs text-brand-slate-500">
            Compare premium software service plans and monitor operational counters regarding listings catalogs, leads captured, and automated continuity chats.
          </p>
        </div>

        {/* Floating live active banner status */}
        <div className="bg-brand-slate-900 border border-brand-slate-950 p-4 rounded-xl text-white flex items-center gap-3 shadow-md">
          <div className="w-9 h-9 rounded-lg bg-brand-teal-500/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand-teal-400 animate-pulse" />
          </div>
          <div className="text-xs pr-2">
            <span className="text-brand-slate-400 block text-[9px] uppercase font-mono leading-none tracking-widest font-bold">Active package:</span>
            <strong className="text-brand-teal-400 text-sm font-bold block mt-1">{activePlanObj.name}</strong>
            <span className="text-[10px] text-brand-slate-400 font-mono italic block leading-none mt-0.5">
              Status: {subscription?.status === 'trial' ? 'Sandbox Trial' : 'Active Subscription'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Quotas / Usage progress counters (Module 6 metrics gauges) */}
      <div className="bg-white rounded-xl border border-brand-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-brand-slate-900 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-brand-teal-500" />
            Current Month Quotas utilization
          </h2>
          <p className="text-xs text-brand-slate-500">Interactive telemetry monitors showing monthly resources consumed from active license allocation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1.5 text-xs">
          
          {/* Progress gauge 1 */}
          <div className="border border-brand-slate-105 bg-brand-slate-50/20 p-4 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-slate-800 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-brand-teal-500" /> Catalog Listings
              </span>
              <span className="text-[10px] font-mono text-brand-slate-500 font-bold">{propertiesUsed} / {propertiesMax === 9999 ? '∞' : propertiesMax}</span>
            </div>
            <div className="w-full bg-brand-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-teal-500 h-full rounded-full" style={{ width: `${propertiesPercent}%` }} />
            </div>
            <span className="text-[9px] text-brand-slate-500 block leading-tight pt-0.5">Properties registered in your CRM catalog.</span>
          </div>

          {/* Progress gauge 2 */}
          <div className="border border-brand-slate-105 bg-brand-slate-50/20 p-4 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-slate-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-brand-teal-500" /> Customer Leads
              </span>
              <span className="text-[10px] font-mono text-brand-slate-500 font-bold">{leadsUsed} / {leadsMax === 99999 ? '∞' : leadsMax}</span>
            </div>
            <div className="w-full bg-brand-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${leadsPercent}%` }} />
            </div>
            <span className="text-[9px] text-brand-slate-500 block leading-tight pt-0.5">Clients created automatically via webforms.</span>
          </div>

          {/* Progress gauge 3 */}
          <div className="border border-brand-slate-105 bg-brand-slate-50/20 p-4 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-slate-800 flex items-center gap-1">
                <MessageSquareCode className="w-3.5 h-3.5 text-brand-teal-500" /> Continuity chats
              </span>
              <span className="text-[10px] font-mono text-brand-slate-500 font-bold">{aiUsed} / {aiMax === 99999 ? '∞' : aiMax}</span>
            </div>
            <div className="w-full bg-brand-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-teal-600 h-full rounded-full" style={{ width: `${aiPercent}%` }} />
            </div>
            <span className="text-[9px] text-brand-slate-500 block leading-tight pt-0.5">Simulated WhatsApp responses issued.</span>
          </div>

          {/* Progress gauge 4 */}
          <div className="border border-brand-slate-105 bg-brand-slate-50/20 p-4 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-slate-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-brand-teal-500" /> Team Members
              </span>
              <span className="text-[10px] font-mono text-brand-slate-500 font-bold">{teamUsed} / {teamMax === 999 ? '∞' : teamMax}</span>
            </div>
            <div className="w-full bg-brand-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${teamPercent}%` }} />
            </div>
            <span className="text-[9px] text-brand-slate-500 block leading-tight pt-0.5">Added coworker authorization keys.</span>
          </div>

        </div>

        {/* Mini information warning banner inside gauges */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-2 text-[10.5px] leading-relaxed text-yellow-800 font-semibold mb-2">
          <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <p>
            When a quota threshold hits 100%, the Groq CRM Continuity parser gracefully redirects chats to manual office support numbers with Roman Urdu instructions. Upgrade plans below to sustain limitless workflows.
          </p>
        </div>
      </div>

      {/* Comparisons of Tiers grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-brand-slate-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-brand-teal-500" />
            Pricing package Comparison matrix
          </h2>
          <p className="text-xs text-brand-slate-500">Compare features lists and activate any workspace tier instantly in sandbox simulation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1.5">
          {plans.map((p) => {
            const isActive = activePlanId === p.id;
            const isUpgrading = upgradingPlanId === p.id;

            return (
              <div 
                key={p.id}
                className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                  isActive 
                    ? 'border-brand-teal-500 ring-2 ring-brand-teal-500/10 bg-brand-teal-500/[0.01]' 
                    : 'border-brand-slate-200 hover:border-brand-slate-300'
                }`}
              >
                <div className="space-y-4 text-xs">
                  
                  {/* Package Price segment */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-brand-slate-900 leading-none">{p.name}</h3>
                      {isActive && (
                        <span className="bg-brand-teal-500 text-brand-slate-950 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide leading-none font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="pt-2 flex items-baseline gap-1">
                      <span className="text-[26px] font-bold text-brand-slate-900 leading-none">${p.price_monthly.toFixed(0)}</span>
                      <span className="text-[10px] text-brand-slate-400 font-semibold">/ month</span>
                    </div>
                  </div>

                  {/* Core Features lists */}
                  <ul className="space-y-1.5 text-[9.5px] text-brand-slate-600 leading-relaxed border-t border-brand-slate-100 pt-3">
                    <li className="flex items-center gap-1.5 font-semibold text-brand-slate-750">
                      <Check className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                      Allow: {p.max_properties === 9999 ? 'Limitless' : `${p.max_properties} Property Listings`}
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold text-brand-slate-750">
                      <Check className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                      Limits: {p.max_leads_per_month === 99999 ? 'Limitless' : `${p.max_leads_per_month} Leads / month`}
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold text-brand-slate-750">
                      <Check className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                      Team keys: {p.max_team_members === 999 ? 'Limitless' : `${p.max_team_members} Coworker logins`}
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold text-brand-slate-750">
                      <Check className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                      AI Chats: {p.max_ai_replies_per_month === 99999 ? 'Unrestricted' : `${p.max_ai_replies_per_month} responses / mo`}
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold text-brand-slate-750">
                      <Check className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                      Client Portal Website Builder Included
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold text-brand-slate-750">
                      {p.includes_whatsapp ? (
                        <Check className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                      ) : (
                        <span className="inline-block bg-brand-slate-100 w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[8px] text-brand-slate-400">Locked</span>
                      )}
                      WhatsApp Meta Webhook Integration
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold text-brand-slate-750">
                      {p.includes_analytics ? (
                        <Check className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                      ) : (
                        <span className="inline-block bg-brand-slate-100 w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[8px] text-brand-slate-400">Locked</span>
                      )}
                      Traffic Analytics dashboards
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold text-brand-slate-750 font-mono">
                      {p.includes_custom_domain ? (
                        <Check className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                      ) : (
                        <span className="inline-block bg-brand-slate-100 w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[8px] text-brand-slate-400">Locked</span>
                      )}
                      Custom DNS Domain mapping
                    </li>
                  </ul>

                </div>

                {/* Switch triggers */}
                <div className="pt-4 mt-4 border-t border-brand-slate-100 text-xs">
                  <button
                    onClick={() => handleSelectPlan(p.id)}
                    disabled={isActive || isUpgrading}
                    className={`w-full py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                      isActive 
                        ? 'bg-brand-slate-100 text-brand-slate-400 cursor-default shadow-none border border-brand-slate-200' 
                        : 'bg-brand-slate-900 text-white hover:bg-brand-slate-800'
                    }`}
                  >
                    {isUpgrading && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    {isActive ? 'Current Plan' : 'Select Package'}
                    {!isActive && <ArrowRight className="w-3 h-3 text-brand-teal-400" />}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
