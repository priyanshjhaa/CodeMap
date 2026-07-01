import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  ArchitectureOverviewView,
  ArchitectureSection,
  ModuleEdge,
  ModuleNode
} from "@codemap/shared";
import { dirname, join, normalize } from "node:path/posix";
import type { ParsedFile } from "../parser/parser.service.js";
import { PrismaService } from "../database/prisma.service.js";

type SnapshotModuleMap = Omit<ArchitectureOverviewView, "repositoryId" | "summary" | "diagram"> & {
  stats: {
    filesIndexed: number;
    symbolsExtracted: number;
    edgesDetected: number;
    generatedFrom: "parsed_metadata";
  };
};

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];
const ENTRY_PATTERNS = [
  /(^|\/)README\.md$/i,
  /^package\.json$/,
  /(^|\/)(main|server|index|middleware)\.(ts|tsx|js|jsx|mjs|cjs)$/,
  /(^|\/)(app|pages|routes|controllers)\//,
  /(^|\/)(schema\.prisma|prisma\/schema\.prisma)$/
];
const RECOMMENDED_KEYWORDS = [
  "auth",
  "billing",
  "payment",
  "checkout",
  "route",
  "controller",
  "service",
  "repository",
  "database",
  "schema",
  "middleware"
];

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function normalizeFilePath(path: string) {
  return normalize(path).replace(/^\.\//, "");
}

function moduleIdForPath(path: string) {
  const parts = normalizeFilePath(path).split("/");
  if (parts.length === 1) return "root";

  const [first, second] = parts;
  if (first === "src" && second) return `src/${second}`;
  if (["apps", "packages"].includes(first) && second) return `${first}/${second}`;
  if (["app", "pages", "routes", "controllers", "services", "repositories", "lib", "prisma"].includes(first)) {
    return first;
  }

  return first;
}

function labelForModule(id: string) {
  if (id === "root") return "Root";
  return id
    .split("/")
    .map((part) => part.replace(/[-_]/g, " "))
    .join(" / ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function nodeKindForModule(id: string): ModuleNode["kind"] {
  if (/(service|controller|route|repository|module)s?$/i.test(id)) return "service";
  if (id.includes("/")) return "module";
  return "folder";
}

function mermaidId(moduleId: string) {
  return moduleId.replace(/[^a-zA-Z0-9]/g, "_") || "root";
}

function metadataArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

@Injectable()
export class ArchitectureService {
  constructor(private readonly prisma: PrismaService) {}

  async createSnapshot(repositoryId: string, repositoryName: string, parsedFiles: ParsedFile[]) {
    const architecture = this.buildArchitecture(repositoryId, repositoryName, parsedFiles);

    await this.prisma.architectureSnapshot.create({
      data: {
        repositoryId,
        summary: architecture.summary,
        diagram: architecture.diagram,
        moduleMap: toJson({
          readiness: architecture.readiness,
          entryPoints: architecture.entryPoints,
          majorFlows: architecture.majorFlows,
          moduleNodes: architecture.moduleNodes,
          moduleEdges: architecture.moduleEdges,
          recommendedReads: architecture.recommendedReads,
          sections: architecture.sections,
          stats: {
            filesIndexed: parsedFiles.length,
            symbolsExtracted: parsedFiles.reduce((count, file) => count + file.symbols.length, 0),
            edgesDetected: architecture.moduleEdges.length,
            generatedFrom: "parsed_metadata"
          }
        } satisfies SnapshotModuleMap)
      }
    });

    return architecture;
  }

  async getArchitecture(repositoryId: string, repositoryName = "repository"): Promise<ArchitectureOverviewView> {
    const [snapshot, latestSync] = await Promise.all([
      this.prisma.architectureSnapshot.findFirst({
        where: { repositoryId },
        orderBy: { generatedAt: "desc" }
      }),
      this.prisma.repositorySync.findFirst({
        where: { repositoryId },
        orderBy: { startedAt: "desc" }
      })
    ]);

    if (!snapshot) {
      return this.unavailableArchitecture(repositoryId, repositoryName, latestSync?.status);
    }

    const moduleMap = this.readModuleMap(snapshot.moduleMap);
    const architecture: ArchitectureOverviewView = {
      repositoryId,
      summary: snapshot.summary,
      entryPoints: moduleMap.entryPoints,
      majorFlows: moduleMap.majorFlows,
      moduleNodes: moduleMap.moduleNodes,
      moduleEdges: moduleMap.moduleEdges,
      diagram: snapshot.diagram,
      readiness: moduleMap.readiness,
      recommendedReads: moduleMap.recommendedReads,
      sections: moduleMap.sections
    };

    if (latestSync?.status === "queued" || latestSync?.status === "indexing") {
      return {
        ...architecture,
        readiness: "partial",
        summary: "A newer repository sync is running. Showing the latest completed architecture snapshot until the refresh finishes."
      };
    }

    return architecture;
  }

  private buildArchitecture(repositoryId: string, repositoryName: string, parsedFiles: ParsedFile[]): ArchitectureOverviewView {
    const moduleNodes = this.buildModuleNodes(parsedFiles);
    const moduleEdges = this.buildModuleEdges(parsedFiles);
    const entryPoints = this.findEntryPoints(parsedFiles);
    const recommendedReads = this.findRecommendedReads(parsedFiles, entryPoints);
    const majorFlows = this.describeMajorFlows(moduleEdges, parsedFiles);
    const sections = this.buildSections(parsedFiles, moduleNodes, moduleEdges);
    const readiness = this.readinessFor(parsedFiles, moduleEdges);
    const diagram = this.buildDiagram(moduleNodes, moduleEdges);

    return {
      repositoryId,
      summary: this.buildSummary(repositoryName, parsedFiles, moduleNodes, moduleEdges, readiness),
      entryPoints,
      majorFlows,
      moduleNodes,
      moduleEdges,
      diagram,
      readiness,
      recommendedReads,
      sections
    };
  }

  private buildModuleNodes(parsedFiles: ParsedFile[]): ModuleNode[] {
    const moduleIds = unique(parsedFiles.map((file) => moduleIdForPath(file.path)));
    return moduleIds
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 18)
      .map((id) => ({
        id,
        label: labelForModule(id),
        kind: nodeKindForModule(id)
      }));
  }

  private buildModuleEdges(parsedFiles: ParsedFile[]): ModuleEdge[] {
    const pathSet = new Set(parsedFiles.map((file) => file.path));
    const edges = new Map<string, ModuleEdge>();

    for (const file of parsedFiles) {
      const from = moduleIdForPath(file.path);
      for (const importPath of this.importsForFile(file)) {
        const resolvedPath = this.resolveLocalImport(file.path, importPath, pathSet);
        if (!resolvedPath) continue;

        const to = moduleIdForPath(resolvedPath);
        if (from === to) continue;

        const key = `${from}->${to}`;
        if (!edges.has(key)) {
          edges.set(key, { from, to, type: "imports" });
        }
      }
    }

    return Array.from(edges.values()).slice(0, 32);
  }

  private importsForFile(file: ParsedFile) {
    return unique([
      ...file.imports,
      ...file.chunks.flatMap((chunk) => metadataArray(chunk.metadata.imports))
    ]);
  }

  private resolveLocalImport(fromPath: string, importPath: string, pathSet: Set<string>) {
    if (!importPath.startsWith(".")) return null;

    const base = normalizeFilePath(join(dirname(fromPath), importPath));
    const candidates = [
      base,
      ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
      ...SOURCE_EXTENSIONS.map((extension) => `${base}/index${extension}`)
    ];

    return candidates.find((candidate) => pathSet.has(candidate)) ?? null;
  }

  private findEntryPoints(parsedFiles: ParsedFile[]) {
    const matched = parsedFiles
      .map((file) => file.path)
      .filter((path) => ENTRY_PATTERNS.some((pattern) => pattern.test(path)));

    return this.prioritizePaths(unique(matched), 8);
  }

  private findRecommendedReads(parsedFiles: ParsedFile[], entryPoints: string[]) {
    const scored = parsedFiles
      .map((file) => ({
        path: file.path,
        score:
          (entryPoints.includes(file.path) ? 8 : 0) +
          file.symbols.filter((symbol) => symbol.exported).length +
          RECOMMENDED_KEYWORDS.reduce(
            (score, keyword) => score + (file.path.toLowerCase().includes(keyword) ? 4 : 0),
            0
          )
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))
      .map((item) => item.path);

    return this.prioritizePaths(unique([...entryPoints, ...scored]), 8);
  }

  private describeMajorFlows(moduleEdges: ModuleEdge[], parsedFiles: ParsedFile[]) {
    const flows: string[] = [];
    const hasRouteToService = moduleEdges.some(
      (edge) => /route|controller|page|app/i.test(edge.from) && /service|module|lib/i.test(edge.to)
    );
    const hasServiceToData = moduleEdges.some(
      (edge) => /service|module|lib/i.test(edge.from) && /repo|database|prisma|model/i.test(edge.to)
    );
    const hasApiLayer = parsedFiles.some((file) => /(^|\/)(app\/api|pages\/api|routes|controllers)\//.test(file.path));
    const hasPersistence = parsedFiles.some((file) => /(prisma|repository|database|schema)/i.test(file.path));

    if (hasRouteToService) {
      flows.push("Request handling appears to start in route/controller modules and delegate into service or domain modules.");
    } else if (hasApiLayer) {
      flows.push("API or route entry points are present; inspect them first to understand request flow.");
    }

    if (hasServiceToData) {
      flows.push("Service/domain modules import repository, database, or Prisma layers for persistence work.");
    } else if (hasPersistence) {
      flows.push("Persistence-related files are present; connect their callers from the recommended reads list.");
    }

    if (moduleEdges.length) {
      flows.push("Module dependencies are inferred from static imports between indexed TS/JS files.");
    }

    return flows.length
      ? flows.slice(0, 5)
      : ["Not enough import structure was detected yet; start with entry points and exported symbols."];
  }

  private buildSections(parsedFiles: ParsedFile[], moduleNodes: ModuleNode[], moduleEdges: ModuleEdge[]): ArchitectureSection[] {
    const languages = unique(parsedFiles.map((file) => file.language)).sort();
    const exportedSymbols = parsedFiles.reduce(
      (count, file) => count + file.symbols.filter((symbol) => symbol.exported).length,
      0
    );

    return [
      {
        title: "Module map",
        body: "Top-level areas are inferred from repository folders and static import boundaries.",
        bullets: [
          `${moduleNodes.length} major module areas detected.`,
          `${moduleEdges.length} cross-module import relationships detected.`,
          moduleEdges.length ? "Use the diagram to choose the first dependency path to read." : "Sparse import data means the map is intentionally conservative."
        ]
      },
      {
        title: "Code intelligence",
        body: "Architecture insights are generated from files, symbols, exports, and chunk metadata created during sync.",
        bullets: [
          `${parsedFiles.length} files contributed to this snapshot.`,
          `${exportedSymbols} exported symbols were found.`,
          `Languages indexed: ${languages.join(", ") || "unknown"}.`
        ]
      }
    ];
  }

  private readinessFor(parsedFiles: ParsedFile[], moduleEdges: ModuleEdge[]): ArchitectureOverviewView["readiness"] {
    const tsJsFiles = parsedFiles.filter((file) =>
      ["typescript", "tsx", "javascript", "jsx", "mjs", "cjs"].includes(file.language)
    );
    const symbolCount = parsedFiles.reduce((count, file) => count + file.symbols.length, 0);

    if (parsedFiles.length < 3 || tsJsFiles.length < 2 || symbolCount < 3) return "partial";
    if (moduleEdges.length === 0 && parsedFiles.length < 8) return "partial";
    return "complete";
  }

  private buildSummary(
    repositoryName: string,
    parsedFiles: ParsedFile[],
    moduleNodes: ModuleNode[],
    moduleEdges: ModuleEdge[],
    readiness: ArchitectureOverviewView["readiness"]
  ) {
    const languages = unique(parsedFiles.map((file) => file.language)).sort();
    const qualityNote =
      readiness === "complete"
        ? "The snapshot has enough parsed structure for a useful onboarding map."
        : "The snapshot is partial because the repository has sparse TS/JS structure or limited cross-module imports.";

    return `${repositoryName} has ${parsedFiles.length} indexed files across ${languages.join(", ") || "unknown"} with ${moduleNodes.length} module areas and ${moduleEdges.length} detected import relationships. ${qualityNote}`;
  }

  private buildDiagram(moduleNodes: ModuleNode[], moduleEdges: ModuleEdge[]) {
    const visibleNodes = moduleNodes.slice(0, 12);
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    const visibleEdges = moduleEdges
      .filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to))
      .slice(0, 18);

    const lines = ["flowchart LR"];
    for (const node of visibleNodes) {
      lines.push(`  ${mermaidId(node.id)}["${node.label}"]`);
    }

    for (const edge of visibleEdges) {
      lines.push(`  ${mermaidId(edge.from)} --> ${mermaidId(edge.to)}`);
    }

    if (!visibleEdges.length && visibleNodes.length > 1) {
      lines.push(`  ${mermaidId(visibleNodes[0].id)} -.-> ${mermaidId(visibleNodes[1].id)}`);
    }

    return lines.join("\n");
  }

  private prioritizePaths(paths: string[], limit: number) {
    return paths
      .sort((left, right) => this.pathPriority(left) - this.pathPriority(right) || left.localeCompare(right))
      .slice(0, limit);
  }

  private pathPriority(path: string) {
    if (/README\.md$/i.test(path)) return 0;
    if (path === "package.json") return 1;
    if (/(^|\/)(app|pages|routes|controllers)\//.test(path)) return 2;
    if (/auth|billing|payment|checkout/i.test(path)) return 3;
    if (/service|repository|database|schema|prisma/i.test(path)) return 4;
    return 5;
  }

  private unavailableArchitecture(
    repositoryId: string,
    repositoryName: string,
    latestSyncStatus?: string
  ): ArchitectureOverviewView {
    const isRunning = latestSyncStatus === "queued" || latestSyncStatus === "indexing";
    const failed = latestSyncStatus === "failed";

    return {
      repositoryId,
      summary: isRunning
        ? `${repositoryName} is currently indexing. Architecture insights will appear when the first successful sync completes.`
        : failed
          ? `${repositoryName} does not have an architecture snapshot because the latest sync failed. Retry sync after fixing the reported issue.`
          : `${repositoryName} does not have an architecture snapshot yet. Start a repository sync to generate one.`,
      entryPoints: [],
      majorFlows: [],
      moduleNodes: [],
      moduleEdges: [],
      diagram: "flowchart LR\n  Pending[Architecture unavailable until sync completes]",
      readiness: "unavailable",
      recommendedReads: [],
      sections: [
        {
          title: "Snapshot unavailable",
          body: "CodeMap needs one successful repository sync before it can build architecture insights.",
          bullets: ["Run or retry sync.", "Keep repository size within MVP limits.", "Check sync history for GitHub, parsing, or vector-generation failures."]
        }
      ]
    };
  }

  private readModuleMap(value: Prisma.JsonValue): SnapshotModuleMap {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return this.emptyModuleMap();
    }

    const map = value as Record<string, unknown>;
    return {
      readiness:
        map.readiness === "complete" || map.readiness === "partial" || map.readiness === "unavailable"
          ? map.readiness
          : "partial",
      entryPoints: metadataArray(map.entryPoints),
      majorFlows: metadataArray(map.majorFlows),
      moduleNodes: Array.isArray(map.moduleNodes) ? (map.moduleNodes as ModuleNode[]) : [],
      moduleEdges: Array.isArray(map.moduleEdges) ? (map.moduleEdges as ModuleEdge[]) : [],
      recommendedReads: metadataArray(map.recommendedReads),
      sections: Array.isArray(map.sections) ? (map.sections as ArchitectureSection[]) : [],
      stats:
        map.stats && typeof map.stats === "object"
          ? (map.stats as SnapshotModuleMap["stats"])
          : this.emptyModuleMap().stats
    };
  }

  private emptyModuleMap(): SnapshotModuleMap {
    return {
      readiness: "partial",
      entryPoints: [],
      majorFlows: [],
      moduleNodes: [],
      moduleEdges: [],
      recommendedReads: [],
      sections: [],
      stats: {
        filesIndexed: 0,
        symbolsExtracted: 0,
        edgesDetected: 0,
        generatedFrom: "parsed_metadata"
      }
    };
  }
}
