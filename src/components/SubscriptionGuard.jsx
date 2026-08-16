import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Key, Lock, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';

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
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null); // in minutes or 'UNLIMITED'
  const [durationMinutes, setDurationMinutes] = useState(null);
  
  const timerRef = useRef(null);

  // Initial check on mount
  useEffect(() => {
    if (licenseKey) {
      validateKey(licenseKey);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isAuthorized && typeof timeRemaining === 'number') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (typeof prev !== 'number') return prev;
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsAuthorized(false);
            setError('Your subscription has expired. Please purchase a new one.');
            localStorage.removeItem('anazk_license_key');
            setLicenseKey('');
            
            // Mark as expired in DB
            supabase.from('licenses').update({ status: 'expired' }).eq('key', licenseKey).then();
            
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // decrement every minute
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthorized, timeRemaining]);

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
      setIsAuthorized(true);
      localStorage.setItem('anazk_license_key', trimmedKey);
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

      // 2. Anti-Piracy / Single Device Check:
      // If the key is already locked to a different device, reject immediately!
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

      // 3. Calculate time remaining
      const activationTime = new Date(activatedAt).getTime();
      const currentTime = now.getTime();
      const durationMs = license.duration_minutes * 60 * 1000;
      const timeElapsed = currentTime - activationTime;
      const remainingMs = durationMs - timeElapsed;

      if (remainingMs <= 0) {
        // Mark as expired
        await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('key', keyToValidate);
        
        setError('This License Key has expired.');
        setIsValidating(false);
        return;
      }

      // 4. Success!
      setTimeRemaining(Math.ceil(remainingMs / 1000 / 60));
      setDurationMinutes(license.duration_minutes);
      setIsAuthorized(true);
      localStorage.setItem('anazk_license_key', keyToValidate);
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
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // If authorized, render the app (children) with timer props
  if (isAuthorized) {
    return (
      <div className="relative w-full h-full">
        {React.isValidElement(children) 
          ? React.cloneElement(children, { timeRemaining, onLogout: handleLogout })
          : children}
      </div>
    );
  }

  // If not authorized, show the lock screen
  return (
    <div className="flex flex-col h-screen bg-[#070b19]/90 backdrop-blur-3xl text-gray-100 p-6 font-sans select-none relative overflow-hidden items-center justify-center border border-emerald-500/20">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-black/40 p-8 rounded-3xl border border-white/5 shadow-2xl z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6 shadow-inner">
          <Lock className="text-emerald-400" size={32} />
        </div>
        
        <h2 className="text-2xl font-black mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Subscription Required
        </h2>
        <p className="text-gray-400 text-xs text-center font-medium mb-8">
          Please enter your Anazk License Key to start your session.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative group">
            <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="anazk_..."
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white placeholder-gray-600 transition-all font-mono text-sm shadow-inner"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-medium animate-in fade-in">
              <AlertCircle size={14} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating || !licenseKey}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              isValidating || !licenseKey
                ? 'bg-emerald-500/50 text-white/50 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/20'
            }`}
          >
            {isValidating ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles size={16} />
                Activate Session
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-[10px] text-gray-500 font-medium">
          Don't have a key? Purchase one on our website.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionGuard;
