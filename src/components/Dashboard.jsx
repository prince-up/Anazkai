import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Radio, 
  FileText, 
  Files, 
  HelpCircle, 
  Video, 
  MessageSquare, 
  Sparkles, 
  LogOut, 
  Monitor, 
  Plus, 
  Search, 
  ArrowUpDown, 
  Grid, 
  List, 
  X, 
  Check, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Trash2, 
  Play, 
  Download,
  Laptop,
  ChevronRight,
  ShieldCheck,
  Zap,
  BookOpen,
  Menu,
  UploadCloud,
  FileCheck,
  Send,
  Bot,
  User as UserIcon,
  CornerDownLeft
} from 'lucide-react';

export default function Dashboard({ user, onSignOut, onOpenPricing, onOpenDownload, onBackToHome }) {
  const [activeTab, setActiveTab] = useState('callSessions'); // 'callSessions' | 'cvs' | 'documents' | 'gettingStarted' | 'tutorials'
  const [sessionFilter, setSessionFilter] = useState('all'); // 'all' | 'active' | 'ended'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState('list'); // 'list' | 'grid'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Support Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hi! I'm the Hide AI Support Assistant. How can I help you with your interview preparation or desktop setup today?",
      actions: [
        { label: '📄 How to use resume context?', query: 'how to upload and use resume in interview' },
        { label: '🛡️ Stealth hotkeys guide', query: 'what are hotkeys F1 F3 F4' },
        { label: '💳 How to buy credits?', query: 'how to buy credits' }
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);

  // Stored Sessions in localStorage
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(`anazk_sessions_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Stored Resumes in localStorage (with PDF support)
  const [resumes, setResumes] = useState(() => {
    try {
      const saved = localStorage.getItem(`anazk_resumes_${user?.id || 'guest'}`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(r => r.name !== 'Software_Engineer_Resume_2026.pdf') : [];
    } catch (e) {
      return [];
    }
  });

  // Stored Documents in localStorage
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem(`anazk_docs_${user?.id || 'guest'}`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(d => !d.title?.includes('Cheat Sheet') && !d.title?.includes('STAR Method')) : [];
    } catch (e) {
      return [];
    }
  });

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // New Session Form State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionType, setNewSessionType] = useState('Coding & Algorithms');
  const [newSessionPlatform, setNewSessionPlatform] = useState('Google Meet');
  const [newSessionCompany, setNewSessionCompany] = useState('');

  // New Doc State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('General');
  const [newDocContent, setNewDocContent] = useState('');

  // New PDF / Resume Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [newResumeRole, setNewResumeRole] = useState('');
  const [fileUploadError, setFileUploadError] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [extractedResumeText, setExtractedResumeText] = useState('');
  const fileInputRef = useRef(null);

  // Save state
  useEffect(() => {
    try {
      localStorage.setItem(`anazk_sessions_${user?.id || 'guest'}`, JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions, user]);

  useEffect(() => {
    try {
      localStorage.setItem(`anazk_resumes_${user?.id || 'guest'}`, JSON.stringify(resumes));
    } catch (e) {}
  }, [resumes, user]);

  useEffect(() => {
    try {
      localStorage.setItem(`anazk_docs_${user?.id || 'guest'}`, JSON.stringify(documents));
    } catch (e) {}
  }, [documents, user]);

  useEffect(() => {
    if (chatOpen && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  // User details
  const userEmail = user?.email || 'user@example.com';
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const userInitials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AZ';

  // Handle PDF File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadError('');
    if (file.size > 15 * 1024 * 1024) {
      setFileUploadError('File size exceeds 15MB limit. Please upload a smaller PDF.');
      return;
    }

    setSelectedFile(file);

    // Read text from file if possible (for .txt / basic content)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setExtractedResumeText(text.slice(0, 5000));
      }
    };
    reader.readAsText(file);
  };

  // Handle Save Resume (PDF / Doc)
  const handleSaveResume = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileUploadError('Please select a PDF or Document file to upload.');
      return;
    }

    setIsUploadingFile(true);

    setTimeout(() => {
      const fileSizeFormatted = selectedFile.size > 1024 * 1024 
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(selectedFile.size / 1024)} KB`;

      const newResumeObj = {
        id: Date.now().toString(),
        name: selectedFile.name,
        role: newResumeRole.trim() || 'Software Engineer',
        uploadedAt: 'Just now',
        size: fileSizeFormatted,
        type: selectedFile.type || 'application/pdf',
        contentSnippet: extractedResumeText
      };

      setResumes([newResumeObj, ...resumes]);
      setSelectedFile(null);
      setNewResumeRole('');
      setExtractedResumeText('');
      setIsUploadingFile(false);
      setShowResumeModal(false);
    }, 600);
  };

  // Handle Create Session
  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    const newSession = {
      id: Date.now().toString(),
      title: newSessionTitle.trim(),
      type: newSessionType,
      platform: newSessionPlatform,
      company: newSessionCompany.trim() || 'Interview Call',
      status: 'active',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions([newSession, ...sessions]);
    setNewSessionTitle('');
    setNewSessionCompany('');
    setShowCreateModal(false);
  };

  // Chatbot response generator
  const handleSendChatMessage = (rawQuery) => {
    const queryText = (typeof rawQuery === 'string' ? rawQuery : chatInput).trim();
    if (!queryText) return;

    const userMsgId = Date.now();
    setChatMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: queryText }
    ]);
    setChatInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      const q = queryText.toLowerCase();
      let botReply = "I can help with that! Hide AI provides active content-protection overlay for Google Meet, Zoom, and MS Teams.";
      let actions = [];

      if (q.includes('resume') || q.includes('cv') || q.includes('pdf')) {
        botReply = "📄 You can upload your resume in PDF format under the 'CVs & Resumes' tab. Hide AI will automatically reference your past projects, stack, and metrics when formulating answers during live interview rounds.";
      } else if (q.includes('hotkey') || q.includes('f1') || q.includes('f3') || q.includes('f4') || q.includes('stealth')) {
        botReply = "🛡️ Stealth Hotkeys:\n• F1: Instant Full-screen OCR capture\n• F4: Snip region of coding question\n• F3: Stream AI answer directly to your invisible HUD overlay.";
      } else if (q.includes('credit') || q.includes('plan') || q.includes('price') || q.includes('buy') || q.includes('cost')) {
        botReply = "💳 Credit Plans Available:\n• ₹259 for 1 Hour Session (60 mins)\n• ₹500 for 2 Hours Session (120 mins - Best Deal)\n• ₹2,500 for 10 Interview Sessions (1200 mins).";
        actions = [{ label: '⚡ View Upgrade Plans', query: 'upgrade' }];
      } else {
        botReply = "I'm your 24/7 AI interview copilot guide. Feel free to create a session, upload your PDF resume, or launch the desktop app for stealth mode.";
      }

      setChatMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'bot', text: botReply, actions }
      ]);
      setIsBotTyping(false);
    }, 700);
  };

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (sessionFilter === 'all') return true;
    if (sessionFilter === 'active') return s.status === 'active';
    if (sessionFilter === 'ended') return s.status === 'ended';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fbf5] via-[#f8fafc] to-[#edf7fc] flex flex-col md:flex-row font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900 antialiased relative">
      
      {/* ─── MOBILE TOPBAR (SMARTPHONE VIEWPORT HEADER) ─── */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-emerald-500/15 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div 
          onClick={onBackToHome}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <img 
            src="/penguin.jpg" 
            alt="HideAI Logo" 
            className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500/30 shadow-xs" 
          />
          <span className="font-display font-black text-xl text-[#0d2e27] tracking-tight flex items-center">
            HideAI<span className="text-emerald-600 font-extrabold ml-1">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer border border-emerald-200/60"
            title="Open AI Support Chat"
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER BACKDROP ─── */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 animate-in fade-in duration-200"
        />
      )}

      {/* ─── LEFT SIDEBAR (DESKTOP + MOBILE DRAWER) ─── */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 md:z-auto
        w-72 bg-white/95 backdrop-blur-md border-r border-emerald-500/15 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(16,185,129,0.03)]
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Top Section: Brand & Nav Links */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-220px)] no-scrollbar">
          {/* Brand Logo & Close for Mobile */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div 
              onClick={() => { setMobileMenuOpen(false); onBackToHome(); }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img 
                src="/penguin.jpg" 
                alt="HideAI Logo" 
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/30 shadow-xs group-hover:scale-105 transition-transform" 
              />
              <span className="font-display font-black text-2xl text-[#0d2e27] tracking-tight flex items-center">
                HideAI<span className="text-emerald-600 font-extrabold ml-1">AI</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={onBackToHome}
                className="hidden md:flex text-gray-400 hover:text-emerald-700 p-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
                title="Home Page"
              >
                <ExternalLink size={18} />
              </button>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Section 1: WORKSPACE */}
          <div className="space-y-2">
            <span className="block px-3 text-xs font-black text-gray-400 uppercase tracking-wider">
              Workspace
            </span>
            <nav className="space-y-1.5">
              <button
                onClick={() => { setActiveTab('callSessions'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'callSessions' 
                    ? 'bg-gradient-to-r from-emerald-50 to-sky-50 text-emerald-950 border border-emerald-300/50 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                }`}
              >
                <Radio size={18} className={activeTab === 'callSessions' ? 'text-emerald-600 animate-pulse' : 'text-gray-400'} />
                <span>Call Sessions</span>
              </button>

              <button
                onClick={() => { setActiveTab('cvs'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'cvs' 
                    ? 'bg-gradient-to-r from-emerald-50 to-sky-50 text-emerald-950 border border-emerald-300/50 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                }`}
              >
                <FileText size={18} className={activeTab === 'cvs' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>CVs & Resumes</span>
              </button>

              <button
                onClick={() => { setActiveTab('documents'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'documents' 
                    ? 'bg-gradient-to-r from-emerald-50 to-sky-50 text-emerald-950 border border-emerald-300/50 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                }`}
              >
                <Files size={18} className={activeTab === 'documents' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Documents</span>
              </button>
            </nav>
          </div>

          {/* Section 2: SUPPORT */}
          <div className="space-y-2">
            <span className="block px-3 text-xs font-black text-gray-400 uppercase tracking-wider">
              Support
            </span>
            <nav className="space-y-1.5">
              <button
                onClick={() => { setActiveTab('gettingStarted'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'gettingStarted' 
                    ? 'bg-gradient-to-r from-emerald-50 to-sky-50 text-emerald-950 border border-emerald-300/50 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                }`}
              >
                <HelpCircle size={18} className={activeTab === 'gettingStarted' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Getting Started</span>
              </button>

              <button
                onClick={() => { setActiveTab('tutorials'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'tutorials' 
                    ? 'bg-gradient-to-r from-emerald-50 to-sky-50 text-emerald-950 border border-emerald-300/50 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                }`}
              >
                <Video size={18} className={activeTab === 'tutorials' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Tutorials</span>
              </button>

              {/* Support Chat Button -> Opens Interactive AI Chatbot */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setChatOpen(true);
                }}
                className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all text-left cursor-pointer group"
              >
                <MessageSquare size={18} className="text-gray-400 group-hover:text-emerald-600" />
                <span>Support Chat</span>
                <span className="ml-auto text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">AI Live</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Section: Plan Card, Actions & User Profile */}
        <div className="p-4 space-y-3.5 border-t border-emerald-500/10 bg-emerald-50/30 shrink-0">
          
          {/* Free Plan Upgrade Card */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/90 p-3.5 rounded-2xl border border-emerald-200/70 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎁</span>
                <span className="text-xs sm:text-sm font-black text-[#0d2e27]">Free Plan</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-[11px] text-gray-600 font-semibold leading-relaxed">
              Start a 10 min free session or buy credits for full-length calls.
            </p>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenPricing(); }}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap size={13} className="text-amber-300 fill-amber-300" />
              <span>Upgrade</span>
            </button>
          </div>

          {/* Quick Action Links */}
          <div className="space-y-1">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenDownload(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:bg-white hover:text-emerald-800 transition-colors text-left cursor-pointer"
            >
              <Laptop size={16} className="text-emerald-600" />
              <span>Open Desktop App</span>
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); onSignOut(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
            >
              <LogOut size={16} className="text-red-500" />
              <span>Log Out</span>
            </button>
          </div>

          {/* User Profile Footer Pill */}
          <div className="flex items-center gap-3 px-2 pt-2 border-t border-emerald-500/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-100 to-sky-100 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-emerald-300/60">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-xs sm:text-sm font-black text-gray-900 truncate leading-tight">
                {fullName}
              </span>
              <span className="block text-[10px] sm:text-xs text-gray-500 font-medium truncate leading-tight mt-0.5">
                {userEmail}
              </span>
            </div>
          </div>

        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-y-auto">
        
        {/* TAB 1: CALL SESSIONS */}
        {activeTab === 'callSessions' && (
          <div className="p-4 sm:p-8 md:p-12 max-w-6xl w-full mx-auto space-y-6 sm:space-y-7">
            
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#0d2e27] tracking-tight">
                  Call Sessions
                </h1>
                <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-600 mt-1">
                  Prepare for calls and review past sessions.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm md:text-base font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={18} />
                <span>Create Session</span>
              </button>
            </div>

            {/* Sub-Navigation & Session Count */}
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
              <div className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm md:text-base font-extrabold">
                <button
                  onClick={() => setSessionFilter('all')}
                  className={`pb-3 transition-colors cursor-pointer relative ${
                    sessionFilter === 'all' 
                      ? 'text-[#0d2e27] font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-emerald-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSessionFilter('active')}
                  className={`pb-3 transition-colors cursor-pointer relative ${
                    sessionFilter === 'active' 
                      ? 'text-[#0d2e27] font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-emerald-700'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSessionFilter('ended')}
                  className={`pb-3 transition-colors cursor-pointer relative ${
                    sessionFilter === 'ended' 
                      ? 'text-[#0d2e27] font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-emerald-700'
                  }`}
                >
                  Ended
                </button>
              </div>

              <span className="text-xs sm:text-sm font-bold text-gray-500">
                {filteredSessions.length} Sessions
              </span>
            </div>

            {/* Search & Layout Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="relative flex-1 max-w-full sm:max-w-lg">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by title or description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-emerald-500/20 rounded-xl text-xs sm:text-sm font-semibold placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button 
                  onClick={() => setSessions([...sessions].reverse())}
                  className="p-2.5 sm:p-3 bg-white hover:bg-emerald-50 border border-emerald-500/20 text-gray-600 rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Sort Sessions"
                >
                  <ArrowUpDown size={16} />
                </button>
                <button 
                  onClick={() => setViewLayout('grid')}
                  className={`p-2.5 sm:p-3 border rounded-xl transition-all shadow-xs cursor-pointer ${
                    viewLayout === 'grid' 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' 
                      : 'bg-white border-emerald-500/20 text-gray-500 hover:text-emerald-700'
                  }`}
                  title="Grid View"
                >
                  <Grid size={16} />
                </button>
                <button 
                  onClick={() => setViewLayout('list')}
                  className={`p-2.5 sm:p-3 border rounded-xl transition-all shadow-xs cursor-pointer ${
                    viewLayout === 'list' 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' 
                      : 'bg-white border-emerald-500/20 text-gray-500 hover:text-emerald-700'
                  }`}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Sessions List or Empty State */}
            {filteredSessions.length === 0 ? (
              <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-4 bg-white/70 backdrop-blur-sm rounded-3xl border border-emerald-500/15 p-8 sm:p-12 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-100 to-sky-100 border border-emerald-200 text-2xl flex items-center justify-center shadow-xs">
                  🎙️
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-black text-lg sm:text-2xl text-[#0d2e27]">
                    You have no upcoming sessions
                  </h3>
                  <p className="text-xs sm:text-base text-gray-500 font-medium max-w-md">
                    Your upcoming sessions will appear here once created. Launch the copilot during any call.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-base font-black shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer mt-3"
                >
                  <Plus size={18} />
                  <span>Create Session</span>
                </button>
              </div>
            ) : (
              <div className={viewLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3.5'}>
                {filteredSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="bg-white/90 backdrop-blur-xs p-4 sm:p-6 rounded-2xl border border-emerald-500/15 shadow-xs hover:border-emerald-500/35 hover:shadow-md hover:shadow-emerald-500/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <h4 className="font-black text-sm sm:text-lg text-gray-900">{session.title}</h4>
                        <span className="text-[10px] sm:text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                          {session.platform}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 font-semibold">
                        <span>{session.company}</span>
                        <span>•</span>
                        <span>{session.type}</span>
                        <span>•</span>
                        <span>{session.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <button
                        onClick={onOpenDownload}
                        className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play size={14} fill="currentColor" />
                        <span>Launch Stealth Copilot</span>
                      </button>
                      <button
                        onClick={() => setSessions(sessions.filter(s => s.id !== session.id))}
                        className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: CVS & RESUMES (WITH PDF DRAG & DROP UPLOAD) */}
        {activeTab === 'cvs' && (
          <div className="p-4 sm:p-8 md:p-12 max-w-6xl w-full mx-auto space-y-6 sm:space-y-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#0d2e27] tracking-tight">
                  CVs & Resumes
                </h1>
                <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-600 mt-1">
                  Upload your PDF / DOC resumes so Hide AI tailors interview solutions directly to your background.
                </p>
              </div>

              <button
                onClick={() => setShowResumeModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm md:text-base font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={18} />
                <span>Upload PDF Resume</span>
              </button>
            </div>

            {resumes.length === 0 ? (
              <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-4 bg-white/70 backdrop-blur-sm rounded-3xl border border-emerald-500/15 p-8 sm:p-12 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-100 to-sky-100 border border-emerald-200 text-2xl flex items-center justify-center shadow-xs">
                  📄
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-black text-lg sm:text-2xl text-[#0d2e27]">
                    No CVs or resumes uploaded
                  </h3>
                  <p className="text-xs sm:text-base text-gray-500 font-medium max-w-md">
                    Upload your PDF resume to give Hide AI instant background context.
                  </p>
                </div>

                <button
                  onClick={() => setShowResumeModal(true)}
                  className="px-6 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-base font-black shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer mt-3"
                >
                  <Plus size={18} />
                  <span>Upload PDF Resume</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resumes.map((resume) => (
                  <div key={resume.id} className="bg-white/90 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-emerald-500/15 shadow-xs space-y-4 hover:border-emerald-500/35 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0">
                          📄
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm sm:text-base text-gray-900 truncate">{resume.name}</h4>
                          <span className="text-xs sm:text-sm text-gray-500 font-semibold block truncate">{resume.role}</span>
                          {resume.size && (
                            <span className="text-[10px] text-gray-400 font-medium">{resume.size}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setResumes(resumes.filter(r => r.id !== resume.id))}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Resume"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold">
                      <span>Uploaded: {resume.uploadedAt}</span>
                      <span className="font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Check size={12} />
                        Active Context
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="p-4 sm:p-8 md:p-12 max-w-6xl w-full mx-auto space-y-6 sm:space-y-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#0d2e27] tracking-tight">
                  Documents & Notes
                </h1>
                <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-600 mt-1">
                  Save job descriptions, interview cheat sheets, and system design notes.
                </p>
              </div>

              <button
                onClick={() => setShowDocModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm md:text-base font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={18} />
                <span>New Document</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-4 bg-white/70 backdrop-blur-sm rounded-3xl border border-emerald-500/15 p-8 sm:p-12 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-100 to-sky-100 border border-emerald-200 text-2xl flex items-center justify-center shadow-xs">
                  📑
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-black text-lg sm:text-2xl text-[#0d2e27]">
                    No documents or notes saved
                  </h3>
                  <p className="text-xs sm:text-base text-gray-500 font-medium max-w-md">
                    Save job descriptions, cheat sheets, or interview preparation notes.
                  </p>
                </div>

                <button
                  onClick={() => setShowDocModal(true)}
                  className="px-6 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-base font-black shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer mt-3"
                >
                  <Plus size={18} />
                  <span>New Document</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white/90 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-emerald-500/15 shadow-xs space-y-4 hover:border-emerald-500/35 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold text-xl shrink-0">
                          📑
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm sm:text-base text-gray-900 truncate">{doc.title}</h4>
                          <span className="text-xs sm:text-sm text-gray-500 font-semibold block truncate">{doc.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold">
                      <span>Edited {doc.lastEdited}</span>
                      <span className="text-emerald-700 font-bold cursor-pointer hover:underline">View Notes →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GETTING STARTED */}
        {activeTab === 'gettingStarted' && (
          <div className="p-4 sm:p-8 md:p-12 max-w-4xl w-full mx-auto space-y-6 sm:space-y-7">
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#0d2e27] tracking-tight">
                Getting Started with Hide AI
              </h1>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-600 mt-1">
                Everything you need to master your stealth AI interview copilot.
              </p>
            </div>

            <div className="space-y-5">
              <div className="bg-white/90 backdrop-blur-xs p-5 sm:p-7 rounded-2xl border border-emerald-500/15 shadow-xs space-y-4 hover:border-emerald-500/35 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base shrink-0 border border-emerald-200">1</div>
                  <h3 className="font-black text-base sm:text-lg text-gray-900">Install the Desktop Client</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed sm:pl-12 font-medium">
                  Download the native Windows client (.exe). It automatically engages hardware-level window protection so screen-sharing tools like Zoom, Microsoft Teams, and Google Meet cannot detect it.
                </p>
                <div className="sm:pl-12 pt-1">
                  <a 
                    href="https://drive.google.com/file/d/1YS9f4llIjXtVglups5bV_Uk5yCrpfEzy/view?usp=sharing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Download size={16} />
                    <span>Download Windows Client (.exe)</span>
                  </a>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-xs p-5 sm:p-7 rounded-2xl border border-emerald-500/15 shadow-xs space-y-4 hover:border-emerald-500/35 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base shrink-0 border border-emerald-200">2</div>
                  <h3 className="font-black text-base sm:text-lg text-gray-900">Stealth Hotkeys Reference</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:pl-12">
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60">
                    <span className="block font-mono text-emerald-700 font-black text-base">F1 Key</span>
                    <span className="text-sm font-bold text-gray-900">Full Screen OCR</span>
                    <p className="text-xs text-gray-600 font-medium mt-1">Captures active screen coding problem.</p>
                  </div>
                  <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200/60">
                    <span className="block font-mono text-sky-700 font-black text-base">F4 Key</span>
                    <span className="text-sm font-bold text-gray-900">Region Snipping</span>
                    <p className="text-xs text-gray-600 font-medium mt-1">Snips exact question bounds.</p>
                  </div>
                  <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200/60">
                    <span className="block font-mono text-teal-700 font-black text-base">F3 Key</span>
                    <span className="text-sm font-bold text-gray-900">Ask AI Instantly</span>
                    <p className="text-xs text-gray-600 font-medium mt-1">Streams formatted solution.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TUTORIALS (GOOGLE DRIVE EMBEDDED VIDEOS) */}
        {activeTab === 'tutorials' && (
          <div className="p-4 sm:p-8 md:p-12 max-w-5xl w-full mx-auto space-y-6 sm:space-y-7">
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#0d2e27] tracking-tight">
                Video Tutorials & Guides
              </h1>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-600 mt-1">
                Watch step-by-step walkthroughs of live coding, stealth setup, and interview demonstrations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video 1 */}
              <div className="bg-white/90 backdrop-blur-xs p-5 sm:p-6 rounded-3xl border border-emerald-500/15 shadow-xs space-y-4 flex flex-col justify-between hover:border-emerald-500/35 transition-all">
                <div className="space-y-3">
                  <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner relative border border-emerald-500/20">
                    <iframe
                      src="https://drive.google.com/file/d/1fvHpPIP-H_7GXzHmohvPXTAcfzkBugUX/preview"
                      title="Hide AI Stealth Setup Tutorial"
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div>
                    <h4 className="font-black text-base sm:text-lg text-gray-900 leading-snug">
                      How to bypass screen capture on Google Meet & Zoom
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-semibold mt-1">
                      Comprehensive step-by-step setup for browser permissions, stealth overlay mode, and hotkey configuration.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-150 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Interactive Guide
                  </span>
                  <a
                    href="https://drive.google.com/file/d/1fvHpPIP-H_7GXzHmohvPXTAcfzkBugUX/view?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Video 2 */}
              <div className="bg-white/90 backdrop-blur-xs p-5 sm:p-6 rounded-3xl border border-emerald-500/15 shadow-xs space-y-4 flex flex-col justify-between hover:border-emerald-500/35 transition-all">
                <div className="space-y-3">
                  <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner relative border border-emerald-500/20">
                    <iframe
                      src="https://drive.google.com/file/d/16Z6DhnTilu8fbIba2bQidzM20kWGvslb/preview"
                      title="Hide AI Live Problem Solving Demo"
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div>
                    <h4 className="font-black text-base sm:text-lg text-gray-900 leading-snug">
                      Live Coding & Problem Solving with Hide AI Copilot
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-semibold mt-1">
                      Watch Hide AI analyze live problems with OCR capture and provide instantaneous speaking points and clean code.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-150 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Demonstration
                  </span>
                  <a
                    href="https://drive.google.com/file/d/16Z6DhnTilu8fbIba2bQidzM20kWGvslb/view?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ─── CORNER FLOATING AI SUPPORT CHATBOT WIDGET ─── */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[410px] h-[500px] max-h-[80vh] bg-white rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 text-left">
            {/* Chat Header */}
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-gradient-to-r from-[#0d2e27] to-[#123e35] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="relative">
                  <img 
                    src="/penguin.jpg" 
                    alt="Hide AI Logo" 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-400 object-cover shadow-[0_0_14px_rgba(16,185,129,0.45)]" 
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0d2e27] rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    Hide AI Support
                    <Sparkles size={13} className="text-emerald-300 animate-pulse" />
                  </h4>
                  <span className="text-[10px] text-emerald-200 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Online • AI Copilot Assistant
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setChatOpen(false)}
                className="text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer"
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages Body with Visible Smooth Scroller */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-scroll chat-scrollbar space-y-3.5 bg-gray-50/70 text-xs pr-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {msg.sender === 'bot' && (
                      <img 
                        src="/penguin.jpg" 
                        alt="Hide AI" 
                        className="w-6 h-6 rounded-full border border-emerald-500 object-cover shrink-0 mb-1" 
                      />
                    )}
                    <div 
                      className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line font-medium shadow-xs ${
                        msg.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Action Chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                      {msg.actions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (act.query === 'upgrade') {
                              onOpenPricing();
                            } else {
                              handleSendChatMessage(act.query);
                            }
                          }}
                          className="text-[11px] bg-white hover:bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isBotTyping && (
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold ml-8">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span>Hide AI is typing...</span>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
              className="p-2.5 sm:p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0"
            >
              <input 
                type="text" 
                placeholder="Ask anything about Hide AI..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-gray-100/80 focus:bg-white border border-transparent focus:border-emerald-500 rounded-xl text-xs font-semibold outline-none transition-all text-gray-800"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-xs cursor-pointer"
                title="Send message"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Floating Chat Trigger Button */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-[#0d2e27] to-[#134e42] hover:from-emerald-950 hover:to-[#0d2e27] text-white p-2 sm:p-2.5 sm:pr-5 rounded-full shadow-[0_10px_35px_rgba(16,185,129,0.35)] border border-emerald-400/30 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Open AI Guide & Support"
          >
            <div className="relative">
              <img 
                src="/penguin.jpg" 
                alt="Chatbot Penguin" 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-emerald-400 object-cover shadow-[0_0_12px_rgba(16,185,129,0.5)] group-hover:rotate-6 transition-transform" 
              />
              <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0d2e27] rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0d2e27] rounded-full"></span>
            </div>
            
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-black text-white flex items-center gap-1">
                Support Chat
                <Sparkles size={11} className="text-emerald-300" />
              </span>
              <span className="text-[10px] text-emerald-200 font-semibold">Need help? Ask AI</span>
            </div>
          </button>
        )}
      </div>

      {/* ─── CREATE SESSION MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-9 border border-gray-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-display font-black text-xl sm:text-2xl text-gray-900 mb-1">Create Interview Session</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-6">Set up your next call for real-time AI assistance.</p>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                  Session Title *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Google Frontend Technical Round"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Company / Role
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Meta / Senior Software Engineer"
                  value={newSessionCompany}
                  onChange={(e) => setNewSessionCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                    Interview Type
                  </label>
                  <select
                    value={newSessionType}
                    onChange={(e) => setNewSessionType(e.target.value)}
                    className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white text-gray-900"
                  >
                    <option>Coding & Algorithms</option>
                    <option>System Design</option>
                    <option>Behavioral & Leadership</option>
                    <option>Full Stack & Architecture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                    Call Platform
                  </label>
                  <select
                    value={newSessionPlatform}
                    onChange={(e) => setNewSessionPlatform(e.target.value)}
                    className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white text-gray-900"
                  >
                    <option>Google Meet</option>
                    <option>Zoom</option>
                    <option>Microsoft Teams</option>
                    <option>HackerRank / CoderPad</option>
                    <option>Other Platform</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  <span>Create Session Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD PDF / RESUME MODAL (FILE UPLOADER) ─── */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-9 border border-gray-200 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowResumeModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-1.5">
              <X size={18} />
            </button>
            <h3 className="font-display font-black text-xl sm:text-2xl text-gray-900 mb-1">Upload Resume (PDF / Doc)</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-5">Upload your resume file so Hide AI personalizes answers.</p>

            <form onSubmit={handleSaveResume} className="space-y-4">
              
              {/* File Drag & Drop Box */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Resume File (PDF / DOC / TXT) *</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    selectedFile 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-gray-300 hover:border-emerald-500 bg-gray-50/70 hover:bg-emerald-50/30'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl shrink-0">
                        📄
                      </div>
                      <div className="text-left min-w-0">
                        <span className="block text-sm font-black text-gray-900 truncate max-w-[220px]">
                          {selectedFile.name}
                        </span>
                        <span className="block text-xs text-emerald-700 font-bold">
                          {selectedFile.size > 1024 * 1024 
                            ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` 
                            : `${Math.round(selectedFile.size / 1024)} KB`} • Click to change
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-gray-800">
                          Click to browse or drag & drop PDF
                        </span>
                        <span className="block text-xs text-gray-400 font-medium mt-0.5">
                          Supports PDF, DOCX, DOC, or TXT (Max 15MB)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Target Role / Designation</label>
                <input 
                  type="text" 
                  placeholder="e.g. Senior Full Stack Engineer / SDE 2"
                  value={newResumeRole} 
                  onChange={(e) => setNewResumeRole(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {fileUploadError && (
                <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {fileUploadError}
                </p>
              )}

              <button 
                type="submit" 
                disabled={isUploadingFile || !selectedFile}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isUploadingFile ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Processing Resume...</span>
                  </>
                ) : (
                  <>
                    <FileCheck size={18} />
                    <span>Save & Activate Resume Context</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD DOCUMENT MODAL ─── */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-9 border border-gray-200 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowDocModal(false)} className="absolute top-6 right-6 text-gray-400 p-1.5">
              <X size={18} />
            </button>
            <h3 className="font-display font-black text-xl sm:text-2xl text-gray-900 mb-1">New Document Note</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-5">Create technical notes or cheat sheets.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newDocTitle.trim()) return;
              setDocuments([
                {
                  id: Date.now().toString(),
                  title: newDocTitle.trim(),
                  category: newDocCategory.trim() || 'General',
                  lastEdited: 'Just now'
                },
                ...documents
              ]);
              setNewDocTitle('');
              setNewDocCategory('General');
              setNewDocContent('');
              setShowDocModal(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Document Title</label>
                <input 
                  type="text" required placeholder="e.g. Distributed Consensus Notes (Raft/Paxos)"
                  value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Category</label>
                <input 
                  type="text" placeholder="e.g. System Design / Algorithms"
                  value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Notes Content</label>
                <textarea 
                  rows={4} placeholder="Write key points, formulas, or reminders..."
                  value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold resize-none text-gray-900 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm shadow-md cursor-pointer">
                Save Document
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
