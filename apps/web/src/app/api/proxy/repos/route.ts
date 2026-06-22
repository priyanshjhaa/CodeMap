import { NextResponse } from "next/server";
import { BackendProxyError, proxyJson } from "../../../../lib/backend";

export async function GET() {
  try {
    return await proxyJson("/repos");
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to fetch repositories" }, { status });
  }
}
