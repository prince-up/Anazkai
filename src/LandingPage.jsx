import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Mic, Settings, Copy, X, Monitor, Code, Shield, 
  EyeOff, Download, User, ArrowRight, Star, Play, Check, 
  ChevronDown, Menu, Lock, Laptop, CheckCircle2, ChevronLeft, ChevronRight 
} from 'lucide-react';

function LandingPage() {
  const [activeTab, setActiveTab] = useState('non-coding'); // 'non-coding' or 'coding'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [pricingOption, setPricingOption] = useState('subscription'); // 'subscription' or 'credits'
  
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

  const reviews = [
    {
      name: "Nitesh Kumar",
      email: "nitesh... @gmail.com",
      avatar: "/nitesh.png",
      content: "I used Anazk AI during my tech interviews at top startups. The real-time coding suggestions and speed are incredibly helpful, letting me stay focused on the logical explanation.",
      date: "Apr 12, 2026"
    },
    {
      name: "Priyanshu Kumar",
      email: "priyanshu... @gmail.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80",
      content: "It's completely undetectable on screen sharing. I shared my screen on Microsoft Teams, and there was absolutely zero overlay visible in the video feed. Simply mind-blowing engineering.",
      date: "May 18, 2026"
    },
    {
      name: "Abhinav Asthana",
      email: "abhinav... @gmail.com",
      avatar: "/abhinav.png",
      content: "The Whisper transcription accuracy is incredibly fast and precise. Even with complex terms like Kubernetes, Redis, and multi-threading, it transcribes everything perfectly in real-time.",
      date: "Jun 04, 2026"
    },
    {
      name: "Prem Kumar",
      email: "prem... @gmail.com",
      avatar: "/prem.png",
      content: "Tailoring answers based on my resume context is a game changer for behavioral rounds. Anazk AI highlighted my actual project details exactly when needed. Highly recommended!",
      date: "Jul 21, 2026"
    }
  ];

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
    <div className="bg-[#f2fcf7] text-[#1e293b] font-sans min-h-screen relative overflow-x-hidden antialiased text-left">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-200/20 via-teal-100/10 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[800px] -left-100 w-[500px] h-[500px] bg-emerald-100/15 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Floating Header */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 w-[95%] max-w-[1440px] z-50 bg-white/70 backdrop-blur-xl border border-emerald-500/10 px-6 py-3 rounded-full flex justify-between items-center shadow-[0_10px_30px_rgba(16,185,129,0.05)] transition-all">
        <div className="flex items-center space-x-3 cursor-pointer">
          <img 
            src="/penguin.jpg" 
            alt="AnazkAI Logo" 
            className="w-10 h-10 rounded-full border border-emerald-500/20 object-cover shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:scale-105 transition-transform duration-200" 
          />
          <span className="font-display font-black text-2xl text-[#0d2e27] tracking-tight flex items-center">
            Anazk<span className="text-emerald-500 font-extrabold">AI</span>
            <span className="ml-2 text-[9px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">v2.0</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-black text-[#0d2e27]">
          <a href="#features" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Features</a>
          <a href="#reviews" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Reviews</a>
          <a href="#privacy" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Privacy</a>
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
            onClick={() => setShowSignInModal(true)}
            className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-extrabold text-sm rounded-full transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            Sign in
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile Menu Icon */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#0d2e27] hover:bg-emerald-50 rounded-lg transition-all"
        >
          <Menu size={20} />
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] bg-white border border-emerald-500/10 rounded-2xl p-6 shadow-xl z-40 md:hidden flex flex-col space-y-4 animate-in fade-in slide-in-from-top-5 duration-200">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-gray-700 hover:text-emerald-600 py-1.5 border-b border-gray-50">Features</a>
          <a href="#sandbox" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-gray-700 hover:text-emerald-600 py-1.5 border-b border-gray-50">Interactive Demo</a>
          <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-gray-700 hover:text-emerald-600 py-1.5 border-b border-gray-50">Reviews</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-gray-700 hover:text-emerald-600 py-1.5 border-b border-gray-50">Pricing</a>
          <a href="#privacy" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-gray-700 hover:text-emerald-600 py-1.5 border-b border-gray-50">Privacy</a>
          <div className="pt-2 flex flex-col space-y-3">
            <button 
              onClick={() => { setMobileMenuOpen(false); setShowDownloadModal(true); }}
              className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-100"
            >
              <Download size={16} />
              Download App
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setShowSignInModal(true); }}
              className="w-full py-3 bg-[#0d2e27] hover:bg-[#061713] text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Sign in
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="min-h-screen pt-32 pb-24 px-6 md:px-16 max-w-[1440px] w-[95%] mx-auto flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
         {/* Hero Left Content */}
        <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 text-[#10b981] font-bold text-sm uppercase tracking-wider">
            <span>💻</span>
            FULL CODING INTERVIEW SUPPORT
          </div>
          
          <h1 className="font-display font-black text-[40px] sm:text-[54px] lg:text-[68px] text-[#0d2e27] leading-[1.1] tracking-tight">
            Your Real-Time <span className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 w-14 h-9 rounded-full text-gray-800 text-lg align-middle mx-2 shadow-inner select-none font-sans font-black">...</span> <br />
            AI Interview Assistant
          </h1>

          <p className="text-gray-600 text-base sm:text-[20px] lg:text-[21px] max-w-2xl mx-auto lg:mx-0 font-semibold leading-relaxed mt-6">
            Automatically get an answer to every interview question with ChatGPT AI software. An AI Interview copilot. Real-time and private.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button 
              onClick={() => setShowDownloadModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-[#0d2e27] hover:bg-emerald-950 hover:scale-[1.02] active:scale-[0.98] text-white font-extrabold text-base rounded-full transition-all shadow-[0_10px_25px_rgba(13,46,39,0.15)] flex items-center justify-center gap-2 cursor-pointer animate-pulse-glow"
            >
              Try for free
              <ArrowRight size={18} />
            </button>
            <div className="text-xs text-gray-500 font-semibold text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-600">
                <CheckCircle2 size={14} />
                No Credit Card Required
              </div>
              <span className="block mt-0.5 text-emerald-700 font-bold uppercase tracking-wider text-[10px]">Credits, Subscriptions, Lifetime</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-6 border-t border-emerald-500/10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" alt="user" />
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80" alt="user" />
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" alt="user" />
            </div>
            <div className="text-xs text-gray-600 font-medium text-left">
              <span className="block font-black text-gray-800 text-sm">Used by <span className="font-extrabold text-[#0d2e27]">1,534,135+</span> people</span>
              <div className="flex items-center gap-1 mt-0.5 text-gray-500 font-semibold">
                <div className="flex text-amber-500 gap-0.5">
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                </div>
                <span><span className="font-extrabold text-gray-850">4.86</span> (340,066+ reviews)</span>
              </div>
            </div>
          </div>
        </div>
        {/* Hero Right - Interactive Mockup Window */}
        <div className="lg:col-span-6 flex flex-col items-center relative">
          
          {/* Window Tabs (Floating above mockup container) */}
          <div className="flex justify-center bg-[#0d2e27] border border-emerald-500/10 p-1.5 rounded-full shadow-lg relative z-20 -mb-6">
            <button 
              onClick={() => setActiveTab('non-coding')}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${activeTab === 'non-coding' ? 'bg-[#10b981] text-white shadow-md' : 'text-gray-300 hover:text-white'}`}
            >
              📁 Non-Coding
            </button>
            <button 
              onClick={() => setActiveTab('coding')}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${activeTab === 'coding' ? 'bg-[#10b981] text-white shadow-md' : 'text-gray-300 hover:text-white'}`}
            >
              &lt;/&gt; Coding
            </button>
          </div>

          {/* Window Mockup Outer Container */}
          <div className="w-full bg-white rounded-3xl p-1 border border-gray-200 shadow-2xl relative pt-8">
            {/* Window Dots (macOS style) */}
            <div className="absolute top-4 left-6 flex space-x-1.5">
              <span className="w-3 h-3 bg-[#ff5f56] rounded-full inline-block"></span>
              <span className="w-3 h-3 bg-[#ffbd2e] rounded-full inline-block"></span>
              <span className="w-3 h-3 bg-[#27c93f] rounded-full inline-block"></span>
            </div>

            {/* Window Content Area */}
            <div className="p-4 bg-[#f8fafc] rounded-b-3xl min-h-[380px] text-left font-mono">
              {activeTab === 'non-coding' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  
                  {/* Left Panel: White Card (Video & Transcript) */}
                  <div className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-sm space-y-4 flex flex-col justify-between">
                    {/* Video Block */}
                    <div className="bg-black rounded-xl overflow-hidden border border-gray-200 relative h-[160px] flex flex-col justify-between p-3 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=250&q=80')" }}>
                      <div className="absolute inset-0 bg-black/35 z-0"></div>
                      
                      <div className="flex justify-between items-center z-10">
                        <span className="text-[10px] text-white font-bold flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                          What is AnazkAI? Explained
                        </span>
                        <span className="text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded">LIVE</span>
                      </div>

                      <div className="flex flex-col items-center justify-center z-10 flex-1">
                        <button className="w-11 h-11 bg-red-600 hover:bg-red-750 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer">
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>

                      <div className="flex justify-center z-10">
                        <div className="bg-white border border-gray-200 text-gray-900 font-extrabold px-3 py-1 rounded-xl shadow-md text-[10px] tracking-wide">
                          AnazkAI demo
                        </div>
                      </div>
                    </div>

                    {/* Transcript Block */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-[10px] text-[#0d2e27] font-black uppercase tracking-wider">📝 Transcript</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-semibold">
                          <span>AutoScroll</span>
                          <span className="w-6 h-3.5 bg-[#10b981] rounded-full inline-block relative p-0.5"><span className="w-2.5 h-2.5 bg-white rounded-full block float-right"></span></span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 italic text-[11px] leading-relaxed pr-2 overflow-y-auto max-h-[75px] no-scrollbar">
                        &quot;this position anazk i provides answers&quot;
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-gray-400 text-[10px] font-semibold">
                        <div className="flex items-center gap-3">
                          <span className="hover:text-gray-600 cursor-pointer">🔄</span>
                          <span className="hover:text-gray-600 cursor-pointer">⏱️</span>
                        </div>
                        <button className="text-gray-400 hover:text-red-500 font-bold transition-colors cursor-pointer">Clear Transcript</button>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel: Light Grey Card (AI Response) */}
                  <div className="bg-[#f1f5f9] rounded-2xl border border-gray-200/60 p-4 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-[10px] text-[#0d2e27] font-black uppercase tracking-wider">🖥️ AI Response</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-semibold">
                          <span>AutoScroll</span>
                          <span className="w-6 h-3.5 bg-[#10b981] rounded-full inline-block relative p-0.5"><span className="w-2.5 h-2.5 bg-white rounded-full block float-right"></span></span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-[10px] text-gray-700 leading-relaxed font-sans overflow-y-auto max-h-[140px] no-scrollbar pr-1 pt-2">
                        <span className="block text-gray-400 font-mono text-[9px]">all you have to do</span>
                        <p className="font-extrabold text-[#0d2e27]">• Summarized question: What are the three highest mountains in Africa?</p>
                        <p className="text-yellow-600 font-extrabold">⭐ Answer:</p>
                        <ul className="space-y-1 pl-2 text-gray-600 font-medium">
                          <li>• Mount Kilimanjaro in Tanzania, standing at 5,895 meters (19,341 feet).</li>
                          <li>• Mount Kenya in Kenya, with a height of 5,199 meters (17,057 feet).</li>
                          <li>• Mount Stanley in Uganda, which reaches 5,109 meters (16,762 feet).</li>
                        </ul>
                      </div>
                    </div>

                    {/* Instruction Backdrop */}
                    <div className="bg-blue-50 border border-blue-100 text-blue-750 p-2.5 rounded-xl text-[9px] leading-normal font-sans font-semibold">
                      you have to do is click the generate response button, read the generated responses, and speak them out naturally.
                    </div>

                    {/* Controls Row */}
                    <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                        <button className="px-3 py-1.5 bg-[#0b0f19] border border-emerald-500/20 text-[#10b981] font-black text-[10px] rounded-lg hover:bg-black transition-all cursor-pointer">
                          Generate Response
                        </button>
                        <div className="flex items-center gap-2 text-[9px] text-gray-400 font-semibold">
                          <span>⏱️ 54 mins</span>
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-500 font-black border border-red-100 rounded cursor-pointer hover:bg-red-100 transition-colors">Exit</span>
                          <span className="flex items-center gap-0.5 text-emerald-600 font-extrabold">
                            🎤 Live
                          </span>
                        </div>
                      </div>
                      {/* Watch on YouTube Row */}
                      <div className="flex justify-end text-[9px] font-semibold text-gray-500">
                        <a href="#youtube" className="flex items-center gap-1 hover:text-red-600 transition-colors">
                          <span>Watch on</span> <span className="bg-red-600 text-white font-extrabold px-1 rounded">YouTube</span>
                        </a>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {/* Left panel: Code captured */}
                  <div className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="border-b border-gray-100 pb-2">
                      <span className="block text-[10px] text-teal-600 font-black uppercase tracking-wider mb-1">🖥️ captured coding task</span>
                      <p className="text-[#0d2e27] font-mono text-[10px] font-bold leading-relaxed">{codingProblem.question}</p>
                    </div>
                    <pre className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-emerald-800 font-mono leading-relaxed text-[9px] overflow-x-auto max-h-[180px] no-scrollbar">{simulatedCode || '// loading code context...'}</pre>
                  </div>

                  {/* Right panel: Solution output */}
                  <div className="bg-[#f1f5f9] rounded-2xl border border-gray-200/60 p-4 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="border-b border-gray-200 pb-2">
                      <span className="block text-[10px] text-emerald-600 font-black uppercase tracking-wider">🤖 AI Solutions (Java)</span>
                    </div>
                    <pre className="text-gray-700 font-mono text-[9px] leading-relaxed overflow-x-auto max-h-[160px] no-scrollbar whitespace-pre">{simulatedSolution}</pre>
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



      {/* Compatibility Green Banner */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Decorative backdrop graphics */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-[80px]"></div>

          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">
              Works with any interview platform
            </h2>
            <p className="text-emerald-100 text-base sm:text-lg leading-relaxed">
              You can use Anazk AI with any video, web-based, or coding platform including Zoom, Google Meet, Microsoft Teams, Webex, HackerRank, and LeetCode. Works completely independent of the application, running directly on your OS.
            </p>
            <div className="pt-4">
              <a 
                href="#sandbox"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 font-black rounded-full text-sm transition-all shadow-md cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                Try Interactive Demo
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center relative">
            {/* Mascot Image Displayed beautifully */}
            <div className="w-56 h-56 md:w-64 md:h-64 rounded-full bg-white/10 border border-white/20 p-2 flex items-center justify-center relative shadow-inner overflow-hidden">
              <img 
                src="/penguin.jpg" 
                alt="Anazk Mascot" 
                className="w-[90%] h-[90%] object-cover rounded-full shadow-lg"
              />
            </div>
            
            {/* Floating Logo Badges */}
            <div className="absolute -top-4 -left-4 bg-white p-2.5 rounded-2xl shadow-lg border border-gray-100 w-12 h-12 flex items-center justify-center text-blue-600 font-bold">Z</div>
            <div className="absolute -bottom-4 right-10 bg-white p-2.5 rounded-2xl shadow-lg border border-gray-100 w-12 h-12 flex items-center justify-center text-orange-600 font-bold">M</div>
            <div className="absolute top-1/2 -right-6 bg-white p-2.5 rounded-2xl shadow-lg border border-gray-100 w-12 h-12 flex items-center justify-center text-teal-600 font-bold">T</div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
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

      {/* Testimonials section */}
      <section id="reviews" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
            Reviews
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-[#0d2e27] flex items-center justify-center gap-2">
            People love AnazkAI
            <span className="inline-flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-500 rounded-full w-9 h-9 text-base">💬</span>
          </h2>
          <p className="text-gray-600 text-base sm:text-lg font-semibold tracking-wide">
            Real developers who landed offers at top companies using our stealth companion
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-6xl mx-auto">
          
          {/* Card 1: Prem Kumar */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between text-left hover:border-emerald-500/20 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src="/prem.png" alt="Prem Kumar" className="w-11 h-11 rounded-full object-cover border border-emerald-500/10" />
                <div className="flex-1">
                  <span className="block font-black text-sm text-gray-900 uppercase">Prem Kumar</span>
                  <a href="https://www.instagram.com/_its_prem__7/" target="_blank" rel="noreferrer" className="block text-xs font-bold text-emerald-600 hover:underline">@_its_prem__7</a>
                </div>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 text-[14px] leading-relaxed font-medium">
                Behavioral rounds became so easy. It Tailored answers using my actual resume experience. I just read from the overlay. Really a game changer.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold mt-4">
              <span className="font-extrabold uppercase">Verified Candidate</span>
              <span>Jul 21, 2026</span>
            </div>
          </div>

          {/* Card 2: Priyanshu Kumar */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between text-left hover:border-emerald-500/20 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img src="/priyanshu.png" alt="Priyanshu Kumar" className="w-11 h-11 rounded-full object-cover border border-emerald-500/10" />
                  <div>
                    <span className="block font-black text-sm text-gray-900 uppercase">Priyanshu Kumar</span>
                    <a href="https://www.instagram.com/007_priyanshu_/" target="_blank" rel="noreferrer" className="block text-xs font-bold text-emerald-600 hover:underline">@007_priyanshu_</a>
                  </div>
                </div>
                <a href="https://www.instagram.com/007_priyanshu_/" target="_blank" rel="noreferrer" className="text-sky-500 font-extrabold text-[10px] bg-sky-50 border border-sky-100 px-3 py-1 rounded-full hover:bg-sky-100 cursor-pointer">Follow</a>
              </div>
              <p className="text-gray-700 text-[14px] leading-relaxed font-medium">
                Bhai setup is super easy. The best part is screen share invisible protection. I shared my screen on Google Meet and Zoom, and they saw nothing. Highly recommend.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold mt-4">
              <span className="flex items-center gap-1 font-extrabold uppercase text-gray-500">❤️ 986 <span className="pl-2">💬 Reply</span></span>
              <span>11:15 PM - Jan 17, 2026</span>
            </div>
          </div>

          {/* Card 3: Abhinav Asthana */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between text-left hover:border-emerald-500/20 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img src="/abhinav.png" alt="Abhinav Asthana" className="w-11 h-11 rounded-full object-cover border border-emerald-500/10" />
                  <div>
                    <span className="block font-black text-sm text-gray-900 uppercase">Abhinav Asthana</span>
                    <a href="https://www.instagram.com/abhinav.asthana__/" target="_blank" rel="noreferrer" className="block text-xs font-bold text-emerald-600 hover:underline">@abhinav.asthana__</a>
                  </div>
                </div>
                <a href="https://www.instagram.com/abhinav.asthana__/" target="_blank" rel="noreferrer" className="text-sky-500 font-extrabold text-[10px] bg-sky-50 border border-sky-100 px-3 py-1 rounded-full hover:bg-sky-100 cursor-pointer">Follow</a>
              </div>
              <p className="text-gray-700 text-[14px] leading-relaxed font-medium">
                The transcription speed is crazy. Even with my interviewer's accent and complex topics like Redis, it transcribed everything perfectly. Saved me so much stress.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold mt-4">
              <span className="flex items-center gap-1 font-extrabold uppercase text-gray-500">❤️ 412 <span className="pl-2">💬 Reply</span></span>
              <span>10:42 PM - Feb 14, 2026</span>
            </div>
          </div>

          {/* Card 4: Nitesh Kumar */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between text-left hover:border-emerald-500/20 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img src="/nitesh.png" alt="Nitesh Kumar" className="w-11 h-11 rounded-full object-cover border border-emerald-500/10" />
                  <div>
                    <span className="block font-black text-sm text-gray-900 uppercase">Nitesh Kumar</span>
                    <a href="https://www.instagram.com/_.nitesh__kumar._/" target="_blank" rel="noreferrer" className="block text-xs font-bold text-emerald-600 hover:underline">@_.nitesh__kumar._</a>
                  </div>
                </div>
                <a href="https://www.instagram.com/_.nitesh__kumar._/" target="_blank" rel="noreferrer" className="text-sky-500 font-extrabold text-[10px] bg-sky-50 border border-sky-100 px-3 py-1 rounded-full hover:bg-sky-100 cursor-pointer">Follow</a>
              </div>
              <p className="text-gray-700 text-[14px] leading-relaxed font-medium">
                Honestly, this app is a life saver. I had a tough coding interview last week, it transcribed everything and gave me the answer in seconds. Cleared the round easily!
              </p>
            </div>
            <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold mt-4">
              <span className="flex items-center gap-1 font-extrabold uppercase text-gray-500">❤️ 385 <span className="pl-2">💬 Reply</span></span>
              <span>11:06 PM - Jan 7, 2026</span>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="inline-block bg-[#e6f4ea] text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="font-display font-black text-4xl sm:text-[46px] text-[#0d2e27] tracking-tight">
            Buy credits or Go unlimited ✨
          </h2>
        </div>

        {/* Switch Selector Pill */}
        <div className="flex flex-col items-center gap-6 mt-8 relative max-w-md mx-auto">
          <div className="flex bg-[#f1f5f9] p-1.5 rounded-full border border-gray-200">
            <button 
              onClick={() => setPricingOption('credits')}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-extrabold transition-all cursor-pointer ${pricingOption === 'credits' ? 'bg-[#dcfce7] text-[#15803d] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {pricingOption === 'credits' && <span>✓</span>}
              Credits only
            </button>
            <button 
              onClick={() => setPricingOption('subscription')}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-extrabold transition-all cursor-pointer ${pricingOption === 'subscription' ? 'bg-[#dcfce7] text-[#15803d] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {pricingOption === 'subscription' && <span>✓</span>}
              Subscription
            </button>
          </div>

          {/* Sketchy Helper Note */}
          <div className="hidden lg:block absolute left-[102%] top-0 w-48 text-left">
            <span className="font-sans text-[11px] text-gray-400 italic block leading-tight font-semibold">Multiple pricing options available</span>
            <svg className="w-10 h-10 text-gray-300 ml-4 mt-1" viewBox="0 0 40 40" fill="none">
              <path d="M5,5 C15,15 20,25 35,30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M28,32 L36,31 L32,23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Small Centered Policy Links */}
        <div className="flex justify-center items-center gap-6 text-xs text-gray-500 font-semibold mt-4">
          <a href="#refund" className="hover:text-gray-800 transition-colors">Refund Policy</a>
          <span className="text-gray-300">|</span>
          <a href="#unlimited" className="hover:text-gray-800 transition-colors">Unlimited Calls</a>
          <span className="text-gray-300">|</span>
          <a href="#cancel" className="hover:text-gray-800 transition-colors">Cancel Anytime</a>
        </div>

        {/* Slider Card Row */}
        <div className="flex items-center justify-center gap-4 mt-12 max-w-5xl mx-auto">
          
          {/* Scroll Left Button */}
          <button 
            onClick={() => setPricingOption(pricingOption === 'credits' ? 'subscription' : 'credits')}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Cards Frame */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {pricingOption === 'subscription' ? (
              <>
                {/* Card 1: Weekly */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-emerald-500/20 hover:shadow-xl shadow-sm space-y-6 flex flex-col justify-between transition-all text-left">
                  <div className="space-y-4">
                    <span className="block text-sm font-extrabold text-[#15803d] uppercase tracking-wider">Weekly</span>
                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-[#0d2e27]">₹1,500</span>
                      <span className="block text-gray-400 text-xs font-semibold mt-1">($19.90) per week</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 font-semibold pt-4 border-t border-gray-50">
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <span>∞ Unlimited Calls</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => setShowSignInModal(true)}
                    className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#0d2e27] rounded-full text-sm font-bold shadow-sm transition-all cursor-pointer"
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
                    onClick={() => setShowSignInModal(true)}
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
                    onClick={() => setShowSignInModal(true)}
                    className="w-full py-3.5 bg-black hover:bg-gray-900 text-white rounded-full text-sm font-black shadow-lg transition-all cursor-pointer"
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

      {/* Footer */}
      <footer className="bg-[#041c16] text-[#94a3b8] py-16 px-6 relative overflow-hidden text-left border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
          
          {/* Left Side: Large Penguin Mascot */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="w-48 h-48 md:w-60 md:h-60 relative">
              <img 
                src="/penguin.jpg" 
                alt="Anazk Penguin Mascot" 
                className="w-full h-full object-cover rounded-3xl border border-white/10 shadow-2xl" 
              />
            </div>
          </div>

          {/* Right Side: Navigation & Social Links */}
          <div className="flex-1 max-w-2xl space-y-8">
            <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <span>✈️</span> Have a question? Let's chat!
            </h3>

            {/* Pill Buttons Rows */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <a href="#comparisons" className="px-4 py-2 border border-white/10 hover:border-emerald-500 rounded-full text-xs font-semibold text-gray-300 hover:text-white transition-all">Comparisons</a>
                <a href="#feedback" className="px-4 py-2 border border-white/10 hover:border-emerald-500 rounded-full text-xs font-semibold text-gray-300 hover:text-white transition-all">Feedback</a>
                <a href="#support" className="px-4 py-2 border border-white/10 hover:border-emerald-500 rounded-full text-xs font-semibold text-gray-300 hover:text-white transition-all">Support</a>
                <a href="#terms" className="px-4 py-2 border border-white/10 hover:border-emerald-500 rounded-full text-xs font-semibold text-gray-300 hover:text-white transition-all">Terms & Conditions</a>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="#privacy" className="px-4 py-2 border border-white/10 hover:border-emerald-500 rounded-full text-xs font-semibold text-gray-300 hover:text-white transition-all">Privacy Policy</a>
                <a href="#refund" className="px-4 py-2 border border-white/10 hover:border-emerald-500 rounded-full text-xs font-semibold text-gray-300 hover:text-white transition-all">Refund Policy</a>
              </div>
            </div>

            {/* Social Links List */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-gray-400">
              <a href="#blog" className="hover:text-white transition-colors">Blog</a>
              <a href="#youtube" className="hover:text-white transition-colors">YouTube</a>
              <a href="#twitter" className="hover:text-white transition-colors">X (Twitter)</a>
              <a href="#linkedin" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#instagram" className="hover:text-white transition-colors">Instagram</a>
              <a href="#facebook" className="hover:text-white transition-colors">Facebook</a>
              <a href="#tiktok" className="hover:text-white transition-colors">TikTok</a>
            </div>

            {/* Other Projects */}
            <div className="text-xs text-gray-500">
              Our other projects: <a href="https://goodview.ai" target="_blank" rel="noreferrer" className="text-gray-400 hover:underline">GoodviewAI</a>
            </div>

            {/* Copyright */}
            <div className="text-xs text-gray-600 font-semibold pt-4 border-t border-white/5">
              AnazkAI d.o.o. All Rights Reserved.
            </div>
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
              Stable Build v2.0.0. Developed by Prince Yadav.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default LandingPage;
