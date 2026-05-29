import { NextResponse } from "next/server";
import type { ChatSessionView, CitationPreview } from "@codemap/shared";

type ChatRequestBody = {
  question?: string;
  repositoryId?: string;
  sessionId?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ repoId: string }> }
) {
  const body = (await request.json()) as ChatRequestBody;
  const { repoId } = await context.params;
  const question = body.question?.trim() ?? "How is this repository organized?";
  const now = new Date().toISOString();

  const session: ChatSessionView = {
    id: body.sessionId ?? `session_${repoId}`,
    repositoryId: body.repositoryId ?? repoId,
    title: question.length > 48 ? `${question.slice(0, 48)}...` : question,
    lastQuestion: question,
    lastUpdatedAt: now,
    messages: [
      {
        id: `message_user_${Date.now()}`,
        role: "user",
        content: question,
        createdAt: now
      },
      {
        id: `message_assistant_${Date.now() + 1}`,
        role: "assistant",
        content:
          "GitHub auth is connected, but repository-aware chat still needs the indexing pipeline. Right now the dashboard can show your real repos and profile while deeper code answers remain pending.",
        createdAt: now
      }
    ]
  };

  const selectedCitations: CitationPreview[] = [
    {
      filePath: "README.md",
      reason: "This is the first place to wire a grounded answer once indexing is available.",
      excerpt: "Live code citations will appear here after repository indexing is connected.",
      lineStart: 1,
      lineEnd: 1
    }
  ];

  return NextResponse.json({ session, selectedCitations });
}
