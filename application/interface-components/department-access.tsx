import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import { ArrowRight, Building2, Check, Copy, FolderOpen, LoaderCircle, LockKeyhole, Plus, ShieldCheck, Users, X } from 'lucide-react';
import type { Project } from '../types';
import './department-access.css';

type Props = { project?: Project; onClose: () => void; notify: (message: string) => void };
type TeamWorkspace = { _id: string; name: string; ownerId: string; role: 'admin' | 'member'; departmentId: string | null; departmentName: string | null };
type Details = { workspace: { _id: string; name: string; ownerId: string }; role: 'admin'; departments: { _id: string; name: string }[]; members: { _id: string; userId: string; loginId: string; name: string; departmentId: string; departmentName: string }[]; projects: { _id: string; title: string; ownerId: string }[]; grants: { _id: string; projectId: string; departmentId: string; role: 'editor' | 'viewer' }[] };

export default function DepartmentAccess({ project, onClose, notify }: Props) {
  const workspaces = useQuery(anyApi.teams.listWorkspaces, {}) as TeamWorkspace[] | undefined;
  const [workspaceChoice, setWorkspaceChoice] = useState('');
  const preferred = workspaceChoice || project?.access?.workspaceId;
  const workspace = workspaces?.find((item) => item._id === preferred) || workspaces?.[0];
  const details = useQuery(anyApi.teams.details, workspace?.role === 'admin' ? { workspaceId: workspace._id } : 'skip') as Details | undefined;
  const createWorkspace = useMutation(anyApi.teams.createWorkspace);
  const createDepartment = useMutation(anyApi.teams.createDepartment);
  const setMember = useMutation(anyApi.teams.setMember);
  const removeMember = useMutation(anyApi.teams.removeMember);
  const attachProject = useMutation(anyApi.teams.attachProject);
  const setProjectGrant = useMutation(anyApi.teams.setProjectGrant);
  const revokeProjectGrant = useMutation(anyApi.teams.revokeProjectGrant);
  const [workspaceName, setWorkspaceName] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [memberDepartment, setMemberDepartment] = useState('');
  const [appChoice, setAppChoice] = useState(project?.id || '');
  const [grantDepartment, setGrantDepartment] = useState('');
  const [grantRole, setGrantRole] = useState<'viewer' | 'editor'>('viewer');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  const alive = useRef(true);
  const close = useRef(onClose); close.current = onClose;
  const pending = useRef(busy); pending.current = busy;
  const app = details?.projects.find((item) => item._id === appChoice) || details?.projects[0];
  const grants = details?.grants.filter((grant) => grant.projectId === app?._id) || [];
  const departmentForMember = details?.departments.find((item) => item._id === memberDepartment)?._id || details?.departments[0]?._id || '';
  const departmentForGrant = details?.departments.find((item) => item._id === grantDepartment)?._id || details?.departments[0]?._id || '';
  const isSelectedAttached = !!project && details?.projects.some((item) => item._id === project.id);
  useEffect(() => {
    alive.current = true;
    const previous = document.activeElement as HTMLElement | null; dialog.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending.current) close.current();
      if (event.key !== 'Tab') return;
      const items = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]') || [])];
      if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === dialog.current)) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
    }
    window.addEventListener('keydown', keydown);
    return () => { alive.current = false; window.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  async function perform(label: string, action: () => Promise<unknown>, success: string, failure = 'The change could not be saved. Refresh the workspace and try again.') {
    if (pending.current) return false;
    pending.current = label; setBusy(label); setError('');
    try { await action(); if (alive.current) notify(success); return true; }
    catch { if (alive.current) setError(failure); return false; }
    finally { pending.current = ''; if (alive.current) setBusy(''); }
  }
  function chooseWorkspace(value: string) { setWorkspaceChoice(value); setMemberDepartment(''); setGrantDepartment(''); setAppChoice(project?.id || ''); setError(''); }
  async function submitWorkspace(event: FormEvent) {
    event.preventDefault(); if (!workspaceName.trim()) return;
    const saved = await perform('workspace', async () => { const id = await createWorkspace({ name: workspaceName.trim() }); if (alive.current) chooseWorkspace(String(id)); }, 'Workspace created. Add departments and their members.');
    if (saved && alive.current) { setWorkspaceName(''); setCreateOpen(false); }
  }
  async function submitDepartment(event: FormEvent) {
    event.preventDefault(); if (!workspace || !departmentName.trim()) return;
    const saved = await perform('department', () => createDepartment({ workspaceId: workspace._id, name: departmentName.trim() }), 'Department created.');
    if (saved && alive.current) setDepartmentName('');
  }
  async function submitMember(event: FormEvent) {
    event.preventDefault(); if (!workspace || !departmentForMember) return;
    const normalized = loginId.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._]{2,39}$/.test(normalized)) { setError('Enter an existing login ID with 3–40 letters, numbers, dots, or underscores.'); return; }
    const saved = await perform('member', () => setMember({ workspaceId: workspace._id, loginId: normalized, departmentId: departmentForMember }), 'Department membership saved. The member can sign in with their own account.', 'The login ID could not be assigned. Check that the account exists. The workspace owner cannot be reassigned.');
    if (saved && alive.current) setLoginId('');
  }
  async function submitGrant(event: FormEvent) {
    event.preventDefault(); if (!app || !departmentForGrant) return;
    await perform('grant', () => setProjectGrant({ projectId: app._id, departmentId: departmentForGrant, role: grantRole }), 'Department access saved. Members open this same app from Shared with me.');
  }
  async function copyId(id: string) { try { await navigator.clipboard.writeText(id); notify('App ID copied. This is the same app for every authorized department.'); } catch { setError('Clipboard access is unavailable. Select and copy the visible app ID.'); } }
  return createPortal(<div className="daccess-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><section className="daccess-dialog" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="department-access-title">
    <header className="daccess-heading"><div className="daccess-heading-icon"><Building2 size={24}/></div><div><span>DEPARTMENTS & SHARED APPS</span><h2 id="department-access-title">One app. The right access.</h2></div><button className="daccess-icon" aria-label="Close department access" onClick={onClose} disabled={!!busy}><X size={20}/></button></header>
    <div className="daccess-content"><p className="daccess-intro">Everyone signs in with their own login ID. A department grant opens the same saved app for its members; it does not create a copy.</p>
      {error && <p className="daccess-error" role="alert">{error}</p>}
      {!workspaces ? <div className="daccess-loading"><LoaderCircle size={20} className="daccess-spin"/>Loading your workspaces…</div> : <>
        <div className="daccess-workspace-bar">{workspaces.length > 0 ? <label>Workspace<select aria-label="Team workspace" value={workspace?._id || ''} disabled={!!busy} onChange={(event) => chooseWorkspace(event.target.value)}>{workspaces.map((item) => <option value={item._id} key={item._id}>{item.name} · {item.role === 'admin' ? 'Owner' : item.departmentName || 'Member'}</option>)}</select></label> : <div><h3>Give your teams a shared home.</h3><p>Create a workspace, then add departments and existing accounts.</p></div>}<button className="daccess-button" disabled={!!busy} onClick={() => setCreateOpen(!createOpen)}><Plus size={14}/>{createOpen ? 'Cancel' : 'New workspace'}</button></div>
        {(createOpen || !workspaces.length) && <form className="daccess-create" onSubmit={(event) => void submitWorkspace(event)}><label>Workspace name<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} maxLength={80} placeholder="Acme operations" required disabled={!!busy}/></label><button className="daccess-button daccess-primary" disabled={!!busy || !workspaceName.trim()}>{busy === 'workspace' ? <LoaderCircle size={14} className="daccess-spin"/> : <ArrowRight size={14}/>}Create workspace</button></form>}
        {workspace && <div className="daccess-identity"><ShieldCheck size={16}/><strong>{workspace.role === 'admin' ? 'Workspace owner' : workspace.departmentName || 'Workspace member'}</strong><span>{workspace.role === 'admin' ? 'You manage departments and app access.' : 'Your department is assigned by the workspace owner.'}</span></div>}
        {workspace?.role === 'member' && <section className="daccess-member-view"><LockKeyhole size={24}/><h3>Your team, your shared apps.</h3><p>Apps granted to {workspace.departmentName || 'your department'} appear under <strong>My projects → Shared with me</strong>. Open an app to see your Viewer or Editor permission.</p>{project && <div className="daccess-current-app"><FolderOpen size={17}/><div><strong>{project.title}</strong><span>{project.access?.role === 'editor' ? 'Editor · Can change this app' : 'Viewer · Read-only access'}</span></div></div>}<p>Only the workspace owner can assign members or change department grants.</p></section>}
        {workspace?.role === 'admin' && !details && <div className="daccess-loading"><LoaderCircle size={18} className="daccess-spin"/>Loading departments and permissions…</div>}
        {details && workspace?.role === 'admin' && <>
          <div className="daccess-admin-grid"><section className="daccess-section"><div className="daccess-section-title"><Building2 size={16}/><h3>1. Set up departments</h3><span>{details.departments.length}</span></div><p>Each account belongs to one department in this workspace. The workspace owner manages access separately.</p><div className="daccess-department-list">{details.departments.map((department) => <span key={department._id}><Building2 size={12}/>{department.name}</span>)}{!details.departments.length && <small>No departments yet.</small>}</div><form onSubmit={(event) => void submitDepartment(event)} className="daccess-inline-form"><label>Department name<input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} maxLength={60} required placeholder="Finance" disabled={!!busy}/></label><button className="daccess-button" disabled={!!busy || !departmentName.trim()}><Plus size={13}/>Add department</button></form></section>
          <section className="daccess-section"><div className="daccess-section-title"><Users size={16}/><h3>2. Add existing accounts</h3></div><p>Ask teammates to create their own accounts, then enter their login IDs here. No password is shared and no invitation email is sent.</p><form onSubmit={(event) => void submitMember(event)}><label>Existing login ID<input value={loginId} onChange={(event) => setLoginId(event.target.value)} autoCapitalize="none" spellCheck={false} maxLength={40} placeholder="alex.support" required disabled={!!busy || !details.departments.length}/></label><label>Assign department<select value={departmentForMember} onChange={(event) => setMemberDepartment(event.target.value)} disabled={!!busy || !details.departments.length}>{!details.departments.length && <option value="">Create a department first</option>}{details.departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label><button className="daccess-button daccess-primary" disabled={!!busy || !loginId.trim() || !departmentForMember}><Check size={13}/>Save membership</button></form></section></div>
          {details.members.length > 0 && <section className="daccess-section daccess-members"><div className="daccess-section-title"><Users size={16}/><h3>People in this workspace</h3><span>{details.members.length}</span></div>{details.members.map((member) => <div className="daccess-member-row" key={member._id}><span className="daccess-avatar">{member.name.slice(0, 1).toUpperCase()}</span><div><strong>{member.name}</strong><small>{member.loginId}</small></div><span className="daccess-pill">{member.departmentName}</span><button className="daccess-text-button" disabled={!!busy} onClick={() => { setLoginId(member.loginId); setMemberDepartment(member.departmentId); }}>Change department</button><button className="daccess-icon" disabled={!!busy} aria-label={`Remove ${member.loginId} from workspace`} onClick={() => void perform('remove-member', () => removeMember({ workspaceId: workspace._id, userId: member.userId }), 'Membership removed. This account no longer inherits department access in this workspace.')}><X size={14}/></button></div>)}</section>}
          <section className="daccess-section daccess-apps"><div className="daccess-section-title"><FolderOpen size={16}/><h3>3. Share the same app</h3></div>
            {project && project.access?.role === 'owner' && !project.access.workspaceId && !isSelectedAttached && <div className="daccess-attach"><div><strong>{project.title}</strong><p>This private app has not been attached to a team workspace.</p></div><button className="daccess-button daccess-primary" disabled={!!busy} onClick={() => void perform('attach', async () => { await attachProject({ workspaceId: workspace._id, projectId: project.id }); if (alive.current) setAppChoice(project.id); }, 'App attached. Grant a department access below to share it.')}><Plus size={14}/>Attach this app</button></div>}
            {project?.access?.workspaceId && project.access.workspaceId !== workspace._id && <p className="daccess-note">The selected app belongs to {project.access.workspaceName || 'another workspace'}. Choose that workspace above to manage its access.</p>}
            {details.projects.length ? <><label>App to share<select aria-label="App to share" value={app?._id || ''} onChange={(event) => setAppChoice(event.target.value)} disabled={!!busy}>{details.projects.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label>{app && <><div className="daccess-app-id"><code>{app._id}</code><button className="daccess-icon" aria-label="Copy app ID" onClick={() => void copyId(app._id)}><Copy size={14}/></button></div><p className="daccess-note">This app appears under Shared with me for members of each granted department. All departments open this same app ID.</p><form className="daccess-grant-form" onSubmit={(event) => void submitGrant(event)}><label>Department access<select value={departmentForGrant} onChange={(event) => setGrantDepartment(event.target.value)} disabled={!!busy || !details.departments.length}>{!details.departments.length && <option value="">Create a department first</option>}{details.departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label><label>App permission<select value={grantRole} onChange={(event) => setGrantRole(event.target.value as 'viewer' | 'editor')} disabled={!!busy}><option value="viewer">Viewer · Read-only</option><option value="editor">Editor · Can make changes</option></select></label><button className="daccess-button daccess-primary" disabled={!!busy || !departmentForGrant}><ShieldCheck size={14}/>Save department access</button></form><div className="daccess-permission-guide"><span><strong>Viewer</strong>Inspect the app and export source.</span><span><strong>Editor</strong>Change the app and save its shared source.</span><span><strong>Owner</strong>Manage departments and permissions.</span></div><div className="daccess-grants">{grants.map((grant) => <div key={grant._id}><Building2 size={16}/><strong>{details.departments.find((department) => department._id === grant.departmentId)?.name || 'Department'}</strong><span className="daccess-pill">{grant.role === 'editor' ? 'Editor' : 'Viewer'}</span><button className="daccess-text-button" disabled={!!busy} onClick={() => { setGrantDepartment(grant.departmentId); setGrantRole(grant.role); }}>Edit access</button><button className="daccess-text-button daccess-danger" disabled={!!busy} onClick={() => void perform('revoke', () => revokeProjectGrant({ projectId: app._id, departmentId: grant.departmentId }), 'Department access revoked. Members lose this app unless they have another authorized role.')}>Revoke</button></div>)}{!grants.length && <p>No departments have access yet. This app is still private to its owner.</p>}</div></>}</> : <p className="daccess-empty">Open one of your saved apps and choose Manage access to attach it to this workspace.</p>}
          </section>
        </>}
      </>}
    </div><footer className="daccess-footer"><span><ShieldCheck size={14}/>Server-checked membership and permissions. Agent execution remains simulated.</span><button className="daccess-button" onClick={onClose} disabled={!!busy}>{busy ? <LoaderCircle size={14} className="daccess-spin"/> : <Check size={14}/>}Done</button></footer>
  </section></div>, document.body);
}
