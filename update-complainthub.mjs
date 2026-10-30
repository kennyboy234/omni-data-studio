import { readFileSync, writeFileSync } from 'node:fs';
const path = 'c:/Users/USER/Documents/omni-data-studio/src/components/OmniDataStudio.tsx';
let source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
function replace(oldText, newText) {
  if (!source.includes(oldText)) throw new Error(`Missing target: ${oldText.slice(0, 100)}`);
  source = source.replaceAll(oldText, newText);
}
replace("| 'roi'", "| 'roi'\n    | 'ledger'\n    | 'plc'\n    | 'audit'");
replace("const sample = ALL_FUNCTIONS_13500.slice(0, 500);", "const sample = ALL_FUNCTIONS_13500;");
replace('(Sample 500 records)', '(13,500 catalog records; demo contracts)');
replace("onClick={() => onSwitchStudioMode('workbench')}", "onClick={() => setActiveTab('THE BRAIN')}");
replace("setSelectedFunction(f);\n                      setModalType('detail');", "setActiveTab(f.tab);\n                      setSelectedFunction({ ...f, factory });\n                      setModalType('detail');");
replace("if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {", "if (e.key === 'Escape') { setModalType(null); setSearch(''); }\n      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); setModalType('export'); }\n      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {");
replace("onClick={() => alert('CAPA Ticket #CAPA-8941 dispatched to maintenance team.')}", "onClick={() => setModalType('automate')}");
replace("onClick={() => alert('Cryptographic verification complete: All 142 block SHA-256 hashes recomputed and matched perfectly!')}", "onClick={() => setModalType('ledger')}");
replace("onClick={() => alert('Auditing WF02 Quality Contract')}", "onClick={() => setModalType('audit')}");
replace("onClick={() => alert('Auditing WF03 Cleaning Pipeline')}", "onClick={() => setModalType('audit')}");
replace("onClick={() => alert('Auditing WF05 Leakage Isolation')}", "onClick={() => setModalType('audit')}");
replace("onClick={() => alert('Auditing WF07 ML Benchmark')}", "onClick={() => setModalType('audit')}");
replace("onClick={() => alert('Judge Approved! Contract signed and released.')}", "onClick={() => setModalType('audit')}");
replace('onClick={onOpenBrain}', "onClick={() => setModalType('audit')}");
// Feature Registry is added alongside the ledger browser below.
replace("onClick={() => alert('Layout set to Default (2-7-3)')}", "onClick={() => setModalType('settings')}");
replace("onClick={() => alert('Sunlight mode locked with 18:1 contrast.')}", "onClick={() => setModalType('settings')}");
replace("onClick={() => alert('Density toggled!')}", "onClick={() => setActiveTab('THE BRAIN')}");
replace('Toggle Density', 'Switch to Deep Workbench');
replace("onClick={() => alert('Simulating covariate drift injection: PSI shifts from 0.04 to 0.31!')}", 'onClick={() => runDriftScan(true)}');
replace("setSelectedFunction(CORE_120_WORKFLOWS.find((f) => f.id === 'WF05') || CORE_120_WORKFLOWS[0]);\n                          setModalType('detail');", 'runDriftScan(false);');
replace("{modalType === 'shap' && 'C-10284: SHAP Explainer & Causal Attribution'}", "{modalType === 'shap' && 'C-10284: Explanatory hypotheses'}\n                  {modalType === 'roi' && 'WF94: CFO Scenario'}\n                  {modalType === 'plc' && 'PLC Tag Browser — 1,240 simulated tags'}\n                  {modalType === 'ledger' && 'Trust Ledger — Demo Evidence'}\n                  {modalType === 'audit' && 'Judge — Local Contract Review'}");
replace('{/* FORMULA MODAL */}', `<ComplaintActionPanel key={modalType} type={modalType} records={records} />
            {modalType === 'plc' && <PLCTagBrowser onSelect={(id) => { const f = ALL_FUNCTIONS_13500.find((item) => item.id === id); if (f) { setSelectedFunction({ ...f, factory }); setModalType('detail'); } }} />}
            {/* FORMULA MODAL */}`);
const start = source.indexOf("            {modalType === 'formula' && (");
const end = source.indexOf('            {/* EXPORT MODAL */}', start);
source = source.slice(0, start) + "            {modalType === 'formula' && <FormulaBrowser />}\n\n" + source.slice(end);
replace('className="bg-white rounded-2xl border', 'role="dialog" aria-modal="true" aria-label="ComplaintHub action" tabIndex={-1}\n            className="bg-white rounded-2xl border');
replace('w-[240px] sm:w-[280px]', 'w-[240px] sm:w-[320px]');
replace('Telemetry is polled read-only.', 'All telemetry is synthetic; no controller is connected.');
writeFileSync(path, source);
