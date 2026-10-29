import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  HardDrive,
  Cpu,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface FleetFeature {
  id: string;
  name: string;
  entity: string;
  dataType: string;
  onlineLatencyMs: number;
  offlineStorage: string;
  freshnessSec: number;
  driftPsi: number;
  judgeStatus: 'PASS' | 'FAIL';
  judgeVerdictReason: string;
  lastUpdated: string;
  sampleValue: string | number;
}

const DEFAULT_FEATURES: FleetFeature[] = [
  {
    id: 'feat-01',
    name: 'battery_cell_temp_delta',
    entity: 'pack_id',
    dataType: 'Float64',
    onlineLatencyMs: 1.2,
    offlineStorage: 'Parquet / S3',
    freshnessSec: 1,
    driftPsi: 0.012,
    judgeStatus: 'PASS',
    judgeVerdictReason: 'Thermal gradient within strict 3.5σ bounds. Zero nulls detected.',
    lastUpdated: 'Just now',
    sampleValue: '26.8 °C',
  },
  {
    id: 'feat-02',
    name: 'thermal_runaway_early_hazard_score',
    entity: 'vehicle_id',
    dataType: 'Float32',
    onlineLatencyMs: 0.8,
    offlineStorage: 'Redis Cluster',
    freshnessSec: 2,
    driftPsi: 0.245,
    judgeStatus: 'FAIL',
    judgeVerdictReason: 'PSI 0.245 exceeds safety threshold (0.10). Anomaly distribution shifted.',
    lastUpdated: '12s ago',
    sampleValue: '0.84 (CRITICAL)',
  },
  {
    id: 'feat-03',
    name: 'inverter_switching_jitter_us',
    entity: 'powertrain_id',
    dataType: 'Float64',
    onlineLatencyMs: 1.8,
    offlineStorage: 'Parquet / S3',
    freshnessSec: 1,
    driftPsi: 0.008,
    judgeStatus: 'PASS',
    judgeVerdictReason: 'IGBT gate timing verified at 270Hz synchronous clock.',
    lastUpdated: 'Just now',
    sampleValue: '0.04 µs',
  },
  {
    id: 'feat-04',
    name: 'wheel_slip_traction_loss_ratio',
    entity: 'wheel_sensor',
    dataType: 'Float32',
    onlineLatencyMs: 1.1,
    offlineStorage: 'DuckDB In-Memory',
    freshnessSec: 3,
    driftPsi: 0.174,
    judgeStatus: 'FAIL',
    judgeVerdictReason: 'Missing key rate (4.8%) exceeds allowable 1.0% production ceiling.',
    lastUpdated: '24s ago',
    sampleValue: '0.19',
  },
  {
    id: 'feat-05',
    name: 'state_of_health_degradation_slope',
    entity: 'pack_id',
    dataType: 'Float64',
    onlineLatencyMs: 4.5,
    offlineStorage: 'Delta Lake',
    freshnessSec: 5,
    driftPsi: 0.034,
    judgeStatus: 'PASS',
    judgeVerdictReason: 'Coulomb counting degradation regression slope validated.',
    lastUpdated: 'Just now',
    sampleValue: '-0.0012 %/kmi',
  },
  {
    id: 'feat-06',
    name: 'can_bus_frame_drop_counter',
    entity: 'ecu_gateway',
    dataType: 'Int64',
    onlineLatencyMs: 0.6,
    offlineStorage: 'ClickHouse',
    freshnessSec: 1,
    driftPsi: 0.003,
    judgeStatus: 'PASS',
    judgeVerdictReason: 'Zero frame drop corruption across all 10 defense vehicles.',
    lastUpdated: 'Just now',
    sampleValue: '0 drops',
  },
  {
    id: 'feat-07',
    name: 'motor_stator_phase_a_temp',
    entity: 'powertrain_id',
    dataType: 'Float64',
    onlineLatencyMs: 1.4,
    offlineStorage: 'Parquet / S3',
    freshnessSec: 2,
    driftPsi: 0.019,
    judgeStatus: 'PASS',
    judgeVerdictReason: 'Steady-state temperature within coolant loop capacity.',
    lastUpdated: 'Just now',
    sampleValue: '52.4 °C',
  },
  {
    id: 'feat-08',
    name: 'regenerative_flux_energy_recovered',
    entity: 'vehicle_id',
    dataType: 'Float64',
    onlineLatencyMs: 2.2,
    offlineStorage: 'Snowflake',
    freshnessSec: 4,
    driftPsi: 0.027,
    judgeStatus: 'PASS',
    judgeVerdictReason: 'Energy regeneration matches mechanical deceleration kinematics.',
    lastUpdated: 'Just now',
    sampleValue: '184.2 kWh',
  },
];

export const WF09FeatureStore: React.FC = () => {
  const [features, setFeatures] = useState<FleetFeature[]>(DEFAULT_FEATURES);
  const [filterMode, setFilterMode] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [quarantineCount, setQuarantineCount] = useState<number>(2);

  // Trigger autonomous judge re-evaluation
  const handleRunJudgeAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setFeatures((prev) =>
        prev.map((f) => ({
          ...f,
          lastUpdated: 'Just audited',
        }))
      );
      setIsAuditing(false);
    }, 900);
  };

  const handleQuarantineFailed = () => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.judgeStatus === 'FAIL'
          ? {
              ...f,
              judgeVerdictReason: 'QUARANTINED · Offline buffer halted for safety inspection.',
            }
          : f
      )
    );
  };

  const filteredFeatures = features.filter((f) => {
    const matchesFilter =
      filterMode === 'ALL' ? true : f.judgeStatus === filterMode;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.judgeVerdictReason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const passCount = features.filter((f) => f.judgeStatus === 'PASS').length;
  const failCount = features.filter((f) => f.judgeStatus === 'FAIL').length;
  const passRate = Math.round((passCount / features.length) * 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              WF09 · FEATURE STORE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              AUTONOMOUS QUALITY JUDGE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              ONLINE & OFFLINE DUAL STORE
            </span>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Production Feature Catalog with Autonomous Judge
          </h2>
          <p className="text-xs text-slate-400">
            Real-time low-latency feature serving with continuous PSI drift testing, null guards, and deterministic Judge PASS/FAIL gating.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunJudgeAudit}
            disabled={isAuditing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              isAuditing
                ? 'bg-purple-600/50 text-purple-200 border border-purple-400/50'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing Features...' : 'Re-Run Judge Audit'}</span>
          </button>

          <button
            onClick={handleQuarantineFailed}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 transition cursor-pointer"
            title="Quarantine failing features from real-time inference"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Quarantine Fails ({failCount})</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Total Features
          </div>
          <div className="text-2xl font-black text-white mt-1">{features.length} Registered</div>
          <div className="text-[11px] text-slate-500 mt-1">Dual Online/Offline</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Judge Pass Rate
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{passRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{passCount} Passing · {failCount} Failing</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Avg Online Latency
          </div>
          <div className="text-2xl font-black text-white mt-1">1.5 ms</div>
          <div className="text-[11px] text-slate-500 mt-1">Redis In-Memory Tier</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Max Staleness
          </div>
          <div className="text-2xl font-black text-white mt-1">2.4 sec</div>
          <div className="text-[11px] text-emerald-400 mt-1">Zero Stream Lag</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feature name, entity, or verdict..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({features.length})
          </button>
          <button
            onClick={() => setFilterMode('PASS')}
            className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
              filterMode === 'PASS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PASS ({passCount})
          </button>
          <button
            onClick={() => setFilterMode('FAIL')}
            className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
              filterMode === 'FAIL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FAIL ({failCount})
          </button>
        </div>
      </div>

      {/* Feature Store Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-bold">Feature Name</th>
              <th className="py-3 px-4 font-bold">Entity</th>
              <th className="py-3 px-4 font-bold">Latency</th>
              <th className="py-3 px-4 font-bold">Offline Sink</th>
              <th className="py-3 px-4 font-bold">PSI Drift</th>
              <th className="py-3 px-4 font-bold">Judge Verdict</th>
              <th className="py-3 px-4 font-bold">Live Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredFeatures.map((feat) => (
              <tr key={feat.id} className="hover:bg-slate-900/50 transition">
                <td className="py-3 px-4 font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">{feat.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {feat.dataType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 max-w-sm truncate" title={feat.judgeVerdictReason}>
                    {feat.judgeVerdictReason}
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                    {feat.entity}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-200 font-bold">
                  {feat.onlineLatencyMs} ms
                </td>
                <td className="py-3 px-4 text-slate-400 text-[11px]">
                  {feat.offlineStorage}
                </td>
                <td className="py-3 px-4 font-bold">
                  <span className={feat.driftPsi > 0.1 ? 'text-rose-400' : 'text-slate-300'}>
                    {feat.driftPsi}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {feat.judgeStatus === 'PASS' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-black">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      FAIL
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-bold text-slate-200">
                  {feat.sampleValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WF09FeatureStore;
