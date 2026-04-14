import type {
  ArchitectureOverviewView,
  ChatSessionView,
  CitationPreview,
  CurrentUser,
  RepositoryDetail,
  RepositoryListItem,
  SyncProgressView,
  WorkspaceSummary
} from "@codemap/shared";
import {
  answersByPrompt,
  citationPreviews,
  currentUser,
  initialChatSessions,
  repositories,
  repositoryDetails,
  syncProgressViews,
  workspace
} from "./mock-data";

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getCurrentWorkspace(): Promise<{
  user: CurrentUser;
  workspace: WorkspaceSummary;
}> {
  await pause(120);
  return { user: currentUser, workspace };
}

export async function listRepositories(): Promise<RepositoryListItem[]> {
  await pause(160);
  return repositories;
}

export async function getRepositoryDetail(repoId: string): Promise<RepositoryDetail> {
  await pause(180);
  return repositoryDetails[repoId] ?? repositoryDetails.repo_1;
}

export async function getArchitectureOverview(
  repoId: string
): Promise<ArchitectureOverviewView> {
  await pause(220);
  return (repositoryDetails[repoId]?.architecture as ArchitectureOverviewView) ?? repositoryDetails.repo_1.architecture;
}

export async function getSyncHistory(repoId: string): Promise<RepositoryDetail["syncHistory"]> {
  await pause(140);
  return repositoryDetails[repoId]?.syncHistory ?? repositoryDetails.repo_1.syncHistory;
}

export async function getSyncProgress(repoId: string): Promise<SyncProgressView> {
  await pause(180);
  return syncProgressViews[repoId] ?? syncProgressViews.repo_1;
}

export async function startRepositorySync(repoId: string): Promise<SyncProgressView> {
  await pause(600);
  return syncProgressViews[repoId] ?? syncProgressViews.repo_1;
}

export async function listChatSessions(repoId: string): Promise<ChatSessionView[]> {
  await pause(150);
  return initialChatSessions.filter((session) => session.repositoryId === repoId);
}

export async function getCitationPreviews(repoId: string): Promise<CitationPreview[]> {
  await pause(120);
  return citationPreviews[repoId] ?? citationPreviews.repo_1;
}

export async function sendChatMessage(
  repoId: string,
  sessionId: string,
  message: string
): Promise<{
  session: ChatSessionView;
  selectedCitations: CitationPreview[];
}> {
  await pause(700);

  const normalized = message.toLowerCase();
  const answer =
    normalized.includes("billing")
      ? answersByPrompt.billing
      : normalized.includes("architecture") || normalized.includes("main modules")
        ? answersByPrompt.architecture
        : answersByPrompt.auth;

  const previewCitations = citationPreviews[repoId] ?? citationPreviews.repo_1;
  const baseSessions = initialChatSessions.filter((session) => session.repositoryId === repoId);
  const baseSession = baseSessions.find((session) => session.id === sessionId) ?? baseSessions[0];

  const session: ChatSessionView = {
    ...baseSession,
    lastQuestion: message,
    lastUpdatedAt: new Date().toISOString(),
    messages: [
      ...baseSession.messages,
      {
        id: `message_user_${Date.now()}`,
        role: "user",
        content: message,
        createdAt: new Date().toISOString()
      },
      {
        id: `message_assistant_${Date.now() + 1}`,
        role: "assistant",
        content: answer.answer,
        createdAt: new Date().toISOString(),
        answer
      }
    ]
  };

  return {
    session,
    selectedCitations: previewCitations
  };
}
