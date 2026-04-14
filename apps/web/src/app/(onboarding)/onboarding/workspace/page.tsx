import Link from "next/link";
import type { Route } from "next";
import { OnboardingSteps } from "../../../../components/onboarding-steps";

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
  return (
    <OnboardingSteps currentTitle="Create a workspace that feels ready for real team onboarding." steps={steps}>
      <div className="card onboarding-card">
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
              defaultValue="Acme Engineering"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="team-size">Team size</label>
            <select id="team-size" className="form-input" defaultValue="11-50">
              <option value="1-10">1-10 engineers</option>
              <option value="11-50">11-50 engineers</option>
              <option value="51-200">51-200 engineers</option>
              <option value="200+">200+ engineers</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="goal">Primary goal</label>
            <select id="goal" className="form-input">
              <option value="onboarding">Reduce onboarding time</option>
              <option value="knowledge">Improve knowledge sharing</option>
              <option value="code-review">Speed up code reviews</option>
              <option value="documentation">Better code documentation</option>
            </select>
          </div>
        </div>

        <div className="button-row">
          <Link className="button" href="/onboarding/connect">
            Continue
          </Link>
          <Link className="button button--secondary" href="/login">
            Back
          </Link>
        </div>

        <div className="onboarding-footer">
          <p className="trust-text">
            ✓ You can update these settings later
          </p>
        </div>
      </div>
    </OnboardingSteps>
  );
}
