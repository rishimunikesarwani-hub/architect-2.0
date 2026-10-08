/**
 * This check writes to the development backend. Run it only when that check
 * has been approved: node development-tools/smoke-department-backend.mjs --run
 * Without --run it makes no requests.
 *
 * It uses Better Auth's normal signup, username sign-in, token and sign-out
 * routes with the hosted app's origin. Passwords and session tokens stay in
 * memory. The report never prints them. Labeled test accounts, the workspace
 * and the test app remain available afterward; existing app data is preserved.
 */
import { randomBytes } from 'node:crypto';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../application/backend/_generated/api.js';

const SITE = 'https://perceptive-ermine-27.convex.site';
const CLOUD = 'https://perceptive-ermine-27.convex.cloud';
const ORIGIN = 'https://architect-2-weld.vercel.app';
const timeoutFetch = (url, init = {}) => fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(20_000) });
const client = () => new ConvexHttpClient(CLOUD, { logger: false, fetch: timeoutFetch });
const check = (condition) => { if (!condition) throw new Error('Check failed'); };

async function auth(path, body, sessionToken) {
  return timeoutFetch(`${SITE}/api/auth${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: ORIGIN, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function denied(operation, expected) {
  try { await operation(); } catch (error) {
    // Check the denial text without printing responses that may contain tokens.
    check(String(error).includes(expected)); return;
  }
  throw new Error('Expected access denial');
}

async function main() {
  const runId = `${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
  const report = { deployment: 'dev:perceptive-ermine-27', runId, passed: false,
    workspaceId: null, appId: null, loginIds: {}, checks: [], retained: 'Synthetic QA accounts, workspace, and app; no app data deleted.' };
  const accounts = [];
  const sessions = new Set();
  let currentStep = 'initialization';
  async function step(name, operation) {
    currentStep = name;
    const result = await operation();
    report.checks.push({ name, pass: true });
    return result;
  }
  async function createAccount(role) {
    const loginId = `qa_${runId}_${role}`;
    report.loginIds[role] = loginId;
    const password = randomBytes(30).toString('base64url');
    const signup = await auth('/sign-up/email', { username: loginId, email: `${loginId}@example.invalid`, name: `QA ${role} ${runId}`, password });
    check(signup.status === 200);
    const created = await signup.json();
    if (typeof created.token === 'string') sessions.add(created.token);
    check(typeof created.user?.id === 'string' && created.user.username === loginId);
    const signin = await auth('/sign-in/username', { username: loginId.toUpperCase(), password });
    check(signin.status === 200);
    const signed = await signin.json();
    check(typeof signed.token === 'string' && signed.user?.id === created.user.id);
    sessions.add(signed.token);
    const jwtResponse = await auth('/convex/token', undefined, signed.token);
    check(jwtResponse.status === 200);
    const jwt = await jwtResponse.json(); check(typeof jwt.token === 'string');
    const convex = client(); convex.setAuth(jwt.token);
    const current = await convex.query(api.auth.getCurrentUser, {});
    check(current?.id === created.user.id && current.loginId === loginId);
    const account = { role, loginId, userId: current.id, sessionToken: signed.token, convex };
    accounts.push(account);
    return account;
  }
  try {
    const anonymous = client();
    await step('Password readiness and anonymous identity', async () => {
      check((await anonymous.query(api.auth.readiness, {})).password === true);
      check(await anonymous.query(api.auth.getCurrentUser, {}) === null);
    });
    const owner = await step('Owner signup and real username signin', () => createAccount('owner'));
    const editor = await step('Editor signup and real username signin', () => createAccount('editor'));
    const viewer = await step('Viewer signup and real username signin', () => createAccount('viewer'));
    const outsider = await step('Outsider signup and real username signin', () => createAccount('outsider'));
    const initialState = { source: 'prompt', color: 'mint', state: {
      theme: 'Sage', messages: [], files: [{ path: 'index.html', content: `<h1>QA department smoke ${runId}</h1>` }],
      agents: [{ name: 'QA reviewer', role: 'Sample configuration', model: 'Not connected', instructions: 'Synthetic QA fixture; no agent runtime.' }],
      connections: [], versions: [],
    } };
    const stateJson = JSON.stringify(initialState);
    let editorDepartment; let viewerDepartment;
    await step('Create labeled workspace, departments, members, and one shared app', async () => {
      report.workspaceId = await owner.convex.mutation(api.teams.createWorkspace, { name: `QA department smoke ${runId}` });
      editorDepartment = await owner.convex.mutation(api.teams.createDepartment, { workspaceId: report.workspaceId, name: 'QA Engineering' });
      viewerDepartment = await owner.convex.mutation(api.teams.createDepartment, { workspaceId: report.workspaceId, name: 'QA Finance' });
      await owner.convex.mutation(api.teams.setMember, { workspaceId: report.workspaceId, loginId: editor.loginId, departmentId: editorDepartment });
      await owner.convex.mutation(api.teams.setMember, { workspaceId: report.workspaceId, loginId: viewer.loginId, departmentId: viewerDepartment });
      report.appId = await owner.convex.mutation(api.projects.create, { title: `QA shared app ${runId}`, description: 'Synthetic retained live development smoke. No external service, model, or deployment called.', framework: 'Custom', stateJson, workspaceId: report.workspaceId });
      await owner.convex.mutation(api.teams.setProjectGrant, { projectId: report.appId, departmentId: editorDepartment, role: 'editor' });
      await owner.convex.mutation(api.teams.setProjectGrant, { projectId: report.appId, departmentId: viewerDepartment, role: 'viewer' });
    });
    await step('Independent department clients read the same app ID and source', async () => {
      const editApp = await editor.convex.query(api.projects.get, { id: report.appId });
      const viewApp = await viewer.convex.query(api.projects.get, { id: report.appId });
      check(editApp._id === report.appId && viewApp._id === report.appId);
      check(editApp.stateJson === stateJson && viewApp.stateJson === stateJson);
      check(editApp.effectiveRole === 'editor' && viewApp.effectiveRole === 'viewer');
      check(editApp.departmentName === 'QA Engineering' && viewApp.departmentName === 'QA Finance');
      const cards = await viewer.convex.query(api.projects.list, {});
      check(cards.some((card) => card._id === report.appId && !Object.hasOwn(card, 'stateJson') && card.stateLoaded === false));
    });
    await step('Viewer cannot edit or grant access', async () => {
      await denied(() => viewer.convex.mutation(api.projects.update, { id: report.appId, expectedRevision: 0, title: 'Forbidden change' }), 'read-only');
      await denied(() => viewer.convex.mutation(api.teams.setProjectGrant, { projectId: report.appId, departmentId: viewerDepartment, role: 'editor' }), 'administrator');
    });
    const nextState = JSON.stringify({ ...initialState, state: { ...initialState.state, files: [{ path: 'index.html', content: `<h1>QA edited by Engineering ${runId}</h1>` }] } });
    await step('Editor save is visible through independent owner and viewer clients', async () => {
      const saved = await editor.convex.mutation(api.projects.update, { id: report.appId, expectedRevision: 0, stateJson: nextState });
      check(saved.id === report.appId && saved.revision === 1);
      for (const account of [owner, viewer]) {
        const app = await account.convex.query(api.projects.get, { id: report.appId });
        check(app.revision === 1 && app.stateJson === nextState);
      }
    });
    await step('Stale revision rejected without overwriting the shared source', async () => {
      let conflict = false;
      try { await owner.convex.mutation(api.projects.update, { id: report.appId, expectedRevision: 0, stateJson }); }
      catch (error) {
        let data = error?.data;
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
        conflict = data?.code === 'REVISION_CONFLICT' && data.currentRevision === 1;
      }
      check(conflict);
      check((await owner.convex.query(api.projects.get, { id: report.appId })).stateJson === nextState);
    });
    await step('Unassigned account and anonymous client cannot access the app', async () => {
      check(!(await outsider.convex.query(api.projects.list, {})).some((app) => app._id === report.appId));
      await denied(() => outsider.convex.query(api.projects.get, { id: report.appId }), 'Project not found');
      await denied(() => outsider.convex.query(api.teams.details, { workspaceId: report.workspaceId }), 'administrator');
      check(await anonymous.query(api.projects.watch, { id: report.appId }) === null);
    });
    await step('Revocation removes existing editor access immediately', async () => {
      await owner.convex.mutation(api.teams.revokeProjectGrant, { projectId: report.appId, departmentId: editorDepartment });
      check(await editor.convex.query(api.projects.watch, { id: report.appId }) === null);
      check(!(await editor.convex.query(api.projects.list, {})).some((app) => app._id === report.appId));
      await denied(() => editor.convex.query(api.projects.get, { id: report.appId }), 'Project not found');
      await denied(() => editor.convex.mutation(api.projects.update, { id: report.appId, expectedRevision: 1, title: 'Forbidden after revocation' }), 'Project not found');
      check((await viewer.convex.query(api.projects.get, { id: report.appId })).stateJson === nextState);
    });
    await step('Incorrect username password rejected', async () => {
      const response = await auth('/sign-in/username', { username: viewer.loginId, password: randomBytes(30).toString('base64url') });
      check(response.status === 401);
    });
    await step('Normal logout invalidates the owner session even with its prior JWT', async () => {
      check((await auth('/sign-out', {}, owner.sessionToken)).status === 200);
      sessions.delete(owner.sessionToken);
      const session = await auth('/get-session', undefined, owner.sessionToken);
      check(session.status === 200 && await session.json() === null);
      check(await owner.convex.query(api.auth.getCurrentUser, {}) === null);
      check(await owner.convex.query(api.projects.watch, { id: report.appId }) === null);
      await denied(() => owner.convex.query(api.projects.get, { id: report.appId }), 'Unauthenticated');
    });
    report.passed = true;
  } catch {
    report.checks.push({ name: currentStep, pass: false });
    report.failure = 'Stopped at the failed check. Raw responses and errors are suppressed to protect credentials.';
    process.exitCode = 1;
  } finally {
    let logoutPassed = true;
    for (const sessionToken of sessions) {
      try { if ((await auth('/sign-out', {}, sessionToken)).status !== 200) logoutPassed = false; }
      catch { logoutPassed = false; }
    }
    sessions.clear();
    for (const account of accounts) { account.sessionToken = ''; account.convex.clearAuth(); }
    report.checks.push({ name: 'Close synthetic signup/signin sessions', pass: logoutPassed });
    if (!logoutPassed) { report.passed = false; process.exitCode = 1; }
    console.log(JSON.stringify(report, null, 2));
  }
}

if (process.argv.includes('--run')) {
  await main();
} else {
  console.log('No requests made. Once the development check is approved, add --run to test dev:perceptive-ermine-27. It creates retained test accounts and app data.');
}
