"use client";

import Link from "next/link";
import type { Route } from "next";
import { useProduct } from "./product-provider";
import { formatDateLabel } from "../lib/format";

const quickStarts = [
  "Where is authentication implemented?",
  "How does the billing flow work?",
  "What are the main modules in this repository?",
  "Which files should I read first?"
];

const onboardingCards = [
  {
    title: "Auth and sessions",
    body: "Start with the route registry, then read the auth service and session repository.",
    href: "/dashboard/chat" as Route
  },
  {
    title: "Billing orchestration",
    body: "Understand provider adapters and how orchestration services fan out into retries and settlement.",
    href: "/dashboard/architecture" as Route
  },
  {
    title: "Entry points",
    body: "Use the architecture view to see routes, services, jobs, and recommended read order.",
    href: "/dashboard/architecture" as Route
  },
  {
    title: "Indexing health",
    body: "See recent sync runs, repository readiness, and what changed between snapshots.",
    href: "/dashboard/syncs" as Route
  }
];

export function DashboardHome() {
  const { activeRepository, syncProgress, architecture } = useProduct();

  if (!activeRepository || !syncProgress || !architecture) {
    return null;
  }

  return (
    <div className="content-stack">
      <section className="hero-grid">
        <article className="card summary-card">
          <p className="eyebrow">Repository snapshot</p>
          <h2>{activeRepository.name}</h2>
          <p>{activeRepository.description}</p>
          <div className="stats-grid stats-grid--three">
            <div>
              <span>Branch</span>
              <strong>{activeRepository.defaultBranch}</strong>
            </div>
            <div>
              <span>Visibility</span>
              <strong>{activeRepository.visibility}</strong>
            </div>
            <div>
              <span>Last indexed</span>
              <strong>{formatDateLabel(activeRepository.lastIndexedAt)}</strong>
            </div>
          </div>
        </article>

        <article className="card progress-card">
          <p className="eyebrow">Sync readiness</p>
          <h2>{syncProgress.stageLabel}</h2>
          <p>{syncProgress.currentStep}</p>
          <div className="meter">
            <span style={{ width: `${syncProgress.percentComplete}%` }} />
          </div>
          <div className="step-pill-row">
            {syncProgress.steps.map((step) => (
              <span key={step} className="step-pill">
                {step}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="two-column-layout">
        <article className="card">
          <p className="eyebrow">What to ask first</p>
          <h3>Suggested onboarding prompts</h3>
          <div className="starter-list">
            {quickStarts.map((question) => (
              <Link key={question} className="starter-chip" href="/dashboard/chat">
                {question}
              </Link>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">Architecture snapshot</p>
          <h3>{architecture.readiness === "complete" ? "Architecture overview ready" : "Architecture still maturing"}</h3>
          <p>{architecture.summary}</p>
          <Link className="text-link text-link--prominent" href="/dashboard/architecture">
            Open full architecture view
          </Link>
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">Start here</p>
        <h3>Guided paths for a new engineer</h3>
        <div className="feature-grid">
          {onboardingCards.map((card) => (
            <Link key={card.title} className="subtle-card" href={card.href}>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="two-column-layout">
        <article className="card">
          <p className="eyebrow">Recommended reads</p>
          <ul className="bullet-list">
            {architecture.recommendedReads.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="card">
          <p className="eyebrow">Starter context</p>
          <ul className="bullet-list">
            {activeRepository.starterQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
