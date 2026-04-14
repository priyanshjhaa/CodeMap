import Link from "next/link";
import type { Route } from "next";
import { syncProgressViews } from "../../../../lib/mock-data";
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
    status: "complete" as const
  },
  {
    href: "/onboarding/connect" as Route,
    title: "Connect GitHub",
    body: "Select the repositories you want to make legible first.",
    status: "complete" as const
  },
  {
    href: "/onboarding/sync" as Route,
    title: "Run first sync",
    body: "Parse code, build retrieval context, and generate repository insights.",
    status: "current" as const
  }
];

const sync = syncProgressViews.repo_2;

export default function SyncPage() {
  return (
    <OnboardingSteps currentTitle="Show first-sync progress before the user lands in the product." steps={steps}>
      <div className="card onboarding-card">
        <p className="eyebrow">Repository sync</p>
        <h2>{sync.stageLabel}</h2>
        <p>{sync.currentStep}</p>
        <div className="meter">
          <span style={{ width: `${sync.percentComplete}%` }} />
        </div>
        <div className="step-pill-row">
          {sync.steps.map((step) => (
            <span key={step} className="step-pill">
              {step}
            </span>
          ))}
        </div>
        <div className="button-row">
          <Link className="button" href="/dashboard">
            Open the product dashboard
          </Link>
          <Link className="button button--secondary" href="/onboarding/connect">
            Choose a different repository
          </Link>
        </div>
      </div>
    </OnboardingSteps>
  );
}
