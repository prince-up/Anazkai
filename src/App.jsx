import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Copy, X, Minus, Sparkles, Mic, MicOff, Clock, Send, Image as ImageIcon, Trash2, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import LandingPage from './LandingPage';
import SubscriptionGuard from './components/SubscriptionGuard';

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

// Fallback / default built-in AI keys for subscribed users
const SYSTEM_DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AQ.Ab8RN6Kk4TXLpadEaCbbXvFk_Pg7ETtDYseb2_-K8iFjL2HlyA';
const SYSTEM_DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

function AppContent({ timeRemaining, onLogout }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [screenshotData, setScreenshotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
  const [opacity, setOpacity] = useState(() => parseFloat(localStorage.getItem('overlay_opacity')) || 0.85);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [autoAsk, setAutoAsk] = useState(() => localStorage.getItem('auto_ask') === 'true');
  const [interviewCount, setInterviewCount] = useState(() => parseInt(localStorage.getItem('interview_count')) || 0);

  // Voice Audio State & Refs
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const audioInputRef = useRef(null);
  const audioBuffersRef = useRef([]);
  const audioSampleRateRef = useRef(44100);
  const outputScrollRef = useRef(null);

  // Auto cleanup legacy stored resume to prevent irrelevant answers
  useEffect(() => {
    localStorage.removeItem('resume_text');
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('groq_api_key', apiKey);
    localStorage.setItem('auto_ask', autoAsk);
    localStorage.setItem('overlay_opacity', opacity);
    localStorage.setItem('interview_count', interviewCount);
  }, [apiKey, autoAsk, opacity, interviewCount]);

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
      setOutputText('AI Engine is not configured.');
      return;
    }
    
    const textToSend = overrideText !== null ? overrideText : inputText;
    const imageToSend = overrideImage || screenshotData;

    if (!textToSend && !imageToSend) {
      setOutputText('Please capture a screen (F1/F4) or enter a question.');
      return;
    }

    setIsLoading(true);
    setOutputText('Analyzing...');

    let promptText = `You are a real-time live interview copilot.
CRITICAL FORMATTING & ANSWER RULES:
1. Provide SHORT, DIRECT, and PUNCHY answers designed to be spoken naturally in an interview.
2. Structure: 2 to 4 concise bullet points maximum. Bold key technical terms.
3. NO generic intro or outro filler (e.g. "Sure!", "Here is an answer..."). Get straight to the point.
4. If a coding problem is detected, provide ONLY the clean optimal code block with 1-line Time and Space complexity.`;

    if (textToSend) {
      promptText += `\n\n[Interview Question / Prompt]:\n${textToSend}`;
    }

    let success = false;
    let reply = '';
    let lastErr = null;

    // 1. PRIMARY: GOOGLE GEMINI OFFICIAL PAID ENGINE (UNLIMITED)
    if (geminiKey) {
      const geminiModels = [
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-3.7-flash'
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
                temperature: 0.2,
                maxOutputTokens: 500
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
              temperature: 0.2,
              max_tokens: 450
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

  const handleListen = () => {
    if (isVoiceMode) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  };

  const cleanupVoiceResources = () => {
    try {
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current.onaudioprocess = null;
        audioProcessorRef.current = null;
      }
      if (audioInputRef.current) {
        audioInputRef.current.disconnect();
        audioInputRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.warn('Voice cleanup notice:', e);
    }
    setIsVoiceMode(false);
  };

  const maxVolumeRef = useRef(0);

  const startVoiceMode = async () => {
    try {
      cleanupVoiceResources();
      maxVolumeRef.current = 0;
      addLog('🎙️ Requesting microphone stream...');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true
        } 
      });
      audioStreamRef.current = stream;
      addLog(`Mic acquired. Tracks: ${stream.getAudioTracks().length}`);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      audioSampleRateRef.current = audioContext.sampleRate;
      addLog(`AudioContext: ${audioContext.sampleRate}Hz, State: ${audioContext.state}`);

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        addLog(`AudioContext resumed: ${audioContext.state}`);
      }

      const source = audioContext.createMediaStreamSource(stream);
      audioInputRef.current = source;

      // 2.5x gain booster
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 2.5;
      source.connect(gainNode);

      // ScriptProcessor buffer size 4096
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      audioProcessorRef.current = processor;
      audioBuffersRef.current = [];

      processor.onaudioprocess = (e) => {
        const channel = e.inputBuffer.getChannelData(0);
        audioBuffersRef.current.push(new Float32Array(channel));

        // Calculate live RMS volume
        let sum = 0;
        for (let i = 0; i < channel.length; i++) {
          sum += channel[i] * channel[i];
        }
        const rms = Math.sqrt(sum / channel.length);
        if (rms > maxVolumeRef.current) {
          maxVolumeRef.current = rms;
        }
      };

      gainNode.connect(processor);
      processor.connect(audioContext.destination);

      setIsVoiceMode(true);
      setOutputText("🎙️ Listening... Speak your interview question now!\n\n(Mic is recording — click 'Voice' again when finished)");
      addLog('Recording live audio...');
    } catch (err) {
      addLog(`❌ Mic error: ${err.message}`);
      setOutputText(`Microphone error: ${err.message}. Please check microphone permissions.`);
      cleanupVoiceResources();
    }
  };

  const stopVoiceMode = async () => {
    setIsVoiceMode(false);
    setIsLoading(true);
    setOutputText("Transcribing & analyzing speech with AI...");

    const capturedBuffers = [...audioBuffersRef.current];
    const actualSampleRate = audioSampleRateRef.current || 16000;
    const maxVol = maxVolumeRef.current;
    addLog(`Stopped recording. Buffers: ${capturedBuffers.length}, Peak Vol: ${maxVol.toFixed(4)}`);
    cleanupVoiceResources();

    if (!capturedBuffers || capturedBuffers.length === 0 || maxVol < 0.001) {
      setIsLoading(false);
      addLog('⚠️ No audio/silence detected from microphone.');
      setOutputText("⚠️ No sound was detected from your microphone. Please check your Windows default input device or mic volume.");
      return;
    }

    // Merge Float32 PCM audio buffers
    let totalLen = 0;
    for (const b of capturedBuffers) totalLen += b.length;
    const mergedSamples = new Float32Array(totalLen);
    let offset = 0;
    for (const b of capturedBuffers) {
      mergedSamples.set(b, offset);
      offset += b.length;
    }

    // Direct clean encode to WAV without lossy JS resampling
    const wavArrayBuffer = encodeWAV(mergedSamples, actualSampleRate);

    // Convert ArrayBuffer to Base64 safely
    let binary = '';
    const bytes = new Uint8Array(wavArrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Wav = btoa(binary);
    addLog(`WAV Encoded: ${(base64Wav.length / 1024).toFixed(1)} KB`);

    const geminiKey = SYSTEM_DEFAULT_GEMINI_KEY;

    if (geminiKey) {
      const geminiModels = [
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-3.7-flash'
      ];

      let geminiSuccess = false;
      let geminiReply = '';
      let lastErr = null;

      for (const modelId of geminiModels) {
        try {
          addLog(`Calling Gemini (${modelId})...`);
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${geminiKey}`;

          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{
                  text: `You are an ultra-precise speech recognition and interview copilot.
STRICT VERBATIM RULES:
1. Transcribe ONLY the exact words spoken in the audio.
2. NEVER guess, NEVER hallucinate, and NEVER invent a question that was not spoken in the audio.
3. If no clear words were spoken or the audio is silence/noise, reply EXACTLY with:
NO_CLEAR_SPEECH
4. If words were spoken, provide the exact transcribed question followed by a direct 2-4 bullet point answer.

Format:
**Question:** [Verbatim transcribed question]

**Answer:**
• [Direct key point 1]
• [Direct key point 2]
• [Direct key point 3]`
                }]
              },
              contents: [{
                parts: [
                  { 
                    text: `Transcribe the question in this audio verbatim and provide the bullet answer.` 
                  },
                  {
                    inlineData: {
                      mimeType: 'audio/wav',
                      data: base64Wav
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500
              }
            })
          });

          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (response.ok && reply) {
            addLog(`✅ Gemini Success (${modelId})`);
            if (reply.includes('NO_CLEAR_SPEECH')) {
              addLog('Gemini reported: NO_CLEAR_SPEECH');
              setOutputText("⚠️ No clear speech heard. Please speak closer to your microphone or check volume, then click Voice again.");
              setIsLoading(false);
              return;
            }
            geminiReply = reply;
            geminiSuccess = true;
            break;
          } else {
            lastErr = data.error?.message || `HTTP ${response.status}`;
            addLog(`⚠️ Gemini ${modelId} error: ${lastErr}`);
          }
        } catch (err) {
          lastErr = err.message;
          addLog(`❌ Fetch error: ${err.message}`);
        }
      }

      if (geminiSuccess && geminiReply) {
        setOutputText(geminiReply);
        setInterviewCount(prev => prev + 1);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    addLog('Could not obtain reply from Gemini.');
    setOutputText("⚠️ Could not process speech. Please speak clearly into your mic and try clicking Voice again!");
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

        {/* Center: Discreet Timer / Status Badge */}
        {timeRemaining !== undefined && timeRemaining !== null && (
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-0.5 rounded-full text-xs" style={{ WebkitAppRegion: 'no-drag' }}>
            <Clock size={10} className={typeof timeRemaining === 'number' && timeRemaining < 10 ? "text-red-400 animate-pulse" : (timeRemaining === 'UNLIMITED' ? "text-amber-400" : "text-emerald-400")} />
            <span className={`text-[9px] font-extrabold font-mono uppercase ${typeof timeRemaining === 'number' && timeRemaining < 10 ? "text-red-400" : (timeRemaining === 'UNLIMITED' ? "text-amber-300 font-black" : "text-emerald-300")}`}>
              {timeRemaining === 'UNLIMITED' ? '👑 VIP' : `${timeRemaining}m`}
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

        {/* Minimal Window Controls */}
        <div className="flex space-x-1 items-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <button 
            onClick={() => {
              if (window.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('open-devtools');
              }
              setShowLogs(prev => !prev);
            }}
            className="text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Open Console / Live Logs"
          >
            <span>🐞 Logs</span>
          </button>
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
