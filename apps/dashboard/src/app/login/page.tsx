"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Always wipe stored session when login page mounts
  // so visiting /login always shows a clean form — no flash-redirect
  useEffect(() => {
    const keys = [
      'fedsoc_username', 'fedsoc_user', 'fedsoc_role',
      'fedsoc_demo_username', 'fedsoc_demo_user', 'fedsoc_demo_role',
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) { setError('Please enter your username.'); return; }
    if (!password.trim()) { setError('Please enter your password.');  return; }

    setIsSubmitting(true);
    const result = await login(username.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error ?? 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-white flex flex-col items-center justify-center font-sans p-6">
      <div className="w-full max-w-md bg-[#090d16]/80 backdrop-blur-md border border-slate-900 rounded-2xl p-8 shadow-2xl space-y-6">

        {/* Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-wider uppercase">FedSOC AI</h1>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Enterprise Sign In</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-400 font-semibold">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="Admin / Security / Viewer"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg text-xs text-white placeholder-slate-600 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg text-xs text-white placeholder-slate-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              'Enter Command Center →'
            )}
          </button>
        </form>

        {/* Hint box */}
        <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-1.5">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center">Demo Access Credentials</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Admin', hint: 'Full Control' },
              { label: 'Security', hint: 'SOC Analyst' },
              { label: 'Viewer', hint: 'Read-Only' },
            ].map((c) => (
              <div
                key={c.label}
                onClick={() => setUsername(c.label)}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <p className="text-[10px] font-bold text-white">{c.label}</p>
                <p className="text-[8px] text-slate-500">{c.hint}</p>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-slate-600 text-center pt-1">
            Click a role card to auto-fill username
          </p>
        </div>

      </div>
    </div>
  );
}
