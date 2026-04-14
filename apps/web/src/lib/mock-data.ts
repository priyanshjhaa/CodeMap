import type {
  ArchitectureOverviewView,
  ChatAnswer,
  ChatSessionView,
  CitationPreview,
  CurrentUser,
  QueryIntent,
  RepositoryDetail,
  RepositoryListItem,
  SyncProgressView,
  WorkspaceSummary
} from "@codemap/shared";

export const currentUser: CurrentUser = {
  id: "user_1",
  name: "Priyansh Jha",
  email: "priyansh@acme.dev",
  role: "Founding Engineer",
  avatarLabel: "PJ"
};

export const workspace: WorkspaceSummary = {
  id: "workspace_1",
  name: "Acme Engineering",
  slug: "acme-engineering",
  teamSize: 14,
  activeRepositoryId: "repo_1"
};

export const repositories: RepositoryListItem[] = [
  {
    id: "repo_1",
    name: "payments-platform",
    owner: "acme",
    description: "Core payment orchestration, billing rules, and authentication.",
    visibility: "private",
    defaultBranch: "main",
    language: "TypeScript",
    health: "ready",
    lastActivity: "Indexed 2 hours ago",
    fileCount: 148
  },
  {
    id: "repo_2",
    name: "onboarding-portal",
    owner: "acme",
    description: "Internal admin onboarding app currently being indexed.",
    visibility: "private",
    defaultBranch: "main",
    language: "TypeScript",
    health: "indexing",
    lastActivity: "Sync running now",
    fileCount: 93
  },
  {
    id: "repo_3",
    name: "analytics-kit",
    owner: "acme",
    description: "Event aggregation service with an expired GitHub installation.",
    visibility: "private",
    defaultBranch: "main",
    language: "JavaScript",
    health: "access_revoked",
    lastActivity: "Access needs repair",
    fileCount: 64
  }
];

const paymentsArchitecture: ArchitectureOverviewView = {
  repositoryId: "repo_1",
  summary:
    "The repository is organized around route handlers, domain services, repositories, and integration adapters. Most user-facing flows start in HTTP routes, move into service modules, and then fan out to repositories or payment providers.",
  entryPoints: [
    "src/app.ts",
    "src/routes/index.ts",
    "src/modules/auth/auth.routes.ts",
    "src/modules/billing/billing.routes.ts"
  ],
  majorFlows: [
    "Authentication requests start in route middleware and converge in AuthService.",
    "Billing requests pass through orchestration services before reaching payment adapters.",
    "Background jobs reuse the same service layer for asynchronous settlement and retries."
  ],
  moduleNodes: [
    { id: "routes", label: "Routes", kind: "folder" },
    { id: "services", label: "Services", kind: "folder" },
    { id: "repositories", label: "Repositories", kind: "folder" },
    { id: "adapters", label: "Adapters", kind: "folder" },
    { id: "jobs", label: "Jobs", kind: "folder" }
  ],
  moduleEdges: [
    { from: "routes", to: "services", type: "imports" },
    { from: "services", to: "repositories", type: "calls" },
    { from: "services", to: "adapters", type: "calls" },
    { from: "jobs", to: "services", type: "calls" }
  ],
  diagram: [
    "flowchart LR",
    "  Routes[Routes] --> Services[Services]",
    "  Services --> Repositories[Repositories]",
    "  Services --> Adapters[Provider adapters]",
    "  Jobs[Background jobs] --> Services"
  ].join("\n"),
  readiness: "complete",
  recommendedReads: [
    "src/routes/index.ts",
    "src/modules/auth/auth.service.ts",
    "src/modules/billing/billing.orchestrator.ts",
    "src/repositories/session.repository.ts"
  ],
  sections: [
    {
      title: "Read this first",
      body: "Start at the route registry, then move into auth and billing orchestrators.",
      bullets: [
        "Routes define the product surface and reveal the main domains quickly.",
        "Auth and billing services explain the core request-to-data flow.",
        "Repositories and adapters show integration boundaries."
      ]
    },
    {
      title: "Where the architecture is stable",
      body: "The system already has clear layering, but provider-specific logic is still concentrated in a few orchestrators.",
      bullets: [
        "Service boundaries are consistent.",
        "Infrastructure adapters are separated from domain logic.",
        "Billing orchestration is the most coupled area today."
      ]
    }
  ]
};

const onboardingArchitecture: ArchitectureOverviewView = {
  repositoryId: "repo_2",
  summary: "Indexing is still running. CodeMap has detected the app shell and route structure but not enough parsed data for a full architecture read.",
  entryPoints: ["src/app/layout.tsx", "src/app/dashboard/page.tsx"],
  majorFlows: ["Initial scan has identified an App Router structure and component-heavy page composition."],
  moduleNodes: [
    { id: "app", label: "App Router", kind: "folder" },
    { id: "components", label: "Components", kind: "folder" }
  ],
  moduleEdges: [{ from: "app", to: "components", type: "imports" }],
  diagram: ["flowchart LR", "  App[App Router] --> Components[Components]"].join("\n"),
  readiness: "partial",
  recommendedReads: ["src/app/layout.tsx", "src/components/ui/sidebar.tsx"],
  sections: [
    {
      title: "Parsing in progress",
      body: "A deeper architectural map will appear once symbol extraction and embeddings complete.",
      bullets: ["Import graph is still shallow.", "Call-flow detection is not ready yet."]
    }
  ]
};

const accessRevokedArchitecture: ArchitectureOverviewView = {
  repositoryId: "repo_3",
  summary: "Architecture overview is unavailable because repository access needs to be reconnected.",
  entryPoints: [],
  majorFlows: [],
  moduleNodes: [],
  moduleEdges: [],
  diagram: "flowchart LR\n  Access[Reconnect repository access]",
  readiness: "unavailable",
  recommendedReads: [],
  sections: [
    {
      title: "Access required",
      body: "Reconnect the GitHub installation to regenerate architecture insights.",
      bullets: ["No fresh repository snapshot is available.", "Historical insights have been hidden for safety."]
    }
  ]
};

export const repositoryDetails: Record<string, RepositoryDetail> = {
  repo_1: {
    id: "repo_1",
    name: "payments-platform",
    owner: "acme",
    defaultBranch: "main",
    visibility: "private",
    syncStatus: "ready",
    lastIndexedAt: "2026-04-12T10:02:10.000Z",
    description:
      "A TypeScript service platform that handles auth, billing orchestration, settlement, and reporting.",
    starterQuestions: [
      "Where is authentication implemented?",
      "How does the billing flow work?",
      "What are the main modules in this repository?"
    ],
    architecture: paymentsArchitecture,
    syncHistory: [
      {
        id: "sync_04",
        status: "ready",
        startedAt: "2026-04-12T10:00:00.000Z",
        completedAt: "2026-04-12T10:02:10.000Z",
        commitSha: "2f4ce1a",
        summary: {
          filesIndexed: 148,
          chunksCreated: 514,
          languages: ["TypeScript", "JavaScript", "Markdown"]
        }
      },
      {
        id: "sync_03",
        status: "ready",
        startedAt: "2026-04-11T07:30:00.000Z",
        completedAt: "2026-04-11T07:32:12.000Z",
        commitSha: "c8bb1f0",
        summary: {
          filesIndexed: 147,
          chunksCreated: 508,
          languages: ["TypeScript", "JavaScript", "Markdown"]
        }
      },
      {
        id: "sync_02",
        status: "failed",
        startedAt: "2026-04-10T04:14:00.000Z",
        completedAt: "2026-04-10T04:15:05.000Z",
        summary: {
          filesIndexed: 34,
          chunksCreated: 79,
          languages: ["TypeScript"]
        }
      }
    ]
  },
  repo_2: {
    id: "repo_2",
    name: "onboarding-portal",
    owner: "acme",
    defaultBranch: "main",
    visibility: "private",
    syncStatus: "indexing",
    lastIndexedAt: "2026-04-13T12:15:10.000Z",
    description:
      "An internal Next.js product used to manage hires, access provisioning, and workspace setup.",
    starterQuestions: [
      "Which modules make up the admin dashboard?",
      "Where does the app define navigation?",
      "How is onboarding workflow state stored?"
    ],
    architecture: onboardingArchitecture,
    syncHistory: [
      {
        id: "sync_01",
        status: "indexing",
        startedAt: "2026-04-13T12:10:00.000Z",
        summary: {
          filesIndexed: 54,
          chunksCreated: 112,
          languages: ["TypeScript", "Markdown"]
        }
      }
    ]
  },
  repo_3: {
    id: "repo_3",
    name: "analytics-kit",
    owner: "acme",
    defaultBranch: "main",
    visibility: "private",
    syncStatus: "failed",
    lastIndexedAt: "2026-04-08T09:18:10.000Z",
    description:
      "An event aggregation service whose GitHub connection expired before the latest sync.",
    starterQuestions: [
      "Reconnect this repository to continue indexing",
      "Review the last successful snapshot summary"
    ],
    architecture: accessRevokedArchitecture,
    syncHistory: [
      {
        id: "sync_09",
        status: "failed",
        startedAt: "2026-04-13T10:00:00.000Z",
        completedAt: "2026-04-13T10:00:18.000Z"
      }
    ]
  }
};

export const syncProgressViews: Record<string, SyncProgressView> = {
  repo_1: {
    repositoryId: "repo_1",
    state: "ready",
    stageLabel: "Repository ready",
    percentComplete: 100,
    currentStep: "Your repository is searchable and architecture insights are available.",
    steps: ["Connected GitHub", "Fetched code", "Parsed symbols", "Stored embeddings", "Generated overview"]
  },
  repo_2: {
    repositoryId: "repo_2",
    state: "indexing",
    stageLabel: "Indexing in progress",
    percentComplete: 68,
    currentStep: "Generating embeddings for parsed files and assembling the first architecture snapshot.",
    steps: ["Connected GitHub", "Fetched code", "Parsed symbols", "Generating embeddings", "Preparing insights"]
  },
  repo_3: {
    repositoryId: "repo_3",
    state: "access_revoked",
    stageLabel: "Action required",
    percentComplete: 0,
    currentStep: "Reconnect repository access to restore indexing and architecture summaries.",
    steps: ["Reconnect GitHub access", "Verify repository permissions", "Retry sync"]
  }
};

export const citationPreviews: Record<string, CitationPreview[]> = {
  repo_1: [
    {
      filePath: "src/modules/auth/auth.service.ts",
      symbol: "AuthService",
      lineStart: 12,
      lineEnd: 88,
      reason: "Main authentication orchestration and token issuance live here.",
      excerpt:
        "export class AuthService { async login(credentials) { const identity = await this.identityRepo.findByEmail(credentials.email); return this.sessionFactory.issue(identity); } }"
    },
    {
      filePath: "src/routes/auth.routes.ts",
      symbol: "registerAuthRoutes",
      lineStart: 4,
      lineEnd: 36,
      reason: "This route layer wires authentication handlers into the HTTP surface.",
      excerpt:
        "router.post('/login', withAuditContext, async (req, res) => { const result = await authService.login(req.body); res.json(result); });"
    },
    {
      filePath: "src/repositories/session.repository.ts",
      symbol: "SessionRepository",
      lineStart: 7,
      lineEnd: 29,
      reason: "Session persistence lives here after tokens are created.",
      excerpt:
        "async createSession(session: SessionRecord) { return this.db.insertInto('sessions').values(session).executeTakeFirst(); }"
    }
  ]
};

function buildAnswer(
  answer: string,
  intent: QueryIntent,
  citations: CitationPreview[],
  followUps: string[],
  confidence: "low" | "medium" | "high" = "high"
): ChatAnswer {
  return {
    answer,
    intent,
    confidence,
    citations: citations.map(({ excerpt, ...citation }) => citation),
    followUps
  };
}

export const answersByPrompt: Record<string, ChatAnswer> = {
  auth: buildAnswer(
    "Authentication centers on `AuthService`, which receives requests from `auth.routes.ts`, performs identity lookup, and persists session state through the session repository. A new engineer can understand the whole auth flow by reading the route registration, then `AuthService`, then the session repository.",
    "location_lookup",
    citationPreviews.repo_1,
    [
      "Show me the login flow from route to database",
      "Which modules depend on AuthService?",
      "What tests cover auth?"
    ]
  ),
  billing: buildAnswer(
    "Billing flows start in `billing.routes.ts`, enter an orchestration service that coordinates pricing rules and provider adapters, and then emit settlement jobs for asynchronous work. The orchestration layer is the most important place to read because it encodes both business rules and provider selection.",
    "flow_explanation",
    citationPreviews.repo_1,
    [
      "Which files handle retries and settlement jobs?",
      "Where are pricing rules defined?",
      "Which modules call the provider adapters?"
    ],
    "medium"
  ),
  architecture: buildAnswer(
    "The codebase follows a stable layered architecture: routes define the product surface, services own domain workflows, repositories isolate persistence, and adapters keep provider-specific logic at the edges. The clearest entry points are `src/routes/index.ts` and the domain service folders under `src/modules`.",
    "architecture_overview",
    citationPreviews.repo_1,
    [
      "Show me the main module map",
      "What should a new engineer read first?",
      "Which area is most tightly coupled?"
    ]
  )
};

export const initialChatSessions: ChatSessionView[] = [
  {
    id: "session_1",
    repositoryId: "repo_1",
    title: "Authentication flow",
    lastQuestion: "Where is authentication implemented?",
    lastUpdatedAt: "2026-04-13T10:40:00.000Z",
    messages: [
      {
        id: "message_1",
        role: "user",
        content: "Where is authentication implemented?",
        createdAt: "2026-04-13T10:39:00.000Z"
      },
      {
        id: "message_2",
        role: "assistant",
        content: answersByPrompt.auth.answer,
        createdAt: "2026-04-13T10:40:00.000Z",
        answer: answersByPrompt.auth
      }
    ]
  },
  {
    id: "session_2",
    repositoryId: "repo_1",
    title: "Billing request path",
    lastQuestion: "How does the billing flow work?",
    lastUpdatedAt: "2026-04-12T18:14:00.000Z",
    messages: [
      {
        id: "message_3",
        role: "user",
        content: "How does the billing flow work?",
        createdAt: "2026-04-12T18:12:00.000Z"
      },
      {
        id: "message_4",
        role: "assistant",
        content: answersByPrompt.billing.answer,
        createdAt: "2026-04-12T18:14:00.000Z",
        answer: answersByPrompt.billing
      }
    ]
  }
];
