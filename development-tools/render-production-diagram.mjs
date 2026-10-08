import { writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

// Keep this scene aligned with documentation/arch-production-architecture.md.
// Coordinates and dimensions are explicit so label edits do not alter the topology.
const width = 2500;
const height = 2420;
const parts = [];
const palette = {
  control: ['#eaf3ed', '#567f67'],
  compute: ['#eaf1fa', '#6284ad'],
  policy: ['#fff4df', '#b68d42'],
  model: ['#f2edfa', '#9277b3'],
  ops: ['#f2f4f3', '#87968c'],
};

const esc = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const add = fragment => parts.push(fragment);

function text(x, y, value, size = 20, fill = '#53675b', weight = 400) {
  add(`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}">${esc(value)}</text>`);
}

function section(y, h, n, title, subtitle) {
  add(`<rect x="35" y="${y}" width="2430" height="${h}" rx="20" fill="#fff" stroke="#dce5dc"/>`);
  text(65, y + 41, n, 19, '#789180', 700);
  text(112, y + 42, title, 29, '#263d30', 650);
  text(112, y + 77, subtitle, 18);
}

function node(x, y, w, h, title, lines, tone = 'control', badge) {
  const [fill, stroke] = palette[tone];
  add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`);
  if (badge) {
    text(x + 20, y + 27, badge.toUpperCase(), 12, stroke, 750);
  }
  text(x + 20, y + (badge ? 61 : 36), title, 24, '#233c2d', 650);
  lines.forEach((line, index) => {
    text(x + 20, y + (badge ? 94 : 73) + index * 29, line, 18);
  });
}

function edge(d, label, x, y, color = '#6b8475', dash = false) {
  add(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2.1" ${dash ? 'stroke-dasharray="7 6"' : ''} marker-end="url(#arrow)"/>`);
  if (label) {
    const len = label.length * 8.5;
    add(`<rect x="${x - 7}" y="${y - 20}" width="${len + 14}" height="27" rx="5" fill="#fff"/>`);
    text(x, y, label, 16, color, 550);
  }
}

add([
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`,
  `<title id="title">Architect 2.0 proposed production engineering drawing</title>`,
  `<desc id="desc">Prompt-to-preview path through Vercel, Convex authentication, admission, SQS, ECS coding workers, model and tool gateways, E2B sandboxes, S3 and an authenticated preview proxy. Separate GitHub and deployment pipelines publish apps. Cross-team Finance agent use has separate invocation and tool gates. All production execution services are proposals, not deployed prototype capabilities.</desc>`,
  `<defs>`,
  `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">`,
  `<path d="M0 0L10 5L0 10Z" fill="#6b8475"/>`,
  `</marker>`,
  `</defs>`,
  `<style>text{font-family:Inter,Segoe UI,Arial,sans-serif}path{stroke-linejoin:round;stroke-linecap:round}</style>`,
  `<rect width="2500" height="2420" fill="#fafbf8"/>`,
].join(''));
text(50, 59, 'ARCHITECT 2.0 / PROPOSED PRODUCTION ARCHITECTURE', 17, '#73897b', 700);
text(50, 108, 'From a prompt to a running application.', 44, '#223a2a', 650);
text(
  50, 145,
  'Prototype: 15 API checks + hosted Chrome/Edge sessions, shared edits, conflict discard and role/revocation checks passed. Runtime proposed.',
  20
);

section(
  178, 875, '01',
  'BUILD AN APP · CONTROL PLANE + ISOLATED EXECUTION',
  'The coding assistant runs outside untrusted app code. Checkpoints, scoped tools and bounded retries turn failures into recoverable steps.'
);
// Five aligned columns are shared by the build, release and reuse sections.
const xs = [65, 552, 1039, 1526, 2013];
const w = 420;
node(
  xs[0], 290, w, 181,
  'React workspace',
  [
    'Vercel static delivery',
    'Guided / Developer · same files',
    'Prompt, diff, terminal, preview',
  ],
  'control', 'Browser'
);
node(
  xs[1], 290, w, 181,
  'Convex + Better Auth',
  [
    'Login ID/password; Google optional',
    'Department roles + revision checks',
    'Catalog; proposed jobs + releases',
  ],
  'control', 'Identity & project API'
);
node(
  xs[2], 290, w, 181,
  'Admission + outbox',
  [
    'Authorize action; reserve budget',
    'Idempotent job + source version',
    'Fair dispatch; limits per tenant',
  ],
  'policy', 'Convex → dispatcher'
);
node(
  xs[3], 290, w, 181,
  'SQS + dead-letter queue',
  [
    'Durable work notification',
    'Lease / heartbeat; bounded retry',
    'Duplicate delivery handled',
  ],
  'compute', 'Separate queues per workload'
);
node(
  xs[4], 290, w, 181,
  'Coding harness workers',
  [
    'ECS Fargate · TypeScript',
    'Plan → patch → test → checkpoint',
    'Stop, resume, cancel, ask review',
  ],
  'compute', 'Trusted worker'
);
for (let i = 0; i < 4; i++) {
  edge(`M${xs[i] + w} 380H${xs[i + 1]}`);
}
text(
  66, 511,
  'Auth and project updates use Convex subscriptions. Large files live in S3; job records contain references, never provider credentials.',
  18
);

// Fan worker calls through the open gutter to their model, tool and sandbox destinations.
edge('M2223 471V549H275V619', 'model activity', 95, 580);
edge('M2223 549H762V619', 'tool activity', 600, 580);
edge('M2223 549H1249V619', 'sandbox activity', 1080, 580);
node(
  xs[0], 620, w, 233,
  'Model gateway',
  [
    'AI SDK provider adapters',
    'GPT / Claude / Gemini / local API',
    'Capability check before switching',
    'Token / latency / cost limits',
    'Provider keys stay server-side',
  ],
  'model', 'Typed inputs, tool calls & events'
);
node(
  xs[1], 620, w, 233,
  'Tool authorization gateway',
  [
    'Allowlisted tools and destinations',
    'Recheck tenant / grant / action',
    'Secrets Manager + KMS',
    'Short-lived scoped credentials',
    'Approval ≠ arbitrary shell access',
  ],
  'policy', 'Protected egress'
);
node(
  xs[2], 620, w, 233,
  'E2B build sandbox',
  [
    'Isolated Linux app environment',
    'Files, processes, tests, dev server',
    'Per-project sandbox lease + TTL',
    'No host or organization secrets',
    'Rebuild from versioned snapshot',
  ],
  'compute', 'Untrusted generated code'
);
node(
  xs[3], 620, w, 233,
  'S3 source + artifacts',
  [
    'Immutable version references',
    'Source, diffs, logs, test results',
    'Checksums + lifecycle retention',
    'Redaction before persistence',
    'Restore files, not external effects',
  ],
  'ops', 'Durable checkpoints'
);
node(
  xs[4], 620, w, 233,
  'Private preview ingress',
  [
    'ALB → authenticated proxy',
    'Validate user + sandbox ticket',
    'HTTP / WebSocket to app port',
    'Separate preview origin',
    'Never expose platform cookies',
  ],
  'compute', 'App traffic only'
);
edge('M1459 715H1526');
edge('M1249 853V921H2223V853', 'private app port · HTTP / WebSocket', 1530, 912);
edge('M2433 755H2450V273H275V290');
text(
  72, 978,
  'The outer return path carries the private preview into the browser iframe. A sandbox address is never a published app URL.',
  18
);
text(
  70, 1024,
  'Two proxies, two jobs: preview ingress routes private app traffic; model/tool gateways enforce allowed outbound capabilities.',
  18, '#517761', 600
);

section(
  1080, 392, '02',
  'CONNECT GIT · REVIEW · RELEASE',
  'A source checkpoint becomes an immutable release after checks and approval. GitHub is optional. App and platform deployments are separate.'
);
node(
  xs[0], 1190, w, 184,
  'GitHub App connector',
  [
    'Repo-scoped installation token',
    'Signed webhook inbox + dedupe',
    'Import / branch / PR / pull / push',
  ],
  'control', 'No personal access token in app'
);
node(
  xs[1], 1190, w, 184,
  'Release worker',
  [
    'Pinned S3 source + approved tests',
    'Idempotent release job + manifest',
    'Health gate; route or roll back',
  ],
  'compute', 'Separate build / release queue'
);
node(
  xs[2], 1190, w, 184,
  'E2B BuildKit → ECR',
  [
    'Isolated builder → S3 OCI archive',
    'Trusted publisher copies bytes',
    'Registry stores; never executes',
  ],
  'ops', 'Digest pinned / scanned'
);
node(
  xs[3], 1190, w, 184,
  'ECS Fargate app cells',
  [
    'Dedicated runtime tasks / roles',
    'App ingress; health + autoscale',
    'Regional cells; tenant isolation',
  ],
  'compute', 'Published container apps'
);
node(
  xs[4], 1190, w, 184,
  'Vercel app deployments',
  [
    'Static / compatible Node HTTP',
    'Preview → approved production',
    'Separate project + owned domain',
  ],
  'control', 'Published web apps'
);
edge(`M${xs[0]+w} 1280H${xs[1]}`, null, null, null, '#6b8475', true);
for (let i = 1; i < 3; i++) {
  edge(`M${xs[i] + w} 1280H${xs[i + 1]}`);
}
edge('M762 1374V1425H2223V1374', 'Alternative web target · never reuse the development sandbox as production', 945, 1418);
text(
  72, 1454,
  'Git and releases exchange versioned source with S3 (01). Published app URLs use their own ingress and credentials, not private preview tickets.',
  17
);

section(
  1500, 377, '03',
  'RUN THE APP · REUSE AN AGENT ACROSS TEAMS',
  'Support can invoke an approved Finance capability. Invocation rights, project editing and secret access are different permissions.'
);
node(
  xs[0], 1610, w, 183,
  'Support application',
  [
    'End-user identity + case context',
    'Pinned agent ID + version',
    'Typed input; request identifier',
  ],
  'control', 'Production runtime client'
);
node(
  xs[1], 1610, w, 183,
  'Invocation gate',
  [
    'Read registry + explicit grants',
    'Tenant / resource / action / expiry',
    'Fail closed if auth unavailable',
  ],
  'policy', 'Owner approval enforced'
);
node(
  xs[2], 1610, w, 183,
  'Finance-owned agent',
  [
    'Released immutable contract',
    'Department owns edits / releases',
    'Filtered structured response',
  ],
  'model', 'Same identity in Architect / Studio'
);
node(
  xs[3], 1610, w, 183,
  'Protected tool gate',
  [
    'Recheck access on every tool call',
    'Read-only invoice-status action',
    'Field filtering + scoped secret',
  ],
  'policy', 'No inherited refund permission'
);
node(
  xs[4], 1610, w, 183,
  'Customer billing API',
  [
    'Customer-owned source of truth',
    'No shared credential in prompts',
    'Return status / due date only',
  ],
  'ops', 'External system'
);
for (let i = 0; i < 4; i++) {
  edge(`M${xs[i] + w} 1700H${xs[i + 1]}`);
}
text(
  73, 1837,
  'Extend existing department project permissions with the proposed agent registry and invocation grants. Redacted runtime decisions are auditable.',
  18
);

section(
  1905, 363, '04',
  'OPERATE THE PLATFORM · SCALE WITH BOUNDS',
  'These are design decisions and capacity assumptions to test, not claims that this prototype is production-ready.'
);
node(
  65, 2014, 743, 196,
  'Platform release',
  [
    'Vercel UI · Convex production deployment',
    'ECS worker / gateway services behind ALB',
    'Infrastructure as code + isolated environments',
    'Canary checks, compatible migrations, rollback',
  ],
  'control', 'Separate from generated apps'
);
node(
  878, 2014, 743, 196,
  'Capacity and backpressure',
  [
    'Per-tenant admission and spend reservations',
    'Autoscale workers by queue age, cap sandbox leases',
    'Warm-pool / idle timeout / restore from snapshots',
    'Contract sandbox quotas; load-test each runtime cell',
  ],
  'compute', 'Thousands of users ≠ unlimited jobs'
);
node(
  1691, 2014, 743, 196,
  'Observability + recovery',
  [
    'OpenTelemetry → CloudWatch',
    'Trace IDs across request / job / sandbox / release',
    'Lease expiry, DLQ review, reconcile external effects',
    'Redact prompts, credentials and sensitive tool data',
  ],
  'ops', 'Every service emits bounded events'
);
text(52, 2311, 'READ WITH: documentation/arch-production-architecture.md', 19, '#2f5940', 700);
text(
  52, 2348,
  'The companion document explains service choices, exact request paths, failure recovery, ownership boundaries, scaling arithmetic and primary sources.',
  18
);
text(
  52, 2380,
  'Prototype API/UI evidence is documented separately in arch-engineering-drawing.md. The proposed production execution services are not provisioned.',
  17, '#7c8e81'
);
add('</svg>');
// Write the vector source and render the same scene at its authored width.
const svg = parts.join('\n');
await writeFile(new URL('../documentation/arch-production-architecture.svg', import.meta.url), svg);
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 2500 } }).render().asPng();
await writeFile(new URL('../documentation/arch-production-architecture.png', import.meta.url), png);
console.log('Production architecture SVG and PNG rendered.');
