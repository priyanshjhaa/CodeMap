import { NextResponse } from "next/server";
import { BackendProxyError, proxyJson } from "../../../../../lib/backend";

export async function POST(
  _request: Request,
  context: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await context.params;
    return await proxyJson(`/repos/${repoId}/sync`, { method: "POST" });
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to start sync" }, { status });
  }
}
