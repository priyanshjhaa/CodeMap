import type {
  ArchitectureOverviewView,
  ChatSessionView,
  CitationPreview,
  RepositoryDetail,
  RepositoryListItem,
  SyncProgressView
} from "@codemap/shared";
import { auth } from "./auth";

type GitHubRepository = {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  updated_at: string;
  pushed_at: string | null;
};

function formatActivity(value: string | null) {
  if (!value) {
    return "No recent activity";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No recent activity";
  }

  return date.toISOString();
}

async function fetchFromGitHub<T>(path: string): Promise<T> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github+json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("GitHub token is unavailable or does not have repository access.");
    }

    throw new Error("Failed to load data from GitHub.");
  }

  return response.json() as Promise<T>;
}

export async function getGitHubRepositories(): Promise<GitHubRepository[]> {
  return fetchFromGitHub<GitHubRepository[]>("/user/repos?sort=updated&per_page=100");
}

export function mapRepositoryListItem(repository: GitHubRepository): RepositoryListItem {
  return {
    id: String(repository.id),
    name: repository.name,
    owner: repository.owner.login,
    description: repository.description ?? "No description provided.",
    visibility: repository.private ? "private" : "public",
    defaultBranch: repository.default_branch || "main",
    language: repository.language ?? "Unknown",
    health: "ready",
    lastActivity: formatActivity(repository.pushed_at ?? repository.updated_at),
    fileCount: 0
  };
}

export function buildRepositoryDetail(repository: GitHubRepository): RepositoryDetail {
  const repositoryId = String(repository.id);

  const architecture: ArchitectureOverviewView = {
    repositoryId,
    summary:
      "GitHub connection is live. Repository metadata is available, and deeper architecture analysis will appear after indexing is wired into the backend.",
    entryPoints: ["README.md", ".github/", "src/", "package.json"],
    majorFlows: [
      "GitHub OAuth is providing live repository access.",
      "The dashboard now reads repository metadata from the authenticated account.",
      "Deeper code-flow analysis still depends on the indexing pipeline."
    ],
    moduleNodes: [
      { id: "github", label: "GitHub metadata", kind: "service" },
      { id: "repository", label: repository.name, kind: "folder" },
      { id: "analysis", label: "Indexing pipeline", kind: "service" }
    ],
    moduleEdges: [
      { from: "github", to: "repository", type: "contains" },
      { from: "repository", to: "analysis", type: "calls" }
    ],
    diagram: [
      "flowchart LR",
      "  GitHub[GitHub OAuth] --> Repo[Repository metadata]",
      "  Repo --> Analysis[Indexing pipeline]"
    ].join("\n"),
    readiness: "partial",
    recommendedReads: ["README.md", "package.json", ".github/workflows"],
    sections: [
      {
        title: "Connected now",
        body: "The repository identity is real and tied to the authenticated GitHub account.",
        bullets: [
          `Owner: ${repository.owner.login}`,
          `Default branch: ${repository.default_branch || "main"}`,
          `Primary language: ${repository.language ?? "Unknown"}`
        ]
      },
      {
        title: "Still to wire up",
        body: "The indexing and code-intelligence layers are still placeholder-grade in this app.",
        bullets: [
          "Architecture summaries are not yet generated from source files.",
          "Sync history is empty until the backend sync pipeline is connected.",
          "Chat answers are not yet grounded in live repository code."
        ]
      }
    ]
  };

  return {
    id: repositoryId,
    name: repository.name,
    owner: repository.owner.login,
    defaultBranch: repository.default_branch || "main",
    visibility: repository.private ? "private" : "public",
    syncStatus: "idle",
    lastIndexedAt: undefined,
    description: repository.description ?? "No description provided.",
    starterQuestions: [
      `What are the main modules in ${repository.name}?`,
      `Where should a new engineer start in ${repository.name}?`,
      `How is ${repository.name} organized?`
    ],
    architecture,
    syncHistory: []
  };
}

export function buildSyncProgress(repositoryId: string): SyncProgressView {
  return {
    repositoryId,
    state: "empty",
    stageLabel: "Ready to index",
    percentComplete: 0,
    currentStep:
      "GitHub access is connected. Start repository indexing when the backend sync pipeline is ready.",
    steps: ["GitHub connected", "Repository selected", "Indexing not started"]
  };
}

export function buildChatSessions(
  repositoryId: string,
  repositoryName: string
): ChatSessionView[] {
  return [
    {
      id: `session_${repositoryId}`,
      repositoryId,
      title: `${repositoryName} onboarding thread`,
      lastQuestion: "How is this repository organized?",
      lastUpdatedAt: new Date().toISOString(),
      messages: [
        {
          id: `message_${repositoryId}_1`,
          role: "assistant",
          content:
            "GitHub authentication is connected and repository metadata is live. Deeper code-aware answers will show up once indexing is connected.",
          createdAt: new Date().toISOString()
        }
      ]
    }
  ];
}

export function buildCitationPreviews(repository: GitHubRepository): CitationPreview[] {
  return [
    {
      filePath: "README.md",
      reason: `Use the ${repository.name} README as the quickest orientation point.`,
      excerpt: "Repository-level citations will appear here after indexing is connected.",
      lineStart: 1,
      lineEnd: 1
    }
  ];
}
