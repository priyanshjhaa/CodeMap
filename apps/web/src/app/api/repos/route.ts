import { NextResponse } from "next/server";
import type { RepositoryListItem } from "@codemap/shared";
import { auth } from "../../../lib/auth";

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

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github+json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? "GitHub token is unavailable or does not have repository access."
        : "Failed to load repositories from GitHub.";

    return NextResponse.json({ message }, { status: response.status });
  }

  const data = (await response.json()) as GitHubRepository[];
  const repositories: RepositoryListItem[] = data.map((repository) => ({
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
  }));

  return NextResponse.json(repositories);
}
