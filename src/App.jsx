import React, { useState, useEffect, useRef } from 'react';
import { Settings, Copy, X, Minus, Sparkles, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import LandingPage from './LandingPage';


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

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [screenshotData, setScreenshotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // New State
  const [showSettings, setShowSettings] = useState(false);
  const [opacity, setOpacity] = useState(1.0);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [autoAsk, setAutoAsk] = useState(() => localStorage.getItem('auto_ask') === 'true');

  const [resumeText, setResumeText] = useState(() => localStorage.getItem('resume_text') || '');
  const [interviewCount, setInterviewCount] = useState(() => parseInt(localStorage.getItem('interview_count')) || 0);

  // Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Refs for Voice Capture
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const isVoiceModeRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Sync ref with states
  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (audioStreamRef.current) {
        try {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
    };
  }, []);

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

  // Handle hotkeys
  useEffect(() => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      
      const handleShortcut = (event, shortcut) => {
        if (shortcut === 'F1') {
          handleCapture('full');
        } else if (shortcut === 'F4') {
          handleCapture('region');
        } else if (shortcut === 'F3') {
          handleAskAI();
        }
      };

      ipcRenderer.on('shortcut-triggered', handleShortcut);
      return () => {
        ipcRenderer.removeListener('shortcut-triggered', handleShortcut);
      };
    }
  }, [screenshotData, inputText, apiKey, isLoading, opacity, alwaysOnTop, autoAsk]);

  const handleCapture = async (type = 'full') => {
    if (window.require) {
      let opacityRestored = false;
      const { ipcRenderer } = window.require('electron');
      try {
        const channel = type === 'region' ? 'start-region-capture' : 'capture-screen';
        
        // Hide window temporarily for region capture
        if (type === 'region') ipcRenderer.send('set-opacity', 0);
        
        const dataUrl = await ipcRenderer.invoke(channel);
        
        if (type === 'region') {
          ipcRenderer.send('set-opacity', parseFloat(opacity));
          opacityRestored = true;
        }

        if (dataUrl) {
          setScreenshotData(dataUrl);
          if (autoAsk) {
            setOutputText('Screen captured. Auto-asking AI...');
            handleAskAI(null, dataUrl);
          } else {
            setOutputText('Screen captured. Press Ask AI (F3) to analyze.');
          }
        } else {
          setOutputText('Failed to capture screen or cancelled.');
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
    if (!apiKey) {
      setOutputText('Please enter your Groq API Key in the settings.');
      return;
    }
    
    const textToSend = overrideText !== null ? overrideText : inputText;
    const imageToSend = overrideImage || screenshotData;

    if (!textToSend && !imageToSend) {
      setOutputText('Please provide either an image (Capture) or type a question.');
      return;
    }

    setIsLoading(true);
    setOutputText('Analyzing...');

    try {
      const url = `https://api.groq.com/openai/v1/chat/completions`;
      
      const content = [];
      let promptText = "You are an expert interview assistant helping a candidate in real-time. Provide clear, professional, and well-structured answers suitable for speaking in an interview. Use bullet points for readability. Keep it concise and to the point, avoiding unnecessary fluff, but ensure the answer is comprehensive enough to impress an interviewer.";
      
      if (resumeText) {
        promptText += `\n\nContext: The user's resume is provided below. Answer any questions keeping this resume in mind. Do not mention the resume unless directly relevant to the answer.\n\nResume:\n${resumeText}`;
      }
      
      if (textToSend) {
        promptText += `\n\nQuestion/Context from user: ${textToSend}`;
      }

      content.push({ type: 'text', text: promptText });

      if (imageToSend) {
        content.push({
          type: 'image_url',
          image_url: { url: imageToSend }
        });
      }

      // Initial list of models to try. We list the most stable active ones first.
      const modelsToTry = imageToSend ? [
        'llama-3.2-11b-vision-preview',
        'llama-3.2-90b-vision-preview',
        'qwen-2.5-vl-72b-instruct'
      ] : ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];

      // Attempt to fetch live model list from Groq to find active vision models
      if (imageToSend) {
         try {
           const modelsResponse = await fetch('https://api.groq.com/openai/v1/models', {
             method: 'GET',
             headers: { 'Authorization': `Bearer ${apiKey}` }
           });
           if (modelsResponse.ok) {
             const modelsData = await modelsResponse.json();
             if (modelsData && Array.isArray(modelsData.data)) {
                const fetchedVision = modelsData.data
                  .filter(m => m.id && (m.id.toLowerCase().includes('vision') || m.id.toLowerCase().includes('-vl')))
                  .map(m => m.id);
                if (fetchedVision.length > 0) {
                   const uniqueFetched = fetchedVision.filter(id => !modelsToTry.includes(id));
                   modelsToTry.unshift(...uniqueFetched);
                }
             }
           }
         } catch(e) {
           console.log('Standard fetch models error:', e);
           // Fallback to electron node https module
           if (window.require) {
             try {
               const https = window.require('https');
               const modelsData = await new Promise((resolve, reject) => {
                  const req = https.request({ hostname: 'api.groq.com', path: '/openai/v1/models', method: 'GET', headers: { 'Authorization': `Bearer ${apiKey}` } }, (res) => {
                    let body = ''; res.on('data', chunk => body += chunk); res.on('end', () => resolve(JSON.parse(body)));
                  });
                  req.on('error', e => reject(e)); req.end();
               });
               if (modelsData && Array.isArray(modelsData.data)) {
                  const fetchedVision = modelsData.data
                    .filter(m => m.id && (m.id.toLowerCase().includes('vision') || m.id.toLowerCase().includes('-vl')))
                    .map(m => m.id);
                  if (fetchedVision.length > 0) {
                     const uniqueFetched = fetchedVision.filter(id => !modelsToTry.includes(id));
                     modelsToTry.unshift(...uniqueFetched);
                  }
               }
             } catch(nodeErr) {
               console.log('Node fetch models error:', nodeErr);
             }
           }
         }
      }

      let response;
      let data;
      let success = false;
      let lastErr = null;

      console.log('Target models queue:', modelsToTry);

      for (const modelId of modelsToTry) {
        try {
          console.log(`Sending request using model: ${modelId}`);
          const requestBody = { model: modelId, messages: [{ role: 'user', content }] };
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify(requestBody)
          });
          data = await response.json();
          
          if (response.ok) {
             success = true;
             break;
          } else {
             lastErr = data.error?.message || 'Unknown API error';
             console.log(`Model ${modelId} returned error (status ${response.status}): ${lastErr}`);
             if (response.status === 401) {
                // Invalid Key - stop trying other models
                break;
             }
          }
        } catch (fetchErr) {
          lastErr = fetchErr.message;
          console.log(`Network or request failure for model ${modelId}: ${fetchErr.message}`);
        }
      }

      if (!success) {
        throw new Error(lastErr || 'Failed to fetch from Groq with all models');
      }

      const reply = data.choices?.[0]?.message?.content || 'No response generated.';
      setOutputText(reply);
      setInterviewCount(prev => prev + 1);
      
    } catch (err) {
      console.error('Groq error:', err);
      setOutputText(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText((prev) => prev + (prev ? '\n' : '') + text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setScreenshotData(null);
  };

  const cleanupVoiceResources = () => {
    console.log("Stopping voice recording and cleaning up streams...");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping MediaRecorder:", e);
      }
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.error("Error stopping tracks:", e);
      }
      audioStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsVoiceMode(false);
  };

  const startVoiceMode = async () => {
    console.log("Starting voice recording...");
    if (!apiKey) {
      setOutputText('Please enter your Groq API Key in settings.');
      return;
    }

    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      console.log("Microphone access granted. Creating MediaRecorder...");
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped. Transcribing...");
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsVoiceMode(true);
      setOutputText("Listening... Click again to Stop.");
      console.log("MediaRecorder started recording.");
    } catch (err) {
      console.error("Error starting microphone capture:", err);
      setOutputText(`Mic error: ${err.message}. Ensure mic is connected and permission is granted.`);
      cleanupVoiceResources();
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsLoading(true);
    setOutputText('Transcribing your voice...');
    console.log("Sending audio blob to Groq Whisper...");

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'speech.webm');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'json');

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to transcribe audio');
      }

      const data = await res.json();
      const transcriptText = data.text?.trim();
      console.log("Whisper transcription result:", transcriptText);

      if (transcriptText) {
        setInputText(transcriptText);
        if (autoAsk) {
          setOutputText(`You: "${transcriptText}"\n\nAI is thinking...`);
          await handleAskAI(transcriptText);
        } else {
          setOutputText(`Voice Captured: "${transcriptText}"\n\nPress Ask (F3) to submit.`);
        }
      } else {
        setOutputText('No speech detected.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setOutputText(`Voice transcription failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListen = () => {
    console.log("Voice button clicked");
    if (isVoiceMode) {
      cleanupVoiceResources();
    } else {
      startVoiceMode();
    }
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

  if (!isDesktop) {
    return <LandingPage />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#070b19]/80 backdrop-blur-3xl text-gray-100 p-4 font-sans select-none relative overflow-hidden rounded-2xl border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
      
      {/* Background Decorative Glows */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="bg-[#0f1424]/95 p-6 rounded-2xl border border-emerald-500/20 w-96 max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.5)] relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSettings(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all border border-white/5"
            >
              <X size={16} />
            </button>
            <h2 className="text-xl font-bold mb-6 text-white bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
              <Settings className="animate-spin-slow text-emerald-400" size={20} />
              Preferences
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1.5 uppercase tracking-wider">Groq API Key</label>
                <input 
                  type="password"
                  className="w-full px-4 py-2.5 bg-black/40 text-sm border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white placeholder-gray-600 transition-colors shadow-inner"
                  placeholder="gsk_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1.5 uppercase tracking-wider">Context / Resume</label>
                <textarea 
                  className="w-full h-28 px-4 py-2.5 bg-black/40 text-sm border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-gray-300 resize-none transition-colors shadow-inner"
                  placeholder="Paste context or resume to tailor answers..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-between bg-black/35 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-gray-300 font-medium">Always On Top</span>
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

              <div className="flex items-center justify-between bg-black/35 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-gray-300 font-medium">Auto Ask AI</span>
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

              <div className="bg-black/35 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between text-sm text-gray-300 mb-2 font-medium">
                  <span>Window Opacity</span>
                  <span className="text-emerald-400 font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.6" max="1.0" step="0.05"
                  className="w-full accent-emerald-500 cursor-pointer bg-gray-700 h-1.5 rounded-lg appearance-none"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                />
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-sm font-semibold transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-3 pb-3 border-b border-white/5 cursor-default" style={{ WebkitAppRegion: 'drag' }}>
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles size={16} className="text-emerald-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(16,185,129,0.2)] tracking-tight">
              Anazk v2.0
            </h1>
          </div>
          <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ml-1 animate-pulse">
            Live
          </span>
        </div>
        <div className="flex space-x-1.5 items-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <span className="text-[9px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 shadow-inner font-medium">
            Sessions: {interviewCount}
          </span>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all p-1.5 rounded-lg"
            title="Settings"
          >
            <Settings size={14} />
          </button>
          <button 
            onClick={handleMinimize}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all p-1.5 rounded-lg"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all p-1.5 rounded-lg"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-3 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' }}>
        
        {/* Input Area */}
        <div className="flex flex-col h-1/4 bg-white/5 hover:bg-white/[0.07] rounded-xl p-2 border border-white/10 focus-within:border-emerald-500/30 transition-all relative group/input">
          {screenshotData && (
            <div className="absolute top-2 right-2 border border-emerald-500/25 rounded-lg overflow-hidden h-16 w-auto shadow-lg z-10 group/thumb transition-all duration-300 hover:scale-105 bg-black">
              <img src={screenshotData} alt="Captured" className="h-full object-contain" />
              <button 
                onClick={() => setScreenshotData(null)}
                className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white text-[10px] p-1 rounded-bl transition-all opacity-0 group-hover/thumb:opacity-100"
              >
                <X size={10} />
              </button>
            </div>
          )}

          <textarea
            className="flex-1 w-full p-2 bg-transparent resize-none outline-none text-xs text-gray-200 placeholder-gray-500 no-scrollbar font-medium leading-relaxed"
            placeholder="Type your question or paste screen context..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {/* Output Area */}
        <div className="flex flex-col h-3/4 bg-white/5 rounded-xl border border-white/10 overflow-hidden relative shadow-inner">
          {/* Top Bar of Output */}
          <div className="bg-black/45 border-b border-white/5 p-2 flex justify-between items-center backdrop-blur-md">
            <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold pl-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Assistant Response
            </span>
            {outputText && (
              <button 
                onClick={handleCopy}
                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-medium"
                title="Copy Response"
              >
                <Copy size={12} />
                Copy
              </button>
            )}
          </div>

          {isLoading && (
            <div className="w-full h-[2px] bg-white/5 overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-loading-bar rounded-full"></div>
            </div>
          )}
          
          <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
            {outputText && !outputText.startsWith('Screen captured') && !outputText.startsWith('Analyzing...') && !outputText.startsWith('Error') && !outputText.startsWith('Please') ? (
              <div className="text-xs text-gray-300 select-text prose prose-invert max-w-none font-medium leading-relaxed">
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          {...props}
                          children={String(children).replace(/\n$/, '')}
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg my-3 text-[11px] border border-white/5 font-mono shadow-md"
                        />
                      ) : (
                        <code {...props} className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-mono text-[10px] border border-emerald-500/20 font-semibold">
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {outputText}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 text-xs font-semibold tracking-wide italic">
                {outputText || 'Awaiting input...'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-3.5 flex flex-wrap gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <button 
          onClick={() => handleCapture('full')}
          className="flex-1 min-w-[70px] bg-white/5 hover:bg-white/10 hover:border-white/10 text-gray-300 py-2 px-2.5 rounded-xl text-[10px] font-bold transition-all border border-white/5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          Screen (F1)
        </button>
        <button 
          onClick={() => handleCapture('region')}
          className="flex-1 min-w-[70px] bg-white/5 hover:bg-white/10 hover:border-white/10 text-gray-300 py-2 px-2.5 rounded-xl text-[10px] font-bold transition-all border border-white/5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          Region (F4)
        </button>
        <button 
          onClick={handleListen}
          className={`flex-1 min-w-[90px] flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold transition-all border shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
            isVoiceMode 
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5'
          }`}
        >
          {isVoiceMode ? <MicOff size={12} className="animate-bounce" /> : <Mic size={12} />}
          <span>{isVoiceMode ? 'Listening...' : 'Voice'}</span>
        </button>
        <button 
          onClick={() => handleAskAI()}
          disabled={isLoading}
          className={`flex-1 min-w-[70px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-2 px-2.5 rounded-xl text-[10px] font-extrabold transition-all shadow-[0_4px_15px_rgba(16,185,129,0.25)] border border-emerald-500/30 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] active:scale-[0.97]'}`}
        >
          Ask (F3)
        </button>
        <button 
          onClick={handlePaste}
          className="flex-1 min-w-[70px] bg-white/5 hover:bg-white/10 hover:border-white/10 text-gray-300 py-2 px-2.5 rounded-xl text-[10px] font-bold transition-all border border-white/5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          Paste
        </button>
        <button 
          onClick={handleClear}
          className="flex-1 min-w-[70px] bg-white/5 hover:bg-white/10 hover:border-white/10 text-gray-300 py-2 px-2.5 rounded-xl text-[10px] font-bold transition-all border border-white/5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          Clear
        </button>
      </div>

      {/* Footer */}
      <div className="mt-3 text-center w-full">
        <p className="text-[8px] text-gray-600/80 tracking-widest uppercase font-semibold">
          developed by prince yadav
        </p>
      </div>
    </div>
  );
}

export default App;
