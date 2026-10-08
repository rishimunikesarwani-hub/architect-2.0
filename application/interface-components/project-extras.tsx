import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownToLine, ArrowRight, Bot, Check, FileCode2, FileText, FlaskConical, GitBranch, Layers3, Palette, Plus, Save, Wrench, X } from 'lucide-react';
import type { AgentSpec, Project, ProjectFile } from '../types';
import { downloadText as download } from '../shared-logic/download-text';
import './project-extras.css';

type Kind = 'design' | 'artifacts' | 'gitagent' | 'studio' | 'tools';
interface Props { kind: Kind; project: Project; onChange: (project: Project) => boolean; onClose: () => void; notify: (message: string) => void }
type Design = { name: string; accent: string; instructions: string };
type ToolDraft = { name: string; method: string; endpoint: string; description: string; schema: string; environment: string; scope: 'read' | 'write'; approval: boolean };
const DESIGN_PATH = '.architect/design-systems.json';
const GUIDE_PATH = 'docs/design-guide.md';
const INSTRUCTIONS_PATH = 'agents/agent-instructions.md';
const CONFIG_PATH = '.architect/gitagent-example.json';
const PRESETS: Design[] = [
  { name: 'Quiet forest', accent: '#287552', instructions: 'Calm, spacious layouts. Clear language. Warm neutrals and a forest-green accent. Show the next action without overwhelming the reader.' },
  { name: 'Cobalt studio', accent: '#4764ad', instructions: 'A crisp, considered interface with clear hierarchy. Use cobalt for primary actions and keep supporting surfaces quiet.' },
  { name: 'Terracotta', accent: '#ad6146', instructions: 'Friendly, tactile, and warm. Use terracotta for important actions, with generous spacing and simple labels.' },
];
const META = {
  design: { eyebrow: 'A CONSISTENT POINT OF VIEW', title: 'Make it feel like you.', icon: Palette },
  artifacts: { eyebrow: 'TAKE THE THINKING WITH YOU', title: 'From project to artifact.', icon: FileText },
  gitagent: { eyebrow: 'FILES YOU CAN REASON ABOUT', title: 'An agent, defined in files.', icon: GitBranch },
  studio: { eyebrow: 'SAME AGENT. MORE ROOM.', title: 'A closer look at your agent.', icon: Bot },
  tools: { eyebrow: 'ONE CLEAR JOB. ONE CLEAR BOUNDARY.', title: 'Give your agent a custom tool.', icon: Wrench },
};
const bytes = (text: string) => new TextEncoder().encode(text).length;
const fileOf = (project: Project, path: string) => project.state.files.find((file) => file.path === path)?.content;
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
function putFile(files: ProjectFile[], path: string, content: string) { return files.some((file) => file.path === path) ? files.map((file) => file.path === path ? { path, content } : file) : [...files, { path, content }]; }
function checkpoint(project: Project, label: string) {
  const versions = [...project.state.versions, { id: crypto.randomUUID(), label, at: new Date().toISOString(), files: project.state.files.map((file) => ({ ...file })) }].slice(-8);
  while (versions.length > 1 && bytes(JSON.stringify(versions)) > 220_000) versions.shift();
  return versions;
}
function savedDesigns(project: Project): Design[] {
  try {
    const data: unknown = JSON.parse(fileOf(project, DESIGN_PATH) || '[]');
    return Array.isArray(data) ? data.filter((entry): entry is Design => !!entry && typeof entry === 'object' && typeof entry.name === 'string' && typeof entry.instructions === 'string' && /^#[\da-f]{6}$/i.test(entry.accent)).slice(0, 8) : [];
  } catch { return []; }
}
function freePath(project: Project, path: string) {
  let next = path; let index = 2;
  while (project.state.files.some((file) => file.path === next)) { next = path.replace(/(\.[^.]+)$/, `-${index}$1`); index += 1; }
  return next;
}
function artifacts(project: Project) {
  const plan = project.state.plan;
  const brief = `# ${project.title} — build brief\n\n> Project-derived sample artifact. Assembled from saved project fields; no model was called and no application behavior is verified by this document.\n\n## Goal\n\n${plan?.goal || project.description || 'Goal not specified.'}\n\n## Implementation direction\n\n- Framework: ${project.framework}\n- Stage: ${project.stage} (prototype UX state)\n- Source files: ${project.state.files.length}\n- Planned connections: ${project.state.connections.join(', ') || 'None'}\n\n## Agent responsibilities\n\n${project.state.agents.map((agent) => `- **${agent.name}**: ${agent.role}`).join('\n') || 'No agents configured.'}\n\n## Planned workflow\n\n${plan?.steps || 'The workspace does not have a saved plan yet.'}\n\n## Human approval\n\n${plan?.approval || 'Review before external actions or publication.'}\n\n## Verification boundary\n\nBuild, integration, Studio, and deployment flows in this prototype are simulations. Review the source and test a connected runtime before relying on results.\n`;
  const label = (value: string) => value.replace(/["\r\n\[\]<>]/g, ' ').slice(0, 100);
  const agents = project.state.agents.map((agent, index) => `  agent${index}["${label(agent.name)}: ${label(agent.role)}"]`);
  const links = project.state.agents.map((_, index) => `  ${index ? `agent${index - 1}` : 'request'} --> agent${index}`);
  const diagram = `%% Illustrative ordered workflow from saved agent names, not an executed runtime graph.\nflowchart TD\n  request["User request"]\n${agents.join('\n')}\n${links.join('\n')}\n  ${project.state.agents.length ? `agent${project.state.agents.length - 1}` : 'request'} --> review["Human review"]\n  review --> result["Approved result"]\n`;
  return { brief, diagram };
}
function defaultInstructions(project: Project) {
  const agent = project.state.agents[0];
  return `# ${agent?.name || project.title}\n\n${agent?.instructions || 'Describe the agent role, required inputs, allowed tools, and review boundaries.'}\n\n## Skills (instruction notes only)\n\nDescribe reusable tasks and when the agent should use them. No skill runtime is installed by this file.\n\n## Memory (instruction notes only)\n\nDescribe the context that may be retained and when it should expire. Do not retain secrets or unnecessary personal data. No persistent agent memory service is connected.\n\n## Approval boundary\n\nAsk before external writes, sending messages, or publishing. Keep credentials in protected backend settings.\n`;
}
function foreground(hex: string) { const parts = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)); return parts[0] * 0.299 + parts[1] * 0.587 + parts[2] * 0.114 > 165 ? '#17231b' : '#ffffff'; }

export default function ProjectExtras({ kind, project, onChange, onClose, notify }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [design, setDesign] = useState<Design>(() => savedDesigns(project)[0] || PRESETS[0]);
  const [importKind, setImportKind] = useState('Figma');
  const [importReference, setImportReference] = useState('');
  const [importReviewed, setImportReviewed] = useState(false);
  const [artifactTab, setArtifactTab] = useState<'brief' | 'diagram'>('brief');
  const [generated, setGenerated] = useState<ReturnType<typeof artifacts> | null>(null);
  const [agentIndex, setAgentIndex] = useState(0);
  const [agent, setAgent] = useState<AgentSpec | undefined>(project.state.agents[0]);
  const [agentInstructions, setAgentInstructions] = useState(() => fileOf(project, INSTRUCTIONS_PATH) ?? defaultInstructions(project));
  const [agentConfig, setAgentConfig] = useState(() => fileOf(project, CONFIG_PATH) ?? JSON.stringify({ notice: 'Illustrative handoff only. This is not a validated GitAgent runtime schema.', name: project.state.agents[0]?.name || project.title, framework: project.framework, instructionsFile: INSTRUCTIONS_PATH, approval: 'Human review before external actions', plannedTools: project.state.connections }, null, 2));
  const [configTab, setConfigTab] = useState<'instructions' | 'config'>('instructions');
  const [tool, setTool] = useState<ToolDraft>({ name: '', method: 'GET', endpoint: '', description: '', schema: JSON.stringify({ type: 'object', properties: { query: { type: 'string', description: 'A search term' } }, required: ['query'] }, null, 2), environment: '', scope: 'read', approval: true });
  const [toolReview, setToolReview] = useState<{ request: string; result: string } | null>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = dialog.current?.querySelector<HTMLElement>('button'); first?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key !== 'Tab') return;
      const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]') || []).filter((element) => element.getClientRects().length > 0);
      const firstElement = elements[0]; const lastElement = elements.at(-1);
      if (!firstElement) { event.preventDefault(); dialog.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === firstElement || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); lastElement?.focus(); }
      else if (!event.shiftKey && (document.activeElement === lastElement || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); firstElement.focus(); }
    };
    document.addEventListener('keydown', keydown, true);
    return () => {
      document.removeEventListener('keydown', keydown, true); document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>('[aria-label="More project actions"]')?.focus();
    };
  }, []);

  function commit(files: ProjectFile[], label: string, additional: Partial<Project['state']> = {}) {
    setError('');
    const next = { ...project, updatedAt: Date.now(), state: { ...project.state, ...additional, files, versions: checkpoint(project, label) } };
    if (!onChange(next)) { setError('The change could not be saved. Your current files are unchanged.'); return false; }
    return true;
  }
  function done(message: string) { setFeedback(message); notify(message); }
  function validateInput(...values: string[]) {
    if (values.some((value) => bytes(value) >= 12_000)) { setError('Keep each field below 12 KB so this prototype can save it reliably.'); return false; }
    setError(''); return true;
  }
  function saveDesign(apply: boolean) {
    if (!design.name.trim() || !/^#[\da-f]{6}$/i.test(design.accent)) { setError('Give the design a name and a six-digit hex color.'); return; }
    if (!validateInput(design.instructions, design.name)) return;
    const presets = [design, ...savedDesigns(project).filter((entry) => entry.name !== design.name)].slice(0, 8);
    let files = putFile(project.state.files, DESIGN_PATH, JSON.stringify(presets, null, 2));
    const entry = files.find((file) => file.path === 'index.html') || files.find((file) => /(?:^|\/)index\.html$/i.test(file.path));
    if (apply && !entry) { setError('This project has no index.html preview. Save the reusable design, then apply it after adding an HTML entry point.'); return; }
    files = putFile(files, GUIDE_PATH, `# ${design.name}\n\nPrimary accent: ${design.accent}\n\n## Brand instructions\n\n${design.instructions || 'No instructions added.'}\n\n## Preview scope\n\nThis guide is saved project context. Applying it adds an accent stylesheet to the HTML preview; it does not infer a full visual system or execute brand instructions. Import references in this prototype are simulated and are not fetched.\n`);
    if (apply && entry) {
      const style = `<style data-architect-design-system>\n:root{--architect-accent:${design.accent}} .primary,button#run,button[type="submit"],[data-architect-accent]{background:${design.accent}!important;color:${foreground(design.accent)}!important}a{color:${design.accent}} .mark,.dot{background:${design.accent}!important;color:${foreground(design.accent)}!important}\n</style>`;
      const original = entry.content.replace(/<style\s+data-architect-design-system(?:="[^"]*")?\s*>[\s\S]*?<\/style>/gi, '');
      const source = /<\/head>/i.test(original) ? original.replace(/<\/head>/i, `${style}</head>`) : style + original;
      files = putFile(files, entry.path, source);
    }
    if (commit(files, apply ? 'Before applying design system' : 'Before saving reusable design', apply ? { theme: design.name } : {})) done(apply ? 'Accent applied to the actual HTML preview. Check version history for retained source checkpoints.' : 'Reusable design and brand guide saved in project files.');
  }
  function saveArtifacts() {
    if (!generated) return;
    let files = putFile(project.state.files, freePath(project, 'artifacts/build-brief.md'), generated.brief);
    files = putFile(files, freePath(project, 'artifacts/agent-workflow.mmd'), generated.diagram);
    if (commit(files, 'Before adding build artifacts')) done('Brief and diagram saved as new project files. Existing artifacts were preserved.');
  }
  function saveGitAgent() {
    if (!validateInput(agentInstructions, agentConfig)) return;
    if (!agentInstructions.trim()) { setError('Add instructions before saving the handoff.'); return; }
    try { const value: unknown = JSON.parse(agentConfig); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object'); }
    catch { setError('The example configuration must be a valid JSON object.'); return; }
    let files = putFile(project.state.files, INSTRUCTIONS_PATH, agentInstructions);
    files = putFile(files, CONFIG_PATH, agentConfig);
    files = putFile(files, 'docs/gitagent-handoff.md', '# GitAgent-style file-first handoff\n\nThese files demonstrate a file-first configuration workflow. They are project documentation, not a vendor-validated executable schema.\n\n- `agents/agent-instructions.md`: editable agent instructions.\n- `.architect/gitagent-example.json`: illustrative configuration.\n\nBefore using a runtime, check its current official schema, map fields explicitly, configure credentials on the server, and run real tests. No GitAgent runtime is installed or invoked by this prototype.\n');
    if (commit(files, 'Before editing file-first agent handoff')) done('Instructions, example configuration, and handoff guide saved to source. No runtime was executed.');
  }
  function saveStudio() {
    if (!agent || !project.state.agents[agentIndex]) return;
    if (!agent.name.trim() || !agent.role.trim() || !agent.instructions.trim()) { setError('Complete the agent name, role, and instructions.'); return; }
    if (!validateInput(agent.name, agent.role, agent.model, agent.instructions)) return;
    const agents = project.state.agents.map((existing, index) => index === agentIndex ? { ...agent } : existing);
    const files = putFile(project.state.files, 'docs/studio-handoff.md', `# Studio handoff preview\n\nMode: in-app simulation. No external Studio account or project is connected.\n\nThis handoff edited the existing agent at position ${agentIndex + 1} in this project.\n\n- Agent: ${agent.name}\n- Role: ${agent.role}\n- Model preference: ${agent.model}\n\n## Instructions\n\n${agent.instructions}\n\nChanges are saved to the same project agent configuration. Runtime execution and external Studio synchronization are not implemented.\n`);
    if (commit(files, 'Before Studio handoff edit', { agents })) done(`Saved ${agent.name} back to this project's existing agent. Studio handoff remains a simulation.`);
  }

  function editTool(patch: Partial<ToolDraft>) { setTool({ ...tool, ...patch }); setToolReview(null); setFeedback(''); setError(''); }
  function toolDefinition() {
    if (!tool.name.trim() || !tool.description.trim()) { setError('Add a tool name and a short description of its job.'); return null; }
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(tool.method)) { setError('Choose one of the supported HTTP methods.'); return null; }
    if (!validateInput(tool.name, tool.endpoint, tool.description, tool.schema, tool.environment)) return null;
    try {
      const endpoint = new URL(tool.endpoint);
      if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('protocol');
      if ([...endpoint.searchParams.keys()].some((key) => /^(?:api[_-]?key|access[_-]?token|token|secret|password|authorization)$/i.test(key))) { setError('Keep credentials out of the endpoint URL. Use an authentication environment-variable name instead.'); return null; }
    } catch { setError('Enter a valid HTTPS endpoint without embedded credentials.'); return null; }
    if (tool.environment && !/^[A-Z][A-Z0-9_]{1,79}$/.test(tool.environment)) { setError('Use an uppercase environment-variable name such as SEARCH_API_KEY, or leave it blank for no authentication.'); return null; }
    let inputSchema: Record<string, unknown>;
    try {
      const value: unknown = JSON.parse(tool.schema);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object');
      inputSchema = value as Record<string, unknown>;
      if (inputSchema.type !== 'object') throw new Error('object type');
      const properties = inputSchema.properties;
      if (properties !== undefined && (!properties || typeof properties !== 'object' || Array.isArray(properties))) throw new Error('properties');
      if (properties && Object.values(properties).some((field) => !field || typeof field !== 'object' || Array.isArray(field))) throw new Error('property definitions');
      if (inputSchema.required !== undefined && (!Array.isArray(inputSchema.required) || inputSchema.required.some((name) => typeof name !== 'string' || !Object.hasOwn(properties || {}, name)))) throw new Error('required keys');
    } catch { setError('Use valid JSON with type "object", object-valued property definitions, and required names declared in properties.'); return null; }
    return {
      name: tool.name.trim(), description: tool.description.trim(), method: tool.method, endpoint: tool.endpoint.trim(),
      inputSchema, auth: tool.environment ? { type: 'bearer', environmentVariable: tool.environment } : { type: 'none' },
      scope: tool.scope, humanApprovalRequired: tool.approval,
      status: 'definition-only', notice: 'Prototype HTTP tool definition. Endpoint not called or verified. A connected runtime must validate its schema, permissions, credentials, and responses before use.',
    };
  }
  function reviewTool() {
    const definition = toolDefinition(); if (!definition) return;
    const properties = (definition.inputSchema.properties || {}) as Record<string, Record<string, unknown>>;
    const sample = Object.fromEntries(Object.entries(properties).map(([name, property]) => [name, property.type === 'number' || property.type === 'integer' ? 1 : property.type === 'boolean' ? true : property.type === 'array' ? [] : property.type === 'object' ? {} : `sample-${name}`]));
    const endpoint = new URL(definition.endpoint);
    if (definition.method === 'GET') Object.entries(sample).forEach(([key, value]) => endpoint.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value)));
    const auth = tool.environment ? `\nAuthorization: Bearer [value of ${tool.environment} — not configured]` : '';
    const body = definition.method === 'GET' ? '' : `\nContent-Type: application/json\n\n${JSON.stringify(sample, null, 2)}`;
    setToolReview({ request: `${definition.method} ${endpoint.toString()}${auth}${body}`, result: JSON.stringify({ simulation: true, status: 'illustrative-result', tool: definition.name, data: { message: 'An example result would appear here. No request has been sent.' } }, null, 2) });
  }
  function saveTool() {
    const definition = toolDefinition(); if (!definition || !toolReview) return;
    const path = `.architect/tools/${slug(definition.name)}.json`;
    if (commit(putFile(project.state.files, path, JSON.stringify(definition, null, 2)), `Before saving custom tool ${definition.name}`)) done(`Tool definition saved to ${path}. Endpoint not called; no connection created.`);
  }

  const meta = META[kind]; const Icon = meta.icon;
  const library = savedDesigns(project);
  const designPresets = [...PRESETS.filter((preset) => !library.some((saved) => saved.name === preset.name)), ...library];
  return createPortal(<div className="px-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialog} className="px-dialog" role="dialog" aria-modal="true" aria-labelledby="px-title" tabIndex={-1}>
    <header className="px-header"><span className="px-feature-icon"><Icon size={21} /></span><div><span className="px-eyebrow">{meta.eyebrow}</span><h2 id="px-title">{meta.title}</h2></div><button className="px-close" aria-label="Close project feature" onClick={onClose}><X size={19} /></button></header>
    <div className="px-content">
      {kind === 'design' && <><p className="px-intro">Give your project a reusable visual direction. Colors update the preview; brand instructions stay with your source.</p><div className="px-presets">{designPresets.map((preset, index) => <button key={`${preset.name}-${index}`} className={design.name === preset.name ? 'selected' : ''} onClick={() => { setDesign(preset); setFeedback(''); }}><i style={{ background: preset.accent }} /><span>{preset.name}</span>{design.name === preset.name && <Check size={13} />}</button>)}</div><div className="px-design-grid"><div><label className="px-field">Design name<input value={design.name} maxLength={80} onChange={(event) => setDesign({ ...design, name: event.target.value })} /></label><label className="px-field">Primary accent<span className="px-color-control"><input type="color" aria-label="Primary accent color" value={design.accent} onChange={(event) => setDesign({ ...design, accent: event.target.value })} /><code>{design.accent.toUpperCase()}</code></span></label><label className="px-field">Brand instructions<textarea value={design.instructions} maxLength={3500} rows={4} onChange={(event) => setDesign({ ...design, instructions: event.target.value })} placeholder="How should this product feel and speak?" /></label></div><div className="px-design-preview" style={{ '--px-accent': design.accent, '--px-on-accent': foreground(design.accent) } as CSSProperties}><span className="px-preview-chip"><Layers3 size={13} /> Your design direction</span><h3>A little more<br />you.</h3><p>Calm surfaces. Clear choices. One recognizable accent.</p><span className="px-sample-action">Take the next step <ArrowRight size={14} /></span><small>Sample appearance · Actual preview changes on Apply</small></div></div><details className="px-import"><summary><Plus size={14} /> Import a design reference <span className="px-sim"><FlaskConical size={11} /> Simulation</span></summary><p>Walk through an import. Nothing is uploaded, fetched, parsed, or connected.</p><div className="px-inline"><label className="px-field">Source<select value={importKind} onChange={(event) => { setImportKind(event.target.value); setImportReviewed(false); }}>{['Figma', 'PDF', 'Repository', 'ZIP'].map((name) => <option key={name}>{name}</option>)}</select></label><label className="px-field">{importKind === 'PDF' || importKind === 'ZIP' ? 'Example filename' : 'Example reference URL'}<input value={importReference} maxLength={300} placeholder={importKind === 'PDF' ? 'brand-guide.pdf' : importKind === 'ZIP' ? 'design-system.zip' : 'https://example.com/design-reference'} onChange={(event) => { setImportReference(event.target.value); setImportReviewed(false); }} /></label></div><button className="px-secondary" disabled={!importReference.trim()} onClick={() => setImportReviewed(true)}>Review sample import<ArrowRight size={13} /></button>{importReviewed && <div className="px-import-result"><strong>Illustrative import review</strong><p>{importKind} reference: {importReference}. This sample proposes a cobalt accent and simple brand guidance; it is not extracted from your reference.</p><button className="px-secondary" onClick={() => { setDesign({ ...PRESETS[1], name: `${importKind} sample` }); done('Sample design loaded for review. No reference was accessed.'); }}>Use sample direction<Check size={13} /></button></div>}</details><div className="px-actions"><button className="px-secondary" onClick={() => saveDesign(false)}><Save size={14} /> Save reusable design</button><button className="px-primary" onClick={() => saveDesign(true)}>Apply to preview<ArrowRight size={14} /></button></div></>}
      {kind === 'artifacts' && <><div className="px-context"><FileText size={16} /><span>Project-derived samples. These files summarize saved project fields; no AI model or build is run.</span></div><p className="px-intro">Create a portable brief and a Mermaid workflow diagram from <strong>{project.title}</strong>. Download them or keep them beside your source.</p><div className="px-artifact-cards"><div><FileText size={23} /><strong>Build brief</strong><span>Goal, framework, roles, and approval boundary.</span><code>Markdown · .md</code></div><div><GitBranch size={23} /><strong>Workflow diagram</strong><span>An illustrative sequence using your saved agents.</span><code>Mermaid · .mmd</code></div></div>{generated ? <><div className="px-tabs" role="tablist" aria-label="Artifact preview"><button role="tab" aria-selected={artifactTab === 'brief'} onClick={() => setArtifactTab('brief')}>Build brief</button><button role="tab" aria-selected={artifactTab === 'diagram'} onClick={() => setArtifactTab('diagram')}>Diagram source</button></div><pre className="px-source-preview" tabIndex={0} aria-label="Generated artifact preview">{generated[artifactTab]}</pre><div className="px-actions"><button className="px-secondary" onClick={() => download(`${slug(project.title)}-${artifactTab === 'brief' ? 'brief.md' : 'workflow.mmd'}`, generated[artifactTab])}><ArrowDownToLine size={14} /> Download {artifactTab === 'brief' ? 'brief' : 'diagram'}</button><button className="px-primary" onClick={saveArtifacts}>Save both to source<Save size={14} /></button></div></> : <div className="px-actions"><span className="px-footnote">Existing files are preserved with new filenames.</span><button className="px-primary" onClick={() => { setGenerated(artifacts(project)); setFeedback(''); }}>Create sample artifacts<ArrowRight size={14} /></button></div>}</>}
      {kind === 'gitagent' && <><div className="px-context"><FileCode2 size={16} /><span>File-first handoff example. This is documentation, not a validated GitAgent executable schema.</span></div><p className="px-intro">Keep agent intent readable and reviewable in source control. Edit the instructions and example configuration, then save them with this project.</p><div className="px-tabs" role="tablist" aria-label="Agent source files"><button role="tab" aria-selected={configTab === 'instructions'} onClick={() => setConfigTab('instructions')}>Instructions</button><button role="tab" aria-selected={configTab === 'config'} onClick={() => setConfigTab('config')}>Example configuration</button></div><div className="px-editor-title"><FileCode2 size={13} /><code>{configTab === 'instructions' ? INSTRUCTIONS_PATH : CONFIG_PATH}</code><span>Illustrative</span></div><textarea className="px-code-editor" aria-label={configTab === 'instructions' ? 'File-first agent instructions' : 'File-first example configuration'} spellCheck={false} value={configTab === 'instructions' ? agentInstructions : agentConfig} maxLength={9000} onChange={(event) => configTab === 'instructions' ? setAgentInstructions(event.target.value) : setAgentConfig(event.target.value)} /><p className="px-footnote">Under 12 KB per field. Keep secrets in backend environment settings. Map these files to your chosen runtime's current schema before execution.</p><div className="px-actions"><button className="px-secondary" onClick={() => download(configTab === 'instructions' ? 'agent-instructions.md' : 'gitagent-example.json', configTab === 'instructions' ? agentInstructions : agentConfig)}><ArrowDownToLine size={14} /> Download current file</button><button className="px-primary" onClick={saveGitAgent}>Save handoff files<Save size={14} /></button></div></>}
      {kind === 'studio' && <><div className="px-context"><span className="px-sim"><FlaskConical size={11} /> Simulation</span><span>In-app Studio handoff. No external Studio account, project, or runtime is opened.</span></div>{agent ? <><div className="px-studio-route"><span>{project.title}</span><ArrowRight size={13} /><strong>{project.state.agents[agentIndex]?.name}</strong><ArrowRight size={13} /><span>Studio preview</span></div><label className="px-field">Existing project agent<select value={agentIndex} onChange={(event) => { const index = Number(event.target.value); setAgentIndex(index); setAgent({ ...project.state.agents[index] }); setFeedback(''); setError(''); }}>{project.state.agents.map((existing, index) => <option key={index} value={index}>{existing.name}</option>)}</select></label><div className="px-inline"><label className="px-field">Agent name<input value={agent.name} maxLength={100} onChange={(event) => setAgent({ ...agent, name: event.target.value })} /></label><label className="px-field">Model preference<input value={agent.model} maxLength={100} onChange={(event) => setAgent({ ...agent, model: event.target.value })} /></label></div><label className="px-field">Role<input value={agent.role} maxLength={250} onChange={(event) => setAgent({ ...agent, role: event.target.value })} /></label><label className="px-field">Instructions<textarea value={agent.instructions} rows={6} maxLength={3500} onChange={(event) => setAgent({ ...agent, instructions: event.target.value })} /></label><div className="px-return-note"><Bot size={17} /><p>Save returns these edits to <strong>agent {agentIndex + 1} in this project</strong>. It does not create a second agent or change another workspace.</p></div><div className="px-actions"><button className="px-secondary" onClick={onClose}>Back to project</button><button className="px-primary" onClick={saveStudio}>Save to same agent<Check size={14} /></button></div></> : <div className="px-empty"><Bot size={30} /><h3>An agent comes first.</h3><p>Add an agent in this project's Agents view, then explore the Studio handoff with that agent.</p><button className="px-secondary" onClick={onClose}>Back to project</button></div>}</>}
      {kind === 'tools' && <><div className="px-context"><span className="px-sim"><FlaskConical size={11} /> Simulation</span><span>Define and review an HTTP tool. This prototype does not call endpoints, configure credentials, or connect a runtime.</span></div><div className="px-inline"><label className="px-field">Tool name<input value={tool.name} maxLength={80} placeholder="Search company knowledge" onChange={(event) => editTool({ name: event.target.value })} /></label><label className="px-field">HTTP method<select value={tool.method} onChange={(event) => editTool({ method: event.target.value, scope: event.target.value === 'GET' ? 'read' : 'write', approval: true })}>{['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => <option key={method}>{method}</option>)}</select></label></div><label className="px-field">HTTPS endpoint<input type="url" value={tool.endpoint} maxLength={600} placeholder="https://api.example.com/search" onChange={(event) => editTool({ endpoint: event.target.value })} /></label><label className="px-field">What does this tool do?<textarea rows={2} value={tool.description} maxLength={2000} placeholder="Searches approved knowledge sources and returns matching documents." onChange={(event) => editTool({ description: event.target.value })} /></label><label className="px-field">Input JSON schema<textarea className="px-tool-schema" spellCheck={false} rows={8} value={tool.schema} maxLength={9000} onChange={(event) => editTool({ schema: event.target.value })} /></label><p className="px-footnote px-tool-schema-note">JSON syntax and object structure are checked here. Runtime schema validation is not implemented. Sample values are illustrative, and may not satisfy every schema constraint.</p><div className="px-inline"><label className="px-field">Authentication variable name<input value={tool.environment} maxLength={80} placeholder="SEARCH_API_KEY (optional)" onChange={(event) => editTool({ environment: event.target.value })} /><small className="px-field-help">Name only. No secret value is entered or stored.</small></label><label className="px-field">Requested scope<select value={tool.scope} onChange={(event) => editTool({ scope: event.target.value === 'write' ? 'write' : 'read' })}><option value="read">Read — retrieve information</option><option value="write">Write — change external data</option></select></label></div><label className="px-tool-approval"><input type="checkbox" checked={tool.approval} onChange={(event) => editTool({ approval: event.target.checked })} /><span><strong>Require human approval</strong><small>{tool.scope === 'write' ? 'Review each proposed external change before a connected runtime sends it.' : 'Review the proposed request before a connected runtime sends it.'}</small></span></label><button className="px-secondary" onClick={reviewTool}>Review sample request<ArrowRight size={14} /></button>{toolReview && <section className="px-tool-review" aria-label="Simulated HTTP tool review"><div><h3>Sample request</h3><span className="px-sim">Not sent</span></div><pre className="px-source-preview" tabIndex={0}>{toolReview.request}</pre><div><h3>Illustrative result</h3><span className="px-sim">Not a live response</span></div><pre className="px-source-preview" tabIndex={0}>{toolReview.result}</pre><p className="px-footnote">{tool.scope === 'write' ? 'Write scope' : 'Read scope'} · Human approval {tool.approval ? 'required' : 'not required'} in the saved proposal. A production runtime must enforce the chosen boundary.</p></section>}<div className="px-actions"><span className="px-footnote">Saved as a project-side definition. A source checkpoint is retained when workspace space allows.</span><button className="px-primary" disabled={!toolReview} onClick={saveTool}>Save tool definition<Save size={14} /></button></div></>}
      {error && <p className="px-error" role="alert">{error}</p>}{feedback && <p className="px-feedback" role="status"><Check size={14} />{feedback}</p>}
    </div><footer className="px-footer"><span>{project.title}</span><span>Changes stay with this project</span></footer>
  </div></div>, document.body);
}
