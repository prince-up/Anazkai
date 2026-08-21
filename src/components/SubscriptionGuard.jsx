import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mail, Lock, AlertCircle, Clock, Gift, ShieldCheck, LogOut, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

const FREE_TRIAL_DURATION_MINUTES = 5;
const FREE_TRIAL_DURATION_MS = FREE_TRIAL_DURATION_MINUTES * 60 * 1000;

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

const OWNER_MASTER_KEY = (import.meta.env.VITE_OWNER_MASTER_KEY || 'ANAZK-OWNER-VIP-2026').trim();

const SubscriptionGuard = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null); // in minutes
  const [planType, setPlanType] = useState('free'); // 'free' | 'paid' | 'vip' | 'free_trial'
  
  const syncTimerRef = useRef(null);
  const trialTimerRef = useRef(null);

  // 1. Check active session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const deviceId = getDeviceId();
      const savedPlan = localStorage.getItem('anazk_plan_type');
      const trialStartTimeStr = localStorage.getItem(`anazk_free_trial_start_${deviceId}`);

      // Check for free trial fallback
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchProfileAndAuthorize(session.user);
      } else {
        setCurrentUser(null);
        setIsAuthorized(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      if (trialTimerRef.current) clearInterval(trialTimerRef.current);
    };
  }, []);

  // 2. Fetch User Profile and check credits balance
  const fetchProfileAndAuthorize = async (user) => {
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      // Create profile if missing (resilience)
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

      // VIP Admin emails - permanent unlimited access, no payment needed
      const VIP_EMAILS = [
        'admin@anazk.online',
        'prince@anazk.online',
        'luckyprinceyadav1234@gmail.com'
      ];

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
        setPlanType('free');
        setIsAuthorized(false);
        setError('Your account has 0 credit minutes. Please buy credits on the website.');
      }

      // Start periodic credits synchronization (every 15 seconds)
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      syncTimerRef.current = setInterval(() => {
        syncUserCredits(user.id);
      }, 15000);

    } catch (err) {
      console.error('Profile fetch error:', err.message);
      setError('Connection error. Failed to sync your credit minutes.');
    }
  };

  // 3. Periodic credit balance syncing
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
        if (credits <= 0) {
          setIsAuthorized(false);
          setError('Your account is out of credits. Please purchase more minutes.');
        }
      }
    } catch (e) {}
  };

  // 4. Free Trial countdown logic
  const startTrialTimer = () => {
    const deviceId = getDeviceId();
    if (trialTimerRef.current) clearInterval(trialTimerRef.current);

    trialTimerRef.current = setInterval(() => {
      const trialStartTimeStr = localStorage.getItem(`anazk_free_trial_start_${deviceId}`);
      if (trialStartTimeStr) {
        const startTime = parseInt(trialStartTimeStr, 10);
        const elapsed = Date.now() - startTime;
        const remainingMs = FREE_TRIAL_DURATION_MS - elapsed;

        if (remainingMs <= 0) {
          clearInterval(trialTimerRef.current);
          localStorage.setItem(`anazk_free_trial_used_${deviceId}`, 'true');
          localStorage.removeItem('anazk_plan_type');
          setIsAuthorized(false);
          setPlanType('free');
          setTimeRemaining(0);
          setError('Free trial ended (5 minutes limit reached). Please upgrade to a paid plan.');
          return;
        }
        setTimeRemaining(Math.ceil(remainingMs / 60000));
      }
    }, 10000);
  };

  // 5. Start 5-Minute Free Trial trigger
  const handleStartFreeTrial = () => {
    const deviceId = getDeviceId();
    const isUsed = localStorage.getItem(`anazk_free_trial_used_${deviceId}`);

    if (isUsed === 'true') {
      setError('Free trial has already been used on this device. Please log in with a paid account.');
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

  // 6. Handle Email Auth Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';
    const cleanName = (fullName || '').trim();

    try {
      if (isLoginMode) {
        // --- MASTER KEY BYPASS LOGIC ---
        if (cleanEmail === 'admin' && cleanPassword === OWNER_MASTER_KEY) {
          setTimeRemaining(999999);
          setPlanType('vip');
          setIsAuthorized(true);
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
        // --- SIGN UP ---
        const { data, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { full_name: cleanName || cleanEmail.split('@')[0] }
          }
        });

        if (authErr) throw authErr;

        if (data?.user) {
          // Silent profiles upsert
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
            setError('Account created! Please check your email inbox to verify your account, then log in.');
            setIsLoginMode(true);
          }
        }
      }
    } catch (err) {
      console.error('Authentication Error:', err.message);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsValidating(false);
    }
  };

  // 7. Sign Out handler
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

  const deviceId = getDeviceId();
  const freeTrialUsed = localStorage.getItem(`anazk_free_trial_used_${deviceId}`) === 'true';

  // Render children (AppContent) if authorized
  if (isAuthorized) {
    return (
      <div className="relative w-full h-full">
        {React.isValidElement(children) 
          ? React.cloneElement(children, { 
              timeRemaining, 
              onLogout: handleLogout,
              planType: planType,
              isFreeTrial: planType === 'free_trial',
              currentUser: currentUser
            })
          : children}
      </div>
    );
  }

  // Render Login & Signup Form
  return (
    <div className="flex flex-col h-screen bg-[#070b19]/90 backdrop-blur-3xl text-gray-100 p-6 font-sans select-none relative overflow-hidden items-center justify-center border border-emerald-500/20">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-black/55 p-7 rounded-3xl border border-white/10 shadow-2xl z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Brand logo (Penguin) */}
        <img 
          src="dist/penguin.jpg" 
          alt="Anazk Logo" 
          className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/30 mb-3.5 shadow-lg"
          onError={(e) => { e.target.src = 'penguin.jpg'; }}
        />
        
        <h2 className="text-xl font-black mb-1 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent text-center">
          AnazkAI Stealth HUD
        </h2>
        <p className="text-gray-400 text-xs text-center font-medium mb-5">
          {isLoginMode ? 'Sign in to access your interview minutes' : 'Create a new developer profile'}
        </p>

        {/* Free Trial option */}
        {isLoginMode && (
          <>
            <button
              onClick={handleStartFreeTrial}
              disabled={freeTrialUsed}
              className={`w-full py-2.5 px-4 mb-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border shadow-lg ${
                freeTrialUsed
                  ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border-emerald-500/40 text-emerald-300 hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/10 cursor-pointer'
              }`}
            >
              <Gift size={14} className={freeTrialUsed ? 'text-gray-500' : 'text-emerald-400'} />
              <span>{freeTrialUsed ? 'Free Trial Expired (5m used)' : '🎁 Start 5-Min Free Trial'}</span>
            </button>

            <div className="w-full flex items-center gap-3 my-1 mb-4">
              <div className="flex-1 h-[1px] bg-white/10"></div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">or sign in</span>
              <div className="flex-1 h-[1px] bg-white/10"></div>
            </div>
          </>
        )}

        <form onSubmit={handleAuthSubmit} className="w-full flex flex-col gap-3">
          
          {/* Full name input (Sign up only) */}
          {!isLoginMode && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white placeholder-gray-600 transition-all text-xs"
              />
            </div>
          )}

          {/* Email input */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white placeholder-gray-600 transition-all text-xs"
            />
          </div>

          {/* Password input */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white placeholder-gray-600 transition-all text-xs"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-[11px] font-semibold animate-in fade-in">
              <AlertCircle size={13} className="shrink-0" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit action */}
          <button
            type="submit"
            disabled={isValidating || !email || !password}
            className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              isValidating || !email || !password
                ? 'bg-emerald-500/40 text-white/50 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/20'
            }`}
          >
            {isValidating ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>{isLoginMode ? 'Log In to App' : 'Register Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle mode links */}
        <div className="mt-5 text-[11px] text-gray-500 font-bold text-center">
          {isLoginMode ? (
            <p>
              New user? ...{' '}
              <button 
                type="button" 
                onClick={() => { setIsLoginMode(false); setError(''); }}
                className="text-emerald-450 hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button 
                type="button" 
                onClick={() => { setIsLoginMode(true); setError(''); }}
                className="text-emerald-450 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default SubscriptionGuard;
