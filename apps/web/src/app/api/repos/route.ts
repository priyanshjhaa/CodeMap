import { NextResponse } from "next/server";
import { BackendProxyError, proxyJson } from "../../../lib/backend";
import { getGitHubRepositories, mapRepositoryListItem } from "../../../lib/github";

function isBackendEnabled() {
  return Boolean(process.env.API_BASE_URL);
}

export async function GET() {
  if (!isBackendEnabled()) {
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

  try {
    return await proxyJson("/repos");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load repositories from GitHub.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  if (!isBackendEnabled()) {
    const body = (await request.json()) as { providerRepoId?: string };
    if (!body.providerRepoId) {
      return NextResponse.json({ message: "Repository id is required" }, { status: 400 });
    }

    return NextResponse.json({ id: body.providerRepoId });
  }

  try {
    return await proxyJson("/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text() });
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to connect repository" }, { status });
  }
}
