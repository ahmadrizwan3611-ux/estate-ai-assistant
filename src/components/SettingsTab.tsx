import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, BadgeInfo, BellRing, Sparkles, Languages, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Agency, TonePreference } from '../types';

interface SettingsTabProps {
  onSettingsChanged: () => void;
}

export default function SettingsTab({ onSettingsChanged }: SettingsTabProps) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tone, setTone] = useState<TonePreference>('roman_urdu_mix');
  const [model, setModel] = useState('llama-3.3-70b-versatile');

  useEffect(() => {
    loadAgencyData();
  }, []);

  const loadAgencyData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agency');
      if (res.ok) {
        const data: Agency = await res.json();
        setAgency(data);
        setName(data.name);
        setPhone(data.phone || '0300-1234567');
        setLogoUrl(data.logo_url || '');
        setTone(data.tone_preference);
        setModel(data.ai_model_setting);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          logo_url: logoUrl,
          tone_preference: tone,
          ai_model_setting: model
        })
      });
      if (res.ok) {
        setSaved(true);
        onSettingsChanged();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-brand-teal-500/20 border-t-brand-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div id="settings-tab" className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-brand-slate-900">Portal & AI Model Settings</h1>
        <p className="text-sm text-brand-slate-700">Tune the underlying EstateAI Continuity Brain, adjust response dialects, and override model endpoints.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-brand-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-display font-bold text-brand-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-brand-teal-500" />
            Agency Brand Profile Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wide mb-1.5">
                Brokerage Name
              </label>
              <input
                type="text"
                className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500 font-bold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wide mb-1.5">
                Contact Phone (WhatsApp Gateway)
              </label>
              <input
                type="text"
                className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500 font-bold"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wide mb-1.5">
              Agency Logo Asset URL
            </label>
            <input
              type="text"
              className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500 text-brand-slate-705"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-display font-bold text-brand-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-brand-teal-500" />
            Cognitive Brain & Tone Presets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wide mb-2">
                Active AI LLM Model Choice
              </label>
              <select
                className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq Recommended) 🔥</option>
                <option value="openai/gpt-oss-120b">GPT OSS 120B (Groq Custom Model)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Secured API Fallback)</option>
              </select>
              <span className="text-[10px] text-brand-slate-200 block mt-1.5">
                Note: In absence of direct Groq keys, the compiler falls back transparently to Google Gemini's automated backend keys.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-brand-teal-500" />
                Customer Response Dialect Tone
              </label>
              <select
                className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                value={tone}
                onChange={(e) => setTone(e.target.value as TonePreference)}
              >
                <option value="roman_urdu_mix">Roman Urdu mixed with English (Highly Recommended For Pakistani Market) 🇵🇰</option>
                <option value="pure_roman_urdu">Pure Roman Urdu ('Ji Sahib, hum phase 6 me option share karein ge')</option>
                <option value="pure_english">Pure Professional English ('Yes Sir, we have matched options')</option>
                <option value="urdu_script">Urdu (Urdu Script Arabic Layout)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold">Credential Environment Variables Check</h4>
            <p className="mt-0.5 leading-relaxed font-sans text-amber-700">
              Agency parameters are stored locally inside the workspace memory. Live Supabase database, Groq keys, and fallback integrations must be declared inside the standard `.env` configuration file inside the root workspace folder to enable real-time cloud connections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end pt-2">
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-brand-teal-600 font-bold flex items-center gap-1 bg-brand-teal-50 border border-brand-teal-200 px-3 py-1 rounded"
              >
                <Check className="w-4 h-4" />
                Portal Presets Updated Successfully!
              </motion.span>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={saving}
            className="bg-brand-teal-500 hover:bg-brand-teal-600 disabled:bg-brand-teal-500/50 text-white font-medium py-2 px-6 rounded-lg text-xs transition-colors cursor-pointer shadow-[0_2px_8px_rgba(13,148,136,0.15)]"
          >
            {saving ? 'Updating Presets...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
