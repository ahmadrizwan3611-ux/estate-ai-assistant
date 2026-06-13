import React, { useState } from 'react';
import { Shield, Sparkles, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SaaSLoginProps {
  onLoginSuccess: (agencyName: string, email: string) => void;
}

export default function SaaSLogin({ onLoginSuccess }: SaaSLoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('admin@estateai.com');
  const [password, setPassword] = useState('password');
  const [agencyName, setAgencyName] = useState('Chaudhry & Partners Real Estate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in check parameters.');
      return;
    }
    setLoading(true);
    setError('');

    // Simulate authentication trigger
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(isSignup ? agencyName : 'Chaudhry & Partners Real Estate', email);
    }, 800);
  };

  return (
    <div id="login-container" className="min-h-screen bg-brand-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract background vector graphics */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-teal-700/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-700/10 blur-[150px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-brand-teal-500/10 border border-brand-teal-500/20 text-brand-teal-500 mb-4 shadow-[0_0_20px_rgba(13,148,136,0.15)]">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            EstateAI <span className="text-brand-teal-500">Continuity</span>
          </h1>
          <p className="text-brand-slate-200 mt-2 text-sm max-w-xs mx-auto">
            Premium AI-powered real estate sales expert & memory database for Pakistani agencies.
          </p>
        </div>

        <div className="bg-brand-slate-900/80 border border-brand-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
          <div className="p-8">
            <h2 className="text-xl font-medium text-white mb-6">
              {isSignup ? 'Register your Agency' : 'Agent Workspace Login'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-xs font-medium text-brand-slate-200 uppercase tracking-wider mb-1.5">
                    Agency Name
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-brand-slate-950/60 border border-brand-slate-800 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-brand-teal-500 transition-colors"
                    placeholder="e.g. Chaudhry & Partners"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-brand-slate-200 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-slate-950/60 border border-brand-slate-800 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-brand-teal-500 transition-colors"
                  placeholder="admin@estateai.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-slate-200 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-slate-950/60 border border-brand-slate-800 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-brand-teal-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-teal-500 hover:bg-brand-teal-600 disabled:bg-brand-teal-500/50 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-[0_4px_12px_rgba(13,148,136,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {isSignup ? 'Create Agency Portal' : 'Access Dashboard'}
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-brand-slate-800/60 text-center">
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="text-xs text-brand-teal-500 hover:text-brand-teal-400 font-medium cursor-pointer"
              >
                {isSignup ? 'Already have an agency? Sign in' : 'Create a new agency portal'}
              </button>
            </div>
          </div>

          <div className="bg-brand-slate-950/40 px-8 py-4 border-t border-brand-slate-800/40 flex items-center justify-between">
            <span className="text-[10px] text-brand-slate-200/50 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-teal-500" />
              SaaS Continuity Engine Active
            </span>
            <span className="text-[10px] text-brand-teal-500 font-medium">
              v1.4 SECURE
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
