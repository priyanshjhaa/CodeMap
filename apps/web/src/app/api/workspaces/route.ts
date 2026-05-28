import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

  const workspace: WorkspaceCookie = {
    id: `workspace_${slugify(name) || "default"}`,
    name,
    slug: slugify(name) || "workspace",
    teamSize: parseTeamSize(body.teamSize ?? "11-50"),
    goal: body.goal ?? "onboarding"
  };

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, JSON.stringify(workspace), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name
  });
}
