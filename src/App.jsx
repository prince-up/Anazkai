import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Copy, X, Minus, Sparkles, Mic, MicOff, Clock, Send, Image as ImageIcon, Trash2, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import LandingPage from './LandingPage';
import SubscriptionGuard from './components/SubscriptionGuard';

// Fallback / default built-in AI keys for subscribed users
const SYSTEM_DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const SYSTEM_DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

function AppContent({ timeRemaining, onLogout }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [screenshotData, setScreenshotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Settings & Preferences
  const [showSettings, setShowSettings] = useState(false);
  const [opacity, setOpacity] = useState(1.0);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [autoAsk, setAutoAsk] = useState(() => localStorage.getItem('auto_ask') === 'true');
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('resume_text') || '');
  const [interviewCount, setInterviewCount] = useState(() => parseInt(localStorage.getItem('interview_count')) || 0);

  // Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const outputScrollRef = useRef(null);

  // Save settings
  useEffect(() => {
    localStorage.setItem('groq_api_key', apiKey);
    localStorage.setItem('auto_ask', autoAsk);
    localStorage.setItem('resume_text', resumeText);
    localStorage.setItem('interview_count', interviewCount);
  }, [apiKey, autoAsk, resumeText, interviewCount]);

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

  // Global hotkeys (F1 for fullscreen capture, F3 for Ask AI, F4 for Region capture)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleCapture('full');
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleCapture('region');
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleAskAI();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenshotData, inputText, apiKey, isLoading, opacity, alwaysOnTop, autoAsk]);

  // Auto scroll output
  useEffect(() => {
    if (outputScrollRef.current) {
      outputScrollRef.current.scrollTop = outputScrollRef.current.scrollHeight;
    }
  }, [outputText]);

  const getEffectiveApiKey = () => {
    return (apiKey && apiKey.trim()) || SYSTEM_DEFAULT_GROQ_KEY;
  };

  const handleCapture = async (type = 'full') => {
    if (window.require) {
      let opacityRestored = false;
      const { ipcRenderer } = window.require('electron');
      try {
        const channel = type === 'region' ? 'start-region-capture' : 'capture-screen';
        
        if (type === 'region') ipcRenderer.send('set-opacity', 0);
        
        const dataUrl = await ipcRenderer.invoke(channel);
        
        if (type === 'region') {
          ipcRenderer.send('set-opacity', parseFloat(opacity));
          opacityRestored = true;
        }

        if (dataUrl) {
          setScreenshotData(dataUrl);
          if (autoAsk) {
            setOutputText('Screen captured. Auto-analyzing with AI...');
            handleAskAI(null, dataUrl);
          } else {
            setOutputText('Screen captured. Press Ask AI (F3) or click Ask below.');
          }
        } else {
          setOutputText('Screen capture cancelled or unavailable.');
        }
      } catch (err) {
        console.error('Capture error:', err);
        setOutputText('Error during screen capture.');
      } finally {
        if (type === 'region' && !opacityRestored) {
          ipcRenderer.send('set-opacity', parseFloat(opacity));
        }
      }
    }
  };

  const handleAskAI = async (overrideText = null, overrideImage = null) => {
    if (isLoading) return;
    
    const geminiKey = SYSTEM_DEFAULT_GEMINI_KEY;
    const groqKey = getEffectiveApiKey();

    if (!geminiKey && !groqKey) {
      setOutputText('AI Cloud Engine is not configured. Please ensure VITE_GEMINI_API_KEY is configured on your server.');
      return;
    }
    
    const textToSend = overrideText !== null ? overrideText : inputText;
    const imageToSend = overrideImage || screenshotData;

    if (!textToSend && !imageToSend) {
      setOutputText('Please capture a screen (F1/F4) or enter a question to analyze.');
      return;
    }

    setIsLoading(true);
    setOutputText('Analyzing question and generating calm response...');

    let promptText = `You are a real-time live interview copilot.
CRITICAL FORMATTING & ANSWER RULES:
1. Provide SHORT, DIRECT, and PUNCHY answers designed to be spoken naturally in an interview.
2. Structure: 2 to 4 concise bullet points maximum. Bold key technical terms.
3. NO generic filler (e.g. "Sure!", "As a candidate...", "Here is an answer..."). Get straight to the answer.
4. If a coding problem is detected, provide ONLY the clean optimal code with 1-line Time and Space complexity.
5. ONLY reference the candidate resume context if the question explicitly asks about personal background, projects, or past work experience. Otherwise, answer the concept directly.`;

    if (resumeText && resumeText.trim()) {
      promptText += `\n\n[Optional Background Reference - Only use if asked about personal experience]:\n${resumeText.trim()}`;
    }

    if (textToSend) {
      promptText += `\n\n[Interview Question / Prompt]:\n${textToSend}`;
    }

    let success = false;
    let reply = '';
    let lastErr = null;

    // 1. PRIMARY: GOOGLE GEMINI OFFICIAL PAID ENGINE
    if (geminiKey) {
      const geminiModels = ['gemini-3.7-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-pro-latest'];
      
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
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${geminiKey}`;
          const contentParts = [{ text: promptText }];
          if (imageBase64) {
            contentParts.push({
              inlineData: {
                mimeType: imageMime,
                data: imageBase64
              }
            });
          }

          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              contents: [{ parts: contentParts }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1024
              }
            })
          });
          const data = await response.json();

          if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            reply = data.candidates[0].content.parts[0].text;
            success = true;
            break;
          } else {
            lastErr = data.error?.message || 'Gemini error';
          }
        } catch (geminiErr) {
          lastErr = geminiErr.message;
        }
      }
    }

    // 2. SECONDARY / FALLBACK: GROQ LLAMA ENGINE
    if (!success && groqKey) {
      try {
        const url = `https://api.groq.com/openai/v1/chat/completions`;
        const content = [{ type: 'text', text: promptText }];

        if (imageToSend) {
          content.push({
            type: 'image_url',
            image_url: { url: imageToSend }
          });
        }

        const groqModels = imageToSend ? [
          'llama-3.2-11b-vision-preview',
          'llama-3.2-90b-vision-preview',
          'qwen-2.5-vl-72b-instruct'
        ] : ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];

        for (const modelId of groqModels) {
          try {
            const requestBody = { 
              model: modelId, 
              messages: [{ role: 'user', content }],
              temperature: 0.4,
              max_tokens: 800
            };
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
              body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            
            if (response.ok && data.choices?.[0]?.message?.content) {
               reply = data.choices[0].message.content;
               success = true;
               break;
            } else {
               lastErr = data.error?.message || 'Groq error';
               if (response.status === 401) break;
            }
          } catch (fetchErr) {
            lastErr = fetchErr.message;
          }
        }
      } catch (groqErr) {
        lastErr = groqErr.message;
      }
    }

    if (success && reply) {
      setOutputText(reply);
      setInterviewCount(prev => prev + 1);
      setInputText('');
    } else {
      setOutputText(`Error: ${lastErr || 'Failed to connect to AI engine. Please check internet connection.'}`);
    }

    setIsLoading(false);
  };

  // Voice recognition ref
  const speechRecognitionRef = useRef(null);

  const handleListen = () => {
    if (isVoiceMode) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  };

  const cleanupVoiceResources = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      audioStreamRef.current = null;
    }
    setIsVoiceMode(false);
  };

  const startVoiceMode = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // A. Native Browser / Electron Web Speech Recognition (Instant Realtime, Zero Cost, No Settings popup)
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        speechRecognitionRef.current = recognition;

        let accumulatedTranscript = '';

        recognition.onstart = () => {
          setIsVoiceMode(true);
          setOutputText("🎙️ Listening to interviewer's voice in real time... Click 'Voice' to stop and answer.");
        };

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInputText(currentTranscript);
            accumulatedTranscript = currentTranscript;
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition warning:", event.error);
          if (event.error === 'not-allowed') {
            setOutputText("Microphone permission denied. Please allow microphone access.");
            cleanupVoiceResources();
          }
        };

        recognition.onend = () => {
          setIsVoiceMode(false);
          if (accumulatedTranscript && accumulatedTranscript.trim()) {
            setOutputText(`Transcribed: "${accumulatedTranscript.trim()}"\n\nGenerating crisp interview response...`);
            handleAskAI(accumulatedTranscript.trim());
          }
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn("Falling back to MediaRecorder audio mode:", e);
      }
    }

    // B. Fallback MediaRecorder mode
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsVoiceMode(true);
      setOutputText("🎙️ Recording interviewer voice... Click 'Voice' again to stop and analyze.");
    } catch (err) {
      console.error("Mic error:", err);
      setOutputText(`Mic error: ${err.message}. Please check microphone permissions.`);
      cleanupVoiceResources();
    }
  };

  const stopVoiceMode = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    cleanupVoiceResources();
  };

  const transcribeAudio = async (audioBlob) => {
    const groqKey = getEffectiveApiKey();
    setIsLoading(true);
    setOutputText('Transcribing speech...');

    try {
      if (groqKey) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'speech.webm');
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('response_format', 'json');

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}` },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          const transcribedText = data.text;
          if (transcribedText && transcribedText.trim()) {
            setOutputText(`Transcribed: "${transcribedText}"\n\nGenerating crisp interview response...`);
            handleAskAI(transcribedText);
            return;
          }
        }
      }
      setOutputText('Voice recording finished. Please type or capture screen.');
    } catch (err) {
      console.error('Transcription error:', err);
      setOutputText(`Audio Notice: ${err.message}`);
    } finally {
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
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('minimize-window');
    }
  };

  const handleClose = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('close-window');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#070b14]/95 backdrop-blur-2xl text-gray-100 p-3.5 font-sans select-none relative overflow-hidden rounded-2xl">
      
      {/* Subtle Background Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Preferences / Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="bg-[#0e1322] p-6 rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setShowSettings(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all"
            >
              <X size={16} />
            </button>
            
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-1">
              <Settings size={18} className="text-emerald-400" />
              Preferences
            </h2>
            <p className="text-xs text-gray-400 mb-5">Customize your stealth assistant settings</p>
            
            <div className="space-y-4 text-xs">
              {/* Resume / Context */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">Context / Resume (Optional)</label>
                <textarea 
                  className="w-full h-28 px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-gray-300 resize-none transition-colors text-xs leading-relaxed"
                  placeholder="Paste your key projects, stack, or resume summary to personalize behavioral and technical answers..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
              
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

              {/* Opacity Slider */}
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-gray-300 mb-1.5 font-semibold">
                  <span>Overlay Transparency</span>
                  <span className="text-emerald-400 font-mono font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="1.0" step="0.05"
                  className="w-full accent-emerald-500 cursor-pointer bg-gray-700 h-1.5 rounded-lg appearance-none"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                />
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="mt-5 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="flex justify-between items-center pb-2.5 mb-2 border-b border-white/5 cursor-default select-none" style={{ WebkitAppRegion: 'drag' }}>
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-emerald-500/10">
            <Sparkles size={15} className="text-emerald-400 animate-pulse" />
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight">
            Anazk<span className="text-emerald-400 font-black">AI</span>
          </span>
          <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold tracking-widest uppercase">
            LIVE
          </span>
        </div>

        {/* Center: Integrated Timer Badge (No overlapping) */}
        {timeRemaining !== undefined && timeRemaining !== null && (
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2.5 py-1 rounded-full text-xs" style={{ WebkitAppRegion: 'no-drag' }}>
            <Clock size={11} className={typeof timeRemaining === 'number' && timeRemaining < 10 ? "text-red-400 animate-pulse" : (timeRemaining === 'UNLIMITED' ? "text-amber-400" : "text-emerald-400")} />
            <span className={`text-[10px] font-extrabold font-mono uppercase ${typeof timeRemaining === 'number' && timeRemaining < 10 ? "text-red-400" : (timeRemaining === 'UNLIMITED' ? "text-amber-300 font-black" : "text-emerald-300")}`}>
              {timeRemaining === 'UNLIMITED' ? '👑 OWNER VIP' : `${timeRemaining}m left`}
            </span>
            {onLogout && (
              <>
                <span className="text-white/20 text-[10px]">|</span>
                <button 
                  onClick={onLogout} 
                  className="text-[9px] text-gray-400 hover:text-red-400 uppercase font-extrabold transition-colors cursor-pointer"
                  title="Quit Session"
                >
                  Quit
                </button>
              </>
            )}
          </div>
        )}

        {/* Window Controls */}
        <div className="flex space-x-1 items-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Preferences"
          >
            <Settings size={13} />
          </button>
          <button 
            onClick={handleMinimize}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </header>

      {/* Main Unified Response Viewport (No split double boxes) */}
      <main className="flex-1 flex flex-col min-h-0 relative bg-black/40 rounded-xl overflow-hidden shadow-inner" style={{ WebkitAppRegion: 'no-drag' }}>
        
        {/* Viewport Top Bar */}
        <div className="px-3.5 py-2 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Assistant Response</span>
          </div>

          {outputText && (
            <button 
              onClick={handleCopy}
              className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
              title="Copy answer"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          )}
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
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        children={String(children).replace(/\n$/, '')}
                        style={atomDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg my-2.5 text-[11px] border border-white/5 font-mono shadow-md"
                      />
                    ) : (
                      <code {...props} className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold">
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
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-500 text-xs px-4">
              <Sparkles size={24} className="text-gray-600 mb-2 opacity-50" />
              <p className="font-semibold text-gray-400">{outputText || 'Ready to assist'}</p>
              <p className="text-[11px] text-gray-600 mt-1">
                Press <span className="text-gray-400 font-mono">F1</span> for full screen • <span className="text-gray-400 font-mono">F4</span> for region snip • <span className="text-gray-400 font-mono">F3</span> to ask
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Inline Question Input Bar */}
      <div className="mt-2.5 flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAskAI();
            }
          }}
          placeholder="Ask a question or enter context (Press Enter to ask)..."
          className="flex-1 px-3.5 py-2 bg-black/40 hover:bg-black/60 focus:bg-black/70 border border-white/10 focus:border-emerald-500/40 rounded-xl outline-none text-xs text-gray-200 placeholder-gray-500 transition-all font-medium"
        />
        {inputText.trim() && (
          <button 
            onClick={() => handleAskAI()}
            disabled={isLoading}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
          >
            <Send size={12} />
          </button>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <footer className="mt-2 flex flex-wrap gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
        <button 
          onClick={() => handleCapture('full')}
          className="flex-1 min-w-[65px] bg-white/5 hover:bg-white/10 text-gray-300 py-2 px-2 rounded-xl text-[10px] font-bold transition-all border border-white/5 active:scale-95 cursor-pointer"
        >
          Screen (F1)
        </button>
        
        <button 
          onClick={() => handleCapture('region')}
          className="flex-1 min-w-[65px] bg-white/5 hover:bg-white/10 text-gray-300 py-2 px-2 rounded-xl text-[10px] font-bold transition-all border border-white/5 active:scale-95 cursor-pointer"
        >
          Region (F4)
        </button>
        
        <button 
          onClick={handleListen}
          className={`flex-1 min-w-[75px] flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-[10px] font-bold transition-all border active:scale-95 cursor-pointer ${
            isVoiceMode 
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse shadow-md shadow-red-500/20' 
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5'
          }`}
        >
          {isVoiceMode ? <MicOff size={11} className="animate-bounce" /> : <Mic size={11} />}
          <span>{isVoiceMode ? 'Listening...' : 'Voice'}</span>
        </button>
        
        <button 
          onClick={() => handleAskAI()}
          disabled={isLoading}
          className={`flex-1 min-w-[70px] bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-2.5 rounded-xl text-[10px] font-black transition-all shadow-md shadow-emerald-500/20 border border-emerald-400/30 active:scale-95 cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Ask (F3)
        </button>
        
        <button 
          onClick={handlePaste}
          className="bg-white/5 hover:bg-white/10 text-gray-300 py-2 px-2.5 rounded-xl text-[10px] font-bold transition-all border border-white/5 active:scale-95 cursor-pointer"
          title="Paste from clipboard"
        >
          Paste
        </button>
        
        <button 
          onClick={handleClear}
          className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 py-2 px-2.5 rounded-xl text-[10px] font-bold transition-all border border-white/5 active:scale-95 cursor-pointer"
          title="Clear response"
        >
          Clear
        </button>
      </footer>
    </div>
  );
}

function App() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isElectronAgent = userAgent.indexOf(' electron/') > -1;
      const isElectronRequire = !!window.require;
      const isSearchParamApp = window.location.search.includes('app=true');
      setIsDesktop(isElectronAgent || isElectronRequire || isSearchParamApp);
    }
  }, []);

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
