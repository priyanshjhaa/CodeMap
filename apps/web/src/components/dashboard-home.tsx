"use client";

import Link from "next/link";
import type { Route } from "next";
import type { CSSProperties } from "react";
import { useProduct } from "./product-provider";
import { formatDateLabel } from "../lib/format";

export function DashboardHome() {
  const { activeRepository, syncProgress, architecture, repositories } = useProduct();
  const repoName = activeRepository ? `${activeRepository.owner}/${activeRepository.name}` : "your repository";
  const architectureReady =
    architecture?.readiness === "complete"
      ? "Architecture overview is ready."
      : architecture?.readiness === "partial"
        ? "Architecture notes are still filling in."
        : "Architecture mapping has not started yet.";
  const syncSummary = syncProgress?.currentStep ?? "Pick a repository and start from the first guided action.";
  const nextActionHref =
    syncProgress?.state === "empty" ? ("/dashboard/syncs" as Route) : ("/dashboard/chat" as Route);
  const nextActionLabel = syncProgress?.state === "empty" ? "Open sync setup" : "Open repository chat";
  const nextActionBody =
    syncProgress?.state === "empty"
      ? "Start the first indexing pass so the product can build repository context."
      : "Ask onboarding questions once the repository context looks good.";
  const progress = syncProgress?.percentComplete ?? 0;

  if (!repositories.length) {
    return (
      <section className="card">
        <p className="eyebrow">Workspace setup</p>
        <h2>No repositories connected yet.</h2>
        <p>
          Once a repository is connected, this dashboard will surface sync progress, architecture
          readiness, and chat entry points.
        </p>
      </section>
    );
  }

  return (
    <div className="dashboard-overview">
      <section className="dashboard-command">
        <div className="dashboard-command__copy">
          <p className="eyebrow">Continue onboarding</p>
          <h2>{nextActionLabel}</h2>
          <p>{nextActionBody}</p>
          <div className="button-row">
            <Link className="button" href={nextActionHref}>
              {nextActionLabel}
            </Link>
            <Link className="button button--secondary" href={"/dashboard/architecture" as Route}>
              View architecture
            </Link>
          </div>
        </div>
        <div className="dashboard-command__progress">
          <div className="progress-orbit" style={{ "--progress": `${progress * 3.6}deg` } as CSSProperties}>
            <div>
              <strong>{progress}%</strong>
              <span>indexed</span>
            </div>
          </div>
          <p>{syncProgress?.stageLabel ?? "Waiting to start"}</p>
          <span>{syncSummary}</span>
        </div>
      </section>

      <section className="dashboard-signal-strip" aria-label="Repository signals">
        <div>
          <span>Repository</span>
          <strong>{repoName}</strong>
        </div>
        <div>
          <span>Architecture</span>
          <strong>{architectureReady.replace(".", "")}</strong>
        </div>
        <div>
          <span>Branch</span>
          <strong>{activeRepository?.defaultBranch ?? "Not available"}</strong>
        </div>
        <div>
          <span>Last indexed</span>
          <strong>
            {activeRepository?.lastIndexedAt
              ? formatDateLabel(activeRepository.lastIndexedAt)
              : "Not indexed yet"}
          </strong>
        </div>
      </section>

      <section className="dashboard-workspace-grid">
        <article className="dashboard-panel dashboard-panel--reads">
          <div className="dashboard-panel__heading">
            <div>
              <p className="eyebrow">Recommended reads</p>
              <h3>Start with the highest-signal files</h3>
            </div>
            <Link className="text-link" href={"/dashboard/architecture" as Route}>
              Open map
            </Link>
          </div>
          <ol className="dashboard-read-list">
            {architecture?.recommendedReads?.length ? (
              architecture.recommendedReads.slice(0, 4).map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>01</span>
                <strong>Reading suggestions appear after architecture analysis.</strong>
              </li>
            )}
          </ol>
        </article>

        <article className="dashboard-panel dashboard-panel--actions">
          <div className="dashboard-panel__heading">
            <div>
              <p className="eyebrow">Explore repository</p>
              <h3>Choose a workspace</h3>
            </div>
          </div>
          <div className="dashboard-action-list">
            <Link href={"/dashboard/chat" as Route}>
              <span>01</span>
              <div>
                <strong>Repository chat</strong>
                <p>Ask about modules, ownership, and flows.</p>
              </div>
            </Link>
            <Link href={"/dashboard/architecture" as Route}>
              <span>02</span>
              <div>
                <strong>Architecture map</strong>
                <p>See entry points and system boundaries.</p>
              </div>
            </Link>
            <Link href={"/dashboard/syncs" as Route}>
              <span>03</span>
              <div>
                <strong>Sync activity</strong>
                <p>Review indexing health and recent runs.</p>
              </div>
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
