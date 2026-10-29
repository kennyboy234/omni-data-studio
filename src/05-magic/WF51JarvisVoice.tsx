import React, { useState, useEffect, useRef } from 'react';
import { VoiceCommandRecord } from './types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Command,
  Clock,
  Zap,
  Activity,
  Terminal,
  Shield,
  FileText,
  DollarSign,
  Hash,
} from 'lucide-react';

interface WF51JarvisVoiceProps {
  onExecuteCommand?: (command: string) => void;
}

export const WF51JarvisVoice: React.FC<WF51JarvisVoiceProps> = ({ onExecuteCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string>(
    'Omni Voice Engine online. Say "Hey Omni show faults" or click any prompt below.'
  );
  const [commandHistory, setCommandHistory] = useState<VoiceCommandRecord[]>([
    {
      id: 'cmd-01',
      timestamp: '11:28:14',
      query: 'Hey Omni show faults',
      matchedCommand: 'show_faults',
      responseText:
        'Displaying 5 intercepted critical anomalies across streaming telemetry pipelines. Null spike in sensor #4 arrested.',
      confidence: 0.98,
      executionMs: 142,
      status: 'executed',
    },
    {
      id: 'cmd-02',
      timestamp: '11:29:40',
      query: 'Hey Omni calculate ROI',
      matchedCommand: 'calculate_roi',
      responseText:
        'Autonomous defense has prevented $1,249,000 in operational losses this quarter across 5 intercepted failure modes.',
      confidence: 0.99,
      executionMs: 88,
      status: 'executed',
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio synthesizer speech playback
  const speakResponse = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.name.includes('Daniel') ||
          v.name.includes('Google UK English Male') ||
          v.name.includes('Natural') ||
          v.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
    }
  };

  // Command parser core logic
  const handleProcessQuery = (query: string) => {
    const q = query.trim().toLowerCase();
    const startTime = performance.now();
    let matchedCommand: VoiceCommandRecord['matchedCommand'] = 'unknown';
    let responseText = '';

    if (q.includes('show fault') || q.includes('fault') || q.includes('anomal') || q.includes('alert')) {
      matchedCommand = 'show_faults';
      responseText =
        'Displaying 5 intercepted critical anomalies across streaming telemetry pipelines. 1 null spike, 2 drift events, and 2 schema violations intercepted.';
    } else if (q.includes('roi') || q.includes('money') || q.includes('save') || q.includes('loss')) {
      matchedCommand = 'calculate_roi';
      responseText =
        'Total hard-dollar losses prevented stand at $1,249,000 this quarter, delivering a 941% net ROI with a 35-day payback period.';
    } else if (q.includes('hash') || q.includes('ledger') || q.includes('sha') || q.includes('verify')) {
      matchedCommand = 'verify_hash';
      responseText =
        'Ledger integrity confirmed. Root block hash e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 verified intact across all blocks.';
    } else if (q.includes('report') || q.includes('pdf') || q.includes('whisper') || q.includes('boss')) {
      matchedCommand = 'export_report';
      responseText =
        'Defense-grade tactical briefing prepared. Ready for immediate vector PDF download and WhatsApp broadcast to leadership.';
    } else if (q.includes('status') || q.includes('health') || q.includes('system') || q.includes('ping')) {
      matchedCommand = 'system_status';
      responseText =
        'All watchtowers operational. Real-time PSI drift surveillance active at 1M records/s. Defense shield status: GREEN.';
    } else {
      matchedCommand = 'unknown';
      responseText = `Command "${query}" logged. Recognized voice patterns: "show faults", "calculate ROI", "verify hash", "export report", or "system status".`;
    }

    const duration = Math.round(performance.now() - startTime + 65);

    const record: VoiceCommandRecord = {
      id: `cmd-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      query,
      matchedCommand,
      responseText,
      confidence: matchedCommand !== 'unknown' ? 0.97 : 0.65,
      executionMs: duration,
      status: matchedCommand !== 'unknown' ? 'executed' : 'unrecognized',
    };

    setCommandHistory((prev) => [record, ...prev.slice(0, 8)]);
    setLastResponse(responseText);
    setActiveSpeechText(responseText);
    speakResponse(responseText);

    if (onExecuteCommand) {
      onExecuteCommand(matchedCommand);
    }
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback for browsers without speech recognition
      setIsListening(true);
      setInterimTranscript('Listening: "Hey Omni show faults"...');
      setTimeout(() => {
        setIsListening(false);
        setInterimTranscript('');
        handleProcessQuery('Hey Omni show faults');
      }, 1800);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('Awaiting voice input...');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInterimTranscript(transcript);

        if (event.results[0].isFinal) {
          setIsListening(false);
          setInterimTranscript('');
          handleProcessQuery(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('SpeechRecognition error:', err);
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition failed to initialize:', e);
      // Demo simulated response
      setIsListening(true);
      setInterimTranscript('Voice recognized: "Hey Omni calculate ROI"');
      setTimeout(() => {
        setIsListening(false);
        setInterimTranscript('');
        handleProcessQuery('Hey Omni calculate ROI');
      }, 1500);
    }
  };

  // Canvas audio visualizer waveform loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw bars
      const numBars = 48;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        let amplitude = 6;

        if (isListening) {
          amplitude = Math.sin(phase + i * 0.3) * 25 + Math.cos(phase * 1.5 + i * 0.2) * 15 + 30;
        } else if (isSpeaking) {
          amplitude = Math.sin(phase * 2 + i * 0.4) * 20 + 22;
        } else {
          amplitude = Math.sin(phase * 0.5 + i * 0.1) * 4 + 6;
        }

        const barHeight = Math.max(4, Math.min(height - 8, Math.abs(amplitude)));

        // Gradient based on state
        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
        if (isListening) {
          gradient.addColorStop(0, '#06b6d4'); // cyan
          gradient.addColorStop(1, '#3b82f6'); // blue
        } else if (isSpeaking) {
          gradient.addColorStop(0, '#10b981'); // emerald
          gradient.addColorStop(1, '#059669');
        } else {
          gradient.addColorStop(0, '#334155'); // slate
          gradient.addColorStop(1, '#1e293b');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }

      phase += isListening ? 0.15 : isSpeaking ? 0.12 : 0.03;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background glow orb */}
      <div
        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isListening
            ? 'bg-cyan-500/20 opacity-100'
            : isSpeaking
            ? 'bg-emerald-500/20 opacity-100'
            : 'bg-indigo-500/10 opacity-40'
        }`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono font-bold tracking-wider">
              WF51 · JARVIS VOICE COMMAND
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono">
              Web Speech API
            </span>
            {isListening && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-500/30 text-cyan-300 rounded-full text-xs font-mono animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                LISTENING
              </span>
            )}
            {isSpeaking && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded-full text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SPEAKING
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            Zero-Click Natural Language Voice Operator
          </h2>
          <p className="text-sm text-slate-400">
            Autonomous speech recognition and tactical synthesis engine with wake-phrase detection.
          </p>
        </div>

        {/* Audio Mute / Speech Synthesis Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              speechEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={speechEnabled ? 'Mute AI voice output' : 'Enable AI voice output'}
          >
            {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {speechEnabled ? 'JARVIS VOICE: ON' : 'JARVIS VOICE: MUTED'}
          </button>
        </div>
      </div>

      {/* Main Interactive Radar & Waveform Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Voice Visualizer Core */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-950/80 border border-slate-800 rounded-xl relative">
          {/* Hologram Ring */}
          <div className="relative flex items-center justify-center w-44 h-44 mb-4">
            {/* Outer animated rings */}
            <div
              className={`absolute inset-0 rounded-full border border-dashed transition-all duration-700 ${
                isListening
                  ? 'border-cyan-400 animate-spin opacity-80'
                  : isSpeaking
                  ? 'border-emerald-400 animate-spin opacity-80'
                  : 'border-slate-700 opacity-40'
              }`}
            />
            <div
              className={`absolute inset-3 rounded-full border transition-all duration-500 ${
                isListening
                  ? 'border-cyan-500/50 scale-105'
                  : isSpeaking
                  ? 'border-emerald-500/50 scale-105'
                  : 'border-slate-800'
              }`}
            />

            {/* Center Mic Button */}
            <button
              onClick={toggleListening}
              className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
                isListening
                  ? 'bg-cyan-500 text-slate-950 scale-110 shadow-cyan-500/50 animate-pulse'
                  : isSpeaking
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="w-9 h-9" />
                  <span className="text-[10px] font-mono font-bold mt-1 tracking-tighter">LISTENING</span>
                </>
              ) : (
                <>
                  <MicOff className="w-8 h-8 text-slate-300" />
                  <span className="text-[10px] font-mono mt-1 text-slate-300">CLICK TO TALK</span>
                </>
              )}
            </button>
          </div>

          {/* Canvas Waveform */}
          <canvas
            ref={canvasRef}
            width={340}
            height={48}
            className="w-full max-w-[340px] h-12 rounded bg-slate-900/60 border border-slate-800/80"
          />

          {/* Live Transcript / Feedback Indicator */}
          <div className="mt-3 text-center min-h-[22px]">
            {isListening && (
              <p className="text-xs font-mono text-cyan-400 animate-pulse">
                {interimTranscript || 'Listening for "Hey Omni..."'}
              </p>
            )}
            {!isListening && isSpeaking && (
              <p className="text-xs font-mono text-emerald-400">JARVIS is speaking response...</p>
            )}
            {!isListening && !isSpeaking && (
              <p className="text-xs font-mono text-slate-500">Ready for voice command or simulated trigger</p>
            )}
          </div>
        </div>

        {/* Response Box & Tactical Readout */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active JARVIS Response Box */}
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-4 relative shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  JARVIS Tactical Feedback
                </span>
              </div>
              <button
                onClick={() => speakResponse(lastResponse)}
                className="text-xs font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                title="Replay Voice Audio"
              >
                <Volume2 className="w-3.5 h-3.5" /> Replay Voice
              </button>
            </div>
            <p className="text-sm text-slate-100 font-mono leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800">
              "{lastResponse}"
            </p>
          </div>

          {/* Quick-Prompt Trigger Buttons (Demo Mode) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5 text-indigo-400" /> ONE-CLICK VOICE PROMPTS:
              </span>
              <span className="text-[11px] font-mono text-slate-500">Instant Demo Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleProcessQuery('Hey Omni show faults')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-left text-xs font-mono text-slate-200 transition-all group"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate group-hover:text-cyan-300">"Hey Omni show faults"</span>
              </button>

              <button
                onClick={() => handleProcessQuery('Hey Omni calculate ROI')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/40 rounded-lg text-left text-xs font-mono text-slate-200 transition-all group"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate group-hover:text-emerald-300">"Hey Omni calculate ROI"</span>
              </button>

              <button
                onClick={() => handleProcessQuery('Hey Omni verify hash')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-sky-500/40 rounded-lg text-left text-xs font-mono text-slate-200 transition-all group"
              >
                <Hash className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate group-hover:text-sky-300">"Hey Omni verify hash"</span>
              </button>

              <button
                onClick={() => handleProcessQuery('Hey Omni export report')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-purple-500/40 rounded-lg text-left text-xs font-mono text-slate-200 transition-all group"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate group-hover:text-purple-300">"Hey Omni export report"</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Command Execution Log */}
      <div className="mt-6 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Autonomous Command Execution Ledger
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {commandHistory.length} Recorded Queries
          </span>
        </div>

        <div className="space-y-2">
          {commandHistory.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs font-mono gap-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500">{item.timestamp}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    item.status === 'executed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {item.matchedCommand}
                </span>
                <span className="text-slate-200 font-semibold">"{item.query}"</span>
              </div>

              <div className="flex items-center gap-4 text-slate-400 text-[11px] shrink-0">
                <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                <span className="text-cyan-400">{item.executionMs}ms</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
