import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronDown, Bell, Settings, Plus, Layers, Filter, HardDrive, Brain, List, Mic, Home, Box, ClipboardList, Microscope, CheckCircle, BarChart2, Shield, Factory, Package, Eye, HelpCircle, Menu, Truck, AlertTriangle, Upload, Download, Cpu, Plug, Settings as SettingsIcon, Brain as BrainIcon, TrendingUp, Zap, Database, Layers as LayersIcon, ChevronRight } from 'lucide-react';
import { 
  HomeView, 
  FileView, 
  IntakeView, 
  TriageView, 
  InvestigationView, 
  ResolutionView, 
  AnalyticsView, 
  QualityView, 
  IndustrialAutomationView, 
  AddInsView, 
  ViewView, 
  HelpView 
} from './TabViews';

export const TABS_V61 = ['FILE','HOME','INTAKE','TRIAGE','INVESTIGATION','RESOLUTION','ANALYTICS','QUALITY','INDUSTRIAL AUTOMATION','ADD-INS','VIEW','HELP'] as const;
export type TabV61 = (typeof TABS_V61)[number];

export const RIBBON_GROUPS = [
  { id: 'HOME', label: 'HOME', items: [{ label: '+ New Complaint', accent: true }, { label: 'Filters' }, { label: 'Sort' }, { label: 'Columns' }, { label: 'Export' }, { label: 'Show' }] },
  { id: 'INTAKE', label: 'INTAKE', items: [{ label: 'Import From ▼', hint: 'CSV · Email · WhatsApp · QR · IoT · Voice' }, { label: '+ New Complaint', accent: true }, { label: 'Parse' }, { label: 'Bulk' }] },
  { id: 'TRIAGE', label: 'ASSIGNMENT', items: [{ label: 'Assign', hint: 'Queue · User · Role · Skill' }, { label: 'Route', hint: 'Dept · Team · Region' }, { label: 'Escalate', hint: 'L1 · L2 · L3 · Exec' }] },
  { id: 'INVESTIGATION', label: 'VALIDATION', items: [{ label: 'Validate' }, { label: 'Dedupe' }, { label: 'Merge ▼', hint: 'Keep Newest · Oldest · Manual' }, { label: 'Evidence' }, { label: 'Trust' }] },
  { id: 'RESOLUTION', label: 'RESOLUTION', items: [{ label: 'Resolve', accent: true }, { label: 'Close' }, { label: 'Rollback' }, { label: 'SLA' }] },
  { id: 'ANALYTICS', label: 'ANALYTICS', items: [{ label: 'CFO View' }, { label: 'Export Report' }, { label: 'Custom Dashboard' }, { label: 'Trend' }, { label: 'Prediction' }] },
];

const ribbonConfig: Partial<Record<TabV61, typeof RIBBON_GROUPS[number][]>> = {
  HOME: [RIBBON_GROUPS[0]], INTAKE: [RIBBON_GROUPS[1]], TRIAGE: [RIBBON_GROUPS[2]],
  INVESTIGATION: [RIBBON_GROUPS[3]], RESOLUTION: [RIBBON_GROUPS[4]], ANALYTICS: [RIBBON_GROUPS[5]],
};

export const WORKFLOW_STATS = [
  { value: '120', label: 'Core WFs', color: 'bg-teal-100 text-teal-700' },
  { value: '15', label: 'Add-ins', color: 'bg-purple-100 text-purple-700' },
  { value: '940%', label: 'ROI', color: 'bg-emerald-100 text-emerald-700' },
  { value: '18d', label: 'Breakeven', color: 'bg-amber-100 text-amber-700' },
];

export const COMPLAINT_RECORDS = [
  { id: '#C-10284', complaint: 'Leak on Line 7 Seal Degradation', status: 'In Triage', owner: 'M. Khan', loss: '$12,450', sla: '78%', trust: '#142 • Verified ✅' },
  { id: '#C-10277', complaint: 'Pressure Spike at Valve 3', status: 'Active', owner: 'J. Ruiz', loss: '$9,300', sla: '95%', trust: '#142 • Verified' },
  { id: '#C-10290', complaint: 'Fanuc Robot Joint 3 Over-Torque', status: 'Active', owner: 'Robotics Team', loss: '$28,900', sla: '45m', trust: '#140 • Verified' },
  { id: '#C-10287', complaint: 'Batch #441 Nitrile Elastomer Hardness', status: 'Under Review', owner: 'Quality Lead', loss: '$18,200', sla: '14h 20m', trust: '#139 • Verified' },
  { id: '#C-10288', complaint: 'Battery Pack #982 Cell Voltage Imbalance', status: 'In Triage', owner: 'Battery Systems', loss: '$31,500', sla: '2h 10m', trust: '#138 • Verified' },
];

export const REGISTRY_13500 = { version: 'v6.1', total_loaded: 13500, core_wf: 120, extended: 13380, add_ins: 15, factory_toggle: 'Factory 12' };

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (<span className={`px-2 py-0.5 rounded text-[10px] font-bold ${className}`}>{children}</span>);

const RibbonButton = ({ label, accent, hint }: { label: string; accent?: boolean; hint?: boolean }) => {
  if (hint) return <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>;
  return (
    <button className={`w-full text-left px-2 py-1 rounded text-[11px] border hover:bg-white transition ${accent ? 'bg-teal-500 text-white border-teal-500' : 'text-gray-700'}`}>
      {label}
    </button>
  );
};

const renderTabContent = (tab: TabV61) => {
  switch (tab) {
    case 'FILE':
      return <FileView />;
    case 'HOME':
      return <HomeView />;
    case 'INTAKE':
      return <IntakeView />;
    case 'TRIAGE':
      return <TriageView />;
    case 'INVESTIGATION':
      return <InvestigationView />;
    case 'RESOLUTION':
      return <ResolutionView />;
    case 'ANALYTICS':
      return <AnalyticsView />;
    case 'QUALITY':
      return <QualityView />;
    case 'INDUSTRIAL AUTOMATION':
      return <IndustrialAutomationView />;
    case 'ADD-INS':
      return <AddInsView />;
    case 'VIEW':
      return <ViewView />;
    case 'HELP':
      return <HelpView />;
    default:
      return <HomeView />;
  }
};

export default function ComplaintHubV61() {
  const [activeTab, setActiveTab] = useState<TabV61>('HOME');
  const [omniOpen, setOmniOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormulas, setShowFormulas] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [omniQuestion, setOmniQuestion] = useState('');
  const [omniAnswer, setOmniAnswer] = useState('');
  const visibleRibbon = ribbonConfig[activeTab] || [];
  const liveLoss = useMemo(() => COMPLAINT_RECORDS.reduce((sum, record) => sum + Number(record.loss.replace(/[$,]/g, '')), 0), []);

  const handleOmniAction = useCallback((action: string) => {
    if (action === 'ledger') setActiveTab('ANALYTICS');
    else if (action === 'cfo_summary') setActiveTab('ANALYTICS');
    else if (action === 'root_cause' || action === 'open_fmea') setActiveTab('INVESTIGATION');
  }, []);

  const askOmni = () => {
    const question = omniQuestion.trim();
    if (!question) return;
    setOmniAnswer(`Factory 12 live view: REAL $521,820 preserved; bottleneck Line 7 seal degradation 89.6s vs Takt 72s; MTBF 42.1h; tracked loss $${liveLoss.toLocaleString()} across ${COMPLAINT_RECORDS.length} records (factory12Loss). I can open Investigation or Analytics for the supporting workflow.`);
    setOmniQuestion('');
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB] text-[#101828]">
      <header className="min-h-14 bg-white border-b flex items-center justify-between px-4 gap-4 overflow-hidden">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-teal-700">ComplaintHub v6.1</span>
          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded font-mono">13,500 Functions</span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-mono">15 add-ins</span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-mono">120 workflows</span>
        </div>
        <div className="flex flex-1 min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap pr-[60px] [scrollbar-width:thin]" style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'thin', paddingRight: 60 }}>
          {TABS_V61.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints, workflows, formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-10 py-1.5 w-64 border rounded text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button className="p-2 border rounded hover:bg-gray-100"><Bell className="w-5 h-5" /></button>
          <button className="p-2 border rounded hover:bg-gray-100"><Settings className="w-5 h-5" /></button>
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700 text-sm">JD</div>
        </div>
      </header>

      <div className="min-h-12 bg-[#F9FAFB] border-b px-4 py-1 flex items-center gap-2 overflow-x-auto">
        {visibleRibbon.map((g) => (
          <div key={g.id} className="flex items-center gap-1 border-l pl-2 h-6">
            <span className="text-[10px] text-gray-400 font-bold">{g.label}</span>
            {g.items.map((item, idx) => (
              <RibbonButton key={idx} label={item.label} accent={item.accent} hint={!!item.hint} />
            ))}
          </div>
        ))}
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFormulas(!showFormulas)} className={`px-2 py-1 text-[10px] rounded border ${showFormulas ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-700'}`}>
            <ChevronDown className="w-3 h-3 mr-1" />
            {showFormulas ? 'Hide' : 'Show'} Formulas
          </button>
          <button onClick={() => setFilterOpen(!filterOpen)} className="px-2 py-1 text-[10px] rounded border bg-white text-gray-700 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filters ▼
          </button>
          <button className="px-2 py-1 text-[10px] rounded border bg-white text-gray-700 flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            Columns
          </button>
          <button className="px-2 py-1 text-[10px] rounded border bg-white text-gray-700 flex items-center gap-1">
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL - WORKFLOWS */}
        <aside className={`${sidebarCollapsed ? 'w-[60px]' : 'w-[240px]'} shrink-0 border-r bg-[#F9FAFB] p-2 overflow-y-auto transition-[width] duration-150`}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full text-left mb-2 px-2 py-1 rounded border bg-white text-xs">{sidebarCollapsed ? '›' : '‹  Collapse'}</button>
          <div className="flex justify-between items-center mb-3">
            {!sidebarCollapsed && <h4 className="font-bold text-sm flex items-center gap-1.5"><Layers className="w-4 h-4 text-teal-600" /> WORKFLOWS</h4>}
            <button className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">⋮</button>
          </div>
          {!sidebarCollapsed && <div className="space-y-1.5">
            <div className="border-t my-2"></div>
            <div className="space-y-1">
              {visibleRibbon.map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="text-[10px] text-gray-500 font-bold tracking-wide px-1">{g.label}</div>
                  {g.items.map((item, idx) => (
                    <button key={idx} className={`w-full text-left px-2 py-1 rounded text-[11px] border hover:bg-white transition ${item.accent ? 'bg-teal-500 text-white border-teal-500' : 'text-gray-700'}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="whitespace-normal break-words">{item.label}</span>
                        {item.label.toLowerCase().startsWith('import from') ? (
                          <ChevronDown className="w-3 h-3 shrink-0" />
                        ) : (
                          item.hint && <span className="text-[9px] text-gray-400 ml-2 whitespace-normal break-words text-right">{typeof item.hint === 'string' ? item.hint : ''}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>}
        </aside>

        {/* CENTER PANEL - Content changes based on activeTab */}
        <main className="flex-1 min-w-0 border-r p-3 overflow-y-auto bg-white">
          {renderTabContent(activeTab)}
        </main>

        {/* RIGHT PANEL - OMNI AI COPILOT (Global) */}
        <aside className="w-[290px] shrink-0 border-l bg-[#F9FAFB] p-2.5 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-sm flex items-center gap-1.5"><Brain className="w-4 h-4 text-teal-600" /> Omni AI Copilot</h4>
            <button onClick={() => setOmniOpen(!omniOpen)} className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">{omniOpen ? '✕' : '⋮'}</button>
          </div>
          {omniOpen && (
            <div className="space-y-3">
              <div className="p-2 bg-[#ECFDF5] border border-[#14B8A6] rounded text-[10px] text-teal-800 font-medium">Trust Receipts Enabled • 120 workflows • Memory ON</div>
              <div className="space-y-2">
                <div className="bg-white p-2.5 rounded border text-xs">How are we doing?</div>
                <div onClick={() => handleOmniAction('ledger')} className="bg-teal-100 p-2.5 rounded border border-teal-200 text-xs text-teal-900 leading-relaxed cursor-pointer hover:shadow-md transition">You've preserved <strong>$1,249,000</strong> and intercepted <strong>5 faults</strong>. Net ROI <strong>940%</strong>, breakeven 18 days. Trust Receipt #142 hashed evidence stored on ledger.</div>
                <div className="text-xs text-gray-600 mb-1">Want CFO View WF94?</div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => handleOmniAction('open_fmea')} className="text-xs bg-[#14B8A6] text-white border border-[#14B8A6] px-2.5 py-1.5 rounded-lg font-semibold hover:bg-teal-600 transition">Open WF94</button>
                  <button onClick={() => handleOmniAction('cfo_summary')} className="text-xs bg-white border border-gray-300 text-gray-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-gray-50 transition">CFO Summary</button>
                  <button onClick={() => handleOmniAction('root_cause')} className="text-xs bg-white border border-gray-300 text-gray-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-gray-50 transition">Run Root Cause</button>
                </div>
                <div className="h-[1px] bg-gray-200 my-1"></div>
                <div className="text-[10px] text-gray-400 font-mono">confidence 92% • source WF84 Verified Incident Audit Log WF90 Ledger Block</div>
              </div>
              <div className="border rounded-lg p-2 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                  <span className="text-[10px] text-gray-500 font-medium">Listening: Hey Omni</span>
                </div>
                <div className="flex gap-1">
                  <input value={omniQuestion} onChange={(event) => setOmniQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') askOmni(); }} type="text" placeholder="Ask anything..." className="flex-1 min-w-0 border rounded px-2 py-1 text-xs" />
                  <button onClick={askOmni} className="bg-[#14B8A6] text-white px-2 py-1 rounded text-xs">Ask</button>
                </div>
                {omniAnswer && <p className="mt-2 rounded bg-gray-50 border p-2 text-[11px] leading-relaxed">{omniAnswer}</p>}
              </div>
            </div>
          )}
        </aside>
      </div>
      <footer className="border-t px-4 py-2 bg-white text-[10px] text-gray-500 flex justify-between items-center"><span>ComplaintHub v6.1 • Production • {REGISTRY_13500.total_loaded.toLocaleString()} functions loaded • Online</span><span className="flex items-center gap-2"><span>Light mode • v6.1.0</span><span>• Session: JD</span></span></footer>
    </div>
  );
}