import React, { useState } from 'react';
import { filterPage, FORMULA_PRESETS, PLC_TAGS } from '../utils/complaintHub';
const button = 'px-3 py-1.5 rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-teal-50 text-xs';
function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (n: number) => void }) {
  return <div className="flex justify-between items-center pt-2"><span>{total.toLocaleString()} results • Page {page + 1}/{pages}</span>
    <div className="flex gap-2"><button className={button} disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
      <button className={button} disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</button></div></div>;
}
export function FormulaBrowser() {
  const [query, setQuery] = useState(''), [page, setPage] = useState(0);
  const result = filterPage(FORMULA_PRESETS, query, page, 12);
  return <section className="space-y-3"><p>1,247 scoped presets across six formula families. These are not 1,247 distinct executable algorithms.</p>
    <input aria-label="Search formulas" className="w-full border rounded p-2" placeholder="Search ROI, MTBF, PSI, scope…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
    {result.rows.map((f) => <article key={f.id} className="border border-[#E5E7EB] rounded-lg p-3 space-y-1">
      <h3 className="font-bold text-teal-700">{f.id} ={f.name}() • {f.scope}</h3><p><strong>Why:</strong> {f.why}</p>
      <p><strong>Input:</strong> {f.input}</p><p><strong>Output:</strong> {f.output}</p><p><strong>Formula:</strong> <code>{f.formula}</code></p>
    </article>)}<Pager {...result} onPage={setPage} /></section>;
}
export function PLCTagBrowser({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState(''), [page, setPage] = useState(0);
  const result = filterPage(PLC_TAGS, query, page);
  return <section className="space-y-3"><p className="p-2 bg-amber-50 border border-amber-200 rounded">DEMO_MODE=true • 1,240 synthetic tags • No controller connection or physical writes.</p>
    <input aria-label="Search PLC tags" className="w-full border rounded p-2" placeholder="Search tag, function, quality…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
    <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#F9FAFB]"><tr>{['Tag', 'Value', 'Quality', 'Trust', 'Function'].map((h) => <th className="p-2" key={h}>{h}</th>)}</tr></thead>
      <tbody>{result.rows.map((tag) => <tr key={tag.id} className="border-b border-[#E5E7EB]"><td className="p-2 font-mono">{tag.tag}</td><td>{tag.value}</td><td>{tag.quality}</td><td>{tag.trust}</td>
        <td><button className="text-teal-700 underline" onClick={() => onSelect(tag.id)}>{tag.id} Read</button></td></tr>)}</tbody></table></div>
    <Pager {...result} onPage={setPage} /></section>;
}

const CONTRACTS: Record<string, string[]> = {
  validate: ['Check loaded complaint fields.', 'Loaded ID, summary, factory', 'Missing-field and duplicate-ID counts', 'passed_checks / total_checks * 100'],
  dedupe: ['Find exact normalized-summary duplicates; never delete evidence.', 'Complaint summaries', 'Duplicate summary groups', 'groupBy(lowercase(trim(summary)))'],
  merge: ['Preview merge only; preserve originals.', 'Candidate duplicates', 'Proposed parent/child mapping for human sign-off', 'parent = first_record_in_group'],
  automate: ['Preview recurring-leak escalation.', 'Leak timestamps, selected factory, 48-hour window', 'FMEA recommendation; no maintenance dispatch', 'COUNT(leaks in 48h) >= 3'],
  fishbone: ['Structure hypotheses, not proven causes.', 'Man: seal +5N; Machine: bearing 4.2mm/s; Material: nitrile; Method: calibration', 'Ishikawa hypotheses and inspection checklist', 'Incident → Man / Machine / Material / Method → 5 Whys'],
  causal: ['Inspect an illustrative DAG; 91.2% is a demo assumption, not a measured effect.', 'Pressure 42 psi, confounders, complaint outcome', 'valve_pressure → leak → complaint; adjustment assumptions need validation', 'P(Y | do(X=x)) = SUM_z P(Y | X=x,Z=z) P(Z=z)'],
  fmea: ['Calculate a demo risk priority, not certified action priority.', 'Severity 8; Occurrence 6; Detection 5', 'RPN 240; inspect torque and bearing; human approval required', '8 * 6 * 5 = 240'],
  roi: ['Inspect a CFO scenario, not realized savings.', 'Preserved $1,249,000; investment $120,000', 'ROI 940.83%; breakeven needs daily cash flow', '(1249000 - 120000) / 120000 * 100'],
  shap: ['Review hypotheses; no fitted SHAP model here.', 'Pressure, vibration, material, calibration', 'Candidate contributors only', 'SHAP requires trained model and background data'],
  ledger: ['Inspect supplied demo evidence; no authenticated signatures loaded.', 'sensor_log_2024-06-10.json, PLC_DB1.DBX0.0, CAN_log', '#142 sample SHA256:a3f5c9e8d2b1…; not recomputed proof', 'SHA-256(canonical evidence bytes) compared to trusted digest'],
  audit: ['Local check, not an independent AI judge.', 'Loaded records and master contract', 'Local findings; v0 untouched; no production release', 'Produce → Check → Record → Human review'],
};

export function ComplaintActionPanel({ type, records }: { type: string; records: Array<{ id: string; complaint: string; factory: string }> }) {
  const [result, setResult] = useState('');
  const contract = CONTRACTS[type];
  if (!contract) return null;
  const run = () => {
    if (type === 'validate' || type === 'audit') {
      const missing = records.filter((r) => !r.id || !r.complaint.trim() || !r.factory).length;
      const duplicateIds = records.length - new Set(records.map((r) => r.id)).size;
      setResult(`Checked ${records.length} loaded records: ${missing} incomplete, ${duplicateIds} duplicate IDs. Local check only; no release or signature issued.`);
    } else if (type === 'dedupe' || type === 'merge') {
      const groups = new Map<string, string[]>();
      records.forEach((r) => { const key = r.complaint.trim().toLowerCase(); groups.set(key, [...(groups.get(key) || []), r.id]); });
      const duplicates = [...groups.values()].filter((g) => g.length > 1);
      setResult(duplicates.length ? `Preview: ${duplicates.map((g) => g.join(' ← ')).join('; ')}. Originals unchanged; sign-off required.` : 'No exact normalized-summary duplicates in the loaded records. No changes made.');
    } else setResult(`${contract[2]}. DEMO preview only; no external action, controller write, signature, or certified release.`);
  };
  return <section className="space-y-3"><p className="bg-amber-50 border border-amber-200 p-2 rounded">DEMO_MODE=true • Physical writes blocked • Changes require human sign-off</p>
    {contract.map((text, i) => <div key={i} className="border rounded p-3"><strong>{['Why / Prompt', 'Input', 'Output', 'Formula'][i]}:</strong><p className={i === 3 ? 'font-mono mt-1' : 'mt-1'}>{text}</p></div>)}
    <button className="bg-[#14B8A6] text-white rounded px-3 py-2" onClick={run}>Run local {type === 'validate' || type === 'audit' ? 'check' : 'preview'}</button>
    {result && <p role="status" className="p-3 border border-teal-200 bg-teal-50 rounded">{result}</p>}</section>;
}
export function NewComplaintForm({ factory, onCreate }: { factory: string; onCreate: (title: string, channel: string, location: string) => void }) {
  const [title, setTitle] = useState(''), [channel, setChannel] = useState('IoT PLC Tag'), [location, setLocation] = useState(factory);
  return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (title.trim()) onCreate(title.trim(), channel, location); }}>
    <label className="block">Incident title<input autoFocus required maxLength={500} value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full border rounded p-2 mt-1" /></label>
    <label className="block">Source channel<select value={channel} onChange={(e) => setChannel(e.target.value)} className="block w-full border rounded p-2 mt-1">{['IoT PLC Tag', 'CSV', 'Email', 'WhatsApp', 'QR', 'Voice', 'API'].map((s) => <option key={s}>{s}</option>)}</select></label>
    <label className="block">Factory<input required value={location} onChange={(e) => setLocation(e.target.value)} className="block w-full border rounded p-2 mt-1" /></label>
    <p>Input: incident, channel, factory. Output: session-only complaint awaiting sign-off. Formula: validate → assign unique ID → triage. No certified receipt is issued.</p>
    <button disabled={!title.trim() || !location.trim()} className="bg-[#14B8A6] text-white rounded px-3 py-2 disabled:opacity-40">Create demo complaint</button>
  </form>;
}

export function AddinConfigForm({ name, value, onSave }: { name: string; value: number; onSave: (frequency: number) => void }) {
  const [frequency, setFrequency] = useState(value);
  return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (Number.isInteger(frequency) && frequency >= 100 && frequency <= 60000) onSave(frequency); }}>
    <h3 className="font-bold">{name}</h3><label className="block">Polling interval (ms)<input type="number" min={100} max={60000} step={1} required value={frequency} onChange={(e) => setFrequency(e.target.valueAsNumber)} className="block w-full border rounded p-2 mt-1" /></label>
    <label className="flex gap-2"><input type="checkbox" checked disabled readOnly />DEMO_MODE=true — safety interlock locked</label>
    <p>Input: polling interval. Output: session configuration only. Formula: interval ≥ 100ms. No live polling or controller writes.</p>
    <button className="bg-[#14B8A6] text-white rounded px-3 py-2">Save session configuration</button>
  </form>;
}

