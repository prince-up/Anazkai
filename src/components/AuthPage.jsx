import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Shield, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function AuthPage({ onBackToHome, onSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      setAuthError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(err?.message || 'Google sign in failed. Please try with email.');
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = (authEmail || '').trim().toLowerCase();
    const cleanPassword = authPassword || '';
    const cleanName = (authName || '').trim();

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setAuthError('Please enter a valid email address (e.g. name@example.com)');
      return;
    }

    if (cleanPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setAuthLoading(true);
    
    try {
      if (isLoginMode) {
        // --- LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        if (onSuccess) onSuccess(data?.user);
      } else {
        // --- SIGN UP ---
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { full_name: cleanName || cleanEmail.split('@')[0] }
          }
        });
        if (error) throw error;
        
        // Save profile silently in background
        if (data?.user) {
          try {
            await supabase
              .from('profiles')
              .upsert([
                {
                  id: data.user.id,
                  email: cleanEmail,
                  full_name: cleanName || cleanEmail.split('@')[0],
                  created_at: new Date().toISOString(),
                }
              ]);
          } catch (profileErr) {
            console.warn('[Anazk] Profile table note:', profileErr?.message);
          }
        }
        
        if (data?.session) {
          // Auto login immediately
          if (onSuccess) onSuccess(data?.user);
          return;
        }

        setAuthSuccess('Account created! Please check your email inbox to confirm, or proceed to sign in.');
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        setTimeout(() => setIsLoginMode(true), 3000);
      }
    } catch (err) {
      const msg = err?.message || '';
      const lmsg = msg.toLowerCase();
      if (msg === 'AUTH_NETWORK_ERROR' || lmsg.includes('auth_network') || lmsg.includes('fetch') || lmsg.includes('network') || lmsg.includes('resolve') || lmsg.includes('failed to fetch')) {
        setAuthError('⚠️ Cannot connect to server — please check your internet connection and try again.');
      } else if (lmsg.includes('invalid login') || lmsg.includes('invalid credentials') || lmsg.includes('invalid_credentials')) {
        setAuthError('Incorrect email or password. If you are new, click "Create Account" below.');
      } else if (lmsg.includes('already registered') || lmsg.includes('already exists') || lmsg.includes('user_already_exists')) {
        setAuthError('An account with this email already exists. Please switch to Sign In.');
      } else if (lmsg.includes('email not confirmed') || lmsg.includes('email_not_confirmed')) {
        setAuthError('Email not confirmed yet. Please check your inbox for the confirmation email.');
      } else if (lmsg.includes('rate limit') || lmsg.includes('too many requests')) {
        setAuthError('Too many attempts. Please wait a minute before trying again.');
      } else {
        setAuthError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-between font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div 
          onClick={onBackToHome}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img 
            src="/penguin.jpg" 
            alt="Anazk Logo" 
            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30 shadow-sm group-hover:scale-105 transition-transform" 
          />
          <span className="font-display font-black text-2xl tracking-tight text-gray-900 flex items-center">
            Anazk<span className="text-emerald-600 font-extrabold ml-1">AI</span>
          </span>
        </div>

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-full transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        )}
      </header>

      {/* Main Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white w-full max-w-[440px] rounded-3xl border border-gray-200/80 shadow-[0_12px_45px_rgba(0,0,0,0.06)] p-7 sm:p-9 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          
          {/* Card Title */}
          <div>
            <h1 className="font-display font-black text-3xl text-gray-900 tracking-tight">
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-gray-500 text-xs font-semibold mt-1.5">
              {isLoginMode ? 'Welcome back! Continue to your dashboard.' : 'Start using Anazk AI stealth copilot for interviews.'}
            </p>
          </div>

          {/* Sign In with Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full py-3.5 bg-[#18181b] hover:bg-black active:scale-[0.98] text-white rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isLoginMode ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px bg-gray-200 flex-1"></span>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">or continue with email</span>
            <span className="h-px bg-gray-200 flex-1"></span>
          </div>

          {/* Email / Password Form */}
          {authSuccess ? (
            <div className="py-4 flex flex-col items-center gap-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 text-emerald-900 animate-in fade-in">
              <CheckCircle2 size={32} className="text-emerald-600" />
              <h3 className="font-extrabold text-sm text-emerald-900">Success!</h3>
              <p className="text-xs font-medium text-emerald-800 leading-relaxed">{authSuccess}</p>
              <button
                type="button"
                onClick={() => { setAuthSuccess(''); setIsLoginMode(true); }}
                className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Go to Sign In →
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-left">
              {!isLoginMode && (
                <div>
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                    <input 
                      type="text" 
                      required
                      placeholder="Jane Doe" 
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/70 border border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 rounded-xl outline-none text-xs sm:text-sm font-semibold placeholder-gray-400 transition-all text-gray-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <input 
                    type="email" 
                    required
                    placeholder="you@example.com" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/70 border border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 rounded-xl outline-none text-xs sm:text-sm font-semibold placeholder-gray-400 transition-all text-gray-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  {isLoginMode && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!authEmail) {
                          setAuthError('Please enter your email address above first to reset password.');
                        } else {
                          supabase.auth.resetPasswordForEmail(authEmail.trim().toLowerCase())
                            .then(() => setAuthSuccess('Password reset link sent to your email inbox!'))
                            .catch((err) => setAuthError(err.message));
                        }
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="••••••••" 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50/70 border border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 rounded-xl outline-none text-xs sm:text-sm font-semibold placeholder-gray-400 transition-all text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200/80 text-red-600 text-xs font-semibold p-3 rounded-xl animate-in fade-in">
                  <AlertCircle size={14} className="shrink-0 text-red-500" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-sm font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>{isLoginMode ? 'Sign In to Account' : 'Create Your Account'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle between Login and Signup */}
          <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold">
            {isLoginMode ? "Don't have an account yet? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); setAuthSuccess(''); }}
              className="text-emerald-600 hover:text-emerald-700 hover:underline font-extrabold cursor-pointer"
            >
              {isLoginMode ? 'Sign up free' : 'Sign in here'}
            </button>
          </div>

          {/* Bottom Single Device Disclaimer (Screenshot 1 parity) */}
          <p className="text-[11px] text-gray-400 font-normal leading-relaxed pt-2">
            You can only be logged in on one desktop and one mobile device at a time. Logging in on another device will sign you out from the previous device of the same type.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-gray-400 font-medium">
        © 2026 Anazk AI. All rights reserved.
      </footer>
    </div>
  );
}
