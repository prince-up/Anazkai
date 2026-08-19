import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Copy, X, Minus, Sparkles, Mic, MicOff, Clock, Send, Image as ImageIcon, Trash2, Check, FileText, Upload, Gift, ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as pdfjsLib from 'pdfjs-dist';
import LandingPage from './LandingPage';
import SubscriptionGuard from './components/SubscriptionGuard';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

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

// Mask API Key for safe console debugging
function maskKey(key) {
  if (!key) return 'None';
  const str = key.trim();
  if (str.length <= 8) return str;
  return `${str.slice(0, 8)}...${str.slice(-4)}`;
}

// AI Engine API Keys Configuration
const FREE_TRIAL_GROQ_KEY = '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';
const FREE_TRIAL_GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';

function getActiveGeminiKey() {
  const custom = (localStorage.getItem('custom_gemini_key') || '').trim();
  if (custom) return custom;
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (envKey) return envKey;
  return '';
}

function getActiveGroqKey() {
  const custom = (localStorage.getItem('custom_groq_key') || '').trim();
  if (custom) return custom;
  const envKey = (import.meta.env.VITE_GROQ_API_KEY || '').trim();
  if (envKey) return envKey;
  // Built-in Free Trial fallback — always available
  return FREE_TRIAL_GROQ_KEY;
}

function buildGeminiRequestConfig(geminiKey, modelId, isStream = true) {
  const cleanKey = (geminiKey || '').trim();
  // Only ya29. tokens are actual short-lived OAuth Bearer tokens
  // AQ. keys from Google AI Studio are proper permanent API keys → use as ?key=
  const isBearer = cleanKey.startsWith('ya29.') || cleanKey.startsWith('Bearer ');
  
  let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:${isStream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
  const headers = { 'Content-Type': 'application/json' };
  
  if (isBearer) {
    headers['Authorization'] = cleanKey.startsWith('Bearer ') ? cleanKey : `Bearer ${cleanKey}`;
  } else if (cleanKey) {
    // AQ. and AIzaSy... both used as API key parameter
    url += `${isStream ? '&' : '?'}key=${cleanKey}`;
  }
  
  return { url, headers };
}

function AppContent({ timeRemaining, onLogout, planType = 'paid', isFreeTrial = false }) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [screenshotData, setScreenshotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const outputScrollRef = useRef(null);
  
  // Debug Logs State
  const [debugLogs, setDebugLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    console.log(formatted);
    setDebugLogs(prev => [formatted, ...prev.slice(0, 49)]);
  };
  
  // Settings & Preferences
  const [showSettings, setShowSettings] = useState(false);
  const [customGeminiKey, setCustomGeminiKey] = useState(() => localStorage.getItem('custom_gemini_key') || '');
  const [opacity, setOpacity] = useState(() => parseFloat(localStorage.getItem('overlay_opacity')) || 0.85);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [autoAsk, setAutoAsk] = useState(() => localStorage.getItem('auto_ask') === 'true');
  const [interviewCount, setInterviewCount] = useState(() => parseInt(localStorage.getItem('interview_count')) || 0);

  // Resume State (Persistent & Compactly Cached for Zero Latency)
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('user_resume_text') || '');
  const [resumeFileName, setResumeFileName] = useState(() => localStorage.getItem('user_resume_filename') || '');
  const [resumeSummary, setResumeSummary] = useState(() => localStorage.getItem('user_resume_summary') || '');
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const resumeFileInputRef = useRef(null);

  // Helper to generate & cache an ultra-compact 2-3 line resume summary for zero-latency AI injection
  const generateAndCacheResumeSummary = async (fullText, fileName) => {
    if (!fullText || !fullText.trim()) {
      setResumeSummary('');
      localStorage.removeItem('user_resume_summary');
      return;
    }

    // Default fast local fallback summary
    const cleanLines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const quickSummary = cleanLines.slice(0, 5).join(', ').slice(0, 280);
    setResumeSummary(quickSummary);
    localStorage.setItem('user_resume_summary', quickSummary);

    // Asynchronously generate an AI compressed profile once on upload
    const geminiKey = getActiveGeminiKey();
    if (geminiKey && fullText.length > 150) {
      try {
        const { url, headers } = buildGeminiRequestConfig(geminiKey, 'gemini-flash-latest', false);
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Compress this resume into a short 2-sentence Candidate Profile (Role/Title, Top 5 Skills, Key 2 Projects) for quick interview context:\n\n${fullText.slice(0, 3000)}`
              }]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
          })
        });
        const data = await res.json();
        const aiSummary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiSummary) {
          const compact = aiSummary.replace(/\n+/g, ' ').slice(0, 300);
          setResumeSummary(compact);
          localStorage.setItem('user_resume_summary', compact);
          addLog(`✅ Resume summary cached for fast AI calls (${compact.length} chars).`);
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
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        let text = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 4); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          text += pageText + '\n';
        }
        extractedText = text.trim();
      } else {
        const text = await file.text();
        extractedText = text.trim();
      }

      setResumeText(extractedText);
      localStorage.setItem('user_resume_text', extractedText);
      localStorage.setItem('user_resume_filename', file.name);
      addLog(`✅ Resume loaded (${extractedText.length} chars). Generating smart summary...`);
      await generateAndCacheResumeSummary(extractedText, file.name);
    } catch (err) {
      console.error('Resume upload error:', err);
      try {
        const text = await file.text();
        const cleaned = text.trim();
        setResumeText(cleaned);
        localStorage.setItem('user_resume_text', cleaned);
        localStorage.setItem('user_resume_filename', file.name);
        await generateAndCacheResumeSummary(cleaned, file.name);
      } catch (e) {
        addLog(`❌ Failed to read file: ${e.message}`);
      }
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
  }, [screenshotData, inputText, isLoading, opacity, alwaysOnTop, autoAsk]);

  // Auto scroll output
  useEffect(() => {
    if (outputScrollRef.current) {
      outputScrollRef.current.scrollTop = outputScrollRef.current.scrollHeight;
    }
  }, [outputText]);

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
    
    const isTrial = isFreeTrial || planType === 'free_trial';
    const activePlan = isTrial ? 'free_trial' : (planType || 'paid');
    // Free trial always uses built-in Groq key; paid uses their own keys
    const groqKey = isTrial ? FREE_TRIAL_GROQ_KEY : getActiveGroqKey();
    const geminiKey = isTrial ? '' : getActiveGeminiKey(); // skip Gemini for free trial

    addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    addLog(`[Plan] ${activePlan.toUpperCase()}`);
    addLog(`[Engine] ${isTrial ? 'Groq (Free Trial built-in)' : geminiKey ? 'Gemini → Groq fallback' : 'Groq only'}`);
    addLog(`[Keys] Gemini: ${geminiKey ? maskKey(geminiKey) : 'SKIP (trial)'} | Groq: ${maskKey(groqKey)}`);
    
    const textToSend = overrideText !== null ? overrideText : inputText;
    const imageToSend = overrideImage || screenshotData;

    if (!textToSend && !imageToSend) {
      setOutputText('Please capture a screen (F1/F4) or enter a question.');
      return;
    }

    setIsLoading(true);
    setStreamStatus('⚡ Processing...');
    setOutputText('');

    let promptText = `Direct live interview copilot. Answer in 2-3 punchy bullet points designed to be spoken. Bold key terms. If coding, give optimal code only with Time/Space complexity.`;

    const candidateProfile = resumeSummary || (resumeText ? resumeText.slice(0, 300) : '');
    if (candidateProfile.trim()) {
      promptText += `\n[Candidate Profile: ${candidateProfile.trim()}]`;
    }

    promptText += `\n\n[Question / Context]:\n${textToSend || 'Analyze the provided screen capture and provide the direct interview answer.'}`;

    let success = false;
    let accumulatedReply = '';
    let lastErr = null;
    const startTime = Date.now();

    // 1. ATTEMPT GEMINI FLASH — PAID USERS ONLY (skipped for free trial)
    if (!isTrial && geminiKey) {
      const geminiModels = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest'
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
          const { url, headers } = buildGeminiRequestConfig(geminiKey, modelId, true);
          
          const contentParts = [{ text: promptText }];
          if (imageBase64) {
            contentParts.push({
              inlineData: {
                mimeType: imageMime,
                data: imageBase64
              }
            });
          }

          const geminiBody = { 
            contents: [{ parts: contentParts }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500
            }
          };

          addLog(`[Gemini] Model: ${modelId} | Key Type: ${geminiKey.startsWith('AQ.') ? 'Bearer OAuth' : 'API Key'}`);
          addLog(`[Gemini] URL: ${url.split('?')[0]}`);
          addLog(`[Gemini] Body: ${JSON.stringify({ model: modelId, parts_count: contentParts.length, hasImage: !!imageBase64 })}`);

          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(geminiBody),
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
                  if (jsonStr) {
                    try {
                      const data = JSON.parse(jsonStr);
                      const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (chunk) {
                        if (!firstTokenTime) {
                          firstTokenTime = Date.now();
                          const latency = ((firstTokenTime - startTime) / 1000).toFixed(2);
                          setStreamStatus(`⚡ Gemini (${latency}s)`);
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
              setStreamStatus(`⚡ ${totalSec}s (Gemini Flash)`);
              addLog(`✅ Gemini answered in ${totalSec}s`);
              setInterviewCount(prev => prev + 1);
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
            addLog(`❌ Gemini HTTP ${response.status} | Model: ${modelId} | Error: ${errMsg.slice(0, 200)}`);
            lastErr = `Gemini ${response.status}: ${errMsg.slice(0, 100)}`;
          }
        } catch (err) {
          clearTimeout(timeoutId);
          addLog(`❌ Gemini Exception: ${err.message}`);
          lastErr = err.name === 'AbortError' ? 'Gemini timed out (12s)' : err.message;
        }
      }
    }

    // 2. GROQ ENGINE — PRIMARY for Free Trial, FALLBACK for Paid
    if (!success && groqKey) {
      const url = `https://api.groq.com/openai/v1/chat/completions`;
      // Free trial: use known-working model directly; paid: try vision models if image
      const groqModels = isTrial
        ? [FREE_TRIAL_GROQ_MODEL]
        : imageToSend
          ? ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.2-11b-vision-preview']
          : ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

      addLog(`[Groq] Engine: ${isTrial ? 'Free Trial (built-in key)' : 'Paid fallback'}`);
      addLog(`[Groq] Models to try: ${groqModels.join(', ')}`);


      for (const modelId of groqModels) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
          const messages = imageToSend ? [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                { type: 'image_url', image_url: { url: imageToSend } }
              ]
            }
          ] : [
            { role: 'user', content: promptText }
          ];

          const requestBody = { 
            model: modelId, 
            messages,
            temperature: 0.2,
            max_tokens: 500,
            stream: true
          };

          addLog(`[Groq] Model: ${modelId} | Key: ${maskKey(groqKey)}`);
          addLog(`[Groq] Body: ${JSON.stringify({ model: modelId, msg_count: messages.length, hasImage: !!imageToSend, stream: true })}`);

          const response = await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${groqKey}` 
            },
            body: JSON.stringify(requestBody),
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
              setStreamStatus(`⚡ ${totalSec}s (Groq)`);
              addLog(`✅ Groq answered in ${totalSec}s (${accumulatedReply.length} chars)`);
              setInterviewCount(prev => prev + 1);
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
            addLog(`❌ Groq HTTP ${response.status} | Model: ${modelId} | Error: ${errMsg.slice(0, 200)}`);
            lastErr = `Groq ${response.status}: ${errMsg.slice(0, 100)}`;
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            addLog(`❌ Groq timed out (12s) | Model: ${modelId}`);
            lastErr = 'Groq timed out.';
          } else {
            addLog(`❌ Groq Exception: ${fetchErr.message}`);
            lastErr = fetchErr.message;
          }
        }
      }
    }

    if (!success && !accumulatedReply) {
      setOutputText(`⚠️ Error: ${lastErr || 'Failed to connect to AI engine. Check your internet connection.'}`);
      setStreamStatus('');
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

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

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

      source.connect(processor);
      const muteGain = audioContext.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(audioContext.destination);
      processorRef.current = processor;

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
    addLog(`[${new Date().toLocaleTimeString()}] 16kHz WAV ready (${(base64Wav.length / 1024).toFixed(1)} KB). Sending to Whisper...`);

    const isTrial = isFreeTrial || planType === 'free_trial';
    const activePlan = isTrial ? 'free_trial' : (planType || 'paid');
    const geminiKey = isTrial ? '' : getActiveGeminiKey(); // no Gemini for free trial
    const groqKey = isTrial ? FREE_TRIAL_GROQ_KEY : getActiveGroqKey();

    addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    addLog(`[Voice] Plan: ${activePlan.toUpperCase()}`);
    addLog(`[Voice] Engine: ${isTrial ? 'Groq Whisper + Llama (Free Trial)' : 'Groq Whisper + Gemini/Groq (Paid)'}`);
    addLog(`[Voice] Groq Key: ${maskKey(groqKey)}`);

    const candidateProfile = resumeSummary || (resumeText ? resumeText.slice(0, 160) : '');
    let voiceSysInstruction = `You are a real-time live interview copilot assisting a candidate.
Deliver a complete, articulate, high-scoring interview response tailored to be spoken naturally.
Guidelines:
- Start directly with the core definition/concept in 1 crisp sentence.
- Provide 3-5 structured, punchy bullet points covering key mechanics, real-world examples, and best practices/trade-offs.
- Bold essential technical keywords for easy scanning.
- If it's a coding or design question, include the optimal approach and Time/Space complexity.
- Never give one-line or truncated fragments. Keep it complete, professional, and directly usable in the interview.`;

    if (candidateProfile.trim()) {
      voiceSysInstruction += `\n[Candidate Profile: ${candidateProfile.trim()}]`;
    }

    let transcript = '';
    let voiceSuccess = false;
    let accumulatedText = '';
    let lastErr = null;
    let firstTokenLatency = null;

    // STEP 1: ULTRA-FAST SPEECH-TO-TEXT WITH GROQ WHISPER (<0.25s)
    addLog(`[STT] Using Groq Whisper (${GROQ_WHISPER_MODEL})...`);
    if (groqKey) {
      const whisperModels = [GROQ_WHISPER_MODEL, 'whisper-large-v3'];

      for (const whisperModel of whisperModels) {
        const whisperController = new AbortController();
        const whisperTimeout = setTimeout(() => whisperController.abort(), 10000);

        try {
          addLog(`[STT Request] Groq Whisper (${whisperModel})...`);

          const formData = new FormData();
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          formData.append('file', wavBlob, 'audio.wav');
          formData.append('model', whisperModel);
          formData.append('response_format', 'json');
          formData.append('temperature', '0');

          const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqKey}` },
            body: formData,
            signal: whisperController.signal
          });

          clearTimeout(whisperTimeout);

          if (whisperRes.ok) {
            const whisperData = await whisperRes.json();
            transcript = whisperData.text?.trim();
            if (transcript) {
              const sttLatency = ((Date.now() - speechEndTime) / 1000).toFixed(2);
              addLog(`[STT Success (${sttLatency}s)] Heard: "${transcript}"`);
              break;
            }
          } else {
            const errTxt = await whisperRes.text();
            addLog(`⚠️ Whisper ${whisperModel} returned ${whisperRes.status}: ${errTxt}`);
            lastErr = errTxt;
          }
        } catch (err) {
          clearTimeout(whisperTimeout);
          addLog(`⚠️ Whisper ${whisperModel} error: ${err.message}`);
          lastErr = err.message;
        }
      }
    }

    // STEP 2: INSTANT STREAMING ANSWER GENERATION (<0.3s FIRST TOKEN)
    if (transcript) {
      setStreamStatus('⚡ Streaming Answer...');
      setOutputText('');

      const promptForAnswer = `Interview Question: "${transcript}"\nProvide the complete, direct, spoken-style interview answer.`;

      // 2A. ATTEMPT GEMINI STREAM — PAID USERS ONLY (skipped for free trial)
      if (!isTrial && geminiKey) {
        addLog(`[Voice Answer] Paid plan → Trying Gemini...`);
        const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];


        for (const modelId of geminiModels) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          try {
            const { url, headers } = buildGeminiRequestConfig(geminiKey, modelId, true);
            addLog(`[Answer Request] Google Gemini (${modelId}) Streaming...`);

            const response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: voiceSysInstruction }]
                },
                contents: [{
                  parts: [{ text: promptForAnswer }]
                }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 650
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
                setStreamStatus(`⚡ ${firstTokenLatency || totalSec}s (Gemini)`);
                addLog(`[${new Date().toLocaleTimeString()}] ✅ Gemini Voice streamed in ${totalSec}s (${accumulatedText.length} chars)`);
                setInterviewCount(prev => prev + 1);
                voiceSuccess = true;
                break;
              }
            } else {
              const errTxt = await response.text();
              addLog(`⚠️ Gemini Voice Notice (${response.status}): ${errTxt.slice(0, 120)}`);
            }
          } catch (gErr) {
            clearTimeout(timeoutId);
            addLog(`⚠️ Gemini Voice Stream notice: ${gErr.message}`);
          }
        }
      }

      // 2B. GROQ LLAMA — PRIMARY for Free Trial, FALLBACK for Paid
      if (!voiceSuccess && groqKey) {
        const voiceGroqModel = isTrial ? FREE_TRIAL_GROQ_MODEL : 'llama-3.3-70b-versatile';
        const chatController = new AbortController();
        const chatTimeout = setTimeout(() => chatController.abort(), 12000);

        try {
          addLog(`[Voice Answer] ${isTrial ? 'Free Trial' : 'Paid fallback'} → Groq model: ${voiceGroqModel}`);

          const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: voiceGroqModel,
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
                          setStreamStatus(`⚡ First word: ${firstTokenLatency}s`);
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
              setStreamStatus(`⚡ ${firstTokenLatency || totalSec}s (Llama 3.3)`);
              addLog(`[${new Date().toLocaleTimeString()}] ✅ Voice streamed in ${totalSec}s (${accumulatedText.length} chars)`);
              setInterviewCount(prev => prev + 1);
              voiceSuccess = true;
            }
          }
        } catch (chatErr) {
          clearTimeout(chatTimeout);
          addLog(`⚠️ Voice Streaming Error: ${chatErr.message}`);
          lastErr = chatErr.message;
        }
      }
    }

    // STEP 3: EMERGENCY DIRECT GEMINI AUDIO FALLBACK IF WHISPER DID NOT GET TRANSCRIPT
    if (!voiceSuccess && geminiKey) {
      addLog(`[Emergency Fallback] Direct Gemini Audio Recognition...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const { url, headers } = buildGeminiRequestConfig(geminiKey, 'gemini-2.0-flash', true);
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: voiceSysInstruction }]
            },
            contents: [{
              parts: [
                { text: "Transcribe spoken interview question and provide the direct, complete spoken interview answer." },
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
              maxOutputTokens: 650
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
            addLog(`[${new Date().toLocaleTimeString()}] ✅ Gemini Direct Audio done in ${totalSec}s`);
            setInterviewCount(prev => prev + 1);
            voiceSuccess = true;
          }
        }
      } catch (fbErr) {
        clearTimeout(timeoutId);
        lastErr = fbErr.message;
      }
    }

    if (!voiceSuccess || !accumulatedText) {
      setIsLoading(false);
      setStreamStatus('');
      addLog(`[${new Date().toLocaleTimeString()}] Voice processing ended: ${lastErr || 'No speech detected'}`);
      setOutputText(lastErr ? `⚠️ Voice recognition notice (${lastErr}). Please speak closer to your microphone and try again.` : "⚠️ Could not detect speech clearly. Please speak closer to your microphone and click Voice again.");
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
    <div className="flex flex-col h-screen bg-black/60 backdrop-blur-xl text-gray-100 p-3 font-sans select-none relative overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      
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
                  className="w-full bg-black/60 border border-white/10 text-gray-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500/40 font-mono placeholder-gray-600"
                />
                <p className="text-[10px] text-gray-500 flex justify-between">
                  <span>Get key free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 underline">aistudio.google.com</a></span>
                  {customGeminiKey && (
                    <button
                      onClick={() => {
                        setCustomGeminiKey('');
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
            </div>
            
            <button 
              onClick={() => setShowSettings(false)} 
              className="mt-5 w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Top Stealth Header (Clean minimalist HUD, no logos/branding) */}
      <header className="flex justify-between items-center pb-2 mb-1.5 border-b border-white/5 cursor-move select-none" style={{ WebkitAppRegion: 'drag' }}>
        {/* Stealth Drag Handle */}
        <div className="flex items-center gap-1.5 px-1">
          <div className="w-8 h-1 rounded-full bg-white/20 hover:bg-white/30 transition-all"></div>
        </div>

        {/* Center: Discreet Timer & Resume Status Badge */}
        <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
          {resumeText.trim() ? (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
              title={`Resume loaded (${resumeFileName || 'Pasted'}) - AI is personalizing answers to your experience`}
            >
              <FileText size={9} />
              <span>Resume Loaded ✓</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 bg-white/5 border border-white/5 text-gray-500 hover:text-gray-400 px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all cursor-pointer"
              title="Click to upload/paste your resume for personalized AI answers"
            >
              <FileText size={9} />
              <span>+ Resume</span>
            </button>
          )}

          {timeRemaining !== undefined && timeRemaining !== null && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${
              isFreeTrial || planType === 'free_trial'
                ? 'bg-amber-500/10 border-amber-500/30' 
                : 'bg-black/40 border-white/10'
            }`}>
              {isFreeTrial || planType === 'free_trial' ? (
                <Gift size={10} className="text-amber-400 animate-pulse" />
              ) : (
                <Clock size={10} className={typeof timeRemaining === 'number' && timeRemaining < 10 ? "text-red-400 animate-pulse" : (timeRemaining === 'UNLIMITED' ? "text-amber-400" : "text-emerald-400")} />
              )}
              <span className={`text-[9px] font-extrabold font-mono uppercase ${
                isFreeTrial || planType === 'free_trial'
                  ? 'text-amber-300 font-black' 
                  : (typeof timeRemaining === 'number' && timeRemaining < 10 ? "text-red-400" : (timeRemaining === 'UNLIMITED' ? "text-amber-300 font-black" : "text-emerald-300"))
              }`}>
                {isFreeTrial || planType === 'free_trial' ? `TRIAL: ${timeRemaining}m` : (timeRemaining === 'UNLIMITED' ? '👑 VIP' : `${timeRemaining}m`)}
              </span>
              {onLogout && (
                <>
                  <span className="text-white/20 text-[9px]">|</span>
                  <button 
                    onClick={onLogout} 
                    className="text-[8px] text-gray-400 hover:text-red-400 uppercase font-bold transition-colors cursor-pointer"
                    title="Quit Session"
                  >
                    Quit
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Minimal Window Controls */}
        <div className="flex space-x-1 items-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings size={12} />
          </button>
          <button 
            onClick={handleMinimize}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={12} />
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

      {/* Main Unified Response Viewport (No split double boxes) */}
      <main className="flex-1 flex flex-col min-h-0 relative bg-black/40 rounded-xl overflow-hidden shadow-inner" style={{ WebkitAppRegion: 'no-drag' }}>
        
        {/* Viewport Top Bar */}
        <div className="px-3.5 py-2 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Assistant Response</span>
            {streamStatus && (
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-pulse">
                {streamStatus}
              </span>
            )}
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
          <span>{isVoiceMode ? `Listening (${liveVolume}%)` : 'Voice'}</span>
        </button>
        
        <button 
          onClick={toggleTestMic}
          className={`min-w-[60px] flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-[10px] font-bold transition-all border active:scale-95 cursor-pointer ${
            isTestingMic
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
          }`}
          title="Test Microphone volume without calling AI"
        >
          <span>{isTestingMic ? 'Stop Test' : 'Test Mic'}</span>
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
