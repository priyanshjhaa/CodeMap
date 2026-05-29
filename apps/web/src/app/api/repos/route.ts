import { NextResponse } from "next/server";
import { getGitHubRepositories, mapRepositoryListItem } from "../../../lib/github";

export async function GET() {
  try {
    const repositories = await getGitHubRepositories();
    return NextResponse.json(repositories.map(mapRepositoryListItem));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load repositories from GitHub.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
