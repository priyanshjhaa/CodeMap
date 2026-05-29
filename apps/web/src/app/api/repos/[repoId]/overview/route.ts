import { NextResponse } from "next/server";
import { buildRepositoryDetail, getGitHubRepositories } from "../../../../../lib/github";

export async function GET(
  _request: Request,
  context: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await context.params;
    const repositories = await getGitHubRepositories();
    const repository = repositories.find((item) => String(item.id) === repoId);

    if (!repository) {
      return NextResponse.json({ message: "Repository not found" }, { status: 404 });
    }

    return NextResponse.json(buildRepositoryDetail(repository));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load repository overview.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
