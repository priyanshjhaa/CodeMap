import { NextResponse } from "next/server";
import { buildSyncProgress } from "../../../../../lib/github";

export async function POST(
  _request: Request,
  context: { params: Promise<{ repoId: string }> }
) {
  const { repoId } = await context.params;
  return NextResponse.json(buildSyncProgress(repoId));
}
