import React, { useEffect, useRef, useState } from 'react';
import {
  Navigation,
  Battery,
  Shield,
  Layers,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Crosshair,
  Radio,
  X,
  Gauge,
  Thermometer,
  Zap,
} from 'lucide-react';
import { WF08BatteryTwin } from './battery';

export interface Vehicle {
  id: string;
  name: string;
  callsign: string;
  role: string;
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  batteryPct: number;
  tempC: number;
  voltageV: number;
  status: 'nominal' | 'warning' | 'patrol' | 'charging';
  trail: [number, number][];
  waypoints: [number, number][];
  waypointIndex: number;
  color: string;
}

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'EV-01',
    name: 'Unit-01 Valkyrie',
    callsign: 'VK-01',
    role: 'Alpha Command EV',
    lat: 37.7749,
    lng: -122.4194,
    heading: 42,
    speedKmh: 64,
    batteryPct: 88,
    tempC: 38.2,
    voltageV: 784,
    status: 'nominal',
    color: '#06b6d4',
    trail: [[37.765, -122.43], [37.77, -122.424], [37.7749, -122.4194]],
    waypoints: [[37.7749, -122.4194], [37.785, -122.41], [37.792, -122.395], [37.78, -122.385], [37.765, -122.405], [37.7749, -122.4194]],
    waypointIndex: 0,
  },
  {
    id: 'EV-02',
    name: 'Unit-02 Aegis',
    callsign: 'AG-02',
    role: 'Perimeter Interceptor',
    lat: 37.7833,
    lng: -122.4167,
    heading: 110,
    speedKmh: 72,
    batteryPct: 76,
    tempC: 44.1,
    voltageV: 778,
    status: 'nominal',
    color: '#3b82f6',
    trail: [[37.795, -122.43], [37.788, -122.42], [37.7833, -122.4167]],
    waypoints: [[37.7833, -122.4167], [37.775, -122.395], [37.76, -122.41], [37.77, -122.43], [37.7833, -122.4167]],
    waypointIndex: 0,
  },
  {
    id: 'EV-03',
    name: 'Unit-03 Chimera',
    callsign: 'CH-03',
    role: 'Heavy Logistics Transport',
    lat: 37.762,
    lng: -122.435,
    heading: 195,
    speedKmh: 45,
    batteryPct: 92,
    tempC: 34.5,
    voltageV: 792,
    status: 'nominal',
    color: '#10b981',
    trail: [[37.775, -122.44], [37.768, -122.438], [37.762, -122.435]],
    waypoints: [[37.762, -122.435], [37.75, -122.42], [37.745, -122.44], [37.755, -122.455], [37.762, -122.435]],
    waypointIndex: 0,
  },
  {
    id: 'EV-04',
    name: 'Unit-04 Titan',
    callsign: 'TT-04',
    role: 'Field Maintenance Rig',
    lat: 37.791,
    lng: -122.402,
    heading: 85,
    speedKmh: 51,
    batteryPct: 62,
    tempC: 49.8,
    voltageV: 765,
    status: 'warning',
    color: '#f59e0b',
    trail: [[37.785, -122.415], [37.788, -122.408], [37.791, -122.402]],
    waypoints: [[37.791, -122.402], [37.802, -122.408], [37.805, -122.42], [37.795, -122.415], [37.791, -122.402]],
    waypointIndex: 0,
  },
  {
    id: 'EV-05',
    name: 'Unit-05 Specter',
    callsign: 'SP-05',
    role: 'Reconnaissance Scout',
    lat: 37.755,
    lng: -122.412,
    heading: 260,
    speedKmh: 82,
    batteryPct: 84,
    tempC: 41.0,
    voltageV: 786,
    status: 'nominal',
    color: '#8b5cf6',
    trail: [[37.745, -122.405], [37.75, -122.408], [37.755, -122.412]],
    waypoints: [[37.755, -122.412], [37.76, -122.395], [37.77, -122.39], [37.775, -122.41], [37.755, -122.412]],
    waypointIndex: 0,
  },
  {
    id: 'EV-06',
    name: 'Unit-06 Phantom',
    callsign: 'PH-06',
    role: 'Perimeter Overwatch',
    lat: 37.802,
    lng: -122.425,
    heading: 320,
    speedKmh: 58,
    batteryPct: 71,
    tempC: 43.6,
    voltageV: 772,
    status: 'nominal',
    color: '#ec4899',
    trail: [[37.792, -122.428], [37.798, -122.426], [37.802, -122.425]],
    waypoints: [[37.802, -122.425], [37.81, -122.418], [37.805, -122.435], [37.795, -122.44], [37.802, -122.425]],
    waypointIndex: 0,
  },
  {
    id: 'EV-07',
    name: 'Unit-07 Vanguard',
    callsign: 'VG-07',
    role: 'Tactical Escort Unit',
    lat: 37.77,
    lng: -122.448,
    heading: 15,
    speedKmh: 61,
    batteryPct: 95,
    tempC: 33.1,
    voltageV: 795,
    status: 'nominal',
    color: '#14b8a6',
    trail: [[37.76, -122.455], [37.765, -122.45], [37.77, -122.448]],
    waypoints: [[37.77, -122.448], [37.78, -122.445], [37.785, -122.46], [37.775, -122.465], [37.77, -122.448]],
    waypointIndex: 0,
  },
  {
    id: 'EV-08',
    name: 'Unit-08 Apex',
    callsign: 'AP-08',
    role: 'Autonomous Defense Mesh',
    lat: 37.748,
    lng: -122.395,
    heading: 140,
    speedKmh: 69,
    batteryPct: 58,
    tempC: 58.6, // Hotspot battery twin vehicle!
    voltageV: 755,
    status: 'warning',
    color: '#ef4444',
    trail: [[37.758, -122.39], [37.752, -122.392], [37.748, -122.395]],
    waypoints: [[37.748, -122.395], [37.74, -122.385], [37.735, -122.4], [37.742, -122.41], [37.748, -122.395]],
    waypointIndex: 0,
  },
  {
    id: 'EV-09',
    name: 'Unit-09 Goliath',
    callsign: 'GL-09',
    role: 'High-Capacity Mobile Hub',
    lat: 37.788,
    lng: -122.44,
    heading: 275,
    speedKmh: 42,
    batteryPct: 89,
    tempC: 36.8,
    voltageV: 790,
    status: 'nominal',
    color: '#6366f1',
    trail: [[37.782, -122.43], [37.785, -122.435], [37.788, -122.44]],
    waypoints: [[37.788, -122.44], [37.795, -122.45], [37.8, -122.465], [37.79, -122.46], [37.788, -122.44]],
    waypointIndex: 0,
  },
  {
    id: 'EV-10',
    name: 'Unit-10 Sentinel',
    callsign: 'SN-10',
    role: 'Autonomous Gateway Relay',
    lat: 37.766,
    lng: -122.39,
    heading: 50,
    speedKmh: 65,
    batteryPct: 81,
    tempC: 39.5,
    voltageV: 781,
    status: 'nominal',
    color: '#0ea5e9',
    trail: [[37.755, -122.38], [37.76, -122.385], [37.766, -122.39]],
    waypoints: [[37.766, -122.39], [37.775, -122.38], [37.78, -122.392], [37.77, -122.4], [37.766, -122.39]],
    waypointIndex: 0,
  },
];

export const WF14FleetMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polylinesRef = useRef<Map<string, any>>(new Map());

  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTwinVehicle, setActiveTwinVehicle] = useState<Vehicle | null>(null); // For opening WF08!
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [leafletReady, setLeafletReady] = useState<boolean>(false);

  const vehiclesRef = useRef<Vehicle[]>(vehicles);
  vehiclesRef.current = vehicles;

  // Initialize Leaflet Map safely in client environment
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let isMounted = true;
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css' as any)
    ]).then(([leafletMod]) => {
      if (!isMounted || !mapContainerRef.current) return;
      const L = (leafletMod as any).default || leafletMod;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [37.775, -122.42],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tactical CartoDB tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Zoom controls at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      setLeafletReady(true);
    }).catch((err) => {
      console.warn('Leaflet load deferred or fallback:', err);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Trails on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    vehicles.forEach((v) => {
      // 1. Trail Polyline
      let polyline = polylinesRef.current.get(v.id);
      if (!polyline) {
        polyline = L.polyline(v.trail, {
          color: v.color,
          weight: 3,
          opacity: 0.65,
          dashArray: '4, 4',
        }).addTo(map);
        polylinesRef.current.set(v.id, polyline);
      } else {
        polyline.setLatLngs(v.trail);
      }

      // 2. Custom Marker with Battery % Badge
      const isSelected = selectedVehicle?.id === v.id;
      const battBg =
        v.batteryPct > 70
          ? 'bg-emerald-500 text-slate-950'
          : v.batteryPct > 40
          ? 'bg-amber-400 text-slate-950'
          : 'bg-rose-500 text-white animate-pulse';

      const customHtml = `
        <div class="relative cursor-pointer group select-none" style="transform: translate(-50%, -50%);">
          <!-- Pulse Halo for Active Vehicle -->
          <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-115 ${
            isSelected ? 'scale-125 border-cyan-400 bg-cyan-950/80 shadow-lg shadow-cyan-500/50' : 'border-slate-700 bg-slate-900/90'
          }" style="border-color: ${v.color};">
            <div class="w-3 h-3 rounded-full" style="background-color: ${v.color};"></div>
          </div>

          <!-- Battery % Badge -->
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full font-mono text-[9px] font-black tracking-tight shadow-md ${battBg}">
            ${v.batteryPct}%
          </div>

          <!-- Vehicle Callsign Tag -->
          <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-slate-950/90 text-white border border-slate-700 font-mono text-[9px] font-bold whitespace-nowrap shadow-md">
            ${v.callsign}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: 'vehicle-marker-icon',
        iconSize: [36, 36],
      });

      let marker = markersRef.current.get(v.id);
      if (!marker) {
        marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
        marker.on('click', () => {
          setSelectedVehicle(v);
          setActiveTwinVehicle(v); // CLICK -> OPENS WF08 BATTERY TWIN!
        });
        markersRef.current.set(v.id, marker);
      } else {
        marker.setLatLng([v.lat, v.lng]);
        marker.setIcon(icon);
      }
    });
  }, [vehicles, selectedVehicle]);

  // Movement Simulation Engine (moves all 10 vehicles smoothly along waypoint paths)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          const currentTarget = v.waypoints[v.waypointIndex];
          const dLat = currentTarget[0] - v.lat;
          const dLng = currentTarget[1] - v.lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);

          let nextLat = v.lat;
          let nextLng = v.lng;
          let nextIndex = v.waypointIndex;

          const stepSpeed = 0.00018 * simSpeed;

          if (dist < stepSpeed) {
            // Target waypoint reached, cycle to next
            nextIndex = (v.waypointIndex + 1) % v.waypoints.length;
            nextLat = currentTarget[0];
            nextLng = currentTarget[1];
          } else {
            nextLat = v.lat + (dLat / dist) * stepSpeed;
            nextLng = v.lng + (dLng / dist) * stepSpeed;
          }

          // Subtle battery decay and temperature fluctuation
          const batteryDecay = Math.random() < 0.08 ? 1 : 0;
          const newBattery = Math.max(12, v.batteryPct - batteryDecay);

          // Update trail history (keep last 12 points)
          const newTrail: [number, number][] = [...v.trail.slice(-11), [nextLat, nextLng]];

          return {
            ...v,
            lat: nextLat,
            lng: nextLng,
            batteryPct: newBattery,
            waypointIndex: nextIndex,
            trail: newTrail,
          };
        })
      );
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  const handleOpenTwin = (veh: Vehicle) => {
    setSelectedVehicle(veh);
    setActiveTwinVehicle(veh);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400">
              <Navigation className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase tracking-wider">
                  WF14 · FLEET MAP
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  10 VEHICLES ACTIVE · REAL-TIME TRAILS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  CLICK VEHICLE → OPENS WF08
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Autonomous Defense Fleet Geospatial Command
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Live interactive Leaflet vector map with 10 vehicles moving with historical breadcrumb trails, dynamic battery % badges, and one-click 3D Battery Twin drill-down.
              </p>
            </div>
          </div>

          {/* Action Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                isPlaying
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Sim' : 'Resume Sim'}</span>
            </button>

            {/* Sim Speed Selectors */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    simSpeed === spd
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Reset Positions */}
            <button
              onClick={() => setVehicles(INITIAL_VEHICLES)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
              title="Reset All Vehicles to Origin"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded WF08 Battery Twin Modal / Overlay when active */}
      {activeTwinVehicle && (
        <div className="relative">
          <WF08BatteryTwin
            vehicleId={activeTwinVehicle.id}
            vehicleName={`${activeTwinVehicle.name} (${activeTwinVehicle.callsign})`}
            onClose={() => setActiveTwinVehicle(null)}
          />
        </div>
      )}

      {/* Main Map & Side Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaflet Map Canvas (3 Columns) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative h-[560px]">
          {/* Leaflet Div */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 font-mono text-xs shadow-lg space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
              <Crosshair className="w-4 h-4" />
              <span>DEFENSE FLEET THEATER: SF BAY AREA</span>
            </div>
            <div className="text-[11px] text-slate-400">
              10 Vehicles Armed · 270Hz Mesh Sync · Click vehicle marker or row below to open WF08 3D Twin.
            </div>
          </div>
        </div>

        {/* Side Vehicle Telemetry Feed (1 Column) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <span className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              Fleet Units (10)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              ALL NOMINAL
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
            {vehicles.map((v) => {
              const isSelected = selectedVehicle?.id === v.id;
              const isTwinOpen = activeTwinVehicle?.id === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => handleOpenTwin(v)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                    isTwinOpen
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50'
                      : isSelected
                      ? 'bg-slate-800 border-slate-600'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: v.color }}
                      />
                      <span className="text-xs font-bold text-white">{v.name}</span>
                    </div>

                    {/* Battery % Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        v.batteryPct > 70
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : v.batteryPct > 40
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {v.batteryPct}% SoC
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Speed: <strong className="text-slate-200">{v.speedKmh} km/h</strong></span>
                    <span>Temp: <strong className={v.tempC > 50 ? 'text-rose-400' : 'text-slate-200'}>{v.tempC}°C</strong></span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 uppercase">{v.role}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTwin(v);
                      }}
                      className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Open 3D Twin</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WF14FleetMap;
