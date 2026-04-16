import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.API_BASE_URL || "http://localhost:4000";
    const response = await fetch(`${backendUrl}/api/repos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repositories" },
        { status: response.status }
      );
    }

    const backendData = await response.json();

    // Map backend data to frontend format
    const mappedData = backendData.map((repo: any) => ({
      id: repo.providerRepoId || repo.id,
      name: repo.name,
      owner: repo.owner,
      description: repo.description || "No description available",
      visibility: repo.visibility || "private",
      defaultBranch: repo.defaultBranch || "main",
      language: repo.language || "Unknown",
      health: repo.health || "empty",
      lastActivity: repo.lastActivity || "No recent activity",
      fileCount: repo.fileCount || 0,
    }));

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
