import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  ChevronDown,
  Bell,
  Settings,
  Plus,
  Layers,
  Filter,
  HardDrive,
  Brain,
  List,
  Mic,
} from 'lucide-react';

export const TABS_V61 = [
  'FILE',
  'HOME',
  'INTAKE',
  'TRIAGE',
  'INVESTIGATION',
  'RESOLUTION',
  'ANALYTICS',
  'QUALITY',
  'INDUSTRIAL AUTOMATION',
  'ADD-INS',
  'VIEW',
  'HELP',
] as const;

export type TabV61 = (typeof TABS_V61)[number];

export const RIBBON_GROUPS = [
  { id: 'GROUP1', label: 'GROUP1', items: [
    { label: '+ New Complaint', accent: true },
    { label: '+ Import From â–¼', hint: 'CSV Email WhatsApp QR IoT Voice' },
  ] },
  { id: 'GROUP2', label: 'GROUP2', items: [
    { label: 'Assign' },
    { label: 'Route' },
    { label: 'Escalate' },
    { label: 'QR IoT Voice', hint: true },
  ] },
  { id: 'GROUP3', label: 'GROUP3', items: [
    { label: 'Validate â–¼' },
    { label: 'Dedupe â–¼' },
    { label: 'Merge' },
    { label: 'Cleanse', hint: true },
  ] },
  { id: 'GROUP4', label: 'GROUP4', items: [
    { label: 'fx Formula 1,247' },
    { label: 'Automate â–¼', hint: true },
    { label: 'Rule Builder', hint: true },
  ] },
  { id: 'GROUP5', label: 'GROUP5', items: [
    { label: 'Export' },
    { label: 'Report', hint: true },
    { label: 'Add-ins Store', hint: true },
  ] },
];

export const ADD_INS_V61 = [
  'Siemens PLC Pack','Rockwell','Fanuc Robot Pack','CAN Fleet Battery Twin',
  'SAP S/4HANA','Oracle','Salesforce','Jira','AI Auto-Triage','AI Root Cause',
  'AI Draft','Voice to Complaint','ISO 9001','FDA','OSHA',
];

export const WORKFLOW_STATS = [
  { label: 'Active', value: '34', color: 'bg-teal-500 text-white' },
  { label: 'In Triage', value: '12', color: 'bg-orange-400 text-white' },
  { label: 'Under Review', value: '9', color: 'bg-blue-500 text-white' },
  { label: 'Resolved', value: '2115', color: 'bg-gray-200 text-gray-800' },
  { label: 'Closed', value: '280', color: 'bg-gray-200 text-gray-800' },
];

export const SMART_FILTERS = [
  { label: 'My Queue', value: '7', color: 'bg-teal-500 text-white' },
  { label: 'Overdue', value: '5', color: 'bg-red-500 text-white' },
  { label: 'High Priority', value: '4', color: 'bg-red-500 text-white' },
  { label: 'Unassigned', value: '3', color: 'bg-gray-200 text-gray-800' },
];

export const KPI_CARDS = [
  { label: 'Total', value: '34', delta: '-12% vs last 7d', deltaColor: 'text-teal-600' },
  { label: 'Avg Resolution', value: '3.2d', delta: '+0.3d vs last 7d â†‘', deltaColor: 'text-red-500', accent: true },
  { label: 'Total Loss', value: '$42,580', delta: '-8.1% vs last 7d â†‘', deltaColor: 'text-teal-600', accent: true },
  { label: 'SLA', value: '92%', delta: '+2% vs last 7d', deltaColor: 'text-teal-600', accent: true },
];

export const COMPLAINT_RECORDS = [
  { id: '#C-10284', complaint: 'Leak on Line 7 Seal Degradation', status: 'In Triage', owner: 'M. Khan', loss: '$12,450', sla: '78%', trust: '#142 â€¢ Verified âœ…' },
  { id: '#C-10277', complaint: 'Pressure Spike at Valve 3', status: 'Active', owner: 'J. Ruiz', loss: '$9,300', sla: '95%', trust: '#142 â€¢ Verified' },
  { id: '#C-10290', complaint: 'Fanuc Robot Joint 3 Over-Torque', status: 'Active', owner: 'Robotics Team', loss: '$28,900', sla: '45m', trust: '#140 â€¢ Verified' },
  { id: '#C-10287', complaint: 'Batch #441 Nitrile Elastomer Hardness', status: 'Under Review', owner: 'Quality Lead', loss: '$18,200', sla: '14h 20m', trust: '#139 â€¢ Verified' },
  { id: '#C-10288', complaint: 'Battery Pack #982 Cell Voltage Imbalance', status: 'In Triage', owner: 'Battery Systems', loss: '$31,500', sla: '2h 10m', trust: '#138 â€¢ Verified' },
];

export const REGISTRY_13500 = {
  version: 'v6.1',
  total_loaded: 13500,
  core_wf: 120,
  extended: 13380,
  add_ins: 15,
  factory_toggle: 'Factory 12',
};

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${className}`}>{children}</span>
);

const RibbonButton = ({ label, accent, hint }: { label: string; accent?: boolean; hint?: boolean }) => {
  if (hint) return <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>;
  return (
    <button className={`border px-2.5 py-1.5 rounded text-xs font-medium transition ${
      accent ? 'bg-teal-500 text-white border-teal-500 hover:bg-teal-600'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-teal-300'
    }`}>{label}</button>
  );
};

const OmniSuggestsBanner = ({ factory }: { factory: string }) => (
  <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-2.5 flex justify-between items-center gap-3">
    <div className="flex items-center gap-2 text-sm text-[#92400E]">
      <span className="text-yellow-600">ðŸ’¡</span>
      Omni Suggests â€” We detected <strong>3 leaks at {factory}</strong> in 2 days â€” suggest open FMEA WF29?
    </div>
    <div className="flex gap-2">
      <button className="bg-[#14B8A6] text-white px-3 py-1 rounded text-xs font-bold hover:bg-[#0D9488"]>Yes</button>
      <button className="border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-50">No</button>
      <span className="ml-2 text-[10px] font-bold text-teal-700">SHAP</span>
    </div>
  </div>
);

const KpiCard = ({ label, value, delta, deltaColor, accent }: { label: string; value: string; delta: string; deltaColor: string; accent?: boolean }) => (
  <div className={`border rounded-lg p-3 bg-white ${accent ? 'border-teal-200' : 'border-gray-200'}`}>
    <div className="text-xs text-gray-500 font-medium">{label}</div>
    <div className={`text-2xl font-bold mt-0.5 ${accent ? 'text-teal-600' : 'text-[#111827]'}`}>{value}</div>
    <div className={`text-[10px] font-bold mt-1 ${deltaColor}`}>{delta}</div>
  </div>
);
export default function ComplaintHubV61() {
  const [activeTab, setActiveTab] = useState<TabV61>('HOME');
  const [factory, setFactory] = useState<string>('Factory 12');
  const [search, setSearch] = useState<string>('');
  const [omniOpen, setOmniOpen] = useState<boolean>(true);
  const [fabOpen, setFabOpen] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('Active');

  const filteredRecords = useMemo(() => {
    if (selectedFilter === 'Active') return COMPLAINT_RECORDS.filter((r) => r.status === 'Active');
    if (selectedFilter === 'In Triage') return COMPLAINT_RECORDS.filter((r) => r.status === 'In Triage');
    if (selectedFilter === 'Under Review') return COMPLAINT_RECORDS.filter((r) => r.status === 'Under Review');
    if (selectedFilter === 'Resolved') return COMPLAINT_RECORDS.filter((r) => r.status === 'Resolved');
    if (selectedFilter === 'Closed') return COMPLAINT_RECORDS.filter((r) => r.status === 'Closed');
    return COMPLAINT_RECORDS;
  }, [selectedFilter]);

  const handleOmniAction = useCallback((action: string) => {
    console.log('[Omni Action]', action);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111827] font-sans text-sm select-none">
      {/* HEADER */}
      <header className="flex justify-between items-center px-4 py-2.5 border-b border-[#E5E7EB] bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#14B8A6] rounded-xl flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
            CH
          </div>
          <div>
            <div className="font-semibold text-[#111827]">
              ComplaintHub v6.1 â€¢ {REGISTRY_13500.total_loaded.toLocaleString()} Functions â€¢ {REGISTRY_13500.add_ins} add-ins â€¢ All {REGISTRY_13500.core_wf} workflows + All Improvements
            </div>
            <div className="text-[10px] text-gray-500">Production â€¢ {REGISTRY_13500.version}</div>
          </div>
          <div className="relative ml-2">
            <select
              value={factory}
              onChange={(e) => setFactory(e.target.value)}
              className="appearance-none border border-[#E5E7EB] rounded-full pl-3 pr-8 py-1.5 text-xs bg-[#F9FAFB] text-[#111827] font-medium cursor-pointer focus:outline-none focus:border-[#14B8A6]"
            >
              <option value="Factory 12">Factory 12</option>
              <option value="Factory 7">Factory 7</option>
              <option value="Factory 3">Factory 3</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-13500-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${REGISTRY_13500.total_loaded.toLocaleString()} functions Ctrl+K`}
              className="w-64 sm:w-80 pl-8 pr-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] text-xs placeholder-text-gray-400 focus:outline-none focus:border-[#14B8A6] focus:bg-white"
            />
            {search.trim() && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">Ã—</button>
            )}
          </div>
          <button className="w-7 h-7 border border-[#E5E7EB] rounded-full flex items-center justify-center bg-[#F9FAFB] hover:bg-gray-100 text-xs transition cursor-pointer" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 border border-[#E5E7EB] rounded-full flex items-center justify-center bg-[#F9FAFB] hover:bg-gray-100 text-xs transition cursor-pointer" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 bg-[#0F766E] rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm cursor-pointer" title="Logged In: JD">
            JD
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav className="flex gap-4 px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-medium overflow-x-auto scrollbar-hide">
        {TABS_V61.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`whitespace-nowrap py-1 px-2 rounded-md transition ${
              activeTab === t
                ? 'text-teal-600 border-b-2 border-teal-600 font-semibold bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* RIBBON GROUP1-5 */}
      <div className="grid grid-cols-5 gap-1.5 px-3 py-2 border-b border-[#E5E7EB] bg-white">
        {RIBBON_GROUPS.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-gray-500 tracking-tighter uppercase">{group.label}</div>
            <div className="flex flex-wrap gap-1">
              {group.items.map((item, i) => (
                <RibbonButton key={i} label={item.label} accent={item.accent} hint={item.hint} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* BODY */}
      <div className="grid grid-cols-12 h-[calc(100vh-190px)] overflow-hidden">
        {/* LEFT COLUMN */}
        <aside className="col-span-2 border-r border-[#E5E7EB] p-2.5 bg-white overflow-y-auto">
          <section className="space-y-3">
            <div>
              <h4 className="font-bold text-xs text-gray-900 mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-teal-600" /> WORKFLOW
              </h4>
              <div className="space-y-1">
                {WORKFLOW_STATS.map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">{stat.label}</span>
                    <Badge className={stat.color}>{stat.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900 mb-1.5 flex items-center gap-1">
                <Filter className="w-3 h-3 text-teal-600" /> SMART FILTERS
              </h4>
              <div className="space-y-1">
                {SMART_FILTERS.map((filter) => (
                  <button
                    key={filter.label}
                    onClick={() => setSelectedFilter(filter.label)}
                    className={`w-full flex justify-between items-center px-2 py-1.5 rounded text-xs transition ${
                      selectedFilter === filter.label
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <Badge className={filter.color}>{filter.value}</Badge>
                  </button>
                ))}
              </div>
            </div>
            <div className="border border-[#E5E7EB] rounded-lg p-2 bg-gray-50">
              <h4 className="font-bold text-xs text-gray-900 mb-1 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-teal-600" /> ADD-INS
              </h4>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Badge className="bg-teal-100 text-teal-700 border border-teal-200">My Add-ins 15</Badge>
              </div>
              <div className="text-[10px] leading-relaxed text-gray-600 space-y-0.5">
                {ADD_INS_V61.map((a) => (
                  <div key={a} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>



        {/* CENTER COLUMN */}
        <main className="col-span-7 border-r border-[#E5E7EB] p-3 overflow-y-auto bg-white">
          <OmniSuggestsBanner factory={factory} />

          <div className="grid grid-cols-4 gap-2.5 mt-2">
            {KPI_CARDS.map((card, i) => (
              <KpiCard key={i} {...card} />
            ))}
          </div>

          <div className="border border-[#E5E7EB] rounded-lg bg-white mt-2.5">
            <div className="border-b border-[#E5E7EB] px-3 py-2 flex justify-between items-center bg-[#F9FAFB] rounded-t-lg">
              <h3 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <List className="w-3 h-3" /> Complaint Records
              </h3>
              <div className="flex gap-1.5">
                <button className="border border-gray-300 bg-white px-2 py-1 rounded text-xs text-gray-700 hover:bg-gray-50">Filter</button>
                <button className="border border-gray-300 bg-white px-2 py-1 rounded text-xs text-gray-700 hover:bg-gray-50">Columns</button>
                <button className="bg-[#14B8A6] text-white px-2.5 py-1 rounded text-xs font-bold hover:bg-[#0D9488]">Export</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-gray-600">#</th>
                    <th className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-gray-600">Complaint</th>
                    <th className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-gray-600">Status</th>
                    <th className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-gray-600">Owner</th>
                    <th className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-gray-600">Loss</th>
                    <th className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-gray-600">SLA</th>
                    <th className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-gray-600">Trust Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredRecords.map((r, i) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2 font-mono text-gray-800">{r.id}</td>
                      <td className="px-3 py-2 text-gray-800">{r.complaint}</td>
                      <td className="px-3 py-2">
                        <Badge className={r.status === 'Active' ? 'bg-teal-100 text-teal-700 border border-teal-200' : r.status === 'In Triage' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{r.owner}</td>
                      <td className="px-3 py-2 font-mono text-gray-800">{r.loss}</td>
                      <td className="px-3 py-2 font-mono text-gray-700">{r.sla}</td>
                      <td className="px-3 py-2">{r.trust}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#E5E7EB] px-3 py-1.5 bg-gray-50 rounded-b-lg flex justify-between items-center">
              <span className="text-[10px] text-gray-500">LAST UPDATE: 2024-06-10 09:32 UTC â€¢ {filteredRecords.length} records</span>
              <span className="text-[10px] text-gray-500">Ctrl+K Search | Ctrl+N New | / Quick Command | ? Help</span>
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN â€” OMNI AI COPILOT */}
        <aside className="col-span-3 border-l border-[#E5E7EB] bg-[#F9FAFB] p-2.5 overflow-y-auto min-h-[600px]">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-teal-600" /> Omni AI Copilot
            </h4>
            <button
              onClick={() => setOmniOpen(!omniOpen)}
              className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-xs cursor-pointer"
              title={omniOpen ? 'Close Copilot' : 'Open Copilot'}
            >
              {omniOpen ? 'âœ•' : 'â‹®'}
            </button>
          </div>

          {omniOpen && (
            <div className="space-y-3">
              <div className="p-2 bg-teal-50 border border-teal-200 rounded text-[10px] text-teal-800 font-medium">
                Trust Receipts Enabled â€¢ 120 workflows â€¢ Memory ON
              </div>

              <div className="space-y-2">
                <div className="bg-white p-2.5 rounded border border-gray-200 text-xs text-gray-700">
                  How are we doing?
                </div>
                <div className="bg-teal-100 p-2.5 rounded border border-teal-200 text-xs text-teal-900 leading-relaxed">
                  You've preserved <strong>$1,249,000</strong> and intercepted <strong>5 faults</strong>. Net ROI <strong>940%</strong>, breakeven 18 days. Trust Receipt #142 hashed evidence stored on ledger.
                </div>
                <div className="text-xs text-gray-600 mb-1">Want CFO View WF94?</div>
                <div className="flex gap-1">
                  <button onClick={() => handleOmniAction('open_fmea')} className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded text-gray-700 hover:bg-gray-50">Open FMEA</button>
                  <button onClick={() => handleOmniAction('cfo_summary')} className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded text-gray-700 hover:bg-gray-50">CFO Summary</button>
                  <button onClick={() => handleOmniAction('root_cause')} className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded text-gray-700 hover:bg-gray-50">Run Root Cause</button>
                </div>
                <div className="h-[1px] bg-gray-200 my-1"></div>
                <div className="text-[10px] text-gray-400 font-mono">confidence 92% â€¢ source WF84 Verified Incident Audit Log WF90 Ledger Block</div>
              </div>

              <div className="border border-gray-200 rounded-lg p-2 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                  <span className="text-[10px] text-gray-500 font-medium">Listening: Hey Omni</span>
                </div>
                <div className="relative">
                  <input
                    placeholder="Ask Omni or say Hey Omni"
                    className="w-full pl-8 pr-3 py-1.5 rounded border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] text-xs focus:outline-none focus:border-[#14B8A6]"
                  />
                  <Mic className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setFabOpen(!fabOpen)}
            className="w-12 h-12 bg-[#14B8A6] text-white rounded-full text-2xl flex items-center justify-center shadow-xl hover:bg-[#0D9488] transition"
            aria-label="New complaint quick actions"
          >
            <Plus />
          </button>
          {fabOpen && (
            <div className="absolute bottom-16 right-0 bg-white border border-[#E5E7EB] rounded-lg shadow-2xl p-2 w-48">
              <button className="w-full flex justify-between items-center px-3 py-2 text-xs border-b border-gray-100 last:border-b-0 hover:bg-teal-50">
                <span>+ New Complaint</span>
                <span className="text-[10px] text-gray-400">Ctrl+N</span>
              </button>
              <button className="w-full flex justify-between items-center px-3 py-2 text-xs border-b border-gray-100 last:border-b-0 hover:bg-teal-50">
                <span>ðŸŽ™ï¸ From Voice</span>
                <span className="text-[10px] text-gray-400">Voice to Complaint</span>
              </button>
              <button className="w-full flex justify-between items-center px-3 py-2 text-xs border-b border-gray-100 last:border-b-0 hover:bg-teal-50">
                <span>ðŸ’¬ From WhatsApp</span>
                <span className="text-[10px] text-gray-400">Import channel</span>
              </button>
              <button className="w-full flex justify-between items-center px-3 py-2 text-xs hover:bg-teal-50">
                <span>âŠž Scan QR</span>
                <span className="text-[10px] text-gray-400">QR intake</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E7EB] px-4 py-2 bg-white text-[10px] text-gray-500 flex justify-between items-center">
        <span>
          ComplaintHub v6.1 â€¢ Production â€¢ {REGISTRY_13500.total_loaded.toLocaleString()} functions loaded â€¢ Online
        </span>
        <span className="flex items-center gap-2">
          <span>Light mode â€¢ v6.1.0</span>
          <span>â€¢ Session: JD</span>
        </span>
      </footer>
    </div>
  );
}



