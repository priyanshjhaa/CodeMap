"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
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
  getArchitectureOverview,
  getCitationPreviews,
  getCurrentWorkspace,
  getRepositoryDetail,
  getSyncProgress,
  listChatSessions,
  sendChatMessage,
  startRepositorySync
} from "../lib/mock-api";
import {
  listRepositories,
  getRepositoryDetail as getRepoDetail,
  getSyncProgress as getSyncProgressReal,
  importRepository,
  createWorkspace
} from "../lib/api-client";

interface ProductContextValue {
  user: CurrentUser | null;
  workspace: WorkspaceSummary | null;
  repositories: RepositoryListItem[];
  activeRepoId: string;
  activeRepository: RepositoryDetail | null;
  syncProgress: SyncProgressView | null;
  architecture: ArchitectureOverviewView | null;
  sessions: ChatSessionView[];
  activeSessionId: string;
  selectedCitations: CitationPreview[];
  appReady: boolean;
  pending: boolean;
  setActiveRepo: (repoId: string) => void;
  setActiveSession: (sessionId: string) => void;
  askQuestion: (message: string) => Promise<void>;
  triggerSync: () => Promise<void>;
}

const ProductContext = createContext<ProductContextValue | null>(null);

export function ProductProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [activeRepoId, setActiveRepoId] = useState("repo_1");
  const [activeRepository, setActiveRepository] = useState<RepositoryDetail | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgressView | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureOverviewView | null>(null);
  const [sessions, setSessions] = useState<ChatSessionView[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("session_1");
  const [selectedCitations, setSelectedCitations] = useState<CitationPreview[]>([]);
  const [appReady, setAppReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [workspaceResult, repositoryResult] = await Promise.all([
          getCurrentWorkspace(),
          listRepositories()
        ]);

        if (cancelled) {
          return;
        }

        setUser(workspaceResult.user);
        setWorkspace(workspaceResult.workspace);
        setRepositories(repositoryResult);
        setActiveRepoId(workspaceResult.workspace.activeRepositoryId);
        setAppReady(true);
      } catch (error) {
        console.error("Failed to bootstrap product context:", error);
        // Set app ready even on error to avoid hanging
        setAppReady(true);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeRepoId) {
      return;
    }

    let cancelled = false;
    setPending(true);

    async function loadRepository() {
      const [detail, architectureResult, sessionsResult, citationsResult, syncResult] =
        await Promise.all([
          getRepositoryDetail(activeRepoId),
          getArchitectureOverview(activeRepoId),
          listChatSessions(activeRepoId),
          getCitationPreviews(activeRepoId),
          getSyncProgress(activeRepoId)
        ]);

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setActiveRepository(detail);
        setArchitecture(architectureResult);
        setSessions(sessionsResult);
        setActiveSessionId(sessionsResult[0]?.id ?? "session_1");
        setSelectedCitations(citationsResult);
        setSyncProgress(syncResult);
        setPending(false);
      });
    }

    void loadRepository();

    return () => {
      cancelled = true;
    };
  }, [activeRepoId]);

  async function askQuestion(message: string) {
    setPending(true);
    const result = await sendChatMessage(activeRepoId, activeSessionId, message);
    startTransition(() => {
      setSessions((current) =>
        current.map((session) => (session.id === result.session.id ? result.session : session))
      );
      setSelectedCitations(result.selectedCitations);
      setPending(false);
    });
  }

  async function triggerSync() {
    setPending(true);
    const result = await startRepositorySync(activeRepoId);
    startTransition(() => {
      setSyncProgress(result);
      setPending(false);
    });
  }

  const value: ProductContextValue = {
    user,
    workspace,
    repositories,
    activeRepoId,
    activeRepository,
    syncProgress,
    architecture,
    sessions,
    activeSessionId,
    selectedCitations,
    appReady,
    pending,
    setActiveRepo(repoId: string) {
      startTransition(() => {
        setActiveRepoId(repoId);
      });
    },
    setActiveSession(sessionId: string) {
      setActiveSessionId(sessionId);
    },
    askQuestion,
    triggerSync
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProduct must be used within ProductProvider");
  }
  return context;
}
