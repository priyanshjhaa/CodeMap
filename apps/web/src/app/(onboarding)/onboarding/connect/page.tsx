"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";
import type { RepositoryListItem } from "@codemap/shared";
import { listRepositories } from "../../../../lib/api-client";
import { OnboardingSteps } from "../../../../components/onboarding-steps";
import { RepositoryConnectList } from "../../../../components/repository-connect-list";

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
    status: "complete" as const,
  },
  {
    href: "/onboarding/connect" as Route,
    title: "Connect GitHub",
    body: "Select the repositories you want to make legible first.",
    status: "current" as const,
  },
  {
    href: "/onboarding/sync" as Route,
    title: "Run first sync",
    body: "Parse code, build retrieval context, and generate repository insights.",
    status: "upcoming" as const,
  },
];

export default function ConnectPage() {
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRepos() {
      try {
        const repos = await listRepositories();
        setRepositories(repos);
      } catch (err) {
        console.error("Failed to load repositories:", err);
        setError(
          "Failed to load repositories. Please make sure you've connected your GitHub account."
        );
      } finally {
        setLoading(false);
      }
    }
    loadRepos();
  }, []);

  return (
    <OnboardingSteps
      currentTitle="Choose the first repository CodeMap should make understandable."
      steps={steps}
    >
      <div className="card onboarding-card">
        <p className="eyebrow">GitHub connect</p>
        <h2>Choose your repositories</h2>
        <p>
          Select the repositories you want to analyze with CodeMap. You can always add more
          repositories later.
        </p>
      </div>

      {loading ? (
        <div className="card onboarding-card">
          <p>Loading repositories from GitHub...</p>
        </div>
      ) : error ? (
        <div className="card onboarding-card">
          <p className="error">{error}</p>
        </div>
      ) : repositories.length === 0 ? (
        <div className="card onboarding-card">
          <p>No repositories found. Make sure you have repositories in your GitHub account.</p>
        </div>
      ) : (
        <RepositoryConnectList repositories={repositories} />
      )}
    </OnboardingSteps>
  );
}
