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
  const [streamStatus, setStreamStatus] = useState('');
  
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
    setStreamStatus('⚡ Processing...');
    setOutputText('');

    const promptText = `Direct live interview copilot. Answer in 2-3 punchy bullet points designed to be spoken. Bold key terms. If coding, give optimal code only with Time/Space complexity.

[Question / Context]:
${textToSend || 'Analyze the provided screen capture and provide the direct interview answer.'}`;

    let success = false;
    let accumulatedReply = '';
    let lastErr = null;
    const startTime = Date.now();

    // 1. PRIMARY: GOOGLE GEMINI OFFICIAL STREAMING ENGINE (UNLIMITED)
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
          const geminiStreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${geminiKey}`;
          const contentParts = [{ text: promptText }];
          if (imageBase64) {
            contentParts.push({
              inlineData: {
                mimeType: imageMime,
                data: imageBase64
              }
            });
          }

          const response = await fetch(geminiStreamUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              contents: [{ parts: contentParts }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500
              }
            })
          });

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
                          setStreamStatus(`⚡ Streaming (${latency}s)`);
                        }
                        accumulatedReply += chunk;
                        setOutputText(accumulatedReply);
                      }
                    } catch (e) {}
                  }
                }
              }
            }

            if (accumulatedReply) {
              const totalSec = ((Date.now() - startTime) / 1000).toFixed(2);
              setStreamStatus(`⚡ ${totalSec}s`);
              setInterviewCount(prev => prev + 1);
              success = true;
              break;
            }
          } else {
            lastErr = `HTTP ${response.status}`;
          }
        } catch (err) {
          lastErr = err.message;
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

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [liveVolume, setLiveVolume] = useState(0); 
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [silenceWarning, setSilenceWarning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const maxVolumeRef = useRef(0);
  const silenceStartTimeRef = useRef(null);
  const audioSampleRateRef = useRef(16000);
  const outputScrollRef = useRef(null);

  const loadAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter(d => d.kind === 'audioinput');
      setAvailableDevices(inputs);
      console.log('[AudioDevices] Available input devices:', inputs);
      addLog(`Found ${inputs.length} audio input device(s):`);
      inputs.forEach((d, i) => {
        addLog(`  ${i + 1}. ${d.label || 'Microphone (Standard)'} [ID: ${d.deviceId.slice(0, 8)}...]`);
      });
    } catch (err) {
      console.warn('Error enumerating devices:', err);
    }
  };

  useEffect(() => {
    loadAudioDevices();
  }, []);

  const cleanupVoiceResources = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    } catch (e) {}

    try {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.warn('Voice cleanup notice:', e);
    }
    setLiveVolume(0);
    setSilenceWarning(false);
    setIsVoiceMode(false);
    setIsTestingMic(false);
  };

  const attachVolumeMeter = (stream, audioContext) => {
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    silenceStartTimeRef.current = Date.now();

    const checkVolume = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedVol = Math.min(100, Math.round((avg / 128) * 100));
      setLiveVolume(normalizedVol);

      if (normalizedVol > maxVolumeRef.current) {
        maxVolumeRef.current = normalizedVol;
      }

      if (normalizedVol > 2) {
        silenceStartTimeRef.current = Date.now();
        setSilenceWarning(false);
      } else {
        if (silenceStartTimeRef.current && (Date.now() - silenceStartTimeRef.current > 2000)) {
          setSilenceWarning(true);
        }
      }

      animFrameRef.current = requestAnimationFrame(checkVolume);
    };

    animFrameRef.current = requestAnimationFrame(checkVolume);
  };

  const toggleTestMic = async () => {
    if (isTestingMic) {
      cleanupVoiceResources();
      addLog('Test Microphone stopped.');
      return;
    }

    try {
      cleanupVoiceResources();
      addLog('🎙️ Starting Test Microphone...');
      await loadAudioDevices();

      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true
      };
      if (selectedDeviceId) {
        audioConstraints.deviceId = { exact: selectedDeviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      attachVolumeMeter(stream, audioContext);
      setIsTestingMic(true);
      addLog('Test Microphone active. Speak to verify live meter!');
    } catch (err) {
      addLog(`❌ Test Mic error: ${err.message}`);
      cleanupVoiceResources();
    }
  };

  const startVoiceMode = async () => {
    try {
      cleanupVoiceResources();
      maxVolumeRef.current = 0;
      setRecordingSeconds(0);
      setSilenceWarning(false);
      addLog('🎙️ Requesting microphone stream...');

      await loadAudioDevices();

      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true
      };
      if (selectedDeviceId) {
        audioConstraints.deviceId = { exact: selectedDeviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      audioStreamRef.current = stream;
      addLog(`Mic acquired (${stream.getAudioTracks()[0]?.label || 'Default'}).`);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      audioSampleRateRef.current = audioContext.sampleRate;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      attachVolumeMeter(stream, audioContext);

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg');

      const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(250); 

      let sec = 0;
      recordingTimerRef.current = setInterval(() => {
        sec++;
        setRecordingSeconds(sec);
        if (sec >= 120) {
          stopVoiceMode();
        }
      }, 1000);

      setIsVoiceMode(true);
      setOutputText("🎙️ Listening... Speak your interview question now!\n\n(Click 'Voice' again when finished)");
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
    setStreamStatus('⚡ Processing audio...');
    setOutputText('');

    const maxVol = maxVolumeRef.current;
    const duration = recordingSeconds;
    addLog(`Stopped recording (${duration}s). Peak Vol: ${maxVol}%`);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const getAudioBlob = () => {
      return new Promise((resolve) => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
          resolve(new Blob(recordedChunksRef.current, { type: 'audio/webm' }));
          return;
        }
        mediaRecorderRef.current.onstop = () => {
          resolve(new Blob(recordedChunksRef.current, { type: 'audio/webm' }));
        };
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          resolve(new Blob(recordedChunksRef.current, { type: 'audio/webm' }));
        }
      });
    };

    const audioBlob = await getAudioBlob();
    cleanupVoiceResources();

    if (!audioBlob || audioBlob.size === 0) {
      setIsLoading(false);
      setStreamStatus('');
      addLog('⚠️ No audio recorded.');
      setOutputText("⚠️ No sound captured. Please check your microphone and click Voice again.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      const mimeType = audioBlob.type || 'audio/webm';
      addLog(`Audio ready: ${(base64Audio.length / 1024).toFixed(1)} KB (${mimeType})`);

      const geminiKey = SYSTEM_DEFAULT_GEMINI_KEY;
      const startTime = Date.now();

      if (geminiKey) {
        const geminiModels = [
          'gemini-flash-latest',
          'gemini-3.5-flash',
          'gemini-3.7-flash'
        ];

        let geminiSuccess = false;
        let accumulatedText = '';
        let lastErr = null;

        for (const modelId of geminiModels) {
          try {
            addLog(`⚡ Streaming Gemini (${modelId})...`);
            const geminiStreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${geminiKey}`;

            const response = await fetch(geminiStreamUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{
                    text: `Direct interview copilot. Transcribe the audio question verbatim and give 2-3 short, spoken bullet points with bold key terms.`
                  }]
                },
                contents: [{
                  parts: [
                    { 
                      text: `Transcribe question from audio verbatim and provide immediate spoken bullet points.` 
                    },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
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

            if (response.ok && response.body) {
              const streamReader = response.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              let firstTokenTime = null;

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
                          if (!firstTokenTime) {
                            firstTokenTime = Date.now();
                            const latency = ((firstTokenTime - startTime) / 1000).toFixed(2);
                            setStreamStatus(`⚡ First word in ${latency}s (Streaming...)`);
                          }
                          accumulatedText += chunkText;
                          setOutputText(accumulatedText);
                        }
                      } catch (e) {}
                    }
                  }
                }
              }

              if (accumulatedText) {
                const totalSec = ((Date.now() - startTime) / 1000).toFixed(2);
                setStreamStatus(`⚡ ${totalSec}s total`);
                addLog(`✅ Streamed full reply in ${totalSec}s`);
                setInterviewCount(prev => prev + 1);
                geminiSuccess = true;
                break;
              }
            } else {
              lastErr = `HTTP ${response.status}`;
              addLog(`⚠️ Gemini ${modelId} error: ${lastErr}`);
            }
          } catch (err) {
            lastErr = err.message;
            addLog(`❌ Fetch error: ${err.message}`);
          }
        }

        if (geminiSuccess && accumulatedText) {
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
      setStreamStatus('');
      addLog('Could not obtain reply from Gemini.');
      setOutputText("⚠️ Could not process speech. Please speak clearly into your mic and try clicking Voice again!");
    };
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
              <span className="font-bold text-red-400">🎙️ Recording Spoken Question...</span>
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

          {/* 2-Second Silence Warning */}
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
          <span>{isVoiceMode ? 'Listening...' : 'Voice'}</span>
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
