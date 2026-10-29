import React, { useState, useEffect, useRef } from 'react';
import { MatrixRainConfig } from './types';
import {
  Code2,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface WF52MatrixRainProps {
  embeddedHeight?: number;
  initialFullscreen?: boolean;
  onFinishedLoading?: () => void;
}

export const WF52MatrixRain: React.FC<WF52MatrixRainProps> = ({
  embeddedHeight = 360,
  initialFullscreen = false,
  onFinishedLoading,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [isFullscreenModal, setIsFullscreenModal] = useState(initialFullscreen);
  const [loadingProgress, setLoadingProgress] = useState(42);
  const [audioHumEnabled, setAudioHumEnabled] = useState(false);

  const [config, setConfig] = useState<MatrixRainConfig>({
    speed: 1.2,
    density: 1.0,
    fontSize: 16,
    colorScheme: 'matrix_green',
    showTelemetryOverlay: true,
    audioFeedback: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dropsRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const onFinishedCalledRef = useRef(false);

  const PIPELINE_TASKS = [
    'INGESTING 1,000,000 TELEMETRY SAMPLES/SEC',
    'EXECUTING ZERO-COPY APACHE ARROW BUFFER SCAN',
    'COMPUTING POPULATION STABILITY INDEX (PSI = 0.041)',
    'EVALUATING PEARL CAUSAL DAG INTERVENTION DO(X=x)',
    'CRYPTO SIGNING ROOT MERKLE BLOCK (SHA-256 LEDGER)',
    'CALCULATING HARD-DOLLAR NET PREVENTED VALUE',
  ];

  const currentTaskIndex = Math.min(
    PIPELINE_TASKS.length - 1,
    Math.floor((loadingProgress / 100) * PIPELINE_TASKS.length)
  );

  // Character set: Katakana + Hex + Latin + Digits
  const CHARACTERS =
    'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF0123456789<>[]{}+=*&%$#@!';

  // Safely trigger onFinishedLoading callback when progress hits 100%
  useEffect(() => {
    if (loadingProgress < 100) {
      onFinishedCalledRef.current = false;
    } else if (onFinishedLoading && !onFinishedCalledRef.current) {
      onFinishedCalledRef.current = true;
      const timer = setTimeout(() => {
        onFinishedLoading();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loadingProgress, onFinishedLoading]);

  // Web Audio synthesizer for matrix sci-fi background hum
  const toggleAudioHum = () => {
    if (audioHumEnabled) {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      setAudioHumEnabled(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, ctx.currentTime); // Low 55Hz drone

      gain.gain.setValueAtTime(0.015, ctx.currentTime); // very low volume subtle ambient
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      audioContextRef.current = ctx;
      oscillatorRef.current = osc;
      setAudioHumEnabled(true);
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (_) {}
      }
    };
  }, []);

  // Simulated loading progress ticker (pure state updater without side effects)
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + Math.floor(Math.random() * 8) + 3);
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Main Canvas Rendering Engine
  useEffect(() => {
    const targetCanvas = isFullscreenModal ? fullscreenCanvasRef.current : canvasRef.current;
    if (!targetCanvas) return;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    let width = (targetCanvas.width = targetCanvas.parentElement?.clientWidth || 800);
    let height = (targetCanvas.height = isFullscreenModal
      ? window.innerHeight
      : embeddedHeight);

    const handleResize = () => {
      if (!targetCanvas) return;
      width = targetCanvas.width = targetCanvas.parentElement?.clientWidth || 800;
      height = targetCanvas.height = isFullscreenModal
        ? window.innerHeight
        : embeddedHeight;
      initDrops();
    };

    window.addEventListener('resize', handleResize);

    const initDrops = () => {
      const columns = Math.floor(width / config.fontSize);
      dropsRef.current = [];
      for (let i = 0; i < columns; i++) {
        dropsRef.current[i] = Math.floor(Math.random() * -50); // Stagger entry
      }
    };

    initDrops();

    const getColors = () => {
      switch (config.colorScheme) {
        case 'ghost_cyan':
          return { head: '#FFFFFF', trail: '#06b6d4', dim: '#083344' };
        case 'anduril_amber':
          return { head: '#FFFBEB', trail: '#f59e0b', dim: '#451a03' };
        case 'red_alert':
          return { head: '#FFFFFF', trail: '#ef4444', dim: '#450a0a' };
        case 'matrix_green':
        default:
          return { head: '#FFFFFF', trail: '#10b981', dim: '#064e3b' };
      }
    };

    let lastTime = performance.now();
    const fpsInterval = 1000 / (28 * config.speed);

    const render = (time: number) => {
      if (!isRunning) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = time - lastTime;
      if (elapsed > fpsInterval) {
        lastTime = time - (elapsed % fpsInterval);

        // Semi-transparent black background creates persistent trailing decay
        ctx.fillStyle = 'rgba(2, 6, 23, 0.12)';
        ctx.fillRect(0, 0, width, height);

        const colors = getColors();
        ctx.font = `${config.fontSize}px monospace`;

        const columns = Math.floor(width / config.fontSize);

        for (let i = 0; i < columns; i++) {
          const char = CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
          const x = i * config.fontSize;
          const y = dropsRef.current[i] * config.fontSize;

          // Glowing lead character
          ctx.fillStyle = colors.head;
          ctx.shadowBlur = 8;
          ctx.shadowColor = colors.trail;
          ctx.fillText(char, x, y);

          // Second trail character
          if (dropsRef.current[i] > 1) {
            const prevChar = CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
            ctx.fillStyle = colors.trail;
            ctx.shadowBlur = 4;
            ctx.fillText(prevChar, x, y - config.fontSize);
          }

          // Reset drop when past bottom or randomly
          if (y > height && Math.random() > 0.975) {
            dropsRef.current[i] = 0;
          }

          dropsRef.current[i]++;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config, isRunning, isFullscreenModal, embeddedHeight]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold tracking-wider">
              WF52 · MATRIX DIGITAL RAIN
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono">
              Canvas 60FPS
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs font-mono">
              Zero Garbage Collection
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            High-Velocity Stream Ingestion Backdrop
          </h2>
          <p className="text-sm text-slate-400">
            Real-time binary glyph cascade simulating 1,000,000 rows/s zero-copy telemetry ingestion.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isRunning
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'STREAM: LIVE' : 'PAUSED'}
          </button>

          <button
            onClick={toggleAudioHum}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              audioHumEnabled
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle synthesized 55Hz sub-bass ambient hum"
          >
            {audioHumEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {audioHumEnabled ? '55Hz HUM: ON' : 'HUM: OFF'}
          </button>

          <button
            onClick={() => setIsFullscreenModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            FULLSCREEN HUD
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800 mb-4 text-xs font-mono">
        {/* Speed */}
        <div>
          <div className="text-slate-400 mb-1 flex items-center justify-between">
            <span>STREAM SPEED</span>
            <span className="text-emerald-400">{config.speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={config.speed}
            onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Font Size */}
        <div>
          <div className="text-slate-400 mb-1 flex items-center justify-between">
            <span>GLYPH RESOLUTION</span>
            <span className="text-cyan-400">{config.fontSize}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="24"
            step="2"
            value={config.fontSize}
            onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>

        {/* Color Palette */}
        <div>
          <div className="text-slate-400 mb-1">COLOR PALETTE</div>
          <select
            value={config.colorScheme}
            onChange={(e) => setConfig({ ...config, colorScheme: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-emerald-500 outline-none"
          >
            <option value="matrix_green">Cyber Matrix Green</option>
            <option value="ghost_cyan">Ghost Cyan (Tactical)</option>
            <option value="anduril_amber">Anduril Amber (Infrared)</option>
            <option value="red_alert">Critical Red Alert</option>
          </select>
        </div>

        {/* Telemetry HUD Toggle */}
        <div>
          <div className="text-slate-400 mb-1">TELEMETRY HUD</div>
          <button
            onClick={() =>
              setConfig({ ...config, showTelemetryOverlay: !config.showTelemetryOverlay })
            }
            className={`w-full py-1 px-2 rounded border text-xs font-mono transition-colors ${
              config.showTelemetryOverlay
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {config.showTelemetryOverlay ? 'HUD OVERLAY: VISIBLE' : 'HUD OVERLAY: HIDDEN'}
          </button>
        </div>
      </div>

      {/* Embedded Matrix Rain Container */}
      <div
        className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col justify-end"
        style={{ height: `${embeddedHeight}px` }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Tactical Telemetry HUD Overlay */}
        {config.showTelemetryOverlay && (
          <div className="relative z-10 p-5 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent">
            {/* Mission Progress Bar */}
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  {PIPELINE_TASKS[currentTaskIndex]}
                </span>
                <span className="text-white font-bold">{loadingProgress}%</span>
              </div>

              <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-sky-400 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              {/* Coordinates & Block Signatures */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>BUFFER: 1,048,576 / 1,000,000 ROWS</span>
                <span>SHA-256 ROOT: e3b0c44298fc1c14...</span>
                <span>STREAM: 0 DROPPED</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Overlay Modal Screen */}
      {isFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center">
          <canvas ref={fullscreenCanvasRef} className="absolute inset-0 w-full h-full block" />

          {/* Fullscreen Tactical HUD */}
          <div className="relative z-10 w-full max-w-2xl p-8 bg-slate-950/90 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-sm font-mono font-bold text-emerald-400 tracking-wider">
                  OMNIDATA · AUTONOMOUS INGESTION PROTOCOL
                </span>
              </div>
              <button
                onClick={() => setIsFullscreenModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-mono text-slate-300 flex items-center gap-1.5"
              >
                <Minimize2 className="w-3.5 h-3.5" /> EXIT FULLSCREEN
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl font-extrabold font-mono text-white tracking-tight mb-2">
                  {loadingProgress}%
                </div>
                <div className="text-sm font-mono text-emerald-400 animate-pulse">
                  {PIPELINE_TASKS[currentTaskIndex]}
                </div>
              </div>

              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-emerald-500/30">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 text-center font-mono">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded">
                  <div className="text-[10px] text-slate-400">INGESTION RATE</div>
                  <div className="text-base font-bold text-cyan-400">1,024,800/s</div>
                </div>
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded">
                  <div className="text-[10px] text-slate-400">FAULTS INTERCEPTED</div>
                  <div className="text-base font-bold text-emerald-400">5 Intercepted</div>
                </div>
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded">
                  <div className="text-[10px] text-slate-400">HARD-DOLLAR SAVINGS</div>
                  <div className="text-base font-bold text-amber-400">$1,249,000</div>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => {
                    setLoadingProgress(100);
                    setTimeout(() => setIsFullscreenModal(false), 500);
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-sm rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                >
                  COMPLETE & PROCEED TO MAIN CONSOLE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
