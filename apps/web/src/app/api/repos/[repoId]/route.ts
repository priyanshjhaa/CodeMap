import { NextResponse } from "next/server";
import { BackendProxyError, proxyJson } from "../../../../lib/backend";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await context.params;
    return await proxyJson(`/repos/${repoId}`, { method: "DELETE" });
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json(
      {
        statusCode: status,
        code: status === 401 ? "UNAUTHORIZED" : "REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete repository"
      },
      { status }
    );
  }
}
