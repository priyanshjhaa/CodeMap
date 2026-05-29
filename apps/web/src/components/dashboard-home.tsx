"use client";

import Link from "next/link";
import type { Route } from "next";
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
    <div className="content-stack">
      <section className="dashboard-focus">
        <article className="card dashboard-hero-card">
          <p className="eyebrow">Start here</p>
          <h2>{activeRepository?.name ?? "Choose a repository"}</h2>
          <p>
            {activeRepository?.description ??
              "Repository metadata will appear here once the overview endpoint is available."}
          </p>
          <div className="dashboard-checklist">
            <div className="dashboard-checklist__item">
              <span>Repository</span>
              <strong>{repoName}</strong>
            </div>
            <div className="dashboard-checklist__item">
              <span>Sync status</span>
              <strong>{syncProgress?.stageLabel ?? "Waiting to start"}</strong>
            </div>
            <div className="dashboard-checklist__item">
              <span>Next step</span>
              <strong>{syncSummary}</strong>
            </div>
          </div>
          <div className="button-row dashboard-hero-actions">
            <Link className="button" href={nextActionHref}>
              {nextActionLabel}
            </Link>
            <Link className="button button--secondary" href={"/dashboard/architecture" as Route}>
              View architecture
            </Link>
          </div>
        </article>

        <article className="card dashboard-next-card">
          <p className="eyebrow">What to do now</p>
          <h3>{nextActionLabel}</h3>
          <p>{nextActionBody}</p>
          <div className="meter">
            <span style={{ width: `${syncProgress?.percentComplete ?? 0}%` }} />
          </div>
          <span className="dashboard-supporting-copy">{architectureReady}</span>
        </article>
      </section>

      <section className="dashboard-paths">
        <Link className="card dashboard-path-card" href={"/dashboard/chat" as Route}>
          <p className="eyebrow">Ask questions</p>
          <h3>Repository chat</h3>
          <p>Use natural questions to understand modules, ownership, and file locations.</p>
        </Link>

        <Link className="card dashboard-path-card" href={"/dashboard/architecture" as Route}>
          <p className="eyebrow">See the shape</p>
          <h3>Architecture view</h3>
          <p>
            {architecture?.summary ??
              "Open a calmer summary of entry points, major flows, and reading paths."}
          </p>
        </Link>

        <Link className="card dashboard-path-card" href={"/dashboard/syncs" as Route}>
          <p className="eyebrow">Track readiness</p>
          <h3>Sync progress</h3>
          <p>Check whether repository context is ready before deeper onboarding work begins.</p>
        </Link>
      </section>

      <section className="dashboard-notes">
        <article className="card dashboard-note-card">
          <p className="eyebrow">Recommended reads</p>
          <ul className="bullet-list">
            {architecture?.recommendedReads?.length ? (
              architecture.recommendedReads.slice(0, 4).map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>Reading suggestions will appear after architecture analysis completes.</li>
            )}
          </ul>
        </article>

        <article className="card dashboard-note-card">
          <p className="eyebrow">Quick context</p>
          <div className="dashboard-facts">
            <div>
              <span>Branch</span>
              <strong>{activeRepository?.defaultBranch ?? "Not available"}</strong>
            </div>
            <div>
              <span>Visibility</span>
              <strong>{activeRepository?.visibility ?? "Not available"}</strong>
            </div>
            <div>
              <span>Last indexed</span>
              <strong>
                {activeRepository?.lastIndexedAt
                  ? formatDateLabel(activeRepository.lastIndexedAt)
                  : "Not indexed yet"}
              </strong>
            </div>
            <div>
              <span>Connected repos</span>
              <strong>{repositories.length}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
