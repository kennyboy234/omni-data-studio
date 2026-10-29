import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Activity,
  ArrowRight,
  Battery,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Flame,
  Gauge,
  Layers,
  Maximize2,
  RefreshCw,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Thermometer,
  Zap,
} from 'lucide-react';
import { useFleetMesh } from './FleetMeshContext';
import { BatteryModule } from './types';

// Color gradient mapper for thermal infrared heatmap: 20°C (cyan) -> 35°C (emerald) -> 45°C (amber) -> 60°C+ (crimson)
function getThermalColor(tempC: number): THREE.Color {
  const norm = Math.max(0, Math.min(1, (tempC - 20) / 40));
  const color = new THREE.Color();
  if (norm < 0.33) {
    // 20 to 33.2: deep blue to cyan
    const t = norm / 0.33;
    color.setRGB(0.05 + 0.1 * t, 0.4 + 0.5 * t, 0.9 - 0.1 * t);
  } else if (norm < 0.66) {
    // 33.2 to 46.4: cyan to emerald to amber
    const t = (norm - 0.33) / 0.33;
    color.setRGB(0.15 + 0.8 * t, 0.9 - 0.2 * t, 0.2 - 0.15 * t);
  } else {
    // 46.4 to 60+: amber to blazing red/magenta
    const t = (norm - 0.66) / 0.34;
    color.setRGB(0.95 + 0.05 * t, 0.7 - 0.6 * t, 0.05 + 0.2 * t);
  }
  return color;
}

export const BatteryTwin3DPanel: React.FC = () => {
  const {
    activeVehicle,
    fleet,
    selectVehicle,
    injectThermalRunawayTest,
    activeTabTarget,
  } = useFleetMesh();

  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Explode controls state
  const [explodeSliderVal, setExplodeSliderVal] = useState<number>(65); // 0 to 100%
  const [isThermalMode, setIsThermalMode] = useState<boolean>(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number>(3); // Module D (has hotspot on Giga Hauler)
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'front' | 'side'>('iso');

  // Mutable refs for Three.js animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const explodeTargetRef = useRef<number>(0.65);
  const currentExplodeRef = useRef<number>(0.65);
  const thermalModeRef = useRef<boolean>(true);

  // Groups and mesh references for animation
  const topLidGroupRef = useRef<THREE.Group | null>(null);
  const bmsBoardGroupRef = useRef<THREE.Group | null>(null);
  const busbarsGroupRef = useRef<THREE.Group | null>(null);
  const modulesGroupRef = useRef<THREE.Group | null>(null);
  const coolingPlateGroupRef = useRef<THREE.Group | null>(null);
  const bottomTrayGroupRef = useRef<THREE.Group | null>(null);
  const cellMeshListRef = useRef<{ mesh: THREE.Mesh; tempC: number; origColor: THREE.Color }[]>([]);

  // Camera damping targets
  const cameraTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(4.5, 3.8, 5.2));
  const cameraLookAtTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Sync explode target ref
  useEffect(() => {
    explodeTargetRef.current = explodeSliderVal / 100;
  }, [explodeSliderVal]);

  // Sync thermal mode ref
  useEffect(() => {
    thermalModeRef.current = isThermalMode;
    // Update materials colors
    cellMeshListRef.current.forEach(({ mesh, tempC, origColor }) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isThermalMode) {
        mat.color.copy(getThermalColor(tempC));
        mat.emissive.copy(getThermalColor(tempC)).multiplyScalar(0.2);
      } else {
        mat.color.copy(origColor);
        mat.emissive.setHex(0x000000);
      }
    });
  }, [isThermalMode, activeVehicle]);

  // Camera preset handler
  const handleSetCameraPreset = (preset: 'iso' | 'top' | 'front' | 'side') => {
    setCameraPreset(preset);
    if (preset === 'iso') {
      cameraTargetPos.current.set(4.5, 3.8, 5.2);
    } else if (preset === 'top') {
      cameraTargetPos.current.set(0, 7.5, 0.01);
    } else if (preset === 'front') {
      cameraTargetPos.current.set(0, 1.2, 6.0);
    } else if (preset === 'side') {
      cameraTargetPos.current.set(6.5, 1.2, 0);
    }
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 900;
    const height = mount.clientHeight || 560;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.04);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.5, 3.8, 5.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

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
    rendererRef.current = renderer;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // Procedural Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(5, 8, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // Soft Contact Shadow Grounding Plane
    const shadowGeo = new THREE.PlaneGeometry(10, 8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.6;
    scene.add(shadowPlane);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(12, 24, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -1.61;
    scene.add(gridHelper);

    // ==============================================================
    // BUILD 6-LAYER PROCEDURAL EXPLODED 3D BATTERY PACK
    // ==============================================================
    cellMeshListRef.current = [];

    // --- LAYER 1: Top Enclosure Lid (Carbon / Alloy) ---
    const topLidGroup = new THREE.Group();
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const lidGeo = new THREE.BoxGeometry(3.6, 0.08, 2.2);
    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.castShadow = true;
    topLidGroup.add(lidMesh);

    // Flange trim around lid
    const flangeMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.9, roughness: 0.1 });
    const flangeMesh = new THREE.Mesh(new THREE.BoxGeometry(3.66, 0.02, 2.26), flangeMat);
    flangeMesh.position.y = -0.04;
    topLidGroup.add(flangeMesh);

    // Warning decal badge
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const badgeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.01, 0.3), badgeMat);
    badgeMesh.position.set(0, 0.045, 0);
    topLidGroup.add(badgeMesh);

    topLidGroupRef.current = topLidGroup;
    scene.add(topLidGroup);

    // --- LAYER 2: BMS Master Controller Board & Wiring Harness ---
    const bmsGroup = new THREE.Group();
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.35, metalness: 0.2 });
    const pcbGeo = new THREE.BoxGeometry(3.2, 0.04, 1.9);
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    bmsGroup.add(pcbMesh);

    // Microcontroller ICs
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2, metalness: 0.6 });
    for (let i = -1; i <= 1; i++) {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.35), chipMat);
      chip.position.set(i * 1.0, 0.04, 0);
      bmsGroup.add(chip);
    }

    bmsBoardGroupRef.current = bmsGroup;
    scene.add(bmsGroup);

    // --- LAYER 3: High-Voltage Busbars & Pyro-Contactors ---
    const busbarGroup = new THREE.Group();
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.15 });
    for (let r = -0.6; r <= 0.6; r += 0.6) {
      const busbar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.03, 0.08), copperMat);
      busbar.position.set(0, 0.02, r);
      busbarGroup.add(busbar);
    }
    // Main Contactors
    const contactorMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    const contactor1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16), contactorMat);
    contactor1.position.set(-1.4, 0.1, 0.5);
    const contactor2 = contactor1.clone();
    contactor2.position.set(-1.4, 0.1, -0.5);
    busbarGroup.add(contactor1, contactor2);

    busbarsGroupRef.current = busbarGroup;
    scene.add(busbarGroup);

    // --- LAYER 4: 6 High-Density Battery Cell Modules ---
    const modulesGroup = new THREE.Group();
    const cellGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.45, 12);

    // 2 rows x 3 columns of modules = 6 modules
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const modIdx = row * 3 + col;
        const modData = activeVehicle.batteryTwin.modules[modIdx] || activeVehicle.batteryTwin.modules[0];
        const singleModGroup = new THREE.Group();

        // Base module frame housing
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.8,
          roughness: 0.3,
          wireframe: false,
        });
        const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.48, 0.85), frameMat);
        singleModGroup.add(frameMesh);

        // Populate module with 16 individual battery cells
        for (let cr = 0; cr < 4; cr++) {
          for (let cc = 0; cc < 4; cc++) {
            const cellData = modData.cells[cr * 4 + cc] || { tempC: modData.tempC };
            const origColor = new THREE.Color(0x38bdf8);

            const cellMat = new THREE.MeshStandardMaterial({
              color: thermalModeRef.current ? getThermalColor(cellData.tempC) : origColor,
              emissive: thermalModeRef.current ? getThermalColor(cellData.tempC).clone().multiplyScalar(0.2) : new THREE.Color(0x000000),
              metalness: 0.7,
              roughness: 0.2,
            });

            const cellMesh = new THREE.Mesh(cellGeo, cellMat);
            cellMesh.position.set((cc - 1.5) * 0.18, 0.02, (cr - 1.5) * 0.18);
            singleModGroup.add(cellMesh);

            cellMeshListRef.current.push({
              mesh: cellMesh,
              tempC: cellData.tempC,
              origColor,
            });
          }
        }

        // Position module in grid
        const posX = (col - 1) * 1.05;
        const posZ = (row - 0.5) * 0.98;
        singleModGroup.position.set(posX, 0, posZ);
        singleModGroup.userData = { moduleIndex: modIdx, moduleData: modData };

        modulesGroup.add(singleModGroup);
      }
    }

    modulesGroupRef.current = modulesGroup;
    scene.add(modulesGroup);

    // --- LAYER 5: Liquid Glycol Cold Plate & Cooling Channels ---
    const coolingGroup = new THREE.Group();
    const coldPlateMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.15 });
    const coldPlateMesh = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.06, 2.0), coldPlateMat);
    coolingGroup.add(coldPlateMesh);

    // Serpentine cooling tubes
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    for (let t = -0.8; t <= 0.8; t += 0.3) {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.04, 0.06), tubeMat);
      tube.position.set(0, 0.04, t);
      coolingGroup.add(tube);
    }

    coolingPlateGroupRef.current = coolingGroup;
    scene.add(coolingGroup);

    // --- LAYER 6: Bottom Reinforced Skid Tray (Titanium / Structural Steel) ---
    const bottomTrayGroup = new THREE.Group();
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.2,
    });
    const trayMesh = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.12, 2.3), trayMat);
    trayMesh.receiveShadow = !isSoftwareGl;
    bottomTrayGroup.add(trayMesh);

    // Structural underside crash ribs
    for (let r = -1.4; r <= 1.4; r += 0.7) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.2), trayMat);
      rib.position.set(r, -0.09, 0);
      bottomTrayGroup.add(rib);
    }

    bottomTrayGroupRef.current = bottomTrayGroup;
    scene.add(bottomTrayGroup);

    // ==============================================================
    // ANIMATION TICK LOOP WITH EXPONENTIAL SPRING DAMPING
    // ==============================================================
    let animFrameId = 0;
    let clock = new THREE.Clock();

    // Mouse drag interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let sphericalTheta = Math.PI / 4;
    let sphericalPhi = Math.PI / 3;
    let sphericalRadius = 7.0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      sphericalTheta -= deltaX * 0.008;
      sphericalPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalPhi - deltaY * 0.008));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraTargetPos.current.x = sphericalRadius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      cameraTargetPos.current.y = sphericalRadius * Math.cos(sphericalPhi);
      cameraTargetPos.current.z = sphericalRadius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const tick = () => {
      const delta = Math.min(0.05, clock.getDelta());

      // Exponential damping on explode target
      currentExplodeRef.current = THREE.MathUtils.damp(
        currentExplodeRef.current,
        explodeTargetRef.current,
        6.0,
        delta
      );
      const ex = currentExplodeRef.current;

      // Position each physical layer along the Y axis based on explode amount
      if (topLidGroupRef.current) topLidGroupRef.current.position.y = 0.5 + ex * 1.8;
      if (bmsBoardGroupRef.current) bmsBoardGroupRef.current.position.y = 0.35 + ex * 1.1;
      if (busbarsGroupRef.current) busbarsGroupRef.current.position.y = 0.2 + ex * 0.6;
      if (coolingPlateGroupRef.current) coolingPlateGroupRef.current.position.y = -0.2 - ex * 0.6;
      if (bottomTrayGroupRef.current) bottomTrayGroupRef.current.position.y = -0.45 - ex * 1.4;

      // Module separation along X and Z for glorious explosion!
      if (modulesGroupRef.current) {
        modulesGroupRef.current.children.forEach((mod) => {
          const uData = mod.userData;
          if (uData && uData.moduleIndex !== undefined) {
            const row = Math.floor(uData.moduleIndex / 3);
            const col = uData.moduleIndex % 3;
            const baseX = (col - 1) * 1.05;
            const baseZ = (row - 0.5) * 0.98;
            mod.position.x = baseX + (col - 1) * 0.45 * ex;
            mod.position.z = baseZ + (row - 0.5) * 0.4 * ex;
          }
        });
      }

      // Smooth camera interpolation
      camera.position.lerp(cameraTargetPos.current, 0.08);
      camera.lookAt(cameraLookAtTarget.current);

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    // Resize handler
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      mount.innerHTML = '';
    };
  }, [activeVehicle.id]);

  const selectedModule = activeVehicle.batteryTwin.modules[selectedModuleIndex] || activeVehicle.batteryTwin.modules[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                WF08 • 3D DIGITAL BATTERY TWIN
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                HARDWARE EXPLODED VIEW
              </span>
              <span className="text-xs text-slate-400">
                Target: <strong className="text-white">{activeVehicle.name}</strong> ({activeVehicle.id})
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>High-Voltage Battery Pack 3D Exploded Twin</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Photorealistic PBR and thermal infrared digital twin of the high-voltage powertrain pack. Drag to rotate, expand the explode slider, inspect individual module temperatures, and isolate hotspots.
            </p>
          </div>

          {/* Quick Vehicle Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <select
              value={activeVehicle.id}
              onChange={(e) => selectVehicle(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-md"
            >
              {fleet.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({Math.round(v.batteryPct)}% 🔋)
                </option>
              ))}
            </select>

            <button
              onClick={injectThermalRunawayTest}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-950 to-amber-950 hover:from-red-900 hover:to-amber-900 text-red-200 border border-red-700/80 text-xs font-semibold shadow-md transition cursor-pointer shrink-0"
              title="Simulate localized thermal hotspot runaway on Module D"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Inject Hotspot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Viewport & Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Three.js 3D Viewport with Collapsible Bottom Dock */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl h-[620px] flex flex-col">
          {/* Top HUD Telemetry Overlay */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-slate-950/85 border border-slate-800 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-lg text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Max Temp:</span>
              <span className={`font-bold ${activeVehicle.batteryTwin.maxCellTempC > 48 ? 'text-red-400' : 'text-emerald-400'}`}>
                {activeVehicle.batteryTwin.maxCellTempC}°C
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Pack Voltage:</span>
              <span className="text-white font-bold">{activeVehicle.batteryTwin.currentVoltageV} V</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">Pump:</span>
              <span className="text-cyan-300 font-bold">{activeVehicle.batteryTwin.pumpRpm} RPM</span>
            </div>
          </div>

          {/* Three.js Canvas Mount Container */}
          <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Collapsible Unified Bottom Control Dock (Per Three.js Guidelines) */}
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4 transition-all duration-300 ${
              isControlsCollapsed ? 'translate-y-28' : 'translate-y-0'
            }`}
          >
            {/* Collapse / Expand Toggle Button */}
            <div className="flex justify-center mb-1">
              <button
                onClick={() => setIsControlsCollapsed((prev) => !prev)}
                className="flex items-center gap-1 px-3 py-1 rounded-t-lg bg-slate-900 border-t border-x border-slate-800 text-slate-400 hover:text-white text-[11px] font-mono shadow-md cursor-pointer"
              >
                {isControlsCollapsed ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Show 3D Controls</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Collapse Dock</span>
                  </>
                )}
              </button>
            </div>

            {/* Glassmorphic Bottom Dock */}
            <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-3">
              {/* Explode Slider & Quick Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white whitespace-nowrap">Explode View:</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={explodeSliderVal}
                    onChange={(e) => setExplodeSliderVal(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="font-mono text-cyan-400 font-bold w-12 text-right">
                    {explodeSliderVal}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExplodeSliderVal(0)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Assemble
                  </button>
                  <button
                    onClick={() => setExplodeSliderVal(85)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow"
                  >
                    Explode
                  </button>
                </div>
              </div>

              {/* Mode Switcher & Camera View Presets */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs flex-wrap">
                {/* Thermal Mode Switch */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsThermalMode(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      !isThermalMode
                        ? 'bg-slate-800 text-white border border-slate-600'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PBR Metal Alloy
                  </button>
                  <button
                    onClick={() => setIsThermalMode(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isThermalMode
                        ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Thermal Infrared</span>
                  </button>
                </div>

                {/* Camera Angles */}
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-slate-400 mr-1 text-[11px]">Camera:</span>
                  {(['iso', 'top', 'front', 'side'] as const).map((cam) => (
                    <button
                      key={cam}
                      onClick={() => handleSetCameraPreset(cam)}
                      className={`px-2 py-0.5 rounded text-[11px] uppercase cursor-pointer ${
                        cameraPreset === cam
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cam}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Module & Cell Inspection Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          {/* Module Selector & Thermal Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  MODULE TELEMETRY ANALYZER
                </span>
                <h3 className="text-base font-bold text-white">{selectedModule.name}</h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  selectedModule.status === 'critical'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : selectedModule.status === 'hot'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {selectedModule.status}
              </span>
            </div>

            {/* Module Picker Buttons */}
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-2">Select Module to Inspect:</label>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {activeVehicle.batteryTwin.modules.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModuleIndex(idx)}
                    className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                      selectedModuleIndex === idx
                        ? 'bg-slate-800 border-cyan-500 text-cyan-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{m.id}</div>
                    <div className={`text-[10px] ${m.tempC > 48 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                      {m.tempC}°C
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Module KPI Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Module Temperature</span>
                <span className={`text-xl font-bold ${selectedModule.tempC > 48 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedModule.tempC}°C
                </span>
                <span className="text-slate-400 text-[10px] block mt-0.5">&Delta;Hotspot: +{selectedModule.hotspotDeltaC}°C</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Module Voltage</span>
                <span className="text-xl font-bold text-white">{selectedModule.voltageV} V</span>
                <span className="text-slate-400 text-[10px] block mt-0.5">Health: {selectedModule.healthPct}% SoH</span>
              </div>
            </div>

            {/* Individual Cell Matrix in Module */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>16-Cell Thermal Dispersion Array</span>
                <span className="text-[10px] font-mono text-cyan-400">IR Sensor Feeds</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-center pt-1">
                {selectedModule.cells.map((cell) => {
                  const isHot = cell.tempC > 48;
                  return (
                    <div
                      key={cell.id}
                      title={`Cell ${cell.id}: ${cell.tempC}°C, ${cell.voltageV}V`}
                      className={`p-1.5 rounded-lg border flex flex-col justify-center ${
                        isHot
                          ? 'bg-red-950/80 border-red-700 text-red-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-bold">{cell.tempC}°C</span>
                      <span className="text-slate-400 text-[9px]">{cell.voltageV}V</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Liquid Cooling System Performance */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>Active Liquid Glycol Loop</span>
                <span>{activeVehicle.batteryTwin.coolantFlowLpm} L/min</span>
              </div>
              <div className="text-slate-400 text-[11px] flex justify-between">
                <span>Inlet: {activeVehicle.batteryTwin.coolantInletTempC}°C</span>
                <span>Outlet: {activeVehicle.batteryTwin.coolantOutletTempC}°C</span>
              </div>
              <div className="text-slate-400 text-[11px] flex justify-between">
                <span>Isolation Resistance:</span>
                <span className="text-white font-bold">{activeVehicle.batteryTwin.isolationResistanceKOhm} k&Omega;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
