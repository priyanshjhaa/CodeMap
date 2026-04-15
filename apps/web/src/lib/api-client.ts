import type { RepositoryListItem, RepositoryDetail } from "@codemap/shared";

const API_BASE = process.env.API_BASE_URL || "http://localhost:4000";

/**
 * Fetch repositories for the authenticated user
 */
export async function listRepositories(): Promise<RepositoryListItem[]> {
  const response = await fetch(`${API_BASE}/api/repos`, {
    headers: {
      "Content-Type": "application/json",
    },
    // Note: NextAuth session token will be included via middleware or cookies
  });

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  return response.json();
}

/**
 * Fetch detailed information about a specific repository
 */
export async function getRepositoryDetail(
  repoId: string
): Promise<RepositoryDetail> {
  const response = await fetch(`${API_BASE}/api/repos/${repoId}/overview`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch repository details");
  }

  return response.json();
}

/**
 * Trigger repository import/sync
 */
export async function importRepository(repoId: string): Promise<{
  syncId: string;
}> {
  const response = await fetch(`${API_BASE}/api/repos/${repoId}/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to start repository import");
  }

  return response.json();
}

/**
 * Fetch sync progress for a repository
 */
export async function getSyncProgress(repoId: string): Promise<{
  status: "pending" | "indexing" | "ready" | "failed";
  progress: number;
  filesIndexed: number;
  chunksCreated: number;
}> {
  const response = await fetch(
    `${API_BASE}/api/repos/${repoId}/sync/progress`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sync progress");
  }

  return response.json();
}

/**
 * Create a new workspace
 */
export async function createWorkspace(data: {
  name: string;
  teamSize: string;
  goal: string;
}): Promise<{ id: string; name: string }> {
  const response = await fetch(`${API_BASE}/api/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create workspace");
  }

  return response.json();
}
