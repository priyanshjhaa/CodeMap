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
  listRepositories,
  listChatSessions,
  sendChatMessage,
  startRepositorySync
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
  activeSessionId: string | null;
  selectedCitations: CitationPreview[];
  appReady: boolean;
  pending: boolean;
  bootstrapError: string | null;
  repositoryError: string | null;
  setActiveRepo: (repoId: string) => void;
  setActiveSession: (sessionId: string) => void;
  askQuestion: (message: string) => Promise<void>;
  triggerSync: () => Promise<void>;
}

const ProductContext = createContext<ProductContextValue | null>(null);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ProductProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [activeRepoId, setActiveRepoId] = useState("");
  const [activeRepository, setActiveRepository] = useState<RepositoryDetail | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgressView | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureOverviewView | null>(null);
  const [sessions, setSessions] = useState<ChatSessionView[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedCitations, setSelectedCitations] = useState<CitationPreview[]>([]);
  const [appReady, setAppReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);

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
        setBootstrapError(null);
        setActiveRepoId(
          repositoryResult.find((repository) => repository.id === workspaceResult.workspace.activeRepositoryId)?.id ??
            repositoryResult[0]?.id ??
            ""
        );
        setAppReady(true);
      } catch (error) {
        console.error("Failed to bootstrap product context:", error);
        setBootstrapError(
          error instanceof Error ? error.message : "Unable to load workspace data."
        );
        setAppReady(true);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadRepositoryState(
    repoId: string,
    options: { isCancelled?: () => boolean; showPending?: boolean } = {}
  ) {
    if (options.showPending ?? true) {
      setPending(true);
    }
    setRepositoryError(null);

    const [detailResult, architectureResult, sessionsResult, citationsResult, syncResult] =
      await Promise.allSettled([
        getRepositoryDetail(repoId),
        getArchitectureOverview(repoId),
        listChatSessions(repoId),
        getCitationPreviews(repoId),
        getSyncProgress(repoId)
      ]);

    if (options.isCancelled?.()) {
      return;
    }

    if (detailResult.status === "rejected") {
      setActiveRepository(null);
      setArchitecture(null);
      setSessions([]);
      setSelectedCitations([]);
      setSyncProgress(null);
      setActiveSessionId(null);
      setRepositoryError(
        detailResult.reason instanceof Error
          ? detailResult.reason.message
          : "Unable to load repository details."
      );
      setPending(false);
      return;
    }

    const detail = detailResult.value;
    const architectureValue =
      architectureResult.status === "fulfilled" ? architectureResult.value : null;
    const sessionsValue =
      sessionsResult.status === "fulfilled" ? sessionsResult.value : [];
    const citationsValue =
      citationsResult.status === "fulfilled" ? citationsResult.value : [];
    const syncValue = syncResult.status === "fulfilled" ? syncResult.value : null;

    startTransition(() => {
      setActiveRepository(detail);
      setArchitecture(architectureValue);
      setSessions(sessionsValue);
      setActiveSessionId(sessionsValue[0]?.id ?? null);
      setSelectedCitations(citationsValue);
      setSyncProgress(syncValue);
      setRepositoryError(null);
      setPending(false);
    });
  }

  useEffect(() => {
    if (!activeRepoId) {
      setActiveRepository(null);
      setArchitecture(null);
      setSessions([]);
      setSelectedCitations([]);
      setSyncProgress(null);
      setActiveSessionId(null);
      setRepositoryError(null);
      return;
    }

    let cancelled = false;

    void loadRepositoryState(activeRepoId, {
      isCancelled: () => cancelled
    });

    return () => {
      cancelled = true;
    };
  }, [activeRepoId]);

  async function askQuestion(message: string) {
    if (!activeRepoId) {
      return;
    }

    setPending(true);
    setRepositoryError(null);

    try {
      const result = await sendChatMessage(activeRepoId, activeSessionId, message);
      startTransition(() => {
        setSessions((current) => {
          const existingIndex = current.findIndex((session) => session.id === result.session.id);
          if (existingIndex === -1) {
            return [result.session, ...current];
          }

          return current.map((session) =>
            session.id === result.session.id ? result.session : session
          );
        });
        setActiveSessionId(result.session.id);
        setSelectedCitations(result.selectedCitations);
        setPending(false);
      });
    } catch (error) {
      setRepositoryError(
        error instanceof Error ? error.message : "Unable to send chat message."
      );
      setPending(false);
    }
  }

  async function triggerSync() {
    if (!activeRepoId) {
      return;
    }

    setPending(true);
    setRepositoryError(null);

    try {
      const result = await startRepositorySync(activeRepoId);
      startTransition(() => {
        setSyncProgress(result);
      });

      for (let attempt = 0; attempt < 120; attempt += 1) {
        await wait(1500);
        const latestSync = await getSyncProgress(activeRepoId);
        setSyncProgress(latestSync);

        if (latestSync.state === "ready" || latestSync.state === "failed") {
          await loadRepositoryState(activeRepoId, { showPending: false });
          setPending(false);
          return;
        }
      }

      setRepositoryError("Repository sync is still running. Refresh sync status again in a moment.");
      setPending(false);
    } catch (error) {
      setRepositoryError(
        error instanceof Error ? error.message : "Unable to start repository sync."
      );
      setPending(false);
    }
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
    bootstrapError,
    repositoryError,
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
