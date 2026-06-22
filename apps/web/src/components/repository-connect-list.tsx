"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RepositoryListItem } from "@codemap/shared";
import { connectRepository } from "../lib/api-client";

export function RepositoryConnectList({ repositories }: { repositories: RepositoryListItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectRepository(repository: RepositoryListItem) {
    setError(null);
    setPendingId(repository.id);
    try {
      const connected = await connectRepository(repository.providerRepoId ?? repository.id);
      router.push(`/onboarding/sync?repo=${connected.id}`);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Could not connect repository.");
      setPendingId(null);
    }
  }

  return (
    <div className="repo-picker-grid">
      {error ? <p className="form-error">{error}</p> : null}
      {repositories.map((repository) => (
        <article key={repository.id} className="card repo-card">
          <div className="repo-card__top">
            <div>
              <p className="eyebrow">{repository.visibility} repository</p>
              <h3>{repository.owner}/{repository.name}</h3>
            </div>
            {repository.health && (
              <span className={`status-pill status-pill--${repository.health}`}>
                {repository.health.replace("_", " ")}
              </span>
            )}
          </div>
          <p>{repository.description}</p>
          <div className="mini-meta">
            <span>{repository.language || "Unknown"}</span>
            <span>{repository.fileCount || 0} files</span>
            <span>{repository.lastActivity || "No recent activity"}</span>
          </div>
          <div className="button-row">
            <button className="button" type="button" disabled={pendingId === repository.id} onClick={() => void selectRepository(repository)}>
              {pendingId === repository.id ? "Connecting..." : "Select repository"}
            </button>
            <button className="button button--secondary" type="button">
              Preview index plan
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
