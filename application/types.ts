export type Framework = 'Auto-select' | 'LangGraph' | 'CrewAI' | 'OpenAI Agents' | 'Lyzr' | 'Custom';
export type AppStage = 'draft' | 'ready' | 'deployed';
export interface Message { id: string; role: 'user' | 'assistant'; text: string; time: string; }
export interface ProjectFile { path: string; content: string; }
export interface AgentKnowledge { id: string; kind: 'url' | 'text'; title: string; value: string; }
export interface AgentSpec { name: string; role: string; model: string; instructions: string; knowledge?: AgentKnowledge[]; testSample?: { input: string; output: string; at: string }; }
export interface WorkspaceState {
  plan?: { goal: string; inputs: string; steps: string; approval: string; status: 'draft' | 'approved' };
  messages: Message[];
  files: ProjectFile[];
  agents: AgentSpec[];
  connections: string[];
  github?: { repository: string; branch: string; lastSync?: string };
  deployment?: { slug: string; environment: string; status: string; at: string };
  versions: { id: string; label: string; at: string; files: ProjectFile[] }[];
  testRun?: { at: string; passed: number; total: number };
  theme: string;
}
export interface Project {
  id: string; title: string; description: string; framework: Framework;
  updatedAt: number; stage: AppStage; source: 'prompt' | 'import' | 'template';
  color: string; state: WorkspaceState;
  ownerId?: string;
  revision?: number;
  stateLoaded?: boolean;
  invalidStateJson?: string;
  savedVersionCount?: number;
  access?: { role: 'owner' | 'editor' | 'viewer'; departmentName?: string; ownerDepartment?: string; workspaceName?: string; workspaceId?: string };
}
export interface WorkspaceProps {
  project: Project;
  onChange: (project: Project) => boolean;
  onBack: () => void;
  expert: boolean;
  onExpertChange: (expert: boolean) => void;
  notify: (message: string) => void;
  onManageAccess?: () => void;
  sourceDraft?: { path: string; content: string } | null;
  onSourceDraftChange?: (draft: { path: string; content: string } | null) => void;
}
