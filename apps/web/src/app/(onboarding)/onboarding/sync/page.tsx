"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import type { SyncProgressView } from "@codemap/shared";
import { OnboardingSteps } from "../../../../components/onboarding-steps";
import { getSyncProgress, startRepositorySync } from "../../../../lib/api-client";

const steps: {
  href: Route;
  title: string;
  body: string;
  status: "current" | "upcoming" | "complete";
}[] = [
  {
    href: "/onboarding/workspace" as Route,
    title: "Create your workspace",
    body: "Choose the team context CodeMap should organize around.",
    status: "complete" as const
  },
  {
    href: "/onboarding/connect" as Route,
    title: "Connect GitHub",
    body: "Select the repositories you want to make legible first.",
    status: "complete" as const
  },
  {
    href: "/onboarding/sync" as Route,
    title: "Run first sync",
    body: "Parse code, build retrieval context, and generate repository insights.",
    status: "current" as const
  }
];

export default function SyncPage() {
  const [sync, setSync] = useState<SyncProgressView | null>(null);
  const [repoId, setRepoId] = useState("repo_1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const selectedRepoId = new URLSearchParams(window.location.search).get("repo") ?? "repo_1";
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    setRepoId(selectedRepoId);

    async function loadSync() {
      try {
        const initialSync = await startRepositorySync(selectedRepoId);
        if (!cancelled) {
          setSync(initialSync);
        }

        async function pollSync() {
          try {
            const latestSync = await getSyncProgress(selectedRepoId);

            if (cancelled) {
              return;
            }

            setSync(latestSync);
            if (latestSync.state === "ready" || latestSync.state === "failed") {
              return;
            }

            pollTimer = setTimeout(() => void pollSync(), 1500);
          } catch {
            if (!cancelled) {
              setError("Could not refresh repository sync status. Try opening the dashboard in a moment.");
            }
          }
        }

        pollTimer = setTimeout(() => void pollSync(), 1500);
      } catch {
        if (!cancelled) {
          setError("Could not start repository sync. Choose a different repository or try again.");
        }
      }
    }

    void loadSync();

    return () => {
      cancelled = true;
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, []);

  return (
    <OnboardingSteps currentTitle="Show first-sync progress before the user lands in the product." steps={steps}>
      <div className="card onboarding-card">
        <p className="eyebrow">Repository sync</p>
        <h2>{sync?.stageLabel ?? "Preparing repository sync"}</h2>
        <p className={sync?.state === "failed" || error ? "form-error" : undefined}>
          {error ?? sync?.currentStep ?? "CodeMap is preparing the first repository pass."}
        </p>
        <div className="meter">
          <span style={{ width: `${sync?.percentComplete ?? 18}%` }} />
        </div>
        <div className="step-pill-row">
          {(sync?.steps ?? ["Connect GitHub access", "Fetch repository metadata", "Prepare first sync"]).map((step) => (
            <span key={step} className="step-pill">
              {step}
            </span>
          ))}
        </div>
        <div className="button-row" style={{ marginTop: "2rem" }}>
          <Link className="button" href={`/dashboard?repo=${repoId}`}>
            Open the product dashboard
          </Link>
          <Link className="button button--secondary" href="/onboarding/connect">
            Choose a different repository
          </Link>
        </div>
      </div>
    </OnboardingSteps>
  );
}
