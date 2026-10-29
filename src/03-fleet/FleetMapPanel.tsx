import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Battery,
  Compass,
  Gauge,
  MapPin,
  Maximize2,
  Navigation,
  Radio,
  Search,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { FleetVehicle, VehicleId } from './types';
import { useFleetMesh } from './FleetMeshContext';

export const FleetMapPanel: React.FC = () => {
  const {
    fleet,
    activeVehicleId,
    selectVehicle,
    selectVehicleAndInspectBattery,
  } = useFleetMesh();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedVehicleId, setSelectedVehicleId] = useState<VehicleId>(activeVehicleId);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showTrails, setShowTrails] = useState<boolean>(true);

  // Sync selected vehicle with context
  useEffect(() => {
    setSelectedVehicleId(activeVehicleId);
  }, [activeVehicleId]);

  const activeVehicle = useMemo(() => {
    return fleet.find((v) => v.id === selectedVehicleId) || fleet[0];
  }, [fleet, selectedVehicleId]);

  // Map coordinate conversion: Center coordinates around Giga Texas (lat: 30.2223, lng: -97.6171)
  const MAP_CENTER_LAT = 30.2223;
  const MAP_CENTER_LNG = -97.6171;
  const MAP_WIDTH_KM = 12 / zoomLevel;
  const MAP_HEIGHT_KM = 8 / zoomLevel;

  // Converts GPS (lat, lng) to canvas coordinate percentages (0% to 100%)
  const gpsToMapPercent = (lat: number, lng: number) => {
    // 1 deg lat ~ 111 km
    const dLatKm = (lat - MAP_CENTER_LAT) * 111;
    // 1 deg lng ~ 111 * cos(lat) km (~96 km at lat 30)
    const dLngKm = (lng - MAP_CENTER_LNG) * 96;

    const xPct = 50 + (dLngKm / MAP_WIDTH_KM) * 100;
    const yPct = 50 - (dLatKm / MAP_HEIGHT_KM) * 100;

    return {
      x: Math.max(2, Math.min(98, xPct)),
      y: Math.max(2, Math.min(98, yPct)),
    };
  };

  const filteredFleet = useMemo(() => {
    if (filterStatus === 'ALL') return fleet;
    return fleet.filter((v) => v.status === filterStatus);
  }, [fleet, filterStatus]);

  const handleSelectVehicle = (id: VehicleId) => {
    setSelectedVehicleId(id);
    selectVehicle(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                WF14 • FLEET MESH DISPATCH
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                FLIGHTRADAR-STYLE TRAILS
              </span>
              <span className="text-xs text-slate-400">
                Fleet Status: <strong className="text-emerald-400">{fleet.length} Units Online</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Autonomous Fleet Radar &amp; Telemetry Mesh
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Real-time vector radar with historical velocity trails, live battery state of charge badges, vehicle heartbeat telemetry, and 1-click inspection of the 3D battery digital twin.
            </p>
          </div>

          {/* Quick Action: 3D Battery Twin Jump Button */}
          <button
            onClick={() => selectVehicleAndInspectBattery(selectedVehicleId)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 transition cursor-pointer self-start lg:self-auto shrink-0"
            title="Inspect 3D Battery Explode View in WF08"
          >
            <Zap className="w-4 h-4 text-cyan-200" />
            <span>Inspect 3D Battery Twin (WF08)</span>
            <ArrowRight className="w-4 h-4 text-cyan-200" />
          </button>
        </div>
      </div>

      {/* Main Map & Telemetry Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Map Canvas Container */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Map Controls Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold mr-1">Status:</span>
              {['ALL', 'ACTIVE_MISSION', 'HIGHWAY_PILOT', 'PATROL_ROUTE', 'FAST_CHARGING'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    filterStatus === st
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Map Options */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setShowTrails((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition ${
                  showTrails
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                Trails {showTrails ? 'ON' : 'OFF'}
              </button>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="px-2 py-0.5 hover:text-white text-slate-400 font-bold"
                >
                  +
                </button>
                <span className="px-1 text-[11px] font-mono text-slate-400">{zoomLevel.toFixed(1)}x</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                  className="px-2 py-0.5 hover:text-white text-slate-400 font-bold"
                >
                  -
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Radar Map Canvas */}
          <div className="relative h-[540px] bg-[#050b14] overflow-hidden select-none">
            {/* Proving Grounds / Giga Facility Map Vector Markings */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              {/* Radial radar distance rings */}
              <circle cx="50%" cy="50%" r="120" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="3 3" />
              <circle cx="50%" cy="50%" r="220" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="4 4" />
              <circle cx="50%" cy="50%" r="320" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="5 5" />
              {/* Facility Sector lines */}
              <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2 4" />
              <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2 4" />

              {/* High-speed Testing Oval Loop */}
              <ellipse cx="50%" cy="48%" rx="240" ry="110" fill="none" stroke="#334155" strokeWidth="4" />
              <ellipse cx="50%" cy="48%" rx="240" ry="110" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 8" />

              {/* Supercharger Hub Pad */}
              <rect x="48%" y="46%" width="45" height="30" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1.5" />
              <text x="49%" y="48.5%" fill="#22c55e" fontSize="9" fontFamily="monospace">MEGA-V4</text>
            </svg>

            {/* FlightRadar-Style Real-Time Historical Trails */}
            {showTrails && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {filteredFleet.map((vehicle) => {
                  if (vehicle.trail.length < 2) return null;
                  const isTarget = vehicle.id === selectedVehicleId;
                  const trailPoints = vehicle.trail.map((tp) => {
                    const coords = gpsToMapPercent(tp.lat, tp.lng);
                    return `${coords.x}%,${coords.y}%`;
                  });

                  return (
                    <polyline
                      key={`trail-${vehicle.id}`}
                      points={trailPoints.join(' ')}
                      fill="none"
                      stroke={isTarget ? '#06b6d4' : '#64748b'}
                      strokeWidth={isTarget ? 3.5 : 2}
                      strokeOpacity={isTarget ? 0.85 : 0.45}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}
              </svg>
            )}

            {/* Live Vehicle Markers on the Map */}
            {filteredFleet.map((vehicle) => {
              const coords = gpsToMapPercent(vehicle.lat, vehicle.lng);
              const isSelected = vehicle.id === selectedVehicleId;

              // Battery color coding
              const batColor =
                vehicle.batteryPct > 65
                  ? 'bg-emerald-500 text-emerald-300 border-emerald-700'
                  : vehicle.batteryPct > 35
                  ? 'bg-amber-500 text-amber-300 border-amber-700'
                  : 'bg-rose-500 text-rose-300 border-rose-700';

              return (
                <div
                  key={vehicle.id}
                  onClick={() => handleSelectVehicle(vehicle.id)}
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-20 cursor-pointer group transition-all duration-300`}
                >
                  {/* Vehicle Marker: Directional Arrow & Icon */}
                  <div className="relative flex flex-col items-center">
                    {/* Battery % Badge directly visible on Map! */}
                    <div
                      className={`mb-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 shadow-md bg-slate-950/90 border ${
                        isSelected ? 'border-cyan-400 text-cyan-300' : 'border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${batColor.split(' ')[0]}`} />
                      <span>{Math.round(vehicle.batteryPct)}%</span>
                      {vehicle.status === 'FAST_CHARGING' && <Zap className="w-2.5 h-2.5 text-amber-400" />}
                    </div>

                    {/* Directional Heading Icon */}
                    <div
                      style={{ transform: `rotate(${vehicle.headingDeg}deg)` }}
                      className={`p-2 rounded-full transition-transform ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 shadow-lg'
                          : 'bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Navigation className="w-4 h-4 fill-current" />
                    </div>

                    {/* Vehicle ID label */}
                    <span className="mt-1 text-[10px] font-mono font-bold text-white px-1 rounded bg-slate-950/80 border border-slate-800 whitespace-nowrap">
                      {vehicle.id}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-30 bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs font-mono backdrop-blur-md space-y-1.5 shadow-xl">
              <div className="text-white font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Austin Giga Proving Ground</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Lat: {activeVehicle.lat.toFixed(4)}° N</span>
                <span>Lng: {activeVehicle.lng.toFixed(4)}° W</span>
              </div>
              <div className="text-[10px] text-cyan-400">
                Click any marker to inspect battery twin in WF08
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Vehicle Telemetry & Heartbeat Details */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Vehicle Telemetry Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  SELECTED VEHICLE TELEMETRY
                </span>
                <h3 className="text-base font-bold text-white">{activeVehicle.name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                {activeVehicle.id}
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div className="text-slate-400 text-[11px]">{activeVehicle.model}</div>
              <div className="font-mono text-[11px] text-slate-400">VIN: {activeVehicle.vin}</div>
            </div>

            {/* Heartbeat & Vitality Telemetry */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Vehicle Heartbeat Vitality</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {activeVehicle.heartbeatMs} ms cadence
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs pt-1">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Ping Latency</span>
                  <span className="text-cyan-400 font-bold">{activeVehicle.pingMs} ms</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">RF RSSI</span>
                  <span className="text-emerald-400 font-bold">{activeVehicle.rssiDb} dBm</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Alt (MSL)</span>
                  <span className="text-white font-bold">{activeVehicle.altitudeM} m</span>
                </div>
              </div>
            </div>

            {/* Speed, Heading, Battery & Range Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Ground Speed</span>
                <span className="text-xl font-bold text-white">{activeVehicle.speedKmh} km/h</span>
                <span className="text-slate-400 text-[10px] block mt-0.5">Heading: {activeVehicle.headingDeg}°</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Battery Level</span>
                <span className="text-xl font-bold text-emerald-400">{Math.round(activeVehicle.batteryPct)}%</span>
                <span className="text-slate-400 text-[10px] block mt-0.5">Range: ~{activeVehicle.rangeKm} km</span>
              </div>
            </div>

            {/* Battery Twin Preview & Hotspot Warning */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Battery Pack Architecture</span>
                <span className="text-[10px] font-mono text-cyan-300">{activeVehicle.batteryTwin.cellChemistry}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>Pack Capacity: <strong className="text-white">{activeVehicle.batteryTwin.packCapacityKwh} kWh</strong></div>
                <div>Pack Voltage: <strong className="text-white">{activeVehicle.batteryTwin.nominalVoltageV} V</strong></div>
                <div>Max Cell Temp: <strong className={activeVehicle.batteryTwin.maxCellTempC > 48 ? 'text-rose-400' : 'text-emerald-400'}>
                  {activeVehicle.batteryTwin.maxCellTempC}°C
                </strong></div>
                <div>Pump Speed: <strong className="text-cyan-400">{activeVehicle.batteryTwin.pumpRpm} RPM</strong></div>
              </div>
            </div>

            {/* Primary CTA: Jump to 3D Explode View */}
            <button
              onClick={() => selectVehicleAndInspectBattery(activeVehicle.id)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>Explode 3D Battery Pack (WF08)</span>
              <ChevronRight className="w-4 h-4 text-cyan-200" />
            </button>
          </div>

          {/* Quick Vehicle Selector Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-300 block mb-1">Fleet Vehicles ({fleet.length})</span>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {fleet.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVehicle(v.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 text-cyan-300 border border-cyan-500/60 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850 border border-transparent'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold text-white truncate">{v.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{v.id} · {v.speedKmh} km/h</div>
                    </div>
                    <div className="text-right font-mono text-xs font-bold text-emerald-400">
                      {Math.round(v.batteryPct)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
