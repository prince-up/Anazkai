import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Copy, X, Minus, Sparkles, Mic, MicOff, Clock, Send, Image as ImageIcon, Trash2, Check, FileText, Upload, Gift, ShieldCheck, Power, Crop, Keyboard, Play, Pause, Square, Eye, EyeOff
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import LandingPage from './LandingPage';
import SubscriptionGuard from './components/SubscriptionGuard';
import AppLoginPage from './pages/AppLoginPage';
import { supabase } from './supabaseClient';

// Configure pdfjs worker with bundled local asset for offline / file:// protocol compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Audio WAV Encoder & Downsampler Helper Utilities
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
}

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate = 16000) {
  if (inputSampleRate === outputSampleRate) return buffer;
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 8192) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, len)));
  }
  return window.btoa(binary);
}

// Helper to compress and optimize heavy Retina screenshots to clean ~200KB JPEGs
function compressImage(dataUrl, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Mask API Key for safe console debugging
function maskKey(key) {
  if (!key) return 'None';
  const str = key.trim();
  if (str.length <= 8) return str;
  return `${str.slice(0, 8)}...${str.slice(-4)}`;
}

// AI Engine API Keys Configuration
const FREE_TRIAL_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const HARDCODED_PAID_GEMINI_KEY = 'AQ.Ab8RN6KBXFzpGWdSWFmXeVMxUr7cxExYay-IS_yLm3hFAwSU0Q';
const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';

function getActiveGeminiKey() {
  // 1. User's own custom key (highest priority — always try first)
  const customKey = localStorage.getItem('custom_gemini_key');
  if (customKey && customKey.trim().length > 10) return customKey.replace(/["']/g, '').trim();
  // 2. Environment variable
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 10 && !envKey.includes('your_gemini')) return envKey.replace(/["']/g, '').trim();
  // 3. Internal hardcoded key (fallback)
  return HARDCODED_PAID_GEMINI_KEY;
}

// Returns both keys so we can retry with the other if one fails
function getBothGeminiKeys() {
  const customKey = (localStorage.getItem('custom_gemini_key') || '').replace(/["']/g, '').trim();
  const internalKey = HARDCODED_PAID_GEMINI_KEY;
  // Return unique keys in priority order
  const keys = [];
  if (customKey.length > 10) keys.push(customKey);
  if (internalKey && internalKey !== customKey) keys.push(internalKey);
  return keys;
}

function getActiveGroqKey() {
  const customKey = (localStorage.getItem('custom_groq_key') || '').replace(/["']/g, '').trim();
  if (customKey && customKey.length > 10) return customKey;
  return import.meta.env.VITE_GROQ_API_KEY || FREE_TRIAL_GROQ_KEY;
}

// Build Gemini request with ?key= parameter and x-goog-api-key header (for AIzaSy... and AQ. keys)
function buildGeminiRequestConfig(geminiKey, modelId, isStream = true) {
  const cleanKey = (geminiKey || '').replace(/["']/g, '').trim();
  const isBearer = cleanKey.startsWith('ya29.') || cleanKey.startsWith('Bearer ');
  let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:${isStream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
  const headers = { 'Content-Type': 'application/json' };
  if (isBearer) {
    headers['Authorization'] = cleanKey.startsWith('Bearer ') ? cleanKey : `Bearer ${cleanKey}`;
  } else if (cleanKey) {
    headers['x-goog-api-key'] = cleanKey;
    url += `${isStream ? '&' : '?'}key=${cleanKey}`;
  }
  return { url, headers };
}

// Bearer fallback for AQ. keys (in case ?key= doesn't work)
function buildGeminiBearerConfig(geminiKey, modelId, isStream = true) {
  const cleanKey = (geminiKey || '').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:${isStream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanKey}` };
  return { url, headers };
}

function AppContent({ timeRemaining, onLogout, planType = 'paid', isFreeTrial = false, currentUser = null }) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [screenshotData, setScreenshotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [hasScreenPermission, setHasScreenPermission] = useState(true);
  const outputScrollRef = useRef(null);
  
  // Debug Logs State
  const [debugLogs, setDebugLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Auto-Typer State (All 3 Levels: Button, Hotkeys, Auto-after-response)
  const [autoTypeState, setAutoTypeState] = useState({
    isTyping: false,
    isPaused: false,
    isStopped: false,
    countdown: 0,
    progress: 0,
    currentLine: 0,
    totalLines: 0,
    statusText: ''
  });

  const [autoTypeAfterResponse, setAutoTypeAfterResponse] = useState(() => {
    return localStorage.getItem('auto_type_after_response') === 'true';
  });

  const [autoTypeSpeed, setAutoTypeSpeed] = useState(() => {
    return localStorage.getItem('auto_type_speed') || 'normal';
  });

  // Extract pure code block (ignoring approaches & explanations)
  const extractCodeOnly = (text) => {
    if (!text || typeof text !== 'string') return '';
    const codeBlockRegex = /```(?:[a-zA-Z0-9_\-+]*)\r?\n([\s\S]*?)```/g;
    const matches = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const code = match[1].trim();
      if (code.length > 0) matches.push(code);
    }
    if (matches.length > 0) {
      matches.sort((a, b) => b.length - a.length);
      return matches[0];
    }
    return text.trim();
  };

  const handleStartAutoType = async (codeToType = null, countdown = 3) => {
    const rawCode = codeToType || extractCodeOnly(outputText);
    if (!rawCode || rawCode.trim().length === 0) {
      addLog('⚠️ No code found in response to auto-type.');
      return;
    }

    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      addLog(`⚡ Starting Auto-Typer (${rawCode.length} chars, speed: ${autoTypeSpeed}, countdown: ${countdown}s)...`);
      try {
        await ipcRenderer.invoke('auto-typer:start', { code: rawCode, countdown, speed: autoTypeSpeed });
      } catch (err) {
        addLog(`❌ Auto-Typer error: ${err.message}`);
      }
    }
  };

  const handlePauseAutoType = async () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('auto-typer:pause');
      addLog('⏸️ Auto-Typer paused.');
    }
  };

  const handleResumeAutoType = async () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('auto-typer:resume');
      addLog('▶️ Auto-Typer resumed.');
    }
  };

  const handleStopAutoType = async () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('auto-typer:stop');
      setAutoTypeState(prev => ({ ...prev, isTyping: false, isPaused: false, countdown: 0 }));
      addLog('🛑 Auto-Typer stopped by user.');
    }
  };

  useEffect(() => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.invoke('check-screen-permission').then((status) => {
        if (status === 'denied' || status === 'not-determined') {
          setHasScreenPermission(false);
        }
      }).catch(() => {});
    }
  }, []);

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    console.log(formatted);
    setDebugLogs(prev => [formatted, ...prev.slice(0, 49)]);
  };

  const decrementUserCredits = async () => {
    if (isFreeTrial || planType === 'vip' || !currentUser) return;
    try {
      const { data: profile, error: getErr } = await supabase
        .from('profiles')
        .select('credits_minutes')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!getErr && profile) {
        const currentMins = profile.credits_minutes || 0;
        const nextMins = Math.max(0, currentMins - 1);
        
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ credits_minutes: nextMins })
          .eq('id', currentUser.id);

        if (!updateErr) {
          addLog(`Deducted 1 credit minute. Remaining: ${nextMins} mins.`);
        }
      }
    } catch (e) {
      console.error('Failed to decrement credits:', e.message);
    }
  };
  
  // Settings & Preferences
  const [showSettings, setShowSettings] = useState(false);
  const [customGeminiKey, setCustomGeminiKey] = useState(() => localStorage.getItem('custom_gemini_key') || '');
  const [opacity, setOpacity] = useState(() => parseFloat(localStorage.getItem('overlay_opacity')) || 0.85);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [autoAsk, setAutoAsk] = useState(() => localStorage.getItem('auto_ask') === 'true');
  const [interviewCount, setInterviewCount] = useState(() => parseInt(localStorage.getItem('interview_count')) || 0);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState('');

  // Resume State (Persistent & Compactly Cached for Zero Latency)
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('user_resume_text') || '');
  const [resumeFileName, setResumeFileName] = useState(() => localStorage.getItem('user_resume_filename') || '');
  const [resumeSummary, setResumeSummary] = useState(() => localStorage.getItem('user_resume_summary') || '');
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const resumeFileInputRef = useRef(null);

  // Helper to generate & cache a high-impact candidate profile for zero-latency AI injection
  const generateAndCacheResumeSummary = async (fullText, fileName) => {
    if (!fullText || !fullText.trim()) {
      setResumeSummary('');
      localStorage.removeItem('user_resume_summary');
      return;
    }

    // Default immediate local summary
    const cleanLines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const quickSummary = cleanLines.slice(0, 15).join('\n');
    setResumeSummary(quickSummary);
    localStorage.setItem('user_resume_summary', quickSummary);

    // AI Profile Generation via Groq (priority) or Gemini
    const groqKey = getActiveGroqKey();
    if (groqKey && fullText.length > 50) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages: [
              {
                role: 'system',
                content: 'You are an AI interview coach. Distill this resume into a structured Candidate Profile for answering interview questions: 1) Candidate Name & Target Role, 2) Core Technical Skills & Languages, 3) Key Projects (technologies used, purpose, achievements), 4) Work Experience (roles, companies, key contributions).'
              },
              {
                role: 'user',
                content: `Resume Content:\n${fullText.slice(0, 8000)}`
              }
            ],
            temperature: 0.1,
            max_tokens: 600
          })
        });
        if (res.ok) {
          const data = await res.json();
          const structuredProfile = data.choices?.[0]?.message?.content?.trim();
          if (structuredProfile) {
            setResumeSummary(structuredProfile);
            localStorage.setItem('user_resume_summary', structuredProfile);
            addLog(`✅ Resume structured via Groq AI (${structuredProfile.length} chars).`);
            return;
          }
        }
      } catch (e) {
        console.warn('Groq resume profiling error:', e);
      }
    }

    const geminiKey = getActiveGeminiKey();
    if (geminiKey && fullText.length > 150) {
      try {
        const { url, headers } = buildGeminiRequestConfig(geminiKey, 'gemini-2.0-flash', false);
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Compress this resume into a structured Candidate Profile (Role/Title, Top 5 Skills, Key 3 Projects, Work History) for interview answering:\n\n${fullText.slice(0, 5000)}`
              }]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
          })
        });
        const data = await res.json();
        const aiSummary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiSummary) {
          setResumeSummary(aiSummary);
          localStorage.setItem('user_resume_summary', aiSummary);
          addLog(`✅ Resume summary cached for fast AI calls (${aiSummary.length} chars).`);
        }
      } catch (e) {
        console.warn('Async resume summary note:', e);
      }
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoadingResume(true);
    setResumeFileName(file.name);
    addLog(`📄 Processing resume: ${file.name}...`);

    try {
      let extractedText = '';
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      
      if (isPdf) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ 
            data: new Uint8Array(arrayBuffer),
            useSystemFonts: true,
            isEvalSupported: false
          });
          const pdf = await loadingTask.promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            text += pageText + '\n\n';
          }
          extractedText = text.trim();
        } catch (pdfErr) {
          console.warn('PDF.js parse warning:', pdfErr);
        }
      }

      // If text is still empty (e.g. non-pdf or fallback)
      if (!extractedText) {
        const rawText = await file.text();
        // Filter out binary null bytes if user uploaded binary file
        extractedText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
      }

      if (!extractedText || extractedText.length < 20) {
        throw new Error('Could not extract readable text from this file. Please paste your resume text below.');
      }

      setResumeText(extractedText);
      localStorage.setItem('user_resume_text', extractedText);
      localStorage.setItem('user_resume_filename', file.name);
      addLog(`✅ Resume loaded (${extractedText.length} chars). Generating smart summary...`);
      await generateAndCacheResumeSummary(extractedText, file.name);
    } catch (err) {
      console.error('Resume upload error:', err);
      addLog(`⚠️ ${err.message || 'Error reading resume file'}`);
      setOutputText(`⚠️ Resume Upload Notice: Could not extract text from "${file.name}". You can paste your resume text directly into the text box in Settings!`);
    } finally {
      setIsLoadingResume(false);
    }
  };

  const handleClearResume = () => {
    setResumeText('');
    setResumeFileName('');
    setResumeSummary('');
    localStorage.removeItem('user_resume_text');
    localStorage.removeItem('user_resume_filename');
    localStorage.removeItem('user_resume_summary');
    if (resumeFileInputRef.current) {
      resumeFileInputRef.current.value = '';
    }
    addLog('Resume cleared.');
  };

  // Save settings
  useEffect(() => {
    localStorage.setItem('auto_ask', autoAsk);
    localStorage.setItem('overlay_opacity', opacity);
    localStorage.setItem('interview_count', interviewCount);
    if (resumeText) {
      localStorage.setItem('user_resume_text', resumeText);
      if (!resumeSummary) {
        generateAndCacheResumeSummary(resumeText, resumeFileName);
      }
    } else {
      localStorage.removeItem('user_resume_text');
      localStorage.removeItem('user_resume_summary');
    }
  }, [autoAsk, opacity, interviewCount, resumeText]);

  useEffect(() => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('set-opacity', parseFloat(opacity));
    }
  }, [opacity]);

  useEffect(() => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('toggle-always-on-top', alwaysOnTop);
    }
  }, [alwaysOnTop]);

  // Global hotkeys (F1 for capture under window, F3 for Ask AI, F4 for Region capture, F10 for panic kill)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Panic / Force Quit shortcuts (F10, Fn+F10, Cmd+Q, Cmd+Shift+Q, Ctrl+Q)
      if (
        e.key === 'F10' || 
        e.code === 'F10' || 
        ((e.metaKey || e.ctrlKey) && (e.key === 'q' || e.key === 'Q')) ||
        ((e.metaKey || e.ctrlKey) && (e.key === 'F10' || e.code === 'F10')) ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'q' || e.key === 'Q'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleForceQuit();
        return;
      }

      // Auto-Typer Shortcuts (Cmd/Ctrl + Shift + T to start, Cmd/Ctrl + Shift + S to stop)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        e.stopPropagation();
        handleStartAutoType();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        handleStopAutoType();
        return;
      }

      if (e.key === 'F2' || e.code === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        handleCapture('under-window');
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleCapture('region');
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleAskAI();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Also listen to IPC shortcut triggers and Auto-Typer status from Electron Main process
    let removeIpc = null;
    if (window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const handleIpcShortcut = (event, shortcut) => {
          if (shortcut === 'F10' || shortcut === 'FORCE_QUIT') {
            handleForceQuit();
          } else if (shortcut === 'START_AUTO_TYPE') {
            handleStartAutoType();
          } else if (shortcut === 'F1') {
            handleCapture('under-window');
          } else if (shortcut === 'F4') {
            handleCapture('region');
          } else if (shortcut === 'F3') {
            handleAskAI();
          }
        };

        const handleAutoTypeStatus = (event, status) => {
          setAutoTypeState(prev => ({ ...prev, ...status }));
        };

        ipcRenderer.on('shortcut-triggered', handleIpcShortcut);
        ipcRenderer.on('auto-typer:status', handleAutoTypeStatus);

        removeIpc = () => {
          ipcRenderer.removeListener('shortcut-triggered', handleIpcShortcut);
          ipcRenderer.removeListener('auto-typer:status', handleAutoTypeStatus);
        };
      } catch (err) {}
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (removeIpc) removeIpc();
    };
  }, [screenshotData, inputText, isLoading, opacity, alwaysOnTop, autoAsk]);

  // Auto scroll output
  useEffect(() => {
    if (outputScrollRef.current) {
      outputScrollRef.current.scrollTop = outputScrollRef.current.scrollHeight;
    }
  }, [outputText]);

  const handleCapture = async (type = 'region') => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      try {
        let channel = 'interactive-snip';
        if (type === 'under-window') channel = 'capture-window-area';
        else if (type === 'full') channel = 'capture-screen';
        
        if (type === 'region') {
          setOutputText('✂️ Drag crosshairs around the question on your screen (Esc to cancel)...');
        } else {
          setOutputText('📸 Capturing question...');
        }
        
        const dataUrl = await ipcRenderer.invoke(channel);

        if (dataUrl) {
          addLog(`📸 Captured raw screenshot: ${(dataUrl.length / 1024).toFixed(0)} KB`);
          setOutputText('Processing image for AI vision...');
          const optimizedDataUrl = await compressImage(dataUrl, 1600, 0.85);
          addLog(`⚡ Optimized image: ${(optimizedDataUrl.length / 1024).toFixed(0)} KB`);
          setScreenshotData(optimizedDataUrl);
          if (autoAsk) {
            setOutputText('Question captured. Auto-analyzing with AI...');
            handleAskAI(null, optimizedDataUrl);
          } else {
            setOutputText('📸 Question captured! Press Ask AI (F3) or click Ask below.');
          }
        } else {
          setOutputText('Screen capture cancelled or unavailable.');
        }
      } catch (err) {
        console.error('Capture error:', err);
        setOutputText('Error during screen capture.');
      }
    }
  };

  const handleAskAI = async (overrideText = null, overrideImage = null) => {
    if (isLoading) return;
    
    const isTrial = isFreeTrial || planType === 'free_trial';
    const activePlan = isTrial ? 'free_trial' : 'paid';
    const activeEngine = 'Gemini';
    
    // Hardcoded Keys (Both Paid and Trial use Gemini key)
    // getActiveGeminiKey() returns custom key first, then internal as fallback
    const geminiKey = getActiveGeminiKey();
    const groqKey = getActiveGroqKey();

    console.log(`[Plan] Active Plan: ${activePlan}`);
    console.log(`[Plan] Engine: ${activeEngine}`);
    addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    addLog(`[Plan] ${activePlan.toUpperCase()}`);
    addLog(`[Engine] ${activeEngine}`);
    addLog(`[Keys] Gemini: ${geminiKey ? maskKey(geminiKey) : 'SKIP'} | Groq: ${groqKey ? maskKey(groqKey) : 'SKIP'}`);
    
    const textToSend = overrideText !== null ? overrideText : inputText;
    const imageToSend = overrideImage || screenshotData;

    if (!textToSend && !imageToSend) {
      setOutputText('Please capture a screen (F1/F4) or enter a question.');
      return;
    }

    setIsLoading(true);
    setStreamStatus('⚡ Processing...');
    setOutputText('');

    const candidateProfile = resumeSummary || resumeText;

    let sysInstruction = `You are an expert coding and live technical interview copilot assisting a candidate.

RULES FOR CODING QUESTIONS & SCREEN CAPTURES:
1. COMPLETE, 100% WORKING CODE:
   - Always give the **COMPLETE, FULLY WORKING CODE**. Never give partial, pseudo-code, truncated, or half solutions. Never leave "// TODO" or incomplete methods.
   - Include all necessary imports, class definitions, helper functions, and full logic ready to copy and run.
   - Make the code clean, optimal, and interview-ready.
2. EXACT PROGRAMMING LANGUAGE:
   - Detect the exact programming language requested in the question (Java, Python, C++, JavaScript, TypeScript, Go, C#, SQL, etc.).
   - If the candidate explicitly mentions or types a language in the question, write the solution in that EXACT language.
   - If no specific language is requested or visible, default to Python.
3. OUTPUT STRUCTURE:
   - First: A very short approach (3-5 concise bullet points: intuition, optimal algorithm, Time and Space Complexity).
   - Second: The **COMPLETE working code** enclosed inside a clean Markdown code block with language identifier (\`\`\`language ... \`\`\`).
   - If it is an MCQ or theoretical question, clearly state the correct option and a concise explanation.

RULES FOR USING CANDIDATE RESUME:
- If the question is about the candidate's personal background, projects, or work history ("Tell me about yourself", "Walk me through your projects"):
  ALWAYS answer from the FIRST PERSON perspective ("I am...", "In my recent project, I built...") strictly reflecting the details in the Candidate Resume below.`;

    if (candidateProfile && candidateProfile.trim()) {
      sysInstruction += `\n\n[CANDIDATE RESUME / PROFILE]:\n${candidateProfile.trim().slice(0, 6000)}`;
    }

    let promptText = `${sysInstruction}\n\n[Interview Question / Context]:\n${textToSend || 'This is a coding interview question from the attached screen capture. Read the image carefully, extract the problem statement, detect the required programming language, and output the short approach followed by the COMPLETE 100% working code immediately. Do NOT ask for more details or clarification — solve the exact question shown in the screenshot.'}`;

    let success = false;
    let accumulatedReply = '';
    let lastErr = null;
    const startTime = Date.now();

    // 1. Gemini Multimodal Vision & Coding Engine
    const hasValidGeminiKey = geminiKey && geminiKey.trim().length > 10 && !geminiKey.includes('your_gemini');
    if (hasValidGeminiKey) {
      const geminiModels = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
      ];
      
      let imageBase64 = null;
      let imageMime = 'image/png';
      if (imageToSend) {
        const parts = imageToSend.split(',');
        if (parts.length === 2) {
          const match = parts[0].match(/:(.*?);/);
          if (match) imageMime = match[1];
          imageBase64 = parts[1];
        } else {
          imageBase64 = imageToSend;
        }
      }

      for (const modelId of geminiModels) {
        console.log(`[Plan] Model being used: ${modelId}`);
        addLog(`[Gemini] Attempting model: ${modelId}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
          const { url, headers } = buildGeminiRequestConfig(geminiKey, modelId, true);
          
          const contentParts = [];
          if (imageBase64) {
            contentParts.push({
              inline_data: {
                mime_type: imageMime,
                data: imageBase64
              }
            });
          }
          contentParts.push({ text: promptText });

          const geminiBody = { 
            contents: [
              {
                role: 'user',
                parts: contentParts
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096
            }
          };

          // --- ATTEMPT 1: ?key= format ---
          let response = await fetch(url, {
            method: 'POST', headers, body: JSON.stringify(geminiBody), signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let firstTokenTime = null;

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr) {
                    try {
                      const data = JSON.parse(jsonStr);
                      const parts = data.candidates?.[0]?.content?.parts || [];
                      let textChunk = '';
                      for (const part of parts) {
                        if (part.text) {
                          textChunk += part.text;
                        }
                      }
                      if (textChunk) {
                        if (!firstTokenTime) {
                          firstTokenTime = Date.now();
                          const latency = ((firstTokenTime - startTime) / 1000).toFixed(2);
                          setStreamStatus(`⚡ AI (${latency}s)`);
                        }
                        accumulatedReply += textChunk;
                        setOutputText(accumulatedReply);
                      }
                    } catch (e) {}
                  }
                }
              }
            }

            // Fallback to non-streaming if stream closed with empty output
            if (!accumulatedReply || !accumulatedReply.trim()) {
              addLog(`⚠️ SSE stream empty for ${modelId}. Trying direct generateContent...`);
              try {
                const { url: directUrl, headers: directHeaders } = buildGeminiRequestConfig(geminiKey, modelId, false);
                const directRes = await fetch(directUrl, {
                  method: 'POST',
                  headers: directHeaders,
                  body: JSON.stringify(geminiBody)
                });
                if (directRes.ok) {
                  const data = await directRes.json();
                  const parts = data.candidates?.[0]?.content?.parts || [];
                  const fullAnswer = parts.map(p => p.text || '').join('');
                  if (fullAnswer && fullAnswer.trim()) {
                    accumulatedReply = fullAnswer;
                    setOutputText(accumulatedReply);
                  }
                }
              } catch (directErr) {
                addLog(`Direct generateContent error: ${directErr.message}`);
              }
            }

            if (accumulatedReply && accumulatedReply.trim()) {
              const totalSec = ((Date.now() - startTime) / 1000).toFixed(2);
              setStreamStatus(`⚡ ${totalSec}s`);
              addLog(`✅ Gemini answered in ${totalSec}s`);
              setInterviewCount(prev => prev + 1);
              decrementUserCredits();
              success = true;
              break;
            }
          } else {
            const errTxt = await response.text();
            let errMsg = '';
            try {
              const errJson = JSON.parse(errTxt);
              errMsg = errJson?.error?.message || errTxt;
            } catch { errMsg = errTxt; }
            addLog(`❌ Gemini FINAL Error ${response.status} | ${modelId} | ${errMsg.slice(0, 200)}`);
            lastErr = `Gemini Error (${response.status}): ${errMsg.slice(0, 120)}`;
          }
        } catch (err) {
          clearTimeout(timeoutId);
          addLog(`❌ Gemini Exception: ${err.message}`);
          lastErr = err.name === 'AbortError' ? 'Gemini timed out (12s)' : err.message;
        }
      }
    }

    // 2. Groq Fallback Engine (Ultra-fast Qwen/Llama/GPT-OSS)
    if (!success && groqKey) {
      if (!textToSend && imageToSend) {
        addLog(`⚠️ Screenshot requires Gemini Multimodal Vision API key.`);
        setOutputText(`⚠️ **Screenshot Analysis Requires a Free Gemini API Key**\n\nGroq does not support image analysis. To get instant complete code directly from screenshots:\n\n1. Click **Settings ⚙️** (top right).\n2. Paste your free Google Gemini API Key (starts with \`AIzaSy...\`) from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).\n3. Click **Done** and press **F3 / Ask**!\n\n*(Alternatively, copy and paste the question text into the input box below and press Enter).*`);
        setIsLoading(false);
        setStreamStatus('');
        return;
      }
      addLog(`[Groq] Falling back to Groq AI Engine...`);
      const groqModels = [
        'openai/gpt-oss-120b',
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-20b'
      ];

      for (const modelId of groqModels) {
        addLog(`[Groq] Attempting model: ${modelId}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                { role: 'system', content: sysInstruction },
                { role: 'user', content: textToSend || 'Analyze the provided question and provide the direct spoken interview answer.' }
              ],
              temperature: 0.2,
              max_tokens: 4096,
              stream: true
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let firstTokenTime = null;

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr && jsonStr !== '[DONE]') {
                    try {
                      const data = JSON.parse(jsonStr);
                      const chunk = data.choices?.[0]?.delta?.content;
                      if (chunk) {
                        if (!firstTokenTime) {
                          firstTokenTime = Date.now();
                          const latency = ((firstTokenTime - startTime) / 1000).toFixed(2);
                          setStreamStatus(`⚡ Groq (${latency}s)`);
                        }
                        accumulatedReply += chunk;
                        setOutputText(accumulatedReply);
                      }
                    } catch (e) {}
                  }
                }
              }
            }

            if (accumulatedReply && accumulatedReply.trim()) {
              const totalSec = ((Date.now() - startTime) / 1000).toFixed(2);
              setStreamStatus(`⚡ ${totalSec}s`);
              addLog(`✅ Groq answered in ${totalSec}s (${accumulatedReply.length} chars)`);
              setInterviewCount(prev => prev + 1);
              decrementUserCredits();
              success = true;
              break;
            }
          } else {
            const errTxt = await response.text();
            let errMsg = '';
            try {
              const errJson = JSON.parse(errTxt);
              errMsg = errJson?.error?.message || errTxt;
            } catch { errMsg = errTxt; }
            addLog(`⚠️ Groq ${response.status} (${modelId}): ${errMsg.slice(0, 100)}`);
            lastErr = `Groq ${response.status}: ${errMsg.slice(0, 100)}`;
          }
        } catch (err) {
          clearTimeout(timeoutId);
          addLog(`⚠️ Groq Exception: ${err.message}`);
          lastErr = err.message;
        }
      }
    }


    if (!success && !accumulatedReply) {
      setOutputText(`⚠️ Error: ${lastErr || 'Failed to connect to AI engine. Check your internet connection.'}`);
      setStreamStatus('');
    } else if (success && accumulatedReply && autoTypeAfterResponse) {
      // Level 3: Full Automatic Version — automatically start typing once AI finishes
      const pureCode = extractCodeOnly(accumulatedReply);
      if (pureCode && pureCode.length > 10) {
        addLog('[AutoTyper] ⚡ Full Automatic Mode: Auto-type after response triggered!');
        setTimeout(() => {
          handleStartAutoType(pureCode, 3);
        }, 700);
      }
    }

    setIsLoading(false);
  };

  const handleListen = () => {
    if (isVoiceMode) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  };

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [liveVolume, setLiveVolume] = useState(0); 
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [silenceWarning, setSilenceWarning] = useState(false);

  // Audio Context & Native PCM Recording References
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const systemStreamRef = useRef(null);
  const processorRef = useRef(null);
  const pcmAudioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const silenceStartTimeRef = useRef(null);
  const maxVolumeRef = useRef(0);

  // Audio Hardware Devices
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => localStorage.getItem('selected_audio_device') || '');

  // Load available microphone devices
  const loadAudioDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setAvailableDevices(audioInputs);
      }
    } catch (e) {
      console.warn('Failed to enumerate audio devices:', e);
    }
  };

  useEffect(() => {
    loadAudioDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      localStorage.setItem('selected_audio_device', selectedDeviceId);
    } else {
      localStorage.removeItem('selected_audio_device');
    }
  }, [selectedDeviceId]);

  // Clean up recording & audio graph nodes
  const cleanupVoiceResources = () => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }
    if (systemStreamRef.current) {
      try {
        systemStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      systemStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  const toggleTestMic = async () => {
    if (isTestingMic) {
      cleanupVoiceResources();
      setIsTestingMic(false);
      setLiveVolume(0);
    } else {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const constraints = {
          audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(2048, 1, 1);

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          const vol = Math.min(100, Math.round(rms * 450));
          setLiveVolume(vol);
          if (vol > 1) {
            setSilenceWarning(false);
          }
        };

        source.connect(processor);
        const muteGain = audioContext.createGain();
        muteGain.gain.value = 0;
        processor.connect(muteGain);
        muteGain.connect(audioContext.destination);
        processorRef.current = processor;

        setIsTestingMic(true);
      } catch (err) {
        alert(`Mic Test Failed: ${err.message}`);
        cleanupVoiceResources();
      }
    }
  };

  const startVoiceMode = async () => {
    try {
      cleanupVoiceResources();
      pcmAudioChunksRef.current = [];
      maxVolumeRef.current = 0;
      silenceStartTimeRef.current = Date.now();
      setSilenceWarning(false);
      setRecordingSeconds(0);

      // Check macOS Microphone Permission before requesting stream
      if (window.require) {
        try {
          const { ipcRenderer } = window.require('electron');
          const micStatus = await ipcRenderer.invoke('check-microphone-permission');
          if (micStatus === 'denied') {
            addLog('❌ Microphone access denied by macOS');
            setOutputText('⚠️ Microphone access is denied. Please enable Microphone permissions in macOS System Settings -> Privacy & Security -> Microphone.');
            return;
          }
        } catch (e) {}
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Dedicated audio processor for sample-accurate PCM recording
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        pcmAudioChunksRef.current.push(new Float32Array(inputData));

        // High-precision live RMS volume meter
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const vol = Math.min(100, Math.round(rms * 450));
        setLiveVolume(vol);

        if (vol > maxVolumeRef.current) {
          maxVolumeRef.current = vol;
        }

        if (vol > 0.5) {
          silenceStartTimeRef.current = Date.now();
          setSilenceWarning(false);
        } else {
          if (silenceStartTimeRef.current && (Date.now() - silenceStartTimeRef.current > 5000)) {
            setSilenceWarning(true);
          }
        }
      };

      const muteGain = audioContext.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(audioContext.destination);
      processorRef.current = processor;

      // 1. Microphone Audio Stream
      const constraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(processor);

      // 2. System Audio Loopback (Interviewer Audio from computer speakers/headphones)
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const sysStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
          if (sysStream && sysStream.getAudioTracks().length > 0) {
            systemStreamRef.current = sysStream;
            const sysSource = audioContext.createMediaStreamSource(sysStream);
            sysSource.connect(processor);
            addLog('🔊 System Audio (Interviewer Loopback) attached');
          }
          if (sysStream) {
            sysStream.getVideoTracks().forEach(t => t.stop());
          }
        }
      } catch (sysErr) {
        // Normal if loopback cancelled or unselected; mic continues
      }

      let sec = 0;
      recordingTimerRef.current = setInterval(() => {
        sec++;
        setRecordingSeconds(sec);
        if (sec >= 120) {
          stopVoiceMode();
        }
      }, 1000);

      setIsVoiceMode(true);
      setStreamStatus('🎙️ Listening...');
      setOutputText("🎙️ Listening... Speak your interview question now!\n\n(Click 'Voice' when done to get instant answer)");
      addLog('Listening for speech...');
    } catch (err) {
      addLog(`❌ Microphone error: ${err.message}`);
      setOutputText(`Microphone access error: ${err.message}. Please check microphone permissions in Settings.`);
      cleanupVoiceResources();
    }
  };

  const stopVoiceMode = async () => {
    const speechEndTime = Date.now();
    setIsVoiceMode(false);
    setIsLoading(true);
    setStreamStatus('⚡ Transcribing...');
    setOutputText('⚡ Transcribing speech...');
    addLog(`[${new Date().toLocaleTimeString()}] Speech ended (${recordingSeconds}s, Peak: ${maxVolumeRef.current}%). Processing audio...`);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
      processorRef.current = null;
    }

    // Merge PCM chunks
    const chunks = pcmAudioChunksRef.current;
    let totalLength = 0;
    for (let i = 0; i < chunks.length; i++) {
      totalLength += chunks[i].length;
    }

    const currentSampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
    cleanupVoiceResources();

    if (totalLength < 2000) {
      setIsLoading(false);
      setStreamStatus('');
      addLog(`[${new Date().toLocaleTimeString()}] ⚠️ Audio too short (<0.1s)`);
      setOutputText("⚠️ Speech was too short. Please click Voice, speak your question, and click Voice again.");
      return;
    }

    if (maxVolumeRef.current < 1 && totalLength > 4000) {
      setIsLoading(false);
      setStreamStatus('');
      addLog(`[${new Date().toLocaleTimeString()}] ⚠️ Audio volume 0% (Silent mic).`);
      setOutputText("⚠️ No sound was detected from your microphone (0% volume).\n\nPlease check:\n1. Is your microphone muted or input level too low?\n2. Is Microphone permission enabled in macOS System Settings -> Privacy & Security -> Microphone?\n3. Select the correct audio input device in Settings.");
      return;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < chunks.length; i++) {
      merged.set(chunks[i], offset);
      offset += chunks[i].length;
    }

    // Convert raw PCM to 16kHz mono WAV and Base64
    const downsampled = downsampleBuffer(merged, currentSampleRate, 16000);
    const wavBuffer = encodeWAV(downsampled, 16000);
    const base64Wav = arrayBufferToBase64(wavBuffer);
    addLog(`[${new Date().toLocaleTimeString()}] 16kHz WAV ready (${(base64Wav.length / 1024).toFixed(1)} KB).`);

    const isTrial = isFreeTrial || planType === 'free_trial';
    const activePlan = isTrial ? 'free_trial' : 'paid';
    const activeEngine = 'Gemini';

    // getActiveGeminiKey() returns custom key first, then internal key as fallback
    const geminiKey = getActiveGeminiKey();
    const groqKey = getActiveGroqKey();

    console.log(`[Plan] Active Plan: ${activePlan}`);
    console.log(`[Plan] Engine: ${activeEngine}`);
    addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    addLog(`[Voice] Plan: ${activePlan.toUpperCase()}`);
    addLog(`[Voice] Engine: ${activeEngine}`);
    addLog(`[Voice] Keys: Gemini: ${geminiKey ? maskKey(geminiKey) : 'SKIP'} | Groq: ${groqKey ? maskKey(groqKey) : 'SKIP'}`);

    const candidateProfile = resumeSummary || resumeText;
    let voiceSysInstruction = `You are a real-time live interview copilot assisting a candidate.
Deliver a complete, articulate, high-scoring interview response tailored to be spoken naturally.

RULES FOR USING CANDIDATE RESUME:
1. If the question is about the candidate's background, projects, work experience, or skills (e.g. "Tell me about yourself", "Walk me through your projects", "Have you used X?"):
   - ALWAYS answer from the FIRST PERSON perspective ("I am...", "In my recent project, I built...") strictly reflecting the details and achievements in the Candidate Resume below.
2. If the question is general technical, coding, system design, or theoretical (whether in or outside resume):
   - Provide the complete, optimal spoken answer with core definition, 2-3 punchy bullet points, optimal approach, and complexity.
3. Bold essential technical keywords for easy scanning.`;

    if (candidateProfile && candidateProfile.trim()) {
      voiceSysInstruction += `\n\n[CANDIDATE RESUME / PROFILE]:\n${candidateProfile.trim().slice(0, 6000)}`;
    }

    let voiceSuccess = false;
    let accumulatedText = '';
    let lastErr = null;
    let firstTokenLatency = null;

    // 1. Gemini Voice Engine
    const hasValidGeminiKey = geminiKey && geminiKey.trim().length > 10 && !geminiKey.includes('your_gemini');
    if (hasValidGeminiKey) {
      const geminiModels = [
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ];

      for (const modelId of geminiModels) {
        console.log(`[Plan] Model being used: ${modelId}`);
        addLog(`[Voice] Attempting Gemini model: ${modelId}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
          const { url, headers } = buildGeminiRequestConfig(geminiKey, modelId, true);
          const voicePrompt = `${voiceSysInstruction}\n\n[TASK]: Listen to the interview audio recording below. Transcribe what was asked and provide the complete, direct, spoken-style interview answer.`;

          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: voicePrompt },
                  {
                    inlineData: {
                      mimeType: 'audio/wav',
                      data: base64Wav
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000
              }
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok && response.body) {
            const streamReader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { value, done } = await streamReader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr) {
                    try {
                      const chunkData = JSON.parse(jsonStr);
                      const chunkText = chunkData.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (chunkText) {
                        if (firstTokenLatency === null) {
                          firstTokenLatency = ((Date.now() - speechEndTime) / 1000).toFixed(2);
                          setStreamStatus(`⚡ First word: ${firstTokenLatency}s`);
                        }
                        accumulatedText += chunkText;
                        setOutputText(accumulatedText);
                      }
                    } catch (e) {}
                  }
                }
              }
            }

            if (accumulatedText && accumulatedText.trim()) {
              const totalSec = ((Date.now() - speechEndTime) / 1000).toFixed(2);
              setStreamStatus(`⚡ ${firstTokenLatency || totalSec}s`);
              addLog(`[${new Date().toLocaleTimeString()}] ✅ Gemini Voice streamed in ${totalSec}s (${accumulatedText.length} chars)`);
              setInterviewCount(prev => prev + 1);
              decrementUserCredits();
              voiceSuccess = true;
              break;
            }
          } else {
            const errTxt = await response.text();
            let errMsg = '';
            try {
              const errJson = JSON.parse(errTxt);
              errMsg = errJson?.error?.message || errTxt;
            } catch { errMsg = errTxt; }
            addLog(`⚠️ Gemini Voice Error (${response.status}): ${errMsg.slice(0, 120)}`);
            lastErr = `Gemini Audio Error (${response.status}): ${errMsg.slice(0, 100)}`;
          }
        } catch (gErr) {
          clearTimeout(timeoutId);
          addLog(`⚠️ Gemini Voice Stream exception: ${gErr.message}`);
          lastErr = gErr.message;
        }
      }
    }

    // 2. Groq Voice Fallback (Whisper AI + Groq Chat Streaming)
    if (!voiceSuccess && groqKey) {
      addLog(`[Voice] Falling back to Groq Whisper AI...`);
      let transcript = '';
      const whisperModels = ['whisper-large-v3-turbo', 'whisper-large-v3'];

      for (const whisperModel of whisperModels) {
        try {
          const formData = new FormData();
          const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('model', whisperModel);
          formData.append('response_format', 'text');

          const whisperController = new AbortController();
          const whisperTimeout = setTimeout(() => whisperController.abort(), 10000);

          const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`
            },
            body: formData,
            signal: whisperController.signal
          });
          clearTimeout(whisperTimeout);

          if (whisperRes.ok) {
            transcript = (await whisperRes.text()).trim();
            if (transcript) {
              addLog(`[Voice] Whisper heard: "${transcript.slice(0, 80)}"`);
              break;
            }
          }
        } catch (wErr) {
          console.warn('Groq Whisper error:', wErr);
        }
      }

      if (transcript) {
        setStreamStatus('⚡ Groq Generating...');
        const promptForAnswer = `Interview Question: "${transcript}"\nProvide the complete, direct, spoken-style interview answer.`;
        const groqChatModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];

        for (const chatModel of groqChatModels) {
          const chatController = new AbortController();
          const chatTimeout = setTimeout(() => chatController.abort(), 12000);

          try {
            const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
              },
              body: JSON.stringify({
                model: chatModel,
                messages: [
                  { role: 'system', content: voiceSysInstruction },
                  { role: 'user', content: promptForAnswer }
                ],
                temperature: 0.2,
                max_tokens: 650,
                stream: true
              }),
              signal: chatController.signal
            });
            clearTimeout(chatTimeout);

            if (chatRes.ok && chatRes.body) {
              const reader = chatRes.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';

              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr && jsonStr !== '[DONE]') {
                      try {
                        const data = JSON.parse(jsonStr);
                        const chunk = data.choices?.[0]?.delta?.content;
                        if (chunk) {
                          if (firstTokenLatency === null) {
                            firstTokenLatency = ((Date.now() - speechEndTime) / 1000).toFixed(2);
                            setStreamStatus(`⚡ Groq (${firstTokenLatency}s)`);
                          }
                          accumulatedText += chunk;
                          setOutputText(accumulatedText);
                        }
                      } catch (e) {}
                    }
                  }
                }
              }

              if (accumulatedText && accumulatedText.trim()) {
                const totalSec = ((Date.now() - speechEndTime) / 1000).toFixed(2);
                setStreamStatus(`⚡ ${totalSec}s`);
                addLog(`[${new Date().toLocaleTimeString()}] ✅ Groq Voice streamed in ${totalSec}s (${accumulatedText.length} chars)`);
                setInterviewCount(prev => prev + 1);
                decrementUserCredits();
                voiceSuccess = true;
                break;
              }
            }
          } catch (chatErr) {
            clearTimeout(chatTimeout);
            addLog(`⚠️ Groq Voice Error: ${chatErr.message}`);
          }
        }
      }
    }


    if (!voiceSuccess || !accumulatedText) {
      setIsLoading(false);
      setStreamStatus('');
      addLog(`[${new Date().toLocaleTimeString()}] Voice processing ended: ${lastErr || 'No speech detected'}`);
      if (!hasValidGeminiKey) {
        setOutputText("⚠️ Gemini API Key Required: Please open Settings (Gear Icon ⚙️), paste your Google AI Studio API Key (starts with AIzaSy...), and click 'Test Key'.");
      } else {
        setOutputText(lastErr ? `⚠️ Voice recognition notice (${lastErr}). Please speak closer to your microphone and try again.` : "⚠️ Could not detect speech clearly. Please speak closer to your microphone and click Voice again.");
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      if (autoAsk && text) {
        handleAskAI(text);
      }
    } catch (err) {
      console.error('Paste error:', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setScreenshotData(null);
  };

  const handleMinimize = () => {
    setIsCompactMode(!isCompactMode);
  };

  const handleClose = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('close-window');
    }
  };

  const handleForceQuit = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('force-quit-app');
    } else {
      window.close();
    }
  };

  if (isCompactMode) {
    return (
      <div 
        onClick={() => setIsCompactMode(false)}
        className="fixed top-3 right-3 z-50 bg-[#070b19]/90 hover:bg-[#070b19] backdrop-blur-xl text-emerald-400 text-[11px] font-black px-3.5 py-1.5 rounded-full border border-emerald-500/30 shadow-2xl cursor-pointer flex items-center gap-2 transition-all select-none hover:scale-105 active:scale-95"
        style={{ WebkitAppRegion: 'no-drag' }}
        title="Anazk AI is Snoozed — Click to Expand"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>Anazk AI (Click to Open)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07090e]/90 backdrop-blur-2xl text-slate-100 p-2.5 font-sans select-none relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_1px_1px_rgba(255,255,255,0.06)]">
      {/* Subtle Top Ambient Accent Light */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-emerald-500/[0.06] via-transparent to-transparent pointer-events-none" />
      
      {/* Preferences / Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="bg-[#0b0f19] p-5 rounded-2xl border border-white/10 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl relative text-left">
            <button 
              onClick={() => setShowSettings(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all"
            >
              <X size={15} />
            </button>
            
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Settings size={16} className="text-emerald-400" />
              Settings
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">Customize your stealth HUD overlay</p>
            
            <div className="space-y-3.5 text-xs">
              {/* Toggles */}
              <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="font-semibold text-gray-300">Always On Top</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={alwaysOnTop}
                    onChange={(e) => setAlwaysOnTop(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="font-semibold text-gray-300">Auto Ask AI on Capture</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={autoAsk}
                    onChange={(e) => setAutoAsk(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Microphone Device Selector */}
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between text-gray-300 font-semibold">
                  <span>Microphone Device</span>
                  <button 
                    onClick={loadAudioDevices} 
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    Refresh
                  </button>
                </div>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 text-gray-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500/40"
                >
                  <option value="">Default System Microphone</option>
                  {availableDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))}
                </select>
                
                {/* Live Mic Tester inside Settings */}
                <div className="pt-2">
                  <button
                    onClick={toggleTestMic}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isTestingMic 
                        ? 'bg-amber-500 text-black font-extrabold animate-pulse' 
                        : 'bg-white/10 hover:bg-white/20 text-gray-200'
                    }`}
                  >
                    <Mic size={12} />
                    <span>{isTestingMic ? 'Stop Test' : 'Test Microphone (Live Volume)'}</span>
                  </button>
                  {isTestingMic && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-amber-300 font-mono">
                        <span>Live Mic Level:</span>
                        <span>{liveVolume}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                          style={{ width: `${liveVolume}%` }}
                        ></div>
                      </div>
                      {silenceWarning && (
                        <p className="text-[10px] text-red-400 font-bold animate-pulse">
                          ⚠️ No sound detected. Check microphone settings / unmute mic
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* My Resume Section (Personalized AI Interview Copilot) */}
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-2.5">
                <div className="flex justify-between items-center text-gray-300 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-400" />
                    <span>My Resume</span>
                  </div>
                  {resumeText.trim() ? (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Check size={10} /> Resume Loaded ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-bold">
                      No Resume Uploaded
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-gray-400">
                  AI will automatically personalize all interview answers based on your background, skills, and projects.
                </p>

                {/* File Upload Controls */}
                <div className="flex gap-2 items-center">
                  <input
                    ref={resumeFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-file-input"
                  />
                  <label
                    htmlFor="resume-file-input"
                    className="flex-1 py-1.5 px-3 bg-white/10 hover:bg-white/20 active:scale-95 text-gray-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
                  >
                    <Upload size={12} className="text-emerald-400" />
                    <span>{isLoadingResume ? 'Extracting Text...' : (resumeFileName ? `Change (${resumeFileName.slice(0, 14)}...)` : 'Upload PDF Resume')}</span>
                  </label>

                  {resumeText.trim() && (
                    <button
                      onClick={handleClearResume}
                      className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all border border-red-500/20 active:scale-95 cursor-pointer flex items-center gap-1"
                      title="Clear Resume"
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {/* Paste / Edit Resume Text */}
                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    localStorage.setItem('user_resume_text', e.target.value);
                  }}
                  placeholder="Or paste your resume text here (experience, skills, projects)..."
                  rows={4}
                  className="w-full bg-black/60 border border-white/10 text-gray-200 rounded-lg p-2.5 text-[11px] outline-none focus:border-emerald-500/40 font-mono no-scrollbar resize-none placeholder-gray-600"
                />
                
                {resumeText.trim() && (
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                    <span>{resumeFileName ? `File: ${resumeFileName}` : 'Pasted text'}</span>
                    <span>{resumeText.length.toLocaleString()} characters</span>
                  </div>
                )}
              </div>

              {/* Custom Gemini API Key (Optional) */}
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-gray-300 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span>Gemini API Key (Optional)</span>
                  </div>
                  {customGeminiKey ? (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium">
                      Built-in Fast AI
                    </span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="password"
                    value={customGeminiKey}
                    onChange={(e) => {
                      setCustomGeminiKey(e.target.value);
                      if (e.target.value.trim()) {
                        localStorage.setItem('custom_gemini_key', e.target.value.trim());
                      } else {
                        localStorage.removeItem('custom_gemini_key');
                      }
                    }}
                    placeholder="AIzaSy... (Google AI Studio Key)"
                    className="flex-1 bg-black/60 border border-white/10 text-gray-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500/40 font-mono placeholder-gray-600"
                  />
                  <button
                    onClick={async () => {
                      const keyToTest = (customGeminiKey || '').replace(/["']/g, '').trim();
                      if (!keyToTest) {
                        alert('Please enter a Gemini API Key first.');
                        return;
                      }
                      setKeyTestStatus('Testing...');
                      try {
                        const { url, headers } = buildGeminiRequestConfig(keyToTest, 'gemini-2.0-flash', false);
                        const res = await fetch(url, {
                          method: 'POST',
                          headers,
                          body: JSON.stringify({
                            contents: [{ parts: [{ text: 'Ping' }] }]
                          })
                        });
                        if (res.ok) {
                          setKeyTestStatus('✅ Key is Valid!');
                          setTimeout(() => setKeyTestStatus(''), 4000);
                        } else {
                          const errData = await res.json().catch(() => ({}));
                          const msg = errData?.error?.message || `HTTP ${res.status}`;
                          setKeyTestStatus(`❌ Error: ${msg.slice(0, 50)}`);
                        }
                      } catch (err) {
                        setKeyTestStatus(`❌ ${err.message}`);
                      }
                    }}
                    className="px-2.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                  >
                    Test Key
                  </button>
                </div>
                {keyTestStatus && (
                  <p className={`text-[11px] font-medium ${keyTestStatus.startsWith('✅') ? 'text-emerald-400' : keyTestStatus === 'Testing...' ? 'text-amber-400' : 'text-red-400'}`}>
                    {keyTestStatus}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 flex justify-between">
                  <span>Get key free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 underline">aistudio.google.com</a></span>
                  {customGeminiKey && (
                    <button
                      onClick={() => {
                        setCustomGeminiKey('');
                        setKeyTestStatus('');
                        localStorage.removeItem('custom_gemini_key');
                      }}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </p>
              </div>

              {/* Opacity Slider */}
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-gray-300 mb-1.5 font-semibold">
                  <span>Stealth Transparency</span>
                  <span className="text-emerald-400 font-mono font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.2" max="1.0" step="0.05"
                  className="w-full accent-emerald-500 cursor-pointer bg-gray-700 h-1.5 rounded-lg appearance-none"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                />
              </div>

              {/* Auto-Type After Response Toggle (Level 3 Setting) */}
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Keyboard size={14} className="text-cyan-400" />
                    <span className="text-gray-200 text-xs font-bold">Auto-Type After Response</span>
                  </div>
                  <button
                    onClick={() => {
                      const nextVal = !autoTypeAfterResponse;
                      setAutoTypeAfterResponse(nextVal);
                      localStorage.setItem('auto_type_after_response', String(nextVal));
                      addLog(`Auto-Type After Response set to: ${nextVal}`);
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      autoTypeAfterResponse ? 'bg-cyan-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      autoTypeAfterResponse ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Automatically starts human-like typing into your active window (LeetCode, VS Code, etc.) as soon as AI finishes generating code with a 3-second prep delay.
                </p>
                <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono pt-1.5 border-t border-white/5">
                  <span>Start / Resume: <span className="text-cyan-300 font-bold">Cmd+Shift+T</span></span>
                  <span>Stop: <span className="text-red-300 font-bold">Cmd+Shift+S</span></span>
                </div>

                {/* Typing Speed Control */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[10px] text-gray-300 font-bold block">Typing Speed:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'slow', label: 'Slow (400ms)' },
                      { id: 'normal', label: 'Normal (220ms)' },
                      { id: 'fast', label: 'Fast (110ms)' }
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setAutoTypeSpeed(preset.id);
                          localStorage.setItem('auto_type_speed', preset.id);
                          addLog(`Typing speed set to: ${preset.id}`);
                        }}
                        className={`py-1 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                          autoTypeSpeed === preset.id 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-xs' 
                            : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[9px] font-bold">{preset.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-5">
              <button 
                onClick={() => setShowSettings(false)} 
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Done
              </button>
              <button 
                onClick={handleForceQuit} 
                className="px-3 py-2 bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Completely terminate application & background processes (F10)"
              >
                <Power size={13} />
                <span>Quit App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Stealth Header (Parakeet AI Ultra-Minimalist Studio HUD) */}
      <header className="flex justify-between items-center px-2 py-1.5 mb-2 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl cursor-move select-none transition-all shadow-xs backdrop-blur-md" style={{ WebkitAppRegion: 'drag' }}>
        
        {/* Left: Brand Identity & Live Pulse */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute opacity-60"></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black tracking-tight text-white font-sans">Anazk<span className="text-emerald-400">AI</span></span>
            <span className="text-[8px] font-extrabold tracking-widest text-emerald-400/90 font-mono uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">COPILOT</span>
          </div>
        </div>

        {/* Center: Stealth Drag Grip & Quick Context Pills */}
        <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* Subtle Drag Grip Indicator */}
          <div className="hidden sm:flex items-center justify-center px-2 py-1 cursor-grab opacity-30 hover:opacity-75 transition-opacity" title="Drag to reposition HUD">
            <div className="w-7 h-1 rounded-full bg-white/40"></div>
          </div>

          {/* Resume Status Pill */}
          {resumeText.trim() ? (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer shadow-2xs"
              title={`Resume loaded (${resumeFileName || 'Active'}) — AI personalizes solutions to your stack`}
            >
              <FileText size={9} />
              <span>Resume ✓</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-gray-200 px-2 py-0.5 rounded-full text-[9px] font-semibold hover:bg-white/[0.08] transition-all cursor-pointer"
              title="Click to add resume for tailored answers"
            >
              <FileText size={9} />
              <span>+ Resume</span>
            </button>
          )}

          {/* Session Time Remaining Pill */}
          {timeRemaining !== undefined && timeRemaining !== null && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] border font-mono font-bold shadow-2xs ${
              isFreeTrial || planType === 'free_trial'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                : (typeof timeRemaining === 'number' && timeRemaining < 10 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' 
                    : (timeRemaining === 'UNLIMITED' 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                        : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'))
            }`}>
              {isFreeTrial || planType === 'free_trial' ? (
                <Gift size={10} className="text-amber-400 animate-pulse" />
              ) : (
                <Clock size={10} />
              )}
              <span>
                {isFreeTrial || planType === 'free_trial' ? `TRIAL: ${timeRemaining}m` : (timeRemaining === 'UNLIMITED' ? '👑 PRO' : `${timeRemaining}m`)}
              </span>
            </div>
          )}
        </div>

        {/* Right: Parakeet Window Controls */}
        <div className="flex space-x-1 items-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings size={12} />
          </button>
          <button 
            onClick={handleMinimize}
            className="text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Minimize to Floating Bubble"
          >
            <Minus size={12} />
          </button>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-amber-300 bg-white/[0.04] hover:bg-amber-500/15 border border-white/[0.06] p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Hide Overlay to Background (F2)"
          >
            <X size={12} />
          </button>
          <button 
            onClick={handleForceQuit}
            className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 px-2 py-1 rounded-lg transition-all cursor-pointer border border-red-500/25 hover:border-red-600 shadow-sm flex items-center gap-1 font-bold active:scale-95"
            title="🚨 Auto-Close / Kill Switch (F10) — Completely exit and stop all background processes"
          >
            <Power size={11} />
            <span className="text-[10px] font-bold">Auto Close</span>
          </button>
        </div>
      </header>

      {/* On-Screen Diagnostic Logs Drawer */}
      {showLogs && (
        <div className="mb-2 bg-black/90 border border-amber-500/30 rounded-xl p-2.5 max-h-40 overflow-y-auto no-scrollbar font-mono text-[10px] text-amber-300 shadow-2xl z-30" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="flex justify-between items-center pb-1 mb-1 border-b border-amber-500/20">
            <span className="font-bold uppercase text-[9px] text-amber-400">Live Diagnostic Logs</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setDebugLogs([])} 
                className="text-[9px] text-gray-400 hover:text-white"
              >
                Clear
              </button>
              <button 
                onClick={() => setShowLogs(false)} 
                className="text-[9px] text-amber-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="space-y-0.5">
            {debugLogs.length === 0 ? (
              <p className="text-gray-500 italic">No logs yet. Click 'Voice' or ask a question to see activity.</p>
            ) : (
              debugLogs.map((log, idx) => (
                <div key={idx} className="leading-tight break-all">{log}</div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Live Voice Recording HUD Visualizer Bar */}
      {isVoiceMode && (
        <div className="mb-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-1.5 shadow-lg" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-bold text-red-400">🎙️ Listening... (Speak your question)</span>
            </div>
            <span className="font-mono text-[11px] text-gray-300 font-bold">
              00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 02:00
            </span>
          </div>
          
          {/* Real-time 60fps Volume Meter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-mono">Vol:</span>
            <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div 
                className={`h-full transition-all duration-75 ${liveVolume > 50 ? 'bg-red-500' : (liveVolume > 15 ? 'bg-emerald-400' : 'bg-amber-400')}`}
                style={{ width: `${Math.max(4, liveVolume)}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-gray-300 font-mono w-7 text-right">{liveVolume}%</span>
          </div>

          {/* 4-Second Silence Warning */}
          {silenceWarning && (
            <div className="text-[10px] text-red-400 font-bold flex items-center gap-1 bg-red-950/40 p-1 rounded-md border border-red-500/20">
              <span>⚠️ No sound detected. Check microphone settings / unmute mic</span>
            </div>
          )}
        </div>
      )}

      {/* Screen Recording Permission Alert (macOS only) */}
      {!hasScreenPermission && (
        <div className="mb-2 p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-[11px] flex items-center justify-between gap-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
          <div>
            <p className="font-bold text-amber-300 text-[11px]">⚠️ Screen Permission Required</p>
            <p className="text-[10px] text-amber-200/80">macOS only captures wallpaper until Screen Recording is enabled for this app.</p>
          </div>
          <button 
            onClick={() => {
              if (window.require) window.require('electron').ipcRenderer.send('open-screen-permission-settings');
            }}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold rounded-lg text-[10px] shrink-0 cursor-pointer shadow-sm"
          >
            Fix in Settings
          </button>
        </div>
      )}

      {/* Main Unified Response Viewport (Parakeet Glass HUD) */}
      <main className="flex-1 flex flex-col min-h-0 relative bg-[#090d14]/75 rounded-xl border border-white/[0.07] overflow-hidden shadow-inner backdrop-blur-md" style={{ WebkitAppRegion: 'no-drag' }}>
        
        {/* Viewport Top Bar (Model Status Strip) */}
        <div className="px-3.5 py-1.5 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
              <Sparkles size={10} />
              <span>{getActiveGeminiKey() ? 'Gemini 2.0 Flash' : (getActiveGroqKey() ? 'Groq Llama 3' : 'AI Copilot')}</span>
            </span>
            {streamStatus && (
              <span className="text-[9px] text-teal-300 font-mono font-semibold bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 animate-pulse">
                {streamStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Type Button & Status Controls */}
            {autoTypeState.countdown > 0 ? (
              <button
                onClick={handleStopAutoType}
                className="bg-amber-500/25 hover:bg-red-500/30 text-amber-300 hover:text-red-300 border border-amber-500/50 px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1.5 animate-pulse transition-all cursor-pointer shadow-md"
                title="Cancel countdown (Cmd+Shift+S)"
              >
                <Clock size={11} className="animate-spin text-amber-400" />
                <span>🎯 Click Editor! Starts in {autoTypeState.countdown}s (Cancel)</span>
              </button>
            ) : autoTypeState.isTyping ? (
              <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-400/40 px-2 py-0.5 rounded-md shadow-sm">
                <span className="text-[9px] font-mono font-bold text-cyan-300 flex items-center gap-1">
                  <Keyboard size={10} className="animate-pulse text-cyan-400" />
                  <span>{autoTypeState.progress}%</span>
                </span>
                {autoTypeState.isPaused ? (
                  <button
                    onClick={handleResumeAutoType}
                    className="p-1 text-emerald-400 hover:text-white bg-white/10 rounded transition-colors"
                    title="Resume typing (Cmd+Shift+T)"
                  >
                    <Play size={10} />
                  </button>
                ) : (
                  <button
                    onClick={handlePauseAutoType}
                    className="p-1 text-amber-400 hover:text-white bg-white/10 rounded transition-colors"
                    title="Pause typing"
                  >
                    <Pause size={10} />
                  </button>
                )}
                <button
                  onClick={handleStopAutoType}
                  className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 rounded flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  title="Force Stop typing immediately (Cmd+Shift+S)"
                >
                  <Square size={8} fill="currentColor" />
                  <span>Stop</span>
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors flex items-center gap-0.5 px-1 cursor-pointer"
                  title="Hide overlay & free mouse (F2)"
                >
                  <EyeOff size={9} />
                </button>
              </div>
            ) : (
              outputText && !outputText.startsWith('Screen captured') && !outputText.startsWith('Analyzing') && !outputText.startsWith('Please') && (
                <button 
                  onClick={() => handleStartAutoType()}
                  className="text-cyan-300 hover:text-white bg-cyan-500/15 hover:bg-cyan-600 border border-cyan-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 text-[9px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Auto-type code solution into focused editor / LeetCode (Cmd+Shift+T)"
                >
                  <Keyboard size={10} />
                  <span>Auto Type</span>
                </button>
              )
            )}

            {outputText && (
              <>
                <button 
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-2 py-0.5 rounded-md flex items-center gap-1 text-[9px] font-bold transition-all cursor-pointer"
                  title="Copy full answer"
                >
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button 
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-2 py-0.5 rounded-md flex items-center gap-1 text-[9px] font-bold transition-all cursor-pointer"
                  title="Clear viewport"
                >
                  <Trash2 size={10} />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Loading Bar */}
        {isLoading && (
          <div className="w-full h-[2px] bg-white/5 overflow-hidden relative shrink-0">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-loading-bar rounded-full"></div>
          </div>
        )}

        {/* Active Screenshot Thumbnail Chip */}
        {screenshotData && (
          <div className="absolute top-10 right-3 border border-white/10 rounded-lg overflow-hidden h-14 w-auto shadow-xl z-20 group/thumb bg-black flex items-center">
            <img src={screenshotData} alt="Screen capture" className="h-full object-contain" />
            <button 
              onClick={() => setScreenshotData(null)}
              className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white text-[9px] p-0.5 rounded-bl transition-opacity cursor-pointer"
              title="Remove capture"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {/* Response Markdown Feed */}
        <div ref={outputScrollRef} className="flex-1 p-4 overflow-y-auto no-scrollbar text-left text-xs leading-relaxed font-medium select-text">
          {outputText && !outputText.startsWith('Screen captured') && !outputText.startsWith('Analyzing') && !outputText.startsWith('Please') ? (
            <div className="text-gray-200 prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    return !inline && match ? (
                      <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-lg">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.06] text-[10px] text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                            <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
                            <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-bold">{match[1]}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartAutoType(codeString)}
                              className="text-cyan-400 hover:text-white flex items-center gap-1 text-[9px] font-bold py-0.5 px-1.5 rounded hover:bg-cyan-500/20 border border-cyan-500/25 transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="Auto-type this snippet into active window (Cmd+Shift+T)"
                            >
                              <Keyboard size={9} />
                              <span>Auto Type</span>
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeString);
                              }}
                              className="text-gray-400 hover:text-white flex items-center gap-1 text-[9px] font-bold py-0.5 px-1.5 rounded hover:bg-white/10 transition-all cursor-pointer"
                              title="Copy code"
                            >
                              <Copy size={10} />
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                        <SyntaxHighlighter
                          {...props}
                          children={codeString}
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          className="!m-0 !p-3 text-[11px] font-mono leading-relaxed bg-transparent"
                        />
                      </div>
                    ) : (
                      <code {...props} className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold border border-emerald-500/20">
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {outputText}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400 text-xs px-6 py-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Sparkles size={18} className="text-emerald-400 animate-pulse" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Anazk AI Copilot Ready</h3>
              <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed mb-4">
                Invisible overlay active. Capture coding questions or speak directly to receive instant answers.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-left">
                  <span className="font-mono text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">F4</span>
                  <span className="text-[10px] font-medium text-gray-300">Snip Question</span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-left">
                  <span className="font-mono text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">F1</span>
                  <span className="text-[10px] font-medium text-gray-300">Full Screen</span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-left">
                  <span className="font-mono text-[10px] font-black text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">F3</span>
                  <span className="text-[10px] font-medium text-gray-300">Generate Answer</span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-left">
                  <span className="font-mono text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">F2</span>
                  <span className="text-[10px] font-medium text-gray-300">Hide Window</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Command Input Bar (Parakeet Glass Style) */}
      <div className="mt-2 flex items-center gap-2 bg-[#090d14]/80 p-1 rounded-xl border border-white/[0.08] backdrop-blur-md shadow-inner" style={{ WebkitAppRegion: 'no-drag' }}>
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => {
            if (window.require) {
              window.require('electron').ipcRenderer.send('request-focus');
            }
          }}
          onClick={() => {
            if (window.require) {
              window.require('electron').ipcRenderer.send('request-focus');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAskAI();
            }
          }}
          placeholder="Ask a question, enter code context, or press Enter..."
          className="flex-1 px-3 py-1.5 bg-transparent outline-none text-xs text-gray-100 placeholder-gray-500 font-medium"
        />
        {inputText.trim() && (
          <button 
            onClick={() => handleAskAI()}
            disabled={isLoading}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md active:scale-95 flex items-center gap-1"
          >
            <Send size={11} />
            <span className="text-[10px]">Send</span>
          </button>
        )}
      </div>

      {/* Action Buttons Toolbar (Parakeet AI Ergonomic Dock) */}
      <footer className="mt-1.5 flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
        <button 
          onClick={() => handleCapture('region')}
          className="flex-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 py-1.5 px-2 rounded-xl text-[10px] font-black transition-all border border-emerald-500/30 active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          title="Drag crosshairs directly around the question on screen (F4)"
        >
          <Crop size={11} />
          <span>Snip (F4)</span>
        </button>

        <button 
          onClick={() => handleCapture('under-window')}
          className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border border-white/[0.06] active:scale-95 cursor-pointer flex items-center justify-center gap-1"
          title="Place overlay window over question and click to capture (F1)"
        >
          <span>Under (F1)</span>
        </button>

        <button 
          onClick={handleListen}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border active:scale-95 cursor-pointer ${
            isVoiceMode 
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse shadow-md shadow-red-500/20' 
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border-white/[0.06]'
          }`}
          title="Toggle live microphone and interviewer loopback transcription"
        >
          {isVoiceMode ? <MicOff size={11} className="animate-bounce" /> : <Mic size={11} />}
          <span>{isVoiceMode ? `Rec (${liveVolume}%)` : 'Voice'}</span>
        </button>

        <button 
          onClick={() => handleAskAI()}
          disabled={isLoading}
          className={`flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-1.5 px-2.5 rounded-xl text-[10px] font-black transition-all shadow-md shadow-emerald-500/25 border border-emerald-400/30 active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Ask AI Copilot for solution (F3)"
        >
          <Sparkles size={11} />
          <span>Ask (F3)</span>
        </button>
        
        <button 
          onClick={handlePaste}
          className="bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all border border-white/[0.06] active:scale-95 cursor-pointer"
          title="Paste from clipboard"
        >
          Paste
        </button>
      </footer>
    </div>
  );
}

const isDesktopEnvironment = () => {
  if (typeof window === 'undefined') return true;
  const userAgent = (window.navigator?.userAgent || '').toLowerCase();
  const isElectronAgent = userAgent.indexOf('electron') > -1;
  const isElectronRequire = typeof window.require === 'function';
  const isFileProtocol = window.location.protocol === 'file:';
  const isSearchParamApp = window.location.search.includes('app=true');
  return isElectronAgent || isElectronRequire || isFileProtocol || isSearchParamApp;
};

function App() {
  const [isDesktop, setIsDesktop] = useState(isDesktopEnvironment);

  useEffect(() => {
    setIsDesktop(isDesktopEnvironment());
  }, []);

  // Website: /app-login route for deep link auth
  if (!isDesktop && window.location.pathname === '/app-login') {
    return <AppLoginPage />;
  }

  if (!isDesktop) {
    return <LandingPage />;
  }

  return (
    <SubscriptionGuard>
      <AppContent />
    </SubscriptionGuard>
  );
}

export default App;
