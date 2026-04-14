export type SyncStatus = "idle" | "queued" | "indexing" | "ready" | "failed";

export type QueryIntent =
  | "location_lookup"
  | "flow_explanation"
  | "architecture_overview"
  | "symbol_explanation";

export interface RepositorySummary {
  id: string;
  name: string;
  owner: string;
  defaultBranch: string;
  visibility: "public" | "private";
  syncStatus: SyncStatus;
  lastIndexedAt?: string;
  description: string;
  starterQuestions: string[];
}

export interface Citation {
  filePath: string;
  symbol?: string;
  lineStart?: number;
  lineEnd?: number;
  reason: string;
}

export interface ChatAnswer {
  answer: string;
  confidence: "low" | "medium" | "high";
  intent: QueryIntent;
  citations: Citation[];
  followUps: string[];
}

export interface ChatRequest {
  repositoryId: string;
  sessionId?: string;
  question: string;
}

export interface ModuleNode {
  id: string;
  label: string;
  kind: "folder" | "module" | "service";
}

export interface ModuleEdge {
  from: string;
  to: string;
  type: "imports" | "calls" | "contains";
}

export interface ArchitectureOverview {
  repositoryId: string;
  summary: string;
  entryPoints: string[];
  majorFlows: string[];
  moduleNodes: ModuleNode[];
  moduleEdges: ModuleEdge[];
  diagram: string;
}

export interface SyncRun {
  id: string;
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  commitSha?: string;
  summary?: {
    filesIndexed: number;
    chunksCreated: number;
    languages: string[];
  };
}

export interface RepositoryDetail extends RepositorySummary {
  architecture: ArchitectureOverview;
  syncHistory: SyncRun[];
}

export type FrontendRepoState =
  | "ready"
  | "indexing"
  | "failed"
  | "empty"
  | "access_revoked";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarLabel: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  teamSize: number;
  activeRepositoryId: string;
}

export interface RepositoryListItem {
  id: string;
  name: string;
  owner: string;
  description: string;
  visibility: "public" | "private";
  defaultBranch: string;
  language: string;
  health: FrontendRepoState;
  lastActivity: string;
  fileCount: number;
}

export interface SyncProgressView {
  repositoryId: string;
  state: FrontendRepoState;
  stageLabel: string;
  percentComplete: number;
  currentStep: string;
  steps: string[];
}

export interface CitationPreview extends Citation {
  excerpt: string;
}

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  answer?: ChatAnswer;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  lastQuestion: string;
  lastUpdatedAt: string;
}

export interface ChatSessionView extends ChatSessionSummary {
  repositoryId: string;
  messages: ChatMessageView[];
}

export interface ArchitectureSection {
  title: string;
  body: string;
  bullets: string[];
}

export interface ArchitectureOverviewView extends ArchitectureOverview {
  readiness: "complete" | "partial" | "unavailable";
  recommendedReads: string[];
  sections: ArchitectureSection[];
}
