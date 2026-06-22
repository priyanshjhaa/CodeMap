import { NextResponse } from "next/server";
import { BackendProxyError, proxyJson } from "../../../../../lib/backend";

export async function POST(
  request: Request,
  context: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await context.params;
    return await proxyJson(`/repos/${repoId}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text() });
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to send chat message" }, { status });
  }
}
