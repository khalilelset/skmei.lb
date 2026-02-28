'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react';

const inputStyle = (hasError: boolean) => ({
  background: 'rgba(255,255,255,0.07)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
  color: '#ffffff',
  colorScheme: 'dark' as const,
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearError = () => { if (error) setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError('Invalid username or password. Access denied.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12"
      style={{ background: '#08080f' }}
    >
      {/* Red glow — top left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', left: '-5%',
          width: '60vw', height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,38,38,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Red glow — bottom right */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-15%', right: '-5%',
          width: '45vw', height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,38,38,0.09) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main card */}
      <div className="relative w-full max-w-md">

        {/* Logo + badge */}
        <div className="text-center mb-10">
          <div className="relative w-44 h-14 mx-auto mb-5">
            <Image
              src="/images/logo/black.png"
              alt="SKMEI.LB"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-[0.2em]">Admin Panel</span>
          </div>
        </div>

        {/* Glass card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Lock icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
            <Lock className="w-5 h-5 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-1.5">Welcome Back</h1>
          <p className="text-white/35 text-sm mb-8 leading-relaxed">
            Sign in with your admin credentials to access the SKMEI dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Username field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <User className="w-4 h-4 text-white/25" />
              </div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearError(); }}
                autoComplete="username"
                autoFocus
                style={inputStyle(!!error)}
                className="w-full rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-white/20 focus:outline-none transition-all duration-200"
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(220,38,38,0.5)';
                  e.target.style.background = 'rgba(255,255,255,0.11)';
                }}
                onBlur={(e) => {
                  e.target.style.border = error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                }}
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-4 h-4 text-white/25" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                autoComplete="current-password"
                style={inputStyle(!!error)}
                className="w-full rounded-xl pl-11 pr-12 py-3.5 text-white text-sm placeholder-white/20 focus:outline-none transition-all duration-200"
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(220,38,38,0.5)';
                  e.target.style.background = 'rgba(255,255,255,0.11)';
                }}
                onBlur={(e) => {
                  e.target.style.border = error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 py-2.5 px-3.5 rounded-lg border border-red-500/20" style={{ background: 'rgba(239,68,68,0.06)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 group mt-5!"
              style={{
                background: isLoading || !username || !password ? 'rgba(220,38,38,0.4)' : '#DC2626',
                color: 'white',
                cursor: isLoading || !username || !password ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to store */}
        <div className="text-center mt-8 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/25 hover:text-white/50 text-xs transition-colors duration-200"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Store
          </Link>
          <p className="text-white/10 text-xs uppercase tracking-[0.25em] block">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
