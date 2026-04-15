"use client";

import Link from "next/link";

export function AuthCard() {
  const handleGitHubSignIn = () => {
    // Redirect to the NextAuth sign-in handler
    window.location.href = "/api/auth/signin?provider=github&callbackUrl=%2Fonboarding%2Fworkspace";
  };

  return (
    <div className="auth-card card">
      <p className="eyebrow">Sign in to CodeMap</p>
      <h1>Welcome back to CodeMap.</h1>
      <p>
        Connect your GitHub account to start analyzing your repositories with AI-powered insights.
      </p>

      <div className="stack-list">
        <div className="inline-stat">
          <strong>GitHub OAuth</strong>
          <span>Secure authentication with your GitHub account</span>
        </div>
        <div className="inline-stat">
          <strong>Workspace onboarding</strong>
          <span>Guided setup with repo connection and first sync preview</span>
        </div>
      </div>

      <div className="button-row">
        <button className="button" onClick={handleGitHubSignIn}>
          Continue with GitHub
        </button>
        <Link className="button button--secondary" href="/">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
