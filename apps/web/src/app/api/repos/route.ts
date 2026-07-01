import { NextResponse } from "next/server";
import { BackendProxyError, proxyJson } from "../../../lib/backend";
import { getGitHubRepositories, mapRepositoryListItem } from "../../../lib/github";

function isBackendEnabled() {
  return Boolean(process.env.API_BASE_URL);
}

function isDemoMode() {
  return process.env.CODEMAP_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

async function listRepositoriesFromGitHub() {
  const repositories = await getGitHubRepositories();
  return NextResponse.json(repositories.map(mapRepositoryListItem));
}

export async function GET() {
  if (!isBackendEnabled() && !isDemoMode()) {
    return NextResponse.json(
      {
        statusCode: 503,
        code: "SERVICE_UNAVAILABLE",
        message: "API_BASE_URL is not configured. Enable demo mode or start the API server."
      },
      { status: 503 }
    );
  }

  if (isDemoMode()) {
    try {
      return await listRepositoriesFromGitHub();
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
    if (isDemoMode() && (error instanceof TypeError || (error instanceof BackendProxyError && [401, 404, 503].includes(error.status)))) {
      try {
        return await listRepositoriesFromGitHub();
      } catch (githubError) {
        const message =
          githubError instanceof Error ? githubError.message : "Failed to load repositories from GitHub.";
        const status = message === "Unauthorized" ? 401 : 500;
        return NextResponse.json({ message }, { status });
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to load repositories from GitHub.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { providerRepoId?: string };
  if (!body.providerRepoId) {
    return NextResponse.json({ message: "Repository id is required" }, { status: 400 });
  }

  if (!isBackendEnabled() && !isDemoMode()) {
    return NextResponse.json(
      {
        statusCode: 503,
        code: "SERVICE_UNAVAILABLE",
        message: "API_BASE_URL is not configured. Enable demo mode or start the API server."
      },
      { status: 503 }
    );
  }

  if (isDemoMode()) {
    return NextResponse.json({ id: body.providerRepoId });
  }

  try {
    return await proxyJson("/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (error) {
    if (isDemoMode() && (error instanceof TypeError || (error instanceof BackendProxyError && [401, 404, 503].includes(error.status)))) {
      return NextResponse.json({ id: body.providerRepoId });
    }

    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to connect repository" }, { status });
  }
}
