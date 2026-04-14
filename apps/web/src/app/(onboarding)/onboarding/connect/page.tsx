import type { Route } from "next";
import { repositories } from "../../../../lib/mock-data";
import { OnboardingSteps } from "../../../../components/onboarding-steps";
import { RepositoryConnectList } from "../../../../components/repository-connect-list";

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
    status: "current" as const
  },
  {
    href: "/onboarding/sync" as Route,
    title: "Run first sync",
    body: "Parse code, build retrieval context, and generate repository insights.",
    status: "upcoming" as const
  }
];

export default function ConnectPage() {
  return (
    <OnboardingSteps currentTitle="Choose the first repository CodeMap should make understandable." steps={steps}>
      <div className="card onboarding-card">
        <p className="eyebrow">GitHub connect</p>
        <h2>Curated repository selection</h2>
        <p>
          This mocked flow shows a filtered, guided repository picker instead of a generic table. It
          keeps the first-run experience approachable while still feeling operational.
        </p>
      </div>
      <RepositoryConnectList repositories={repositories} />
    </OnboardingSteps>
  );
}
