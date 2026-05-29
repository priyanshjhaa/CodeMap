import type {
  ArchitectureOverviewView,
  ChatSessionView,
  CitationPreview,
  CurrentUser,
  RepositoryDetail,
  RepositoryListItem,
  SyncProgressView,
  WorkspaceSummary
} from "@codemap/shared";

const API_BASE = "";

type WorkspaceCreateInput = {
  name: string;
  teamSize: string;
  goal: string;
};

type ChatResponse = {
  session: ChatSessionView;
  selectedCitations: CitationPreview[];
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const requestUrl = API_BASE ? `${API_BASE}${path}` : path;

  const response = await fetch(requestUrl, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Keep the default error message when the response body is empty.
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function getCurrentWorkspace(): Promise<{
  user: CurrentUser;
  workspace: WorkspaceSummary;
}> {
  return requestJson("/api/workspaces/current");
}

export async function listRepositories(): Promise<RepositoryListItem[]> {
  return requestJson("/api/repos");
}

export async function getRepositoryDetail(repoId: string): Promise<RepositoryDetail> {
  return requestJson(`/api/repos/${repoId}/overview`);
}

export async function getArchitectureOverview(repoId: string): Promise<ArchitectureOverviewView> {
  return requestJson(`/api/repos/${repoId}/overview`).then(
    (detail) => (detail as RepositoryDetail).architecture as ArchitectureOverviewView
  );
}

export async function getSyncHistory(repoId: string): Promise<RepositoryDetail["syncHistory"]> {
  return requestJson<RepositoryDetail>(`/api/repos/${repoId}/overview`).then(
    (detail) => detail.syncHistory
  );
}

export async function getSyncProgress(repoId: string): Promise<SyncProgressView> {
  return requestJson(`/api/repos/${repoId}/sync-status`);
}

export async function startRepositorySync(repoId: string): Promise<SyncProgressView> {
  return requestJson(`/api/repos/${repoId}/sync`, {
    method: "POST"
  });
}

export async function listChatSessions(repoId: string): Promise<ChatSessionView[]> {
  return requestJson(`/api/repos/${repoId}/chat/sessions`);
}

export async function getCitationPreviews(repoId: string): Promise<CitationPreview[]> {
  return requestJson(`/api/repos/${repoId}/citations`);
}

export async function sendChatMessage(
  repoId: string,
  sessionId: string | null,
  message: string
): Promise<ChatResponse> {
  return requestJson(`/api/repos/${repoId}/chat`, {
    method: "POST",
    body: JSON.stringify({
      repositoryId: repoId,
      sessionId: sessionId ?? undefined,
      question: message
    })
  });
}

export async function createWorkspace(data: WorkspaceCreateInput): Promise<{
  id: string;
  name: string;
}> {
  return requestJson("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
