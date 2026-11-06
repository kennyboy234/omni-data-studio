import React from 'react';
import { Plus, Download, Upload, Search, Filter, ChevronDown, List, Brain, AlertTriangle, TrendingUp, Settings, Zap, Cpu, Database, Package, Eye, HelpCircle, Home, Box, Truck, ClipboardList, Microscope, CheckCircle, BarChart2, Shield, Factory, Plug, Layers, Grid, Menu, X, ChevronRight, Mic } from 'lucide-react';

const statCards = [
  { label: 'Total Complaints', value: '1,247', delta: '+12%', deltaColor: 'text-green-600' },
  { label: 'Avg Resolution', value: '3.2d', delta: '-0.5d', deltaColor: 'text-green-600' },
  { label: 'Total Loss', value: '$42,580', delta: '+$2,340', deltaColor: 'text-red-600' },
  { label: 'SLA Compliance', value: '92%', delta: '+3%', deltaColor: 'text-green-600' },
];

const KpiCard = ({ label, value, delta, deltaColor }: { label: string; value: string; delta: string; deltaColor: string }) => (
  <div className="border rounded-lg p-3 bg-white border-gray-200">
    <div className="text-xs text-gray-500 font-medium">{label}</div>
    <div className="text-2xl font-bold mt-0.5 text-gray-900">{value}</div>
    <div className={`text-[10px] font-bold mt-1 ${deltaColor}`}>{delta}</div>
  </div>
);

const PlaceholderView = ({ 
  title, 
  icon: Icon, 
  stats = [],
  description,
  actions = []
}: { 
  title: string; 
  icon: React.ComponentType<{ className?: string }>;
  stats?: Array<{ label: string; value: string; delta: string; deltaColor: string }>;
  description?: string;
  actions?: Array<{ label: string; icon?: React.ComponentType<{ className?: string }>; primary?: boolean }>;
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-teal-600" />
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="flex gap-2">
        {actions.map((action, i) => (
          <button key={i} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
            action.primary ? 'bg-teal-500 text-white hover:bg-teal-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
            {action.icon && <action.icon className="w-3 h-3" />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
    
    {description && <p className="text-sm text-gray-600">{description}</p>}
    
    {stats.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <KpiCard key={i} {...stat} />
        ))}
      </div>
    )}
    
    <div className="border rounded-lg bg-white">
      <div className="border-b px-4 py-3 bg-gray-50 rounded-t-lg">
        <h3 className="font-bold text-xs flex items-center gap-1.5">
          <List className="w-3 h-3" /> {title} Module
        </h3>
      </div>
      <div className="p-6 text-center text-gray-500">
        <Icon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="font-medium">{title} Module - 13,500 functions loaded</p>
        <p className="text-xs mt-1">Content for {title.toLowerCase()} view will be implemented here</p>
      </div>
    </div>
  </div>
);

export const HomeView = () => (
  <PlaceholderView
    title="HOME"
    icon={Home}
    stats={statCards}
    description="Complaint Records dashboard with smart filters and workflow overview"
    actions={[
      { label: '+ New Complaint', icon: Plus, primary: true },
      { label: 'Import From', icon: Download }
    ]}
  />
);

export const IntakeView = () => (
  <PlaceholderView
    title="INTAKE"
    icon={Box}
    stats={[
      { label: 'New This Week', value: '342', delta: '+18%', deltaColor: 'text-green-600' },
      { label: 'Pending Review', value: '89', delta: '-5', deltaColor: 'text-orange-600' },
      { label: 'Auto-Categorized', value: '94%', delta: '+2%', deltaColor: 'text-green-600' },
      { label: 'Source: Email', value: '52%', delta: '', deltaColor: 'text-gray-600' },
    ]}
    description="New complaint intake, categorization, and initial triage"
    actions={[
      { label: '+ New Complaint', icon: Plus, primary: true },
      { label: 'Import From CSV', icon: Upload },
      { label: 'From WhatsApp', icon: Mic },
    ]}
  />
);

export const TriageView = () => (
  <PlaceholderView
    title="TRIAGE"
    icon={ClipboardList}
    stats={[
      { label: 'In Triage', value: '12', delta: '+3', deltaColor: 'text-orange-600' },
      { label: 'Escalated', value: '5', delta: '+1', deltaColor: 'text-red-600' },
      { label: 'Avg Triage Time', value: '4.2h', delta: '-0.8h', deltaColor: 'text-green-600' },
      { label: 'Auto-Assigned', value: '78%', delta: '+5%', deltaColor: 'text-green-600' },
    ]}
    description="Triage queue with priority scoring and team assignment"
    actions={[
      { label: 'Assign', icon: ChevronRight },
      { label: 'Route', icon: Truck },
      { label: 'Escalate', icon: AlertTriangle },
    ]}
  />
);

export const InvestigationView = () => (
  <PlaceholderView
    title="INVESTIGATION"
    icon={Microscope}
    stats={[
      { label: 'Under Investigation', value: '23', delta: '+2', deltaColor: 'text-blue-600' },
      { label: 'Root Cause Found', value: '67%', delta: '+8%', deltaColor: 'text-green-600' },
      { label: 'Evidence Collected', value: '1,234', delta: '+45', deltaColor: 'text-green-600' },
      { label: 'Avg Investigation', value: '2.1d', delta: '-0.3d', deltaColor: 'text-green-600' },
    ]}
    description="Deep-dive investigation with evidence tracking and root cause analysis"
    actions={[
      { label: 'Add Evidence', icon: Plus },
      { label: 'Run RCA', icon: Brain },
      { label: 'Link Records', icon: Layers },
    ]}
  />
);

export const ResolutionView = () => (
  <PlaceholderView
    title="RESOLUTION"
    icon={CheckCircle}
    stats={[
      { label: 'Resolved This Month', value: '287', delta: '+15%', deltaColor: 'text-green-600' },
      { label: 'First-Call Resolution', value: '73%', delta: '+4%', deltaColor: 'text-green-600' },
      { label: 'Reopen Rate', value: '4.2%', delta: '-0.8%', deltaColor: 'text-green-600' },
      { label: 'Customer Satisfaction', value: '4.7/5', delta: '+0.2', deltaColor: 'text-green-600' },
    ]}
    description="Resolution tracking, corrective actions, and closure verification"
    actions={[
      { label: 'Mark Resolved', icon: CheckCircle, primary: true },
      { label: 'Add Corrective Action', icon: Plus },
      { label: 'Send Closure', icon: Upload },
    ]}
  />
);

export const AnalyticsView = () => (
  <PlaceholderView
    title="ANALYTICS"
    icon={BarChart2}
    stats={[
      { label: 'Avg Resolution', value: '3.2d', delta: '-0.5d', deltaColor: 'text-green-600' },
      { label: 'Total Loss', value: '$42,580', delta: '+$2,340', deltaColor: 'text-red-600' },
      { label: 'SLA Compliance', value: '92%', delta: '+3%', deltaColor: 'text-green-600' },
      { label: 'Trend', value: 'Improving', delta: '↗', deltaColor: 'text-green-600' },
    ]}
    description="Advanced analytics with trends, predictions, and executive dashboards"
    actions={[
      { label: 'CFO View', icon: TrendingUp },
      { label: 'Export Report', icon: Download },
      { label: 'Custom Dashboard', icon: Plus },
    ]}
  />
);

export const QualityView = () => (
  <PlaceholderView
    title="QUALITY"
    icon={Shield}
    stats={[
      { label: 'Trust Receipts', value: '142', delta: '+5', deltaColor: 'text-green-600' },
      { label: 'FMEA Workflows', value: '94', delta: '+2', deltaColor: 'text-green-600' },
      { label: 'Compliance Score', value: '97%', delta: '+1%', deltaColor: 'text-green-600' },
      { label: 'Audit Ready', value: 'Yes', delta: '', deltaColor: 'text-green-600' },
    ]}
    description="Quality management with Trust Receipts, FMEA, and compliance tracking"
    actions={[
      { label: 'New Trust Receipt', icon: Plus, primary: true },
      { label: 'Open FMEA WF94', icon: Brain },
      { label: 'CFO Summary', icon: TrendingUp },
    ]}
  />
);

export const IndustrialAutomationView = () => (
  <PlaceholderView
    title="INDUSTRIAL AUTOMATION"
    icon={Factory}
    stats={[
      { label: 'Siemens PLC', value: 'Online', delta: '8 nodes', deltaColor: 'text-green-600' },
      { label: 'Rockwell', value: 'Online', delta: '12 nodes', deltaColor: 'text-green-600' },
      { label: 'Fanuc Robots', value: 'Online', delta: '4 nodes', deltaColor: 'text-green-600' },
      { label: 'CAN Battery Twin', value: 'Syncing', delta: '99.2%', deltaColor: 'text-blue-600' },
    ]}
    description="Industrial automation integration: PLCs, robots, digital twins, and OT/IT convergence"
    actions={[
      { label: 'Connect PLC', icon: Plug, primary: true },
      { label: 'View Twins', icon: Cpu },
      { label: 'OT Security', icon: Shield },
    ]}
  />
);

export const AddInsView = () => (
  <PlaceholderView
    title="ADD-INS"
    icon={Package}
    stats={[
      { label: 'Installed', value: '15', delta: '+2', deltaColor: 'text-green-600' },
      { label: 'Available', value: '47', delta: '', deltaColor: 'text-gray-600' },
      { label: 'Updates', value: '3', delta: '', deltaColor: 'text-orange-600' },
      { label: 'Custom Built', value: '8', delta: '+1', deltaColor: 'text-blue-600' },
    ]}
    description="Add-ins marketplace: extend functionality with plugins and integrations"
    actions={[
      { label: 'Browse Store', icon: Package, primary: true },
      { label: 'Manage Installed', icon: Settings },
      { label: 'Build Custom', icon: Plus },
    ]}
  />
);

export const ViewView = () => (
  <PlaceholderView
    title="VIEW"
    icon={Eye}
    stats={[
      { label: 'Saved Views', value: '24', delta: '+3', deltaColor: 'text-green-600' },
      { label: 'Shared Views', value: '12', delta: '', deltaColor: 'text-gray-600' },
      { label: 'Default View', value: 'Executive', delta: '', deltaColor: 'text-gray-600' },
      { label: 'Last Modified', value: '2h ago', delta: '', deltaColor: 'text-gray-600' },
    ]}
    description="Customizable views, layouts, and perspective management"
    actions={[
      { label: 'Save Current View', icon: Plus, primary: true },
      { label: 'Manage Views', icon: Settings },
      { label: 'Share View', icon: Upload },
    ]}
  />
);

export const HelpView = () => (
  <PlaceholderView
    title="HELP"
    icon={HelpCircle}
    stats={[
      { label: 'Documentation', value: 'Complete', delta: 'v6.1', deltaColor: 'text-green-600' },
      { label: 'Video Tutorials', value: '47', delta: '+5', deltaColor: 'text-green-600' },
      { label: 'API Reference', value: 'Live', delta: '', deltaColor: 'text-green-600' },
      { label: 'Support Tickets', value: '0 Open', delta: '', deltaColor: 'text-green-600' },
    ]}
    description="Help center, documentation, tutorials, and support"
    actions={[
      { label: 'Open Docs', icon: BookOpen, primary: true },
      { label: 'Video Tutorials', icon: Play },
      { label: 'Contact Support', icon: MessageSquare },
    ]}
  />
);

import { BookOpen, Play, MessageSquare } from 'lucide-react';

export const FileView = () => (
  <PlaceholderView
    title="FILE"
    icon={Menu}
    stats={[
      { label: 'Recent Files', value: '12', delta: '', deltaColor: 'text-gray-600' },
      { label: 'Templates', value: '8', delta: '', deltaColor: 'text-gray-600' },
      { label: 'Exports', value: '5', delta: '', deltaColor: 'text-gray-600' },
      { label: 'Backups', value: 'Auto', delta: 'Daily', deltaColor: 'text-green-600' },
    ]}
    description="File operations: new, open, save, export, templates, and backup management"
    actions={[
      { label: 'New', icon: Plus, primary: true },
      { label: 'Open', icon: Upload },
      { label: 'Save As', icon: Download },
    ]}
  />
);