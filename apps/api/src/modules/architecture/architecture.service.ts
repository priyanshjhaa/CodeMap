import { Injectable } from "@nestjs/common";
import type { ArchitectureOverview } from "@codemap/shared";

@Injectable()
export class ArchitectureService {
  getArchitecture(repositoryId: string): ArchitectureOverview {
    return {
      repositoryId,
      summary:
        "The platform follows a layered request-to-service-to-data pattern. Route handlers call service modules, which coordinate repositories and shared infrastructure helpers.",
      entryPoints: [
        "src/app.ts",
        "src/routes/index.ts",
        "src/modules/auth/auth.routes.ts"
      ],
      majorFlows: [
        "Authentication begins at HTTP middleware, then issues tokens from auth.service.ts.",
        "Billing requests flow from controllers into orchestration services and then to payment gateway adapters.",
        "Shared repositories isolate database reads and writes from domain logic."
      ],
      moduleNodes: [
        { id: "routes", label: "Routes", kind: "folder" },
        { id: "services", label: "Services", kind: "folder" },
        { id: "repositories", label: "Repositories", kind: "folder" },
        { id: "infra", label: "Infrastructure", kind: "folder" }
      ],
      moduleEdges: [
        { from: "routes", to: "services", type: "imports" },
        { from: "services", to: "repositories", type: "calls" },
        { from: "services", to: "infra", type: "calls" }
      ],
      diagram: [
        "flowchart LR",
        "  Routes[Routes] --> Services[Services]",
        "  Services --> Repositories[Repositories]",
        "  Services --> Infra[Infrastructure]"
      ].join("\n")
    };
  }
}
