import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AuthPage from '../components/AuthPage';

/**
 * AppLoginPage - Shown at /app-login on the website (anazk.online/app-login)
 * 
 * Flow:
 * 1. User opens this page from the desktop app (via browser)
 * 2. User signs in with Email/Password or Google (using AuthPage)
 * 3. After login, we redirect to: anazkai://auth?access_token=xxx&refresh_token=yyy
 * 4. Electron catches this URL and auto-logs the user into the app
 */
const AppLoginPage = () => {
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

  const handleRedirectToApp = async (sessionOrUser) => {
    setStatus('redirecting');
    
    // If we only have the user from onSuccess, fetch the session
    let session = sessionOrUser;
    if (!session?.access_token) {
      const { data } = await supabase.auth.getSession();
      session = data?.session;
    }

    if (session) {
      const { access_token, refresh_token } = session;
      const deepLink = `anazkai://auth?access_token=${access_token}&refresh_token=${refresh_token}`;
      
      // Redirect to the deep link - Electron will catch this
      window.location.href = deepLink;
      
      // Show success message as fallback
      setTimeout(() => {
        setStatus('success');
      }, 1500);
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
              ? 'Redirecting you back to HideAI app...'
              : 'You can close this tab and return to the app.'}
          </p>
          {status === 'success' && (
            <p className="text-emerald-400 text-xs mt-4 font-bold">
              ✓ Switch back to the HideAI desktop app. You are now logged in!
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render the exact same AuthPage as the main website, but pass isAppLogin=true
  return (
    <div className="min-h-screen bg-[#070b19]">
      <AuthPage 
        isAppLogin={true} 
        onSuccess={handleRedirectToApp} 
      />
    </div>
  );
};

export default AppLoginPage;
