import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Play, CheckCircle2, Download, Menu, X, Mic, Monitor, Star, 
  MoreVertical, Move, ChevronDown, CornerDownLeft, Sparkles, Settings, Copy, 
  Shield, Eye, EyeOff, User, Users, ChevronLeft, ChevronRight, Lock, Laptop, Check,
  MessageSquare, Send, Bot, Compass, HelpCircle, CreditCard, Mail, LayoutDashboard,
  Zap, Target, Code2, Volume2, Clock, FileText, Tag, Sliders, ShieldCheck
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

  const getDownloadLink = () => {
    return isMacUser()
      ? "https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI-1.0.0-arm64.dmg"
      : "https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI.Setup.1.0.0.exe";
  };

  const [activeTab, setActiveTab] = useState('non-coding'); // 'non-coding' or 'coding'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [pricingOption, setPricingOption] = useState('credits'); // 'subscription' or 'credits'
  const [checkoutState, setCheckoutState] = useState('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [user, setUser] = useState(null);
  
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

      const keyId = data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

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
          currency: 'INR'
        }),
      });
      const data = await response.json();
      const orderId = data.order_id || data.orderId;
      if (!response.ok || !orderId) {
        throw new Error(data.error || 'Failed to initiate order. Please try again.');
      }
      
      const keyId = data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

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
                email: user.email
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
            console.warn('[Anazk] Profile table note:', profileErr?.message);
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
- Desktop App: Windows 10/11 64-bit installer (.exe) and macOS Apple Silicon/Intel (.dmg) installer available at: https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/
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
  const [sandboxResponse, setSandboxResponse] = useState('');
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const [sandboxTranscript, setSandboxTranscript] = useState('');

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
          // Start simulated answer
          let solIndex = 0;
          const solInterval = setInterval(() => {
            if (solIndex < codingProblem.solution.length) {
              setSimulatedSolution(prev => prev + codingProblem.solution[solIndex]);
              solIndex += 3; // speed up solution typing
            } else {
              clearInterval(solInterval);
            }
          }, 15);
        }
      }, 30);
      return () => clearInterval(interval);
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
        <p className="text-gray-500 mb-6 text-sm">Here is your License Key. Copy this and paste it into the Anazk Desktop App to start your session.</p>
        
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

      {/* ─── TOP NAVBAR (GIRGIT AI MEGA-MENU STYLE) ─── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#eef8f3]/95 backdrop-blur-md border-b border-emerald-500/15 transition-all duration-300">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 sm:h-18 flex items-center justify-between relative">
          
          {/* Left: Brand Logo & Title */}
          <div 
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group shrink-0"
          >
            <img 
              src="/penguin.jpg" 
              alt="Anazk AI Logo" 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-500/30 object-cover shadow-xs group-hover:scale-105 transition-transform" 
            />
            <span className="font-display font-black text-xl sm:text-2xl text-[#0d2e27] tracking-tight flex items-center">
              Anazk<span className="text-emerald-600 font-extrabold ml-1">AI</span>
            </span>
          </div>

          {/* Center: Mega Menu Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-10 text-sm font-black text-[#0d2e27]">
            
            {/* 1. AI Interview Assistant Mega Menu */}
            <div 
              className="py-4"
              onMouseEnter={() => setActiveDropdown('assistant')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'assistant' ? null : 'assistant')}
                className={`flex items-center gap-1 py-1 transition-colors cursor-pointer ${activeDropdown === 'assistant' ? 'text-emerald-700' : 'hover:text-emerald-700'}`}
              >
                <span>AI Interview Assistant</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'assistant' ? 'rotate-180 text-emerald-600' : 'text-gray-500'}`} />
              </button>

              {/* Mega Dropdown Box */}
              {activeDropdown === 'assistant' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[820px] max-w-[95vw] bg-[#dbf5e7] rounded-3xl border border-emerald-600/20 shadow-2xl p-7 sm:p-8 animate-in fade-in slide-in-from-top-2 duration-200 text-left z-50 text-[#0d2e27]">
                  <div className="grid grid-cols-12 gap-8 items-start">
                    
                    {/* Left Promo Area */}
                    <div className="col-span-5 pr-2 space-y-3.5">
                      <div className="space-y-1.5">
                        <h3 className="font-display font-black text-xl text-[#0d2e27]">
                          Anazk AI Copilot
                        </h3>
                        <p className="text-xs text-[#134237]/80 leading-relaxed font-semibold">
                          Real-time AI assistance, invisible screen-share overlay, and intelligent live problem solving.
                        </p>
                      </div>

                      <button 
                        onClick={() => scrollToSection('sandbox')}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-[#0d2e27] hover:text-emerald-700 transition-colors pt-2 group cursor-pointer"
                      >
                        <span>Try Live Sandbox</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* Right Columns with Divider */}
                    <div className="col-span-7 border-l border-[#0d2e27]/15 pl-8 grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-black text-[#0d2e27] uppercase tracking-wider mb-3.5">
                          Capabilities
                        </h4>
                        <ul className="space-y-2.5 text-xs font-bold text-[#134237]">
                          <li>
                            <button onClick={() => scrollToSection('top')} className="hover:text-emerald-800 hover:underline block text-left cursor-pointer">
                              Overview & Demo
                            </button>
                          </li>
                          <li>
                            <button onClick={() => scrollToSection('features')} className="hover:text-emerald-800 hover:underline block text-left cursor-pointer">
                              Core Features
                            </button>
                          </li>
                          <li>
                            <button onClick={() => scrollToSection('industries')} className="hover:text-emerald-800 hover:underline block text-left cursor-pointer">
                              All Industries
                            </button>
                          </li>
                          <li>
                            <button onClick={() => scrollToSection('why-anazk')} className="hover:text-emerald-800 hover:underline block text-left cursor-pointer">
                              Why Anazk AI
                            </button>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-[#0d2e27] uppercase tracking-wider mb-3.5">
                          Stealth & App
                        </h4>
                        <ul className="space-y-2.5 text-xs font-bold text-[#134237]">
                          <li>
                            <button onClick={() => scrollToSection('privacy')} className="hover:text-emerald-800 hover:underline block text-left cursor-pointer">
                              Invisible Overlay
                            </button>
                          </li>
                          <li>
                            <button onClick={() => scrollToSection('why-anazk')} className="hover:text-emerald-800 hover:underline block text-left cursor-pointer">
                              System Hotkeys
                            </button>
                          </li>
                          <li>
                            <a 
                              href="https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI.Setup.1.0.0.exe" 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={() => setActiveDropdown(null)} 
                              className="hover:text-emerald-800 hover:underline block"
                            >
                              Windows App (.exe)
                            </a>
                          </li>
                          <li>
                            <a 
                              href="https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI-1.0.0-arm64.dmg" 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={() => setActiveDropdown(null)} 
                              className="hover:text-emerald-800 hover:underline block"
                            >
                              macOS App (.dmg)
                            </a>
                          </li>
                          <li>
                            <button 
                              onClick={() => { setActiveDropdown(null); setShowPrivacyModal(true); }}
                              className="hover:text-emerald-800 hover:underline block text-left cursor-pointer"
                            >
                              Privacy Protocol
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* 2. Pricing Mega Menu */}
            <div 
              className="py-4"
              onMouseEnter={() => setActiveDropdown('pricing')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'pricing' ? null : 'pricing')}
                className={`flex items-center gap-1 py-1 transition-colors cursor-pointer ${activeDropdown === 'pricing' ? 'text-emerald-700' : 'hover:text-emerald-700'}`}
              >
                <span>Pricing</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'pricing' ? 'rotate-180 text-emerald-600' : 'text-gray-500'}`} />
              </button>

              {/* Mega Dropdown Box */}
              {activeDropdown === 'pricing' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[820px] max-w-[95vw] bg-[#dbf5e7] rounded-3xl border border-emerald-600/20 shadow-2xl p-7 sm:p-8 animate-in fade-in slide-in-from-top-2 duration-200 text-left z-50 text-[#0d2e27]">
                  <div className="grid grid-cols-12 gap-8 items-start">
                    
                    {/* Left Promo Area */}
                    <div className="col-span-5 pr-2 space-y-3.5">
                      <div className="space-y-1.5">
                        <h3 className="font-display font-black text-xl text-[#0d2e27]">
                          Anazk AI Pricing
                        </h3>
                        <p className="text-xs text-[#134237]/80 leading-relaxed font-semibold">
                          Pay only for what you use. Instant license key generation & lifetime credit validity.
                        </p>
                      </div>

                      <button 
                        onClick={() => scrollToSection('pricing')}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-[#0d2e27] hover:text-emerald-700 transition-colors pt-2 group cursor-pointer"
                      >
                        <span>View Full Pricing</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* Right Columns with Divider */}
                    <div className="col-span-7 border-l border-[#0d2e27]/15 pl-8 grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-black text-[#0d2e27] uppercase tracking-wider mb-3.5">
                          Credit Packages
                        </h4>
                        <ul className="space-y-3 text-xs font-bold text-[#134237]">
                          <li>
                            <button onClick={() => scrollToSection('pricing')} className="hover:text-emerald-800 block text-left cursor-pointer">
                              <span className="font-black text-[#0d2e27]">Starter Session</span> — <span className="text-emerald-800 font-black">₹259</span>
                              <span className="block text-[11px] text-[#134237]/75 font-medium">150 Minutes Validity</span>
                            </button>
                          </li>
                          <li>
                            <button onClick={() => scrollToSection('pricing')} className="hover:text-emerald-800 block text-left cursor-pointer">
                              <span className="font-black text-[#0d2e27]">Standard Pack</span> — <span className="text-emerald-800 font-black">₹500</span>
                              <span className="block text-[11px] text-[#134237]/75 font-medium">350 Minutes • Popular</span>
                            </button>
                          </li>
                          <li>
                            <button onClick={() => scrollToSection('pricing')} className="hover:text-emerald-800 block text-left cursor-pointer">
                              <span className="font-black text-[#0d2e27]">Power Pack</span> — <span className="text-emerald-800 font-black">₹2,500</span>
                              <span className="block text-[11px] text-[#134237]/75 font-medium">2,000 Minutes Full Access</span>
                            </button>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-[#0d2e27] uppercase tracking-wider mb-3.5">
                          Included Benefits
                        </h4>
                        <ul className="space-y-2 text-xs font-bold text-[#134237]">
                          <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-700 shrink-0" /> 100% Screen Share Invisible</li>
                          <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-700 shrink-0" /> Whisper Speech Transcription</li>
                          <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-700 shrink-0" /> OCR Code Problem Solve</li>
                          <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-700 shrink-0" /> Instant Key On Screen</li>
                          <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-700 shrink-0" /> Unused Minutes Never Expire</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* 3. Others Mega Menu */}
            <div 
              className="py-4"
              onMouseEnter={() => setActiveDropdown('others')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'others' ? null : 'others')}
                className={`flex items-center gap-1 py-1 transition-colors cursor-pointer ${activeDropdown === 'others' ? 'text-emerald-700' : 'hover:text-emerald-700'}`}
              >
                <span>Others</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'others' ? 'rotate-180 text-emerald-600' : 'text-gray-500'}`} />
              </button>

              {/* Mega Dropdown Box (Exact GirGit AI Screenshot Style) */}
              {activeDropdown === 'others' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[820px] max-w-[95vw] bg-[#dbf5e7] rounded-3xl border border-emerald-600/20 shadow-2xl p-7 sm:p-8 animate-in fade-in slide-in-from-top-2 duration-200 text-left z-50 text-[#0d2e27]">
                  <div className="grid grid-cols-12 gap-8 items-start">
                    
                    {/* Left Promo Area */}
                    <div className="col-span-5 pr-2 space-y-3.5">
                      <div className="space-y-1.5">
                        <h3 className="font-display font-black text-xl text-[#0d2e27]">
                          More from Anazk AI
                        </h3>
                        <p className="text-xs text-[#134237]/80 leading-relaxed font-semibold">
                          Company info, contact, FAQs, and the legal details — everything else in one place.
                        </p>
                      </div>

                      <a 
                        href="mailto:supportanazkai@gmail.com" 
                        className="inline-flex items-center gap-1.5 text-xs font-black text-[#0d2e27] hover:text-emerald-700 transition-colors pt-2 group"
                      >
                        <span>Know More</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>

                    {/* Right Columns with Divider */}
                    <div className="col-span-7 border-l border-[#0d2e27]/15 pl-8 grid grid-cols-2 gap-6">
                      
                      {/* Column 1: Company */}
                      <div>
                        <h4 className="text-xs font-black text-[#0d2e27] uppercase tracking-wider mb-3.5">
                          Company
                        </h4>
                        <ul className="space-y-2.5 text-xs font-bold text-[#134237]">
                          <li>
                            <button 
                              onClick={() => {
                                setActiveDropdown(null);
                                setMentorStep(1);
                                setMentorError('');
                                setShowMentorModal(true);
                              }}
                              className="hover:text-emerald-800 hover:underline block text-left cursor-pointer"
                            >
                              About & Mentorship
                            </button>
                          </li>
                          <li>
                            <a 
                              href="mailto:supportanazkai@gmail.com" 
                              onClick={() => setActiveDropdown(null)}
                              className="hover:text-emerald-800 hover:underline block"
                            >
                              Contact Support
                            </a>
                          </li>
                          <li>
                            <button onClick={() => scrollToSection('faq')} className="hover:text-emerald-800 hover:underline block text-left cursor-pointer">
                              FAQs
                            </button>
                          </li>
                          <li>
                            <button onClick={() => scrollToSection('reviews')} className="hover:text-emerald-800 hover:underline block text-left cursor-pointer">
                              Reviews & Testimonials
                            </button>
                          </li>
                        </ul>
                      </div>

                      {/* Column 2: Legal & Download */}
                      <div>
                        <h4 className="text-xs font-black text-[#0d2e27] uppercase tracking-wider mb-3.5">
                          Legal & Download
                        </h4>
                        <ul className="space-y-2.5 text-xs font-bold text-[#134237]">
                          <li>
                            <button 
                              onClick={() => { setActiveDropdown(null); setShowTermsModal(true); }}
                              className="hover:text-emerald-800 hover:underline block text-left cursor-pointer"
                            >
                              Terms & Condition
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => { setActiveDropdown(null); setShowPrivacyModal(true); }}
                              className="hover:text-emerald-800 hover:underline block text-left cursor-pointer"
                            >
                              Privacy Policy
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => { setActiveDropdown(null); setShowRefundModal(true); }}
                              className="hover:text-emerald-800 hover:underline block text-left cursor-pointer"
                            >
                              Refund Policy
                            </button>
                          </li>
                          <li>
                            <a 
                              href="https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI.Setup.1.0.0.exe" 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={() => setActiveDropdown(null)} 
                              className="hover:text-emerald-800 hover:underline block"
                            >
                              Download App (Windows)
                            </a>
                          </li>
                          <li>
                            <a 
                              href="https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI-1.0.0-arm64.dmg" 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={() => setActiveDropdown(null)} 
                              className="hover:text-emerald-800 hover:underline block"
                            >
                              Download App (macOS)
                            </a>
                          </li>
                        </ul>
                      </div>

                    </div>

                  </div>
                </div>
              )}
            </div>

          </nav>

          {/* Right: Download + Sign in */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Download Button */}
            <a 
              href={getDownloadLink()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 border border-emerald-600/30 bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-900 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
            >
              <Download size={14} className="text-emerald-800" />
              <span>{isMacUser() ? "Download for Mac" : "Download for Windows"}</span>
            </a>

            {user ? (
              <button 
                onClick={() => supabase.auth.signOut()}
                className="px-3.5 py-2 border border-emerald-500/20 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <User size={14} />
                <span>Sign out</span>
              </button>
            ) : (
              <button 
                onClick={() => setCurrentView('auth')}
                className="px-5 py-2 bg-[#0d2e27] hover:bg-emerald-950 text-white font-black text-xs sm:text-sm rounded-lg transition-all shadow-xs flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
              >
                <span>Sign in</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <a 
              href={getDownloadLink()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 border border-emerald-600/30 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-black flex items-center gap-1"
            >
              <Download size={12} />
              <span>{isMacUser() ? "App (dmg)" : "App (exe)"}</span>
            </a>
            {user ? (
              <button 
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-1.5 bg-[#0d2e27] text-white font-black text-xs rounded-lg cursor-pointer"
              >
                Sign out
              </button>
            ) : (
              <button 
                onClick={() => setCurrentView('auth')}
                className="px-3 py-1.5 bg-[#0d2e27] text-white font-black text-xs rounded-lg"
              >
                Sign in
              </button>
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#0d2e27] hover:bg-emerald-100/50 rounded-lg transition-all"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-20 bg-white/98 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-5 shadow-2xl z-50 md:hidden flex flex-col space-y-3 animate-in fade-in slide-in-from-top-5 duration-200 max-h-[80vh] overflow-y-auto text-left text-sm font-bold text-gray-800">
          
          {/* AI Interview Assistant Accordion */}
          <div className="border-b border-gray-100 pb-2">
            <button 
              onClick={() => setNavMobileAssistant(!navMobileAssistant)}
              className="w-full flex items-center justify-between py-1 text-left font-black text-[#0d2e27]"
            >
              <span>AI Interview Assistant</span>
              <ChevronDown size={16} className={`transition-transform ${navMobileAssistant ? 'rotate-180' : ''}`} />
            </button>
            {navMobileAssistant && (
              <div className="pl-3 pt-2 space-y-2 text-xs font-semibold text-gray-600">
                <button onClick={() => scrollToSection('top')} className="block py-1 text-left w-full">Overview & Demo</button>
                <button onClick={() => scrollToSection('features')} className="block py-1 text-left w-full">Features</button>
                <button onClick={() => scrollToSection('industries')} className="block py-1 text-left w-full">All Industries</button>
                <button onClick={() => scrollToSection('privacy')} className="block py-1 text-left w-full">Invisible Overlay</button>
                <button onClick={() => scrollToSection('why-anazk')} className="block py-1 text-left w-full">Why Anazk AI</button>
              </div>
            )}
          </div>

          {/* Pricing Accordion */}
          <div className="border-b border-gray-100 pb-2">
            <button 
              onClick={() => setNavMobilePricing(!navMobilePricing)}
              className="w-full flex items-center justify-between py-1 text-left font-black text-[#0d2e27]"
            >
              <span>Pricing & Plans</span>
              <ChevronDown size={16} className={`transition-transform ${navMobilePricing ? 'rotate-180' : ''}`} />
            </button>
            {navMobilePricing && (
              <div className="pl-3 pt-2 space-y-2 text-xs font-semibold text-gray-600">
                <button onClick={() => scrollToSection('pricing')} className="block py-1 text-emerald-800 font-bold text-left w-full">
                  Starter Session (₹259 • 150 Mins)
                </button>
                <button onClick={() => scrollToSection('pricing')} className="block py-1 text-emerald-800 font-bold text-left w-full">
                  Standard Pack (₹500 • 350 Mins)
                </button>
                <button onClick={() => scrollToSection('pricing')} className="block py-1 text-emerald-800 font-bold text-left w-full">
                  Power Pack (₹2,500 • 2000 Mins)
                </button>
              </div>
            )}
          </div>

          {/* Others Accordion */}
          <div className="border-b border-gray-100 pb-2">
            <button 
              onClick={() => setNavMobileOthers(!navMobileOthers)}
              className="w-full flex items-center justify-between py-1 text-left font-black text-[#0d2e27]"
            >
              <span>Others</span>
              <ChevronDown size={16} className={`transition-transform ${navMobileOthers ? 'rotate-180' : ''}`} />
            </button>
            {navMobileOthers && (
              <div className="pl-3 pt-2 space-y-2 text-xs font-semibold text-gray-600">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMentorStep(1);
                    setMentorError('');
                    setShowMentorModal(true);
                  }}
                  className="block py-1 text-emerald-700 font-bold text-left w-full cursor-pointer"
                >
                  1-on-1 Personal Guidance (₹500)
                </button>
                <button onClick={() => scrollToSection('reviews')} className="block py-1 text-left w-full">Reviews & Testimonials</button>
                <button onClick={() => scrollToSection('faq')} className="block py-1 text-left w-full">FAQs</button>
                <a href="mailto:supportanazkai@gmail.com" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-emerald-700 font-bold">Support (supportanazkai@gmail.com)</a>
                <button onClick={() => { setMobileMenuOpen(false); setShowTermsModal(true); }} className="block py-1 text-left w-full">Terms & Conditions</button>
                <button onClick={() => { setMobileMenuOpen(false); setShowPrivacyModal(true); }} className="block py-1 text-left w-full">Privacy Policy</button>
                <button onClick={() => { setMobileMenuOpen(false); setShowRefundModal(true); }} className="block py-1 text-left w-full">Refund Policy</button>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col space-y-2">
            <a 
              href={getDownloadLink()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              <span>{isMacUser() ? "Download Desktop App (.dmg)" : "Download Desktop App (.exe)"}</span>
            </a>
            {user ? (
              <button 
                onClick={async () => { 
                  setMobileMenuOpen(false); 
                  await supabase.auth.signOut();
                  setUser(null);
                  setCurrentView('landing'); 
                }}
                className="w-full py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <User size={14} />
                <span>Sign out</span>
              </button>
            ) : (
              <button 
                onClick={() => { setMobileMenuOpen(false); setCurrentView('auth'); }}
                className="w-full py-2.5 bg-[#0d2e27] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Sign in</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

        </div>
      )}

      {/* Hero Section */}
      <header id="top" className="min-h-screen pt-24 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-8 lg:px-16 w-full max-w-[1480px] mx-auto flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
         {/* Hero Left Content */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-7 text-left pl-0 pr-0 sm:pr-2">
          
          <h1 className={`font-display font-black text-[30px] xs:text-[36px] sm:text-[50px] lg:text-[66px] leading-[1.12] tracking-tight transition-colors duration-700 ${activeTab === 'coding' ? 'text-white' : 'text-[#0d2e27]'}`}>
            The calm advantage for high-stakes interviews
          </h1>

          <p className={`text-sm sm:text-[18px] lg:text-[20px] max-w-2xl font-semibold leading-relaxed transition-colors duration-700 ${activeTab === 'coding' ? 'text-gray-400' : 'text-gray-650'}`}>
            Stay present in the conversation while Anazk AI turns every question into clear, private guidance for coding, technical, behavioral, and system design interviews.
          </p>


          {/* 100% Private & Undetectable note */}
          <div className="pt-4 sm:pt-6 border-t border-sky-500/15 flex items-start gap-3 justify-start text-left">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Shield size={16} />
            </div>
            <div className="text-xs font-medium text-left">
              <span className={`block font-black text-xs sm:text-sm transition-colors duration-700 ${activeTab === 'coding' ? 'text-gray-200' : 'text-slate-800'}`}>100% Private & Undetectable</span>
              <span className="mt-1 block max-w-sm leading-relaxed text-slate-500 text-[11px] sm:text-xs">Invisible during screen sharing on Zoom, Meet, and Microsoft Teams.</span>
            </div>
          </div>
        </div>
             {/* Hero Right - Interactive Mockup Window */}
        <div className="lg:col-span-7 flex flex-col items-center relative select-none w-full">
          
          {/* Window Tabs (Floating above mockup container) */}
          <div className={`flex justify-center border p-1 sm:p-1.5 rounded-full shadow-md relative z-20 -mb-4 sm:-mb-5 transition-colors duration-700 ${activeTab === 'coding' ? 'bg-slate-900 border-gray-700' : 'bg-white border-gray-250/60'}`}>
            <button 
              onClick={() => setActiveTab('non-coding')}
              className={`flex items-center gap-1.5 px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${activeTab === 'non-coding' ? 'bg-[#0d2e27] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Non-Coding
            </button>
            <button 
              onClick={() => setActiveTab('coding')}
              className={`flex items-center gap-1.5 px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${activeTab === 'coding' ? 'bg-[#0d2e27] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Coding
            </button>
          </div>

          {/* Window Mockup Outer Container */}
          <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 border border-gray-200 shadow-2xl relative pt-8 sm:pt-9">
            {/* Window Dots (macOS style) */}
            <div className="absolute top-3.5 sm:top-4 left-4 sm:left-6 flex space-x-1.5">
              <span className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-[#ff5f56] rounded-full inline-block"></span>
              <span className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-[#ffbd2e] rounded-full inline-block"></span>
              <span className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-[#27c93f] rounded-full inline-block"></span>
            </div>

            {/* Window Content Area */}
            <div className="p-3 sm:p-5 md:p-6 bg-[#f8fafc] rounded-b-2xl sm:rounded-b-3xl min-h-fit text-left font-mono relative overflow-hidden">
              {activeTab === 'non-coding' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch font-sans">
                  
                  {/* Left Column: Clean Video Player */}
                  <div className="lg:col-span-7 bg-black rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-md flex items-center justify-center overflow-hidden relative group min-h-[260px] sm:min-h-[380px] lg:min-h-[440px]">
                    <video
                      src="/hero-video.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl bg-black"
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
                  <div className="lg:col-span-5 bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-md p-4 sm:p-5 flex flex-col justify-between space-y-3.5 text-left min-h-[300px] sm:min-h-[380px] lg:min-h-[440px]">
                    <div>
                      <div className="flex justify-between items-center pb-2.5 border-b border-gray-150">
                        <span className="text-[11px] text-[#0d2e27] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-emerald-600" />
                          AI Smart Response
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                          <span>AutoScroll</span>
                          <span className="w-5 h-3 bg-[#10b981] rounded-full inline-block relative p-0.5">
                            <span className="w-2 h-2 bg-white rounded-full block float-right"></span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2.5 text-[11px] text-gray-800 leading-relaxed font-sans pt-2.5 overflow-y-auto max-h-[200px] sm:max-h-[240px] no-scrollbar">
                        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-2.5">
                          <span className="block text-emerald-800 font-bold text-[10px] uppercase mb-0.5">💡 Question Detected</span>
                          <p className="font-extrabold text-[#0d2e27] text-[11px]">What are the core advantages of microservices architecture?</p>
                        </div>

                        <div className="space-y-1 pl-0.5 text-gray-700 font-medium">
                          <p className="text-emerald-700 font-extrabold text-[10px] sm:text-[11px]">⭐ Recommended Talking Points:</p>
                          <ul className="space-y-1 pl-3 text-gray-600 list-disc text-[10px]">
                            <li><strong>Independent Scalability:</strong> Scale high-load services independently.</li>
                            <li><strong>Fault Isolation:</strong> Failure in one service doesn&apos;t bring down everything.</li>
                            <li><strong>Tech Stack Flexibility:</strong> Different teams can use optimal tools.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Pro Tip Card */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 text-emerald-900 p-2.5 rounded-xl text-[10px] leading-relaxed font-medium">
                      🎯 <strong>Stealth guidance:</strong> Anazk AI listens silently and displays talking points in real-time.
                    </div>

                    {/* Action Controls */}
                    <div className="pt-2 border-t border-gray-150 flex items-center justify-between gap-2">
                      <button className="px-3 sm:px-4 py-2 bg-[#0d2e27] hover:bg-emerald-900 text-white font-bold text-[10px] rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                        <Sparkles size={12} />
                        Next Point
                      </button>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold">
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 size={12} /> Ready
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch font-sans">
                  {/* Left panel: Code captured */}
                  <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/60 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="border-b border-gray-100 pb-2">
                      <span className="block text-[10px] text-teal-600 font-black uppercase tracking-wider mb-1">🖥️ captured coding task</span>
                      <p className="text-[#0d2e27] font-mono text-[10px] font-bold leading-relaxed">{codingProblem.question}</p>
                    </div>
                    <pre className="bg-gray-50 border border-gray-100 p-2.5 sm:p-3 rounded-xl text-emerald-800 font-mono leading-relaxed text-[9px] overflow-x-auto max-h-[160px] sm:max-h-[180px] no-scrollbar">{simulatedCode || '// loading code context...'}</pre>
                  </div>

                  {/* Right panel: Solution output */}
                  <div className="bg-[#f1f5f9] rounded-xl sm:rounded-2xl border border-gray-200/60 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="border-b border-gray-250 pb-2">
                      <span className="block text-[10px] text-emerald-600 font-black uppercase tracking-wider">🤖 AI Solutions (Java)</span>
                    </div>
                    <pre className="text-gray-700 font-mono text-[9px] leading-relaxed overflow-x-auto max-h-[140px] sm:max-h-[160px] no-scrollbar whitespace-pre">{simulatedSolution}</pre>
                    <div className="pt-2 border-t border-gray-200 flex justify-end">
                      <button onClick={() => {}} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg transition-all shadow-sm">
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
    </header>



      {/* Why Anazk AI Showcase Section */}
      <section id="why-anazk" className="py-20 px-6 sm:px-10 lg:px-16 w-full max-w-[1320px] mx-auto space-y-28">
        
        {/* Section Heading */}
        <div className="text-center">
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-[#0d2e27] tracking-tight">
            Why Anazk AI?
          </h2>
        </div>

        {/* 1. Job-Winning Interview Answers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest block">
              WHY ANAZK AI
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-gray-900 leading-tight">
              Job-Winning Interview Answers
            </h3>
            <p className="text-gray-600 font-medium text-sm sm:text-base leading-relaxed max-w-lg">
              Understand the true intent behind interview questions with advanced AI insights.
            </p>
          </div>

          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[260px] p-6 rounded-3xl bg-gradient-to-br from-blue-50/40 via-white to-emerald-50/30 border border-gray-100 shadow-sm overflow-hidden">
            {/* Floating Insight Badges */}
            <div className="w-full max-w-lg relative flex flex-wrap gap-3.5 items-center justify-center p-4">
              <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-md border border-emerald-500/20 text-sm sm:text-base font-extrabold text-[#0d2e27] flex items-center gap-2.5 transform hover:scale-105 transition-all">
                <MessageSquare size={18} className="text-emerald-600" />
                <span>Word Choices</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-md border border-blue-500/20 text-sm sm:text-base font-extrabold text-[#0d2e27] flex items-center gap-2.5 transform hover:scale-105 transition-all">
                <Volume2 size={18} className="text-blue-600" />
                <span>Tone</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-md border border-amber-500/20 text-sm sm:text-base font-extrabold text-[#0d2e27] flex items-center gap-2.5 transform hover:scale-105 transition-all">
                <Clock size={18} className="text-amber-600" />
                <span>Timing</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-md border border-indigo-500/20 text-sm sm:text-base font-extrabold text-[#0d2e27] flex items-center gap-2.5 transform hover:scale-105 transition-all">
                <FileText size={18} className="text-indigo-600" />
                <span>Context</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-md border border-teal-500/20 text-sm sm:text-base font-extrabold text-[#0d2e27] flex items-center gap-2.5 transform hover:scale-105 transition-all">
                <Tag size={18} className="text-teal-600" />
                <span>Keyword</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-md border border-purple-500/20 text-sm sm:text-base font-extrabold text-[#0d2e27] flex items-center gap-2.5 transform hover:scale-105 transition-all">
                <Sliders size={18} className="text-purple-600" />
                <span>Formality Level</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Effortless interaction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-4 text-left order-1 lg:order-1">
            <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest block">
              WHY ANAZK AI
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-gray-900 leading-tight">
              Effortless interaction
            </h3>
            <p className="text-gray-600 font-medium text-sm sm:text-base leading-relaxed max-w-lg">
              Enjoy a 100% hands-free experience with no awkward pauses that allows you to focus entirely on your interview.
            </p>
          </div>

          <div className="lg:col-span-6 relative flex flex-col justify-center min-h-[260px] p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-gray-50/50 via-white to-blue-50/20 border border-gray-100 shadow-sm order-2 lg:order-2 space-y-4 text-left">
            {/* Listening prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Listening to interviewer...</span>
              </div>
              <div className="inline-block bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-sm text-xs sm:text-sm font-bold text-gray-800">
                What's your biggest strength?
              </div>
            </div>

            {/* Generating response */}
            <div className="space-y-1.5 pl-4 sm:pl-8">
              <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Generating answer...</span>
              </div>
              <div className="bg-white border border-emerald-500/20 px-5 py-4 rounded-2xl shadow-md text-xs sm:text-sm font-medium text-gray-700 leading-relaxed border-l-4 border-l-emerald-500">
                My biggest strength is architecting scalable backend systems and debugging high-throughput microservices. In my previous role, I identified an N+1 database bottleneck in our core API, optimized it with Redis caching and asynchronous queues, which reduced p99 latency by 70% and handled 10x traffic spikes with zero downtime.
              </div>
            </div>
          </div>
        </div>

        {/* 3. Robust Privacy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest block">
              WHY ANAZK AI
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-gray-900 leading-tight">
              Robust Privacy
            </h3>
            <p className="text-gray-600 font-medium text-sm sm:text-base leading-relaxed max-w-lg">
              Fully undetectable and unnoticeable by interviewers across all types of interviews.
            </p>
          </div>

          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[300px] p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-gray-900 to-[#071d18] border border-emerald-500/20 shadow-xl overflow-hidden text-left">
            {/* Realistic Screen-Share Stealth Mockup */}
            <div className="w-full max-w-lg bg-[#0b1411] rounded-2xl border border-emerald-500/30 p-4 space-y-3.5 shadow-2xl">
              
              {/* Screen Share Status Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-gray-200 font-bold">Screen Sharing on Zoom / Meet</span>
                </div>
                <span className="bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  Live Feed
                </span>
              </div>

              {/* Two Screen Comparison (Interviewer vs You) */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* 1. What Interviewer Sees */}
                <div className="bg-black/60 rounded-xl border border-white/10 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400 font-bold">Interviewer Screen</span>
                    <span className="text-emerald-400 font-bold text-[9px]">Clean 100%</span>
                  </div>
                  <div className="bg-gray-900/90 rounded-lg p-2 space-y-1 font-mono text-[9px] text-gray-400">
                    <div className="w-16 h-1.5 bg-gray-700 rounded"></div>
                    <div className="w-24 h-1.5 bg-gray-800 rounded"></div>
                    <div className="w-20 h-1.5 bg-gray-800 rounded"></div>
                  </div>
                  <span className="block text-[9px] text-gray-400 font-medium text-center">
                    No overlay visible
                  </span>
                </div>

                {/* 2. What Candidate Sees */}
                <div className="bg-emerald-950/40 rounded-xl border border-emerald-500/40 p-3 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-300 font-bold">Your Screen</span>
                    <span className="text-emerald-400 font-bold text-[9px]">Active</span>
                  </div>
                  <div className="bg-black/80 rounded-lg p-2 border border-emerald-500/30 space-y-1 text-[9px] text-emerald-300 font-mono">
                    <span className="text-[8px] text-emerald-400 font-bold block">⚡ Instant Solution</span>
                    <span className="text-gray-300 block text-[9px] truncate">Use Token Bucket algorithm</span>
                  </div>
                  <span className="block text-[9px] text-emerald-400 font-bold text-center">
                    Invisible Overlay Active
                  </span>
                </div>

              </div>

              {/* Bottom Hardware Layer Protection Badge */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-300">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Hardware-Level Capture Bypass
                </span>
                <span className="text-gray-400 font-mono">100% Undetectable</span>
              </div>

            </div>
          </div>
        </div>

        {/* 4. Personalized Experience */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-4 text-left order-1 lg:order-1">
            <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest block">
              WHY ANAZK AI
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-gray-900 leading-tight">
              Personalized Experience
            </h3>
            <p className="text-gray-600 font-medium text-sm sm:text-base leading-relaxed max-w-lg">
              Receive answers tailored to your job role, resume, and personal stories for a truly customized interview experience.
            </p>
          </div>

          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[260px] p-6 rounded-3xl bg-gradient-to-br from-emerald-50/30 via-white to-blue-50/20 border border-gray-100 shadow-sm order-2 lg:order-2">
            {/* Resume Upload Box Mockup */}
            <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200/80 shadow-lg p-5 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-gray-900">Upload your resume</span>
                <span className="text-gray-400 text-xs cursor-pointer">✕</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium leading-tight">
                We will use your professional background and skills to tailor interview answers specifically for you.
              </p>
              
              <div className="border-2 border-dashed border-blue-400/60 rounded-xl p-6 flex flex-col items-center justify-center bg-blue-50/20">
                <div className="text-xs text-gray-400 font-semibold">Drop file here or browse</div>
              </div>

              {/* Floating resume pill */}
              <div className="absolute -bottom-2 -right-2 bg-white px-3.5 py-1.5 rounded-full shadow-md border border-emerald-500/20 text-[11px] font-bold text-gray-800 flex items-center gap-2">
                <FileText size={14} className="text-blue-600" />
                <span>Resume_24.pdf</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Main Features Grid */}
      <section id="features" className="py-16 px-6 sm:px-10 lg:px-16 w-full max-w-[1480px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Card 1: Coding Support */}
        <div className="md:col-span-7 bg-white rounded-3xl p-8 border border-emerald-500/5 shadow-[0_10px_40px_rgba(16,185,129,0.02)] space-y-6 flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div className="space-y-4">
            <span className="inline-block bg-teal-50 text-teal-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-200">
              Programming
            </span>
            <h3 className="font-display font-black text-2xl text-[#0d2e27]">
              Full Coding Interview Support
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Use Anazk AI for advanced tech assessments. It listens to coding discussions or captures the screen coordinates to read LeetCode-style descriptions, generating highly optimized solutions on the fly.
            </p>
          </div>
          <div className="bg-[#0b1227] rounded-2xl p-4 border border-white/5 font-mono text-[10px] text-gray-300">
            <div className="flex justify-between items-center text-gray-500 pb-2 border-b border-white/5 mb-3">
              <span>javascript.js</span>
              <Copy size={12} className="hover:text-white cursor-pointer" />
            </div>
            <pre className="text-emerald-400 font-mono overflow-x-auto">
{`function generatePrimes(limit) {
  if (limit < 2) return [];
  const sieve = new Array(limit + 1).fill(true);
  sieve[0] = sieve[1] = false;
  
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) {
        sieve[j] = false;
      }
    }
  }
  return sieve.map((p, i) => p ? i : null).filter(Boolean);
}`}
            </pre>
          </div>
        </div>

        {/* Card 2: Voice Transcription */}
        <div className="md:col-span-5 bg-white rounded-3xl p-8 border border-emerald-500/5 shadow-[0_10px_40px_rgba(16,185,129,0.02)] space-y-6 flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div className="space-y-4">
            <span className="inline-block bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200">
              Speech Recognition
            </span>
            <h3 className="font-display font-black text-2xl text-[#0d2e27]">
              Blazing Fast Transcription
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Equipped with Whisper large-v3 models. Translates any question asked vocally by the interviewer with precision, handling accents, noise, and fast speech smoothly.
            </p>
          </div>
          
          {/* Animated voice wave mock */}
          <div className="bg-[#0b1227] p-5 rounded-2xl border border-white/5 flex flex-col space-y-3 justify-center items-center">
            <div className="flex items-center space-x-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 w-full">
              <div className="p-1.5 rounded-full bg-emerald-500 text-white">
                <Mic size={14} />
              </div>
              <div className="flex-1">
                <span className="block text-[8px] text-gray-500 font-extrabold uppercase">Rob Parsley (Interviewer)</span>
                <span className="text-[10px] text-white font-mono">&quot;Can you write a JS function...&quot;</span>
              </div>
            </div>
            {/* Audio wave lines */}
            <div className="flex items-center gap-1.5 h-10">
              <span className="w-1.5 bg-emerald-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1.5 bg-emerald-400 rounded-full animate-sound-wave" style={{ animationDelay: '0.3s' }}></span>
              <span className="w-1.5 bg-emerald-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.5s' }}></span>
              <span className="w-1.5 bg-emerald-600 rounded-full animate-sound-wave" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 bg-teal-400 rounded-full animate-sound-wave" style={{ animationDelay: '0.4s' }}></span>
              <span className="w-1.5 bg-emerald-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.6s' }}></span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Stealth & Undetectability */}
      <section id="privacy" className="py-20 bg-[#0d2e27] text-white px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Split top: info text & short details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 px-3.5 py-1 rounded-full text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
                <Lock size={12} />
                Stealth Mode
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl leading-tight">
                100% Private and Undetectable
              </h2>
              <p className="text-emerald-100/80 text-base leading-relaxed font-medium">
                Anazk AI runs natively on your system and intercepts window draw calls. This ensures that the assistant overlay is invisible to all screen recorders, browsers, and screensharing software.
              </p>
            </div>

            <div className="lg:col-span-5 bg-white/5 rounded-3xl p-6 border border-white/10 space-y-3.5 text-sm text-gray-300 font-semibold">
              <div className="flex items-center gap-2.5">
                <Check size={16} className="text-emerald-400" />
                <span>Invisible on Screen Share (Zoom, Meet, Teams, Discord)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check size={16} className="text-emerald-400" />
                <span>Invisible in System Dock / Taskbar</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check size={16} className="text-emerald-400" />
                <span>Invisible in Task Manager process listings</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check size={16} className="text-emerald-400" />
                <span>Bypass Browser Tab/Focus switching detections</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── WORKS FOR ALL INDUSTRIES (IMAGE 2 REPLACEMENT) ─── */}
      <section id="industries" className="py-20 sm:py-24 bg-[#0a1210] text-white px-4 sm:px-8 border-y border-emerald-500/20 relative overflow-hidden">
        {/* Glow ambient backdrops */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-12 relative z-10 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Heading, Industry Pills, & Link */}
            <div className="lg:col-span-5 space-y-7">
              <div className="space-y-3.5">
                <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-widest block">
                  Tailored Copilot
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
                  Works For All Industries
                </h2>
                <p className="text-gray-300 font-medium text-sm sm:text-base leading-relaxed">
                  From first application to final offer, <span className="text-emerald-400 font-bold">Anazk AI</span> empowers job seekers to succeed, faster, smarter, and with confidence.
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
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{ind.icon}</span>
                      <span>{ind.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>View interview guides for every role</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Column: High-Res Interactive Laptop / Video Call Mockup */}
            <div className="lg:col-span-7 relative">
              
              {/* Laptop Shell Container */}
              <div className="bg-[#111c18] rounded-3xl border border-emerald-500/25 p-3 sm:p-4 shadow-2xl space-y-3 relative overflow-hidden backdrop-blur-xl">
                
                {/* Top Google Meet Browser Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-black/60 rounded-xl border border-white/10 text-[11px] text-gray-400 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-red-500/80 rounded-full inline-block"></span>
                      <span className="w-2.5 h-2.5 bg-yellow-500/80 rounded-full inline-block"></span>
                      <span className="w-2.5 h-2.5 bg-green-500/80 rounded-full inline-block"></span>
                    </div>
                    <span className="text-gray-300 font-semibold truncate ml-1">meet.google.com/anazk-interview</span>
                  </div>
                  <span className="text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px]">
                    100% STEALTH ACTIVE
                  </span>
                </div>

                {/* Main Video Call Area (Split Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[220px] sm:min-h-[250px]">
                  
                  {/* Interviewer Video Feed */}
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 p-3 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="flex justify-between items-start z-10">
                      <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Interviewer (Hiring Team)
                      </span>
                    </div>

                    <div className="my-auto text-center py-4 z-10">
                      <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 mx-auto flex items-center justify-center font-black text-lg mb-2 shadow-inner">
                        HR
                      </div>
                      <p className="text-xs text-gray-300 italic max-w-[200px] mx-auto font-medium">
                        "{industryProfiles[selectedIndustry]?.question}"
                      </p>
                    </div>

                    <div className="text-[10px] text-gray-400 z-10 flex items-center justify-between">
                      <span>Live Audio Stream</span>
                      <span className="text-emerald-400 font-mono font-bold">Whisper AI ⚡ 180ms</span>
                    </div>
                  </div>

                  {/* Candidate Feed (You) */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-[#071d18] rounded-2xl border border-emerald-500/30 p-3 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                      <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        You ({selectedIndustry} Candidate)
                      </span>
                    </div>

                    {/* Quiet Anazk AI Overlay Assistant Card */}
                    <div className="bg-black/85 backdrop-blur-md border border-emerald-400/40 p-3 rounded-xl shadow-lg my-auto z-10 text-left space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                        <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                          <Sparkles size={11} />
                          Anazk AI Speaking Points ({selectedIndustry})
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">Invisible Overlay</span>
                      </div>
                      <p className="text-[11px] text-gray-200 leading-relaxed font-medium whitespace-pre-line">
                        {industryProfiles[selectedIndustry]?.answer}
                      </p>
                    </div>

                    <div className="text-[10px] text-emerald-300/80 z-10 flex items-center justify-between">
                      <span>Screen share active</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span>Overlay: Hidden to Team</span>
                        <ShieldCheck size={12} className="text-emerald-400" />
                      </span>
                    </div>
                  </div>

                </div>

                {/* Bottom Call Controls Strip */}
                <div className="px-4 py-2.5 bg-black/70 rounded-xl border border-white/10 flex items-center justify-between text-xs text-gray-400">
                  <div className="font-mono text-[11px] text-gray-300 font-semibold">
                    1:35 PM | Anazk AI Protected Session
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">🎤</span>
                    <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">📹</span>
                    <span className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs">📞</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Real Stories From Real Interviews Section */}
      <section id="reviews" className="py-24 px-4 sm:px-6 bg-[#f0fbf5]/60 border-t border-emerald-500/10 overflow-hidden relative text-center">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Top Pill Badge */}
          <div>
            <span className="inline-block bg-[#15803d] text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-sm">
              Trusted By Candidates
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-3">
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-[#0d2e27] tracking-tight">
              Real Stories From <span className="text-[#15803d]">Real Interviews</span>
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
                      <h3 className="font-display font-black text-lg sm:text-xl text-[#15803d] mb-3">
                        {item.name}
                      </h3>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-medium mb-5 italic">
                        "{item.review}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex flex-col items-center">
                      <span className="text-[11px] font-bold text-gray-500 tracking-wide">
                        Verified Candidate
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[#10b981]">
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
                className={`transition-all rounded-full cursor-pointer ${activeReviewIndex === idx ? 'w-6 h-2 bg-[#15803d]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="inline-block bg-[#e6f4ea] text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest">
            Credits Only
          </span>
          <h2 className="font-display font-black text-4xl sm:text-[46px] text-[#0d2e27] tracking-tight">
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

        {/* Cards Frame */}
        <div className="max-w-5xl mx-auto w-full mt-8 sm:mt-12">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: 1 Hour for ₹259 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 hover:border-emerald-500/20 hover:shadow-xl shadow-sm space-y-5 sm:space-y-6 flex flex-col justify-between transition-all text-left">
              <div className="space-y-3 sm:space-y-4">
                <span className="block text-xs sm:text-sm font-extrabold text-emerald-600 uppercase tracking-wider">1 Hour Session</span>
                <div className="pt-1 sm:pt-2">
                  <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">₹259</span>
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
                  <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">₹500</span>
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
                  <span className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">₹2,500</span>
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
          </div>
        </div>
      </section>

      {/* Other Services: Your Complete Interview Success Toolkit */}
      <section id="mentor" className="py-24 px-4 sm:px-6 bg-gradient-to-b from-[#f0fbf5]/40 via-white to-[#f0fbf5]/30 border-t border-emerald-500/10 text-center">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Top Pill Badge */}
          <div>
            <span className="inline-block bg-[#064e3b] text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-sm">
              Other Services
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-3">
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-[#0d2e27] tracking-tight">
              Your Complete Interview Success <span className="text-[#10b981]">Toolkit</span>
            </h2>
            <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base max-w-2xl mx-auto">
              From AI interview assistance to expert career guidance, Anazk AI helps you succeed at every stage of the hiring process.
            </p>
          </div>

          {/* Center Personal Guidance Card */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm p-8 sm:p-10 rounded-3xl border border-emerald-500/20 shadow-xl space-y-6 text-center hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-display font-black text-lg sm:text-xl">
                <User size={20} className="text-emerald-600" />
                <span>Personal Guidance</span>
              </div>

              <p className="text-gray-600 font-semibold text-xs sm:text-sm max-w-md mx-auto">
                Get one-on-one career guidance from an expert mentor.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-gray-700 max-w-xs mx-auto text-left py-2">
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Resume Reviews</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Job Portal Optimization</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Interview Strategy</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
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
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-black text-sm shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-[0.98]"
                >
                  Talk to an expert
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="py-24 bg-gradient-to-tr from-[#edf9f3] to-white border-t border-emerald-500/5 px-6">
        <div className="max-w-4xl mx-auto space-y-12 text-left">
          <div className="text-center space-y-4">
            <span className="inline-block bg-teal-100 text-teal-800 border border-teal-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              FAQs
            </span>
            <h2 className="font-display font-black text-3xl text-[#0d2e27]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-emerald-500/5 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center font-bold text-gray-800 hover:text-emerald-600 transition-colors text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-6 pt-0 text-xs sm:text-sm text-gray-500 font-semibold border-t border-gray-50 bg-emerald-50/10 leading-relaxed animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-500/20 bg-[#edf9f3] px-6 sm:px-12 py-16 text-center">
        <div className="mx-auto max-w-[1320px] space-y-12">
          
          {/* Top Brand Logo & Tagline */}
          <div className="space-y-3 flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              <img src="/penguin.jpg" alt="Anazk AI Logo" className="w-10 h-10 rounded-2xl border-2 border-emerald-500/30 object-cover shadow-sm" />
              <span className="font-display text-2xl font-black tracking-tight text-[#0d2e27]">Anazk AI</span>
            </div>
            <p className="text-gray-600 font-semibold text-xs sm:text-sm max-w-xl mx-auto">
              Real-time AI interview copilot with an invisible overlay. Pay only for the minutes you use.
            </p>
          </div>

          {/* 4 Column Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 text-left pt-4 border-t border-emerald-500/10">
            
            {/* Col 1: AI Interview Assistant */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">AI Interview Assistant</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li><a href="#top" className="hover:text-emerald-600 transition-colors">Overview</a></li>
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Features</a></li>
                <li><a href="#privacy" className="hover:text-emerald-600 transition-colors">Invisible Overlay</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How To Use</a></li>
                <li><a href="#privacy" className="hover:text-emerald-600 transition-colors">Security & Privacy</a></li>
              </ul>
            </div>

            {/* Col 2: Get Started */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Get Started</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li><button onClick={() => setShowSignInModal(true)} className="hover:text-emerald-600 transition-colors text-left cursor-pointer">Free Trial</button></li>
                <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
                <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Cheapest</a></li>
                <li><a href="https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI.Setup.1.0.0.exe" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors">Download (Windows)</a></li>
                <li><a href="https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI-1.0.0-arm64.dmg" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors">Download (macOS)</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-600 transition-colors">Install</a></li>
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Comparison</a></li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Resources</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Blog</a></li>
                <li><a href="#reviews" className="hover:text-emerald-600 transition-colors">Authors</a></li>
                <li><a href="#faq" className="hover:text-emerald-600 transition-colors">FAQs</a></li>
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">About</a></li>
                <li><a href="mailto:supportanazkai@gmail.com" className="hover:text-emerald-600 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Legal</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li><button onClick={() => setShowTermsModal(true)} className="hover:text-emerald-600 transition-colors text-left cursor-pointer">Terms & Conditions</button></li>
                <li><button onClick={() => setShowPrivacyModal(true)} className="hover:text-emerald-600 transition-colors text-left cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => setShowRefundModal(true)} className="hover:text-emerald-600 transition-colors text-left cursor-pointer">Refund Policy</button></li>
                <li><button onClick={() => setShowTermsModal(true)} className="hover:text-emerald-600 transition-colors text-left cursor-pointer">Shipping & Delivery</button></li>
              </ul>
            </div>

          </div>

          {/* Social Icons Bar (Instagram, LinkedIn, Gmail SVG icons) */}
          <div className="flex items-center justify-center gap-6 pt-6 border-t border-emerald-500/10">
            {/* Instagram */}
            <a 
              href="https://www.instagram.com/anazk.ai?igsh=amg0bTJ3Y2M0ZGhq&igsi=amg0bTJ3Y2M0ZGhq&utm_source=qr" 
              target="_blank" 
              rel="noreferrer"
              className="w-12 h-12 rounded-full bg-white border border-emerald-200/60 hover:border-pink-500 hover:bg-pink-50 text-pink-600 flex items-center justify-center transition-all shadow-sm hover:scale-110 active:scale-95"
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
              className="w-12 h-12 rounded-full bg-white border border-emerald-200/60 hover:border-blue-600 hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-all shadow-sm hover:scale-110 active:scale-95"
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
              className="w-12 h-12 rounded-full bg-white border border-emerald-200/60 hover:border-red-500 hover:bg-red-50 text-red-500 flex items-center justify-center transition-all shadow-sm hover:scale-110 active:scale-95"
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
            <p className="text-emerald-700 font-extrabold">Made In India 🇮🇳</p>
          </div>

        </div>
      </footer>

      {/* Modals */}
      {/* 1. Sign In / Sign Up Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-[420px] w-full border border-emerald-500/15 shadow-[0_25px_70px_rgba(0,0,0,0.3)] relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-[#0d2e27] via-[#123e35] to-[#071d18] p-4 sm:p-6 text-white overflow-hidden shrink-0">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10">
                {/* Top Row with Branding and Close Button */}
                <div className="flex items-center justify-between pb-2 sm:pb-3">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <img 
                      src="/penguin.jpg" 
                      alt="Anazk AI Logo" 
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-emerald-400 object-cover shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                    />
                    <div>
                      <span className="font-display font-black text-base sm:text-lg tracking-tight text-white flex items-center">
                        Anazk<span className="text-emerald-400 ml-0.5">AI</span>
                      </span>
                      <span className="text-[10px] text-emerald-300 font-semibold block leading-none">Authentication</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setShowSignInModal(false); setAuthError(''); setAuthSuccess(''); }}
                    className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-full transition-all cursor-pointer"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Switcher Pill Tabs */}
                <div className="mt-2.5 sm:mt-3 grid grid-cols-2 p-1 bg-black/30 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setIsLoginMode(true); setAuthError(''); setAuthSuccess(''); }}
                    className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer text-center ${
                      isLoginMode 
                        ? 'bg-white text-[#0d2e27] shadow-md font-black' 
                        : 'text-gray-300 hover:text-white font-semibold'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLoginMode(false); setAuthError(''); setAuthSuccess(''); }}
                    className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer text-center ${
                      !isLoginMode 
                        ? 'bg-white text-[#0d2e27] shadow-md font-black' 
                        : 'text-gray-300 hover:text-white font-semibold'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              {authSuccess ? (
                <div className="py-4 sm:py-6 flex flex-col items-center gap-3 text-center animate-in fade-in zoom-in duration-200">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={28} className="text-emerald-600 sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="font-extrabold text-base sm:text-lg text-[#0d2e27]">Verification link sent!</h4>
                  <p className="text-gray-600 text-xs font-medium leading-relaxed max-w-xs">{authSuccess}</p>
                  <button
                    onClick={() => { setAuthSuccess(''); setIsLoginMode(true); }}
                    className="mt-2 sm:mt-3 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    Proceed to Sign In →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-3.5 sm:space-y-4">
                  {!isLoginMode && (
                    <div>
                      <label className="block text-[11px] font-black text-gray-600 uppercase tracking-wider mb-1">
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
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50/80 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 rounded-xl outline-none text-xs sm:text-sm font-semibold placeholder-gray-400 transition-all text-gray-800"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-black text-gray-600 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                      <input 
                        type="email" 
                        required
                        placeholder="you@example.com" 
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50/80 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 rounded-xl outline-none text-xs sm:text-sm font-semibold placeholder-gray-400 transition-all text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-black text-gray-600 uppercase tracking-wider">
                        Password
                      </label>
                      {isLoginMode && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!authEmail) {
                              setAuthError('Please enter your email address above first to reset your password.');
                            } else {
                              supabase.auth.resetPasswordForEmail(authEmail)
                                .then(() => setAuthSuccess('Password reset link sent to your email!'))
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
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-gray-50/80 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 rounded-xl outline-none text-xs sm:text-sm font-semibold placeholder-gray-400 transition-all text-gray-800"
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
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200/80 text-red-600 text-xs font-semibold p-2.5 sm:p-3 rounded-xl animate-in fade-in">
                      <X size={14} className="shrink-0 text-red-500" />
                      <span className="leading-snug">{authError}</span>
                    </div>
                  )}
                  
                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Authenticating...
                      </span>
                    ) : (
                      <>
                        {isLoginMode ? 'Sign In to Account' : 'Create Your Account'}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
              
              {!authSuccess && (
                <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-gray-100 flex flex-col items-center gap-2.5">
                  <div className="text-xs text-gray-500 font-semibold text-center">
                    {isLoginMode ? "Don't have an account yet? " : 'Already registered? '}
                    <button 
                      type="button"
                      onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); setAuthSuccess(''); }} 
                      className="text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer font-extrabold"
                    >
                      {isLoginMode ? 'Sign up free' : 'Sign in here'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-gray-400">
                    <Shield size={12} className="text-emerald-600 shrink-0" />
                    <span>Protected by 256-bit encryption</span>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                href="https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI.Setup.1.0.0.exe" 
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowDownloadModal(false)}
                className="w-full py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-between px-5 sm:px-6 font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🪟</span>
                  <div>
                    <span className="block text-xs sm:text-sm font-extrabold text-white">Download for Windows</span>
                    <span className="block text-[10px] text-emerald-100">x64 Installer (.exe) • Direct Download</span>
                  </div>
                </div>
                <Download size={18} />
              </a>

              <a 
                href="https://github.com/prince-up/anzak-downlaod-/releases/download/v1.0.0/AnazkAI-1.0.0-arm64.dmg" 
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowDownloadModal(false)}
                className="w-full py-3.5 sm:py-4 bg-[#0d2e27] hover:bg-emerald-950 text-white rounded-2xl flex items-center justify-between px-5 sm:px-6 font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🍎</span>
                  <div>
                    <span className="block text-xs sm:text-sm font-extrabold text-white">Download for macOS</span>
                    <span className="block text-[10px] text-emerald-100">dmg Package • Apple Silicon / Intel</span>
                  </div>
                </div>
                <Download size={18} />
              </a>

              <div className="bg-[#eef8f3] p-5 rounded-2xl border border-emerald-600/10 text-left space-y-3.5">
                <span className="block text-xs font-black text-emerald-850 uppercase tracking-wider">🍏 macOS Setup &amp; Bypass Guide:</span>
                
                <div className="space-y-1">
                  <span className="text-xs text-gray-800 font-bold block">Step 1: Move to Applications</span>
                  <span className="text-[11px] text-gray-650 block leading-relaxed">• Open the downloaded <code className="bg-emerald-100/50 px-1 rounded">.dmg</code> file and drag **AnazkAI** into the **Applications** folder on your Mac. Close/eject the DMG installer window.</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-gray-800 font-bold block">Step 2: Bypass Gatekeeper / "Damaged" Warnings</span>
                  <span className="text-[11px] text-gray-650 block leading-relaxed">• Open the **Terminal** app on your Mac and execute this command to clear the quarantine flag:</span>
                  <div className="bg-[#113a30] text-emerald-200 p-2.5 rounded-xl font-mono text-[10px] break-all select-all relative group font-bold">
                    xattr -cr /Applications/AnazkAI.app
                  </div>
                  <span className="text-[11px] text-gray-650 block leading-relaxed">• If Mac still shows a "damaged" warning, execute this command in Terminal to digitally re-sign the app locally:</span>
                  <div className="bg-[#113a30] text-emerald-200 p-2.5 rounded-xl font-mono text-[10px] break-all select-all relative group font-bold">
                    codesign --force --deep --sign - /Applications/AnazkAI.app
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-800 font-bold block">Step 3: Allow Screen Recording Permissions</span>
                  <span className="text-[11px] text-gray-650 block leading-relaxed">• Go to **System Settings &rarr; Privacy &amp; Security &rarr; Screen &amp; System Audio Recording** and toggle **AnazkAI** to **ON** to enable screen overlay/transcriptions.</span>
                </div>
              </div>
            </div>
            
            <p className="mt-4 text-[10px] text-center text-gray-400 font-semibold">
              Anazk AI. Developed by Prince Yadav.
            </p>
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
          className="pl-2.5 pr-5 py-2.5 bg-gradient-to-r from-[#4b52b2] to-[#5c64c7] hover:from-[#3d4399] hover:to-[#4b52b2] text-white rounded-full shadow-[0_12px_35px_rgba(75,82,178,0.38)] hover:shadow-[0_16px_45px_rgba(75,82,178,0.5)] border border-indigo-300/30 flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Open AI Support Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-white">
              💬
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#4b52b2]"></span>
          </div>
          <div className="text-left">
            <span className="font-extrabold text-xs tracking-tight block text-white">
              {chatOpen ? 'Close Chat' : 'Chat with AI'}
            </span>
            <span className="text-[10px] text-indigo-100 font-semibold block leading-none">
              {chatOpen ? 'Click to hide' : 'Online · Ask anything'}
            </span>
          </div>
        </button>
      </div>

    </div>
  );
}

export default LandingPage;
