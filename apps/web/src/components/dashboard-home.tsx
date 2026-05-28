"use client";

import Link from "next/link";
import type { Route } from "next";
import { useProduct } from "./product-provider";
import { formatDateLabel } from "../lib/format";

export function DashboardHome() {
  const { activeRepository, syncProgress, architecture, repositories } = useProduct();

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
      <section className="hero-grid">
        <article className="card summary-card">
          <p className="eyebrow">Repository snapshot</p>
          <h2>{activeRepository?.name ?? "Repository overview"}</h2>
          <p>
            {activeRepository?.description ??
              "Repository metadata will appear here once the overview endpoint is available."}
          </p>
          <div className="stats-grid stats-grid--three">
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
          </div>
        </article>

        <article className="card progress-card">
          <p className="eyebrow">Sync readiness</p>
          <h2>{syncProgress?.stageLabel ?? "Waiting for sync status"}</h2>
          <p>
            {syncProgress?.currentStep ??
              "Trigger a repository sync to populate indexing progress and repository health."}
          </p>
          <div className="meter">
            <span style={{ width: `${syncProgress?.percentComplete ?? 0}%` }} />
          </div>
          <div className="step-pill-row">
            {(syncProgress?.steps ?? ["Repository connected", "Sync queued", "Analysis available"]).map(
              (step) => (
                <span key={step} className="step-pill">
                  {step}
                </span>
              )
            )}
          </div>
        </article>
      </section>

      <section className="two-column-layout">
        <article className="card">
          <p className="eyebrow">Chat workspace</p>
          <h3>Start repository Q&amp;A</h3>
          <p>
            Use chat to ask about modules, flows, ownership boundaries, and files that matter for
            onboarding.
          </p>
          <div className="starter-list">
            <Link className="starter-chip" href={"/dashboard/chat" as Route}>
              Open repository chat
            </Link>
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">Architecture snapshot</p>
          <h3>
            {architecture
              ? architecture.readiness === "complete"
                ? "Architecture overview ready"
                : "Architecture analysis in progress"
              : "Architecture analysis unavailable"}
          </h3>
          <p>
            {architecture?.summary ??
              "This area will summarize entry points, major flows, and recommended reads once the backend overview is connected."}
          </p>
          <Link className="text-link text-link--prominent" href="/dashboard/architecture">
            Open full architecture view
          </Link>
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">Workspace structure</p>
        <h3>Core product surfaces</h3>
        <div className="feature-grid">
          <Link className="subtle-card" href={"/dashboard" as Route}>
            <strong>Dashboard</strong>
            <p>Repository metadata, sync readiness, and the current state of the workspace.</p>
          </Link>
          <Link className="subtle-card" href={"/dashboard/chat" as Route}>
            <strong>Chat</strong>
            <p>Question-answer workflows tied to the selected repository.</p>
          </Link>
          <Link className="subtle-card" href={"/dashboard/architecture" as Route}>
            <strong>Architecture</strong>
            <p>System map, entry points, and generated overview content.</p>
          </Link>
          <Link className="subtle-card" href={"/dashboard/syncs" as Route}>
            <strong>Syncs</strong>
            <p>Indexing runs, status transitions, and repository processing history.</p>
          </Link>
        </div>
      </section>

      <section className="two-column-layout">
        <article className="card">
          <p className="eyebrow">Recommended reads</p>
          <ul className="bullet-list">
            {architecture?.recommendedReads?.length ? (
              architecture.recommendedReads.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>Recommended reads will appear after architecture analysis completes.</li>
            )}
          </ul>
        </article>
        <article className="card">
          <p className="eyebrow">Repository coverage</p>
          <ul className="bullet-list">
            <li>{repositories.length} repository record(s) are currently connected to this workspace.</li>
            <li>
              {syncProgress
                ? `Current sync state: ${syncProgress.state.replace("_", " ")}.`
                : "Sync status has not been loaded yet."}
            </li>
            <li>
              {activeRepository
                ? `Selected repository: ${activeRepository.owner}/${activeRepository.name}.`
                : "Select a repository to load details."}
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
