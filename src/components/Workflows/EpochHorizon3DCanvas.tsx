import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Orbit,
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Play,
  Pause,
  Compass,
  Layers,
  Sparkles,
} from 'lucide-react';

interface EpochHorizon3DCanvasProps {
  activeEraIndex: number; // 1 to 7
  onSelectEra: (index: number) => void;
  causalEfficacy: number; // e.g. 12 to 158%
}

export const EpochHorizon3DCanvas: React.FC<EpochHorizon3DCanvasProps> = ({
  activeEraIndex,
  onSelectEra,
  causalEfficacy,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'orbit' | 'dyson' | 'hologram' | 'core'>('orbit');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // References for three.js state
  const threeStateRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    heroGroup?: THREE.Group;
    dysonRing?: THREE.Mesh;
    gyroRing?: THREE.Mesh;
    coreMesh?: THREE.Mesh;
    hologramMesh?: THREE.LineSegments | THREE.Mesh;
    ribbons?: THREE.Mesh[];
    particles?: THREE.Points;
    animFrameId?: number;
    targetCamPos?: THREE.Vector3;
    currentCamPos?: THREE.Vector3;
    targetLookAt?: THREE.Vector3;
    currentLookAt?: THREE.Vector3;
    isMouseDown?: boolean;
    prevMousePos?: { x: number; y: number };
    sphericalCoords?: { radius: number; theta: number; phi: number };
  }>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.032);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 12);

    // 3. Renderer with PBR ACESFilmic ToneMapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clean existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Studio PBR Lighting Setup
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.1);
    scene.add(hemiLight);

    const rimLight = new THREE.PointLight(0xa855f7, 3.5, 25);
    rimLight.position.set(-8, -3, -8);
    scene.add(rimLight);

    const corePointLight = new THREE.PointLight(0x06b6d4, 4.0, 15);
    corePointLight.position.set(0, 0, 0);
    scene.add(corePointLight);

    // 5. Composite 8-Part Procedural Hero Subject (THREE.Group)
    const heroGroup = new THREE.Group();
    heroGroup.position.set(0, 0.5, 0);
    scene.add(heroGroup);

    // Part 1: Central Quantum Singularity / Celestial Core (Icosahedron + wireframe)
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.castShadow = true;
    heroGroup.add(coreMesh);

    // Part 2: Inner Geodesic Gyroscope Ring
    const gyroGeo = new THREE.TorusGeometry(2.1, 0.08, 16, 64);
    const gyroMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x78350f,
      emissiveIntensity: 0.3,
    });
    const gyroRing = new THREE.Mesh(gyroGeo, gyroMat);
    gyroRing.rotation.x = Math.PI / 3;
    heroGroup.add(gyroRing);

    // Part 3: Mid Counter-Rotating Dyson Swarm Collector Ring
    const dysonGeo = new THREE.TorusGeometry(3.4, 0.12, 16, 96);
    const dysonMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
    });
    const dysonRing = new THREE.Mesh(dysonGeo, dysonMat);
    dysonRing.rotation.x = Math.PI / 2;
    heroGroup.add(dysonRing);

    // Part 4: 12 Solar Sails attached to Dyson Swarm Ring
    const sailGroup = new THREE.Group();
    dysonRing.add(sailGroup);
    const sailGeo = new THREE.BoxGeometry(0.35, 0.04, 0.65);
    const sailMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x075985,
      emissiveIntensity: 0.2,
    });

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const sail = new THREE.Mesh(sailGeo, sailMat);
      sail.position.set(Math.cos(angle) * 3.4, 0, Math.sin(angle) * 3.4);
      sail.rotation.y = -angle;
      sailGroup.add(sail);
    }

    // Part 5: Outer Holographic AdS/CFT Boundary Frame (Dodecahedron cage)
    const holoGeo = new THREE.DodecahedronGeometry(5.0);
    const holoWireframe = new THREE.WireframeGeometry(holoGeo);
    const holoLineMat = new THREE.LineBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.55,
    });
    const hologramMesh = new THREE.LineSegments(holoWireframe, holoLineMat);
    heroGroup.add(hologramMesh);

    // Add glowing vertex nodes to AdS boundary
    const nodeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.8,
    });
    const nodePositions = holoGeo.attributes.position;
    for (let i = 0; i < nodePositions.count; i += 3) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(
        nodePositions.getX(i) * 5.0,
        nodePositions.getY(i) * 5.0,
        nodePositions.getZ(i) * 5.0
      );
      heroGroup.add(node);
    }

    // Part 6: Seven Epoch Helical Manifold Ribbons (1 to 7 golden spiral curve tubes)
    const ribbons: THREE.Mesh[] = [];
    const eraColors = [
      0x38bdf8, // Era I: Cyan
      0x10b981, // Era II: Emerald
      0xf59e0b, // Era III: Amber
      0x6366f1, // Era IV: Indigo
      0xf43f5e, // Era V: Rose
      0x06b6d4, // Era VI: Sky/Dyson
      0xa855f7, // Era VII: Purple/Noosphere
    ];

    for (let e = 0; e < 7; e++) {
      const curvePoints: THREE.Vector3[] = [];
      const numPoints = 32;
      const startAngle = (e / 7) * Math.PI * 2;
      const heightStep = 0.55;

      for (let p = 0; p <= numPoints; p++) {
        const t = p / numPoints;
        const radius = 1.6 + t * 3.2;
        const angle = startAngle + t * Math.PI * 1.5;
        const y = -2.0 + t * heightStep * 7;
        curvePoints.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.06, 8, false);
      const isEraActive = e + 1 === activeEraIndex;

      const tubeMat = new THREE.MeshStandardMaterial({
        color: eraColors[e],
        emissive: eraColors[e],
        emissiveIntensity: isEraActive ? 0.9 : 0.35,
        roughness: 0.25,
        metalness: 0.8,
      });

      const ribbonMesh = new THREE.Mesh(tubeGeo, tubeMat);
      heroGroup.add(ribbonMesh);
      ribbons.push(ribbonMesh);
    }

    // Part 7: Radial Soft Contact Shadow disc at ground
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(12, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -3.8;
    scene.add(shadowMesh);

    // Part 8: Atmospheric Quantum Particles
    const partCount = 450;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount * 3; i += 3) {
      partPos[i] = (Math.random() - 0.5) * 22;
      partPos[i + 1] = (Math.random() - 0.5) * 16;
      partPos[i + 2] = (Math.random() - 0.5) * 22;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // Camera controller state with spherical coordinates
    const spherical = { radius: 13, theta: 0.3, phi: 1.15 };
    const targetLookAt = new THREE.Vector3(0, 0.3, 0);
    const currentLookAt = new THREE.Vector3(0, 0.3, 0);

    threeStateRef.current = {
      renderer,
      scene,
      camera,
      heroGroup,
      dysonRing,
      gyroRing,
      coreMesh,
      hologramMesh,
      ribbons,
      particles,
      sphericalCoords: spherical,
      targetLookAt,
      currentLookAt,
      isMouseDown: false,
      prevMousePos: { x: 0, y: 0 },
    };

    // Mouse Controls (drag to orbit)
    const onMouseDown = (e: MouseEvent) => {
      threeStateRef.current.isMouseDown = true;
      threeStateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!threeStateRef.current.isMouseDown) return;
      const dx = e.clientX - (threeStateRef.current.prevMousePos?.x || e.clientX);
      const dy = e.clientY - (threeStateRef.current.prevMousePos?.y || e.clientY);
      threeStateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };

      if (threeStateRef.current.sphericalCoords) {
        threeStateRef.current.sphericalCoords.theta -= dx * 0.007;
        threeStateRef.current.sphericalCoords.phi = Math.max(
          0.2,
          Math.min(Math.PI - 0.2, threeStateRef.current.sphericalCoords.phi - dy * 0.007)
        );
      }
    };

    const onMouseUp = () => {
      threeStateRef.current.isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (threeStateRef.current.sphericalCoords) {
        threeStateRef.current.sphericalCoords.radius = Math.max(
          4.0,
          Math.min(22.0, threeStateRef.current.sphericalCoords.radius + e.deltaY * 0.01)
        );
      }
    };

    const canvasDom = renderer.domElement;
    canvasDom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvasDom.addEventListener('wheel', onWheel, { passive: false });

    // Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6. Lossless 60fps Animation Loop with Exponential Damping
    let prevTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min(0.1, (time - prevTime) / 1000);
      prevTime = time;

      // Auto rotation
      if (isRotating && !threeStateRef.current.isMouseDown && threeStateRef.current.sphericalCoords) {
        threeStateRef.current.sphericalCoords.theta += 0.25 * dt;
      }

      // Smooth camera position damping: 1 - Math.exp(-6 * dt)
      if (threeStateRef.current.sphericalCoords && camera) {
        const { radius, theta, phi } = threeStateRef.current.sphericalCoords;
        const targetX = radius * Math.sin(phi) * Math.sin(theta);
        const targetY = radius * Math.cos(phi);
        const targetZ = radius * Math.sin(phi) * Math.cos(theta);

        const dampFactor = 1 - Math.exp(-8 * dt);
        camera.position.x += (targetX - camera.position.x) * dampFactor;
        camera.position.y += (targetY - camera.position.y) * dampFactor;
        camera.position.z += (targetZ - camera.position.z) * dampFactor;

        camera.lookAt(targetLookAt);
      }

      // Procedural object kinematics
      if (dysonRing) dysonRing.rotation.z += 0.35 * dt;
      if (gyroRing) {
        gyroRing.rotation.y += 0.5 * dt;
        gyroRing.rotation.x += 0.2 * dt;
      }
      if (coreMesh) {
        coreMesh.rotation.y -= 0.6 * dt;
        coreMesh.rotation.z += 0.25 * dt;
        // Breathing pulse effect based on causal efficacy
        const scale = 1.0 + Math.sin(time * 0.003) * 0.06 * (causalEfficacy / 50);
        coreMesh.scale.set(scale, scale, scale);
      }
      if (hologramMesh) {
        hologramMesh.rotation.y += 0.12 * dt;
        hologramMesh.rotation.x -= 0.08 * dt;
      }
      if (particles) {
        particles.rotation.y += 0.04 * dt;
      }

      renderer.render(scene, camera);
      threeStateRef.current.animFrameId = requestAnimationFrame(animate);
    };

    threeStateRef.current.animFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      if (threeStateRef.current.animFrameId) {
        cancelAnimationFrame(threeStateRef.current.animFrameId);
      }
      canvasDom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvasDom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);

      // Dispose all Three.js resources
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
      shadowTex.dispose();
      renderer.dispose();
    };
  }, [activeEraIndex, causalEfficacy, isRotating]);

  // Handle Camera Presets
  const handleApplyPreset = (preset: 'orbit' | 'dyson' | 'hologram' | 'core') => {
    setCameraPreset(preset);
    if (!threeStateRef.current.sphericalCoords) return;

    if (preset === 'orbit') {
      threeStateRef.current.sphericalCoords = { radius: 13, theta: 0.4, phi: 1.15 };
    } else if (preset === 'dyson') {
      threeStateRef.current.sphericalCoords = { radius: 7.5, theta: Math.PI / 4, phi: 1.45 };
    } else if (preset === 'hologram') {
      threeStateRef.current.sphericalCoords = { radius: 17, theta: 0.8, phi: 0.95 };
    } else if (preset === 'core') {
      threeStateRef.current.sphericalCoords = { radius: 4.8, theta: 0.1, phi: 1.3 };
    }
  };

  const eraNames = [
    'Era I: Foundation Bioscience',
    'Era II: Neuro-Symbolic Verification',
    'Era III: Robotic Wet-Labs',
    'Era IV: Quantum Planetary Twins',
    'Era V: DNA Nanobot Compilers',
    'Era VI: Dyson Sensor Grids',
    'Era VII: Spacetime & Noosphere',
  ];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-indigo-900/60 transition-all duration-300 shadow-2xl ${
        isExpanded ? 'h-[720px]' : 'h-[460px]'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Status Badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-950/90 text-cyan-300 border border-cyan-800 shadow-xl backdrop-blur-md flex items-center gap-1.5">
            <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>THREE.JS 3D CAUSAL MANIFOLD</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/90 text-purple-300 border border-purple-800">
            60 FPS PBR Loop
          </span>
        </div>
        <div className="text-xs font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 max-w-xs">
          Active Epoch: <strong className="text-white">{eraNames[activeEraIndex - 1]}</strong>
        </div>
      </div>

      {/* Floating Viewport-First Control Dock (Solid Dark surface <= 15% footprint) */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl text-xs space-y-2.5 w-64">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-mono font-bold text-slate-300 text-[11px] flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            3D Manifold Controls
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title={isRotating ? 'Pause rotation' : 'Resume rotation'}
            >
              {isRotating ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-slate-400" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title={isExpanded ? 'Collapse viewport' : 'Expand viewport'}
            >
              {isExpanded ? <Minimize2 className="w-3 h-3 text-slate-300" /> : <Maximize2 className="w-3 h-3 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Camera Perspective Presets */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Camera Perspective</span>
          <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
            <button
              onClick={() => handleApplyPreset('orbit')}
              className={`px-2 py-1 rounded transition text-left cursor-pointer ${
                cameraPreset === 'orbit' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Galactic Orbit
            </button>
            <button
              onClick={() => handleApplyPreset('dyson')}
              className={`px-2 py-1 rounded transition text-left cursor-pointer ${
                cameraPreset === 'dyson' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Dyson Swarm
            </button>
            <button
              onClick={() => handleApplyPreset('hologram')}
              className={`px-2 py-1 rounded transition text-left cursor-pointer ${
                cameraPreset === 'hologram' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Holographic Bulk
            </button>
            <button
              onClick={() => handleApplyPreset('core')}
              className={`px-2 py-1 rounded transition text-left cursor-pointer ${
                cameraPreset === 'core' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Singularity Core
            </button>
          </div>
        </div>

        {/* Era Ribbon Selector */}
        <div className="space-y-1 pt-1 border-t border-slate-850">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Scrub Era Horizon</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                onClick={() => onSelectEra(num)}
                className={`flex-1 py-1 rounded font-mono text-[10px] font-bold transition cursor-pointer text-center ${
                  activeEraIndex === num
                    ? 'bg-gradient-to-t from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
