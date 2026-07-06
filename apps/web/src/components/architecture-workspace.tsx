"use client";

import { useProduct } from "./product-provider";

export function ArchitectureWorkspace() {
  const { architecture } = useProduct();
  const readiness = architecture?.readiness ?? "pending";
  const moduleCount = architecture?.moduleNodes.length ?? 0;
  const edgeCount = architecture?.moduleEdges.length ?? 0;
  const sectionCount = architecture?.sections.length ?? 0;

  return (
    <div className="architecture-product">
      <section className="architecture-hero">
        <article className="architecture-hero__copy">
          <p className="eyebrow">Architecture overview</p>
          <h2>
            {architecture
              ? architecture.readiness === "complete"
                ? "Repository map is ready"
                : "Architecture signal is still developing"
              : "Architecture overview is not available yet"}
          </h2>
          <p>
            {architecture?.summary ??
              "This page is ready for real architecture data. Connect the overview endpoint to populate system summaries, flows, and reading paths."}
          </p>
          <span
            className={`status-pill status-pill--${
              architecture
                ? architecture.readiness === "complete"
                  ? "ready"
                  : architecture.readiness === "partial"
                    ? "indexing"
                    : "failed"
                : "indexing"
            }`}
          >
            {readiness}
          </span>
        </article>

        <article className="architecture-scorecard">
          <div>
            <span>Modules</span>
            <strong>{moduleCount}</strong>
          </div>
          <div>
            <span>Relationships</span>
            <strong>{edgeCount}</strong>
          </div>
          <div>
            <span>Insight sections</span>
            <strong>{sectionCount}</strong>
          </div>
        </article>
      </section>

      <section className="architecture-board">
        <article className="architecture-card architecture-card--reads">
          <div className="architecture-card__heading">
            <p className="eyebrow">Read first</p>
            <h3>Important files</h3>
          </div>
          <div className="architecture-read-stack">
            {architecture?.recommendedReads.length ? (
              architecture.recommendedReads.slice(0, 6).map((item, index) => (
                <div key={item} className="architecture-read" title={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item}</strong>
                </div>
              ))
            ) : (
              <p className="empty-note">Recommended reads will appear after architecture analysis is available.</p>
            )}
          </div>
        </article>

        <article className="architecture-card">
          <div className="architecture-card__heading">
            <p className="eyebrow">Entry points</p>
            <h3>Where execution starts</h3>
          </div>
          <ul className="architecture-list">
            {architecture?.entryPoints.length ? architecture.entryPoints.map((item) => <li key={item} title={item}>{item}</li>) : <li>No entry points available yet.</li>}
          </ul>
        </article>

        <article className="architecture-card">
          <div className="architecture-card__heading">
            <p className="eyebrow">Major flows</p>
            <h3>Likely paths through the app</h3>
          </div>
          <ul className="architecture-list">
            {architecture?.majorFlows.length ? architecture.majorFlows.map((item) => <li key={item} title={item}>{item}</li>) : <li>Major flow analysis is not available yet.</li>}
          </ul>
        </article>
      </section>

      {architecture?.sections.length ? (
        <section className="architecture-section-grid">
          {architecture.sections.map((section) => (
            <article key={section.title} className="architecture-card architecture-card--section">
              <p className="eyebrow">{section.title}</p>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              <ul className="architecture-list">
                {section.bullets.map((item) => (
                  <li key={item} title={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}

      <section className="architecture-diagram-panel">
        <div className="architecture-card__heading">
          <div>
            <p className="eyebrow">Diagram preview</p>
            <h3>Generated repository map</h3>
          </div>
          <span>{edgeCount} edges detected</span>
        </div>
        <pre className="diagram-block architecture-diagram">
{architecture?.diagram ?? "Architecture diagram output will render here when the backend provides it."}
        </pre>
      </section>
    </div>
  );
}
