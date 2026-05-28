"use client";

import Link from "next/link";
import { signInWithGitHub } from "../lib/actions";

type AuthCardProps = {
  githubEnabled: boolean;
};

export function AuthCard({ githubEnabled }: AuthCardProps) {
  const handleGitHubSignIn = async () => {
    if (!githubEnabled) {
      return;
    }

    await signInWithGitHub();
  };

  return (
    <div className="auth-card card">
      <p className="eyebrow">Sign in to CodeMap</p>
      <h1>Welcome back to CodeMap.</h1>
      <p>
        Connect your GitHub account to start analyzing your repositories with AI-powered insights.
      </p>

      {!githubEnabled ? (
        <p className="form-error">
          GitHub OAuth is not configured yet. Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and
          `NEXTAUTH_SECRET` to enable sign-in.
        </p>
      ) : null}

      <div className="stack-list">
        <div className="inline-stat">
          <strong>GitHub OAuth</strong>
          <span>
            {githubEnabled ? "Secure authentication with your GitHub account" : "Waiting for OAuth configuration"}
          </span>
        </div>
        <div className="inline-stat">
          <strong>Workspace onboarding</strong>
          <span>Guided setup with repo connection and first sync preview</span>
        </div>
      </div>

      <div className="button-row">
        {githubEnabled ? (
          <button className="button" onClick={handleGitHubSignIn}>
            Continue with GitHub
          </button>
        ) : null}
        <Link className="button button--secondary" href="/">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
