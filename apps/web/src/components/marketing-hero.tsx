import Link from "next/link";

const proofPoints = [
  "Chat with repository context, not generic guesses.",
  "See architecture, entry points, and module flow before you read every file.",
  "Turn onboarding questions into guided, cited answers in minutes."
];

export function MarketingHero() {
  return (
    <section className="marketing-hero card card--hero">
      <div className="hero-copy">
        <p className="eyebrow">Code understanding for fast-moving teams</p>
        <h1>Make every unfamiliar repository feel legible on day one.</h1>
        <p className="hero-lead">
          CodeMap gives startup teams a warm, guided path into a codebase: architecture snapshots,
          cited chat answers, sync visibility, and the exact places a new engineer should read
          first.
        </p>
        <div className="button-row">
          <Link className="button" href="/login">
            Start the product tour
          </Link>
          <Link className="button button--secondary" href="/dashboard">
            Jump into the app
          </Link>
        </div>
      </div>

      <div className="hero-proof">
        {proofPoints.map((item) => (
          <article key={item} className="proof-card">
            <span className="proof-dot" />
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
