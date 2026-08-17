import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Key, Lock, AlertCircle, Clock, Gift, ShieldCheck } from 'lucide-react';
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

// Master Secret Key for Owner / Admin testing (Can be overridden in .env with VITE_OWNER_MASTER_KEY)
const OWNER_MASTER_KEY = (import.meta.env.VITE_OWNER_MASTER_KEY || 'ANAZK-OWNER-VIP-2026').trim();

const SubscriptionGuard = ({ children }) => {
  const [licenseKey, setLicenseKey] = useState(() => localStorage.getItem('anazk_license_key') || '');
  const [planType, setPlanType] = useState(() => localStorage.getItem('anazk_plan_type') || 'paid');
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null); // in minutes or 'UNLIMITED'
  const [durationMinutes, setDurationMinutes] = useState(null);
  
  const timerRef = useRef(null);

  // Check existing license or active free trial on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('anazk_plan_type');
    const deviceId = getDeviceId();
    const trialStartTimeStr = localStorage.getItem(`anazk_free_trial_start_${deviceId}`);

    if (savedPlan === 'free_trial' && trialStartTimeStr) {
      const startTime = parseInt(trialStartTimeStr, 10);
      const elapsed = Date.now() - startTime;
      const remainingMs = FREE_TRIAL_DURATION_MS - elapsed;

      if (remainingMs > 0) {
        const remainingMin = Math.ceil(remainingMs / 60000);
        setTimeRemaining(remainingMin);
        setDurationMinutes(FREE_TRIAL_DURATION_MINUTES);
        setPlanType('free_trial');
        setIsAuthorized(true);
      } else {
        localStorage.setItem(`anazk_free_trial_used_${deviceId}`, 'true');
        localStorage.removeItem('anazk_plan_type');
        setIsAuthorized(false);
        setError('Free trial ended (5 minutes limit reached). Please purchase a license key to continue.');
      }
    } else if (licenseKey) {
      validateKey(licenseKey);
    }
  }, []);

  // Timer logic for both Free Trial and Paid License
  useEffect(() => {
    if (isAuthorized) {
      const deviceId = getDeviceId();

      timerRef.current = setInterval(() => {
        if (planType === 'free_trial') {
          const trialStartTimeStr = localStorage.getItem(`anazk_free_trial_start_${deviceId}`);
          if (trialStartTimeStr) {
            const startTime = parseInt(trialStartTimeStr, 10);
            const elapsed = Date.now() - startTime;
            const remainingMs = FREE_TRIAL_DURATION_MS - elapsed;

            if (remainingMs <= 0) {
              clearInterval(timerRef.current);
              localStorage.setItem(`anazk_free_trial_used_${deviceId}`, 'true');
              localStorage.removeItem('anazk_plan_type');
              setIsAuthorized(false);
              setPlanType(null);
              setTimeRemaining(0);
              setError('Free trial ended. Please upgrade to a paid plan.');
              return;
            }
            setTimeRemaining(Math.ceil(remainingMs / 60000));
          }
        } else if (typeof timeRemaining === 'number') {
          setTimeRemaining(prev => {
            if (typeof prev !== 'number') return prev;
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsAuthorized(false);
              setError('Your subscription has expired. Please purchase a new one.');
              localStorage.removeItem('anazk_license_key');
              localStorage.removeItem('anazk_plan_type');
              setLicenseKey('');
              
              // Mark as expired in DB
              supabase.from('licenses').update({ status: 'expired' }).eq('key', licenseKey).then();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 10000); // verify every 10 seconds
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthorized, planType, timeRemaining, licenseKey]);

  // Start 5-Minute Free Trial
  const handleStartFreeTrial = () => {
    const deviceId = getDeviceId();
    const isUsed = localStorage.getItem(`anazk_free_trial_used_${deviceId}`);

    if (isUsed === 'true') {
      setError('Free trial has already been used on this device. Please purchase a license key.');
      return;
    }

    const now = Date.now();
    localStorage.setItem(`anazk_free_trial_start_${deviceId}`, now.toString());
    localStorage.setItem('anazk_plan_type', 'free_trial');
    localStorage.removeItem('anazk_license_key');

    setPlanType('free_trial');
    setTimeRemaining(FREE_TRIAL_DURATION_MINUTES);
    setDurationMinutes(FREE_TRIAL_DURATION_MINUTES);
    setIsAuthorized(true);
    setError('');
  };

  const validateKey = async (keyToValidate) => {
    if (!keyToValidate) {
      setError('Please enter a valid License Key.');
      return;
    }

    const trimmedKey = keyToValidate.trim();
    setIsValidating(true);
    setError('');

    // 0. OWNER / MASTER VIP KEY BYPASS (Unlimited Lifetime Free Access)
    if (trimmedKey === OWNER_MASTER_KEY) {
      setTimeRemaining('UNLIMITED');
      setDurationMinutes(999999);
      setPlanType('vip');
      setIsAuthorized(true);
      localStorage.setItem('anazk_license_key', trimmedKey);
      localStorage.setItem('anazk_plan_type', 'vip');
      setLicenseKey(trimmedKey);
      setIsValidating(false);
      return;
    }

    try {
      const currentDeviceId = getDeviceId();

      // 1. Fetch license from Supabase directly
      const { data: license, error: fetchError } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', trimmedKey)
        .single();

      if (fetchError || !license) {
        setError('Invalid License Key. Please check and try again.');
        setIsValidating(false);
        return;
      }

      if (license.status === 'expired') {
        setError('This License Key has expired. Please purchase a new one.');
        setIsValidating(false);
        return;
      }

      // 2. Anti-Piracy / Single Device Check
      if (license.device_id && license.device_id !== currentDeviceId) {
        setError('This License Key is already registered on another device. Multi-device sharing is not allowed.');
        setIsValidating(false);
        return;
      }

      const now = new Date();
      let activatedAt = license.activated_at;

      // 3. If it's unused or not yet bound to a device, activate and lock to current device
      if (!activatedAt || !license.device_id) {
        activatedAt = activatedAt || now.toISOString();
        const { error: updateError } = await supabase
          .from('licenses')
          .update({ 
            activated_at: activatedAt, 
            status: 'active',
            device_id: currentDeviceId 
          })
          .eq('key', keyToValidate.trim());

        if (updateError) {
          setError('Failed to activate the key. Please try again.');
          setIsValidating(false);
          return;
        }
      }

      // 4. Calculate time remaining
      const activationTime = new Date(activatedAt).getTime();
      const currentTime = now.getTime();
      const durationMs = license.duration_minutes * 60 * 1000;
      const timeElapsed = currentTime - activationTime;
      const remainingMs = durationMs - timeElapsed;

      if (remainingMs <= 0) {
        await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('key', keyToValidate);
        
        setError('This License Key has expired.');
        setIsValidating(false);
        return;
      }

      // 5. Success!
      setTimeRemaining(Math.ceil(remainingMs / 1000 / 60));
      setDurationMinutes(license.duration_minutes);
      setPlanType('paid');
      setIsAuthorized(true);
      localStorage.setItem('anazk_license_key', keyToValidate);
      localStorage.setItem('anazk_plan_type', 'paid');
      setLicenseKey(keyToValidate);

    } catch (err) {
      console.error('Validation error:', err);
      setError('An error occurred while validating. Please check your connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    validateKey(licenseKey);
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setLicenseKey('');
    localStorage.removeItem('anazk_license_key');
    localStorage.removeItem('anazk_plan_type');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const deviceId = getDeviceId();
  const freeTrialUsed = localStorage.getItem(`anazk_free_trial_used_${deviceId}`) === 'true';

  // If authorized, render the app (children) with timer and plan props
  if (isAuthorized) {
    return (
      <div className="relative w-full h-full">
        {React.isValidElement(children) 
          ? React.cloneElement(children, { 
              timeRemaining, 
              onLogout: handleLogout,
              planType: planType || 'paid',
              isFreeTrial: planType === 'free_trial'
            })
          : children}
      </div>
    );
  }

  // If not authorized, show the lock & activation screen with Free Trial option
  return (
    <div className="flex flex-col h-screen bg-[#070b19]/90 backdrop-blur-3xl text-gray-100 p-6 font-sans select-none relative overflow-hidden items-center justify-center border border-emerald-500/20">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-black/50 p-7 rounded-3xl border border-white/10 shadow-2xl z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4 shadow-inner">
          <Lock className="text-emerald-400" size={28} />
        </div>
        
        <h2 className="text-xl font-black mb-1 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent text-center">
          AnazkAI Stealth HUD
        </h2>
        <p className="text-gray-400 text-xs text-center font-medium mb-5">
          Enter license key or start your 5-minute free trial
        </p>

        {/* Free Trial Button */}
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
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">or activate key</span>
          <div className="flex-1 h-[1px] bg-white/10"></div>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="relative group">
            <Key className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={15} />
            <input
              type="text"
              placeholder="anazk_..."
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white placeholder-gray-600 transition-all font-mono text-xs shadow-inner"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-[11px] font-medium animate-in fade-in">
              <AlertCircle size={13} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating || !licenseKey}
            className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              isValidating || !licenseKey
                ? 'bg-emerald-500/40 text-white/50 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/20'
            }`}
          >
            {isValidating ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <ShieldCheck size={14} />
                Activate License Key
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-[10px] text-gray-500 font-medium text-center">
          Need a license key? Visit <span className="text-emerald-400 font-bold">anazk.online</span>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionGuard;
