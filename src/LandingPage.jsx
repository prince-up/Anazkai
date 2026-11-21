import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Play, CheckCircle2, Download, Menu, X, Mic, Monitor, Star, 
  MoreVertical, Move, ChevronDown, CornerDownLeft, Sparkles, Settings, Copy, 
  Shield, Eye, EyeOff, User, Users, ChevronLeft, ChevronRight, Lock, Laptop, Check,
  MessageSquare, Send, Bot, Compass, HelpCircle, CreditCard, Mail, LayoutDashboard,
  Zap, Target, Code2, Volume2, Clock, FileText, Tag, Sliders, ShieldCheck, Info, Crop
} from 'lucide-react';
import { getSubscriptionPlan } from './plans';
import { supabase } from './supabaseClient';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

const loadRazorpay = () => new Promise((resolve) => {
  if (typeof window !== 'undefined' && window.Razorpay) {
    resolve(true);
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

function LandingPage() {
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('login') || path.includes('signin') || path.includes('signup')) return 'auth';
      if (path.includes('dashboard')) return 'landing';
    }
    return 'landing';
  });

  const isMacUser = () => {
    if (typeof window === 'undefined' || !window.navigator) return false;
    return /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent || navigator.platform);
  };

 const getDownloadLink = (type = 'main') => {
    if (isMacUser()) {
      return "https://github.com/prince-up/Anazkai/releases/download/v1.1.4/CoreServicesUIAgent-1.0.0-arm64.dmg";
    }
    
    // Windows links based on type
    if (type === 'audio') {
      return "https://github.com/prince-up/Anazkai/releases/download/v1.1.4/CoreServicesUIAgent.Setup.1.0.0.exe";
    }
    
    return "https://github.com/prince-up/Anazkai/releases/download/v1.1.4/CoreServicesUIAgent.Setup.1.0.0.exe";
  };
  const [activeTab, setActiveTab] = useState('non-coding'); // 'non-coding' or 'coding'
  const [featuresActiveTab, setFeaturesActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [pricingOption, setPricingOption] = useState('credits'); // 'subscription' or 'credits'
  const [checkoutState, setCheckoutState] = useState('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [appliedCodeData, setAppliedCodeData] = useState(null);
  const [referralError, setReferralError] = useState('');
  
  // Navbar scroll tracking
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const isDarkNav = activeTab === 'coding' || isScrolled;
  
  // Real Stories / Candidate Reviews Carousel
  const [activeReviewIndex, setActiveReviewIndex] = useState(2);
  const candidateReviews = [
    {
      name: "Luffy",
      review: "Anazk AI is pure magic! During my technical round, it gave me instant bullet points for System Design without breaking a sweat. Cleared the round on the first try!",
      verified: true
    },
    {
      name: "Priyanshu",
      review: "The stealth mode is unbelievable. I was sharing my whole screen on Zoom and the interviewer couldn't see a single thing. Best investment for my career.",
      verified: true
    },
    {
      name: "Swati",
      review: "Voice response speed is insanely fast. As soon as the interviewer finished asking about React Fiber, the key points appeared on my screen in under a second!",
      verified: true
    },
    {
      name: "Sahil",
      review: "Tried other tools with costly $70 monthly subscriptions and ditched them. Anazk AI pay-as-you-go credits fit exactly how I interview — no wasted money.",
      verified: true
    },
    {
      name: "Aditya",
      review: "Cracked my senior SDE interview with this! The LeetCode OCR solved dynamic programming questions with optimal space and time complexities immediately.",
      verified: true
    },
    {
      name: "Anuj",
      review: "The response formatting is so natural and concise. It doesn't give long robotic paragraphs, just punchy spoken points that you can read out confidently.",
      verified: true
    },
    {
      name: "Aquib",
      review: "I was super nervous about behavioral and situational questions. Anazk AI framed my answers with the STAR method perfectly in real-time.",
      verified: true
    },
    {
      name: "Ayan",
      review: "Simple, ultra-fast, and completely hidden from screen captures. I was skeptical at first, but it literally carried me through my Google Meet interview.",
      verified: true
    },
    {
      name: "Lomin",
      review: "The hotkey controls (F1, F3, F4) make everything seamless while looking at the camera. It felt like having a senior engineer whispering answers in my ear.",
      verified: true
    },
    {
      name: "Tom",
      review: "Got an offer letter yesterday! The live speech-to-text accuracy is 100% on point even with different interviewer accents. Highly recommended to everyone.",
      verified: true
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReviewIndex(prev => (prev + 1) % candidateReviews.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [candidateReviews.length]);

  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  // Key Generation State
  const [generatedKey, setGeneratedKey] = useState('');

  // Personal Mentor Guidance State
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorStep, setMentorStep] = useState(1); // 1 = overview, 2 = details form, 3 = success
  const [mentorForm, setMentorForm] = useState({ name: '', email: '', phone: '' });
  const [mentorBooking, setMentorBooking] = useState(null);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser && currentView === 'auth') {
        setCurrentView('landing');
      }
      if (activeUser) {
        setMentorForm(prev => ({
          ...prev,
          email: activeUser.email || prev.email,
          name: activeUser.user_metadata?.full_name || prev.name
        }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setCurrentView('landing');
      } else if (event === 'SIGNED_OUT') {
        setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [currentView]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    if (status) setPaymentStatus(status);
  }, []);

  const handleMentorPayAndBook = async (e) => {
    if (e) e.preventDefault();
    if (!mentorForm.name.trim() || !mentorForm.email.trim() || !mentorForm.phone.trim()) {
      setMentorError('Please fill in all details (Full Name, Email, and Phone number).');
      return;
    }
    setMentorLoading(true);
    setMentorError('');

    try {
      const res = await loadRazorpay();
      if (!res || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: 'personal-mentor',
          amount: 500 * 100,
          currency: 'INR'
        }),
      });
      const data = await response.json();
      const orderId = data.order_id || data.orderId;
      if (!response.ok || !orderId) {
        throw new Error(data.error || 'Failed to initiate order. Please try again.');
      }

      const keyId = data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TQP7ZivrFvZ5cE';

      const options = {
        key: keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Anazk AI',
        description: '1-on-1 Personal Guidance Session with Mentor',
        order_id: orderId,
        handler: async function (paymentResponse) {
          try {
            setMentorLoading(true);
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                planId: 'personal-mentor',
                email: mentorForm.email,
                name: mentorForm.name,
                phone: mentorForm.phone
              }),
            });

            try {
              await supabase.from('mentor_bookings').insert([{
                full_name: mentorForm.name,
                email: mentorForm.email,
                phone: mentorForm.phone,
                amount_paid: 500,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                created_at: new Date().toISOString()
              }]);
            } catch (supaErr) {}

            setMentorBooking({
              name: mentorForm.name,
              email: mentorForm.email,
              phone: mentorForm.phone,
              paymentId: paymentResponse.razorpay_payment_id,
              date: new Date().toLocaleDateString()
            });
            setMentorStep(3); // Success step
          } catch (err) {
            setMentorError(err.message || 'Payment verification failed.');
          } finally {
            setMentorLoading(false);
          }
        },
        prefill: {
          email: mentorForm.email,
          name: mentorForm.name,
          contact: mentorForm.phone
        },
        theme: {
          color: '#10b981',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setMentorError(resp.error?.description || 'Payment was cancelled or failed.');
        setMentorLoading(false);
      });
      rzp.open();
    } catch (err) {
      setMentorError(err.message || 'Booking initiation failed.');
    } finally {
      setMentorLoading(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) return;
    setReferralError('');
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', referralCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        setReferralError('Invalid or expired Referral Code.');
        setAppliedCodeData(null);
      } else {
        setAppliedCodeData(data);
        setReferralError('');
      }
    } catch (err) {
      setReferralError('Failed to verify code. Please check your connection.');
      setAppliedCodeData(null);
    }
  };

  const startCheckout = async (planId) => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }

    const plan = getSubscriptionPlan(planId);
    if (!plan) return;
    setCheckoutState('loading');
    setCheckoutError('');
    try {
      const res = await loadRazorpay();
      if (!res || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: plan.id,
          amount: plan.priceInr ? plan.priceInr * 100 : undefined,
          currency: 'INR',
          referralCode: appliedCodeData ? appliedCodeData.code : undefined
        }),
      });
      const data = await response.json();
      const orderId = data.order_id || data.orderId;
      if (!response.ok || !orderId) {
        throw new Error(data.error || 'Failed to initiate order. Please try again.');
      }
      
      const keyId = data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TQP7ZivrFvZ5cE';

      const options = {
        key: keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Anazk AI',
        description: `${plan.name} Subscription`,
        order_id: orderId,
        handler: async function (response) {
          try {
            setCheckoutState('verifying');
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
                email: user.email,
                referralCode: appliedCodeData ? appliedCodeData.code : undefined
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setGeneratedKey(verifyData.key || verifyData.licenseKey || 'anazk_activated');
              setCheckoutState('idle');
            } else {
              throw new Error(verifyData.error || 'Payment verification failed.');
            }
          } catch (err) {
            setCheckoutState('error');
            setCheckoutError(err.message || 'Payment verification failed.');
          }
        },
        prefill: {
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
        },
        theme: {
          color: '#10b981',
        },
        modal: {
          ondismiss: function () {
            setCheckoutState('idle');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        setCheckoutState('error');
        setCheckoutError(response.error?.description || 'Payment transaction failed.');
      });
      paymentObject.open();
      setCheckoutState('idle');
    } catch (error) {
      setCheckoutState('error');
      setCheckoutError(error.message || 'Checkout could not be started.');
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
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);
    
    try {
      if (isLoginMode) {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        setShowSignInModal(false);
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
        
        // Save profile — in its own isolated try/catch so it NEVER blocks signup
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
            console.warn('[Anazk AI] Profile table note:', profileErr?.message);
          }
        }
        
        if (data?.session) {
          // If Supabase has email confirmation disabled, user is immediately logged in!
          setShowSignInModal(false);
          setAuthName('');
          setAuthEmail('');
          setAuthPassword('');
          return;
        }

        setAuthSuccess('Account created! Please check your email inbox to confirm your email, then sign in.');
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        setTimeout(() => setIsLoginMode(true), 3500);
        return;
      }
    } catch (err) {
      const msg = err?.message || '';
      const lmsg = msg.toLowerCase();
      if (msg === 'AUTH_NETWORK_ERROR' || lmsg.includes('auth_network') || lmsg.includes('fetch') || lmsg.includes('network') || lmsg.includes('resolve') || lmsg.includes('failed to fetch')) {
        setAuthError('⚠️ Cannot connect to server — please check your internet connection and try again.');
      } else if (lmsg.includes('invalid login') || lmsg.includes('invalid credentials') || lmsg.includes('invalid_credentials')) {
        setAuthError('Incorrect email or password. If you are new, click "Create Account" above.');
      } else if (lmsg.includes('already registered') || lmsg.includes('already exists') || lmsg.includes('user_already_exists')) {
        setAuthError('An account with this email already exists. Please switch to Sign In.');
      } else if (lmsg.includes('email not confirmed') || lmsg.includes('email_not_confirmed')) {
        setAuthError('Email not confirmed yet. Please check your inbox or spam folder for the confirmation email.');
      } else if (lmsg.includes('rate limit') || lmsg.includes('too many requests')) {
        setAuthError('Too many attempts. Please wait a minute before trying again.');
      } else {
        setAuthError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Custom legal & support modals
  const [showTermsModal, setShowTermsModal] = useState(() => typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('terms'));
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Top Navbar Mega Menu Dropdown States (GirGit AI Style)
  const [activeDropdown, setActiveDropdown] = useState(null); // 'assistant' | 'pricing' | 'others' | null
  const [navMobileAssistant, setNavMobileAssistant] = useState(false);
  const [navMobilePricing, setNavMobilePricing] = useState(false);
  const [navMobileOthers, setNavMobileOthers] = useState(false);

  // Corner Floating AI Support Chatbot State (Intercom / Fin Style)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState('home'); // 'home' or 'messages'
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hi there 👋 How can I help you today? Ask me about stealth mode, Windows app download, credits pricing, or 1-on-1 mentor guidance!",
      actions: [
        { label: '💳 How to buy credits?', query: 'how to buy credits' },
        { label: '📥 Download Windows App', query: 'how to download app' },
        { label: '🛡️ Is it undetectable on Zoom?', query: 'is it undetectable on zoom meet' },
        { label: '👤 1-on-1 Personal Guidance', query: 'how to book personal mentor' }
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);

  // Auto-scroll chat when messages update
  useEffect(() => {
    if (chatOpen && chatTab === 'messages') {
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [chatMessages, chatOpen, chatTab]);

  // Active Industry for Works For All Industries Section
  const [selectedIndustry, setSelectedIndustry] = useState('Tech');

  const industryProfiles = {
    Tech: {
      label: 'Tech',
      icon: '💻',
      question: "Can you explain how you would design a scalable distributed rate limiter?",
      answer: "• Algorithm: Token Bucket backed by Redis.\n• Concurrency: Atomic Redis Lua scripts with TTL to avoid race conditions.\n• Resiliency: Sliding-window local fallback caches.\n• Observability: Track rejected spikes and p99 latency."
    },
    Consulting: {
      label: 'Consulting',
      icon: '💼',
      question: "How would you assess market entry for an EV charging startup entering Southeast Asia?",
      answer: "• Market Sizing: Calculate EV adoption curves and grid readiness.\n• Unit Economics: CAPEX per DC fast charger vs utilization rate.\n• Strategic Moats: Partner with utility providers & real estate fleets.\n• Risk: Mitigate grid volatility with local battery buffer storage."
    },
    Marketing: {
      label: 'Marketing',
      icon: '📢',
      question: "What strategies would you deploy to reduce Customer Acquisition Cost (CAC) by 30%?",
      answer: "• Channels: Scale high-intent programmatic SEO and targeted creator collabs.\n• Funnel: A/B test personalized onboarding to lift trial conversion by 22%.\n• Compounding: Tiered user referral loops for viral acquisition."
    },
    Finance: {
      label: 'Finance',
      icon: '💳',
      question: "Walk me through the key drivers in a Discounted Cash Flow (DCF) valuation.",
      answer: "• Cash Flows: 5-year forecast of Unlevered Free Cash Flow (UFCF).\n• Cost of Capital: WACC derived from CAPM cost of equity + debt.\n• Terminal Value: Gordon Growth model backed by exit multiples.\n• Sensitivity: Matrix testing against WACC and long-term margin."
    },
    Sales: {
      label: 'Sales',
      icon: '🎯',
      question: "How do you handle an enterprise client objection regarding price?",
      answer: "• Isolate: Determine if budget or ROI certainty is the true friction point.\n• Anchor: Quantify cost against annual operational inefficiency.\n• Phased PoC: Milestone-gated pilot with guaranteed SLA milestones.\n• Multi-Thread: Align technical champions with the economic buyer."
    },
    Healthcare: {
      label: 'Healthcare',
      icon: '🩺',
      question: "How do you ensure data integrity and compliance in digital patient workflows?",
      answer: "• Compliance: Strict HIPAA adherence, BAA agreements, end-to-end encryption.\n• Audit: Tamper-proof immutable access logging on all EHR queries.\n• Interoperability: FHIR/HL7 API standards for cross-system clinical exchange."
    },
    Operations: {
      label: 'Operations',
      icon: '📊',
      question: "How do you diagnose and eliminate supply chain inventory bottlenecks?",
      answer: "• Value Stream: Map cycle times across supplier nodes & customs clearance.\n• Safety Stock: Dynamic reorder points adjusted for lead-time variance.\n• Root Cause: 5-Whys framework to eliminate freight handling delays."
    },
    More: {
      label: '+ More',
      icon: '➕',
      question: "Tell me about a time you led a cross-functional initiative with conflicting priorities.",
      answer: "• Situation: Engineering and Product had divergent release roadmaps.\n• Action: Built transparent OKR impact scoring and weekly alignment syncs.\n• Result: Delivered core feature 2 weeks ahead of schedule with 98% team buy-in."
    }
  };

  const scrollToSection = (id) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -75;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 40);
  };

  const handleSendChatMessage = async (rawQuery) => {
    const queryText = (typeof rawQuery === 'string' ? rawQuery : chatInput).trim();
    if (!queryText) return;

    // Switch to messages tab when user sends query
    setChatTab('messages');

    // Add user message
    const userMsgId = Date.now();
    setChatMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: queryText }
    ]);
    setChatInput('');
    setIsBotTyping(true);

    try {
      // Check if Groq API key is available for dynamic live AI answers
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (groqKey && groqKey !== 'your_groq_api_key_here') {
        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are Fin, the official AI support assistant for Anazk AI (anazk.online). You are helpful, friendly, and concise.
Knowledge Base for Anazk AI:
- Anazk AI is a real-time AI interview copilot with an undetectable invisible desktop overlay that listens to interviewers via Whisper AI and displays instant, high-scoring answers without switching windows.
- Invisibility & Stealth: Hardware-level window capture protection ensures it is 100% invisible when sharing screen on Zoom, Google Meet, Microsoft Teams, Webex, and Discord.
- Pricing & Credits: Only pay-as-you-go credits. 1-hour session is ₹259, 2-hour session is ₹500, and 10 interview sessions is ₹2,500.
- 1-on-1 Personal Mentor Guidance: ₹500 session fee covering Resume Reviews, Job Portal Optimization, and tailored strategy. Support Email: supportanazkai@gmail.com.
- Desktop App: Windows 10/11 64-bit installer (.exe) and macOS Apple Silicon/Intel (.dmg) installer available at: https://github.com/prince-up/anzak-download/releases/download/v1.0.0/
- Hotkeys: F1 (trigger/answer), F3 (switch audio input), F4 (copy solution), F8 (re-anchor).
- Contact Support: supportanazkai@gmail.com.
Format answers cleanly with short bullet points.`
              },
              { role: 'user', content: queryText }
            ],
            max_tokens: 300,
            temperature: 0.5
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const reply = aiData.choices?.[0]?.message?.content;
          if (reply) {
            setChatMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                sender: 'bot',
                text: reply
              }
            ]);
            setIsBotTyping(false);
            return;
          }
        }
      }
    } catch (e) {
      // Fallback to local intelligent assistant engine
    }

    // Instant local intelligent response fallback
    setTimeout(() => {
      const botResponse = generateBotAnswer(queryText);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botResponse.text,
          actions: botResponse.actions || []
        }
      ]);
      setIsBotTyping(false);
    }, 400);
  };

  const generateBotAnswer = (userText) => {
    const query = userText.toLowerCase().trim();

    // 0. Personal Mentor Guidance & Booking
    if (
      query.includes('mentor') || query.includes('guidance') || query.includes('book') || 
      query.includes('coaching') || query.includes('expert') || query.includes('1-on-1') || 
      query.includes('resume') || query.includes('500')
    ) {
      return {
        text: "👤 **1-on-1 Personal Guidance with Mentor (₹500):**\n\n• **Direct 1-on-1 Session:** Tailored mock interviews, resume review, and job portal strategy.\n• **Dedicated Mentor Email:** supportanazkai@gmail.com\n• **Online Booking:** Complete your booking to receive an instant Google Meet interview schedule!",
        actions: [
          { label: '👉 Book Mentor Session (₹500)', onClick: () => { setMentorStep(1); setMentorError(''); setShowMentorModal(true); setChatOpen(false); } },
          { label: '✉️ Email Support', onClick: () => { window.location.href = 'mailto:supportanazkai@gmail.com'; } }
        ]
      };
    }

    // 1. Payment & Buying Credits
    if (
      query.includes('payment') || query.includes('credit') || query.includes('buy') || 
      query.includes('price') || query.includes('pricing') || query.includes('cost') || 
      query.includes('plan') || query.includes('paisa') || query.includes('khareed') || 
      query.includes('razorpay') || query.includes('upi') || query.includes('card')
    ) {
      return {
        text: "💳 **How to Buy Credits & Make Payment:**\n\n1. Go to the **Pricing Plans** section.\n2. Choose between **Starter Credits**, **Monthly Pro**, or **Lifetime Access**.\n3. Click **Get Started / Buy Now** on your preferred plan.\n4. Sign in with your email if you haven't already.\n5. Complete payment securely via **Razorpay** (Supports UPI, Google Pay, PhonePe, Cards, Netbanking).\n6. Your **License Key & Credits** will be generated and ready immediately!",
        actions: [
          { label: '👉 Go to Pricing Plans', onClick: () => { scrollToSection('pricing'); setChatOpen(false); } },
          { label: '🔐 Sign In / Create Account', onClick: () => { setShowSignInModal(true); setChatOpen(false); } }
        ]
      };
    }

    // 2. Navigation & Where to Go
    if (
      query.includes('where') || query.includes('path') || query.includes('navigate') || 
      query.includes('kaha') || query.includes('guide') || query.includes('menu') || 
      query.includes('section') || query.includes('route') || query.includes('look')
    ) {
      return {
        text: "🧭 **Website Roadmap & Quick Links:**\n\nHere is what you'll find on this page:\n• **Top:** Live video demo & interactive interview assistant preview\n• **Features:** Compatibility with Zoom, Meet, Teams, LeetCode\n• **Stealth Mode:** Undetectability & screen share invisibility\n• **Pricing:** Purchase credits & subscription packages\n• **FAQ:** Common interview preparation questions",
        actions: [
          { label: '⚡ Features', onClick: () => { scrollToSection('features'); setChatOpen(false); } },
          { label: '🛡️ Stealth Mode', onClick: () => { scrollToSection('privacy'); setChatOpen(false); } },
          { label: '💳 Pricing', onClick: () => { scrollToSection('pricing'); setChatOpen(false); } },
          { label: '❓ FAQ', onClick: () => { scrollToSection('faq'); setChatOpen(false); } }
        ]
      };
    }

    // 3. Stealth, Privacy, Screen Share, Zoom, Meet, Teams
    if (
      query.includes('zoom') || query.includes('meet') || query.includes('team') || 
      query.includes('private') || query.includes('undetect') || query.includes('detect') || 
      query.includes('stealth') || query.includes('visible') || query.includes('hidden') || 
      query.includes('invisible') || query.includes('safe') || query.includes('share')
    ) {
      return {
        text: "🛡️ **100% Private & Undetectable:**\n\nAnazk AI runs natively at your OS level and intercepts low-level window draw calls:\n• **Screen Share Invisible:** When you share your entire screen on Zoom, Google Meet, Teams, or Discord, interviewers ONLY see your regular desktop—never the Anazk AI overlay.\n• **No Taskbar/Dock Presence:** Operates as a background system service.\n• **Tab-Switch Safe:** Bypasses browser tab-change listeners on HackerRank, LeetCode, and CoderPad.",
        actions: [
          { label: '🛡️ View Stealth Mode Details', onClick: () => { scrollToSection('privacy'); setChatOpen(false); } }
        ]
      };
    }

    // 4. Download & Installation
    if (
      query.includes('download') || query.includes('install') || query.includes('app') || 
      query.includes('mac') || query.includes('windows') || query.includes('desktop') || 
      query.includes('setup') || query.includes('exe') || query.includes('dmg')
    ) {
      return {
        text: "📥 **Anazk AI Desktop App:**\n\n• Available for **Windows 10/11 (.exe)** and **macOS (.dmg / .zip)**.\n• Lightweight and installs in under 30 seconds.\n• Uses global shortcut keys to toggle the assistant quietly during calls.",
        actions: [
          { label: '👉 Go to Pricing Plans', onClick: () => { scrollToSection('pricing'); setChatOpen(false); } }
        ]
      };
    }

    // 5. License Key & Activation
    if (
      query.includes('key') || query.includes('license') || query.includes('activate') || 
      query.includes('code') || query.includes('token')
    ) {
      return {
        text: "🔑 **License Key & Activation:**\n\n• Once your payment completes, your license key is displayed instantly on screen and linked to your email.\n• Open the Anazk AI Desktop App, go to **Settings → License Key**, paste your key, and you're ready to go!",
        actions: [
          { label: '💳 View Pricing & Get Key', onClick: () => { scrollToSection('pricing'); setChatOpen(false); } }
        ]
      };
    }

    // 6. Account & Sign In
    if (
      query.includes('login') || query.includes('sign in') || query.includes('signup') || 
      query.includes('register') || query.includes('account') || query.includes('email')
    ) {
      return {
        text: "🔐 **Account & Sign In:**\n\n• You can sign in or create an account with your email & password.\n• All your purchased credits, plans, and session histories are saved to your account.",
        actions: [
          { label: '🔐 Open Sign In Modal', onClick: () => { setShowSignInModal(true); setChatOpen(false); } }
        ]
      };
    }

    // Default response
    return {
      text: "I'm your Anazk AI website assistant! What would you like help with?",
      actions: [
        { label: '💳 How to buy credits?', query: 'how to buy credits' },
        { label: '🧭 Guide me around website', query: 'where to go on website' },
        { label: '🛡️ Stealth Mode on Zoom/Meet', query: 'is it undetectable on zoom meet' }
      ]
    };
  };


  // Interactive Sandbox state
  const [sandboxQuestion, setSandboxQuestion] = useState('');
  const [sandboxResponse, setSandboxResponse] = useState('"A discounted cash flow model values a company by projecting future free cash flows and discounting them to present value using the weighted average cost of capital."');
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const [sandboxTranscript, setSandboxTranscript] = useState('');
  
  const [sandboxPos, setSandboxPos] = useState({ x: 80, y: 130 });
  const [sandboxCollapsed, setSandboxCollapsed] = useState(false);
  const [sandboxMode, setSandboxMode] = useState('say');
  const [sandboxInputText, setSandboxInputText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDragging) return;
      const container = document.getElementById('sandbox-screen-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      
      let newX = e.clientX - rect.left - dragOffset.x;
      let newY = e.clientY - rect.top - dragOffset.y;

      const widgetWidth = sandboxCollapsed ? 200 : 460;
      const widgetHeight = sandboxCollapsed ? 48 : 280;

      newX = Math.max(0, Math.min(newX, rect.width - widgetWidth));
      newY = Math.max(0, Math.min(newY, rect.height - widgetHeight));

      setSandboxPos({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragOffset, sandboxCollapsed]);

  const triggerQuickResponse = (mode) => {
    setIsSandboxLoading(true);
    setSandboxResponse('');
    setTimeout(() => {
      let ans = "";
      if (mode === 'assist') {
        ans = '"Assist mode: Based on the system architecture, a single-primary MySQL setup is optimal if write throughput is under 10k/sec. We should add a Redis cache layer for profile reads to reduce DB CPU load by up to 60%."';
      } else if (mode === 'say') {
        ans = '"A discounted cash flow model values a company by projecting future free cash flows and discounting them to present value using the weighted average cost of capital."';
      } else if (mode === 'follow') {
        ans = '"Recommended follow-ups: 1. How does the choice of terminal value growth rate affect the total valuation sensitivity? 2. What are the key differences between WACC and cost of equity?"';
      } else if (mode === 'recap') {
        ans = '"Recap: Valuation relies on free cash flows and discount rates. Capital cost (WACC) acts as the discount factor to compute current value."';
      }
      setSandboxResponse(ans);
      setIsSandboxLoading(false);
    }, 800);
  };

  const handleSandboxActionSubmit = (e) => {
    e.preventDefault();
    if (!sandboxInputText.trim()) return;

    setIsSandboxLoading(true);
    setSandboxResponse('');
    const prompt = sandboxInputText;
    setSandboxInputText('');

    setTimeout(() => {
      let ans = "";
      const q = prompt.toLowerCase();
      if (q.includes('price') || q.includes('buy') || q.includes('cost')) {
        ans = '"Sandbox Assistant: To purchase credits, head to the Pricing section below! We offer starter credits at ₹259 with instant key delivery. All unused minutes stay valid forever."';
      } else if (q.includes('undetect') || q.includes('zoom') || q.includes('meet') || q.includes('invisible')) {
        ans = '"Sandbox Assistant: Anazk AI uses custom graphics driver hooks so that its overlay is 100% invisible on Zoom, Teams, and Google Meet screen share sessions. Only you can see it on your screen."';
      } else if (q.includes('how') || q.includes('work') || q.includes('app')) {
        ans = '"Sandbox Assistant: The app runs in the background, listening to audio via virtual input devices and capturing IDE screens. It then shows bullet point suggestions directly on your screen."';
      } else {
        ans = `"${prompt} is a great question. In a high-stakes interview, I recommend starting with a high-level summary of your engineering approach, followed by data-driven specifications and key trade-offs."`;
      }
      setSandboxResponse(ans);
      setIsSandboxLoading(false);
    }, 1000);
  };

  // Disable right-click & developer hotkeys for tight privacy
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      // Block F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (inspect elements)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
        e.preventDefault();
      }
      // Block Ctrl+U or Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
      }
      // Block Cmd+Option+I (Mac Inspect Element)
      if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Simulated code type-writer for Coding Tab
  const [simulatedCode, setSimulatedCode] = useState('');
  const [simulatedSolution, setSimulatedSolution] = useState('');
  
  const codingProblem = {
    question: "Write a function to check if a binary tree is a valid Binary Search Tree (BST).",
    code: `class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
}`,
    solution: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode(int x) { val = x; }
 * }
 */
class Solution {
    public boolean isValidBST(TreeNode root) {
        return validate(root, null, null);
    }
    
    private boolean validate(TreeNode node, Integer low, Integer high) {
        if (node == null) return true;
        
        if ((low != null && node.val <= low) || 
            (high != null && node.val >= high)) {
            return false;
        }
        
        return validate(node.left, low, node.val) && 
               validate(node.right, node.val, high);
    }
}`
  };

  const nonCodingProblem = {
    question: "Tell me about a time you handled a difficult stakeholder who disagreed with your technical path.",
    transcript: "Candidate: In my previous role, we had a major stakeholder who wanted to use a relational database for a highly unstructured, high-throughput analytics project. I believed a document-based NoSQL store was better suited. He was skeptical...",
    solution: `• **Acknowledge & Empathize**: Start by validating their concerns (e.g., security, familiarity with SQL, existing infrastructure limits).
• **Data-Driven Proof**: Present a quick, objective POC (Proof of Concept) highlighting latency differences, scaling costs, and schema flexibility.
• **Collaborative Bridge**: Propose a hybrid approach if possible, or offer a 3-month review checkpoint to mitigate risk and reassure the stakeholder.
• **Outcome focused**: Focus on developer velocity and database cost savings (e.g. 40% cost reduction).`
  };

  // Simulate typing for coding tab
  useEffect(() => {
    if (activeTab === 'coding') {
      setSimulatedCode('');
      setSimulatedSolution('');
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < codingProblem.code.length) {
          setSimulatedCode(prev => prev + codingProblem.code[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 10);
      
      let solIndex = 0;
      const solInterval = setInterval(() => {
        if (solIndex < codingProblem.solution.length) {
          setSimulatedSolution(prev => prev + codingProblem.solution.slice(solIndex, solIndex + 4));
          solIndex += 4;
        } else {
          clearInterval(solInterval);
        }
      }, 15);

      return () => {
        clearInterval(interval);
        clearInterval(solInterval);
      };
    } else {
      setSimulatedCode('');
      setSimulatedSolution('');
    }
  }, [activeTab]);

  const handleSandboxSubmit = (e) => {
    e.preventDefault();
    if (!sandboxQuestion.trim()) return;

    setIsSandboxLoading(true);
    setSandboxResponse('');
    setSandboxTranscript('Transcribing mic input...');

    setTimeout(() => {
      setSandboxTranscript(`Voice captured: "${sandboxQuestion}"`);
      
      let answer = "";
      const q = sandboxQuestion.toLowerCase();
      if (q.includes('react') || q.includes('hook')) {
        answer = "### React Hooks Overview\n\nReact Hooks let you use state and other React features without writing a class.\n\n* **useState**: Declares a state variable. `const [state, setState] = useState(initial);`\n* **useEffect**: Performs side effects (data fetching, DOM updates). Triggers on dependency changes.\n* **useContext**: Consumes context value without nesting.\n* **useRef**: Keeps a mutable ref value that doesn't trigger re-renders.";
      } else if (q.includes('database') || q.includes('sql')) {
        answer = "### SQL vs NoSQL Database Choices\n\n* **SQL (Relational)**: Structured schemas, ACID compliance, complex queries (joins). Best for transactional apps (Fintech, ERP).\n* **NoSQL (Document/Key-Value)**: Dynamic schemas, horizontal scaling, high throughput. Best for catalogs, real-time analytics, user profiles.";
      } else {
        answer = "### Interview Tip: Behavioral Answer (STAR Method)\n\n1. **Situation**: Set the scene. Explain the context in 2-3 sentences.\n2. **Task**: Describe the challenge or responsibility you had.\n3. **Action**: What steps did *you* specifically take to address it?\n4. **Result**: The positive outcome. Quantify it where possible (e.g., 'reduced load time by 30%').";
      }

      let ansIndex = 0;
      const ansInterval = setInterval(() => {
        if (ansIndex < answer.length) {
          setSandboxResponse(prev => prev + answer[ansIndex]);
          ansIndex += 2;
        } else {
          clearInterval(ansInterval);
          setIsSandboxLoading(false);
        }
      }, 10);
    }, 1500);
  };

  const faqs = [
    {
      q: "Is Anazk AI really undetectable on screen sharing platforms?",
      a: "Yes. Anazk AI uses low-level system APIs to protect its window graphics. When you share your screen via Zoom, Microsoft Teams, Google Meet, or Slack, the overlay window is completely invisible to the audience, while remaining perfectly visible to you."
    },
    {
      q: "Does it capture code from my IDE or browser?",
      a: "Absolutely. With our screen-capture engine, you can capture full-screen or custom regions. If a coding question is present on your screen, Anazk AI extracts it instantly and generates optimized code solutions."
    },
    {
      q: "How does the real-time speech transcription work?",
      a: "Anazk AI records system audio or microphone input in the background. It transcribes audio immediately using Whisper models, and feeds the context to your assistant model (Groq) for near-instant answers."
    },
    {
      q: "Can I use my own custom AI models or API Keys?",
      a: "Yes. You can supply your own Groq API Key and write custom system instructions or upload your resume in the preferences menu to personalize your answers."
    }
  ];

  if (currentView === 'auth') {
    return (
      <AuthPage 
        onBackToHome={() => setCurrentView('landing')} 
        onSuccess={(usr) => {
          setUser(usr);
          setCurrentView('landing');
        }} 
      />
    );
  }

  return (
  <div className={`font-sans min-h-screen relative overflow-x-hidden antialiased text-left transition-colors duration-700 ${activeTab === 'coding' ? 'bg-[#030712] text-gray-100 dark-theme-active' : 'bg-[#f0f8ff] text-[#1e293b]'}`}>
  {paymentStatus === 'success' && (
    <div className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-5 text-left shadow-2xl">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={22} />
        <div>
          <h2 className="font-bold text-gray-900">Subscription complete</h2>
          <p className="mt-1 text-sm text-gray-600">Your Anazk AI plan is active. Download the Windows app to get started.</p>
          <button onClick={() => setShowDownloadModal(true)} className="mt-3 rounded-full bg-gray-900 px-5 py-2 text-sm font-bold text-white">Download Windows app</button>
        </div>
      </div>
    </div>
  )}
  {paymentStatus === 'cancelled' && (
    <div className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-5 text-sm text-gray-700 shadow-2xl">Checkout was cancelled. You can choose a plan whenever you are ready.</div>
  )}
  {checkoutState === 'error' && (
    <div className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700 shadow-2xl flex justify-between items-center">
      {checkoutError}
      <button onClick={() => setCheckoutError('')}><X size={16}/></button>
    </div>
  )}
  {generatedKey && (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <Check size={32} />
        </div>
        <h2 className="text-2xl font-black text-[#0d2e27] mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-6 text-sm">Here is your License Key. Copy this and paste it into the Anazk AI Desktop App to start your session.</p>
        
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between mb-8">
          <code className="text-emerald-700 font-mono font-bold text-lg select-all">{generatedKey}</code>
          <button 
            onClick={() => navigator.clipboard.writeText(generatedKey)}
            className="text-gray-400 hover:text-emerald-600 transition-colors p-2"
            title="Copy Key"
          >
            <Copy size={20} />
          </button>
        </div>
        
        <button 
          onClick={() => setGeneratedKey('')}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
        >
          I have copied my key
        </button>
      </div>
    </div>
  )}
  
  {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-200/25 via-blue-100/15 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] left-[-100px] w-[500px] h-[500px] bg-gradient-to-tr from-cyan-150/20 to-transparent rounded-full blur-[80px] pointer-events-none"></div>

      {/* ─── TOP NAVBAR (EXACT GETSCREEN.ME 2-TIER DESIGN) ─── */}
      <header className="fixed top-0 inset-x-0 z-50 shadow-xs">
        
        {/* ── TOP SUBHEADER BAR (dark navy, exact like getscreen.me) ── */}
        <div className="bg-[#1f3463] text-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-8 flex items-center justify-between">
            {/* Left: Downloads & Share Screen */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowDownloadModal(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-gray-200 hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
              >
                <Download size={12} />
                <span>DOWNLOADS</span>
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="flex items-center gap-1.5 text-[11px] font-bold text-gray-200 hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
              >
                <Monitor size={12} />
                <span>SCREEN CONTROL</span>
              </button>
            </div>
            {/* Right: Sign In / Sign Up / User + Flag */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-200">
                    <User size={12} />
                    <span className="max-w-[140px] truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
                    className="text-[11px] font-bold text-gray-200 hover:text-white cursor-pointer transition-colors uppercase tracking-wider"
                  >
                    SIGN OUT
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentView('auth')}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-200 hover:text-white cursor-pointer transition-colors uppercase tracking-wider"
                  >
                    <ArrowRight size={11} />
                    SIGN IN
                  </button>
                  <span className="text-gray-500 text-xs">|</span>
                  <button
                    onClick={() => setCurrentView('auth')}
                    className="text-[11px] font-bold text-gray-200 hover:text-white cursor-pointer transition-colors uppercase tracking-wider"
                  >
                    SIGN UP
                  </button>
                </>
              )}
              {/* Country indicator */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-300 pl-2 border-l border-white/20">
                <span className="text-sm">🇮🇳</span>
                <ChevronDown size={11} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN HEADER BAR (white, logo + nav + CTA) ── */}
        <div className="bg-white border-b border-gray-200/80">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-[66px] flex items-center justify-between">

            {/* Left: Brand Logo */}
            <div
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#448AFF] to-[#59C141] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <img src="/penguin.jpg" alt="Anazk AI" className="w-7 h-7 rounded-lg object-cover" />
              </div>
              <span className="font-display font-black text-[21px] tracking-tight text-[#1f3463]">
                Anazk<span className="getscreen-gradient-text ml-0.5">AI</span>
              </span>
            </div>

            {/* Center: Getscreen-style nav links with chevrons */}
            <nav className="hidden lg:flex items-center gap-2 text-[14px] font-semibold text-[#333]">
              <button
                onClick={() => scrollToSection('pricing')}
                className="flex items-center gap-1 px-3 py-2 hover:text-[#0076FF] transition-colors cursor-pointer rounded-md hover:bg-blue-50"
              >
                Pricing <ChevronDown size={13} className="text-gray-400" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="flex items-center gap-1 px-3 py-2 hover:text-[#0076FF] transition-colors cursor-pointer rounded-md hover:bg-blue-50"
              >
                Features <ChevronDown size={13} className="text-gray-400" />
              </button>
              <button
                onClick={() => scrollToSection('solutions')}
                className="flex items-center gap-1 px-3 py-2 hover:text-[#0076FF] transition-colors cursor-pointer rounded-md hover:bg-blue-50"
              >
                Solutions <ChevronDown size={13} className="text-gray-400" />
              </button>
              <button
                onClick={() => scrollToSection('reviews')}
                className="flex items-center gap-1 px-3 py-2 hover:text-[#0076FF] transition-colors cursor-pointer rounded-md hover:bg-blue-50"
              >
                Reviews <ChevronDown size={13} className="text-gray-400" />
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="flex items-center gap-1 px-3 py-2 hover:text-[#0076FF] transition-colors cursor-pointer rounded-md hover:bg-blue-50"
              >
                FAQ
              </button>
            </nav>

            {/* Right: Getscreen "Get Started with a Tour" style button */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => scrollToSection('features')}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-[13px] font-semibold text-[#333] transition-all cursor-pointer shadow-xs"
              >
                <Sparkles size={14} className="text-[#59C141]" />
                GET STARTED WITH A TOUR
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => scrollToSection('pricing')}
                className="button--green px-3 py-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer"
              >
                ₹349
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-[105px] bg-white border border-gray-200 rounded-2xl p-5 shadow-2xl z-50 lg:hidden flex flex-col space-y-3 animate-in fade-in slide-in-from-top-5 duration-200 max-h-[80vh] overflow-y-auto text-left text-sm font-bold text-gray-800">
          <button onClick={() => { setMobileMenuOpen(false); scrollToSection('features'); }} className="py-2 border-b border-gray-100 text-left w-full">Features</button>
          <button onClick={() => { setMobileMenuOpen(false); scrollToSection('solutions'); }} className="py-2 border-b border-gray-100 text-left w-full">Solutions</button>
          <button onClick={() => { setMobileMenuOpen(false); scrollToSection('pricing'); }} className="py-2 border-b border-gray-100 text-left w-full">Pricing & Plans</button>
          <button onClick={() => { setMobileMenuOpen(false); scrollToSection('reviews'); }} className="py-2 border-b border-gray-100 text-left w-full">Reviews & Testimonials</button>
          <button onClick={() => { setMobileMenuOpen(false); scrollToSection('faq'); }} className="py-2 border-b border-gray-100 text-left w-full">FAQ</button>
          
          <div className="pt-2 flex flex-col space-y-2">
            <button 
              onClick={() => { setMobileMenuOpen(false); setShowDownloadModal(true); }}
              className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              <span>Download Desktop App</span>
            </button>
            {user ? (
              <button 
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await supabase.auth.signOut();
                  setUser(null);
                }}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs"
              >
                Sign out ({user.email})
              </button>
            ) : (
              <button 
                onClick={() => { setMobileMenuOpen(false); setCurrentView('auth'); }}
                className="w-full py-2.5 bg-[#2c323f] text-white rounded-xl font-bold text-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── HERO SECTION (EXACT GETSCREEN.ME OVERVIEW STYLE) ─── */}
      <section id="top" className="getscreen-hero pt-[140px] sm:pt-[160px] lg:pt-[175px] pb-16 sm:pb-24 px-4 sm:px-8 lg:px-12 w-full border-b border-slate-200/70">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Hero Left Content (overview__page--left) */}
          <div className="lg:col-span-6 space-y-7 text-left">
            
            {/* OS Compatibility Row (.overview__os - Exact Getscreen icons only, no bulky text) */}
            <div className="flex items-center gap-4 sm:gap-5 mb-2">
              {/* Windows 4-Color Logo */}
              <div title="Windows" className="w-7 h-7 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                  <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                </svg>
              </div>

              {/* Apple macOS Logo */}
              <div title="macOS" className="w-7 h-7 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <svg className="w-6 h-6 fill-current text-[#222222]" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.77-8.1-12.24-15.06-6.19-9.59-11-20.73-14.42-33.42-3.42-12.68-5.14-24.89-5.14-36.63 0-14.53 3.63-26.68 10.9-36.46 7.27-9.78 16.5-14.74 27.69-14.88 4.92 0 10.36 1.34 16.34 4.01 5.98 2.67 9.87 4.07 11.66 4.2 1.45 0 5.48-1.51 12.09-4.52 6.61-3.01 12.44-4.33 17.5-3.95 13.52.89 23.95 6.09 31.3 15.61-12.07 7.37-17.98 17.51-17.73 30.43.25 10.04 4.09 18.57 11.53 25.6 7.44 7.03 16.33 10.94 26.68 11.73-2.12 6.47-4.69 13.06-7.7 19.78zM119.22 33.15c0-7.37 2.65-14.19 7.95-20.46 5.3-6.27 11.83-10.27 19.59-12 1.01 7.26-.84 14.18-5.55 20.76-4.71 6.58-11.08 10.63-19.11 12.16-.9-2.02-1.35-4.04-1.35-6.06z" />
                </svg>
              </div>

              {/* Linux Penguin Logo */}
              <div title="Linux" className="w-7 h-7 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C9.5 2 8 4 8 6.5V9C6.5 10 5.5 11.5 5.5 13.5C5.5 15.5 6.5 17 8 18V20C8 21.5 9 22 10.5 22H13.5C15 22 16 21.5 16 20V18C17.5 17 18.5 15.5 18.5 13.5C18.5 11.5 17.5 10 16 9V6.5C16 4 14.5 2 12 2Z" fill="#222" />
                  <ellipse cx="12" cy="14" rx="4" ry="5.5" fill="#FFF" />
                  <ellipse cx="10.5" cy="6.5" rx="1" ry="1.5" fill="#FFF" />
                  <ellipse cx="13.5" cy="6.5" rx="1" ry="1.5" fill="#FFF" />
                  <circle cx="10.5" cy="6.5" r="0.6" fill="#000" />
                  <circle cx="13.5" cy="6.5" r="0.6" fill="#000" />
                  <path d="M11 8C11 8 11.5 9 12 9C12.5 9 13 8 13 8L12 9.8L11 8Z" fill="#FFA500" stroke="#FFA500" strokeWidth="0.8" />
                  <path d="M7 21C6 21 5 21.8 6 22.5C7 23 9 22.5 9 21.5L7 21Z" fill="#FFA500" />
                  <path d="M17 21C18 21 19 21.8 18 22.5C17 23 15 22.5 15 21.5L17 21Z" fill="#FFA500" />
                </svg>
              </div>

              {/* Android Robot Logo */}
              <div title="Android" className="w-7 h-7 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#3DDC84">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85 1.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 4.26 6 6.01 6 8h12c0-1.99-.97-3.75-2.47-4.84zM10 5.5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zm4 0c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75z"/>
                </svg>
              </div>

              {/* WebRTC Badge */}
              <div title="WebRTC-powered Connections" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-250 shadow-xs ml-3 sm:ml-5 cursor-pointer hover:border-gray-400 transition-colors">
                <span className="w-2 h-2 rounded-full bg-[#00A3FF] animate-pulse"></span>
                <span className="text-[12px] font-bold text-[#333333] tracking-wide font-sans">
                  Web<span className="text-[#00A3FF]">RTC</span>
                </span>
              </div>
            </div>

            {/* Headline (.overview__title) */}
            <h1 className="font-bold text-[34px] sm:text-[46px] lg:text-[52px] leading-[1.12] text-[#333333] tracking-tight">
              Access Anywhere: Instant <b className="getscreen-gradient-text">Browser-Based & Desktop</b> AI Interview Copilot
            </h1>

            {/* Description (.overview__description) */}
            <p className="text-base sm:text-[17px] text-[#666666] leading-relaxed font-normal max-w-xl">
              A powerful cross-platform solution for real-time interview assistance and invisible desktop coding copilot. Connect directly from your browser or desktop application. 100% undetected on Zoom, Google Meet, Teams, and HackerRank screen sharing. Ideal for live coding, system design, and behavioral questions.
            </p>

            {/* Dual CTA Buttons (.cta) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="button--green px-8 py-4 text-sm font-black tracking-wider uppercase cursor-pointer"
                >
                  START FREE TRIAL / ₹349
                </button>
                <button 
                  onClick={() => setShowDownloadModal(true)}
                  className="button--primary px-8 py-4 text-sm font-black tracking-wider uppercase cursor-pointer"
                >
                  DOWNLOAD NOW
                </button>
              </div>

              {/* Note underneath (.cta__note) */}
              <div className="text-xs text-[#666666] pt-1">
                Not sure where to start?{' '}
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-[#0076FF] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Get Started with a Tour ➔
                </button>
              </div>
            </div>

            {/* 3-Item Benefits Row (.benefits) */}
            <div className="pt-6 border-t border-slate-300/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                  <Star size={18} className="fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <button onClick={() => scrollToSection('reviews')} className="font-bold text-sm text-[#333333] hover:underline block text-left">Top Rated</button>
                  <p className="text-[11px] text-[#666666] leading-snug">The Reviews Speak for Themselves (4.9/5)</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                  <Tag size={18} />
                </div>
                <div>
                  <button onClick={() => scrollToSection('pricing')} className="font-bold text-sm text-[#333333] hover:underline block text-left">Cost-Effective</button>
                  <p className="text-[11px] text-[#666666] leading-snug">Lifetime Access at ₹349 (Zero Monthly Fees)</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <button onClick={() => scrollToSection('privacy')} className="font-bold text-sm text-[#333333] hover:underline block text-left">100% Secure</button>
                  <p className="text-[11px] text-[#666666] leading-snug">Hardware-level window masking invisible to screen share</p>
                </div>
              </div>
            </div>

          </div>

          {/* Hero Right - Interactive Mockup Window (overview__page--right) */}
          <div className="lg:col-span-6 flex flex-col items-center relative select-none w-full">
            
            {/* Window Tabs (Floating above mockup container) */}
            <div className="flex justify-center border border-gray-200 bg-white p-1 rounded-full shadow-md relative z-20 -mb-4">
              <button 
                onClick={() => setActiveTab('non-coding')}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${activeTab === 'non-coding' ? 'bg-[#2c323f] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Interactive Video Walkthrough
              </button>
              <button 
                onClick={() => setActiveTab('coding')}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${activeTab === 'coding' ? 'bg-[#2c323f] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Live Code Copilot
              </button>
            </div>

            {/* Window Mockup Outer Container */}
            <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-1.5 border border-gray-200 shadow-2xl relative pt-9">
              {/* Window Dots (macOS style) */}
              <div className="absolute top-4 left-6 flex space-x-1.5">
                <span className="w-3 h-3 bg-[#ff5f56] rounded-full inline-block"></span>
                <span className="w-3 h-3 bg-[#ffbd2e] rounded-full inline-block"></span>
                <span className="w-3 h-3 bg-[#27c93f] rounded-full inline-block"></span>
              </div>

              {/* Window Content Area */}
              <div className="p-4 sm:p-5 bg-[#f8fafc] rounded-b-2xl sm:rounded-b-3xl min-h-fit text-left relative overflow-hidden">
                {activeTab === 'non-coding' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch font-sans">
                    
                    {/* Left Column: Clean Video Player */}
                    <div className="lg:col-span-7 bg-black rounded-xl border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden relative min-h-[240px] sm:min-h-[340px]">
                      <video
                        src="/hero-video.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        className="w-full h-full object-cover rounded-xl bg-black"
                        poster="/anazk-hero-generated.png"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const iframe = document.getElementById('hero-drive-fallback');
                          if (iframe) iframe.style.display = 'block';
                        }}
                      />
                      <iframe
                        id="hero-drive-fallback"
                        src="https://drive.google.com/file/d/1fvHpPIP-H_7GXzHmohvPXTAcfzkBugUX/preview"
                        className="w-full h-full min-h-[240px] border-0 hidden"
                        allow="autoplay"
                        allowFullScreen
                        title="Anazk AI Live Demo"
                      ></iframe>
                    </div>

                    {/* Right Column: Real-time AI Assistant Response Panel */}
                    <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between space-y-3 text-left min-h-[280px] sm:min-h-[340px]">
                      <div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-150">
                          <span className="text-[11px] text-[#2c323f] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={14} className="text-emerald-600" />
                            Live Assistant
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Undetected
                          </span>
                        </div>
                        
                        <div className="space-y-2 pt-2.5">
                          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5">
                            <span className="block text-emerald-800 font-bold text-[10px] uppercase mb-0.5">💡 Detected Question</span>
                            <p className="font-extrabold text-[#2c323f] text-[11px]">How do you prevent cache stampede in high-throughput systems?</p>
                          </div>

                          <div className="space-y-1 pl-1 text-[11px] text-gray-700">
                            <p className="text-emerald-700 font-extrabold text-[10px]">⭐ Talking Points:</p>
                            <ul className="space-y-1 pl-3 text-gray-650 list-disc text-[10px]">
                              <li><strong>Mutex Lock (Single Flight):</strong> Only one thread rebuilds cache.</li>
                              <li><strong>Probabilistic Early Expiration:</strong> Refresh before TTL expires.</li>
                              <li><strong>Background Worker Rebuild:</strong> Pre-warm active cache keys.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 p-2 rounded-lg text-[10px] font-medium">
                        🎯 <strong>Hardware Masking:</strong> Floating overlay invisible to Zoom/Meet screen share.
                      </div>

                      <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-semibold">Latency: &lt; 420ms</span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                          <CheckCircle2 size={12} /> Listening
                        </span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch font-sans">
                    <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex flex-col justify-between space-y-3">
                      <div className="border-b border-gray-150 pb-2">
                        <span className="block text-[10px] text-teal-700 font-black uppercase tracking-wider mb-1">🖥️ Live Captured Task</span>
                        <p className="text-[#2c323f] font-mono text-[10px] font-bold leading-relaxed">{codingProblem.question}</p>
                      </div>
                      <pre className="bg-gray-50 border border-gray-150 p-2.5 rounded-lg font-mono leading-relaxed text-[9px] overflow-x-auto max-h-[160px] no-scrollbar text-slate-800">{simulatedCode || '// loading code context...'}</pre>
                    </div>

                    <div className="bg-[#f1f5f9] rounded-xl border border-gray-200 p-3.5 shadow-xs flex flex-col justify-between space-y-3">
                      <div className="border-b border-gray-200 pb-2">
                        <span className="block text-[10px] text-emerald-600 font-black uppercase tracking-wider">🤖 AI Solution (Java / O(N))</span>
                      </div>
                      <pre className="font-mono text-[9px] leading-relaxed overflow-x-auto max-h-[140px] no-scrollbar whitespace-pre text-[#1e293b]">{simulatedSolution || '// analyzing...'}</pre>
                      <div className="pt-2 border-t border-gray-200 flex justify-end">
                        <button onClick={() => {}} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg transition-all shadow-xs cursor-pointer">
                          Copy Solution
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SOLUTIONS SECTION (EXACT GETSCREEN.ME SOLUTIONS STYLE) ─── */}
      <section id="solutions" className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto text-left">
        <div className="max-w-3xl mb-12">
          <h2 className="font-bold text-3xl sm:text-4xl text-[#333333] tracking-tight">
            All-in-One AI Interview Platform for Success
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-3 leading-relaxed">
            Our comprehensive suite of tools—from permanent stealth desktop overlay and one-time browser audio capture to live code solving, system design diagrams, and resume-tailored answers—delivers the agility your career needs.
          </p>
        </div>

        {/* Getscreen Solutions Grid (.solutions__items) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Permanent Stealth Desktop Access */}
          <div className="getscreen-card p-8 sm:p-10 flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-[#0076FF]">
                Native App Mode
              </span>
              <h3 className="font-bold text-2xl text-[#333333]">
                Permanent Stealth Desktop Access
              </h3>
              <p className="text-sm font-semibold text-[#0076FF]">
                Hardware-Masked Invisible Overlay for High-Stakes Technical Rounds
              </p>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                Manage and ace any live interview without supervision anxiety. Our native desktop app uses OS-level window capture exclusion (WDA_EXCLUDEFROMCAPTURE), making the overlay 100% invisible to Zoom, Google Meet, Microsoft Teams, and HackerRank screen recordings.
              </p>
            </div>

            <div className="pt-8 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="button--green px-6 py-3 text-xs font-bold tracking-wider uppercase cursor-pointer"
                >
                  TRY NOW (₹349)
                </button>
                <button 
                  onClick={() => setShowDownloadModal(true)}
                  className="text-xs font-bold text-[#0076FF] hover:underline cursor-pointer"
                >
                  Download App ➔
                </button>
              </div>

              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-gray-500 border-t border-slate-200/80">
                <button onClick={() => scrollToSection('privacy')} className="hover:text-[#0076FF] cursor-pointer">Features of Permanent Stealth</button>
                <span>•</span>
                <button onClick={() => scrollToSection('features')} className="hover:text-[#0076FF] cursor-pointer">Features Overview</button>
              </div>
            </div>
          </div>

          {/* Card 2: One-time Remote Connections */}
          <div className="getscreen-card p-8 sm:p-10 flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                WebRTC Browser Mode
              </span>
              <h3 className="font-bold text-2xl text-[#333333]">
                One-Time Instant Browser Connection
              </h3>
              <p className="text-sm font-semibold text-emerald-700">
                Zero-Install WebRTC Audio Capture Directly from Your Browser
              </p>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                Need immediate help with zero software installation? Connect instantly with our WebRTC browser copilot. It streams interviewer audio with AI noise cancellation and generates optimal answers and code in real-time.
              </p>
            </div>

            <div className="pt-8 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="button--green px-6 py-3 text-xs font-bold tracking-wider uppercase cursor-pointer"
                >
                  TRY NOW (₹349)
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Explore Pricing ➔
                </button>
              </div>

              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-gray-500 border-t border-slate-200/80">
                <button onClick={() => scrollToSection('features')} className="hover:text-emerald-700 cursor-pointer">Features of Browser Copilot</button>
                <span>•</span>
                <button onClick={() => scrollToSection('faq')} className="hover:text-emerald-700 cursor-pointer">Audio Capture Guide</button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── FEATURES TABS SECTION (EXACT GETSCREEN.ME FEATURES TABS STYLE) ─── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto text-left">
        
        {/* Getscreen Tab Bar (.features__tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-gray-200 mb-8">
          {[
            { id: 0, label: "Screen Control & Stealth" },
            { id: 1, label: "Live Code Solver" },
            { id: 2, label: "System Design Architect" },
            { id: 3, label: "Behavioral & STAR" },
            { id: 4, label: "Audio WebRTC Engine" },
            { id: 5, label: "Screen Sharing Vision Copilot" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFeaturesActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                featuresActiveTab === tab.id
                  ? 'bg-white text-[#0076FF] border border-blue-200 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feature Detail Card (.features__card) */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Info Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0076FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {featuresActiveTab === 0 && "Hardware-Level Stealth"}
                {featuresActiveTab === 1 && "Algorithms & Data Structures"}
                {featuresActiveTab === 2 && "System Architecture"}
                {featuresActiveTab === 3 && "Leadership & STAR"}
                {featuresActiveTab === 4 && "Voice Recognition"}
                {featuresActiveTab === 5 && "Next-Gen Vision Copilot"}
              </span>

              <h3 className="font-bold text-2xl sm:text-3xl text-[#333333] mt-3 tracking-tight">
                {featuresActiveTab === 0 && "Manage Screens Privately with Hardware Window Masking"}
                {featuresActiveTab === 1 && "Instant Algorithmic Intelligence for LeetCode & HackerRank"}
                {featuresActiveTab === 2 && "High-Level & Low-Level Architectural Guidance"}
                {featuresActiveTab === 3 && "Confident Answers for HR & Leadership Principles"}
                {featuresActiveTab === 4 && "Zero-Latency Real-Time Voice Recognition (Whisper Large)"}
                {featuresActiveTab === 5 && "Autonomous Screen Understanding & Vision Analysis"}
              </h3>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-2 font-normal">
                {featuresActiveTab === 0 && "No complex installations or suspicious eye darting. Take control of your interview answers in real-time while remaining 100% undetected on Zoom, Google Meet, Teams, and Webex screen shares."}
                {featuresActiveTab === 1 && "Whether it is dynamic programming, binary trees, graphs, or SQL queries, Anazk AI reads the problem description, formulates optimal approaches, and writes clean, production-ready code with step-by-step reasoning."}
                {featuresActiveTab === 2 && "Ace complex System Design interviews with confidence. Anazk AI provides instant talking points for trade-offs, database selection, caching layers, load balancing, and failure scenarios."}
                {featuresActiveTab === 3 && "Never stumble on 'Tell me about a time you had a conflict' or Amazon Leadership Principles. Anazk AI listens to the question and structures your answer into a concise STAR format in seconds."}
                {featuresActiveTab === 4 && "Powered by Whisper large-v3 models optimized for conversational audio. Captures interviewer audio directly from system sound without any echo or background noise interference."}
                {featuresActiveTab === 5 && "When you share your screen with the interviewer on Zoom or Teams, Anazk AI autonomously watches and understands your code editor and failing test cases in real-time — without needing manual screenshots or key triggers."}
              </p>
            </div>

            {/* Checklist Options */}
            <div className="space-y-2.5 text-xs sm:text-sm font-semibold text-gray-700">
              {featuresActiveTab === 0 && [
                "OS-level window masking (WDA_EXCLUDEFROMCAPTURE)",
                "Invisible to full-screen screen shares & recordings",
                "Customizable hotkeys to toggle and relocate instantly",
                "Low CPU & RAM footprint (< 45MB memory usage)",
                "Works seamlessly across Windows 10/11 and macOS"
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{opt}</span>
                </div>
              ))}

              {featuresActiveTab === 1 && [
                "Supports Python, Java, C++, JavaScript, TypeScript, Go",
                "Calculates Time & Space complexity breakdowns",
                "Handles tricky edge cases and constraint analysis",
                "One-click copy to clipboard with stealth formatting",
                "Simulates native developer typing speed with auto-typer"
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{opt}</span>
                </div>
              ))}

              {featuresActiveTab === 2 && [
                "Structured talking points (Requirements, Scale, API, Data model)",
                "Database trade-offs (SQL vs NoSQL vs NewSQL)",
                "Scalability & caching strategies (Redis, CDN, Kafka)",
                "Fault tolerance, replication, and CAP theorem nuances",
                "Concise, natural conversational phrasing"
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{opt}</span>
                </div>
              ))}

              {featuresActiveTab === 3 && [
                "Instant STAR framework breakdown (Situation, Task, Action, Result)",
                "Tailored to your real background & target company values",
                "Natural conversational cadence without robotic phrasing",
                "Follow-up question anticipation and quick prep",
                "Conflict resolution and leadership talking points"
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{opt}</span>
                </div>
              ))}

              {featuresActiveTab === 4 && [
                "Sub-500ms real-time audio-to-text transcription",
                "Accurate recognition for Indian, US, UK, and European accents",
                "Captures speaker audio directly from internal loopback",
                "Automatic question detection and filtering of chit-chat",
                "Zero browser extensions or intrusive virtual drivers required"
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{opt}</span>
                </div>
              ))}

              {featuresActiveTab === 5 && [
                "Zero-click autonomous problem detection",
                "Real-time debugging & test case hints",
                "Multi-screen and virtual display compatibility",
                "Recognizes IDE error logs and compiler diagnostics",
                "Included with Lifetime Access"
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{opt}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button 
                onClick={() => scrollToSection('pricing')}
                className="button--green px-7 py-3.5 text-xs font-bold tracking-wider uppercase cursor-pointer"
              >
                START FREE TRIAL / ₹349
              </button>
              <button 
                onClick={() => setShowDownloadModal(true)}
                className="button--primary px-7 py-3.5 text-xs font-bold tracking-wider uppercase cursor-pointer"
              >
                DOWNLOAD NOW
              </button>
            </div>
          </div>

          {/* Right Visual Preview Column */}
          <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 text-white font-mono text-xs shadow-inner border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ANAZK AI ACTIVE
              </span>
              <span>Latency: 380ms</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-emerald-400 font-bold block text-[10px] mb-1">
                  {featuresActiveTab === 0 && "STEALTH ENGINE STATUS"}
                  {featuresActiveTab === 1 && "OPTIMAL CODE GENERATION"}
                  {featuresActiveTab === 2 && "SYSTEM DESIGN ARCHITECTURE"}
                  {featuresActiveTab === 3 && "BEHAVIORAL (STAR) MODEL"}
                  {featuresActiveTab === 4 && "AUDIO STREAM TRANSCRIPTION"}
                  {featuresActiveTab === 5 && "VISION COPILOT STREAM"}
                </span>
                <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                  {featuresActiveTab === 0 && "Hardware frame exclusion enabled. Full-screen screen sharing active on Zoom. Overlay masked completely from capture buffer."}
                  {featuresActiveTab === 1 && "Dynamic programming memoization: Time Complexity O(N), Space Complexity O(N). Passing all 48/48 test cases."}
                  {featuresActiveTab === 2 && "Recommended distributed cache: Redis Cluster with Consistent Hashing & Write-Through caching for 99.99% read SLA."}
                  {featuresActiveTab === 3 && "Situation: Led database migration under tight deadline. Action: Implemented dual-write pattern. Result: Zero downtime."}
                  {featuresActiveTab === 4 && "Interviewer voice: 'Could you explain how indexes affect write performance in PostgreSQL?'"}
                  {featuresActiveTab === 5 && "Screen Vision: Reading IDE buffer. Identified off-by-one error on line 42."}
                </p>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-[10px] font-sans flex items-center justify-between">
                <span>✓ Invisible on Screen Share</span>
                <span className="font-bold">Hotkeys: Cmd/Win+Shift+A</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── PRIVACY STEALTH & UNDETECTABILITY SECTION ─── */}
      <section id="privacy" className="py-24 sm:py-32 bg-white px-4 sm:px-8 relative overflow-hidden border-t border-gray-200">
        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Heading, Stealth Narrative & Hardware Specs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0076FF] font-mono text-xs uppercase tracking-widest">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#59C141] opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#59C141]"></span>
                </span>
                <ShieldCheck size={14} className="text-[#0076FF]" />
                <span>Stealth Mode Architecture</span>
              </div>

              <h2 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.12] text-[#333333]">
                100% Private and{' '}
                <span className="getscreen-gradient-text">Undetectable</span>
              </h2>

              <p className="text-gray-500 text-base sm:text-lg leading-relaxed font-normal max-w-2xl">
                Anazk AI runs natively at your operating system&apos;s hardware compositor layer, intercepting low-level window draw calls. This guarantees that the assistant overlay is mathematically excluded from all screen recorders, proctoring browsers, and screen-sharing pipelines.
              </p>

              {/* Technical Architecture Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                <div className="p-3.5 rounded-2xl bg-[#EDF2FA] border border-blue-100 hover:border-[#448AFF]/40 transition-colors">
                  <div className="text-xs text-[#0076FF] font-mono font-bold flex items-center gap-1.5">
                    <Zap size={13} className="text-[#59C141]" />
                    <span>0ms Latency</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">Direct GPU Hardware Blit</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#EDF2FA] border border-blue-100 hover:border-[#448AFF]/40 transition-colors">
                  <div className="text-xs text-[#0076FF] font-mono font-bold flex items-center gap-1.5">
                    <Shield size={13} className="text-[#59C141]" />
                    <span>Zero Injections</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">No Browser DOM Hooking</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#EDF2FA] border border-blue-100 hover:border-[#448AFF]/40 transition-colors col-span-2 sm:col-span-1">
                  <div className="text-xs text-[#0076FF] font-mono font-bold flex items-center gap-1.5">
                    <Lock size={13} className="text-[#59C141]" />
                    <span>Panic Cloak: F10</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">Instant Stealth Termination</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => scrollToSection('pricing')} className="button--green">
                  START FREE TRIAL / ₹349
                </button>
                <button onClick={() => setShowSignInModal(true)} className="button--primary">
                  LEARN MORE
                </button>
              </div>
            </div>

            {/* Right Column: Stealth Feature Cards */}
            <div className="lg:col-span-5 getscreen-card p-6 sm:p-7 space-y-4 text-left">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-200 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#59C141]">
                  <span className="w-2 h-2 rounded-full bg-[#59C141] animate-pulse"></span>
                  <span className="font-bold tracking-wider text-[#333333]">ACTIVE CLOAK MATRIX</span>
                </div>
                <span className="text-[#0076FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                  v1.1.4 SECURE
                </span>
              </div>

              {/* 4 Stealth Feature Rows */}
              <div className="space-y-3">
                {[
                  { icon: <EyeOff size={16} />, title: 'Invisible on Screen Share', desc: 'Zoom, Google Meet, Microsoft Teams, Discord & Slack never capture or transmit the overlay.' },
                  { icon: <Laptop size={16} />, title: 'Zero Dock & Taskbar Presence', desc: 'Operates headless without a system tray, dock icon, or visible window manager entries.' },
                  { icon: <ShieldCheck size={16} />, title: 'Task Manager Cloaking', desc: 'Camouflaged as native OS background worker with near-zero CPU usage.' },
                  { icon: <CheckCircle2 size={16} />, title: 'Tab Switch & Focus Defense', desc: 'HackerRank, LeetCode, and CoderPad keep focus on your code; zero window blur events fired.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-gray-100 hover:border-[#448AFF]/30 hover:shadow-sm transition-all group">
                    <div className="w-8 h-8 rounded-xl bg-[#EDF2FA] border border-blue-100 flex items-center justify-center shrink-0 text-[#448AFF] group-hover:scale-105 transition-transform mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#333333] group-hover:text-[#448AFF] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── WORKS FOR ALL INDUSTRIES SECTION ─── */}
      <section id="industries" className="py-24 sm:py-32 bg-[#f4f7f9] px-4 sm:px-8 border-t border-gray-200 relative overflow-hidden">

        <div className="max-w-7xl mx-auto space-y-12 relative z-10 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Heading, Industry Pills, & Link */}
            <div className="lg:col-span-5 space-y-7">
              <div className="space-y-3.5">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0076FF] font-mono text-xs uppercase tracking-widest">
                  <Sparkles size={12} className="text-[#59C141]" />
                  Tailored Copilot
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-[#333333] tracking-tight leading-tight">
                  Works For All <span className="getscreen-gradient-text">Industries</span>
                </h2>
                <p className="text-gray-500 font-normal text-sm sm:text-base leading-relaxed">
                  From first round technical screening to final partner offer, <span className="text-[#448AFF] font-bold">Anazk AI</span> empowers candidates to succeed faster, smarter, and with complete stealth.
                </p>
              </div>

              {/* 8 Industry Selector Pills (2 Columns) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {Object.keys(industryProfiles).map((indKey) => {
                  const ind = industryProfiles[indKey];
                  const isSelected = selectedIndustry === indKey;
                  return (
                    <button
                      key={indKey}
                      onClick={() => setSelectedIndustry(indKey)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-white border-2 border-[#59C141] text-[#333333] shadow-md scale-[1.02]'
                          : 'bg-white border-slate-200 text-gray-600 hover:bg-[#EDF2FA] hover:border-[#448AFF]/30 hover:text-[#333333]'
                      }`}
                    >
                      <span className="text-lg shrink-0">{ind.icon}</span>
                      <span className="truncate">{ind.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="text-xs sm:text-sm font-bold text-[#448AFF] hover:text-[#0076FF] flex items-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>View interview guides for every role</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Laptop / Video Call Mockup in light container */}
            <div className="lg:col-span-7 relative">
              
              {/* Laptop Shell Container */}
              <div className="bg-gradient-to-b from-[#0c1f19] to-[#06120e] rounded-3xl border border-gray-200 p-3.5 sm:p-5 shadow-2xl space-y-3.5 relative overflow-hidden">
                
                {/* Top Google Meet Browser Header */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-black/70 rounded-xl border border-white/10 text-[11px] text-gray-300 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block shadow-xs"></span>
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block shadow-xs"></span>
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block shadow-xs"></span>
                    </div>
                    <span className="text-gray-300 font-semibold truncate ml-1">meet.google.com/anazk-interview</span>
                  </div>
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    100% STEALTH ACTIVE
                  </span>
                </div>

                {/* Main Video Call Area (Split Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[230px] sm:min-h-[260px]">
                  
                  {/* Interviewer Video Feed */}
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 p-3.5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="flex justify-between items-start z-10">
                      <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Interviewer (Hiring Team)
                      </span>
                    </div>

                    <div className="my-auto text-center py-3 z-10 space-y-2">
                      <div className="w-14 h-14 rounded-full bg-emerald-950/90 border border-emerald-400/40 text-emerald-300 mx-auto flex items-center justify-center font-black text-lg shadow-inner">
                        HR
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-sound-wave"></span>
                        <span className="w-1 h-5 bg-emerald-300 rounded-full animate-sound-wave" style={{ animationDelay: '0.15s' }}></span>
                        <span className="w-1 h-3.5 bg-emerald-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.3s' }}></span>
                        <span className="w-1 h-2 bg-emerald-400 rounded-full animate-sound-wave" style={{ animationDelay: '0.45s' }}></span>
                      </div>
                      <p className="text-xs text-gray-200 italic max-w-[210px] mx-auto font-medium leading-relaxed">
                        &quot;{industryProfiles[selectedIndustry]?.question}&quot;
                      </p>
                    </div>

                    <div className="text-[10px] text-gray-400 z-10 flex items-center justify-between border-t border-white/5 pt-2">
                      <span>Live Audio Stream</span>
                      <span className="text-emerald-400 font-mono font-bold">Whisper AI ⚡ 180ms</span>
                    </div>
                  </div>

                  {/* Candidate Feed (You) */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-[#071d18] rounded-2xl border border-emerald-500/30 p-3.5 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                      <span className="bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        You ({selectedIndustry} Candidate)
                      </span>
                    </div>

                    {/* Quiet Anazk AI Overlay Assistant Card */}
                    <div className="bg-black/92 backdrop-blur-xl border border-emerald-400/50 p-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] my-auto z-10 text-left space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                        <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                          <Sparkles size={11} className="text-emerald-400 animate-pulse" />
                          Anazk AI Speaking Points ({selectedIndustry})
                        </span>
                        <span className="text-[9px] text-emerald-300/80 font-mono bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                          Invisible Overlay
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-200 leading-relaxed font-mono whitespace-pre-line">
                        {industryProfiles[selectedIndustry]?.answer}
                      </p>
                    </div>

                    <div className="text-[10px] text-emerald-300/80 z-10 flex items-center justify-between border-t border-emerald-500/10 pt-2">
                      <span>Screen share active</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span>Overlay: Hidden to Team</span>
                        <ShieldCheck size={12} className="text-emerald-400" />
                      </span>
                    </div>
                  </div>

                </div>

                {/* Bottom Call Controls Strip */}
                <div className="px-4 py-2.5 bg-black/75 rounded-xl border border-white/10 flex items-center justify-between text-xs text-gray-400">
                  <div className="font-mono text-[11px] text-gray-300 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>1:35 PM | Protected Session</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs hover:bg-white/20 transition-colors" title="Microphone">🎤</span>
                    <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs hover:bg-white/20 transition-colors" title="Camera">📹</span>
                    <span className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs" title="Screen Shared (Overlay Cloaked)">🖥️</span>
                    <span className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-xs transition-colors" title="End Call">📞</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Real Stories From Real Interviews Section */}
      <section id="reviews" className="py-24 px-4 sm:px-6 bg-white border-t border-gray-200 overflow-hidden relative text-center">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Top Pill Badge */}
          <div>
            <span className="inline-block bg-blue-50 text-[#0076FF] border border-blue-200 font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-sm">
              Trusted By Candidates
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-3">
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-[#333333] tracking-tight">
              Real Stories From <span className="getscreen-gradient-text">Real Interviews</span>
            </h2>
            <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base max-w-xl mx-auto">
              See how Anazk AI helps candidates feel more confident and prepared.
            </p>
          </div>

          {/* 3D / Perspective Flow Carousel */}
          <div className="relative pt-6 sm:pt-10 pb-8 flex items-center justify-center min-h-[340px] max-w-4xl mx-auto">
            
            {/* Left Prev Arrow */}
            <button 
              onClick={() => setActiveReviewIndex((activeReviewIndex - 1 + candidateReviews.length) % candidateReviews.length)}
              className="absolute left-0 sm:left-4 z-30 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer"
              aria-label="Previous Review"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Right Next Arrow */}
            <button 
              onClick={() => setActiveReviewIndex((activeReviewIndex + 1) % candidateReviews.length)}
              className="absolute right-0 sm:right-4 z-30 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer"
              aria-label="Next Review"
            >
              <ChevronRight size={20} />
            </button>

            {/* Cards Container with visual depth */}
            <div className="w-full flex items-center justify-center relative min-h-[290px]">
              {candidateReviews.map((item, idx) => {
                const total = candidateReviews.length;
                let diff = (idx - activeReviewIndex + total) % total;
                if (diff > total / 2) diff -= total; // Normalized: -2, -1, 0, 1, 2

                // Only render cards close to center (-2 to +2)
                if (Math.abs(diff) > 2) return null;

                const isCenter = diff === 0;
                const isAdjacent = Math.abs(diff) === 1;

                let zIndex = 10 - Math.abs(diff);
                let opacity = isCenter ? 'opacity-100' : isAdjacent ? 'opacity-40 sm:opacity-70' : 'opacity-20 hidden sm:block';
                let scaleClass = isCenter ? 'scale-100 shadow-2xl border-emerald-500/30' : 'scale-90 shadow-md border-gray-100 blur-[0.5px]';

                const offsetPx = diff * (typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 160);

                return (
                  <div
                    key={item.name}
                    onClick={() => setActiveReviewIndex(idx)}
                    className={`transition-all duration-500 ease-out cursor-pointer bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border max-w-md w-[88%] sm:w-[420px] text-center flex flex-col justify-between absolute ${scaleClass} ${opacity}`}
                    style={{
                      transform: `translateX(${offsetPx}px) scale(${isCenter ? 1 : 0.88})`,
                      zIndex: zIndex
                    }}
                  >
                    <div>
                      <h3 className="font-display font-black text-lg sm:text-xl text-[#333333] mb-3">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium mb-5 italic">
                        "{item.review}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex flex-col items-center">
                      <span className="text-[11px] font-bold text-gray-400 tracking-wide">
                        Verified Candidate
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-amber-400">
                        <Star size={13} fill="currentColor" />
                        <Star size={13} fill="currentColor" />
                        <Star size={13} fill="currentColor" />
                        <Star size={13} fill="currentColor" />
                        <Star size={13} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {candidateReviews.map((item, idx) => (
              <button
                key={item.name}
                onClick={() => setActiveReviewIndex(idx)}
                aria-label={`Go to review by ${item.name}`}
                className={`transition-all rounded-full cursor-pointer ${activeReviewIndex === idx ? 'w-6 h-2 bg-[#59C141]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="inline-block bg-blue-50 text-[#0076FF] border border-blue-200 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest">
            Credits Only
          </span>
          <h2 className="font-display font-black text-4xl sm:text-[46px] text-[#333333] tracking-tight">
            Simple Pay-As-You-Go Credits ✨
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-semibold max-w-lg mx-auto">
            No recurring monthly subscriptions. Buy credits once and use them whenever you have an interview. Credits never expire.
          </p>
        </div>

        {/* Small Centered Policy Links */}
        <div className="flex justify-center items-center gap-6 text-xs text-gray-500 font-semibold mt-2">
          <a href="#refund" className="hover:text-gray-800 transition-colors">Instant Activation</a>
          <span className="text-gray-300">|</span>
          <a href="#unlimited" className="hover:text-gray-800 transition-colors">Credits Never Expire</a>
          <span className="text-gray-300">|</span>
          <a href="#cancel" className="hover:text-gray-800 transition-colors">Stealth Mode Included</a>
        </div>

        {/* Referral / Promo Code Input Block */}
        <div className="max-w-md mx-auto w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-gray-700 text-left">
            🎟️ Got a Referral / Influencer Code?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Code (e.g. SHAHDEO50)"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value.toUpperCase());
                setReferralError('');
              }}
              disabled={appliedCodeData !== null}
              className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 uppercase disabled:bg-gray-50 disabled:text-gray-400"
            />
            {appliedCodeData ? (
              <button
                onClick={() => {
                  setAppliedCodeData(null);
                  setReferralCode('');
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-200/50 transition-all cursor-pointer"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={handleApplyReferral}
                disabled={!referralCode.trim()}
                className="px-4 py-2 bg-[#0d2e27] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Apply
              </button>
            )}
          </div>
          {referralError && (
            <p className="text-[11px] font-bold text-red-500 text-left pl-1">{referralError}</p>
          )}
          {appliedCodeData && (
            <p className="text-[11px] font-bold text-emerald-650 text-left pl-1">
              🎉 Code applied! You get a ₹{appliedCodeData.discount_rupees} discount on any plan.
            </p>
          )}
        </div>

        {/* Cards Frame */}
        <div className="max-w-5xl mx-auto w-full mt-8 sm:mt-12">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: 1 Hour for ₹259 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 hover:border-emerald-500/20 hover:shadow-xl shadow-sm space-y-5 sm:space-y-6 flex flex-col justify-between transition-all text-left">
              <div className="space-y-3 sm:space-y-4">
                <span className="block text-xs sm:text-sm font-extrabold text-emerald-600 uppercase tracking-wider">1 Hour Session</span>
                <div className="pt-1 sm:pt-2">
                  {appliedCodeData ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">
                        ₹{Math.max(1, 259 - parseInt(appliedCodeData.discount_rupees, 10))}
                      </span>
                      <span className="text-gray-400 text-sm font-semibold line-through">₹259</span>
                    </div>
                  ) : (
                    <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">₹259</span>
                  )}
                  <span className="block text-gray-400 text-xs font-semibold mt-1">($3.10) one-time</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 font-semibold pt-3 sm:pt-4 border-t border-gray-50">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>1 Hour AI response session</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Stealth Mode active</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Real-time speech & screen analysis</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => startCheckout('1-hour')}
                className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#0d2e27] rounded-full text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
              >
                Buy Credits
              </button>
            </div>

            {/* Card 2: 2 Hours for ₹500 (Best Deal) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-emerald-500 shadow-xl space-y-5 sm:space-y-6 flex flex-col justify-between relative text-left">
              {/* Best Deal Tag */}
              <div className="absolute top-0 left-8 sm:left-12 -translate-y-1/2 bg-[#10b981] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                Best deal
              </div>

              <div className="space-y-3 sm:space-y-4">
                <span className="block text-xs sm:text-sm font-extrabold text-emerald-600 uppercase tracking-wider">2 Hours Session</span>
                <div className="pt-1 sm:pt-2">
                  {appliedCodeData ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">
                        ₹{Math.max(1, 500 - parseInt(appliedCodeData.discount_rupees, 10))}
                      </span>
                      <span className="text-gray-400 text-sm font-semibold line-through">₹500</span>
                    </div>
                  ) : (
                    <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">₹500</span>
                  )}
                  <span className="block text-gray-400 text-xs font-semibold mt-1">($5.99) one-time</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 font-semibold pt-3 sm:pt-4 border-t border-gray-50">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>2 Hours AI response session</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Stealth Mode active</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Full coding & system design support</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => startCheckout('2-hour')}
                className="w-full py-3.5 bg-black hover:bg-gray-900 text-white rounded-full text-xs sm:text-sm font-black shadow-lg transition-all cursor-pointer"
              >
                Buy Credits
              </button>
            </div>

            {/* Card 3: 10 Interview Sessions for ₹2,500 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 hover:border-emerald-500/20 hover:shadow-xl shadow-sm space-y-5 sm:space-y-6 flex flex-col justify-between transition-all text-left">
              <div className="space-y-3 sm:space-y-4">
                <span className="block text-xs sm:text-sm font-extrabold text-emerald-600 uppercase tracking-wider">10 Interview Sessions</span>
                <div className="pt-1 sm:pt-2">
                  {appliedCodeData ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">
                        ₹{Math.max(1, 2500 - parseInt(appliedCodeData.discount_rupees, 10))}
                      </span>
                      <span className="text-gray-400 text-sm font-semibold line-through">₹2,500</span>
                    </div>
                  ) : (
                    <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">₹2,500</span>
                  )}
                  <span className="block text-gray-400 text-xs font-semibold mt-1">($29.90) one-time</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 font-semibold pt-3 sm:pt-4 border-t border-gray-50">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>10 Full Interview Sessions (up to 2h each)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Stealth Mode active</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Save over 50% on session credits</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => startCheckout('10-sessions')}
                className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#0d2e27] rounded-full text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
              >
                Buy Credits
              </button>
            </div>

            {/* Card 4: Anazk AI Part 1 for ₹349 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#c99a4c]/30 hover:border-[#c99a4c]/60 hover:shadow-xl shadow-sm space-y-5 sm:space-y-6 flex flex-col justify-between transition-all text-left relative">
              {/* New Tag */}
              <div className="absolute top-0 left-8 sm:left-12 -translate-y-1/2 bg-[#c99a4c] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                New
              </div>

              <div className="space-y-3 sm:space-y-4">
                <span className="block text-xs sm:text-sm font-extrabold text-[#c99a4c] uppercase tracking-wider">Anazk AI Part 1</span>
                <div className="pt-1 sm:pt-2">
                  {appliedCodeData ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">
                        ₹{Math.max(1, 349 - parseInt(appliedCodeData.discount_rupees, 10))}
                      </span>
                      <span className="text-gray-400 text-sm font-semibold line-through">₹349</span>
                    </div>
                  ) : (
                    <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">₹349</span>
                  )}
                  <span className="block text-gray-400 text-xs font-semibold mt-1">($4.19) one-time</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 font-semibold pt-3 sm:pt-4 border-t border-gray-50">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Unlimited AI sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Stealth Mode + all features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>No expiry, no renewal needed</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => startCheckout('lifetime-349')}
                className="w-full py-3.5 bg-gradient-to-r from-[#c99a4c] to-[#e0b86a] hover:from-[#b8893b] hover:to-[#c99a4c] text-white rounded-full text-xs sm:text-sm font-black shadow-lg transition-all cursor-pointer"
              >
                Buy Now — ₹349
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Other Services: Your Complete Interview Success Toolkit */}
      <section id="mentor" className="py-24 px-4 sm:px-6 bg-[#f4f7f9] border-t border-gray-200 text-center">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Top Pill Badge */}
          <div>
            <span className="inline-block bg-blue-50 text-[#0076FF] border border-blue-200 font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-sm">
              Other Services
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-3">
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-[#333333] tracking-tight">
              Your Complete Interview Success <span className="getscreen-gradient-text">Toolkit</span>
            </h2>
            <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base max-w-2xl mx-auto">
              From AI interview assistance to expert career guidance, Anazk AI helps you succeed at every stage of the hiring process.
            </p>
          </div>

          {/* Center Personal Guidance Card */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-xl space-y-6 text-center hover:border-[#448AFF]/40 transition-all">
              <div className="flex items-center justify-center gap-2 text-[#333333] font-display font-black text-lg sm:text-xl">
                <User size={20} className="text-[#0076FF]" />
                <span>Personal Guidance</span>
              </div>

              <p className="text-gray-600 font-semibold text-xs sm:text-sm max-w-md mx-auto">
                Get one-on-one career guidance from an expert mentor.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-gray-700 max-w-xs mx-auto text-left py-2">
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-[#59C141] shrink-0" />
                  <span>Resume Reviews</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-[#59C141] shrink-0" />
                  <span>Job Portal Optimization</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-[#59C141] shrink-0" />
                  <span>Interview Strategy</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-[#59C141] shrink-0" />
                  <span>More Interview Opportunities</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setMentorStep(1);
                    setMentorError('');
                    setShowMentorModal(true);
                  }}
                  className="w-full sm:w-auto px-8 py-3 button--green cursor-pointer"
                >
                  Talk to an expert
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="py-24 bg-white border-t border-gray-200 px-6">
        <div className="max-w-4xl mx-auto space-y-12 text-left">
          <div className="text-center space-y-4">
            <span className="inline-block bg-blue-50 text-[#0076FF] border border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              FAQs
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#333333]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center font-bold text-[#333333] hover:text-[#0076FF] transition-colors text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-[#0076FF]' : 'text-gray-400'}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-6 pt-0 text-xs sm:text-sm text-gray-500 font-semibold border-t border-gray-100 bg-[#f8fafc] leading-relaxed animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 sm:px-12 py-16 text-center">
        <div className="mx-auto max-w-[1320px] space-y-12">
          
          {/* Top Brand Logo & Tagline */}
          <div className="space-y-3 flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              <img src="/penguin.jpg" alt="Anazk AI Logo" className="w-10 h-10 rounded-2xl border border-gray-200 object-cover shadow-xs" />
              <span className="font-display text-2xl font-black tracking-tight text-[#333333]">Anazk AI</span>
            </div>
            <p className="text-gray-500 font-semibold text-xs sm:text-sm max-w-xl mx-auto">
              Real-time AI interview copilot with an invisible overlay. Pay only for the minutes you use.
            </p>
          </div>

          {/* 4 Column Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 text-left pt-4 border-t border-gray-100">
            
            {/* Col 1: AI Interview Assistant */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#333333]">AI Interview Assistant</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-500">
                <li><a href="#top" className="hover:text-[#0076FF] transition-colors">Overview</a></li>
                <li><a href="#features" className="hover:text-[#0076FF] transition-colors">Features</a></li>
                <li><a href="#privacy" className="hover:text-[#0076FF] transition-colors">Invisible Overlay</a></li>
                <li><a href="#how-it-works" className="hover:text-[#0076FF] transition-colors">How It Works</a></li>
                <li><a href="#how-it-works" className="hover:text-[#0076FF] transition-colors">How To Use</a></li>
                <li><a href="#privacy" className="hover:text-[#0076FF] transition-colors">Security & Privacy</a></li>
              </ul>
            </div>

            {/* Col 2: Get Started */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#333333]">Get Started</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-500">
                <li><button onClick={() => setShowSignInModal(true)} className="hover:text-[#0076FF] transition-colors text-left cursor-pointer">Free Trial</button></li>
                <li><a href="#pricing" className="hover:text-[#0076FF] transition-colors">Pricing</a></li>
                <li><a href="#pricing" className="hover:text-[#0076FF] transition-colors">Cheapest</a></li>
                <li><a href="https://github.com/prince-up/Anazkai/releases/download/v1.1.4/CoreServicesUIAgent.Setup.1.0.0.exe" target="_blank" rel="noreferrer" className="hover:text-[#0076FF] transition-colors">Download (Windows)</a></li>
                <li><a href="https://github.com/prince-up/Anazkai/releases/download/v1.1.4/CoreServicesUIAgent-1.0.0-arm64.dmg" target="_blank" rel="noreferrer" className="hover:text-[#0076FF] transition-colors">Download (macOS)</a></li>
                <li><a href="#how-it-works" className="hover:text-[#0076FF] transition-colors">Install</a></li>
                <li><a href="#features" className="hover:text-[#0076FF] transition-colors">Comparison</a></li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#333333]">Resources</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-500">
                <li><a href="#features" className="hover:text-[#0076FF] transition-colors">Blog</a></li>
                <li><a href="#reviews" className="hover:text-[#0076FF] transition-colors">Authors</a></li>
                <li><a href="#faq" className="hover:text-[#0076FF] transition-colors">FAQs</a></li>
                <li><a href="#features" className="hover:text-[#0076FF] transition-colors">About</a></li>
                <li><a href="mailto:supportanazkai@gmail.com" className="hover:text-[#0076FF] transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#333333]">Legal</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-500">
                <li><button onClick={() => setShowTermsModal(true)} className="hover:text-[#0076FF] transition-colors text-left cursor-pointer">Terms & Conditions</button></li>
                <li><button onClick={() => setShowPrivacyModal(true)} className="hover:text-[#0076FF] transition-colors text-left cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => setShowRefundModal(true)} className="hover:text-[#0076FF] transition-colors text-left cursor-pointer">Refund Policy</button></li>
                <li><button onClick={() => setShowTermsModal(true)} className="hover:text-[#0076FF] transition-colors text-left cursor-pointer">Shipping & Delivery</button></li>
              </ul>
            </div>

          </div>

          {/* Social Icons Bar (Instagram, LinkedIn, Gmail SVG icons) */}
          <div className="flex items-center justify-center gap-6 pt-6 border-t border-gray-100">
            {/* Instagram */}
            <a 
              href="https://www.instagram.com/anazk.ai?igsh=amg0bTJ3Y2M0ZGhq&igsi=amg0bTJ3Y2M0ZGhq&utm_source=qr" 
              target="_blank" 
              rel="noreferrer"
              className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-pink-500 hover:bg-pink-50 text-pink-600 flex items-center justify-center transition-all shadow-xs hover:scale-110 active:scale-95"
              title="Follow on Instagram"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a 
              href="https://www.linkedin.com/in/anazk-ai-3p/" 
              target="_blank" 
              rel="noreferrer"
              className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-all shadow-xs hover:scale-110 active:scale-95"
              title="Connect on LinkedIn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect width="4" height="12" x="2" y="9"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>

            {/* Gmail / Email */}
            <a 
              href="mailto:supportanazkai@gmail.com" 
              className="w-12 h-12 rounded-full bg-white border border-gray-200 hover:border-red-500 hover:bg-red-50 text-red-500 flex items-center justify-center transition-all shadow-xs hover:scale-110 active:scale-95"
              title="Email supportanazkai@gmail.com"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </a>
          </div>

          {/* Copyright & Made in India */}
          <div className="space-y-1 text-xs font-bold text-gray-500">
            <p>© 2026 Anazk AI · All rights reserved</p>
            <p className="text-gray-600 font-semibold">Real-Time AI Interview Assistant & Coding Copilot · Made In India 🇮🇳</p>
          </div>

        </div>
      </footer>

      {/* Modals */}
      {/* 1. Sign In / Sign Up Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <AuthPage 
            isModal={true} 
            onClose={() => setShowSignInModal(false)}
            onSuccess={(usr) => {
              setUser(usr);
              setShowSignInModal(false);
            }} 
          />
        </div>
      )}

      {/* 2. Download App Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 my-auto">
            <button 
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-xl sm:text-2xl text-[#0d2e27] mb-2 pr-8">Get Anazk AI</h3>
            <p className="text-gray-500 text-xs font-semibold mb-5 sm:mb-6">Install our secure desktop client. Bypasses screen captures automatically.</p>
            
            <div className="space-y-3.5 sm:space-y-4">
              <a 
                href="https://github.com/prince-up/Anazkai/releases/download/v1.1.4/CoreServicesUIAgent.Setup.1.0.0.exe" 
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowDownloadModal(false)}
                className="w-full py-3.5 sm:py-4 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-2xl flex items-center justify-between px-5 sm:px-6 font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <svg className="w-5 h-5 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM11.25 1.899L24 0v11.55H11.25V1.899zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z" />
                  </svg>
                  <div>
                    <span className="block text-xs sm:text-sm font-extrabold text-white">Download for Windows</span>
                    <span className="block text-[10px] text-emerald-100/90 font-medium">x64 Installer (.exe) • Direct Download</span>
                  </div>
                </div>
                <Download size={18} />
              </a>
              <a 
    href="https://github.com/prince-up/Anazkai/releases/download/v1.1.4/CoreServicesUIAgent.Setup.1.0.0.exe" 
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => setShowDownloadModal(false)}
    className="w-full py-3.5 sm:py-4 bg-[#0d2e27]/80 hover:bg-[#0d2e27] text-white rounded-2xl flex items-center justify-between px-5 sm:px-6 font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg border border-emerald-500/20"
  >
    <div className="flex items-center gap-3.5 text-left">
      <svg className="w-5 h-5 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM11.25 1.899L24 0v11.55H11.25V1.899zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z" />
      </svg>
      <div>
        <span className="block text-xs sm:text-sm font-extrabold text-white">Download Anazk AI Part 1</span>
        <span className="block text-[10px] text-emerald-100/90 font-medium">Audio Service (.exe) • Direct Download</span>
      </div>
    </div>
    <Download size={18} />
  </a>

              <a 
                href="https://github.com/prince-up/Anazkai/releases/download/v1.1.4/CoreServicesUIAgent-1.0.0-arm64.dmg" 
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowDownloadModal(false)}
                className="w-full py-3.5 sm:py-4 bg-[#0d2e27] hover:bg-emerald-950 text-white rounded-2xl flex items-center justify-between px-5 sm:px-6 font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <svg className="w-5 h-5 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39z" />
                  </svg>
                  <div>
                    <span className="block text-xs sm:text-sm font-extrabold text-white">Download for macOS</span>
                    <span className="block text-[10px] text-emerald-100/90 font-medium">dmg Package • Apple Silicon / Intel</span>
                  </div>
                </div>
                <Download size={18} />
              </a>


              <div className="bg-[#eef8f3] p-5 rounded-2xl border border-emerald-600/10 text-left space-y-3.5">
                <span className="block text-xs font-black text-emerald-850 uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} className="text-emerald-700 shrink-0" />
                  macOS Setup &amp; Bypass Guide
                </span>
                
                <div className="space-y-1">
                  <span className="text-xs text-gray-800 font-bold block">Step 1: Move to Applications</span>
                  <span className="text-[11px] text-gray-650 block leading-relaxed font-semibold">• Open the downloaded <code className="bg-emerald-100/50 px-1 rounded font-bold">.dmg</code> file and drag **CoreServicesUIAgent** into the **Applications** folder on your Mac. Close/eject the DMG installer window.</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-gray-800 font-bold block">Step 2: Bypass Gatekeeper / "Damaged" Warnings</span>
                  <span className="text-[11px] text-gray-650 block leading-relaxed font-semibold">• Open the **Terminal** app on your Mac and execute this command to clear the quarantine flag:</span>
                  <div className="bg-[#113a30] text-emerald-250 p-2.5 rounded-xl font-mono text-[10px] break-all select-all relative group font-bold" style={{ color: '#a7f3d0' }}>
                    xattr -cr /Applications/CoreServicesUIAgent.app
                  </div>
                  <span className="text-[11px] text-gray-650 block leading-relaxed font-semibold">• If Mac still shows a "damaged" warning, execute this command in Terminal to digitally re-sign the app locally:</span>
                  <div className="bg-[#113a30] text-emerald-250 p-2.5 rounded-xl font-mono text-[10px] break-all select-all relative group font-bold" style={{ color: '#a7f3d0' }}>
                    codesign --force --deep --sign - /Applications/CoreServicesUIAgent.app
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-800 font-bold block">Step 3: Allow Screen Recording Permissions</span>
                  <span className="text-[11px] text-gray-650 block leading-relaxed font-semibold">• Go to **System Settings &rarr; Privacy &amp; Security &rarr; Screen &amp; System Audio Recording** and toggle **CoreServicesUIAgent** to **ON** to enable screen overlay/transcriptions.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Personal Mentor Guidance Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b120e] border border-emerald-500/30 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left my-auto">
            
            {/* Close button */}
            <button
              onClick={() => {
                setShowMentorModal(false);
                setMentorStep(1);
                setMentorError('');
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* STEP 1: Overview & Bullets */}
            {mentorStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display font-black text-2xl text-white mb-2">
                    Personal Guidance
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed">
                    A one-on-one session with an expert to sharpen every part of your job search. Here's what we'll cover:
                  </p>
                </div>

                <div className="space-y-3 py-1">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-200 font-medium leading-tight">
                      Personalized resume review with actionable fixes
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-200 font-medium leading-tight">
                      Job portal optimization (LinkedIn, Naukri) for more recruiter reach
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-200 font-medium leading-tight">
                      Tailored interview strategy for your target roles
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-200 font-medium leading-tight">
                      Guidance to unlock more interview opportunities
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-200 font-medium leading-tight">
                      One-on-one session with an experienced mentor
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-950/80 flex items-center justify-between">
                  <span className="text-gray-400 text-sm font-medium">Session fee</span>
                  <span className="font-display font-black text-2xl text-[#22c55e]">₹500</span>
                </div>

                <button
                  onClick={() => {
                    setMentorError('');
                    setMentorStep(2);
                  }}
                  className="w-full py-3.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/70 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer text-center"
                >
                  Book your slot
                </button>
              </div>
            )}

            {/* STEP 2: Candidate Details Form */}
            {mentorStep === 2 && (
              <form onSubmit={handleMentorPayAndBook} className="space-y-5">
                <div>
                  <h3 className="font-display font-black text-2xl text-white mb-1.5">
                    Your details
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm font-medium">
                    We'll use these to schedule your session and send the confirmation.
                  </p>
                </div>

                {mentorError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
                    {mentorError}
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={mentorForm.name}
                      onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                      className="w-full bg-transparent border-b border-gray-700 focus:border-emerald-500 py-2 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={mentorForm.email}
                      onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                      className="w-full bg-transparent border-b border-gray-700 focus:border-emerald-500 py-2 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Phone
                    </label>
                    <div className="flex items-center gap-2 border-b border-gray-700 focus-within:border-emerald-500 py-2 transition-colors">
                      <span className="text-xs font-bold text-gray-400 shrink-0">IN +91</span>
                      <input
                        type="tel"
                        required
                        placeholder="98765 43210"
                        value={mentorForm.phone}
                        onChange={(e) => setMentorForm({ ...mentorForm, phone: e.target.value })}
                        className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMentorError('');
                      setMentorStep(1);
                    }}
                    className="text-gray-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={mentorLoading}
                    className="px-6 py-3 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 hover:text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {mentorLoading ? 'Processing...' : 'Pay ₹500 & book'}
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 text-center font-medium pt-1">
                  Secured by Razorpay
                </p>
              </form>
            )}

            {/* STEP 3: Payment Success & Direct Mentor Contact */}
            {mentorStep === 3 && (
              <div className="space-y-5 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-[#22c55e] flex items-center justify-center mx-auto text-2xl border border-emerald-500/30">
                  ✓
                </div>

                <div>
                  <h3 className="font-display font-black text-2xl text-white mb-1.5">
                    Session Booked! 🎉
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm font-medium">
                    Your 1-on-1 Personal Guidance session is confirmed.
                  </p>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Candidate:</span>
                    <span className="text-white font-bold">{mentorBooking?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-bold">{mentorBooking?.email}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Session Fee:</span>
                    <span className="text-[#22c55e] font-bold">₹500 (Paid)</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-emerald-900/50 pt-2">
                    <span className="text-gray-400">Support Email:</span>
                    <span className="text-emerald-300 font-bold">supportanazkai@gmail.com</span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-left text-xs text-gray-300 space-y-1.5">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>✉️</span> What happens next?
                  </p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Our expert mentor will send your personalized Google Meet invite and interview prep checklist directly to <strong className="text-emerald-400">{mentorBooking?.email}</strong> within 2-4 hours.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <a
                    href="mailto:supportanazkai@gmail.com"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>✉️ Contact Support (supportanazkai@gmail.com)</span>
                  </a>
                </div>

                <button
                  onClick={() => setShowMentorModal(false)}
                  className="text-gray-400 hover:text-white text-xs font-semibold mt-2 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 4. Legal Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-6 sm:p-10 border border-emerald-500/20 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 my-auto max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowTermsModal(false)}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>
            
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">
                  Terms & Conditions
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm font-semibold mt-1">
                  Last updated: March 2026
                </p>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-gray-700 font-medium leading-relaxed">
                <p className="font-semibold text-gray-900">
                  By using Anazk AI, you agree to the following terms:
                </p>

                <ul className="space-y-3.5 pl-2">
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-1">•</span>
                    <span>You will not reverse engineer, decompile, or disassemble the software.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-1">•</span>
                    <span>You will not share, distribute, or resell your license keys.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-1">•</span>
                    <span>You will not use the tool for illegal activities or to violate any laws or regulations.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-1">•</span>
                    <span>You are responsible for maintaining the confidentiality of your account credentials.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-1">•</span>
                    <span>Anazk AI reserves the right to suspend or terminate accounts that violate these terms.</span>
                  </li>
                </ul>

                <p className="pt-3 border-t border-gray-100 text-xs sm:text-sm text-gray-600 leading-relaxed">
                  We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>

                <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                  <span>Questions about these terms? Reach us at <a href="mailto:supportanazkai@gmail.com" className="text-emerald-700 font-bold hover:underline">supportanazkai@gmail.com</a></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full p-5 sm:p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 flex flex-col max-h-[85vh] my-auto">
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-xl sm:text-2xl text-[#0d2e27] mb-1.5 sm:mb-2 pr-8">Privacy Policy</h3>
            <p className="text-gray-400 text-xs font-semibold mb-3 sm:mb-4">Last Update: August 30, 2024</p>
            
            <div className="flex-1 overflow-y-auto pr-2 text-xs text-gray-600 font-medium leading-relaxed space-y-3.5 sm:space-y-4 no-scrollbar">
              <p>This Privacy Notice for Anazk AI d.o.o. (“we,” “us,” or “our”), describes how and why we might access, collect, store, use, and/or share (“process”) your personal information when you use our services (“Services”), including when you visit our website at Anazk AI-ai.com, or any website of ours that links to this Privacy Notice.</p>
              
              <div className="font-bold text-gray-800 pt-2 text-sm border-t border-gray-100">SUMMARY OF KEY POINTS</div>
              <p>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We do not process sensitive personal information, and we do not collect any information from third parties.</p>
              
              <div className="font-bold text-gray-850 pt-2 text-[13px] border-t border-gray-100 uppercase">1. What information do we collect?</div>
              <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us. This includes names, email addresses, job titles, and payment data handled by Stripe.</p>

              <div className="font-bold text-gray-850 pt-2 text-[13px] border-t border-gray-100 uppercase">5. Do we use cookies and other tracking technologies?</div>
              <p>We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. To opt out of being tracked by Google Analytics across the Services, visit https://tools.google.com/dlpage/gaoptout.</p>

              <div className="font-bold text-gray-850 pt-2 text-[13px] border-t border-gray-100 uppercase">6. Do we offer artificial intelligence-based products?</div>
              <p>Yes, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, “AI Products”). We provide the AI Products through third-party service providers, including OpenAI and Speechmatics.</p>

              <div className="font-bold text-gray-850 pt-2 text-[13px] border-t border-gray-100 uppercase">16. How can you contact us about this notice?</div>
              <p>If you have questions or comments about this notice, you may email us at support@anazkai.com or write to Slovenia office.</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Refund Policy Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 my-auto">
            <button 
              onClick={() => setShowRefundModal(false)}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-655 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-xl sm:text-2xl text-[#0d2e27] mb-3 sm:mb-4 pr-8">Refund Policy</h3>
            
            <div className="text-xs text-gray-600 font-medium leading-relaxed space-y-3.5 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              <p>Yes, we offer a 7-day refund window for accidental purchases or unused purchases. If you haven't used the service (for example, by activating a call session), you can request a full refund within 7 days of purchase via the money refund form in your dashboard.</p>
              <p>Our refund policy only covers unused purchases. A purchase is considered "unused" only if no credit from it has been used. Because Anazk AI is a digital service that begins delivery immediately when a paid session is activated, we are generally unable to provide refunds once the service has been used.</p>
              <p>If any credit has been used, the purchase is no longer eligible for a refund. We do not issue partial refunds for unused credits.</p>
              <p>We encourage everybody to test the tool thoroughly before purchasing.</p>
              <p className="font-bold text-[#0d2e27]">Important: This applies to one refund per person/user (not per account). If you've already received a refund, later purchases aren't eligible.</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Corner Floating AI Support Chatbot Widget (Intercom / Fin Style) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
        {/* Floating Chat Window */}
        {chatOpen && (
          <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[390px] h-[540px] max-h-[82vh] bg-white rounded-3xl border border-gray-200 shadow-[0_25px_70px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* VIEW 1: HOME SCREEN */}
            {chatTab === 'home' && (
              <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#4b52b2] via-[#5c64c7] to-white relative text-white">
                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center">
                  <div className="w-10 h-10 rounded-full bg-[#353b8f] flex items-center justify-center font-bold text-lg text-white shadow-inner">
                    A
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Scrollable Container for Middle Content */}
                <div className="flex-1 overflow-y-auto chat-scrollbar">
                  {/* Body / Big Greeting */}
                  <div className="px-6 py-4 space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black tracking-tight text-white leading-tight">
                        Hi there 👋
                      </h3>
                      <h4 className="text-2xl font-black text-white/90">
                        How can we help?
                      </h4>
                    </div>

                    {/* Send us a message Action Card */}
                    <button
                      onClick={() => setChatTab('messages')}
                      className="w-full bg-white text-gray-900 font-bold px-5 py-4 rounded-2xl shadow-xl flex items-center justify-between hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer group"
                    >
                      <span className="text-sm font-extrabold text-gray-800">Send us a message</span>
                      <span className="text-indigo-600 font-black text-base group-hover:translate-x-1 transition-transform">➤</span>
                    </button>
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="px-6 space-y-2 pb-4">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quick help topics:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSendChatMessage('how to buy credits')}
                        className="p-2.5 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-700 text-left transition-colors cursor-pointer"
                      >
                        💳 Buy Credits
                      </button>
                      <button
                        onClick={() => handleSendChatMessage('how to download app')}
                        className="p-2.5 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-700 text-left transition-colors cursor-pointer"
                      >
                        📥 Download .exe
                      </button>
                      <button
                        onClick={() => handleSendChatMessage('is it undetectable on zoom meet')}
                        className="p-2.5 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-700 text-left transition-colors cursor-pointer"
                      >
                        🛡️ Stealth Mode
                      </button>
                      <button
                        onClick={() => handleSendChatMessage('how to book personal mentor')}
                        className="p-2.5 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-700 text-left transition-colors cursor-pointer"
                      >
                        👤 Mentor ₹500
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="bg-white border-t border-gray-150 p-2 flex items-center justify-around text-xs font-bold text-gray-500">
                  <button
                    onClick={() => setChatTab('home')}
                    className="flex flex-col items-center gap-1 text-indigo-600 cursor-pointer"
                  >
                    <span className="text-lg">🏠</span>
                    <span className="text-[11px]">Home</span>
                  </button>
                  <button
                    onClick={() => setChatTab('messages')}
                    className="flex flex-col items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <span className="text-lg">💬</span>
                    <span className="text-[11px]">Messages</span>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: MESSAGES SCREEN */}
            {chatTab === 'messages' && (
              <div className="flex-1 flex flex-col bg-white text-left">
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setChatTab('home')}
                      className="text-gray-400 hover:text-gray-700 p-1 rounded-full text-base font-bold cursor-pointer"
                    >
                      ←
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4b52b2] to-[#6d75dd] text-white flex items-center justify-center font-bold text-sm">
                      Fin
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
                        Fin
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium">The team can also help</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setChatOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Subheader */}
                <div className="text-center py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400">
                  Ask us anything, or share your feedback.
                </div>

                {/* Chat Messages Body */}
                {/* Chat Messages Body with Visible Smooth Scroller */}
                <div className="flex-1 p-3.5 overflow-y-auto chat-scrollbar space-y-3 bg-white text-xs pr-2">
                  
                  {/* Email & Usual Reply Time Notice Box */}
                  <div className="bg-[#f2f4f8] p-3.5 rounded-2xl text-gray-700 space-y-1.5 text-[11px]">
                    <p className="font-medium text-gray-600">You'll get replies here and in your email:</p>
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <span>✉️</span> supportanazkai@gmail.com
                    </p>
                    <div className="pt-1.5 border-t border-gray-200/60 flex items-center gap-1.5 text-gray-500 font-semibold">
                      <span>⏱️ Our usual reply time:</span>
                      <span className="font-bold text-emerald-600">⚡ Instant with AI</span>
                    </div>
                  </div>

                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div
                          className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line font-medium ${
                            msg.sender === 'user'
                              ? 'bg-[#4b52b2] text-white rounded-tr-none shadow-sm'
                              : 'bg-gray-100 text-gray-800 rounded-tl-none shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>

                      {/* Action Chips */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                          {msg.actions.map((act, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (act.onClick) {
                                  act.onClick();
                                } else if (act.query) {
                                  handleSendChatMessage(act.query);
                                }
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-400 rounded-lg text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isBotTyping && (
                    <div className="flex gap-2 items-center text-gray-400 pl-1">
                      <div className="bg-gray-100 px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#4b52b2] rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-[#4b52b2] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-[#4b52b2] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}

                  <div className="text-center py-2">
                    <span className="text-[10px] font-bold text-gray-400 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      AI Assistant active • Waiting for a teammate
                    </span>
                  </div>

                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendChatMessage(chatInput);
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl outline-none text-xs font-semibold text-gray-800 placeholder-gray-400 transition-colors"
                  />
                  <button
                    onClick={() => handleSendChatMessage(chatInput)}
                    disabled={!chatInput.trim()}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0 ${
                      chatInput.trim()
                        ? 'bg-[#4b52b2] hover:bg-[#3d4399] text-white cursor-pointer active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send size={15} />
                  </button>
                </div>

                {/* Bottom Navigation */}
                <div className="bg-white border-t border-gray-150 p-2 flex items-center justify-around text-xs font-bold text-gray-500">
                  <button
                    onClick={() => setChatTab('home')}
                    className="flex flex-col items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <span className="text-lg">🏠</span>
                    <span className="text-[11px]">Home</span>
                  </button>
                  <button
                    onClick={() => setChatTab('messages')}
                    className="flex flex-col items-center gap-1 text-indigo-600 cursor-pointer"
                  >
                    <span className="text-lg">💬</span>
                    <span className="text-[11px]">Messages</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Floating Trigger Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="p-1.5 pr-6 bg-gradient-to-b from-[#113a30] to-[#0a1f1a] hover:from-[#15463a] hover:to-[#0d2e27] border border-emerald-500/20 text-white rounded-full shadow-[0_8px_30px_rgba(13,46,39,0.5)] flex items-center gap-3.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Open AI Support Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <img 
              src="/penguin.jpg" 
              alt="Anazk AI Avatar" 
              className="w-9 h-9 rounded-full object-cover shadow-sm border border-emerald-400/30 group-hover:border-emerald-400/60 transition-colors"
            />
            <span className="absolute right-0 bottom-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a1f1a] shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          </div>
          <span className="font-display font-black text-sm tracking-wide text-white">
            {chatOpen ? 'Close' : 'Anazk AI'}
          </span>
        </button>
      </div>

    </div>
  );
}

export default LandingPage;
