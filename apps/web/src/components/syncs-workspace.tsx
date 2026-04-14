"use client";

import { useProduct } from "./product-provider";
import { formatDateLabel } from "../lib/format";

export function SyncsWorkspace() {
  const { activeRepository, syncProgress } = useProduct();

  if (!activeRepository || !syncProgress) {
    return null;
  }

  return (
    <div className="content-stack">
      <section className="two-column-layout">
        <article className="card">
          <p className="eyebrow">Current status</p>
          <h2>{syncProgress.stageLabel}</h2>
          <p>{syncProgress.currentStep}</p>
          <div className="meter">
            <span style={{ width: `${syncProgress.percentComplete}%` }} />
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">What happens in indexing</p>
          <ul className="bullet-list">
            {syncProgress.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">Recent sync runs</p>
        <h3>Repository sync history</h3>
        <div className="sync-list">
          {activeRepository.syncHistory.map((sync) => (
            <article key={sync.id} className="sync-item">
              <div>
                <strong>{sync.id}</strong>
                <p>{sync.summary ? `${sync.summary.filesIndexed} files · ${sync.summary.chunksCreated} chunks` : "No summary available"}</p>
              </div>
              <div>
                <span className={`status-pill status-pill--${sync.status}`}>{sync.status}</span>
                <p>{formatDateLabel(sync.completedAt ?? sync.startedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
