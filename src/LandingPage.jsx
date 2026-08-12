import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Play, CheckCircle2, Download, Menu, X, Mic, Monitor, Star, 
  MoreVertical, Move, ChevronDown, CornerDownLeft, Sparkles, Settings, Copy, 
  Shield, EyeOff, User, Users, ChevronLeft, ChevronRight, Lock, Laptop, Check
} from 'lucide-react';

function LandingPage() {
  const [activeTab, setActiveTab] = useState('non-coding'); // 'non-coding' or 'coding'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [pricingOption, setPricingOption] = useState('subscription'); // 'subscription' or 'credits'
  const [expandedReviewer, setExpandedReviewer] = useState(null);

  const reviewEmail = 'support@anazkai.com';
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
      <nav className={`fixed top-5 left-1/2 -translate-x-1/2 w-[96%] lg:w-[98%] max-w-none z-50 backdrop-blur-xl border px-6 py-3 rounded-full flex justify-between items-center transition-all duration-700 shadow-[0_10px_30px_rgba(16,185,129,0.05)] ${activeTab === 'coding' ? 'bg-[#0f172a]/70 border-emerald-500/20 text-white' : 'bg-white/70 border-emerald-500/10 text-[#0d2e27]'}`}>
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
            onClick={() => setShowSignInModal(true)}
            className={`px-6 py-2.5 border font-extrabold text-sm rounded-full transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98] cursor-pointer ${activeTab === 'coding' ? 'bg-[#1e293b] border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'}`}
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
          <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-gray-700 hover:text-sky-400 py-1.5 border-b border-gray-50">Early access</a>
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
      <header className="min-h-screen pt-32 pb-24 px-4 sm:px-8 lg:px-12 w-full mx-auto flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
         {/* Hero Left Content */}
        <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
          
          <h1 className={`font-display font-black text-[40px] sm:text-[54px] lg:text-[68px] leading-[1.1] tracking-tight transition-colors duration-700 ${activeTab === 'coding' ? 'text-white' : 'text-[#0d2e27]'}`}>
            Your calm advantage in every interview
          </h1>

          <p className={`text-base sm:text-[20px] lg:text-[21px] max-w-2xl mx-auto lg:mx-0 font-semibold leading-relaxed mt-6 transition-colors duration-700 ${activeTab === 'coding' ? 'text-gray-400' : 'text-gray-650'}`}>
            Listen clearly. Think faster. Answer with confidence. Get intelligent guidance for coding, technical, behavioral, and system design interviews — powered by advanced AI
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

          {/* Transparent early-access note */}
          <div className="pt-6 border-t border-sky-500/15 flex items-start gap-3 justify-center lg:justify-start text-left">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Users size={16} />
            </div>
            <div className="text-xs font-medium">
              <span className={`block font-black text-sm transition-colors duration-700 ${activeTab === 'coding' ? 'text-gray-200' : 'text-slate-800'}`}>Currently reviewed by 11 people</span>
              <span className="mt-1 block max-w-sm leading-relaxed text-slate-500">We are validating the experience with a small review group before a wider launch.</span>
            </div>
          </div>
        </div>
             {/* Hero Right - Interactive Mockup Window */}
        <div className="lg:col-span-6 flex flex-col items-center relative select-none">
          
          {/* Window Tabs (Floating above mockup container) */}
          <div className={`flex justify-center border p-1 rounded-full shadow-md relative z-20 -mb-5 transition-colors duration-700 ${activeTab === 'coding' ? 'bg-slate-900 border-gray-700' : 'bg-white border-gray-250/60'}`}>
            <button 
              onClick={() => setActiveTab('non-coding')}
              className={`flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${activeTab === 'non-coding' ? 'bg-[#0d2e27] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Non-Coding
            </button>
            <button 
              onClick={() => setActiveTab('coding')}
              className={`flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${activeTab === 'coding' ? 'bg-[#0d2e27] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Coding
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
            <div className="p-4 bg-[#f8fafc] rounded-b-3xl min-h-[660px] text-left font-mono relative overflow-hidden">
              {activeTab === 'non-coding' ? (
                <div className="relative w-full h-[620px] font-sans">
                  
                  {/* Right Panel: Light Grey Card (AI Response) - Placed in background on right */}
                  <div className="absolute right-0 top-0 bottom-0 w-[52%] bg-[#f1f5f9] rounded-2xl border border-gray-200/60 p-5 shadow-sm flex flex-col justify-between space-y-3 z-0 text-left">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-[10px] text-[#0d2e27] font-black uppercase tracking-wider">🖥️ AI Response</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-semibold">
                          <span>AutoScroll</span>
                          <span className="w-6 h-3.5 bg-[#10b981] rounded-full inline-block relative p-0.5"><span className="w-2.5 h-2.5 bg-white rounded-full block float-right"></span></span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-[10px] text-gray-750 leading-relaxed font-sans overflow-y-auto max-h-[360px] no-scrollbar pr-1 pt-2">
                        <span className="block text-gray-400 font-mono text-[9px]">all you have to do</span>
                        <p className="font-extrabold text-[#0d2e27]">• Summarized question: What are the three highest mountains in Africa?</p>
                        <p className="text-yellow-600 font-extrabold">⭐ Answer:</p>
                        <ul className="space-y-1.5 pl-2 text-gray-600 font-semibold list-disc">
                          <li>Mount Kilimanjaro in Tanzania, standing at 5,895 meters (19,341 feet).</li>
                          <li>Mount Kenya in Kenya, with a height of 5,199 meters (17,057 feet).</li>
                          <li>Mount Stanley in Uganda, which reaches 5,109 meters (16,762 feet).</li>
                        </ul>
                      </div>
                    </div>

                    {/* Instruction Backdrop */}
                    <div className="bg-blue-50 border border-blue-100 text-blue-750 p-3 rounded-2xl text-[9px] leading-normal font-sans font-semibold">
                      you have to do is click the generate response button, read the generated responses, and speak them out naturally.
                    </div>

                    {/* Controls Row */}
                    <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                        <button className="px-3.5 py-1.5 bg-[#0b0f19] border border-emerald-500/20 text-[#10b981] font-black text-[10px] rounded-lg hover:bg-black transition-all cursor-pointer">
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
                        <a href="#youtube" className="flex items-center gap-1 hover:text-red-650 transition-colors">
                          <span>Watch on</span> <span className="bg-red-600 text-white font-extrabold px-1 rounded">YouTube</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Left Top Panel: White Card (Video) - Overlaps AI Response slightly */}
                  <div className="absolute left-0 top-0 w-[54%] h-[310px] z-10 bg-black rounded-2xl overflow-hidden border border-gray-200/50 shadow-md flex flex-col justify-between p-4 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=250&q=80')" }}>
                    <div className="absolute inset-0 bg-black/35 z-0"></div>
                    
                    <div className="flex justify-between items-center z-10 w-full">
                      <span className="text-[10px] text-white font-bold flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        Anazk AI in action
                      </span>
                      <span className="text-[9px] bg-red-600 text-white font-black px-2 py-0.5 rounded">LIVE</span>
                    </div>

                    {/* Centered Right Overlap Play Button */}
                    <div className="absolute right-[-22px] top-[50%] -translate-y-[50%] z-20">
                      <button className="w-11 h-11 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 cursor-pointer border-2 border-white">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>

                    <div className="z-10"></div>
                  </div>

                  {/* Left Bottom Panel: Transcript - Overlaps AI Response slightly */}
                  <div className="absolute left-0 bottom-0 w-[54%] h-[270px] z-10 bg-white rounded-2xl border border-gray-200 p-5 shadow-md flex flex-col justify-between text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-[10px] text-[#0d2e27] font-black uppercase tracking-wider">📝 Transcript</span>
                      <div className="flex items-center gap-1 text-[9px] text-gray-400 font-semibold">
                        <span>AutoScroll</span>
                        <span className="w-5 h-3.5 bg-[#10b981] rounded-full inline-block relative p-0.5"><span className="w-2 h-2 bg-white rounded-full block float-right"></span></span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 italic text-[11px] leading-relaxed pr-2 overflow-y-auto max-h-[160px] no-scrollbar">
                      &quot;this position Anazk AI i provides answers&quot;
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch font-sans">
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
                    <div className="border-b border-gray-250 pb-2">
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



      {/* Desktop App CTA Banner */}
      <section className="px-6 py-10 max-w-[1200px] mx-auto mt-4">
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
          
          {/* Right Image/Mockup */}
          <div className="w-full lg:w-[55%] min-h-[400px] lg:min-h-full relative overflow-hidden flex items-center justify-end bg-[#111315]">
            <img src="/anazk-hero-laptop.png?v=2" alt="Anazk AI laptop experience" className="h-full w-full object-contain object-center p-5 opacity-95 hover:opacity-100 transition-opacity duration-500" />
            {/* Rebranded in-image header */}
            <div className="absolute left-[27%] top-[18%] z-20 flex items-center gap-1.5 rounded-md bg-[#25262a] px-2 py-1 shadow-lg">
              <span className="flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-cyan-500 text-[8px] font-black text-slate-950">A</span>
              <span className="text-[10px] font-black tracking-tight text-white">Anazk AI</span>
            </div>
            {/* Gradient overlay to blend left edge with background */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#111315] to-transparent z-10"></div>
          </div>
        </div>
      </section>      {/* Compatibility Green Banner */}
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
                src="/anazk-product-laptop.jpeg" 
                alt="Anazk AI product preview" 
                className="h-full w-full object-contain rounded-2xl shadow-lg"
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

      {/* Early access reviewer section */}
      <section id="reviews" className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 text-center sm:mb-12">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              <Users size={14} /> Early access reviewers
            </span>
            <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">Reviewed by the people helping us make it better.</h2>
            <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-slate-400 sm:text-lg">These 11 reviewers are currently testing Anazk AI and sharing direct feedback before the wider launch.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {reviewers.map((reviewer, index) => {
              const isExpanded = expandedReviewer === index;
              return (
                <button
                  key={reviewer.name}
                  type="button"
                  onClick={() => setExpandedReviewer(isExpanded ? null : index)}
                  aria-expanded={isExpanded}
                  className="group rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-center text-left transition duration-300 hover:-translate-y-1 hover:border-sky-400/40 hover:bg-white/[0.08]"
                >
                  <img src={reviewer.image} alt={`${reviewer.name}, Anazk AI reviewer`} className="mx-auto size-16 rounded-full border border-white/15 object-cover grayscale-[15%] transition duration-300 group-hover:grayscale-0 sm:size-20" />
                  <p className="mt-3 truncate text-xs font-black text-slate-200 sm:text-sm">{reviewer.name}</p>
                  <div className="mt-2 flex justify-center gap-0.5 text-amber-300" aria-label={`${reviewer.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, star) => <Star key={star} size={13} fill="currentColor" className={star < reviewer.rating ? 'opacity-100' : 'opacity-25'} aria-hidden="true" />)}
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-300/70">{isExpanded ? 'Hide feedback' : 'View feedback'}</p>
                  {isExpanded && <p className="mt-3 border-t border-white/10 pt-3 text-left text-xs font-medium leading-relaxed text-slate-300">“{reviewer.review}”</p>}
                </button>
              );
            })}
          </div>
          <div className="mt-10 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.08] p-6 text-center sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Want to be next?</p>
            <h3 className="mt-3 font-display text-2xl font-black text-white sm:text-3xl">Buy Premium, share your experience.</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Tell us what you used, how it helped, your rating, and whether we can publish your feedback. The button opens a pre-filled Gmail review form.</p>
            <a href={reviewComposeUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300">
              Be the next reviewer <ArrowRight size={16} />
            </a>
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

      {/* Premium Footer */}
      <footer className="premium-footer border-t border-white/10 px-6 py-14 text-left">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-md">
              <div className="mb-4 flex items-center gap-3">
                <img src="/anazk-product-laptop.jpeg" alt="Anazk AI product mark" className="size-10 rounded-2xl border border-white/10 object-cover" />
                <span className="font-display text-xl font-black tracking-tight text-white">Anazk AI</span>
              </div>
              <h3 className="font-display text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">Think clearly. Respond confidently.</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">A focused AI copilot for the moments where preparation matters most.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-300">
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
              Stable Build v2.0.0. Developed by Prince Yadav.
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

      {/* Floating Right Scroll Navigator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3.5 p-3.5 bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-full shadow-xl">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-gray-400 hover:text-sky-600 transition-all p-1.5 rounded-full hover:bg-gray-100 cursor-pointer font-bold text-sm"
          title="Scroll to Top"
        >
          ▲
        </button>
        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-sm"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
        <button 
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
          className="text-gray-400 hover:text-sky-600 transition-all p-1.5 rounded-full hover:bg-gray-100 cursor-pointer font-bold text-sm"
          title="Scroll to Bottom"
        >
          ▼
        </button>
      </div>

    </div>
  );
}

export default LandingPage;
