import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendProxyError, backendRequest } from "../../../lib/backend";
import { auth } from "../../../lib/auth";

const WORKSPACE_COOKIE = "codemap-workspace";

type WorkspaceCookie = {
  id: string;
  name: string;
  slug: string;
  teamSize: number;
  goal: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTeamSize(value: string) {
  if (value === "1-10") return 10;
  if (value === "11-50") return 50;
  if (value === "51-200") return 200;
  return 500;
}

function buildLocalWorkspace(name: string, teamSize: string, goal: string): WorkspaceCookie {
  return {
    id: `workspace_${slugify(name) || "demo"}`,
    name,
    slug: slugify(name) || "workspace",
    teamSize: parseTeamSize(teamSize),
    goal
  };
}

function shouldUseLocalWorkspaceFallback(errorOrStatus: unknown) {
  if (errorOrStatus instanceof BackendProxyError) {
    return errorOrStatus.status === 401 || errorOrStatus.status === 404 || errorOrStatus.status === 503;
  }

  if (typeof errorOrStatus === "number") {
    return errorOrStatus === 401 || errorOrStatus === 404 || errorOrStatus === 503;
  }

  return errorOrStatus instanceof TypeError;
}

async function persistWorkspaceCookie(workspace: WorkspaceCookie) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, JSON.stringify(workspace), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    teamSize?: string;
    goal?: string;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ message: "Workspace name is required" }, { status: 400 });
  }

  const teamSize = body.teamSize ?? "11-50";
  const goal = body.goal ?? "onboarding";

  if (!process.env.API_BASE_URL || process.env.CODEMAP_DEMO_MODE === "true") {
    const workspace = buildLocalWorkspace(name, teamSize, goal);
    await persistWorkspaceCookie(workspace);
    return NextResponse.json({ id: workspace.id, name: workspace.name });
  }

  try {
    const response = await backendRequest("/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, teamSize: parseTeamSize(teamSize), goal })
    });
    const payload = await response.json() as { id?: string; name?: string; slug?: string; teamSize?: number; goal?: string; message?: string };
    if (shouldUseLocalWorkspaceFallback(response.status)) {
      const workspace = buildLocalWorkspace(name, teamSize, goal);
      await persistWorkspaceCookie(workspace);
      return NextResponse.json({ id: workspace.id, name: workspace.name });
    }

    if (!response.ok || !payload.id || !payload.name || !payload.slug) {
      return NextResponse.json({ message: payload.message ?? "Could not create workspace" }, { status: response.status });
    }
    const workspace: WorkspaceCookie = {
      id: payload.id,
      name: payload.name,
      slug: payload.slug,
      teamSize: payload.teamSize ?? parseTeamSize(teamSize),
      goal: payload.goal ?? goal
    };

    await persistWorkspaceCookie(workspace);

    return NextResponse.json({ id: workspace.id, name: workspace.name });
  } catch (error) {
    if (shouldUseLocalWorkspaceFallback(error)) {
      const workspace = buildLocalWorkspace(name, teamSize, goal);
      await persistWorkspaceCookie(workspace);
      return NextResponse.json({ id: workspace.id, name: workspace.name });
    }

    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not create workspace" }, { status });
  }
}
