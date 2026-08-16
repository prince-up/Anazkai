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
    <div className="min-h-screen bg-[#fafbfc] flex font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ─── LEFT SIDEBAR (SCREENSHOT 2 PARITY) ─── */}
      <aside className={`w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 transition-all duration-200 ${sidebarOpen ? 'block' : 'hidden md:flex'}`}>
        
        {/* Top Section: Brand & Nav Links */}
        <div className="p-4 space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div 
              onClick={onBackToHome}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <img 
                src="/penguin.jpg" 
                alt="Anazk Logo" 
                className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500/30 shadow-xs group-hover:scale-105 transition-transform" 
              />
              <span className="font-display font-black text-xl text-gray-900 tracking-tight flex items-center">
                Anazk<span className="text-emerald-600 font-extrabold ml-0.5">AI</span>
              </span>
            </div>
            
            <button 
              onClick={onBackToHome}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Home Page"
            >
              <ExternalLink size={16} />
            </button>
          </div>

          {/* Section 1: WORKSPACE */}
          <div>
            <span className="block px-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Workspace
            </span>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('callSessions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'callSessions' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Radio size={16} className={activeTab === 'callSessions' ? 'text-emerald-600 animate-pulse' : 'text-gray-400'} />
                <span>Call Sessions</span>
              </button>

              <button
                onClick={() => setActiveTab('cvs')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'cvs' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FileText size={16} className={activeTab === 'cvs' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>CVs & Resumes</span>
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'documents' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Files size={16} className={activeTab === 'documents' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Documents</span>
              </button>
            </nav>
          </div>

          {/* Section 2: SUPPORT */}
          <div>
            <span className="block px-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Support
            </span>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('gettingStarted')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'gettingStarted' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <HelpCircle size={16} className={activeTab === 'gettingStarted' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Getting Started</span>
              </button>

              <button
                onClick={() => setActiveTab('tutorials')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'tutorials' 
                    ? 'bg-gray-100 text-gray-900 shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Video size={16} className={activeTab === 'tutorials' ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Tutorials</span>
              </button>

              <button
                onClick={() => {
                  window.open('mailto:supportanazkai@gmail.com?subject=Anazk AI Support Request', '_blank');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all text-left cursor-pointer"
              >
                <MessageSquare size={16} className="text-gray-400" />
                <span>Support Chat</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Section: Plan Card, Actions & User Profile */}
        <div className="p-4 space-y-4 border-t border-gray-100 bg-gray-50/50">
          
          {/* Free Plan Upgrade Card (Screenshot 2 parity) */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎁</span>
                <span className="text-xs font-extrabold text-gray-900">Free Plan</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium leading-snug">
              Start a 10 min free session or buy credits for full-length calls.
            </p>
            <button
              onClick={onOpenPricing}
              className="w-full py-2 bg-[#18181b] hover:bg-black active:scale-[0.98] text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap size={13} className="text-amber-400 fill-amber-400" />
              <span>Upgrade</span>
            </button>
          </div>

          {/* Quick Action Links */}
          <div className="space-y-1">
            <button
              onClick={onOpenDownload}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-900 transition-colors text-left cursor-pointer"
            >
              <Laptop size={15} className="text-gray-400" />
              <span>Open Desktop App</span>
            </button>

            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
            >
              <LogOut size={15} className="text-red-500" />
              <span>Log Out</span>
            </button>
          </div>

          {/* User Profile Footer Pill (Screenshot 2 parity) */}
          <div className="flex items-center gap-3 px-2 pt-2 border-t border-gray-200/60">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-xs font-bold text-gray-900 truncate leading-tight">
                {fullName}
              </span>
              <span className="block text-[10px] text-gray-400 truncate leading-tight">
                {userEmail}
              </span>
            </div>
          </div>

        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA (SCREENSHOT 2 PARITY) ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#fafbfc] overflow-y-auto">
        
        {/* TAB 1: CALL SESSIONS (EXACT SCREENSHOT 2 LAYOUT) */}
        {activeTab === 'callSessions' && (
          <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-6">
            
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
                  Call Sessions
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                  Prepare for calls and review past sessions.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Create Session</span>
              </button>
            </div>

            {/* Sub-Navigation & Session Count */}
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
              <div className="flex items-center gap-6 text-xs sm:text-sm font-bold">
                <button
                  onClick={() => setSessionFilter('all')}
                  className={`pb-2 transition-colors cursor-pointer relative ${
                    sessionFilter === 'all' 
                      ? 'text-gray-900 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSessionFilter('active')}
                  className={`pb-2 transition-colors cursor-pointer relative ${
                    sessionFilter === 'active' 
                      ? 'text-gray-900 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSessionFilter('ended')}
                  className={`pb-2 transition-colors cursor-pointer relative ${
                    sessionFilter === 'ended' 
                      ? 'text-gray-900 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Ended
                </button>
              </div>

              <span className="text-xs font-bold text-gray-400">
                {filteredSessions.length} Sessions
              </span>
            </div>

            {/* Search & Layout Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by title or description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200/80 rounded-xl text-xs font-semibold placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setSessions([...sessions].reverse())}
                  className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200/80 text-gray-500 rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Sort Sessions"
                >
                  <ArrowUpDown size={15} />
                </button>
                <button 
                  onClick={() => setViewLayout('grid')}
                  className={`p-2.5 border rounded-xl transition-all shadow-xs cursor-pointer ${
                    viewLayout === 'grid' 
                      ? 'bg-gray-100 border-gray-300 text-gray-900' 
                      : 'bg-white border-gray-200/80 text-gray-400 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <Grid size={15} />
                </button>
                <button 
                  onClick={() => setViewLayout('list')}
                  className={`p-2.5 border rounded-xl transition-all shadow-xs cursor-pointer ${
                    viewLayout === 'list' 
                      ? 'bg-gray-100 border-gray-300 text-gray-900' 
                      : 'bg-white border-gray-200/80 text-gray-400 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>

            {/* Sessions List or Empty State */}
            {filteredSessions.length === 0 ? (
              /* EXACT SCREENSHOT 2 EMPTY STATE */
              <div className="py-24 sm:py-32 flex flex-col items-center justify-center text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display font-extrabold text-base sm:text-lg text-gray-800">
                    You have no upcoming sessions
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">
                    Your upcoming sessions will appear here once created.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer mt-2"
                >
                  <Plus size={16} />
                  <span>Create Session</span>
                </button>
              </div>
            ) : (
              /* Active Sessions Display */
              <div className={viewLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                {filteredSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h4 className="font-bold text-sm text-gray-900">{session.title}</h4>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {session.platform}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                        <span>{session.company}</span>
                        <span>•</span>
                        <span>{session.type}</span>
                        <span>•</span>
                        <span>{session.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={onOpenDownload}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Launch Stealth Copilot</span>
                      </button>
                      <button
                        onClick={() => setSessions(sessions.filter(s => s.id !== session.id))}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 size={15} />
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
          <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
                  CVs & Resumes
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                  Upload and manage resumes so Anazk AI tailors technical answers to your experience.
                </p>
              </div>

              <button
                onClick={() => setShowResumeModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Add Resume</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-lg">
                        📄
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{resume.name}</h4>
                        <span className="text-xs text-gray-400 font-medium">{resume.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setResumes(resumes.filter(r => r.id !== resume.id))}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Uploaded: {resume.uploadedAt}</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active for AI Context</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
                  Documents & Notes
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                  Save job descriptions, interview cheat sheets, and system design notes.
                </p>
              </div>

              <button
                onClick={() => setShowDocModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>New Document</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-lg">
                        📑
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{doc.title}</h4>
                        <span className="text-xs text-gray-400 font-medium">{doc.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Edited {doc.lastEdited}</span>
                    <span className="text-emerald-600 font-semibold cursor-pointer hover:underline">View Notes →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GETTING STARTED */}
        {activeTab === 'gettingStarted' && (
          <div className="p-6 sm:p-10 max-w-4xl w-full mx-auto space-y-6">
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
                Getting Started with Anazk AI
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                Everything you need to master your stealth AI interview copilot.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">1</div>
                  <h3 className="font-bold text-base text-gray-900">Install the Desktop Client</h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pl-11">
                  Download the native Windows client (.exe). It automatically engages hardware-level window protection so screen-sharing tools like Zoom, Microsoft Teams, and Google Meet cannot detect it.
                </p>
                <div className="pl-11">
                  <button onClick={onOpenDownload} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
                    <Download size={14} />
                    <span>Download Windows Client (.exe)</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">2</div>
                  <h3 className="font-bold text-base text-gray-900">Stealth Hotkeys Reference</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-11">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                    <span className="block font-mono text-emerald-600 font-extrabold text-sm">F1 Key</span>
                    <span className="text-xs font-semibold text-gray-700">Full Screen OCR</span>
                    <p className="text-[11px] text-gray-400 mt-1">Captures active screen coding problem.</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                    <span className="block font-mono text-emerald-600 font-extrabold text-sm">F4 Key</span>
                    <span className="text-xs font-semibold text-gray-700">Region Snipping</span>
                    <p className="text-[11px] text-gray-400 mt-1">Snips exact question bounds.</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                    <span className="block font-mono text-emerald-600 font-extrabold text-sm">F3 Key</span>
                    <span className="text-xs font-semibold text-gray-700">Ask AI Instantly</span>
                    <p className="text-[11px] text-gray-400 mt-1">Streams formatted solution.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TUTORIALS */}
        {activeTab === 'tutorials' && (
          <div className="p-6 sm:p-10 max-w-4xl w-full mx-auto space-y-6">
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
                Video Tutorials & Guides
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                Watch step-by-step walkthroughs of live coding and behavioral interviews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <div className="h-36 bg-gray-900 rounded-xl flex items-center justify-center text-white relative group cursor-pointer overflow-hidden">
                  <Play size={32} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 right-2 bg-black/70 text-[10px] px-2 py-0.5 rounded font-mono">03:45</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900">How to bypass screen capture on Google Meet</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Comprehensive setup for browser permission and active overlay configuration.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <div className="h-36 bg-gray-900 rounded-xl flex items-center justify-center text-white relative group cursor-pointer overflow-hidden">
                  <Play size={32} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 right-2 bg-black/70 text-[10px] px-2 py-0.5 rounded font-mono">05:12</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900">Live LeetCode problem solving with Groq vision</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Watch Anazk AI solve a hard Dynamic Programming problem in under 3 seconds.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ─── CREATE SESSION MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="font-display font-black text-xl text-gray-900 mb-1">Create Interview Session</h3>
            <p className="text-xs text-gray-400 font-semibold mb-5">Set up your next call for real-time AI assistance.</p>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
                  Session Title *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Google Frontend Technical Round"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
                  Target Company / Role
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Meta / Senior Software Engineer"
                  value={newSessionCompany}
                  onChange={(e) => setNewSessionCompany(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
                    Interview Type
                  </label>
                  <select
                    value={newSessionType}
                    onChange={(e) => setNewSessionType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white text-gray-800"
                  >
                    <option>Coding & Algorithms</option>
                    <option>System Design</option>
                    <option>Behavioral & Leadership</option>
                    <option>Full Stack & Architecture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
                    Call Platform
                  </label>
                  <select
                    value={newSessionPlatform}
                    onChange={(e) => setNewSessionPlatform(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white text-gray-800"
                  >
                    <option>Google Meet</option>
                    <option>Zoom</option>
                    <option>Microsoft Teams</option>
                    <option>HackerRank / CoderPad</option>
                    <option>Other Platform</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-200 shadow-2xl relative text-left">
            <button onClick={() => setShowResumeModal(false)} className="absolute top-5 right-5 text-gray-400 p-1.5">
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-xl text-gray-900 mb-1">Add Resume Profile</h3>
            <p className="text-xs text-gray-400 font-semibold mb-4">Paste your resume content to tailor AI answers.</p>

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
            }} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Resume Name</label>
                <input 
                  type="text" required placeholder="e.g. Senior_SDE_Resume.pdf"
                  value={newResumeName} onChange={(e) => setNewResumeName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Target Role</label>
                <input 
                  type="text" placeholder="e.g. Backend Lead"
                  value={newResumeRole} onChange={(e) => setNewResumeRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Resume Text / Summary</label>
                <textarea 
                  rows={4} placeholder="Paste your key projects, stack, and metrics..."
                  value={newResumeText} onChange={(e) => setNewResumeText(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-semibold resize-none"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs">
                Save Resume Context
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD DOCUMENT MODAL ─── */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-200 shadow-2xl relative text-left">
            <button onClick={() => setShowDocModal(false)} className="absolute top-5 right-5 text-gray-400 p-1.5">
              <X size={16} />
            </button>
            <h3 className="font-display font-black text-xl text-gray-900 mb-1">New Document Note</h3>
            <p className="text-xs text-gray-400 font-semibold mb-4">Create technical notes or cheat sheets.</p>

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
            }} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Document Title</label>
                <input 
                  type="text" required placeholder="e.g. Distributed Consensus Notes (Raft/Paxos)"
                  value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Category</label>
                <input 
                  type="text" placeholder="e.g. System Design / Algorithms"
                  value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Notes Content</label>
                <textarea 
                  rows={4} placeholder="Write key points, formulas, or reminders..."
                  value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-semibold resize-none"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs">
                Save Document
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
