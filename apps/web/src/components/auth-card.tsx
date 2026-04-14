import Link from "next/link";

export function AuthCard() {
  return (
    <div className="auth-card card">
      <p className="eyebrow">Mocked sign-in</p>
      <h1>Welcome back to CodeMap.</h1>
      <p>
        This frontend phase keeps sign-in product-focused: show trust, explain the next steps, and
        route the user into workspace setup without waiting on live auth.
      </p>

      <div className="stack-list">
        <div className="inline-stat">
          <strong>GitHub OAuth</strong>
          <span>Ready to wire when backend auth is switched on</span>
        </div>
        <div className="inline-stat">
          <strong>Workspace onboarding</strong>
          <span>Guided next, with repo connection and first sync preview</span>
        </div>
      </div>

      <div className="button-row">
        <Link className="button" href="/onboarding/workspace">
          Continue with GitHub
        </Link>
        <Link className="button button--secondary" href="/">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
