"use client";

import { useProduct } from "./product-provider";

export function ArchitectureWorkspace() {
  const { architecture } = useProduct();

  if (!architecture) {
    return null;
  }

  return (
    <div className="content-stack">
      <section className="hero-grid">
        <article className="card">
          <p className="eyebrow">Architecture overview</p>
          <h2>{architecture.readiness === "complete" ? "Repository map is ready" : "Architecture signal is still developing"}</h2>
          <p>{architecture.summary}</p>
          <span className={`status-pill status-pill--${architecture.readiness === "complete" ? "ready" : architecture.readiness === "partial" ? "indexing" : "failed"}`}>
            {architecture.readiness}
          </span>
        </article>

        <article className="card">
          <p className="eyebrow">Important places to read first</p>
          <ul className="bullet-list">
            {architecture.recommendedReads.length ? (
              architecture.recommendedReads.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>Reconnect the repository or wait for indexing to finish.</li>
            )}
          </ul>
        </article>
      </section>

      <section className="two-column-layout">
        <article className="card">
          <p className="eyebrow">Entry points</p>
          <ul className="bullet-list">
            {architecture.entryPoints.length ? architecture.entryPoints.map((item) => <li key={item}>{item}</li>) : <li>No entry points available yet.</li>}
          </ul>
        </article>

        <article className="card">
          <p className="eyebrow">Major flows</p>
          <ul className="bullet-list">
            {architecture.majorFlows.length ? architecture.majorFlows.map((item) => <li key={item}>{item}</li>) : <li>Major flow analysis is not available yet.</li>}
          </ul>
        </article>
      </section>

      <section className="two-column-layout">
        {architecture.sections.map((section) => (
          <article key={section.title} className="card">
            <p className="eyebrow">{section.title}</p>
            <p>{section.body}</p>
            <ul className="bullet-list">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="card">
        <p className="eyebrow">Diagram preview</p>
        <h3>Generated repository map</h3>
        <pre className="diagram-block">{architecture.diagram}</pre>
      </section>
    </div>
  );
}
