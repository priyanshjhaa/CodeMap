import Link from "next/link";
import type { Route } from "next";

interface StepItem {
  href: Route;
  title: string;
  body: string;
  status: "current" | "upcoming" | "complete";
}

export function OnboardingSteps({
  currentTitle,
  children,
  steps
}: {
  currentTitle: string;
  children: React.ReactNode;
  steps: StepItem[];
}) {
  return (
    <main className="onboarding-shell">
      <aside className="card stepper-card">
        <p className="eyebrow">Getting your first repository ready</p>
        <h1>{currentTitle}</h1>
        <div className="step-list">
          {steps.map((step, index) => (
            <Link key={step.title} className={`step-item step-item--${step.status}`} href={step.href}>
              <span className="step-index">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </aside>
      <section className="onboarding-content">{children}</section>
    </main>
  );
}
