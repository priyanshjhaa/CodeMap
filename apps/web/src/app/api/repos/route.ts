import { NextResponse } from "next/server";
import { BackendProxyError, proxyJson } from "../../../lib/backend";

export async function GET() {
  try {
    return await proxyJson("/repos");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load repositories from GitHub.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    return await proxyJson("/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text() });
  } catch (error) {
    const status = error instanceof BackendProxyError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to connect repository" }, { status });
  }
}
