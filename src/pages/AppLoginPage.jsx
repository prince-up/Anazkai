import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * AppLoginPage - Shown at /app-login on the website (anazk.online/app-login)
 * 
 * Flow:
 * 1. User opens this page from the desktop app (via browser)
 * 2. User signs in with Email/Password or Google
 * 3. After login, we redirect to: anazkai://auth?access_token=xxx&refresh_token=yyy
 * 4. Electron catches this URL and auto-logs the user into the app
 */
const AppLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | success | redirecting

  // Check if already logged in (e.g. session exists)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleRedirectToApp(session);
      }
    };
    checkSession();
  }, []);

  const handleRedirectToApp = (session) => {
    setStatus('redirecting');
    const { access_token, refresh_token } = session;
    const deepLink = `anazkai://auth?access_token=${access_token}&refresh_token=${refresh_token}`;
    
    // Redirect to the deep link - Electron will catch this
    window.location.href = deepLink;
    
    // Show success message as fallback
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (authErr) throw authErr;
      if (data?.session) {
        handleRedirectToApp(data.session);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://anazk.online/app-login'
        }
      });
      if (authErr) throw authErr;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (status === 'redirecting' || status === 'success') {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-6">
        <div className="bg-white/5 border border-emerald-500/30 rounded-3xl p-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-white text-xl font-black mb-2">Login Successful!</h2>
          <p className="text-gray-400 text-sm">
            {status === 'redirecting'
              ? 'Redirecting you back to AnazkAI app...'
              : 'You can close this tab and return to the app.'}
          </p>
          {status === 'success' && (
            <p className="text-emerald-400 text-xs mt-4 font-bold">
              ✓ Switch back to the AnazkAI desktop app. You are now logged in!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <span className="text-3xl">🖥️</span>
          </div>
          <h1 className="text-white text-2xl font-black mb-2">
            Login to <span className="text-emerald-400">AnazkAI</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to connect your account to the desktop app
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-7 shadow-2xl">
          
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 mb-4 rounded-xl font-bold flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm shadow-lg disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">or email</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white placeholder-gray-600 text-sm transition-all"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white placeholder-gray-600 text-sm transition-all"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Sign In to App'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          After signing in, you will be automatically redirected back to the AnazkAI desktop app.
        </p>
      </div>
    </div>
  );
};

export default AppLoginPage;
