import React, { useState, useRef, useEffect } from 'react';
import { WhatsAppMessage } from './types';
import {
  Send,
  CheckCheck,
  ShieldCheck,
  Bot,
  User,
  Paperclip,
  Smile,
  Mic,
  Phone,
  Video,
  MoreVertical,
  Terminal,
  Code,
  QrCode,
  Share2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Zap,
  TrendingUp,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export const WF53WhatsAppBot: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: 'msg-01',
      sender: 'bot',
      timestamp: '11:15',
      content:
        '👋 *OmniData Autonomous Defense Bot*\n\nConnected to Production Telemetry Mesh `us-east-1`.\nI monitor streaming data quality, detect drift, and calculate financial loss prevention.\n\nType any command or tap below:\n• */status* — System health & active watchtowers\n• */faults* — Top 5 intercepted critical anomalies\n• */roi* — Hard-dollar savings breakdown ($1.25M)\n• */ping* — Latency diagnostic check\n• */report* — Download tactical executive briefing',
      status: 'read',
      actions: [
        { label: '🚨 /faults', command: '/faults' },
        { label: '💰 /roi', command: '/roi' },
        { label: '📊 /status', command: '/status' },
        { label: '📄 /report', command: '/report' },
      ],
    },
    {
      id: 'msg-02',
      sender: 'user',
      timestamp: '11:18',
      content: '/roi',
      status: 'read',
    },
    {
      id: 'msg-03',
      sender: 'bot',
      timestamp: '11:18',
      content:
        '💰 *HARD-DOLLAR ROI DEFENSE SUMMARY*\n\n• *Total Losses Prevented:* `$1,249,000 USD`\n• *Net ROI:* `+941%`\n• *Payback Duration:* `35 Days`\n• *Interceptions:* `5 Critical Failure Modes`\n\n_Breakdown:_\n1. Downtime Avoided: *$114,000*\n2. Corrupted Records: *$754,000*\n3. Critical Outages: *$195,000*\n4. Engineering Triage: *$55,500*\n\n🔒 *Ledger Hash:* `e3b0c44298fc1c14...`\n_Certified by OmniData Ledger Engine._',
      status: 'read',
      actions: [
        { label: '🚨 /faults', command: '/faults' },
        { label: '📄 /report', command: '/report' },
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'webhook' | 'qr'>('chat');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendCommand = (cmdText: string) => {
    const raw = cmdText.trim();
    if (!raw) return;

    const userMsg: WhatsAppMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: raw,
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    // Simulate bot thinking and replying
    setTimeout(() => {
      let replyContent = '';
      let replyActions: WhatsAppMessage['actions'] = [];

      const lower = raw.toLowerCase();

      if (lower.startsWith('/status') || lower.includes('status')) {
        replyContent =
          '🛡️ *OMNIDATA MESH STATUS: GREEN*\n\n• *Surveillance Status:* `100% Operational`\n• *Ingestion Throughput:* `1,048,576 rows/sec`\n• *Active Watchtowers:* `WF05 Drift + WF06 Pulse`\n• *Current Population Drift:* `PSI 0.041 (SAFE)`\n• *Ledger Block Height:* `Block #1,042 (Immutable)`\n• *Uptime:* `99.998%`\n\n_All microservices reporting normal operational thresholds._';
        replyActions = [
          { label: '💰 /roi', command: '/roi' },
          { label: '🚨 /faults', command: '/faults' },
        ];
      } else if (lower.startsWith('/fault') || lower.includes('fault')) {
        replyContent =
          '🚨 *AUTONOMOUSLY INTERCEPTED FAULTS*\n\n1. *[CRITICAL]* CAN Bus Thermal Drift\n   ↳ Loss Prevented: `$195,000` | Latency: `2.1s`\n2. *[HIGH]* Null Spike in Sensor Stream #4\n   ↳ Loss Prevented: `$114,000` | Latency: `0.4s`\n3. *[HIGH]* Parquet Schema Evolution Collision\n   ↳ Loss Prevented: `$754,000` | Latency: `0.8s`\n4. *[MEDIUM]* Population Distribution Shift (PSI 0.384)\n   ↳ Loss Prevented: `$55,500` | Latency: `0.6s`\n5. *[CRITICAL]* Sensor Calibration Dropout\n   ↳ Loss Prevented: `$130,500` | Latency: `1.2s`\n\n✅ *Zero faulty records escaped to production databases.*';
        replyActions = [
          { label: '💰 /roi', command: '/roi' },
          { label: '📄 /report', command: '/report' },
        ];
      } else if (lower.startsWith('/roi') || lower.includes('roi') || lower.includes('money')) {
        replyContent =
          '💰 *HARD-DOLLAR ROI DEFENSE SUMMARY*\n\n• *Total Losses Prevented:* `$1,249,000 USD`\n• *Net ROI:* `+941%`\n• *Payback Duration:* `35 Days`\n• *Interceptions:* `5 Critical Failure Modes`\n\n_Breakdown:_\n1. Downtime Avoided: *$114,000*\n2. Corrupted Records: *$754,000*\n3. Critical Outages: *$195,000*\n4. Engineering Triage: *$55,500*\n\n🔒 *Ledger Hash:* `e3b0c44298fc1c14...`';
        replyActions = [
          { label: '🚨 /faults', command: '/faults' },
          { label: '📊 /status', command: '/status' },
        ];
      } else if (lower.startsWith('/ping') || lower.includes('ping')) {
        replyContent =
          '🏓 *PONG!*\n\n• *Latency:* `11.4 ms`\n• *Region:* `US-East-1 (N. Virginia)`\n• *Cluster:* `omnidata-fleet-prod-04`\n• *Timestamp:* `' +
          new Date().toISOString() +
          '`\n• *Security Handshake:* `TLS 1.3 / mTLS Verified`';
        replyActions = [
          { label: '📊 /status', command: '/status' },
          { label: '💰 /roi', command: '/roi' },
        ];
      } else if (lower.startsWith('/report') || lower.includes('report') || lower.includes('pdf')) {
        replyContent =
          '📄 *EXECUTIVE DEFENSE BRIEFING (Q4 2026)*\n\nTactical vector PDF briefing generated for VP Engineering & COO.\n\n*Key Takeaway:*\n"Our autonomous data defense layer intercepted 5 critical failure modes, directly preserving $1.25M in operational capital with 0 downtime."\n\n🔗 *Download Link:* `https://omnidata.studio/reports/q4-briefing.pdf`\n_Certified SHA-256 seal attached._';
        replyActions = [
          { label: '💰 /roi', command: '/roi' },
          { label: '🚨 /faults', command: '/faults' },
        ];
      } else {
        replyContent = `🤖 Command "${raw}" received.\n\nAvailable commands:\n• */status* — System health\n• */faults* — Top intercepted anomalies\n• */roi* — Financial savings\n• */ping* — Ping diagnostic\n• */report* — Download PDF report`;
        replyActions = [
          { label: '📊 /status', command: '/status' },
          { label: '🚨 /faults', command: '/faults' },
          { label: '💰 /roi', command: '/roi' },
        ];
      }

      const botReply: WhatsAppMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: replyContent,
        status: 'read',
        actions: replyActions,
      };

      setMessages((prev) => [...prev, botReply]);
    }, 400);
  };

  // Convert WhatsApp markdown (*bold*, _italic_, `code`) to formatted React elements
  const formatWhatsAppText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // replace formatting
      const parts = line.split(/(\*[^*]+\*|_[^_]+_|`[^`]+`)/g);

      return (
        <span key={lIdx} className="block leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <strong key={pIdx} className="font-bold text-white">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            if (part.startsWith('_') && part.endsWith('_')) {
              return (
                <em key={pIdx} className="italic text-slate-300">
                  {part.slice(1, -1)}
                </em>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code
                  key={pIdx}
                  className="px-1 py-0.5 bg-slate-900 text-emerald-300 font-mono text-xs rounded border border-slate-700"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  const copyShareLink = () => {
    const text = 'OmniData Defense Bot: We prevented $1.25M in operational losses. Try /status or /roi';
    navigator.clipboard.writeText(`https://wa.me/?text=${encodeURIComponent(text)}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold tracking-wider">
              WF53 · WHATSAPP COMMAND BOT
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono">
              Webhook + Realtime Dispatch
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            Mobile Executive Alert & Incident Bot
          </h2>
          <p className="text-sm text-slate-400">
            Interactive WhatsApp conversational terminal for C-suite briefings, fault alerts, and health queries.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
              activeTab === 'chat'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            LIVE CHAT CLIENT
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
              activeTab === 'webhook'
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            WEBHOOK RUNNER
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
              activeTab === 'qr'
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            QR PAIRING
          </button>
        </div>
      </div>

      {/* Main Tab 1: WhatsApp Client */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Mobile Phone Mockup */}
          <div className="lg:col-span-8 flex justify-center">
            <div className="w-full max-w-md bg-[#0b141a] rounded-3xl border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[540px]">
              {/* WhatsApp App Header */}
              <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#202c33] rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-sm">OmniData Defense</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">online · automated</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                  <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* Chat Message Scrollable Area */}
              <div
                ref={chatScrollRef}
                className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0b141a] bg-opacity-95"
                style={{
                  backgroundImage:
                    'radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #0b141a 1px)',
                  backgroundSize: '40px 40px',
                  backgroundPosition: '0 0, 20px 20px',
                }}
              >
                {messages.map((m) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                          isUser
                            ? 'bg-[#005c4b] text-slate-100 rounded-tr-none'
                            : 'bg-[#202c33] text-slate-200 rounded-tl-none border border-slate-700/40'
                        }`}
                      >
                        <div className="whitespace-pre-line text-xs font-sans">
                          {formatWhatsAppText(m.content)}
                        </div>

                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                          <span>{m.timestamp}</span>
                          {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                      </div>

                      {/* Interactive Action Suggestion Pills */}
                      {!isUser && m.actions && m.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 ml-1">
                          {m.actions.map((act, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => handleSendCommand(act.command)}
                              className="px-2.5 py-1 bg-[#182229] hover:bg-[#202c33] border border-emerald-500/30 rounded-full text-[11px] font-mono text-emerald-400 transition-colors shadow-sm"
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="bg-[#202c33] p-2 flex items-center gap-2 border-t border-slate-800 shrink-0">
                <button className="text-slate-400 hover:text-white p-1">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="text-slate-400 hover:text-white p-1">
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendCommand(inputVal);
                  }}
                  placeholder="Type /status, /faults, /roi..."
                  className="flex-1 bg-[#2a3942] text-white text-xs px-3 py-2 rounded-lg outline-none placeholder:text-slate-500 font-mono"
                />

                {inputVal.trim() ? (
                  <button
                    onClick={() => handleSendCommand(inputVal)}
                    className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full transition-colors shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendCommand('/roi')}
                    className="p-2 bg-[#2a3942] hover:bg-slate-700 text-slate-300 rounded-full transition-colors"
                    title="Quick Trigger /roi"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Side Controls & Quick Command Presets */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Rapid Executive Triggers
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Tap to simulate instant WhatsApp incoming command from C-suite executives:
              </p>

              <div className="space-y-2 font-mono text-xs">
                <button
                  onClick={() => handleSendCommand('/status')}
                  className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-slate-200 transition-all flex items-center justify-between"
                >
                  <span className="text-emerald-400">/status</span>
                  <span className="text-[11px] text-slate-400">System health check</span>
                </button>

                <button
                  onClick={() => handleSendCommand('/faults')}
                  className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-lg text-slate-200 transition-all flex items-center justify-between"
                >
                  <span className="text-amber-400">/faults</span>
                  <span className="text-[11px] text-slate-400">5 intercepted outages</span>
                </button>

                <button
                  onClick={() => handleSendCommand('/roi')}
                  className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-slate-200 transition-all flex items-center justify-between"
                >
                  <span className="text-cyan-400">/roi</span>
                  <span className="text-[11px] text-slate-400">$1.25M savings audit</span>
                </button>

                <button
                  onClick={() => handleSendCommand('/report')}
                  className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 rounded-lg text-slate-200 transition-all flex items-center justify-between"
                >
                  <span className="text-purple-400">/report</span>
                  <span className="text-[11px] text-slate-400">Executive PDF brief</span>
                </button>

                <button
                  onClick={() => handleSendCommand('/ping')}
                  className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 rounded-lg text-slate-200 transition-all flex items-center justify-between"
                >
                  <span className="text-sky-400">/ping</span>
                  <span className="text-[11px] text-slate-400">11ms latency audit</span>
                </button>
              </div>
            </div>

            {/* Direct WhatsApp Share Link */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300">
                  REAL WHATSAPP DISPATCH
                </span>
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Share live defense briefing directly to your phone via WhatsApp API link:
              </p>
              <button
                onClick={copyShareLink}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-lg transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'WHATSAPP LINK COPIED' : 'COPY WHATSAPP DIRECT URL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Webhook Endpoint Simulator */}
      {activeTab === 'webhook' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-3">
              <span className="text-emerald-400 font-bold">POST /api/webhook/whatsapp</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">200 OK</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-slate-500 text-[11px] mb-1">INCOMING PAYLOAD (META WHATSAPP BUSINESS API):</div>
                <pre className="bg-slate-900 p-3 rounded text-slate-300 overflow-x-auto text-[11px]">
{JSON.stringify(
  {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUS_9874102',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: { phone_number_id: '1098273645' },
              contacts: [{ profile: { name: 'VP Engineering' }, wa_id: '14155552671' }],
              messages: [
                {
                  from: '14155552671',
                  id: 'wamid.HBgLMTQxNTU1NTI2NzEVAgASGBQ...',
                  timestamp: Math.floor(Date.now() / 1000),
                  text: { body: '/roi' },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  },
  null,
  2
)}
                </pre>
              </div>

              <div>
                <div className="text-slate-500 text-[11px] mb-1">AUTOMATED BOT DISPATCH RESPONSE:</div>
                <pre className="bg-slate-900 p-3 rounded text-emerald-400 overflow-x-auto text-[11px]">
{JSON.stringify(
  {
    status: 'dispatched',
    recipient_id: '14155552671',
    message_type: 'interactive_briefing',
    total_losses_prevented_usd: 1249000,
    net_roi_percent: 941,
    signature: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  null,
  2
)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 3: QR Code Pairing Simulator */}
      {activeTab === 'qr' && (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono">
          <div className="p-4 bg-white rounded-2xl shadow-2xl mb-4">
            {/* Clean SVG QR code representation */}
            <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" fill="white" />
              {/* Corner 1 */}
              <rect x="10" y="10" width="24" height="24" fill="#020617" />
              <rect x="14" y="14" width="16" height="16" fill="white" />
              <rect x="18" y="18" width="8" height="8" fill="#020617" />
              {/* Corner 2 */}
              <rect x="66" y="10" width="24" height="24" fill="#020617" />
              <rect x="70" y="14" width="16" height="16" fill="white" />
              <rect x="74" y="18" width="8" height="8" fill="#020617" />
              {/* Corner 3 */}
              <rect x="10" y="66" width="24" height="24" fill="#020617" />
              <rect x="14" y="70" width="16" height="16" fill="white" />
              <rect x="18" y="74" width="8" height="8" fill="#020617" />
              {/* Data points */}
              <rect x="42" y="12" width="6" height="6" fill="#020617" />
              <rect x="52" y="12" width="6" height="6" fill="#020617" />
              <rect x="42" y="24" width="6" height="6" fill="#020617" />
              <rect x="42" y="42" width="16" height="16" fill="#10b981" />
              <rect x="12" y="42" width="6" height="6" fill="#020617" />
              <rect x="24" y="42" width="6" height="6" fill="#020617" />
              <rect x="66" y="42" width="6" height="6" fill="#020617" />
              <rect x="78" y="42" width="10" height="6" fill="#020617" />
              <rect x="42" y="66" width="6" height="12" fill="#020617" />
              <rect x="54" y="72" width="8" height="6" fill="#020617" />
              <rect x="70" y="66" width="18" height="6" fill="#020617" />
              <rect x="68" y="78" width="8" height="10" fill="#020617" />
              <rect x="80" y="82" width="6" height="6" fill="#020617" />
            </svg>
          </div>

          <h3 className="text-base font-bold text-white mb-1">Scan to Pair with OmniData Defense Bot</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Open WhatsApp on your mobile phone &gt; Linked Devices &gt; Scan QR Code to connect your phone number to real-time incident broadcasts.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
            <span>End-to-End Encrypted Session Key Generated</span>
          </div>
        </div>
      )}
    </div>
  );
};
