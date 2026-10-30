import masterDocument from '../../docs/120_FEATURES_MASTER.md?raw';

export { masterDocument };
export const DEMO_MODE = true as const;
export interface FunctionContract {
  id: string; name: string; prompt: string; input: string; output: string;
  formula: string; group: 'GROUP1' | 'GROUP2' | 'GROUP3' | 'GROUP4' | 'GROUP5';
  tab: string; factory: string; category?: string;
}

// Coverage of specification contracts is not proof of runtime implementation.
export function parseMasterWorkflows(document: string): FunctionContract[] {
  return [...document.matchAll(/^- \*\*(WF\d+) ([^\n]+?)\*\*:\s*(.+)$/gm)].map((match) => {
    const [, id, name, prompt] = match;
    const n = Number(id.slice(2));
    const tab = n === 1 ? 'INTAKE' : n === 10 || n === 11 || n === 16 ? 'INVESTIGATION'
      : n === 29 || n === 89 || n === 98 ? 'RESOLUTION'
      : n >= 81 && n <= 88 || n === 94 || n === 5 || n === 6 ? 'ANALYTICS'
      : n === 27 || n === 28 || n === 31 ? 'TRIAGE' : 'QUALITY';
    return { id, name, prompt, input: `Workflow-specific evidence for ${id}; consult the master specification.`,
      output: `${name} contract preview; execution requires a supported engine.`,
      formula: prompt.match(/Formula:\s*`([^`]+)`/)?.[1] || 'See workflow specification; no executable formula declared.',
      group: tab === 'INTAKE' ? 'GROUP1' : tab === 'TRIAGE' ? 'GROUP2'
        : tab === 'RESOLUTION' || tab === 'INVESTIGATION' ? 'GROUP4' : tab === 'ANALYTICS' ? 'GROUP5' : 'GROUP3',
      tab, factory: 'All', category: 'Core specification contract' };
  });
}

export function calculatePSI(baseline: number[], current: number[]): number {
  if (!baseline.length || baseline.length !== current.length ||
      [...baseline, ...current].some((v) => !Number.isFinite(v) || v < 0) ||
      baseline.reduce((a, b) => a + b, 0) === 0 || current.reduce((a, b) => a + b, 0) === 0) {
    throw new Error('Use equal-length, non-negative distributions with positive totals.');
  }
  const normalize = (values: number[]) => {
    const smoothed = values.map((v) => v + 0.000001);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map((v) => v / sum);
  };
  const a = normalize(baseline), b = normalize(current);
  return a.reduce((sum, p, i) => sum + (b[i] - p) * Math.log(b[i] / p), 0);
}

export interface SimulatedTag { id: string; tag: string; value: number; quality: string; trust: string; }
export const PLC_TAGS: SimulatedTag[] = Array.from({ length: 1240 }, (_, index) => ({
  id: index < 900 ? `SIE-${String(index + 1).padStart(4, '0')}` : `ROK-${String(index - 899).padStart(4, '0')}`,
  tag: index === 0 ? 'DB1.DBX0.0' : index === 1 ? 'DB1.DBW2'
    : index < 900 ? `DB${1 + Math.floor(index / 64)}.DBX${Math.floor(index % 64 / 8)}.${index % 8}` : `ControlLogix.Tag_${index - 899}`,
  value: index === 1 ? 87 : index % 2,
  quality: 'Good (simulated)', trust: '#142 demo reference',
}));

export function filterPage<T>(items: T[], query: string, page: number, size = 25) {
  const matches = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(matches.length / size));
  const safePage = Math.min(Math.max(0, page), pages - 1);
  return { rows: matches.slice(safePage * size, (safePage + 1) * size), total: matches.length, pages, page: safePage };
}

export function functionsToCSV(functions: FunctionContract[]): string {
  const fields = ['id', 'name', 'prompt', 'input', 'output', 'formula', 'group', 'tab', 'factory'] as const;
  const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return ['ID,Name,Prompt,Input,Output,Formula,Group,Tab,Factory,Trust',
    ...functions.map((f) => [...fields.map((key) => quote(f[key])), quote('DEMO — not certified')].join(','))].join('\r\n');
}

const METRICS = [
  { name: 'LOSS_BY_MODE', why: 'Sum loss per failure mode.', input: 'Loss amounts and mode labels', output: 'Currency totals per mode', formula: 'SUM(loss) GROUP BY mode' },
  { name: 'MTBF', why: 'Measure mean operating time between failures.', input: 'Operating hours and failure count > 0', output: 'Hours per failure', formula: 'operating_hours / failure_count' },
  { name: 'ROI', why: 'Estimate return on investment.', input: 'Preserved value and cost > 0', output: 'ROI percent (scenario)', formula: '(preserved - cost) / cost * 100' },
  { name: 'PSI', why: 'Compare baseline and current bin proportions.', input: 'Equal-length baseline/current distributions', output: 'Population stability index', formula: 'SUM((current - baseline) * LN(current / baseline))' },
  { name: 'RPN', why: 'Prioritize failure-mode investigation, not an AIAG action-priority certification.', input: 'Severity, occurrence, detection: integers 1–10', output: 'RPN 1–1000', formula: 'severity * occurrence * detection' },
  { name: 'TRUST_HASH', why: 'Digest evidence bytes; hashing alone does not certify compliance.', input: 'Canonical evidence bytes', output: 'SHA-256 digest', formula: 'SHA-256(canonical_payload)' },
];
// Six formula families with explicit scoped presets, not 1,247 unique algorithms.
export const FORMULA_PRESETS = Array.from({ length: 1247 }, (_, i) => ({
  ...METRICS[i % METRICS.length], id: `FX-${String(i + 1).padStart(4, '0')}`,
  scope: i < 6 ? 'All factories' : `Asset scope ${Math.floor(i / 6) + 1}`,
}));
