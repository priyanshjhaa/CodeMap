import { Injectable } from "@nestjs/common";
import type { ArchitectureOverview } from "@codemap/shared";

@Injectable()
export class ArchitectureService {
  getArchitecture(repositoryId: string, repositoryName = "repository"): ArchitectureOverview {
    return {
      repositoryId,
      summary:
        `${repositoryName} is connected and ready for indexing. Architecture details will be persisted as sync processing completes.`,
      entryPoints: ["README.md", "package.json", "src/"],
      majorFlows: [
        "Start with the README and package manifest to identify the main runtime and scripts.",
        "Run an indexing sync to generate source-backed module and dependency analysis."
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
