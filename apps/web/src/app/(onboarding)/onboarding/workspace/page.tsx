"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingSteps } from "../../../../components/onboarding-steps";
import { createWorkspace } from "../../../../lib/api-client";

const steps: {
  href: Route;
  title: string;
  body: string;
  status: "current" | "upcoming" | "complete";
}[] = [
  {
    href: "/onboarding/workspace" as Route,
    title: "Create your workspace",
    body: "Choose the team context CodeMap should organize around.",
    status: "current" as const
  },
  {
    href: "/onboarding/connect" as Route,
    title: "Connect GitHub",
    body: "Select the repositories you want to make legible first.",
    status: "upcoming" as const
  },
  {
    href: "/onboarding/sync" as Route,
    title: "Run first sync",
    body: "Parse code, build retrieval context, and generate repository insights.",
    status: "upcoming" as const
  }
];

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("Acme Engineering");
  const [teamSize, setTeamSize] = useState("11-50");
  const [goal, setGoal] = useState("onboarding");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!workspaceName.trim()) {
      setError("Add a workspace name to continue.");
      return;
    }

    setPending(true);

    try {
      await createWorkspace({
        name: workspaceName.trim(),
        teamSize,
        goal
      });
      router.push("/onboarding/connect");
    } catch {
      setError("Could not create the workspace. Try again in a moment.");
      setPending(false);
    }
  }

  return (
    <OnboardingSteps currentTitle="Create a workspace that feels ready for real team onboarding." steps={steps}>
      <form className="card onboarding-card" onSubmit={onSubmit}>
        <div className="onboarding-header">
          <span className="eyebrow">Step 1 of 3</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "33%" }}></div>
          </div>
        </div>

        <h2>Set up your workspace</h2>
        <p className="onboarding-lead">
          Configure your team context and preferences. This helps CodeMap organize insights and provide relevant recommendations.
        </p>

        <div className="onboarding-form">
          <div className="form-group">
            <label htmlFor="workspace-name">Workspace name</label>
            <input
              type="text"
              id="workspace-name"
              placeholder="e.g., Acme Engineering"
              value={workspaceName}
              className="form-input"
              onChange={(event) => setWorkspaceName(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="team-size">Team size</label>
            <select
              id="team-size"
              className="form-input"
              value={teamSize}
              onChange={(event) => setTeamSize(event.target.value)}
            >
              <option value="1-10">1-10 engineers</option>
              <option value="11-50">11-50 engineers</option>
              <option value="51-200">51-200 engineers</option>
              <option value="200+">200+ engineers</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="goal">Primary goal</label>
            <select
              id="goal"
              className="form-input"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
            >
              <option value="onboarding">Reduce onboarding time</option>
              <option value="knowledge">Improve knowledge sharing</option>
              <option value="code-review">Speed up code reviews</option>
              <option value="documentation">Better code documentation</option>
            </select>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="button-row">
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Creating workspace..." : "Continue"}
          </button>
          <Link className="button button--secondary" href="/login">
            Back
          </Link>
        </div>

        <div className="onboarding-footer">
          <p className="trust-text">You can update these settings later.</p>
        </div>
      </form>
    </OnboardingSteps>
  );
}
