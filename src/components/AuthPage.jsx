import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, Eye, EyeOff, User, Mail, Lock, 
  CheckCircle2, AlertCircle, Check, ArrowRight
} from 'lucide-react';

export default function AuthPage({ onBackToHome, onSuccess, isAppLogin = false, isModal = false, onClose }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
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
          redirectTo: isAppLogin ? `${window.location.origin}/app-login` : window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
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
            console.warn('[HideAI] Profile table note:', profileErr?.message);
          }
        }
        
        if (data?.session) {
          // Auto login immediately
          if (onSuccess) onSuccess(data?.user);
          return;
        }

        setAuthSuccess('Account created! Check your email inbox to confirm, or proceed to sign in.');
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        setTimeout(() => setIsLoginMode(true), 3000);
      }
    } catch (err) {
      const msg = err?.message || '';
      const lmsg = msg.toLowerCase();
      if (msg === 'AUTH_NETWORK_ERROR' || lmsg.includes('auth_network') || lmsg.includes('fetch') || lmsg.includes('network') || lmsg.includes('resolve') || lmsg.includes('failed to fetch')) {
        setAuthError('⚠️ Cannot connect to server — please check your internet connection.');
      } else if (lmsg.includes('invalid login') || lmsg.includes('invalid credentials') || lmsg.includes('invalid_credentials')) {
        setAuthError('Incorrect email or password. If you are new, please create an account.');
      } else if (lmsg.includes('already registered') || lmsg.includes('already exists') || lmsg.includes('user_already_exists')) {
        setAuthError('An account with this email already exists. Please sign in.');
      } else if (lmsg.includes('email not confirmed') || lmsg.includes('email_not_confirmed')) {
        setAuthError('Email not confirmed yet. Please check your inbox.');
      } else if (lmsg.includes('rate limit') || lmsg.includes('too many requests')) {
        setAuthError('Too many attempts. Please wait a moment before trying again.');
      } else {
        setAuthError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className={isModal ? "w-full flex items-center justify-center" : "min-h-screen bg-[#05130d] text-white flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-[#c99a4c] selection:text-white"}>
      
      {!isModal && (
        <>
          {/* Background Ambient Glows */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Top Navbar */}
      {!isModal && (
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        <div 
          onClick={onBackToHome}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img 
            src="/penguin.jpg" 
            alt="HideAI Logo" 
            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/40 shadow-md group-hover:scale-105 transition-transform" 
          />
          <span className="font-display font-black text-2xl tracking-tight text-white flex items-center">
            Hide<span className="text-emerald-400 font-extrabold ml-1">AI</span>
          </span>
        </div>

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        )}
        </header>
      )}

      {/* Main Centered Auth Blade Animation Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-2 relative z-10 w-full">
        
        {/* Top Header Badge */}
        {!isModal && (
          <div className="text-center space-y-1.5 mb-6">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#c99a4c] block">
              HIDE AI · SECURE ACCESS
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Login & Signup <span className="text-[#e2b365]">Portal</span>
            </h1>
          </div>
        )}

        {/* Outer Dual-Panel Card Container */}
        <div className={`w-full max-w-[880px] bg-[#fbf7ee] rounded-[32px] sm:rounded-[36px] shadow-[0_25px_80px_rgba(0,0,0,0.65)] border border-emerald-500/20 overflow-hidden relative min-h-[520px] sm:min-h-[560px] flex flex-col md:flex-row transition-all duration-700 ${isModal ? 'max-h-[90vh] overflow-y-auto' : ''}`}>
          
          {isModal && onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-50 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all cursor-pointer backdrop-blur-sm"
              title="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PANEL 1: CREAM / IVORY FORM PANEL (Sign In or Sign Up Form)
          ══════════════════════════════════════════════════════════════════ */}
          <div className={`w-full md:w-[58%] p-8 sm:p-12 lg:p-14 flex flex-col justify-between text-left transition-all duration-700 ${
            isLoginMode ? 'order-1 md:order-1' : 'order-1 md:order-2'
          }`}>
            
            <div className="space-y-6">
              
              {/* Form Title */}
              <div className="space-y-2">
                <h2 className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27] tracking-tight">
                  {isLoginMode ? 'Sign in' : 'Create account'}
                </h2>
                <div className="w-12 h-1 bg-[#c99a4c] rounded-full"></div>
              </div>

              {/* Status Alert Messages */}
              {authError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl animate-in fade-in">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl animate-in fade-in">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  <span className="leading-snug">{authSuccess}</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-5">
                
                {/* Full Name (Sign Up Only) */}
                {!isLoginMode && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-[#0d2e27]/70 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative flex items-center border-b-2 border-[#0d2e27]/20 focus-within:border-[#c99a4c] transition-colors pb-1">
                      <input 
                        type="text" 
                        required
                        placeholder="Your name" 
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full bg-transparent pr-8 py-1.5 text-sm font-bold text-[#0d2e27] placeholder-gray-400 outline-none"
                      />
                      <User size={16} className="absolute right-1 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-[#0d2e27]/70 uppercase tracking-wider">
                    {isLoginMode ? 'Username or email' : 'Email address'}
                  </label>
                  <div className="relative flex items-center border-b-2 border-[#0d2e27]/20 focus-within:border-[#c99a4c] transition-colors pb-1">
                    <input 
                      type="email" 
                      required
                      placeholder={isLoginMode ? "Enter your email" : "you@example.com"} 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-transparent pr-8 py-1.5 text-sm font-bold text-[#0d2e27] placeholder-gray-400 outline-none"
                    />
                    <Mail size={16} className="absolute right-1 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-[#0d2e27]/70 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative flex items-center border-b-2 border-[#0d2e27]/20 focus-within:border-[#c99a4c] transition-colors pb-1">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="••••••••" 
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-transparent pr-8 py-1.5 text-sm font-bold text-[#0d2e27] placeholder-gray-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!isLoginMode && (
                    <span className="block text-[10px] text-gray-500 font-semibold pt-0.5">
                      Use 6 characters or more.
                    </span>
                  )}
                </div>

                {/* Sign In Extras: Keep me signed in & Forgot Password */}
                {isLoginMode && (
                  <div className="flex items-center justify-between pt-1 text-xs font-bold text-[#0d2e27]">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={keepSignedIn}
                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#0c3b2e] focus:ring-0 cursor-pointer accent-[#0c3b2e]" 
                      />
                      <span className="text-gray-700 font-semibold text-xs">Keep me signed in</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (!authEmail) {
                          setAuthError('Please enter your email above first to reset your password.');
                        } else {
                          supabase.auth.resetPasswordForEmail(authEmail.trim().toLowerCase())
                            .then(() => setAuthSuccess('Password reset link sent to your email!'))
                            .catch((err) => setAuthError(err.message));
                        }
                      }}
                      className="text-[#a47a32] hover:text-[#7f5d21] underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 px-8 bg-[#0c3b2e] hover:bg-[#07291f] active:scale-[0.98] text-white rounded-full font-black text-sm tracking-wide shadow-lg shadow-[#0c3b2e]/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {authLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Authenticating...
                      </span>
                    ) : (
                      <span>{isLoginMode ? 'Sign in' : 'Create account'}</span>
                    )}
                  </button>
                </div>

                {/* Quick Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full py-2.5 bg-white border border-[#0d2e27]/20 hover:border-[#0d2e27]/40 text-[#0d2e27] rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

              </form>

            </div>

            {/* Bottom Toggle Link */}
            <div className="pt-6 text-xs text-gray-700 font-semibold">
              {isLoginMode ? (
                <p>
                  New to HIDE AI?{' '}
                  <button 
                    type="button"
                    onClick={() => { setIsLoginMode(false); setAuthError(''); setAuthSuccess(''); }}
                    className="font-black text-[#0d2e27] underline hover:text-[#c99a4c] transition-colors cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => { setIsLoginMode(true); setAuthError(''); setAuthSuccess(''); }}
                    className="font-black text-[#0d2e27] underline hover:text-[#c99a4c] transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>

          </div>


          {/* ══════════════════════════════════════════════════════════════════
              PANEL 2: DARK FOREST GREEN CURVED BLADE PANEL (Verso/HideAI Hero)
          ══════════════════════════════════════════════════════════════════ */}
          <div className={`w-full md:w-[42%] bg-gradient-to-br from-[#0c3b2e] via-[#08281f] to-[#041611] p-8 sm:p-12 lg:p-14 flex flex-col justify-center text-left relative overflow-hidden transition-all duration-700 ${
            isLoginMode 
              ? 'order-2 md:order-2 border-t md:border-t-0 md:border-l border-emerald-500/20' 
              : 'order-2 md:order-1 border-t md:border-t-0 md:border-r border-emerald-500/20'
          }`}>
            
            {/* Ambient Blade Curved Glow Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              
              {/* Brand Tag */}
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[#e2b365]">
                HIDE AI
              </span>

              {/* Hero Dynamic Message */}
              {isLoginMode ? (
                <div className="space-y-4">
                  <h3 className="font-display font-light text-4xl sm:text-5xl text-white leading-tight">
                    Welcome <br />
                    <span className="font-serif italic text-[#e2b365] font-normal">back.</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed max-w-xs">
                    Your interview sessions, credit balances, and AI copilot settings are exactly where you left them.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-display font-light text-4xl sm:text-5xl text-white leading-tight">
                    Start the <br />
                    <span className="font-serif italic text-[#e2b365] font-normal">first session.</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed max-w-xs">
                    One unified account for every interview, live transcript, and undetectable desktop copilot.
                  </p>
                </div>
              )}

              {/* Feature Highlights List */}
              <div className="pt-4 border-t border-white/10 space-y-2 text-xs font-semibold text-emerald-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e2b365]" />
                  <span>100% Screen-share undetectable</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e2b365]" />
                  <span>Whisper speech-to-text transcription</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e2b365]" />
                  <span>Instant license key activation</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      {!isModal && (
        <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-gray-500 font-medium relative z-20">
          © 2026 Hide AI. All rights reserved. · Safe & Secure Encryption
        </footer>
      )}

    </div>
  );
}
