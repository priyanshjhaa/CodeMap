import type {
  RepositoryListItem
} from "@codemap/shared";
import { auth } from "./auth";

type GitHubRepository = {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  updated_at: string;
  pushed_at: string | null;
};

function formatActivity(value: string | null) {
  if (!value) {
    return "No recent activity";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No recent activity";
  }

  return date.toISOString();
}

async function fetchFromGitHub<T>(path: string): Promise<T> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github+json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("GitHub token is unavailable or does not have repository access.");
    }

    throw new Error("Failed to load data from GitHub.");
  }

  return response.json() as Promise<T>;
}

export async function getGitHubRepositories(): Promise<GitHubRepository[]> {
  return fetchFromGitHub<GitHubRepository[]>("/user/repos?sort=updated&per_page=100");
}

export function mapRepositoryListItem(repository: GitHubRepository): RepositoryListItem {
  return {
    id: String(repository.id),
    name: repository.name,
    owner: repository.owner.login,
    description: repository.description ?? "No description provided.",
    visibility: repository.private ? "private" : "public",
    defaultBranch: repository.default_branch || "main",
    language: repository.language ?? "Unknown",
    health: "empty",
    lastActivity: formatActivity(repository.pushed_at ?? repository.updated_at),
    fileCount: 0
  };
}
