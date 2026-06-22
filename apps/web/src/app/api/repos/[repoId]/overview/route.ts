import { NextResponse } from "next/server";
import { BackendProxyError, proxyJson } from "../../../../../lib/backend";

export async function GET(
  _request: Request,
  context: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await context.params;
    return await proxyJson(`/repos/${repoId}/overview`);
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to load repository overview" }, { status });
  }
}
