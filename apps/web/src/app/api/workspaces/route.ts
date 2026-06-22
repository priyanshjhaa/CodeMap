import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendProxyError, backendRequest } from "../../../lib/backend";

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

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    teamSize?: string;
    goal?: string;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ message: "Workspace name is required" }, { status: 400 });
  }

  try {
    const response = await backendRequest("/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, teamSize: parseTeamSize(body.teamSize ?? "11-50"), goal: body.goal ?? "onboarding" })
    });
    const payload = await response.json() as { id?: string; name?: string; slug?: string; teamSize?: number; goal?: string; message?: string };
    if (!response.ok || !payload.id || !payload.name || !payload.slug) {
      return NextResponse.json({ message: payload.message ?? "Could not create workspace" }, { status: response.status });
    }
    const workspace: WorkspaceCookie = {
      id: payload.id,
      name: payload.name,
      slug: payload.slug,
      teamSize: payload.teamSize ?? parseTeamSize(body.teamSize ?? "11-50"),
      goal: payload.goal ?? body.goal ?? "onboarding"
    };

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, JSON.stringify(workspace), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return NextResponse.json({ id: workspace.id, name: workspace.name });
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not create workspace" }, { status });
  }
}
