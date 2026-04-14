const features = [
  {
    title: "Guided onboarding",
    body: "Move from GitHub connect to first sync to useful questions without relying on a teammate to narrate the codebase."
  },
  {
    title: "Cited repository chat",
    body: "Ask where auth, billing, tests, or background jobs live and get answers grounded in files and symbols."
  },
  {
    title: "Architecture overviews",
    body: "Understand layers, entry points, and important flows through summaries and generated diagrams."
  },
  {
    title: "Operational confidence",
    body: "See sync progress, readiness states, failed runs, and which repositories need attention."
  }
];

export function MarketingSections() {
  return (
    <>
      <section className="feature-showcase">
        <div className="section-heading">
          <p className="eyebrow">What the frontend now covers</p>
          <h2>A complete product journey, built before backend switch-on.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="card feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="narrative-grid">
        <article className="card narrative-card">
          <p className="eyebrow">For new engineers</p>
          <h3>See where to start</h3>
          <p>
            The interface guides someone from “I just opened this repo” to a shortlist of entry
            points, service layers, and high-signal modules worth reading.
          </p>
        </article>
        <article className="card narrative-card">
          <p className="eyebrow">For managers</p>
          <h3>Standardize knowledge transfer</h3>
          <p>
            Replace inconsistent verbal walkthroughs with a product surface that shows sync health,
            starter prompts, and repository-specific context.
          </p>
        </article>
      </section>
    </>
  );
}
