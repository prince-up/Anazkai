import React, { useState, useEffect, useRef } from 'react';
import { Globe, Mail, Lock, AlertCircle, Gift, ShieldCheck, User, LogIn, CreditCard, CheckCircle } from 'lucide-react';
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
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [planType, setPlanType] = useState('free');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const syncTimerRef = useRef(null);
  const trialTimerRef = useRef(null);

  // 1. Check active session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const deviceId = getDeviceId();
      const savedPlan = localStorage.getItem('anazk_plan_type');
      const trialStartTimeStr = localStorage.getItem(`anazk_free_trial_start_${deviceId}`);

      // Check for active free trial
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

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchProfileAndAuthorize(session.user);
      }
    };

    initializeAuth();

    // Listen for auth changes (e.g. after deep link login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchProfileAndAuthorize(session.user);
      } else {
        setCurrentUser(null);
        setIsAuthorized(false);
      }
    });

    // Listen for deep link auth token from main process (Electron)
    if (ipcRenderer) {
      ipcRenderer.on('auth-deep-link', async (event, url) => {
        try {
          setIsValidating(true);
          setError('');
          const urlObj = new URL(url);
          const accessToken = urlObj.searchParams.get('access_token');
          const refreshToken = urlObj.searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error: sessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionErr) throw sessionErr;
            if (data?.user) {
              setCurrentUser(data.user);
              await fetchProfileAndAuthorize(data.user);
            }
          } else {
            setError('Login failed. Invalid redirect link. Please try again.');
          }
        } catch (err) {
          console.error('Deep link auth error:', err.message);
          setError('Login failed: ' + (err.message || 'Unknown error'));
        } finally {
          setIsValidating(false);
        }
      });
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

      if (profileErr) throw profileErr;

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
        setError('');
      } else if (credits > 0) {
        setPlanType('paid');
        setIsAuthorized(true);
        setError('');
      } else {
        // 0 credits → check if device free trial is still available
        const deviceId = getDeviceId();
        // Use email-scoped trial key so deleted+re-registered users get fresh trial
        const trialKey = `anazk_free_trial_used_${user.email?.replace(/[^a-z0-9]/gi, '_')}`;
        const trialUsed = localStorage.getItem(trialKey) === 'true';

        if (!trialUsed) {
          // Auto-start 5-min free trial for first-time / new account users
          const now = Date.now();
          const trialStartKey = `anazk_free_trial_start_${user.email?.replace(/[^a-z0-9]/gi, '_')}`;
          
          // Check if trial was already started (and still running) for this email
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
              // Trial ended
              localStorage.setItem(trialKey, 'true');
              localStorage.removeItem(trialStartKey);
              setPlanType('free');
              setIsAuthorized(false);
              setTimeRemaining(0);
              setError('Your 5-min free trial has ended. Please purchase minutes at anazk.online');
            }
          } else {
            // Fresh trial — start now
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
          setError('Your 5-min free trial has ended. Please purchase minutes at anazk.online');
        }
      }

      // Sync credits every 15s
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      syncTimerRef.current = setInterval(() => syncUserCredits(user.id), 15000);

    } catch (err) {
      console.error('Profile fetch error:', err.message);
      setError('Connection error. Failed to sync your credit minutes.');
    }
  };

  // 3. Periodic sync
  const syncUserCredits = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits_minutes')
        .eq('id', userId)
        .maybeSingle();

      if (!error && profile) {
        const credits = profile.credits_minutes || 0;
        setTimeRemaining(credits);
        if (credits <= 0 && planType === 'paid') {
          setIsAuthorized(false);
          setError('Your account is out of credits. Please purchase more minutes at anazk.online');
        }
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
          setError('Free trial ended. Please log in and purchase minutes at anazk.online');
          return;
        }
        setTimeRemaining(Math.ceil(remaining / 60000));
      }
    }, 10000);
  };

  // 4b. Email-scoped trial timer (for logged-in users with 0 credits)
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
          setError('Your 5-min free trial has ended. Please purchase minutes at anazk.online');
          return;
        }
        setTimeRemaining(Math.ceil(remaining / 60000));
      }
    }, 10000);
  };

  // 5. Start Free Trial
  const handleStartFreeTrial = () => {
    const deviceId = getDeviceId();
    const isUsed = localStorage.getItem(`anazk_free_trial_used_${deviceId}`);

    if (isUsed === 'true') {
      setError('Free trial already used on this device. Please log in to continue.');
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
      // Fallback for dev mode (browser)
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
        // --- HARDCODED PREMIUM BYPASS FOR FRIENDS ---
        if (cleanEmail === 'bikharimc@gmail.com' && cleanPassword === 'bikhari7600') {
          setCurrentUser({ 
            id: 'premium-friend-id', 
            email: cleanEmail, 
            user_metadata: { full_name: 'HideAI Premium VIP' } 
          });
          setTimeRemaining('UNLIMITED');
          setPlanType('vip');
          setIsAuthorized(true);
          setError('');
          setIsValidating(false);
          return;
        }
        // ---------------------------------------------

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
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthorized(false);
    setPlanType('free');
    setTimeRemaining(0);
    localStorage.removeItem('anazk_plan_type');
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    if (trialTimerRef.current) clearInterval(trialTimerRef.current);
  };

  // 9. Handle Razorpay payment success — grant lifetime credits
  const handlePaymentSuccess = async (paymentId) => {
    if (!currentUser) return;
    try {
      setIsValidating(true);
      setError('');
      // Update Supabase: grant 999999 credits (lifetime access)
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ credits_minutes: 999999 })
        .eq('id', currentUser.id);
      if (updateErr) throw updateErr;
      // Also store payment ID in localStorage for reference
      localStorage.setItem(`anazk_payment_id_${currentUser.id}`, paymentId);
      setPlanType('paid');
      setTimeRemaining(999999);
      setIsAuthorized(true);
      setError('');
    } catch (err) {
      setError(`Payment received ✅ but activation failed. Email supportanazkai@gmail.com with Payment ID: ${paymentId}`);
    } finally {
      setIsValidating(false);
    }
  };

  // 10. Open Razorpay checkout
  const handleBuyNow = () => {
    if (!currentUser) {
      setError('Please log in first before purchasing.');
      return;
    }
    setError('');

    const openCheckout = () => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: 34900, // ₹349 in paise
        currency: 'INR',
        name: 'HideAI',
        description: 'Lifetime Access — One Time Payment',
        image: 'https://anazk.online/favicon.ico',
        prefill: {
          email: currentUser?.email || '',
          name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || '',
        },
        notes: {
          user_id: currentUser?.id || '',
          email: currentUser?.email || '',
        },
        theme: { color: '#0d2e27' },
        handler: async (response) => {
          await handlePaymentSuccess(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => setError('Payment cancelled. Click "Buy ₹349" to try again.'),
          escape: true,
          animation: true,
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError('Payment failed: ' + (response.error?.description || 'Unknown error. Please try again.'));
      });
      rzp.open();
    };

    // Load Razorpay script if not already loaded
    if (window.Razorpay) {
      openCheckout();
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = openCheckout;
      script.onerror = () => {
        // Fallback: open website pricing in browser
        if (ipcRenderer) {
          ipcRenderer.send('open-external-url', 'https://anazk.online/#pricing');
        }
        setError('Payment page failed to load. Opening website instead...');
      };
      document.body.appendChild(script);
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
              currentUser
            })
          : children}
      </div>
    );
  }

  // Login Screen
  return (
    <div 
      className="flex flex-col h-screen bg-[#fbf7ee] text-[#0d2e27] p-6 font-sans select-none relative overflow-hidden items-center justify-center border border-emerald-500/20"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#c99a4c]/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div 
        className="bg-white p-7 rounded-3xl border border-[#0d2e27]/10 shadow-2xl z-10 w-full max-w-sm flex flex-col items-center"
        style={{ WebkitAppRegion: 'no-drag' }}
      >

        {/* Logo */}
        <img
          src="dist/penguin.jpg"
          alt="HideAI Logo"
          className="w-14 h-14 rounded-2xl object-cover border border-[#c99a4c]/30 mb-3.5 shadow-lg"
          onError={(e) => { e.target.src = 'penguin.jpg'; }}
        />

        <h2 className="text-xl font-black mb-1 bg-gradient-to-r from-[#0d2e27] to-[#14473d] bg-clip-text text-transparent text-center">
          HideAI Stealth HUD
        </h2>
        <p className="text-[#0d2e27]/60 text-xs text-center font-bold mb-5">
          Sign in to access your interview minutes
        </p>

        {/* Primary: Login with Website */}
        {!showEmailForm && (
          <>
            <button
              onClick={handleLoginWithWebsite}
              disabled={isValidating}
              className="w-full py-3 px-4 mb-3 rounded-xl text-sm font-black flex items-center justify-center gap-2.5 transition-all border shadow-lg bg-[#0d2e27] hover:bg-[#14473d] border-[#0d2e27] text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isValidating ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Globe size={16} />
                  <span>Login with Website</span>
                </>
              )}
            </button>

            {isValidating && (
              <p className="text-[#c99a4c] text-[11px] font-bold text-center mb-3 animate-pulse">
                ⏳ Waiting for browser login... come back after signing in on anazk.online
              </p>
            )}

            {/* Divider */}
            <div className="w-full flex items-center gap-3 my-2 mb-3">
              <div className="flex-1 h-[1px] bg-[#0d2e27]/10"></div>
              <span className="text-[10px] text-[#0d2e27]/50 font-bold uppercase tracking-wider">or</span>
              <div className="flex-1 h-[1px] bg-[#0d2e27]/10"></div>
            </div>

            {/* Free Trial */}
            <button
              onClick={handleStartFreeTrial}
              disabled={freeTrialUsed}
              className={`w-full py-2.5 px-4 mb-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border shadow-lg ${
                freeTrialUsed
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 border-[#c99a4c]/50 text-[#c99a4c] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              }`}
            >
              <Gift size={14} className={freeTrialUsed ? 'text-gray-400' : 'text-[#c99a4c]'} />
              <span>{freeTrialUsed ? '🚫 Free Trial Already Used' : '🎁 Start 5-Min Free Trial'}</span>
            </button>

            {/* Email fallback toggle */}
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="text-[11px] text-[#0d2e27]/70 font-bold hover:text-[#0d2e27] transition-colors cursor-pointer mt-1"
            >
              or sign in with email & password
            </button>
          </>
        )}

        {/* Fallback: Email/Password form */}
        {showEmailForm && (
          <>
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="text-[11px] text-[#0d2e27] font-bold hover:underline cursor-pointer mb-3 self-start"
            >
              ← Back to Website Login
            </button>

            <form onSubmit={handleAuthSubmit} className="w-full flex flex-col gap-3">
              {!isLoginMode && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0d2e27]/50" size={14} />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-[#0d2e27]/20 rounded-xl outline-none focus:border-[#c99a4c] text-[#0d2e27] placeholder-gray-400 transition-all text-xs font-bold"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0d2e27]/50" size={14} />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-[#0d2e27]/20 rounded-xl outline-none focus:border-[#c99a4c] text-[#0d2e27] placeholder-gray-400 transition-all text-xs font-bold"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0d2e27]/50" size={14} />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-[#0d2e27]/20 rounded-xl outline-none focus:border-[#c99a4c] text-[#0d2e27] placeholder-gray-400 transition-all text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isValidating || !email || !password}
                className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  isValidating || !email || !password
                    ? 'bg-[#0d2e27]/40 text-white/50 cursor-not-allowed'
                    : 'bg-[#0d2e27] hover:bg-[#14473d] text-white hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isValidating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>{isLoginMode ? 'Log In' : 'Register'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-[11px] text-[#0d2e27]/70 font-bold text-center">
              {isLoginMode ? (
                <p>New user? <button type="button" onClick={() => { setIsLoginMode(false); setError(''); }} className="text-[#c99a4c] hover:underline cursor-pointer">Create Account</button></p>
              ) : (
                <p>Already registered? <button type="button" onClick={() => { setIsLoginMode(true); setError(''); }} className="text-[#c99a4c] hover:underline cursor-pointer">Sign In</button></p>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-xl text-[11px] font-semibold mt-3 w-full">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <p className="mt-4 text-[10px] text-[#0d2e27]/50 font-bold text-center">
          Buy at <span className="text-[#c99a4c]">anazk.online</span> or pay below
        </p>

        {/* Buy Now Button — always visible if user is logged in */}
        {currentUser && (
          <button
            onClick={handleBuyNow}
            disabled={isValidating}
            className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2.5 transition-all shadow-lg bg-gradient-to-r from-[#c99a4c] to-[#e0b86a] hover:from-[#b8893b] hover:to-[#c99a4c] text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-[#c99a4c]/30"
          >
            {isValidating ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <CreditCard size={16} />
                <span>Buy Lifetime Access — ₹349</span>
              </>
            )}
          </button>
        )}

        {/* Show Buy button even if not logged in (with prompt) */}
        {!currentUser && (
          <div className="w-full mt-3 p-3 rounded-xl border border-[#c99a4c]/40 bg-[#c99a4c]/5 text-center">
            <p className="text-[11px] text-[#c99a4c] font-bold">💳 Login first, then buy ₹349 for lifetime access</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SubscriptionGuard;
