import { cookies } from "next/headers";
import { auth } from "./auth";

const WORKSPACE_COOKIE = "codemap-workspace";

export class BackendProxyError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function isDemoMode() {
  return process.env.CODEMAP_DEMO_MODE === "true";
}

export async function backendRequest(path: string, init: RequestInit = {}) {
  const backendUrl = process.env.API_BASE_URL;
  if (!backendUrl) {
    throw new BackendProxyError(503, "API_BASE_URL is not configured");
  }

  const session = await auth();
  if (!session?.user || !session.userId || !session.accessToken) {
    throw new BackendProxyError(401, "Unauthorized");
  }

  const cookieStore = await cookies();
  const rawWorkspace = cookieStore.get(WORKSPACE_COOKIE)?.value;
  let workspaceId = "";
  if (rawWorkspace) {
    try {
      workspaceId = (JSON.parse(rawWorkspace) as { id?: string }).id ?? "";
    } catch {
      workspaceId = "";
    }
  }

  return fetch(`${backendUrl}/api${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-User-Id": session.userId,
      ...(workspaceId ? { "X-Workspace-Id": workspaceId } : {}),
      ...(process.env.API_INTERNAL_SECRET ? { "X-Api-Internal-Secret": process.env.API_INTERNAL_SECRET } : {}),
      ...init.headers
    }
  });
}

export async function proxyJson(path: string, init: RequestInit = {}) {
  const response = await backendRequest(path, init);
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" }
  });
}
