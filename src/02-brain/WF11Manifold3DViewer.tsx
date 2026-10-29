import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BrainComponentState } from './types';
import {
  Layers,
  Activity,
  AlertOctagon,
  Play,
  RotateCcw,
  Zap,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface WF11Manifold3DViewerProps {
  forcedState?: BrainComponentState;
  onStateChange?: (state: BrainComponentState) => void;
}

export const WF11Manifold3DViewer: React.FC<WF11Manifold3DViewerProps> = ({
  forcedState,
  onStateChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [componentState, setComponentState] = useState<BrainComponentState>(forcedState || 'idle');
  const [projection, setProjection] = useState<'umap' | 'tsne' | 'pca'>('umap');
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [distortionScore, setDistortionScore] = useState<number>(0.038);

  const stateRef = useRef<BrainComponentState>(componentState);
  stateRef.current = componentState;

  const projectionRef = useRef(projection);
  projectionRef.current = projection;

  const wireframeRef = useRef(isWireframe);
  wireframeRef.current = isWireframe;

  useEffect(() => {
    if (forcedState) {
      setComponentState(forcedState);
    }
  }, [forcedState]);

  const updateState = (newState: BrainComponentState) => {
    setComponentState(newState);
    onStateChange?.(newState);
  };

  const handleRunTopologicalScan = () => {
    updateState('analyzing');
    setTimeout(() => {
      updateState('idle');
    }, 2000);
  };

  const handleInjectTopologicalAnomaly = () => {
    updateState('analyzing');
    setTimeout(() => {
      setDistortionScore(0.784);
      updateState('alert');
    }, 1200);
  };

  const handleReset = () => {
    setDistortionScore(0.038);
    setProjection('umap');
    updateState('idle');
  };

  const isAlertState = componentState === 'alert';
  const isAnalyzing = componentState === 'analyzing';

  // Three.js Scene Setup & Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Studio Environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Lighting
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.5);
    keyLight.position.set(6, 10, 6);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x0f172a, 1.2);
    scene.add(hemiLight);

    // Group for Manifold
    const manifoldGroup = new THREE.Group();
    scene.add(manifoldGroup);

    // Procedural Parametric Manifold Geometry (Torus Knot / Mobius Ribbon)
    const manifoldGeo = new THREE.TorusKnotGeometry(2.4, 0.55, 120, 24, 2, 3);
    const manifoldMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      emissive: 0x0f172a,
      roughness: 0.25,
      metalness: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      wireframe: wireframeRef.current,
      transparent: true,
      opacity: 0.85,
    });
    const manifoldMesh = new THREE.Mesh(manifoldGeo, manifoldMat);
    manifoldGroup.add(manifoldMesh);

    // Cluster Particle Points (InstancedMesh)
    const particleCount = 200;
    const sphereGeo = new THREE.SphereGeometry(0.065, 12, 12);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
    });
    const instancedParticles = new THREE.InstancedMesh(sphereGeo, sphereMat, particleCount);

    const dummy = new THREE.Object3D();
    const particlePositions: THREE.Vector3[] = [];
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const r = 2.4 + (Math.random() - 0.5) * 0.9;
      const x = (r + 0.55 * Math.cos(3 * u)) * Math.cos(2 * u);
      const y = (r + 0.55 * Math.cos(3 * u)) * Math.sin(2 * u);
      const z = 0.55 * Math.sin(3 * u) + (Math.random() - 0.5) * 0.4;

      const pos = new THREE.Vector3(x, y, z);
      particlePositions.push(pos);
      dummy.position.copy(pos);
      dummy.updateMatrix();
      instancedParticles.setMatrixAt(i, dummy.matrix);
    }
    instancedParticles.instanceMatrix.needsUpdate = true;
    manifoldGroup.add(instancedParticles);

    // Floor contact shadow grid
    const grid = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b);
    grid.position.y = -3.2;
    scene.add(grid);

    // Animation variables
    let frameId = 0;
    let clock = new THREE.Clock();

    const tick = () => {
      const elapsed = clock.getElapsedTime();
      const currentState = stateRef.current;

      // Update wireframe property dynamically
      manifoldMat.wireframe = wireframeRef.current;

      // Rotate group smoothly
      manifoldGroup.rotation.y = elapsed * 0.25;
      manifoldGroup.rotation.x = Math.sin(elapsed * 0.15) * 0.15;

      // State-specific visuals
      if (currentState === 'alert') {
        // Red glowing alert state
        manifoldMat.color.setHex(0xf43f5e);
        manifoldMat.emissive.setHex(0x881337);
        manifoldMat.emissiveIntensity = 0.8 + Math.sin(elapsed * 8) * 0.4;
        sphereMat.color.setHex(0xffffff);
        sphereMat.emissive.setHex(0xf43f5e);
        sphereMat.emissiveIntensity = 1.2;
      } else if (currentState === 'analyzing') {
        // Heartbeat rhythmic pulse wave
        const pulse = Math.abs(Math.sin(elapsed * 4.5));
        manifoldMat.color.setHex(0x818cf8);
        manifoldMat.emissive.setHex(0x312e81);
        manifoldMat.emissiveIntensity = 0.4 + pulse * 0.6;
        manifoldGroup.scale.setScalar(1 + pulse * 0.05);
        sphereMat.color.setHex(0x38bdf8);
        sphereMat.emissive.setHex(0x06b6d4);
        sphereMat.emissiveIntensity = 0.5 + pulse * 0.8;
      } else {
        // Idle serene state
        manifoldMat.color.setHex(0x3b82f6);
        manifoldMat.emissive.setHex(0x0f172a);
        manifoldMat.emissiveIntensity = 0.2;
        manifoldGroup.scale.setScalar(1);
        sphereMat.color.setHex(0x06b6d4);
        sphereMat.emissive.setHex(0x06b6d4);
        sphereMat.emissiveIntensity = 0.4;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      manifoldGeo.dispose();
      manifoldMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className={`rounded-2xl transition-all duration-500 border ${
        isAlertState
          ? 'bg-rose-950/20 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/60'
          : isAnalyzing
          ? 'bg-slate-900/90 border-purple-500/70 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      } p-6 relative overflow-hidden`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isAlertState
                  ? 'bg-rose-500/20 text-rose-400'
                  : isAnalyzing
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-purple-400">
                  WF11 • Geometric & Topological Brain
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                    isAlertState
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 animate-pulse'
                      : isAnalyzing
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {componentState.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Manifold 3D Viewer</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            High-dimensional UMAP, t-SNE & Riemannian curvature embedding visualizer.
          </p>
        </div>

        {/* State Badges & Actions */}
        <div className="flex items-center gap-3">
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-mono animate-pulse">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>TOPOLOGICAL PULSE ACTIVE</span>
            </div>
          )}

          {isAlertState && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-mono animate-pulse">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>SINGULARITY DISTORTION ({distortionScore.toFixed(3)})</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRunTopologicalScan}
              disabled={isAnalyzing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Scan Topological Embedding"
            >
              <Play className="w-3.5 h-3.5 text-purple-400" />
              <span>Scan</span>
            </button>
            <button
              onClick={handleInjectTopologicalAnomaly}
              disabled={isAnalyzing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800 transition"
              title="Inject topological singularity distortion"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Inject Anomaly</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Reset 3D Manifold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas Mount (100% Unobstructed Center) */}
      <div className="relative mt-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
        <div ref={mountRef} className="w-full h-[400px]" />

        {/* Minimal Spec Watermark (Top Left) */}
        <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-300">
          <span>Projection: {projection.toUpperCase()}</span>
          <span>•</span>
          <span>Geodesic Distortion: {distortionScore.toFixed(3)}</span>
        </div>

        {/* Unified Bottom Control Dock (Zero Viewport Occlusion per Three.js Directive) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-lg transition-transform duration-300">
          <div className="flex justify-end mb-1">
            <button
              onClick={() => setIsDockCollapsed((c) => !c)}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/90 hover:bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1"
            >
              {isDockCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{isDockCollapsed ? 'Show Dock' : 'Collapse'}</span>
            </button>
          </div>

          {!isDockCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl flex items-center justify-between gap-3 text-xs text-slate-200">
              {/* Projection Switcher */}
              <div className="flex items-center gap-1">
                {(['umap', 'tsne', 'pca'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProjection(p)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                      projection === p
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Wireframe toggle */}
              <button
                onClick={() => setIsWireframe((w) => !w)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border font-mono transition ${
                  isWireframe
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isWireframe ? 'Wireframe: ON' : 'Solid'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
