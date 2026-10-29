import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Thermometer,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  RotateCw,
  Eye,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface BatteryModuleTelemetry {
  id: string;
  name: string;
  tempC: number;
  voltageV: number;
  socPct: number;
  sohPct: number;
  status: 'nominal' | 'elevated' | 'critical';
}

const INITIAL_MODULES: BatteryModuleTelemetry[] = [
  { id: 'MOD-01', name: 'Module A1 (Front-Left)', tempC: 31.8, voltageV: 4.12, socPct: 91, sohPct: 98.4, status: 'nominal' },
  { id: 'MOD-02', name: 'Module A2 (Front-Right)', tempC: 32.4, voltageV: 4.11, socPct: 91, sohPct: 98.1, status: 'nominal' },
  { id: 'MOD-03', name: 'Module B1 (Center-Left)', tempC: 46.2, voltageV: 4.09, socPct: 89, sohPct: 97.2, status: 'elevated' },
  { id: 'MOD-04', name: 'Module B2 (Center-Right - Hotspot)', tempC: 58.6, voltageV: 4.05, socPct: 87, sohPct: 95.8, status: 'elevated' },
  { id: 'MOD-05', name: 'Module C1 (Rear-Left)', tempC: 35.1, voltageV: 4.10, socPct: 90, sohPct: 97.9, status: 'nominal' },
  { id: 'MOD-06', name: 'Module C2 (Rear-Right)', tempC: 34.6, voltageV: 4.11, socPct: 90, sohPct: 98.0, status: 'nominal' },
];

// Map temperature (20°C - 70°C) to RGB color
function getThermalColor(tempC: number): THREE.Color {
  const minTemp = 25;
  const maxTemp = 65;
  const t = Math.max(0, Math.min(1, (tempC - minTemp) / (maxTemp - minTemp)));

  const color = new THREE.Color();
  if (t < 0.33) {
    // Cool cyan to green
    const factor = t / 0.33;
    color.setRGB(0.05 + 0.1 * factor, 0.6 + 0.3 * factor, 0.9 - 0.5 * factor);
  } else if (t < 0.66) {
    // Green to yellow/amber
    const factor = (t - 0.33) / 0.33;
    color.setRGB(0.15 + 0.8 * factor, 0.9 - 0.2 * factor, 0.4 - 0.35 * factor);
  } else {
    // Amber to vibrant red/crimson
    const factor = (t - 0.66) / 0.34;
    color.setRGB(0.95 + 0.05 * factor, 0.7 - 0.6 * factor, 0.05);
  }
  return color;
}

interface WF08BatteryTwinProps {
  vehicleId?: string;
  vehicleName?: string;
  onClose?: () => void;
}

export const WF08BatteryTwin: React.FC<WF08BatteryTwinProps> = ({
  vehicleId = 'EV-DEF-01',
  vehicleName = 'Unit-01 Valkyrie (Alpha)',
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [explodeFactor, setExplodeFactor] = useState<number>(0.45); // 0.0 = closed, 1.0 = full explode
  const [heatmapMode, setHeatmapMode] = useState<'thermal' | 'voltage' | 'soh'>('thermal');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<BatteryModuleTelemetry>(INITIAL_MODULES[3]); // Hotspot default

  // Mutable refs for animation loop
  const explodeFactorRef = useRef<number>(explodeFactor);
  explodeFactorRef.current = explodeFactor;

  const autoRotateRef = useRef<boolean>(autoRotate);
  autoRotateRef.current = autoRotate;

  const heatmapModeRef = useRef<'thermal' | 'voltage' | 'soh'>(heatmapMode);
  heatmapModeRef.current = heatmapMode;

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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', 0.025);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5.5, 4.2, 6.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight('#1e293b', 0.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#38bdf8', '#0f172a', 0.7);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.8);
    keyLight.position.set(6, 8, 5);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#06b6d4', 1.2);
    rimLight.position.set(-6, -2, -5);
    scene.add(rimLight);

    // Contact Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(12, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.6;
    scene.add(shadowPlane);

    // Grid Floor Guide
    const gridHelper = new THREE.GridHelper(14, 28, '#0891b2', '#1e293b');
    gridHelper.position.y = -1.59;
    scene.add(gridHelper);

    // Master Battery Assembly Group
    const batteryRoot = new THREE.Group();
    scene.add(batteryRoot);

    // Composite Parts:
    // 1. Top Enclosure Lid
    const topLidGeo = new THREE.BoxGeometry(4.4, 0.12, 2.6);
    const topLidMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.35,
      metalness: 0.75,
      wireframe: false,
    });
    const topLidMesh = new THREE.Mesh(topLidGeo, topLidMat);
    topLidMesh.castShadow = !isSoftwareGl;
    batteryRoot.add(topLidMesh);

    // 2. Busbar & Harness Layer
    const busbarGroup = new THREE.Group();
    const busbarMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      metalness: 0.9,
      roughness: 0.2,
    });
    for (let i = -1.6; i <= 1.6; i += 0.8) {
      const busbarGeo = new THREE.BoxGeometry(0.12, 0.05, 2.2);
      const busbar = new THREE.Mesh(busbarGeo, busbarMat);
      busbar.position.x = i;
      busbarGroup.add(busbar);
    }
    batteryRoot.add(busbarGroup);

    // 3. Module Racks & Cells with Temperature Heatmap Colors
    const moduleMeshes: { mesh: THREE.Mesh; modData: BatteryModuleTelemetry; initialPos: THREE.Vector3 }[] = [];
    const cellGeos: THREE.BoxGeometry[] = [];
    const cellMats: THREE.MeshStandardMaterial[] = [];

    const modulePositions = [
      { x: -1.3, z: -0.65, index: 0 },
      { x: -1.3, z: 0.65, index: 1 },
      { x: 0.0, z: -0.65, index: 2 },
      { x: 0.0, z: 0.65, index: 3 }, // Hotspot
      { x: 1.3, z: -0.65, index: 4 },
      { x: 1.3, z: 0.65, index: 5 },
    ];

    modulePositions.forEach((pos) => {
      const modData = INITIAL_MODULES[pos.index];
      const modGeo = new THREE.BoxGeometry(1.05, 0.55, 1.05);
      const thermalColor = getThermalColor(modData.tempC);

      const modMat = new THREE.MeshStandardMaterial({
        color: thermalColor,
        roughness: 0.3,
        metalness: 0.4,
        emissive: modData.status === 'elevated' ? thermalColor : new THREE.Color('#000000'),
        emissiveIntensity: modData.status === 'elevated' ? 0.35 : 0.0,
      });

      cellGeos.push(modGeo);
      cellMats.push(modMat);

      const modMesh = new THREE.Mesh(modGeo, modMat);
      modMesh.castShadow = !isSoftwareGl;
      modMesh.receiveShadow = !isSoftwareGl;
      const initialPos = new THREE.Vector3(pos.x, 0, pos.z);
      modMesh.position.copy(initialPos);
      batteryRoot.add(modMesh);

      moduleMeshes.push({ mesh: modMesh, modData, initialPos });
    });

    // 4. Liquid Cooling Plate
    const coolingGeo = new THREE.BoxGeometry(4.3, 0.08, 2.5);
    const coolingMat = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      roughness: 0.25,
      metalness: 0.85,
    });
    const coolingMesh = new THREE.Mesh(coolingGeo, coolingMat);
    batteryRoot.add(coolingMesh);

    // 5. Structural Enclosure Bottom Tray & Crash Rails
    const trayGeo = new THREE.BoxGeometry(4.6, 0.25, 2.8);
    const trayMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.6,
      metalness: 0.4,
    });
    const trayMesh = new THREE.Mesh(trayGeo, trayMat);
    trayMesh.receiveShadow = !isSoftwareGl;
    batteryRoot.add(trayMesh);

    // 6. BMS Junction Box (Front-Center)
    const bmsGeo = new THREE.BoxGeometry(0.8, 0.4, 0.5);
    const bmsMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.2,
      metalness: 0.9,
    });
    const bmsMesh = new THREE.Mesh(bmsGeo, bmsMat);
    bmsMesh.position.set(-2.5, 0, 0);
    batteryRoot.add(bmsMesh);

    // Interactive mouse rotation drag
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotX = 0.35;
    let rotY = -0.65;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      rotY += dx * 0.008;
      rotX += dy * 0.008;
      rotX = Math.max(-Math.PI / 4, Math.min(Math.PI / 2.5, rotX));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Responsive resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation & Smooth Damping Loop
    let animId: number;
    let currentSeparation = 0;

    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();

      // Smoothly interpolate exploded positions
      const targetSep = explodeFactorRef.current;
      currentSeparation = THREE.MathUtils.damp(currentSeparation, targetSep, 5.0, delta);

      // Separate Part 1 (Top Lid): rises along +Y
      topLidMesh.position.y = 0.45 + currentSeparation * 1.6;

      // Separate Part 2 (Busbars): intermediate +Y
      busbarGroup.position.y = 0.35 + currentSeparation * 0.95;

      // Separate Part 3 (Cells/Modules): spread out in X, Z, and Y
      moduleMeshes.forEach(({ mesh, initialPos }) => {
        mesh.position.y = initialPos.y + currentSeparation * 0.35;
        mesh.position.x = initialPos.x * (1 + currentSeparation * 0.35);
        mesh.position.z = initialPos.z * (1 + currentSeparation * 0.35);
      });

      // Separate Part 4 (Cooling Plate): lowers along -Y
      coolingMesh.position.y = -0.35 - currentSeparation * 0.7;

      // Separate Part 5 (Bottom Tray): lowers further along -Y
      trayMesh.position.y = -0.55 - currentSeparation * 1.3;

      // Part 6 (BMS Box): slides along -X
      bmsMesh.position.x = -2.5 - currentSeparation * 1.2;

      // Camera auto-orbit when idle
      if (autoRotateRef.current && !isDragging) {
        rotY += delta * 0.25;
      }

      // Apply spherical camera positioning from rotX and rotY
      const radius = 9.2;
      camera.position.x = radius * Math.cos(rotX) * Math.sin(rotY);
      camera.position.y = radius * Math.sin(rotX);
      camera.position.z = radius * Math.cos(rotX) * Math.cos(rotY);
      camera.lookAt(0, currentSeparation * 0.1, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    tick();

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);

      topLidGeo.dispose();
      topLidMat.dispose();
      coolingGeo.dispose();
      coolingMat.dispose();
      trayGeo.dispose();
      trayMat.dispose();
      bmsGeo.dispose();
      bmsMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      cellGeos.forEach((g) => g.dispose());
      cellMats.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
      {/* Top Telemetry Header */}
      <div className="p-4 sm:p-5 bg-slate-950/95 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              WF08 · BATTERY TWIN
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-amber-400" />
              HOTSPOT DETECTED (58.6°C)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {vehicleId}
            </span>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            3D Battery Pack Exploded Twin & Thermal Heatmap
          </h2>
          <p className="text-xs text-slate-400">
            Target Unit: <strong className="text-white">{vehicleName}</strong> · 800V Architecture · 6 Cell Modules · Pyrofuse Active
          </p>
        </div>

        {/* Global Controls & Optional Close Button */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Close Twin
            </button>
          )}

          <div className="hidden sm:flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Pack Max:</span>
            <span className="text-rose-400 font-bold">58.6°C</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Pack Min:</span>
            <span className="text-cyan-400 font-bold">31.8°C</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Delta T:</span>
            <span className="text-amber-400 font-bold">26.8°C</span>
          </div>
        </div>
      </div>

      {/* Main 3D Three.js Viewport (Completely Unobstructed Center) */}
      <div className="relative w-full h-[520px] bg-slate-950 select-none">
        {/* Three.js Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Minimal Floating Top-Left Heatmap Legend */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 font-mono text-[11px] shadow-lg pointer-events-none">
          <div className="text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            Thermal Color Gradient
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">25°C</span>
            <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-600 border border-slate-700" />
            <span className="text-rose-400 font-bold">65°C+</span>
          </div>
        </div>

        {/* Minimal Floating Top-Right Module Inspector Pill */}
        <div className="absolute top-4 right-4 z-10 bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 font-mono text-xs shadow-lg max-w-xs">
          <div className="flex items-center justify-between gap-3 text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="text-white font-bold">{selectedModule.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                selectedModule.status === 'elevated'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {selectedModule.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div>Temp: <strong className="text-rose-400">{selectedModule.tempC}°C</strong></div>
            <div>Voltage: <strong className="text-slate-200">{selectedModule.voltageV} V</strong></div>
            <div>SoC: <strong className="text-cyan-400">{selectedModule.socPct}%</strong></div>
            <div>SoH: <strong className="text-emerald-400">{selectedModule.sohPct}%</strong></div>
          </div>
        </div>

        {/* Ergonomic Bottom Center Control Dock (Collapsible HUD per Three.js skill) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-3xl">
          {/* Collapse/Expand Handle */}
          <div className="flex justify-center -mb-px">
            <button
              onClick={() => setIsDockCollapsed(!isDockCollapsed)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-slate-900 border-t border-x border-slate-700 text-[11px] font-mono text-slate-400 hover:text-white transition cursor-pointer"
            >
              {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{isDockCollapsed ? 'Show 3D Controls' : 'Hide Controls (Zen View)'}</span>
            </button>
          </div>

          {!isDockCollapsed && (
            <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl space-y-3 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Explode View Slider */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      Explode Separation: {Math.round(explodeFactor * 100)}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {explodeFactor === 0 ? 'Assembly Sealed' : explodeFactor > 0.8 ? 'Full Separation' : 'Partially Exploded'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={explodeFactor}
                    onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Quick Presets & Toggles */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExplodeFactor(0)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      explodeFactor === 0
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Pack Sealed
                  </button>
                  <button
                    onClick={() => setExplodeFactor(0.5)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      explodeFactor > 0.3 && explodeFactor < 0.7
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    50% Explode
                  </button>
                  <button
                    onClick={() => setExplodeFactor(1.0)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      explodeFactor === 1.0
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    100% Explode
                  </button>

                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      autoRotate
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Toggle Camera Orbit"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Module Selector Pill Bar */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs overflow-x-auto gap-2">
                <span className="text-[11px] text-slate-400 uppercase font-semibold shrink-0">
                  Select Module:
                </span>
                <div className="flex items-center gap-1.5">
                  {INITIAL_MODULES.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedModule(mod)}
                      className={`px-2 py-1 rounded text-[11px] transition cursor-pointer shrink-0 font-bold ${
                        selectedModule.id === mod.id
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : mod.status === 'elevated'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mod.id} ({mod.tempC}°C)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WF08BatteryTwin;
