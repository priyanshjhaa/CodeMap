"use client";

import { useProduct } from "./product-provider";
import { formatDateLabel } from "../lib/format";

export function SyncsWorkspace() {
  const { activeRepository, syncProgress } = useProduct();

  return (
    <div className="content-stack">
      <section className="two-column-layout">
        <article className="card">
          <p className="eyebrow">Current status</p>
          <h2>{syncProgress?.stageLabel ?? "No sync in progress"}</h2>
          <p>
            {syncProgress?.currentStep ??
              "Start a sync to see indexing progress, stage transitions, and processing status here."}
          </p>
          <div className="meter">
            <span style={{ width: `${syncProgress?.percentComplete ?? 0}%` }} />
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">What happens in indexing</p>
          <ul className="bullet-list">
            {(syncProgress?.steps ?? [
              "Repository connection",
              "Repository fetch",
              "Code processing",
              "Overview generation"
            ]).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">Recent sync runs</p>
        <h3>Repository sync history</h3>
        <div className="sync-list">
          {activeRepository?.syncHistory.length ? (
            activeRepository.syncHistory.map((sync) => (
              <article key={sync.id} className="sync-item">
                <div>
                  <strong>{sync.id}</strong>
                  <p className={sync.status === "failed" ? "form-error" : undefined}>
                    {sync.status === "failed" && sync.summary?.error
                      ? sync.summary.error
                      : sync.summary
                        ? `${sync.summary.filesIndexed} files · ${sync.summary.chunksCreated} chunks`
                        : "No summary available"}
                  </p>
                </div>
                <div>
                  <span className={`status-pill status-pill--${sync.status}`}>{sync.status}</span>
                  <p>{formatDateLabel(sync.completedAt ?? sync.startedAt)}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-note">Sync history will appear once the repository has been processed.</p>
          )}
        </div>
      </section>
    </div>
  );
}
