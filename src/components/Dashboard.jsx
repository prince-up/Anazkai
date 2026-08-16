import React, { useState, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';

export default function Dashboard({ user, onSignOut, onOpenPricing, onOpenDownload, onBackToHome }) {
  const [activeTab, setActiveTab] = useState('callSessions'); // 'callSessions' | 'cvs' | 'documents' | 'gettingStarted' | 'tutorials'
  const [sessionFilter, setSessionFilter] = useState('all'); // 'all' | 'active' | 'ended'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState('list'); // 'list' | 'grid'
  
  // Stored Sessions in localStorage
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(`anazk_sessions_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Stored Resumes in localStorage
  const [resumes, setResumes] = useState(() => {
    try {
      const saved = localStorage.getItem(`anazk_resumes_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Software_Engineer_Resume_2026.pdf', role: 'Full Stack & Backend Developer', uploadedAt: 'March 14, 2026', size: '1.2 MB' }
      ];
    } catch (e) {
      return [];
    }
  });

  // Stored Documents in localStorage
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem(`anazk_docs_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [
        { id: '1', title: 'System Design Cheat Sheet (Distributed Caching & Sharding)', category: 'Technical Architecture', lastEdited: 'Yesterday' },
        { id: '2', title: 'STAR Method Answers for Behavioral Questions', category: 'Behavioral & Leadership', lastEdited: '3 days ago' }
      ];
    } catch (e) {
      return [];
    }
  });

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // New Session Form State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionType, setNewSessionType] = useState('Coding & Algorithms');
  const [newSessionPlatform, setNewSessionPlatform] = useState('Google Meet');
  const [newSessionCompany, setNewSessionCompany] = useState('');

  // New Doc / Resume State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('General');
  const [newDocContent, setNewDocContent] = useState('');

  const [newResumeName, setNewResumeName] = useState('');
  const [newResumeRole, setNewResumeRole] = useState('');
  const [newResumeText, setNewResumeText] = useState('');

  // Save sessions to storage
  useEffect(() => {
    try {
      localStorage.setItem(`anazk_sessions_${user?.id || 'guest'}`, JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions, user]);

  // Save resumes
  useEffect(() => {
    try {
      localStorage.setItem(`anazk_resumes_${user?.id || 'guest'}`, JSON.stringify(resumes));
    } catch (e) {}
  }, [resumes, user]);

  // Save documents
  useEffect(() => {
    try {
      localStorage.setItem(`anazk_docs_${user?.id || 'guest'}`, JSON.stringify(documents));
    } catch (e) {}
  }, [documents, user]);

  // User details
  const userEmail = user?.email || 'user@example.com';
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const userInitials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AZ';

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
    <div className="min-h-screen bg-[#fafbfc] flex font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900 antialiased">
      
      {/* ─── LEFT SIDEBAR (GENEROUS TYPOGRAPHY & SCALING) ─── */}
      <aside className={`w-72 bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 transition-all duration-200 ${sidebarOpen ? 'block' : 'hidden md:flex'}`}>
        
        {/* Top Section: Brand & Nav Links */}
        <div className="p-5 space-y-7">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div 
              onClick={onBackToHome}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img 
                src="/penguin.jpg" 
                alt="Anazk Logo" 
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/30 shadow-xs group-hover:scale-105 transition-transform" 
              />
              <span className="font-display font-black text-2xl text-gray-900 tracking-tight flex items-center">
                Anazk<span className="text-emerald-600 font-extrabold ml-1">AI</span>
              </span>
            </div>
            
            <button 
              onClick={onBackToHome}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              title="Home Page"
            >
              <ExternalLink size={18} />
            </button>
          </div>

          {/* Section 1: WORKSPACE */}
          <div className="space-y-2">
            <span className="block px-3 text-xs font-black text-gray-400 uppercase tracking-wider">
              Workspace
            </span>
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('callSessions')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'callSessions' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Radio size={18} className={activeTab === 'callSessions' ? 'text-emerald-600 animate-pulse' : 'text-gray-400'} />
                <span>Call Sessions</span>
              </button>

              <button
                onClick={() => setActiveTab('cvs')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'cvs' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FileText size={18} className={activeTab === 'cvs' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>CVs & Resumes</span>
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'documents' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
                onClick={() => setActiveTab('gettingStarted')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'gettingStarted' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <HelpCircle size={18} className={activeTab === 'gettingStarted' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Getting Started</span>
              </button>

              <button
                onClick={() => setActiveTab('tutorials')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'tutorials' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs font-extrabold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Video size={18} className={activeTab === 'tutorials' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Tutorials</span>
              </button>

              <button
                onClick={() => {
                  window.open('mailto:supportanazkai@gmail.com?subject=Anazk AI Support Request', '_blank');
                }}
                className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all text-left cursor-pointer"
              >
                <MessageSquare size={18} className="text-gray-400" />
                <span>Support Chat</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Section: Plan Card, Actions & User Profile */}
        <div className="p-4 space-y-4 border-t border-gray-100 bg-gray-50/60">
          
          {/* Free Plan Upgrade Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <span className="text-sm font-black text-gray-900">Free Plan</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Start a 10 min free session or buy credits for full-length calls.
            </p>
            <button
              onClick={onOpenPricing}
              className="w-full py-2.5 bg-[#18181b] hover:bg-black active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <span>Upgrade</span>
            </button>
          </div>

          {/* Quick Action Links */}
          <div className="space-y-1">
            <button
              onClick={onOpenDownload}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-white hover:text-gray-900 transition-colors text-left cursor-pointer"
            >
              <Laptop size={17} className="text-gray-500" />
              <span>Open Desktop App</span>
            </button>

            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
            >
              <LogOut size={17} className="text-red-500" />
              <span>Log Out</span>
            </button>
          </div>

          {/* User Profile Footer Pill */}
          <div className="flex items-center gap-3 px-2 pt-2 border-t border-gray-200/60">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-sm shrink-0 shadow-xs border border-emerald-200">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-sm font-black text-gray-900 truncate leading-tight">
                {fullName}
              </span>
              <span className="block text-xs text-gray-500 font-medium truncate leading-tight mt-0.5">
                {userEmail}
              </span>
            </div>
          </div>

        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA (CLEAR, HIGH VISIBILITY SIZING) ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#fafbfc] overflow-y-auto">
        
        {/* TAB 1: CALL SESSIONS */}
        {activeTab === 'callSessions' && (
          <div className="p-8 sm:p-12 max-w-6xl w-full mx-auto space-y-7">
            
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight">
                  Call Sessions
                </h1>
                <p className="text-sm sm:text-base font-semibold text-gray-500 mt-1.5">
                  Prepare for calls and review past sessions.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={18} />
                <span>Create Session</span>
              </button>
            </div>

            {/* Sub-Navigation & Session Count */}
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
              <div className="flex items-center gap-8 text-sm sm:text-base font-extrabold">
                <button
                  onClick={() => setSessionFilter('all')}
                  className={`pb-3 transition-colors cursor-pointer relative ${
                    sessionFilter === 'all' 
                      ? 'text-gray-900 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSessionFilter('active')}
                  className={`pb-3 transition-colors cursor-pointer relative ${
                    sessionFilter === 'active' 
                      ? 'text-gray-900 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSessionFilter('ended')}
                  className={`pb-3 transition-colors cursor-pointer relative ${
                    sessionFilter === 'ended' 
                      ? 'text-gray-900 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Ended
                </button>
              </div>

              <span className="text-sm font-bold text-gray-400">
                {filteredSessions.length} Sessions
              </span>
            </div>

            {/* Search & Layout Toolbar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by title or description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200/80 rounded-xl text-sm font-semibold placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-xs text-gray-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSessions([...sessions].reverse())}
                  className="p-3 bg-white hover:bg-gray-50 border border-gray-200/80 text-gray-500 rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Sort Sessions"
                >
                  <ArrowUpDown size={17} />
                </button>
                <button 
                  onClick={() => setViewLayout('grid')}
                  className={`p-3 border rounded-xl transition-all shadow-xs cursor-pointer ${
                    viewLayout === 'grid' 
                      ? 'bg-gray-100 border-gray-300 text-gray-900' 
                      : 'bg-white border-gray-200/80 text-gray-400 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <Grid size={17} />
                </button>
                <button 
                  onClick={() => setViewLayout('list')}
                  className={`p-3 border rounded-xl transition-all shadow-xs cursor-pointer ${
                    viewLayout === 'list' 
                      ? 'bg-gray-100 border-gray-300 text-gray-900' 
                      : 'bg-white border-gray-200/80 text-gray-400 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List size={17} />
                </button>
              </div>
            </div>

            {/* Sessions List or Empty State */}
            {filteredSessions.length === 0 ? (
              /* EMPTY STATE */
              <div className="py-24 sm:py-36 flex flex-col items-center justify-center text-center space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-display font-black text-xl sm:text-2xl text-gray-900">
                    You have no upcoming sessions
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 font-medium">
                    Your upcoming sessions will appear here once created.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer mt-3"
                >
                  <Plus size={18} />
                  <span>Create Session</span>
                </button>
              </div>
            ) : (
              /* Active Sessions Display */
              <div className={viewLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3.5'}>
                {filteredSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <h4 className="font-black text-base sm:text-lg text-gray-900">{session.title}</h4>
                        <span className="text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                          {session.platform}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 font-semibold">
                        <span>{session.company}</span>
                        <span>•</span>
                        <span>{session.type}</span>
                        <span>•</span>
                        <span>{session.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={onOpenDownload}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <Play size={15} fill="currentColor" />
                        <span>Launch Stealth Copilot</span>
                      </button>
                      <button
                        onClick={() => setSessions(sessions.filter(s => s.id !== session.id))}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: CVS & RESUMES */}
        {activeTab === 'cvs' && (
          <div className="p-8 sm:p-12 max-w-6xl w-full mx-auto space-y-7">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight">
                  CVs & Resumes
                </h1>
                <p className="text-sm sm:text-base font-semibold text-gray-500 mt-1.5">
                  Upload and manage resumes so Anazk AI tailors technical answers to your experience.
                </p>
              </div>

              <button
                onClick={() => setShowResumeModal(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={18} />
                <span>Add Resume</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-2xl">
                        📄
                      </div>
                      <div>
                        <h4 className="font-black text-base text-gray-900">{resume.name}</h4>
                        <span className="text-xs sm:text-sm text-gray-500 font-semibold">{resume.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setResumes(resumes.filter(r => r.id !== resume.id))}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold">
                    <span>Uploaded: {resume.uploadedAt}</span>
                    <span className="font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md">Active Context</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="p-8 sm:p-12 max-w-6xl w-full mx-auto space-y-7">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight">
                  Documents & Notes
                </h1>
                <p className="text-sm sm:text-base font-semibold text-gray-500 mt-1.5">
                  Save job descriptions, interview cheat sheets, and system design notes.
                </p>
              </div>

              <button
                onClick={() => setShowDocModal(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={18} />
                <span>New Document</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-2xl">
                        📑
                      </div>
                      <div>
                        <h4 className="font-black text-base text-gray-900">{doc.title}</h4>
                        <span className="text-xs sm:text-sm text-gray-500 font-semibold">{doc.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold">
                    <span>Edited {doc.lastEdited}</span>
                    <span className="text-emerald-700 font-bold cursor-pointer hover:underline">View Notes →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GETTING STARTED */}
        {activeTab === 'gettingStarted' && (
          <div className="p-8 sm:p-12 max-w-4xl w-full mx-auto space-y-7">
            <div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight">
                Getting Started with Anazk AI
              </h1>
              <p className="text-sm sm:text-base font-semibold text-gray-500 mt-1.5">
                Everything you need to master your stealth AI interview copilot.
              </p>
            </div>

            <div className="space-y-5">
              <div className="bg-white p-7 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base">1</div>
                  <h3 className="font-black text-lg text-gray-900">Install the Desktop Client</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pl-12 font-medium">
                  Download the native Windows client (.exe). It automatically engages hardware-level window protection so screen-sharing tools like Zoom, Microsoft Teams, and Google Meet cannot detect it.
                </p>
                <div className="pl-12 pt-1">
                  <button onClick={onOpenDownload} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20">
                    <Download size={16} />
                    <span>Download Windows Client (.exe)</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-7 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base">2</div>
                  <h3 className="font-black text-lg text-gray-900">Stealth Hotkeys Reference</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pl-12">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                    <span className="block font-mono text-emerald-600 font-black text-base">F1 Key</span>
                    <span className="text-sm font-bold text-gray-800">Full Screen OCR</span>
                    <p className="text-xs text-gray-500 font-medium mt-1">Captures active screen coding problem.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                    <span className="block font-mono text-emerald-600 font-black text-base">F4 Key</span>
                    <span className="text-sm font-bold text-gray-800">Region Snipping</span>
                    <p className="text-xs text-gray-500 font-medium mt-1">Snips exact question bounds.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                    <span className="block font-mono text-emerald-600 font-black text-base">F3 Key</span>
                    <span className="text-sm font-bold text-gray-800">Ask AI Instantly</span>
                    <p className="text-xs text-gray-500 font-medium mt-1">Streams formatted solution.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TUTORIALS */}
        {activeTab === 'tutorials' && (
          <div className="p-8 sm:p-12 max-w-5xl w-full mx-auto space-y-7">
            <div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight">
                Video Tutorials & Guides
              </h1>
              <p className="text-sm sm:text-base font-semibold text-gray-500 mt-1.5">
                Watch step-by-step walkthroughs of live coding, stealth setup, and interview demonstrations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video 1 */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner relative border border-gray-200">
                    <iframe
                      src="https://drive.google.com/file/d/1fvHpPIP-H_7GXzHmohvPXTAcfzkBugUX/preview"
                      title="Anazk AI Stealth Setup Tutorial"
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-gray-900 leading-snug">
                      How to bypass screen capture on Google Meet & Zoom
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold mt-1">
                      Comprehensive step-by-step setup for browser permissions, stealth overlay mode, and hotkey configuration.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Interactive Guide
                  </span>
                  <a
                    href="https://drive.google.com/file/d/1fvHpPIP-H_7GXzHmohvPXTAcfzkBugUX/view?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Video 2 */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner relative border border-gray-200">
                    <iframe
                      src="https://drive.google.com/file/d/16Z6DhnTilu8fbIba2bQidzM20kWGvslb/preview"
                      title="Anazk AI Live Problem Solving Demo"
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-gray-900 leading-snug">
                      Live Coding & Problem Solving with Anazk AI Copilot
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold mt-1">
                      Watch Anazk AI analyze live problems with OCR capture and provide instantaneous speaking points and clean code.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Demonstration
                  </span>
                  <a
                    href="https://drive.google.com/file/d/16Z6DhnTilu8fbIba2bQidzM20kWGvslb/view?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline flex items-center gap-1"
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

      {/* ─── CREATE SESSION MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-9 border border-gray-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-display font-black text-2xl text-gray-900 mb-1.5">Create Interview Session</h3>
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

              <div className="grid grid-cols-2 gap-3.5">
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

      {/* ─── ADD RESUME MODAL ─── */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-9 border border-gray-200 shadow-2xl relative text-left">
            <button onClick={() => setShowResumeModal(false)} className="absolute top-6 right-6 text-gray-400 p-1.5">
              <X size={18} />
            </button>
            <h3 className="font-display font-black text-2xl text-gray-900 mb-1.5">Add Resume Profile</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-5">Paste your resume content to tailor AI answers.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newResumeName.trim()) return;
              setResumes([
                {
                  id: Date.now().toString(),
                  name: newResumeName.trim(),
                  role: newResumeRole.trim() || 'Software Engineer',
                  uploadedAt: 'Today',
                  size: 'Text Profile'
                },
                ...resumes
              ]);
              setNewResumeName('');
              setNewResumeRole('');
              setNewResumeText('');
              setShowResumeModal(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Resume Name</label>
                <input 
                  type="text" required placeholder="e.g. Senior_SDE_Resume.pdf"
                  value={newResumeName} onChange={(e) => setNewResumeName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Target Role</label>
                <input 
                  type="text" placeholder="e.g. Backend Lead"
                  value={newResumeRole} onChange={(e) => setNewResumeRole(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Resume Text / Summary</label>
                <textarea 
                  rows={4} placeholder="Paste your key projects, stack, and metrics..."
                  value={newResumeText} onChange={(e) => setNewResumeText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold resize-none text-gray-900"
                />
              </div>
              <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm shadow-md cursor-pointer">
                Save Resume Context
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD DOCUMENT MODAL ─── */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-9 border border-gray-200 shadow-2xl relative text-left">
            <button onClick={() => setShowDocModal(false)} className="absolute top-6 right-6 text-gray-400 p-1.5">
              <X size={18} />
            </button>
            <h3 className="font-display font-black text-2xl text-gray-900 mb-1.5">New Document Note</h3>
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
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Category</label>
                <input 
                  type="text" placeholder="e.g. System Design / Algorithms"
                  value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Notes Content</label>
                <textarea 
                  rows={4} placeholder="Write key points, formulas, or reminders..."
                  value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold resize-none text-gray-900"
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
