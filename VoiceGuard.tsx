import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Activity, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GeminiModel } from '../types';
import { SYSTEM_INSTRUCTION_VOICE } from '../constants';

const VoiceGuard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialization cleanup
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
  };

  const connect = async () => {
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      // Setup Audio Contexts
      // Fix: Cast window to any to access webkitAudioContext which is not on standard Window interface
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: GeminiModel.LIVE,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_VOICE,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            
            // Process Microphone Input
            const ctx = inputAudioContextRef.current!;
            const source = ctx.createMediaStreamSource(stream);
            const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(ctx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
               setIsSpeaking(true);
               await playAudio(base64Audio, outputAudioContextRef.current);
            }
            
            if (msg.serverContent?.turnComplete) {
                setIsSpeaking(false);
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsSpeaking(false);
          },
          onerror: (e) => {
            console.error("Live API Error", e);
            setError("Connection failed. Please check permissions and try again.");
            disconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setError("Failed to access microphone or connect to AI.");
    }
  };

  const playAudio = async (base64: string, ctx: AudioContext) => {
    const audioBuffer = await decodeAudioData(base64, ctx);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    // Schedule playback
    const currentTime = ctx.currentTime;
    // Ensure we don't schedule in the past
    const start = Math.max(currentTime, nextStartTimeRef.current);
    source.start(start);
    
    nextStartTimeRef.current = start + audioBuffer.duration;
    
    sourcesRef.current.add(source);
    source.onended = () => {
        sourcesRef.current.delete(source);
        if (sourcesRef.current.size === 0) {
            setIsSpeaking(false);
        }
    };
  };

  // --- Audio Helpers ---
  const createPcmBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Clamp values to [-1, 1] then convert to PCM16
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const u8 = new Uint8Array(int16.buffer);
    let binary = '';
    const len = u8.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i]);
    const b64 = btoa(binary);

    return {
      mimeType: "audio/pcm;rate=16000",
      data: b64
    };
  };

  const decodeAudioData = async (base64: string, ctx: AudioContext) => {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    
    // PCM 16bit Little Endian decoding
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for(let i=0; i<int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    return buffer;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto space-y-8 animate-fade-in text-center py-10">
      <div className="space-y-3">
        <h2 className="text-4xl font-bold text-white drop-shadow-md">FraudGuard Live</h2>
        <p className="text-slate-300 font-medium">Speak naturally to verify transactions or report theft.</p>
      </div>

      <div className="relative group">
        <div className={`w-56 h-56 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-md border border-white/10 ${
          isConnected 
            ? isSpeaking 
               ? 'bg-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.4)] scale-105 border-emerald-500/30' 
               : 'bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.1)]'
            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]'
        }`}>
          {isConnected ? (
             <Activity className={`w-24 h-24 text-emerald-400 drop-shadow-md ${isSpeaking ? 'animate-pulse' : ''}`} />
          ) : (
             <MicOff className="w-20 h-20 text-slate-500 group-hover:text-slate-400 transition-colors" />
          )}
        </div>
        
        {/* Visualizer Ring Effect */}
        {isConnected && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping opacity-50"></div>
        )}
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 w-full shadow-2xl">
         <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</span>
            <span className={`text-sm font-semibold flex items-center gap-2 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                {isConnected ? 'Secure Connection Active' : 'Offline'}
            </span>
         </div>
         
         {!isConnected ? (
            <button 
                onClick={connect}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
            >
                <Mic size={22} />
                Start Verification
            </button>
         ) : (
            <button 
                onClick={disconnect}
                className="w-full bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm text-red-400 border border-red-500/20 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-red-500/10"
            >
                <MicOff size={22} />
                End Session
            </button>
         )}
      </div>

      {error && (
        <div className="text-red-300 bg-red-500/20 backdrop-blur-md p-4 rounded-xl text-sm max-w-md border border-red-500/30 shadow-lg">
          {error}
        </div>
      )}

      {isConnected && (
          <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
             <Volume2 size={16} />
             <span>Speaker Active</span>
          </div>
      )}
    </div>
  );
};

export default VoiceGuard;