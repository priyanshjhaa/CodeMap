import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";

const WORKSPACE_COOKIE = "codemap-workspace";

type WorkspaceCookie = {
  id: string;
  name: string;
  slug: string;
  teamSize: number;
};

function getAvatarLabel(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "CodeMap User";
  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "CM";
}

function defaultWorkspace(name?: string | null): WorkspaceCookie {
  const workspaceName = name ? `${name.split(" ")[0]}'s Workspace` : "My Workspace";
  return {
    id: "workspace_current",
    name: workspaceName,
    slug: workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    teamSize: 1
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const rawWorkspace = cookieStore.get(WORKSPACE_COOKIE)?.value;

  let workspace = defaultWorkspace(session.user.name);
  if (rawWorkspace) {
    try {
      workspace = JSON.parse(rawWorkspace) as WorkspaceCookie;
    } catch {
      workspace = defaultWorkspace(session.user.name);
    }
  }

  return NextResponse.json({
    user: {
      id: session.userId ?? session.user.email ?? session.user.name ?? "user_current",
      name: session.user.name ?? "GitHub User",
      email: session.user.email ?? "",
      role: "GitHub user",
      avatarLabel: getAvatarLabel(session.user.name, session.user.email)
    },
    workspace: {
      ...workspace,
      activeRepositoryId: ""
    }
  });
}
