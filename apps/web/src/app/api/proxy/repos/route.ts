import { NextResponse } from "next/server";
import type { FrontendRepoState, RepositoryListItem } from "@codemap/shared";

type BackendRepository = {
  id?: string;
  providerRepoId?: string;
  name: string;
  owner: string;
  description?: string | null;
  visibility?: "public" | "private";
  defaultBranch?: string | null;
  language?: string | null;
  health?: FrontendRepoState;
  lastActivity?: string | null;
  fileCount?: number | null;
};

export async function GET() {
  try {
    const backendUrl = process.env.API_BASE_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { error: "API_BASE_URL is not configured" },
        { status: 503 }
      );
    }

    const response = await fetch(`${backendUrl}/api/repos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repositories" },
        { status: response.status }
      );
    }

    const backendData = await response.json();

    const mappedData: RepositoryListItem[] = (backendData as BackendRepository[]).map((repo) => ({
      id: repo.providerRepoId ?? repo.id ?? `${repo.owner}/${repo.name}`,
      name: repo.name,
      owner: repo.owner,
      description: repo.description || "No description available",
      visibility: repo.visibility || "private",
      defaultBranch: repo.defaultBranch || "main",
      language: repo.language || "Unknown",
      health: repo.health || "empty",
      lastActivity: repo.lastActivity || "No recent activity",
      fileCount: repo.fileCount || 0,
    }));

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
