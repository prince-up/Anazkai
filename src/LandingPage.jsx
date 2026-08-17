import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Play, CheckCircle2, Download, Menu, X, Mic, Monitor, Star, 
  MoreVertical, Move, ChevronDown, CornerDownLeft, Sparkles, Settings, Copy, 
  Shield, Eye, EyeOff, User, Users, ChevronLeft, ChevronRight, Lock, Laptop, Check,
  MessageSquare, Send, Bot, Compass, HelpCircle, CreditCard, Mail, LayoutDashboard
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
      if (path.includes('dashboard')) return 'dashboard';
    }
    return 'landing';
  });

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
        setCurrentView('dashboard');
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
        setCurrentView('dashboard');
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
                mentor_phone: '7986614646',
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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Corner Floating AI Support Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hi! I'm the Anazk AI Website Assistant. Ask me anything about how Anazk AI works, how to make payment & buy credits, or where to go on this website!",
      actions: [
        { label: '💳 How to buy credits?', query: 'how to buy credits' },
        { label: '🧭 Guide me around', query: 'where to go on website' },
        { label: '🛡️ Is it undetectable?', query: 'is it undetectable on zoom meet' }
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendChatMessage = (rawQuery) => {
    const queryText = (typeof rawQuery === 'string' ? rawQuery : chatInput).trim();
    if (!queryText) return;

    // Add user message
    const userMsgId = Date.now();
    setChatMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: queryText }
    ]);
    setChatInput('');
    setIsBotTyping(true);

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
    }, 450);
  };

  const generateBotAnswer = (userText) => {
    const query = userText.toLowerCase().trim();

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
          setCurrentView('dashboard');
        }} 
      />
    );
  }

  if (currentView === 'dashboard') {
    return (
      <Dashboard 
        user={user} 
        onSignOut={async () => {
          await supabase.auth.signOut();
          setUser(null);
          setCurrentView('landing');
        }}
        onOpenPricing={() => {
          setCurrentView('landing');
          setTimeout(() => {
            const el = document.getElementById('pricing');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }}
        onOpenDownload={() => window.open("https://drive.google.com/file/d/1YS9f4llIjXtVglups5bV_Uk5yCrpfEzy/view?usp=sharing", "_blank")}
        onBackToHome={() => setCurrentView('landing')}
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

      {/* Floating Header */}
      <nav className={`fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] sm:w-[calc(100%-3rem)] max-w-[1480px] z-50 backdrop-blur-xl border px-3.5 sm:px-8 py-2.5 sm:py-4 rounded-full flex justify-between items-center transition-all duration-700 shadow-[0_10px_30px_rgba(16,185,129,0.08)] ${activeTab === 'coding' ? 'bg-[#0f172a]/85 border-emerald-500/25 text-white' : 'bg-white/90 border-emerald-500/15 text-[#0d2e27]'}`}>
        <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer">
          <img 
            src="/penguin.jpg" 
            alt="AnazkAI Logo" 
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-emerald-500/30 object-cover shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:scale-105 transition-transform duration-200" 
          />
          <span className="font-display font-black text-xl sm:text-2xl text-[#0d2e27] tracking-tight flex items-center">
            Anazk<span className="text-emerald-600 font-extrabold ml-1">AI</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className={`hidden md:flex items-center gap-7 lg:gap-9 text-[15px] sm:text-base font-black tracking-tight transition-colors duration-700 ${activeTab === 'coding' ? 'text-gray-100' : 'text-[#0d2e27]'}`}>
          <a href="#features" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Features</a>
          <a href="#sandbox" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Interactive Demo</a>
          <button onClick={() => setShowPrivacyModal(true)} className="hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer">Privacy</button>
          <a href="#pricing" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Pricing</a>
        </div>

        {/* Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="px-5 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-full transition-all shadow-md flex items-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button 
                onClick={() => supabase.auth.signOut()}
                className={`px-5 py-2.5 sm:py-3 border-2 font-black text-sm rounded-full transition-all shadow-xs flex items-center gap-2 active:scale-[0.98] cursor-pointer ${activeTab === 'coding' ? 'bg-[#1e293b] border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'}`}
              >
                <User size={16} />
                Sign out
              </button>
            </>
          ) : (
            <button 
              onClick={() => setCurrentView('auth')}
              className="px-6 lg:px-7 py-2.5 sm:py-3 bg-[#0d2e27] hover:bg-emerald-950 text-white font-black text-sm sm:text-base rounded-full transition-all shadow-md flex items-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              Sign in
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="px-3.5 py-1.5 bg-emerald-600 text-white font-black text-xs rounded-full flex items-center gap-1"
            >
              <LayoutDashboard size={12} />
              Dashboard
            </button>
          ) : (
            <button 
              onClick={() => setCurrentView('auth')}
              className="px-3.5 py-1.5 bg-[#0d2e27] text-white font-black text-xs rounded-full"
            >
              Sign in
            </button>
          )}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#0d2e27] hover:bg-emerald-50 rounded-lg transition-all"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-md bg-white/95 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-5 shadow-2xl z-40 md:hidden flex flex-col space-y-3.5 animate-in fade-in slide-in-from-top-5 duration-200">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="font-bold text-gray-800 hover:text-emerald-600 py-2 border-b border-gray-100 text-sm">Features</a>
          <a href="#sandbox" onClick={() => setMobileMenuOpen(false)} className="font-bold text-gray-800 hover:text-emerald-600 py-2 border-b border-gray-100 text-sm">Interactive Demo</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="font-bold text-gray-800 hover:text-emerald-600 py-2 border-b border-gray-100 text-sm">Pricing</a>
          <button onClick={() => { setMobileMenuOpen(false); setShowPrivacyModal(true); }} className="text-left font-bold text-gray-800 hover:text-emerald-600 py-2 border-b border-gray-100 text-sm">Privacy</button>
          <div className="pt-2 flex flex-col space-y-2">
            {user ? (
              <>
                <button 
                  onClick={() => { setMobileMenuOpen(false); setCurrentView('dashboard'); }}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={16} />
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); supabase.auth.signOut(); }}
                  className="w-full py-2.5 border border-gray-200 bg-gray-50 text-gray-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <User size={16} />
                  Sign out
                </button>
              </>
            ) : (
              <button 
                onClick={() => { setMobileMenuOpen(false); setCurrentView('auth'); }}
                className="w-full py-3 bg-[#0d2e27] hover:bg-[#061713] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                Sign in
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="min-h-screen pt-24 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-8 lg:px-16 w-full max-w-[1480px] mx-auto flex items-center justify-center">
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
                  
                  {/* Left Column: Live Interview Video Demo Player */}
                  <div className="lg:col-span-7 bg-[#0b0f19] rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-md flex flex-col justify-between overflow-hidden relative group min-h-[260px] sm:min-h-[380px] lg:min-h-[440px]">
                    {/* Video Top Bar */}
                    <div className="flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 bg-black/60 backdrop-blur-md border-b border-white/10 z-10">
                      <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
                        <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0"></span>
                        <span className="text-[11px] sm:text-[12px] text-white font-bold tracking-wide truncate">Anazk AI — Live Demo</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span className="text-[9px] sm:text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> LIVE
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-gray-300 font-mono">54 mins</span>
                      </div>
                    </div>

                    {/* Main Video Stream Player with Autoplay */}
                    <div className="relative w-full flex-1 bg-black flex items-center justify-center min-h-[180px] sm:min-h-[260px]">
                      <video
                        src="/hero-video.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        className="w-full h-auto aspect-video object-contain bg-black max-h-[320px] sm:max-h-[400px]"
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

                    {/* Bottom Live Transcript Strip */}
                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#111827] border-t border-white/10 flex items-center justify-between text-left">
                      <div className="flex items-center gap-1.5 overflow-hidden mr-2">
                        <span className="text-[10px] sm:text-[11px] text-emerald-400 font-black shrink-0">🎤 TRANSCRIPT:</span>
                        <p className="text-gray-200 italic text-[11px] sm:text-[12px] truncate font-medium">
                          &quot;Can you explain how Anazk AI assists in real-time?&quot;
                        </p>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded font-bold shrink-0">
                        Listening...
                      </span>
                    </div>
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



      {/* Desktop App CTA Banner */}
      <section className="px-6 sm:px-10 lg:px-16 py-10 w-full max-w-[1480px] mx-auto mt-4">
        <div className="bg-[#111315] rounded-[32px] overflow-hidden flex flex-col lg:flex-row items-stretch justify-between border border-gray-800 shadow-2xl">
          
          {/* Left Content */}
          <div className="p-10 md:p-14 lg:w-[45%] flex flex-col items-start justify-center text-left space-y-6 z-10 bg-[#111315]">
            <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Desktop App</span>
            <h2 className="text-white text-3xl md:text-[38px] font-bold leading-[1.15] tracking-tight">
              Turn every conversation into your next best answer.
            </h2>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              The desktop app runs quietly in the background, listening to your call and surfacing the best answers in real time. No switching windows.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full">
              <a href="https://github.com/prince-up/cheater-Boy/releases/latest" target="_blank" rel="noreferrer" className="w-full sm:w-auto bg-white text-black px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                <Download size={18} />
                Download for Windows
              </a>
              <button className="w-full sm:w-auto bg-[#232529] text-white px-6 py-3.5 rounded-xl font-bold hover:bg-[#2c2f35] transition-colors border border-gray-700">
                Browser vs App
              </button>
            </div>
          </div>
          
          {/* Right product visual: photo inside a styled laptop-frame container */}
          <div className="w-full lg:w-[55%] min-h-[420px] lg:min-h-full relative overflow-hidden flex items-center justify-center bg-[#0a0a0a] p-8 md:p-10">
            {/* Subtle radial glow behind */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(16,185,129,0.12),transparent_65%)] pointer-events-none" />
            {/* Laptop frame */}
            <div className="relative w-full max-w-[560px]">
              {/* Screen bezel */}
              <div className="bg-[#1a1a1e] rounded-t-2xl pt-3 px-3 pb-0 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
                {/* Notch bar */}
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                {/* Screen image */}
                <div className="overflow-hidden rounded-t-lg">
                  <img
                    src="/user-laptop-photo.png"
                    alt="Person using Anazk AI on laptop during an interview"
                    className="block w-full object-cover"
                    style={{ aspectRatio: '16/10', objectPosition: 'center 30%' }}
                  />
                </div>
              </div>
              {/* Keyboard base */}
              <div className="h-5 bg-gradient-to-b from-[#2a2a2e] to-[#1e1e22] rounded-b-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)]" />
              {/* Stand notch */}
              <div className="mx-auto w-24 h-2 bg-[#141416] rounded-b-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Features: Everything You Need To Perform Better (Infinite Moving Marquee) */}
      <section id="features" className="py-20 px-4 sm:px-6 w-full max-w-full overflow-hidden text-center space-y-10 sm:space-y-12">
        <div className="max-w-4xl mx-auto space-y-4 px-4">
          <div>
            <span className="inline-block bg-[#15803d] text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-sm">
              Features
            </span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-[#0d2e27] tracking-tight">
            Everything <span className="text-[#15803d]">You Need</span> To Perform Better.
          </h2>
        </div>

        {/* Moving Marquee Container */}
        <div className="w-full relative overflow-hidden py-4 select-none">
          {/* Gradient Blur Edges for professional look */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#f0f8ff] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#f0f8ff] to-transparent z-10" />

          <div className="animate-marquee-smooth flex items-center gap-6 sm:gap-8">
            {/* Array of feature cards rendered twice for seamless infinite loop */}
            {[
              {
                icon: "🎯",
                title: "Personalized Answers",
                desc: "Tailors answers based on your resume and experience for authentic, high-scoring responses."
              },
              {
                icon: "👻",
                title: "Undetectable Overlay",
                desc: "A discreet overlay that sits on top of your meeting window, visible only to you."
              },
              {
                icon: "🎙️",
                title: "Real Time Answers",
                desc: "Instantly transcribes interview questions with high accuracy, supporting multiple accents and languages."
              },
              {
                icon: "💻",
                title: "Coding Assistance",
                desc: "Solves coding problems in real-time, supporting Python, Java, C++, JavaScript, and more."
              },
              {
                icon: "⚡",
                title: "Sub-Second Latency",
                desc: "Streams responses in under 0.6 seconds so you answer naturally without awkward silences."
              },
              {
                icon: "🔒",
                title: "100% Screen Share Proof",
                desc: "Hardware-level protection prevents capture detection on Zoom, Teams, and Google Meet."
              },
              // Duplicate set for infinite loop
              {
                icon: "🎯",
                title: "Personalized Answers",
                desc: "Tailors answers based on your resume and experience for authentic, high-scoring responses."
              },
              {
                icon: "👻",
                title: "Undetectable Overlay",
                desc: "A discreet overlay that sits on top of your meeting window, visible only to you."
              },
              {
                icon: "🎙️",
                title: "Real Time Answers",
                desc: "Instantly transcribes interview questions with high accuracy, supporting multiple accents and languages."
              },
              {
                icon: "💻",
                title: "Coding Assistance",
                desc: "Solves coding problems in real-time, supporting Python, Java, C++, JavaScript, and more."
              },
              {
                icon: "⚡",
                title: "Sub-Second Latency",
                desc: "Streams responses in under 0.6 seconds so you answer naturally without awkward silences."
              },
              {
                icon: "🔒",
                title: "100% Screen Share Proof",
                desc: "Hardware-level protection prevents capture detection on Zoom, Teams, and Google Meet."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="w-[280px] sm:w-[320px] shrink-0 p-6 sm:p-7 rounded-3xl bg-white/80 hover:bg-white border border-emerald-500/10 hover:border-emerald-500/30 hover:shadow-xl transition-all space-y-3.5 flex flex-col items-center text-center cursor-pointer transform hover:-translate-y-1 duration-200"
              >
                <div className="text-3xl">{item.icon}</div>
                <h3 className="font-display font-bold text-base sm:text-lg text-gray-900">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 w-full max-w-[1480px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
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

      {/* Interactive Sandbox Simulator */}
      <section id="sandbox" className="py-20 bg-gradient-to-tr from-[#edf9f3] to-white border-y border-emerald-500/5 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <span className="inline-block bg-teal-100 text-teal-800 border border-teal-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              Try It Now
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#0d2e27]">
              Interactive AI Sandbox
            </h2>
            <p className="text-gray-600 text-base max-w-xl mx-auto font-medium">
              Simulate an interview question below (e.g. ask about &quot;React Hooks&quot; or &quot;SQL vs NoSQL&quot;) and watch Anazk AI capture, transcribe, and formulate answers instantly!
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-emerald-500/10 p-6 md:p-8 shadow-xl">
            <form onSubmit={handleSandboxSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-emerald-800 uppercase tracking-wider mb-2">Simulate Interview Question:</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={sandboxQuestion}
                    onChange={(e) => setSandboxQuestion(e.target.value)}
                    placeholder="E.g., What are the core features of React Hooks? or Explain SQL vs NoSQL database choices."
                    className="flex-1 px-4 py-3 bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 text-sm rounded-2xl outline-none font-semibold text-gray-800 placeholder-gray-400 transition-all shadow-inner"
                  />
                  <button 
                    type="submit" 
                    disabled={isSandboxLoading}
                    className="px-6 bg-[#0d2e27] text-white hover:bg-emerald-950 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSandboxLoading ? "Thinking..." : "Simulate"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </form>

            {/* Simulated Live Outputs */}
            {(sandboxTranscript || sandboxResponse || isSandboxLoading) && (
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                {sandboxTranscript && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></div>
                    <span>{sandboxTranscript}</span>
                  </div>
                )}

                {sandboxResponse && (
                  <div className="bg-[#0b1227] text-gray-100 p-5 rounded-2xl border border-emerald-500/20 font-sans text-xs leading-relaxed space-y-3 shadow-inner">
                    <span className="block text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider border-b border-white/5 pb-1">Anazk AI Assistant Response:</span>
                    <div className="space-y-2 text-gray-300">
                      {sandboxResponse.split('\n').map((line, idx) => {
                        if (line.startsWith('###')) {
                          return <h4 key={idx} className="font-bold text-[13px] text-white mt-3 mb-1 font-display">{line.replace('###', '')}</h4>;
                        } else if (line.startsWith('*')) {
                          return <p key={idx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-400 font-medium">{line.replace('*', '').trim()}</p>;
                        }
                        return <p key={idx} className="font-medium">{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
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

      {/* Privacy Demo Videos Grid */}
      <section className="py-20 bg-white border-y border-emerald-500/5 px-6">
        <div className="max-w-5xl mx-auto space-y-12 text-left">
          
          <div className="text-center space-y-4">
            <h2 className="font-display font-black text-3xl text-[#0d2e27] tracking-tight">
              Privacy Demo Videos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Zoom */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between shadow-sm cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#0b5cff] text-white font-extrabold flex items-center justify-center rounded-xl text-[10px] uppercase shadow-sm">
                  zoom
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#0d2e27]">Zoom</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-gray-500 font-semibold">Undetectable, checked 21h ago.</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>

            {/* 2. Microsoft Teams */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between shadow-sm cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#4656c2] text-white font-black flex items-center justify-center rounded-xl text-sm shadow-sm">
                  T
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#0d2e27]">Microsoft Teams</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-gray-500 font-semibold">Undetectable, checked 21h ago.</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>

            {/* 3. Google Meet */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between shadow-sm cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#00863f] text-white font-bold flex items-center justify-center rounded-xl text-[10px] uppercase shadow-sm">
                  meet
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#0d2e27]">Google Meet</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-gray-500 font-semibold">Undetectable, checked 21h ago.</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>

            {/* 4. Webex */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between shadow-sm cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#002f5c] text-white font-bold flex items-center justify-center rounded-xl text-[10px] uppercase shadow-sm">
                  webex
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#0d2e27]">Webex</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-gray-500 font-semibold">Undetectable, checked 21h ago.</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>

            {/* 5. Lark/Feishu */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between shadow-sm cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#00b5e2] text-white font-bold flex items-center justify-center rounded-xl text-[10px] uppercase shadow-sm">
                  lark
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#0d2e27]">Lark/Feishu</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-gray-500 font-semibold">Undetectable, checked 21h ago.</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>

            {/* 6. Amazon Chime */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between shadow-sm cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#00a896] text-white font-bold flex items-center justify-center rounded-xl text-[10px] uppercase shadow-sm">
                  chime
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#0d2e27]">Amazon Chime</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-gray-500 font-semibold">Undetectable, checked 21h ago.</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>

            {/* 7. Coderpad.io */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between shadow-sm cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#c8102e] text-white font-mono font-bold flex items-center justify-center rounded-xl text-[10px] shadow-sm">
                  &lt;/&gt;
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#0d2e27]">Coderpad.io</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-gray-500 font-semibold">Undetectable, checked 21h ago.</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>

            {/* 8. HackerRank */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between shadow-sm cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#2ec866] text-white font-extrabold flex items-center justify-center rounded-xl text-[10px] shadow-sm">
                  H
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#0d2e27]">HackerRank</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-gray-500 font-semibold">Undetectable, checked 21h ago.</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>

          </div>
        </div>
      </section>

      {/* Real Stories From Real Interviews Section */}
      <section className="py-24 px-4 sm:px-6 bg-[#f0fbf5]/60 border-t border-emerald-500/10 overflow-hidden relative text-center">
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
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-[#f0fbf5]/40 via-white to-[#f0fbf5]/30 border-t border-emerald-500/10 text-center">
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
      <section className="py-24 bg-gradient-to-tr from-[#edf9f3] to-white border-t border-emerald-500/5 px-6">
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

      {/* Premium Footer */}
      <footer className="border-t border-gray-200 bg-[#f8fafc] px-6 py-16 text-left">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-xl space-y-3">
              <div className="flex items-center gap-3">
                <img src="/penguin.jpg" alt="Anazk AI Logo" className="w-11 h-11 rounded-2xl border-2 border-emerald-500/30 object-cover shadow-sm" />
                <span className="font-display text-2xl font-black tracking-tight text-[#0d2e27]">Anazk AI</span>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl font-black leading-tight tracking-tight text-[#0d2e27]">
                Think clearly. Respond confidently.
              </h3>
              <p className="text-base sm:text-lg font-bold leading-relaxed text-gray-700">
                A focused AI copilot for the moments where preparation matters most.
              </p>
            </div>
            
            {/* Quick Links & Buttons */}
            <div className="flex flex-wrap gap-2.5 text-sm font-extrabold text-gray-800">
              <a href="mailto:supportanazkai@gmail.com" className="rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 transition hover:border-emerald-500 hover:text-emerald-700 shadow-xs">
                Email support
              </a>
              <a href="https://www.linkedin.com/in/anazk-ai-422894429" target="_blank" rel="noreferrer" className="rounded-full border-2 border-sky-300 bg-sky-50 px-5 py-2.5 text-sky-800 transition hover:border-sky-500 hover:bg-sky-100 shadow-xs">
                Connect on LinkedIn
              </a>
              <button onClick={() => setChatOpen(true)} className="rounded-full border-2 border-emerald-300 bg-emerald-50 px-5 py-2.5 text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-100 shadow-xs cursor-pointer">
                AI Guide & Support
              </button>
              <button onClick={() => setShowTermsModal(true)} className="rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 transition hover:border-emerald-500 hover:text-emerald-700 shadow-xs cursor-pointer">
                Terms
              </button>
              <button onClick={() => setShowPrivacyModal(true)} className="rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 transition hover:border-emerald-500 hover:text-emerald-700 shadow-xs cursor-pointer">
                Privacy
              </button>
              <button onClick={() => setShowRefundModal(true)} className="rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 transition hover:border-emerald-500 hover:text-emerald-700 shadow-xs cursor-pointer">
                Refunds
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 border-t border-gray-200 pt-6 text-sm font-bold text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-extrabold text-gray-800">© 2026 Anazk AI. All rights reserved.</span>
            <span className="text-emerald-700 font-black">Built for better conversations.</span>
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
            <h3 className="font-display font-black text-xl sm:text-2xl text-[#0d2e27] mb-2 pr-8">Get Anazk AI for Windows</h3>
            <p className="text-gray-500 text-xs font-semibold mb-5 sm:mb-6">Install our secure desktop client built natively for Windows. Bypasses screen captures automatically.</p>
            
            <div className="space-y-3.5 sm:space-y-4">
              <a 
                href="https://drive.google.com/file/d/1YS9f4llIjXtVglups5bV_Uk5yCrpfEzy/view?usp=sharing" 
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowDownloadModal(false)}
                className="w-full py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-between px-5 sm:px-6 font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🪟</span>
                  <div>
                    <span className="block text-xs sm:text-sm font-extrabold text-white">Download for Windows</span>
                    <span className="block text-[10px] text-emerald-100">x64 Installer (.exe) • Direct from Google Drive</span>
                  </div>
                </div>
                <Download size={18} />
              </a>

              <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">System Compatibility:</span>
                <span className="text-xs text-gray-600 font-semibold block">• Supported on Windows 10 & Windows 11 (64-bit)</span>
                <span className="text-xs text-gray-600 font-semibold block">• Active Content-Protection Overlay Integration</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-2">Currently, macOS and Linux support are in private beta.</span>
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
                    <span className="text-gray-400">Mentor Helpline:</span>
                    <span className="text-emerald-300 font-bold">+91 7986614646</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <a
                    href={`https://wa.me/917986614646?text=${encodeURIComponent(`Hi Mentor, I have booked a 1-on-1 Personal Guidance Session on Anazk AI.\nName: ${mentorBooking?.name || ''}\nEmail: ${mentorBooking?.email || ''}\nPhone: ${mentorBooking?.phone || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>💬 Chat with Mentor on WhatsApp (+91 7986614646)</span>
                  </a>

                  <a
                    href="tel:+917986614646"
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>📞 Call Mentor (+91 7986614646)</span>
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
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full p-5 sm:p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 flex flex-col max-h-[85vh] my-auto">
            <button 
              onClick={() => setShowTermsModal(false)}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-xl sm:text-2xl text-[#0d2e27] mb-1.5 sm:mb-2 pr-8">Agreement to our legal terms</h3>
            <p className="text-gray-400 text-xs font-semibold mb-3 sm:mb-4">Last Update: March 15, 2026</p>
            
            <div className="flex-1 overflow-y-auto pr-2 text-xs text-gray-600 font-medium leading-relaxed space-y-3.5 sm:space-y-4 no-scrollbar">
              <p>We operate the website (the “Site”), as well as any other related products and services that refer or link to these legal terms (the “Legal Terms”) (collectively, the “Services”).</p>
              <p>These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”), and Anazk AI d.o.o., concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</p>
              <p className="font-bold text-red-650 bg-red-50 p-3 rounded-xl border border-red-100">YOU ARE RESPONSIBLE FOR USING THE SERVICES ONLY FOR LEGAL AND ETHICAL PURPOSES. You are solely responsible for ensuring that your use of the Services complies with all applicable laws, regulations, and third-party rules that apply to you, including without limitation laws governing recording, wiretapping, consent, privacy, data protection, intellectual property, confidentiality, employment, education, professional licensing, examinations, and unfair or deceptive practices.</p>
              <p>You agree that you will not use the Services in any manner that is illegal, deceptive, fraudulent, harmful, harassing, or otherwise unethical, and that you will not use the Services to violate any obligations you owe to a third party (including but not limited to your employer, school, examination provider, certification body, interviewer, counterparty, or any platform whose terms of service or code of conduct apply to your interaction). Where the law, institution, employer, platform, or other person requires notice, disclosure, or consent before recording, processing, or being assisted by AI in a conversation, meeting, interview, examination, or other interaction, it is your sole responsibility to obtain that notice, disclosure, or consent. We provide the Services as a general-purpose tool and do not endorse, encourage, or condone any unlawful or unethical use, and any such use is a material breach of these Legal Terms.</p>
              <p>Supplemental terms and conditions or documents that may be posted on the Services from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Legal Terms from time to time. We will alert you about any changes by updating the “Last updated” date of these Legal Terms, and you waive any right to receive specific notice of each such change.</p>
              <p>The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.</p>
              
              <div className="font-bold text-gray-805 pt-2 text-sm border-t border-gray-100">Table of contents</div>
              <ul className="list-disc pl-4 space-y-1 text-gray-500">
                <li>1. Our services</li>
                <li>2. Intellectual property rights</li>
                <li>3. User representations</li>
                <li>4. User registration</li>
                <li>5. Purchases and payment</li>
                <li>6. Prohibited activities</li>
                <li>7. User generated contributions</li>
                <li>8. Contribution license</li>
                <li>9. Social media</li>
                <li>10. Services management</li>
                <li>11. Privacy policy</li>
                <li>12. Term and termination</li>
                <li>13. Modifications and interruptions</li>
                <li>14. Governing law</li>
                <li>15. Dispute resolution</li>
                <li>16. Corrections</li>
                <li>17. Disclaimer</li>
                <li>18. Limitations of liability</li>
                <li>19. Indemnification</li>
                <li>20. User data</li>
                <li>21. Electronic communications, transactions, and signatures</li>
                <li>22. California users and residents</li>
                <li>23. Miscellaneous</li>
                <li>24. Contact us</li>
              </ul>

              <div className="font-bold text-gray-805 pt-2 text-[13px] border-t border-gray-100 uppercase">1. Our services</div>
              <p>The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</p>
              
              <div className="font-bold text-gray-805 pt-2 text-[13px] border-t border-gray-100 uppercase">2. Intellectual property rights</div>
              <p>We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the “Content”), as well as the trademarks, service marks, and logos contained therein (the “Marks”).</p>
              
              <div className="font-bold text-gray-850 pt-2 text-[13px] border-t border-gray-100 uppercase">3. User representations</div>
              <p>By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the jurisdiction in which you reside; (5) you will not access the Services through automated or non-human means, whether through a bot, script or otherwise; (6) you will not use the Services for any illegal, unauthorized, or unethical purpose; (7) your use of the Services will not violate any applicable law or regulation...</p>

              <div className="font-bold text-gray-850 pt-2 text-[13px] border-t border-gray-100 uppercase">5. Purchases and payment</div>
              <p>We accept Visa, Mastercard, American Express, and Discover. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services.</p>

              <div className="font-bold text-gray-850 pt-2 text-[13px] border-t border-gray-100 uppercase">6. Prohibited activities</div>
              <p>You agree not to systematically retrieve data, trick or defraud other users, circumvent security features, decompile software, or reverse engineer any of the code comprising the Services.</p>
              <p className="font-bold text-[#15803d]">Automated account-sharing protection (new sessions paused). To enforce the one-person-per-account rule above, we monitor account activity for signals of account sharing and reserve the right to analyze this activity using any methods we see fit. If we determine that an account is being shared, we may temporarily pause activating new sessions (free or paid) and extending or restarting existing ones.</p>

              <div className="font-bold text-gray-850 pt-2 text-[13px] border-t border-gray-100 uppercase">24. Contact us</div>
              <p>In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</p>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-mono text-[11px] leading-relaxed text-gray-500">
                Anazk AI d.o.o.<br />
                Slovenska cesta 55b<br />
                Ljubljana, Notranjska 1000<br />
                Slovenia<br />
                Email: support@Anazk AI-ai.com
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

      {/* 6. Corner Floating AI Support Chatbot Widget */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
        {/* Floating Chat Window */}
        {chatOpen && (
          <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[410px] h-[490px] max-h-[75vh] bg-white rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 text-left">
            {/* Chat Header */}
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-gradient-to-r from-[#0d2e27] to-[#123e35] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="relative">
                  <img 
                    src="/penguin.jpg" 
                    alt="Anazk AI Logo" 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-400 object-cover shadow-[0_0_14px_rgba(16,185,129,0.45)]" 
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 sm:w-3 h-2.5 sm:h-3 bg-emerald-400 border-2 border-[#0d2e27] rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    Anazk AI Guide
                    <span className="text-[9px] bg-emerald-500/25 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/40">ONLINE</span>
                  </h4>
                  <p className="text-[9px] sm:text-[10px] text-emerald-200/80 font-medium">Ask about pricing, navigation & stealth</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer"
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-gray-50/60 text-xs no-scrollbar">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex gap-2 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.sender === 'bot' && (
                      <img 
                        src="/penguin.jpg" 
                        alt="Anazk Bot" 
                        className="w-7 h-7 rounded-full object-cover border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0 mt-0.5"
                      />
                    )}
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line font-medium ${
                        msg.sender === 'user'
                          ? 'bg-[#0d2e27] text-white rounded-tr-none shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Interactive Action Chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%] pl-9">
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
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-emerald-200 hover:border-emerald-400 rounded-lg text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
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
                  <img 
                    src="/penguin.jpg" 
                    alt="Anazk Bot" 
                    className="w-7 h-7 rounded-full object-cover border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0"
                  />
                  <div className="bg-white border border-gray-200 px-3 py-2 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-white border-t border-gray-150 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask where to go or how to buy credits..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendChatMessage(chatInput);
                  }
                }}
                className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold text-gray-800 placeholder-gray-400 transition-colors"
              />
              <button
                onClick={() => handleSendChatMessage(chatInput)}
                disabled={!chatInput.trim()}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0 ${
                  chatInput.trim()
                    ? 'bg-[#0d2e27] hover:bg-emerald-900 text-white cursor-pointer active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Floating Trigger Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="pl-2.5 pr-5 py-2.5 bg-gradient-to-r from-[#0d2e27] to-[#123e35] hover:from-[#061713] hover:to-[#0d2e27] text-white rounded-full shadow-[0_12px_35px_rgba(13,46,39,0.38)] hover:shadow-[0_16px_45px_rgba(16,185,129,0.4)] border border-emerald-500/30 flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Open AI Support Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <img 
              src="/penguin.jpg" 
              alt="Anazk Penguin" 
              className="w-8 h-8 rounded-full object-cover border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d2e27]"></span>
          </div>
          <div className="text-left">
            <span className="font-extrabold text-xs tracking-tight block text-white">
              {chatOpen ? 'Close Guide' : 'AI Guide & Support'}
            </span>
            <span className="text-[10px] text-emerald-300 font-semibold block leading-none">
              {chatOpen ? 'Click to hide' : 'Ask Anazk AI'}
            </span>
          </div>
        </button>
      </div>

      {/* Floating Right Scroll Navigator Removed */}

    </div>
  );
}

export default LandingPage;
