import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  Terminal,
  Play,
  Pause,
  RefreshCw,
  Send,
  Database,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Workflow,
  ArrowRight,
  Lock,
  Cloud,
  Car,
  Bot,
  Zap,
  Code2,
  ExternalLink,
  ChevronRight,
  Server,
  Radio,
} from 'lucide-react';
import {
  ConnectivityNode,
  AppIntegrationBridge,
  CanBusFrame,
  Ros2TopicMessage,
  ScriptExecutionResult,
  AiTaskExecutionPlan,
} from '../../types/industrial';
import {
  INITIAL_CONNECTIVITY_NODES,
  INITIAL_APP_BRIDGES,
  generateCanBusTelemetry,
  generateRos2Telemetry,
  runJavaScriptSandbox,
  runPythonSandbox,
  planAiAutonomousTask,
  triggerBridgeSync,
} from '../../utils/universalConnectivityEngine';

export const UniversalConnectivityStudio: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'telemetry' | 'bridges' | 'sandbox' | 'ai_orchestrator'>('telemetry');

  // Streaming State
  const [nodes, setNodes] = useState<ConnectivityNode[]>(INITIAL_CONNECTIVITY_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_car_tesla_can');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSeq, setStreamSeq] = useState<number>(0);

  // Live Telemetry
  const [currentCanFrame, setCurrentCanFrame] = useState<CanBusFrame>(() => generateCanBusTelemetry(0));
  const [currentRos2Msg, setCurrentRos2Msg] = useState<Ros2TopicMessage>(() => generateRos2Telemetry(0));

  // App Bridges
  const [bridges, setBridges] = useState<AppIntegrationBridge[]>(INITIAL_APP_BRIDGES);
  const [lastSyncResult, setLastSyncResult] = useState<{ bridgeName: string; eventId: string; latencyMs: number; details: string } | null>(null);

  // Code Sandbox State
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'javascript'>('python');
  const [pythonCode, setPythonCode] = useState<string>(`# Automated Tesla Fleet & Robot Inspection Script
import math

# Ingest live telemetry from active CAN & ROS2 streams
pack_voltage = 402.5
pack_current = -38.2
max_cell_temp = 33.6
robot_shoulder_torque = 68.4

print(f"Ingested Pack Voltage: {pack_voltage} V | Pack Current: {pack_current} A")
print(f"Max Cell Temp: {max_cell_temp} °C | Shoulder Torque: {robot_shoulder_torque} Nm")

# Verify critical engineering assertions
assert max_cell_temp < 45.0, "Battery thermal runaway threshold exceeded!"
assert pack_voltage > 350.0, "Pack undervoltage fault!"
assert robot_shoulder_torque < 90.0, "Robot joint torque exceeds rated continuous limit!"

# Compute healthy state index
cell_health_score = 100.0 - (max_cell_temp - 25.0) * 1.5
print(f"Computed Fleet Health Index: {cell_health_score:.1f}%")

return {
    "status": "NOMINAL",
    "fleet_health": cell_health_score,
    "actions_required": False
}
`);

  const [javascriptCode, setJavascriptCode] = useState<string>(`// n8n & Supabase Realtime Event Dispatcher
const v = telemetry.packVoltage || 402.5;
const temp = telemetry.cellTempMax || 33.6;

console.log("Telemetry check -> Voltage:", v, "V | Temp:", temp, "°C");

// Run safety assertions
assert(temp < 45.0, "Battery temperature within safe thermal window");
assert(v > 350.0 && v < 450.0, "High-voltage traction bus within operating bounds");

// Return structured advisory dispatch packet
return {
  status: "VERIFIED_ADVISORY",
  dispatchedTo: ["n8n_webhook", "supabase_cdc", "m365_excel"],
  telemetrySnapshot: { voltage: v, cellTemp: temp },
  timestamp: new Date().toISOString()
};
`);

  const [executionResult, setExecutionResult] = useState<ScriptExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // AI Autonomous Task Controller State
  const [aiPrompt, setAiPrompt] = useState<string>(
    'Connect to Tesla CAN bus battery pack, verify cell temperature < 40°C, and dispatch alert to n8n webhook and Supabase'
  );
  const [aiPlan, setAiPlan] = useState<AiTaskExecutionPlan | null>(null);
  const [isAiPlanning, setIsAiPlanning] = useState<boolean>(false);

  // Streaming Interval
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      interval = setInterval(() => {
        setStreamSeq((prev) => {
          const next = prev + 1;
          setCurrentCanFrame(generateCanBusTelemetry(next));
          setCurrentRos2Msg(generateRos2Telemetry(next));

          // Jitter packet rates slightly for true telemetry feel
          setNodes((oldNodes) =>
            oldNodes.map((n) => ({
              ...n,
              totalPackets: n.totalPackets + Math.floor(n.packetRateHz * 0.5),
              latencyMs: Math.max(4, Math.min(60, n.latencyMs + Math.floor((Math.random() - 0.5) * 4))),
              lastUpdated: new Date().toISOString(),
            }))
          );
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Code Execution Handler
  const handleRunCode = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const activeNode = nodes.find((n) => n.id === selectedNodeId);
      const context = {
        telemetry: activeNode?.lastPayload || currentCanFrame.signals,
        nodes,
        bridges,
      };

      if (codeLanguage === 'python') {
        const res = runPythonSandbox(pythonCode, context);
        setExecutionResult(res);
      } else {
        const res = runJavaScriptSandbox(javascriptCode, context);
        setExecutionResult(res);
      }
      setIsExecuting(false);
    }, 150);
  };

  // AI Task Planning Handler
  const handleGenerateAiPlan = () => {
    setIsAiPlanning(true);
    setTimeout(() => {
      const plan = planAiAutonomousTask(aiPrompt, { nodes, bridges });
      setAiPlan(plan);
      setIsAiPlanning(false);
    }, 350);
  };

  // Trigger Bridge Webhook Sync Handler
  const handleTriggerBridge = (bridgeId: string) => {
    const bridge = bridges.find((b) => b.id === bridgeId);
    if (!bridge) return;

    const payload = {
      event: 'manual_telemetry_sync',
      node: selectedNodeId,
      canId: currentCanFrame.canId,
      ros2Topic: currentRos2Msg.topic,
      timestamp: new Date().toISOString(),
    };

    const res = triggerBridgeSync(bridgeId, payload);
    setLastSyncResult({
      bridgeName: bridge.name,
      eventId: res.eventId,
      latencyMs: res.latencyMs,
      details: res.details,
    });

    setBridges((prev) =>
      prev.map((b) =>
        b.id === bridgeId
          ? {
              ...b,
              lastSyncTimestamp: res.syncedAt,
              syncedRecordCount: b.syncedRecordCount + 1,
              syncStatus: 'SYNCED',
            }
          : b
      )
    );
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* TOP HEADER: TEN-BILLION-DOLLAR COMMAND DOCK                      */}
      {/* ================================================================ */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950/70 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                UNIVERSAL FLEET CONNECTIVITY &amp; MULTI-APP ENGINE
              </span>
              <span aria-hidden="true">·</span>
              <span>ROS2 / CAN / OPC-UA / n8n / Supabase / M365</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Universal Robotics, Automotive &amp; Cloud Mesh</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Industrial-grade bidirectional telemetry fabric uniting robots (UR10e, KUKA), autonomous vehicles (Tesla CAN Bus, J1939), PLCs (Siemens), and enterprise cloud tools (n8n, Supabase, Excel, SQL) into one coordinated advisory system.
            </p>
          </div>

          {/* Quick Telemetry Indicators & Streaming Pause/Play */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Mesh Throughput</div>
              <div className="text-sm font-bold text-cyan-300">~270 Hz · 10 Nodes</div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Safety Gate</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ADVISORY READ
              </div>
            </div>

            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md ${
                isStreaming
                  ? 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
              }`}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isStreaming ? 'Pause Mesh' : 'Resume Mesh'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Segmented Control - Zero Pill Discipline) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>01. Fleet &amp; Machinery Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('bridges')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'bridges'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Workflow className="w-4 h-4 text-indigo-400" />
            <span>02. App &amp; Web Bridge (n8n, Supabase, M365)</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>03. Dual Python &amp; JavaScript Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_orchestrator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'ai_orchestrator'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>04. AI Autonomous Fleet Co-Pilot</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: FLEET & MACHINERY TELEMETRY (ROBOTS, CARS, PLCS)          */}
      {/* ================================================================ */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Node Selector List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
              <span>CONNECTED MACHINERY ({nodes.length})</span>
              <span>STATUS</span>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {nodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {node.category === 'vehicle' ? (
                          <Car className="w-4 h-4 text-cyan-400 shrink-0" />
                        ) : node.category === 'robot' ? (
                          <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
                        ) : node.category === 'machinery' ? (
                          <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Cloud className="w-4 h-4 text-purple-400 shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-white truncate max-w-[170px]">{node.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{node.protocol}</div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-[10px] text-emerald-400 font-bold block">{node.status}</span>
                        <span className="text-[9px] text-slate-500">{node.latencyMs}ms</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Rate: {node.packetRateHz} Hz</span>
                      <span>Total: {node.totalPackets.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Node Telemetry Dashboard (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Active Node Detail Header */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-cyan-400 font-bold uppercase">{selectedNode.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedNode.protocol}</span>
                  <span aria-hidden="true">·</span>
                  <span>Auth: {selectedNode.authType}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedNode.name}</h3>
                <code className="text-[11px] text-slate-400 font-mono">{selectedNode.endpointUrl}</code>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-500 block">Packet Counter</span>
                  <span className="text-white font-bold">{selectedNode.totalPackets.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-500 block">Sampling Rate</span>
                  <span className="text-cyan-300 font-bold">{selectedNode.packetRateHz} Hz</span>
                </div>
              </div>
            </div>

            {/* Scenario A: Automotive CAN Bus Live Telemetry Display */}
            {selectedNode.category === 'vehicle' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(currentCanFrame.signals).map(([sigKey, sig]) => (
                    <div key={sigKey} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase truncate block">
                        {sig.description}
                      </span>
                      <div className="text-lg font-bold font-mono text-white">
                        {sig.value}{' '}
                        <span className="text-xs font-normal text-cyan-400">{sig.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Raw CAN Frame Byte Matrix */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Raw Controller Area Network (CAN) Frame Payload:</span>
                    </span>
                    <span className="text-cyan-300">ID: {currentCanFrame.canId} ({currentCanFrame.name})</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {currentCanFrame.dataBytes.map((byte, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center font-bold text-cyan-300"
                      >
                        <span className="text-[9px] text-slate-500 block">D{idx}</span>
                        <span>0x{byte.toString(16).padStart(2, '0').toUpperCase()}</span>
                      </div>
                    ))}
                    <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-[11px]">
                      DLC: {currentCanFrame.dlc} Bytes · CRC OK
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scenario B: Robotics ROS2 Joint State Telemetry Display */}
            {selectedNode.category === 'robot' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      <span>ROS2 Topic: {currentRos2Msg.topic}</span>
                    </span>
                    <span className="text-emerald-400 font-bold">{currentRos2Msg.data.safety_status}</span>
                  </div>

                  {/* 6 Joint Telemetry Bars */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {currentRos2Msg.data.joint_names.map((jName: string, idx: number) => {
                      const pos = currentRos2Msg.data.position_rad[idx];
                      const torque = currentRos2Msg.data.effort_nm[idx];
                      return (
                        <div key={jName} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs">
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span className="font-bold text-white capitalize">{jName.replace('_', ' ')}</span>
                            <span>J{idx + 1}</span>
                          </div>
                          <div className="text-cyan-300">
                            θ: <strong>{(pos * (180 / Math.PI)).toFixed(1)}°</strong> ({pos.toFixed(3)} rad)
                          </div>
                          <div className="text-indigo-300">
                            Torque: <strong>{torque} Nm</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Scenario C: General Machinery / PLC / Cloud */}
            {(selectedNode.category === 'machinery' || selectedNode.category === 'software_app' || selectedNode.category === 'database') && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white">Live Registers / Synced Payload</span>
                  <span className="text-slate-400">{selectedNode.lastUpdated}</span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(selectedNode.lastPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: APP & WEB INTEGRATION BRIDGE (N8N, SUPABASE, EXCEL, SQL)  */}
      {/* ================================================================ */}
      {activeTab === 'bridges' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>ACTIVE WEBHOOK &amp; CLOUD CONNECTORS ({bridges.length})</span>
            <span className="text-cyan-400 font-bold">BI-DIRECTIONAL DATA FABRIC ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bridges.map((br) => (
              <div
                key={br.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    {br.targetApp === 'n8n' ? (
                      <Workflow className="w-5 h-5 text-indigo-400" />
                    ) : br.targetApp === 'supabase' ? (
                      <Database className="w-5 h-5 text-emerald-400" />
                    ) : br.targetApp === 'excel' ? (
                      <FileSpreadsheet className="w-5 h-5 text-green-400" />
                    ) : br.targetApp === 'word' ? (
                      <FileText className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Server className="w-5 h-5 text-cyan-400" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">{br.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">{br.webhookUrl}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {br.syncStatus}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[10px] text-slate-300 space-y-1">
                  <div className="text-slate-500">Payload Pattern:</div>
                  <code className="text-cyan-300 block truncate">{br.payloadTemplate}</code>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    Synced Records: <strong className="text-white">{br.syncedRecordCount.toLocaleString()}</strong>
                  </span>
                  <button
                    onClick={() => handleTriggerBridge(br.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>Test Webhook</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sync Result Toast Banner */}
          {lastSyncResult && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-700/60 font-mono text-xs flex items-center justify-between text-emerald-300 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Delivered to <strong>{lastSyncResult.bridgeName}</strong> · Event ID: {lastSyncResult.eventId} ({lastSyncResult.latencyMs}ms)
                </span>
              </div>
              <span className="text-[10px] text-slate-400">HTTP 200 OK</span>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: DUAL PYTHON & JAVASCRIPT CODE SANDBOX                     */}
      {/* ================================================================ */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Code Editor & Template Selector (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setCodeLanguage('python')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    codeLanguage === 'python'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Python 3.12 (NumPy/Pandas)</span>
                </button>
                <button
                  onClick={() => setCodeLanguage('javascript')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    codeLanguage === 'javascript'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>JavaScript / Node.js</span>
                </button>
              </div>

              {/* Template Presets */}
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'tesla_bms_py') {
                    setCodeLanguage('python');
                    setPythonCode(`# Tesla CAN Bus Battery Health Check
import math

pack_voltage = 402.5
cell_temp_max = 33.6

print(f"Pack Voltage: {pack_voltage} V | Cell Max Temp: {cell_temp_max} °C")
assert cell_temp_max < 45.0, "Thermal warning!"
print("Nominal State Confirmed")
return {"status": "SAFE", "temp": cell_temp_max}`);
                  } else if (val === 'robot_torque_py') {
                    setCodeLanguage('python');
                    setPythonCode(`# Robot Joint Kinetic Energy & Torque Audit
import numpy

torques = [12.4, 68.4, 38.6, 10.2, 5.8, 1.9]
mean_torque = numpy.mean(torques)
max_torque = numpy.max(torques)

print(f"Mean Arm Torque: {mean_torque:.2f} Nm | Max Shoulder: {max_torque} Nm")
assert max_torque < 85.0, "Shoulder joint limit exceeded!"
return {"mean_torque": mean_torque, "max_torque": max_torque}`);
                  }
                }}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="">Load Template...</option>
                <option value="tesla_bms_py">Python: Tesla BMS Anomaly Audit</option>
                <option value="robot_torque_py">Python: Robot Joint Torque Statistics</option>
              </select>
            </div>

            {/* Code Textarea */}
            <div className="relative">
              <textarea
                value={codeLanguage === 'python' ? pythonCode : javascriptCode}
                onChange={(e) => {
                  if (codeLanguage === 'python') setPythonCode(e.target.value);
                  else setJavascriptCode(e.target.value);
                }}
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-none shadow-inner"
                spellCheck={false}
              />
            </div>

            {/* Run Button */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Bound Globals: <code>telemetry</code>, <code>nodes</code>, <code>bridges</code>, <code>assert()</code>
              </span>
              <button
                onClick={handleRunCode}
                disabled={isExecuting}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg ${
                  isExecuting
                    ? 'bg-indigo-800 text-indigo-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white'
                }`}
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
                <span>{isExecuting ? 'Executing...' : `Execute ${codeLanguage === 'python' ? 'Python' : 'JavaScript'}`}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Execution Console & Assertion Audit (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>TERMINAL OUTPUT (STDOUT)</span>
              {executionResult && (
                <span className="text-cyan-300 font-bold">{executionResult.executionTimeMs} ms</span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs min-h-[300px] max-h-[360px] overflow-y-auto space-y-1.5 shadow-inner">
              {executionResult ? (
                <>
                  {executionResult.stdout.map((line, idx) => (
                    <div key={idx} className="text-slate-300 leading-relaxed">
                      {line}
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-850 mt-2 text-slate-400">
                    Return Value:{' '}
                    <span className="text-emerald-400 font-bold">
                      {typeof executionResult.returnedValue === 'object'
                        ? JSON.stringify(executionResult.returnedValue)
                        : String(executionResult.returnedValue)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-600 py-12 text-center space-y-1">
                  <Terminal className="w-6 h-6 mx-auto opacity-50" />
                  <p>Ready to execute script.</p>
                  <p className="text-[10px]">Click "Execute" to run against live telemetry signals.</p>
                </div>
              )}
            </div>

            {/* Test Assertions Result Box */}
            {executionResult?.assertionsResult && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-xs">
                <span className="text-[11px] font-bold text-white block">Test Assertions Passed:</span>
                {executionResult.assertionsResult.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate">{a.name}</span>
                    <span className={a.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {a.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4: AI AUTONOMOUS FLEET CO-PILOT & NATURAL LANGUAGE DISPATCH  */}
      {/* ================================================================ */}
      {activeTab === 'ai_orchestrator' && (
        <div className="space-y-5">
          {/* Natural Language Prompt Input */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Autonomous Task Controller:</span>
              </span>
              <span className="text-slate-400">Zero-Write Advisory Guardrail Active</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Give autonomous instruction (e.g. Inspect Tesla CAN bus and alert n8n)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-sans focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={handleGenerateAiPlan}
                disabled={isAiPlanning}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-purple-950/40 shrink-0"
              >
                {isAiPlanning ? 'Orchestrating...' : 'Generate Plan &amp; Run'}
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-slate-500 font-mono">Quick Prompts:</span>
              <button
                onClick={() => setAiPrompt('Connect to Tesla CAN bus battery pack, verify max cell temp < 40°C, and dispatch alert to n8n and Supabase')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer transition"
              >
                Tesla BMS ➔ n8n / Supabase Alert
              </button>
              <button
                onClick={() => setAiPrompt('Monitor UR10e robot shoulder torque; if torque > 85 Nm, compute joint velocity in Python and trigger Excel row update')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer transition"
              >
                Robot Torque ➔ Python Check ➔ Excel
              </button>
              <button
                onClick={() => setAiPrompt('Run full cross-platform health check across Tesla, KUKA, Siemens PLC and generate Word ISO audit summary')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer transition"
              >
                Multi-Fleet ISO Compliance ➔ Word
              </button>
            </div>
          </div>

          {/* Orchestration Plan & Step Ledger */}
          {aiPlan && (
            <div className="space-y-4">
              {/* Executive Summary Card */}
              <div className="p-4 rounded-xl bg-slate-950 border-2 border-purple-500/60 shadow-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                    Executive Intent Breakdown &amp; Explanation
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">EXECUTION SUCCESSFUL</span>
                </div>
                <h3 className="text-base font-bold text-white">{aiPlan.intentSummary}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiPlan.detailedExplanation}</p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                  <span className="text-slate-400">Target Systems:</span>
                  {aiPlan.targetSystems.map((sys, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                      {sys}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sequential Execution Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {aiPlan.steps.map((st) => (
                  <div key={st.stepNumber} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                        STEP {st.stepNumber}
                      </span>
                      <span className="text-emerald-400 font-bold text-[10px]">COMPLETED</span>
                    </div>
                    <div className="text-xs font-bold text-white">{st.action}</div>
                    <div className="text-[10px] font-mono text-cyan-400 truncate">{st.system}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{st.resultNote}</p>
                  </div>
                ))}
              </div>

              {/* The Brain Judge Safety Gate Audit */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block">The Brain Judge Safety Audit Gate Passed</span>
                    <span className="text-[11px] text-slate-400">{aiPlan.safetyAuditGate.advisoryWarning}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[11px]">
                  VERIFIED ADVISORY
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
