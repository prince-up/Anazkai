import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Play, CheckCircle2, Download, Menu, X, Mic, Monitor, Star, 
  MoreVertical, Move, ChevronDown, CornerDownLeft, Sparkles, Settings, Copy, 
  Shield, EyeOff, User, Users, ChevronLeft, ChevronRight, Lock, Laptop, Check
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, getSubscriptionPlan } from './plans';

function LandingPage() {
  const [activeTab, setActiveTab] = useState('non-coding'); // 'non-coding' or 'coding'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [pricingOption, setPricingOption] = useState('subscription'); // 'subscription' or 'credits'
  const [expandedReviewer, setExpandedReviewer] = useState(null);
  const [showAllReviewers, setShowAllReviewers] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutState, setCheckoutState] = useState('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('payment');
    if (status) setPaymentStatus(status);
  }, []);

  const startCheckout = async (planId) => {
    const plan = getSubscriptionPlan(planId);
    if (!plan) return;
    setCheckoutPlan(plan);
    setCheckoutState('loading');
    setCheckoutError('');
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout could not be started.');
      window.location.href = data.url;
    } catch (error) {
      setCheckoutState('error');
      setCheckoutError(error.message || 'Checkout could not be started.');
    }
  };

  const reviewEmail = 'supportanazkai@gmail.com';
  const reviewComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${reviewEmail}&su=${encodeURIComponent('Anazk AI reviewer feedback')}&body=${encodeURIComponent('Name:\nEmail:\nPlan purchased:\nInterview platform:\nUse case:\nRating out of 5:\nYour experience:\nPermission to publish this review: Yes / No')}`;

  const reviewers = [
    { name: 'Prince Yadav', image: '/reviewers/luffy.png', rating: 5, review: 'This is a literal cheat code for interviews. It runs smoothly without slowing down my PC, and the whole experience feels surprisingly seamless.' },
    { name: 'Prem Sharma', image: '/reviewers/nilesh-kumar.png', rating: 4, review: 'The setup was super easy. I especially liked the screen-share protection because it stayed out of view during my Google Meet and Zoom calls.' },
    { name: 'Luffy', image: '/reviewers/priyanshu-kumar.png', rating: 5, review: 'The transcription speed is crazy. Even with accents and complex topics like Redis, it captured the conversation clearly and helped me stay calm.' },
    { name: 'Abhinav Asthana', image: '/reviewers/abhinav-asthana.png', rating: 5, review: 'Honestly, this app is a lifesaver. During a tough coding interview, it helped me organize my thoughts quickly instead of panicking.' },
    { name: 'Nilesh Yadav', image: '/reviewers/prem-kumar.png', rating: 4, review: 'Behavioral rounds became much easier. The answers felt connected to my resume, so I could respond naturally instead of searching for examples.' },
    { name: 'Priyanshu Kumar', image: '/reviewers/krishna.png', rating: 5, review: 'I was skeptical about the invisible overlay, but testing it with a friend on Microsoft Teams changed my mind. It worked exactly as expected.' },
    { name: 'Subrat Yadav', image: '/reviewers/astitva-yadav.png', rating: 4, review: 'The system design suggestions were genuinely useful. It picked up the microservices discussion and gave me a clear structure to talk through.' },
    { name: 'YashRaj Singh', image: '/reviewers/yash-raj.png', rating: 5, review: 'Maza aa gaya! I used to get nervous during live coding, but having a backup helped me communicate much more clearly.' },
    { name: 'Krishna Sharma', image: '/reviewers/harsh-shadeo.png', rating: 4, review: 'Setup took about two minutes. The solution was practical, and I liked that it also explained the time complexity instead of only showing an answer.' },
    { name: 'Harsh Shadeo', image: '/reviewers/subrat-yadav.png', rating: 5, review: 'Worth every penny for the low latency. It felt practical during a fast-paced interview because the suggestions arrived without interrupting my flow.' },
    { name: 'Astitva Yadav', image: '/reviewers/prince-yadav.png', rating: 4, review: 'I used it for a frontend interview and liked how it handled React concepts. It felt like having a senior developer helping me think through the question.' },
  ];
  
  // Custom legal & support modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);


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

  return (
    <div className={`font-sans min-h-screen relative overflow-x-hidden antialiased text-left transition-colors duration-700 ${activeTab === 'coding' ? 'bg-[#030712] text-gray-100 dark-theme-active' : 'bg-[#f0f8ff] text-[#1e293b]'}`}>
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-200/25 via-blue-100/15 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] left-[-100px] w-[500px] h-[500px] bg-gradient-to-tr from-cyan-150/20 to-transparent rounded-full blur-[80px] pointer-events-none"></div>

      {/* Floating Header */}
      <nav className={`fixed top-5 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[1120px] z-50 backdrop-blur-xl border px-6 py-3 rounded-full flex justify-between items-center transition-all duration-700 shadow-[0_10px_30px_rgba(16,185,129,0.05)] ${activeTab === 'coding' ? 'bg-[#0f172a]/70 border-emerald-500/20 text-white' : 'bg-white/70 border-emerald-500/10 text-[#0d2e27]'}`}>
        <div className="flex items-center space-x-3 cursor-pointer">
          <img 
            src="/penguin.jpg" 
            alt="AnazkAI Logo" 
            className="w-10 h-10 rounded-full border border-emerald-500/20 object-cover shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:scale-105 transition-transform duration-200" 
          />
          <span className="font-display font-black text-2xl text-[#0d2e27] tracking-tight flex items-center">
            Anazk<span className="text-emerald-500 font-extrabold"> AI</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className={`hidden md:flex items-center gap-8 text-xs font-black transition-colors duration-700 ${activeTab === 'coding' ? 'text-gray-200' : 'text-[#0d2e27]'}`}>
          <a href="#features" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Features</a>
          <a href="#reviews" className="hover:text-sky-400 transition-colors flex items-center gap-1">Early access</a>
          <a href={reviewComposeUrl} target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Be a reviewer</a>
          <button onClick={() => setShowPrivacyModal(true)} className="hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer">Privacy</button>
          <a href="#pricing" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Pricing</a>
          <a href="#download" onClick={(e) => { e.preventDefault(); setShowDownloadModal(true); }} className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            Desktop App
            <span className="text-[9px] bg-[#10b981] text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-95 origin-left">New</span>
          </a>
        </div>

        {/* Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <button 
            onClick={() => setShowDownloadModal(true)} 
            className="w-10 h-10 rounded-full border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-700 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
            title="Download App"
          >
            <Download size={16} />
          </button>
          <button 
onClick={() => startCheckout('yearly')}
                    className="w-full py-3.5 bg-black hover:bg-gray-900 text-white rounded-full text-sm font-black shadow-lg transition-all cursor-pointer"
                  >
                    Subscribe
                  </button>
                </div>

                {/* Card 2: Monthly */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-emerald-500/20 hover:shadow-xl shadow-sm space-y-6 flex flex-col justify-between transition-all text-left">
                  <div className="space-y-4">
                    <span className="block text-sm font-extrabold text-[#15803d] uppercase tracking-wider">Monthly</span>
                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-[#0d2e27]">₹3,000</span>
                      <span className="block text-gray-400 text-xs font-semibold mt-1">($39.90) per month</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 font-semibold pt-4 border-t border-gray-50">
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <span>∞ Unlimited Calls</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => startCheckout('monthly')}
                    className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#0d2e27] rounded-full text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Subscribe
                  </button>
                </div>

                {/* Card 3: Yearly (Recommended) */}
                <div className="bg-white p-8 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-6 flex flex-col justify-between relative text-left">
                  {/* Best Deal Tag */}
                  <div className="absolute top-0 left-12 -translate-y-1/2 bg-[#10b981] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                    Best deal
                  </div>
                  
                  <div className="space-y-4">
                    <span className="block text-sm font-extrabold text-emerald-600 uppercase tracking-wider">Yearly</span>
                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-[#0d2e27]">₹6,000</span>
                      <span className="block text-gray-400 text-xs font-semibold mt-1">($79.90) per year</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 font-semibold pt-4 border-t border-gray-50">
                      <li className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Check size={16} className="text-emerald-500" />
                          <span>∞ Unlimited Calls</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <button 
onClick={() => startCheckout('weekly')}
                    className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#0d2e27] rounded-full text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Subscribe
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Card 1: 45 min for ₹300 */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-emerald-500/20 hover:shadow-xl shadow-sm space-y-6 flex flex-col justify-between transition-all text-left">
                  <div className="space-y-4">
                    <span className="block text-sm font-extrabold text-emerald-600 uppercase tracking-wider">45 Minutes Session</span>
                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-[#0d2e27]">₹300</span>
                      <span className="block text-gray-400 text-xs font-semibold mt-1">($3.90) one-time</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 font-semibold pt-4 border-t border-gray-50">
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <span>45 min AI response session</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <span>Stealth Mode active</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => setShowSignInModal(true)}
                    className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#0d2e27] rounded-full text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Buy Credits
                  </button>
                </div>

                {/* Card 2: 1 Session Credit */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-emerald-500/20 hover:shadow-xl shadow-sm space-y-6 flex flex-col justify-between transition-all text-left">
                  <div className="space-y-4">
                    <span className="block text-sm font-extrabold text-emerald-600 uppercase tracking-wider">1 Session Credit</span>
                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-[#0d2e27]">₹990</span>
                      <span className="block text-gray-400 text-xs font-semibold mt-1">($10.00) one-time</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 font-semibold pt-4 border-t border-gray-50">
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <span>1 Interview Session (Up to 2h)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <span>Stealth Mode active</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => setShowSignInModal(true)}
                    className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#0d2e27] rounded-full text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Buy Credits
                  </button>
                </div>

                {/* Card 3: Developer Value Pack */}
                <div className="bg-white p-8 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-6 flex flex-col justify-between relative text-left">
                  <div className="absolute top-0 left-12 -translate-y-1/2 bg-[#10b981] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                    Best value
                  </div>

                  <div className="space-y-4">
                    <span className="block text-sm font-extrabold text-emerald-600 uppercase tracking-wider">10 Session Credits</span>
                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-[#0d2e27]">₹7,900</span>
                      <span className="block text-gray-400 text-xs font-semibold mt-1">($89.00) one-time</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 font-semibold pt-4 border-t border-gray-50">
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <span>10 Interview Sessions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <span>Save over 20% on credits</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => setShowSignInModal(true)}
                    className="w-full py-3.5 bg-black hover:bg-gray-900 text-white rounded-full text-sm font-black shadow-lg transition-all cursor-pointer"
                  >
                    Buy Credits
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Scroll Right Button */}
          <button 
            onClick={() => setPricingOption(pricingOption === 'credits' ? 'subscription' : 'credits')}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <ChevronRight size={20} />
          </button>

        </div>

        {/* Bottom Weekly option */}
        <div className="text-center pt-6 text-sm text-gray-500 font-semibold">
          or, only need a week? <a href="#weekly" className="text-emerald-600 font-bold hover:underline">Weekly for ₹4,980 →</a>
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
      <footer className="premium-footer border-t border-white/10 px-6 py-14 text-left">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-md">
              <div className="mb-4 flex items-center gap-3">
                <img src="/penguin.jpg" alt="Anazk AI Logo" className="size-10 rounded-2xl border border-white/10 object-cover" />
                <span className="font-display text-xl font-black tracking-tight text-white">Anazk AI</span>
              </div>
              <h3 className="font-display text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">Think clearly. Respond confidently.</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">A focused AI copilot for the moments where preparation matters most.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-300">
              <a href="mailto:supportanazkai@gmail.com" className="rounded-full border border-white/10 px-4 py-2.5 transition hover:border-sky-400/50 hover:text-white">Email support</a>
              <a href="https://www.linkedin.com/in/anazk-ai-422894429" target="_blank" rel="noreferrer" className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2.5 text-sky-200 transition hover:border-sky-300 hover:bg-sky-400/20 hover:text-white">Connect on LinkedIn</a>
              <button onClick={() => setShowSupportModal(true)} className="rounded-full border border-white/10 px-4 py-2.5 transition hover:border-sky-400/50 hover:text-white">Support</button>
              <button onClick={() => setShowTermsModal(true)} className="rounded-full border border-white/10 px-4 py-2.5 transition hover:border-sky-400/50 hover:text-white">Terms</button>
              <button onClick={() => setShowPrivacyModal(true)} className="rounded-full border border-white/10 px-4 py-2.5 transition hover:border-sky-400/50 hover:text-white">Privacy</button>
              <button onClick={() => setShowRefundModal(true)} className="rounded-full border border-white/10 px-4 py-2.5 transition hover:border-sky-400/50 hover:text-white">Refunds</button>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Anazk AI. All rights reserved.</span>
            <span>Built for better conversations.</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800">
            <button 
              onClick={() => setShowSignInModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-2xl text-[#0d2e27] mb-2">Welcome to Anazk AI</h3>
            <p className="text-gray-500 text-xs font-semibold mb-6">Enter your details to log into your SaaS workspace</p>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowSignInModal(false); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl outline-none text-sm font-semibold placeholder-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl outline-none text-sm font-semibold placeholder-gray-400 transition-colors"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Sign In to Workspace
              </button>
            </form>
            
            <div className="mt-6 text-center text-xs text-gray-500 font-semibold border-t border-gray-100 pt-4">
              Don't have an account? <span className="text-emerald-600 hover:underline cursor-pointer">Register now</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Download App Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800">
            <button 
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-2xl text-[#0d2e27] mb-2">Get Anazk AI for Windows</h3>
            <p className="text-gray-500 text-xs font-semibold mb-6">Install our secure desktop client built natively for Windows. Bypasses screen captures automatically.</p>
            
            <div className="space-y-4">
              <a 
                href="/release/Anazk Setup 1.0.0.exe" 
                download 
                onClick={() => setShowDownloadModal(false)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-between px-6 font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🪟</span>
                  <div>
                    <span className="block text-sm font-extrabold text-white">Download for Windows</span>
                    <span className="block text-[10px] text-emerald-100">x64 Installer (.exe)</span>
                  </div>
                </div>
                <Download size={18} />
              </a>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
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

      {/* 3. Legal Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setShowTermsModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-2xl text-[#0d2e27] mb-2 pr-8">Agreement to our legal terms</h3>
            <p className="text-gray-400 text-xs font-semibold mb-4">Last Update: March 15, 2026</p>
            
            <div className="flex-1 overflow-y-auto pr-2 text-xs text-gray-600 font-medium leading-relaxed space-y-4 no-scrollbar">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-2xl text-[#0d2e27] mb-2 pr-8">Privacy Policy</h3>
            <p className="text-gray-400 text-xs font-semibold mb-4">Last Update: August 30, 2024</p>
            
            <div className="flex-1 overflow-y-auto pr-2 text-xs text-gray-600 font-medium leading-relaxed space-y-4 no-scrollbar">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800">
            <button 
              onClick={() => setShowRefundModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-655 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-2xl text-[#0d2e27] mb-4">Refund Policy</h3>
            
            <div className="text-xs text-gray-600 font-medium leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              <p>Yes, we offer a 7-day refund window for accidental purchases or unused purchases. If you haven't used the service (for example, by activating a call session), you can request a full refund within 7 days of purchase via the money refund form in your dashboard.</p>
              <p>Our refund policy only covers unused purchases. A purchase is considered "unused" only if no credit from it has been used. Because Anazk AI is a digital service that begins delivery immediately when a paid session is activated, we are generally unable to provide refunds once the service has been used.</p>
              <p>If any credit has been used, the purchase is no longer eligible for a refund. We do not issue partial refunds for unused credits.</p>
              <p>We encourage everybody to test the tool thoroughly before purchasing.</p>
              <p className="font-bold text-[#0d2e27]">Important: This applies to one refund per person/user (not per account). If you've already received a refund, later purchases aren't eligible.</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI Support Chat Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-emerald-500/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left text-gray-800 flex flex-col h-[520px]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="font-display font-black text-xl text-[#0d2e27]">AI Support</h3>
                <p className="text-[10px] text-gray-400 font-bold leading-normal mt-1">This is an AI assistant, not a human. It can make mistakes, so please double-check important information.</p>
              </div>
              <button 
                onClick={() => setShowSupportModal(false)}
                className="text-gray-400 hover:text-gray-655 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-all cursor-pointer shrink-0 ml-4"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50 no-scrollbar">
              <div className="flex gap-3 items-start max-w-[85%]">
                <img src="/penguin.jpg" alt="AI Agent" className="w-8 h-8 rounded-full border border-emerald-500/20 object-cover shadow-sm" />
                <div className="bg-white border border-gray-150 p-3.5 rounded-2xl rounded-tl-none shadow-sm text-xs font-semibold text-gray-750 leading-relaxed">
                  Hi! I'm Anazk's AI support assistant. How can I help you today?
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold placeholder-gray-400 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button 
                onClick={() => {}} 
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Right Scroll Navigator Removed */}

    </div>
  );
}

export default LandingPage;
