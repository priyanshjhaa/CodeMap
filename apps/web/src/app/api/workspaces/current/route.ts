import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { BackendProxyError, backendRequest } from "../../../../lib/backend";

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

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let workspace: WorkspaceCookie;
  try {
    const response = await backendRequest("/workspaces/current");
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Could not load workspace" })) as { message?: string };
      return NextResponse.json({ message: payload.message ?? "Could not load workspace" }, { status: response.status });
    }
    workspace = await response.json() as WorkspaceCookie;
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not load workspace" }, { status });
  }

  return NextResponse.json({
    user: {
      id: session.userId ?? session.user.email ?? session.user.name ?? "user_current",
      name: session.user.name ?? "GitHub User",
      email: session.user.email ?? "",
      role: "GitHub user",
      avatarLabel: getAvatarLabel(session.user.name, session.user.email),
      avatarUrl: session.user.image ?? undefined
    },
    workspace: {
      ...workspace,
      activeRepositoryId: ""
    }
  });
}
