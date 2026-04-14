import { Injectable } from "@nestjs/common";
import type { Citation, QueryIntent } from "@codemap/shared";

@Injectable()
export class RetrievalService {
  classify(question: string): QueryIntent {
    const normalized = question.toLowerCase();
    if (normalized.includes("where")) {
      return "location_lookup";
    }
    if (normalized.includes("architecture") || normalized.includes("overview")) {
      return "architecture_overview";
    }
    if (normalized.includes("how")) {
      return "flow_explanation";
    }
    return "symbol_explanation";
  }

  retrieve(question: string): { intent: QueryIntent; citations: Citation[] } {
    const intent = this.classify(question);

    return {
      intent,
      citations: [
        {
          filePath: "src/modules/auth/auth.service.ts",
          symbol: "AuthService",
          lineStart: 12,
          lineEnd: 88,
          reason: "Primary authentication orchestration lives here."
        },
        {
          filePath: "src/routes/auth.routes.ts",
          symbol: "registerAuthRoutes",
          lineStart: 4,
          lineEnd: 36,
          reason: "Entry point that wires auth handlers into the HTTP layer."
        }
      ]
    };
  }
}
