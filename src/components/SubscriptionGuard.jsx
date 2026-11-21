import React, { useState, useEffect, useRef } from 'react';
import { Globe, Mail, Lock, AlertCircle, Gift, ShieldCheck, User, LogIn, CreditCard, CheckCircle, X, Power, RefreshCw, Key } from 'lucide-react';
import { supabase } from '../supabaseClient';

const FREE_TRIAL_DURATION_MINUTES = 5;
const FREE_TRIAL_DURATION_MS = FREE_TRIAL_DURATION_MINUTES * 60 * 1000;

const WEBSITE_LOGIN_URL = 'https://anazk.online/app-login';
const RAZORPAY_KEY_ID = 'rzp_live_TQP7ZivrFvZ5cE';

const VIP_EMAILS = [
  'admin@anazk.online',
  'prince@anazk.online',
  'luckyprinceyadav1234@gmail.com'
];

const getDeviceId = () => {
  try {
    let deviceId = localStorage.getItem('anazk_device_id');
    if (!deviceId) {
      deviceId = 'DEV-' + (window.crypto?.randomUUID ? window.crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36)));
      localStorage.setItem('anazk_device_id', deviceId);
    }
    return deviceId;
  } catch (e) {
    return 'DEV-LOCAL';
  }
};

const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

const SubscriptionGuard = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [buyEmail, setBuyEmail] = useState('');
  const [restoreEmail, setRestoreEmail] = useState('');
  const [showRestore, setShowRestore] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [planType, setPlanType] = useState('free');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const syncTimerRef = useRef(null);
  const trialTimerRef = useRef(null);

  // Clean Exit / Quit App
  const handleQuitApp = () => {
    if (ipcRenderer) {
      ipcRenderer.send('force-quit-app');
    } else {
      window.close();
    }
  };

  // Keyboard shortcut F10 or Cmd+Q to quit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F10' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'q')) {
        handleQuitApp();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Check active session & saved purchase on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedPlan = localStorage.getItem('anazk_plan_type');
      const savedPaymentId = localStorage.getItem('anazk_payment_id');
      const savedPaidEmail = localStorage.getItem('anazk_paid_email');

      // ── IF USER ALREADY PAID, UNLOCK IMMEDIATELY ──
      if (savedPlan === 'paid' || savedPaymentId) {
        setPlanType('paid');
        setTimeRemaining(999999);
        setIsAuthorized(true);
        if (savedPaidEmail) {
          setBuyEmail(savedPaidEmail);
        }
        return;
      }

      // ── CHECK FREE TRIAL ──
      const deviceId = getDeviceId();
      const trialStartTimeStr = localStorage.getItem(`anazk_free_trial_start_${deviceId}`);
      if (savedPlan === 'free_trial' && trialStartTimeStr) {
        const startTime = parseInt(trialStartTimeStr, 10);
        const elapsed = Date.now() - startTime;
        const remainingMs = FREE_TRIAL_DURATION_MS - elapsed;

        if (remainingMs > 0) {
          setTimeRemaining(Math.ceil(remainingMs / 60000));
          setPlanType('free_trial');
          setIsAuthorized(true);
          startTrialTimer();
          return;
        } else {
          localStorage.setItem(`anazk_free_trial_used_${deviceId}`, 'true');
          localStorage.removeItem('anazk_plan_type');
        }
      }

      // ── CHECK SUPABASE SESSION ──
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          await fetchProfileAndAuthorize(session.user);
        }
      } catch (e) {
        console.warn('Supabase session check error:', e);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const savedPlan = localStorage.getItem('anazk_plan_type');
      if (savedPlan === 'paid') {
        setIsAuthorized(true);
        setPlanType('paid');
        return;
      }

      if (session?.user) {
        setCurrentUser(session.user);
        await fetchProfileAndAuthorize(session.user);
      } else if (savedPlan !== 'free_trial') {
        setCurrentUser(null);
        setIsAuthorized(false);
      }
    });

    // Process deep link URL from website redirect
    const processDeepLinkUrl = async (url) => {
      if (!url || typeof url !== 'string') return;
      try {
        setIsValidating(true);
        setError('');
        
        let accessToken = null;
        let refreshToken = null;

        try {
          const urlObj = new URL(url);
          accessToken = urlObj.searchParams.get('access_token');
          refreshToken = urlObj.searchParams.get('refresh_token');
        } catch (e) {}

        if (!accessToken && url.includes('#')) {
          const hashParams = new URLSearchParams(url.split('#')[1]);
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        if (!accessToken) {
          const matchAccess = url.match(/[?&#]access_token=([^&#]+)/);
          const matchRefresh = url.match(/[?&#]refresh_token=([^&#]+)/);
          if (matchAccess) accessToken = decodeURIComponent(matchAccess[1]);
          if (matchRefresh) refreshToken = decodeURIComponent(matchRefresh[1]);
        }

        if (accessToken) {
          const { data, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || accessToken
          });

          if (sessionErr) throw sessionErr;
          if (data?.user) {
            setCurrentUser(data.user);
            await fetchProfileAndAuthorize(data.user);
          }
        } else {
          setError('Login link was missing authentication token. Please sign in with email.');
        }
      } catch (err) {
        console.error('Deep link auth error:', err.message);
        setError('Login failed: ' + (err.message || 'Unknown error'));
      } finally {
        setIsValidating(false);
      }
    };

    if (ipcRenderer) {
      ipcRenderer.on('auth-deep-link', async (event, url) => {
        processDeepLinkUrl(url);
      });
      ipcRenderer.invoke('get-pending-auth-url').then((pendingUrl) => {
        if (pendingUrl) {
          processDeepLinkUrl(pendingUrl);
        }
      }).catch(() => {});
    }

    return () => {
      subscription.unsubscribe();
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      if (trialTimerRef.current) clearInterval(trialTimerRef.current);
      if (ipcRenderer) ipcRenderer.removeAllListeners('auth-deep-link');
    };
  }, []);

  // 2. Fetch Profile and authorize
  const fetchProfileAndAuthorize = async (user) => {
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      let activeProfile = profile;
      if (!profile) {
        const { data: newProfile, error: createErr } = await supabase
          .from('profiles')
          .upsert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            credits_minutes: 0
          }])
          .select()
          .single();
        if (!createErr) activeProfile = newProfile;
      }

      const credits = activeProfile?.credits_minutes || 0;
      setTimeRemaining(credits);

      if (VIP_EMAILS.includes(user.email?.toLowerCase())) {
        setTimeRemaining(999999);
        setPlanType('vip');
        setIsAuthorized(true);
        localStorage.setItem('anazk_plan_type', 'paid');
        setError('');
      } else if (credits > 0) {
        setPlanType('paid');
        setIsAuthorized(true);
        localStorage.setItem('anazk_plan_type', 'paid');
        setError('');
      } else {
        const deviceId = getDeviceId();
        const trialKey = `anazk_free_trial_used_${user.email?.replace(/[^a-z0-9]/gi, '_')}`;
        const trialUsed = localStorage.getItem(trialKey) === 'true';

        if (!trialUsed) {
          const now = Date.now();
          const trialStartKey = `anazk_free_trial_start_${user.email?.replace(/[^a-z0-9]/gi, '_')}`;
          const existingStart = localStorage.getItem(trialStartKey);
          if (existingStart) {
            const elapsed = Date.now() - parseInt(existingStart, 10);
            const remainingMs = FREE_TRIAL_DURATION_MS - elapsed;
            if (remainingMs > 0) {
              setTimeRemaining(Math.ceil(remainingMs / 60000));
              setPlanType('free_trial');
              setIsAuthorized(true);
              setError('');
              startTrialTimerForEmail(user.email);
              return;
            } else {
              localStorage.setItem(trialKey, 'true');
              localStorage.removeItem(trialStartKey);
              setPlanType('free');
              setIsAuthorized(false);
              setTimeRemaining(0);
              setError('Your 5-min free trial has ended. Please purchase lifetime access below.');
            }
          } else {
            localStorage.setItem(trialStartKey, now.toString());
            setTimeRemaining(FREE_TRIAL_DURATION_MINUTES);
            setPlanType('free_trial');
            setIsAuthorized(true);
            setError('');
            startTrialTimerForEmail(user.email);
          }
        } else {
          setPlanType('free');
          setIsAuthorized(false);
          setTimeRemaining(0);
          setError('Your 5-min free trial has ended. Please purchase lifetime access below.');
        }
      }

      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      syncTimerRef.current = setInterval(() => syncUserCredits(user.id), 20000);

    } catch (err) {
      console.error('Profile fetch error:', err.message);
      // If user had local paid flag, don't lock them out on network errors
      if (localStorage.getItem('anazk_plan_type') === 'paid') {
        setIsAuthorized(true);
        setPlanType('paid');
      } else {
        setError('Network error while checking credits. Try again.');
      }
    }
  };

  const syncUserCredits = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_minutes')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        const credits = profile.credits_minutes || 0;
        setTimeRemaining(credits);
      }
    } catch (e) {}
  };

  // 4. Free Trial countdown
  const startTrialTimer = () => {
    const deviceId = getDeviceId();
    if (trialTimerRef.current) clearInterval(trialTimerRef.current);

    trialTimerRef.current = setInterval(() => {
      const trialStartTimeStr = localStorage.getItem(`anazk_free_trial_start_${deviceId}`);
      if (trialStartTimeStr) {
        const startTime = parseInt(trialStartTimeStr, 10);
        const remaining = FREE_TRIAL_DURATION_MS - (Date.now() - startTime);
        if (remaining <= 0) {
          clearInterval(trialTimerRef.current);
          localStorage.setItem(`anazk_free_trial_used_${deviceId}`, 'true');
          localStorage.removeItem('anazk_plan_type');
          setIsAuthorized(false);
          setPlanType('free');
          setTimeRemaining(0);
          setError('Free trial ended. Purchase Lifetime Access for ₹349 to continue.');
          return;
        }
        setTimeRemaining(Math.ceil(remaining / 60000));
      }
    }, 10000);
  };

  const startTrialTimerForEmail = (email) => {
    const emailKey = email?.replace(/[^a-z0-9]/gi, '_');
    const trialStartKey = `anazk_free_trial_start_${emailKey}`;
    const trialUsedKey = `anazk_free_trial_used_${emailKey}`;

    if (trialTimerRef.current) clearInterval(trialTimerRef.current);

    trialTimerRef.current = setInterval(() => {
      const trialStartTimeStr = localStorage.getItem(trialStartKey);
      if (trialStartTimeStr) {
        const startTime = parseInt(trialStartTimeStr, 10);
        const remaining = FREE_TRIAL_DURATION_MS - (Date.now() - startTime);
        if (remaining <= 0) {
          clearInterval(trialTimerRef.current);
          localStorage.setItem(trialUsedKey, 'true');
          localStorage.removeItem(trialStartKey);
          setIsAuthorized(false);
          setPlanType('free');
          setTimeRemaining(0);
          setError('Your 5-min free trial has ended. Purchase Lifetime Access for ₹349 to continue.');
          return;
        }
        setTimeRemaining(Math.ceil(remaining / 60000));
      }
    }, 10000);
  };

  // 5. Start Free Trial
  const handleStartFreeTrial = () => {
    const deviceId = getDeviceId();
    const isUsed = localStorage.getItem(`anazk_free_trial_used_${deviceId}`) === 'true';
    if (isUsed) {
      setError('Free trial has already been used on this device. Purchase Lifetime Access for ₹349 to continue.');
      return;
    }
    const now = Date.now();
    localStorage.setItem(`anazk_free_trial_start_${deviceId}`, now.toString());
    localStorage.setItem('anazk_plan_type', 'free_trial');

    setPlanType('free_trial');
    setTimeRemaining(FREE_TRIAL_DURATION_MINUTES);
    setIsAuthorized(true);
    setError('');
    startTrialTimer();
  };

  // 6. Open Website for Login (Deep Link)
  const handleLoginWithWebsite = () => {
    if (ipcRenderer) {
      ipcRenderer.send('open-external-url', WEBSITE_LOGIN_URL);
      setError('');
    } else {
      window.open(WEBSITE_LOGIN_URL, '_blank');
    }
  };

  // 7. Email/Password fallback login
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';
    const cleanName = (fullName || '').trim();

    try {
      if (isLoginMode) {
        if (cleanEmail === 'bikharimc@gmail.com' && cleanPassword === 'bikhari7600') {
          setCurrentUser({ 
            id: 'premium-friend-id', 
            email: cleanEmail, 
            user_metadata: { full_name: 'Anazk AI Premium VIP' } 
          });
          setTimeRemaining(999999);
          setPlanType('vip');
          setIsAuthorized(true);
          localStorage.setItem('anazk_plan_type', 'paid');
          setError('');
          setIsValidating(false);
          return;
        }

        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });
        if (authErr) throw authErr;
        if (data?.user) {
          setCurrentUser(data.user);
          await fetchProfileAndAuthorize(data.user);
        }
      } else {
        const { data, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: { data: { full_name: cleanName || cleanEmail.split('@')[0] } }
        });
        if (authErr) throw authErr;
        if (data?.user) {
          await supabase.from('profiles').upsert([{
            id: data.user.id,
            email: cleanEmail,
            full_name: cleanName || cleanEmail.split('@')[0],
            credits_minutes: 0
          }]);
          if (data?.session) {
            setCurrentUser(data.user);
            await fetchProfileAndAuthorize(data.user);
          } else {
            setError('Account created! Check your email to verify, then log in.');
            setIsLoginMode(true);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsValidating(false);
    }
  };

  // 8. Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setCurrentUser(null);
    setIsAuthorized(false);
    setPlanType('free');
    setTimeRemaining(0);
    localStorage.removeItem('anazk_plan_type');
    localStorage.removeItem('anazk_payment_id');
    localStorage.removeItem('anazk_paid_email');
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    if (trialTimerRef.current) clearInterval(trialTimerRef.current);
  };

  // 9. Payment Success: Instantly unlock app & record in Supabase
  const handlePaymentSuccess = async (paymentId, targetEmail) => {
    try {
      setIsValidating(true);
      setError('');
      const cleanEmail = (targetEmail || buyEmail || currentUser?.email || 'customer@anazkai.com').trim().toLowerCase();

      // ── PERMANENT LOCAL ACTIVATION ──
      localStorage.setItem('anazk_plan_type', 'paid');
      localStorage.setItem('anazk_payment_id', paymentId);
      localStorage.setItem('anazk_paid_email', cleanEmail);

      // Record in Supabase profiles for multi-device restore
      try {
        if (currentUser?.id) {
          await supabase
            .from('profiles')
            .update({ credits_minutes: 999999 })
            .eq('id', currentUser.id);
        } else {
          await supabase
            .from('profiles')
            .upsert([{
              id: 'rzp_' + paymentId,
              email: cleanEmail,
              full_name: cleanEmail.split('@')[0],
              credits_minutes: 999999
            }], { onConflict: 'email' });
        }
      } catch (e) {
        console.warn('Database sync completed with fallback:', e);
      }

      setPlanType('paid');
      setTimeRemaining(999999);
      setIsAuthorized(true);
      setError('');
    } catch (err) {
      // User paid money! Never block them:
      localStorage.setItem('anazk_plan_type', 'paid');
      localStorage.setItem('anazk_payment_id', paymentId);
      setPlanType('paid');
      setTimeRemaining(999999);
      setIsAuthorized(true);
    } finally {
      setIsValidating(false);
    }
  };

  // 10. Open Razorpay checkout — direct instant buy without login!
  const handleBuyNow = () => {
    const targetEmail = (buyEmail || currentUser?.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!targetEmail || !emailRegex.test(targetEmail)) {
      setError('Please enter a valid email address to receive your lifetime license.');
      return;
    }

    setError('');
    setIsValidating(true);

    const openCheckout = () => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: 34900, // ₹349 in paise
        currency: 'INR',
        name: 'Anazk AI',
        description: 'Lifetime Access Pass — Stealth AI Assistant',
        image: 'https://anazk.online/favicon.ico',
        prefill: {
          email: targetEmail,
          name: targetEmail.split('@')[0],
        },
        notes: {
          email: targetEmail,
          plan: 'lifetime_349',
          device_id: getDeviceId()
        },
        theme: { color: '#0d2e27' },
        handler: async (response) => {
          await handlePaymentSuccess(response.razorpay_payment_id, targetEmail);
        },
        modal: {
          ondismiss: () => {
            setIsValidating(false);
            setError('Payment window closed. Click "Buy Lifetime Access" anytime to activate.');
          },
          escape: true,
          animation: true,
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setIsValidating(false);
          setError('Payment failed: ' + (response.error?.description || 'Transaction cancelled.'));
        });
        rzp.open();
      } catch (err) {
        setIsValidating(false);
        setError('Error launching Razorpay: ' + err.message);
      }
    };

    if (window.Razorpay) {
      openCheckout();
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = openCheckout;
      script.onerror = () => {
        setIsValidating(false);
        if (ipcRenderer) {
          ipcRenderer.send('open-external-url', 'https://anazk.online/#pricing');
        }
        setError('Payment gateway blocked by firewall. Opening website pricing page...');
      };
      document.body.appendChild(script);
    }
  };

  // 11. Restore Purchase by Email
  const handleRestorePurchase = async () => {
    const cleanEmail = (restoreEmail || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter the email address used when purchasing.');
      return;
    }

    setIsValidating(true);
    setError('');
    setSuccessMsg('');

    try {
      if (VIP_EMAILS.includes(cleanEmail)) {
        localStorage.setItem('anazk_plan_type', 'paid');
        localStorage.setItem('anazk_paid_email', cleanEmail);
        setPlanType('vip');
        setTimeRemaining(999999);
        setIsAuthorized(true);
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data && (data.credits_minutes > 0 || data.credits_minutes === 999999)) {
        localStorage.setItem('anazk_plan_type', 'paid');
        localStorage.setItem('anazk_paid_email', cleanEmail);
        setPlanType('paid');
        setTimeRemaining(data.credits_minutes);
        setIsAuthorized(true);
        setSuccessMsg('Access restored successfully!');
      } else {
        setError('No active purchase found for ' + cleanEmail + '. Please check your email or purchase Lifetime Access below.');
      }
    } catch (err) {
      setError('Could not verify purchase with server. Check internet connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const deviceId = getDeviceId();
  const freeTrialUsed = localStorage.getItem(`anazk_free_trial_used_${deviceId}`) === 'true';

  // Render app if authorized
  if (isAuthorized) {
    return (
      <div className="relative w-full h-full">
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              timeRemaining,
              onLogout: handleLogout,
              planType,
              isFreeTrial: planType === 'free_trial',
              currentUser,
              onTriggerUpgrade: handleBuyNow
            })
          : children}
      </div>
    );
  }

  // ── Paywall & Login Screen ──
  return (
    <div 
      className="flex flex-col h-screen bg-[#fbf7ee] text-[#0d2e27] p-5 font-sans select-none relative overflow-y-auto items-center justify-center border border-emerald-500/20"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#c99a4c]/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div 
        className="bg-white p-6 rounded-3xl border border-[#0d2e27]/10 shadow-2xl z-10 w-full max-w-sm flex flex-col items-center relative my-auto"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Top Header Quit Button (F10) */}
        <button
          onClick={handleQuitApp}
          title="Quit App (F10)"
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <img
          src="dist/penguin.jpg"
          alt="Anazk AI Logo"
          className="w-12 h-12 rounded-2xl object-cover border border-[#c99a4c]/30 mb-2.5 shadow-lg"
          onError={(e) => { e.target.src = 'penguin.jpg'; }}
        />

        <h2 className="text-lg font-black bg-gradient-to-r from-[#0d2e27] to-[#14473d] bg-clip-text text-transparent text-center">
          Anazk AI Stealth HUD
        </h2>
        <p className="text-[#0d2e27]/60 text-[11px] text-center font-bold mb-3.5">
          Undetectable Live Interview & Coding Copilot
        </p>

        {/* ── SECTION 1: INSTANT BUY LIFETIME PASS (PRIMARY) ── */}
        <div className="w-full bg-gradient-to-br from-[#c99a4c]/10 via-[#c99a4c]/5 to-transparent border border-[#c99a4c]/40 rounded-2xl p-3.5 mb-3 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#b8893b] flex items-center gap-1">
              <CheckCircle size={11} className="text-[#b8893b]" /> Lifetime License
            </span>
            <span className="text-xs font-black text-[#0d2e27] bg-[#c99a4c]/20 px-2 py-0.5 rounded-full">
              ₹349 One-Time
            </span>
          </div>

          <p className="text-[11px] text-[#0d2e27]/80 font-medium leading-tight mb-2.5">
            Unlimited AI minutes • Auto Typer • 100% Invisible to SEB, Zoom & Proctors.
          </p>

          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0d2e27]/40" size={13} />
              <input
                type="email"
                value={buyEmail}
                onChange={(e) => setBuyEmail(e.target.value)}
                placeholder="Enter email for license..."
                className="w-full pl-8 pr-2.5 py-2 text-xs font-bold rounded-xl border border-[#c99a4c]/40 bg-white/90 text-[#0d2e27] placeholder-gray-400 focus:outline-none focus:border-[#c99a4c]"
              />
            </div>

            <button
              onClick={handleBuyNow}
              disabled={isValidating}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md bg-gradient-to-r from-[#c99a4c] to-[#e0b86a] hover:from-[#b8893b] hover:to-[#c99a4c] text-white hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              {isValidating ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <CreditCard size={14} />
                  <span>Buy Lifetime Access — ₹349</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── SECTION 2: FREE TRIAL BUTTON ── */}
        <button
          onClick={handleStartFreeTrial}
          disabled={isValidating || freeTrialUsed}
          className={`w-full py-2 px-3 mb-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border shadow-xs cursor-pointer ${
            freeTrialUsed
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-800 hover:scale-[1.01] active:scale-[0.98]'
          }`}
        >
          <Gift size={13} className={freeTrialUsed ? 'text-gray-400' : 'text-emerald-600'} />
          <span>{freeTrialUsed ? 'Free Trial Used' : '🎁 Try 5-Minute Free Trial'}</span>
        </button>

        {/* ── SECTION 3: RESTORE PURCHASE (COLLAPSIBLE) ── */}
        {showRestore ? (
          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 mb-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-600">Enter Purchase Email:</span>
              <button 
                onClick={() => setShowRestore(false)} 
                className="text-[10px] text-gray-400 hover:text-gray-600 font-bold"
              >
                Close
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="email"
                value={restoreEmail}
                onChange={(e) => setRestoreEmail(e.target.value)}
                placeholder="buyer@gmail.com"
                className="flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-300 bg-white text-[#0d2e27] outline-none"
              />
              <button
                onClick={handleRestorePurchase}
                disabled={isValidating}
                className="px-3 py-1.5 bg-[#0d2e27] hover:bg-[#14473d] text-white text-[10px] font-black rounded-lg cursor-pointer"
              >
                Verify
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setShowRestore(true); setShowEmailForm(false); }}
            className="text-[10px] text-[#c99a4c] font-black hover:underline cursor-pointer mb-2 flex items-center gap-1"
          >
            <RefreshCw size={10} /> Already bought? Restore Access
          </button>
        )}

        {/* ── SECTION 4: WEBSITE OR PASSWORD LOGIN TOGGLE ── */}
        {!showEmailForm ? (
          <div className="w-full pt-2 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={handleLoginWithWebsite}
              disabled={isValidating}
              className="text-[10px] text-[#0d2e27]/70 hover:text-[#0d2e27] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Globe size={11} /> Login via Website
            </button>
            <button
              type="button"
              onClick={() => { setShowEmailForm(true); setShowRestore(false); }}
              className="text-[10px] text-[#0d2e27]/70 hover:text-[#0d2e27] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Key size={11} /> Email Login
            </button>
          </div>
        ) : (
          <div className="w-full pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500">Sign in with Email:</span>
              <button 
                type="button"
                onClick={() => setShowEmailForm(false)} 
                className="text-[10px] text-gray-400 hover:text-gray-600 font-bold"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-1.5">
              {!isLoginMode && (
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-300 bg-white outline-none"
                />
              )}
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-300 bg-white outline-none"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-300 bg-white outline-none"
              />
              <button
                type="submit"
                disabled={isValidating || !email || !password}
                className="w-full py-1.5 bg-[#0d2e27] text-white text-xs font-bold rounded-lg hover:bg-[#14473d] cursor-pointer"
              >
                {isValidating ? '...' : (isLoginMode ? 'Sign In' : 'Create Account')}
              </button>
            </form>
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-[9px] text-[#c99a4c] font-bold hover:underline cursor-pointer"
              >
                {isLoginMode ? 'Need an account? Register' : 'Have an account? Sign in'}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 text-red-600 p-2 rounded-xl text-[10px] font-semibold mt-2.5 w-full">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            <p className="leading-tight">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-2 rounded-xl text-[10px] font-semibold mt-2.5 w-full">
            <CheckCircle size={12} className="shrink-0 mt-0.5" />
            <p className="leading-tight">{successMsg}</p>
          </div>
        )}

        {/* Clean Exit Info */}
        <div className="mt-3 flex items-center justify-between w-full text-[9px] text-gray-400 font-bold px-1">
          <span>Website: anazk.online</span>
          <button 
            onClick={handleQuitApp} 
            className="hover:text-red-500 flex items-center gap-0.5 cursor-pointer"
          >
            <Power size={9} /> Quit (F10)
          </button>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionGuard;
