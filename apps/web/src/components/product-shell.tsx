"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useDeferredValue } from "react";
import { useProduct } from "./product-provider";

const navItems = [
  { href: "/dashboard" as Route, label: "Dashboard" },
  { href: "/dashboard/chat" as Route, label: "Chat" },
  { href: "/dashboard/architecture" as Route, label: "Architecture" },
  { href: "/dashboard/syncs" as Route, label: "Syncs" }
];

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    appReady,
    pending,
    repositories,
    activeRepoId,
    activeRepository,
    workspace,
    user,
    setActiveRepo,
    triggerSync
  } = useProduct();
  const deferredRepoId = useDeferredValue(activeRepoId);

  return (
    <div className="app-shell">
      <aside className="app-sidebar card">
        <div className="sidebar-brand">
          <p className="eyebrow">CodeMap</p>
          <h2>{workspace?.name ?? "Loading workspace"}</h2>
          <p>{workspace ? `${workspace.teamSize} teammates using repository onboarding` : "Setting up your workspace view"}</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} className={`nav-link ${active ? "nav-link--active" : ""}`} href={item.href}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-section">
          <p className="eyebrow">Repositories</p>
          <div className="repo-switcher">
            {repositories.map((repository) => (
              <button
                key={repository.id}
                className={`repo-switch ${deferredRepoId === repository.id ? "repo-switch--active" : ""}`}
                type="button"
                onClick={() => setActiveRepo(repository.id)}
              >
                <strong>{repository.name}</strong>
                <span>{repository.health.replace("_", " ")}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section sidebar-section--user">
          <div className="avatar">{user?.avatarLabel ?? "CM"}</div>
          <div>
            <strong>{user?.name ?? "Loading user"}</strong>
            <span>{user?.role ?? "Preparing workspace"}</span>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header card">
          <div>
            <p className="eyebrow">Active repository</p>
            <h1>{activeRepository ? `${activeRepository.owner}/${activeRepository.name}` : "Loading repository"}</h1>
            <p>{activeRepository?.description ?? "Fetching repository context and onboarding insights."}</p>
          </div>
          <div className="header-actions">
            <span className={`status-pill status-pill--${activeRepository?.syncStatus ?? "indexing"}`}>
              {activeRepository?.syncStatus ?? "loading"}
            </span>
            <button className="button button--secondary" type="button" onClick={() => void triggerSync()}>
              Re-sync repository
            </button>
          </div>
        </header>

        {!appReady || pending ? (
          <section className="card loading-card">
            <p className="eyebrow">Refreshing product state</p>
            <h2>Bringing your repository context into view.</h2>
            <div className="loading-bar">
              <span />
            </div>
          </section>
        ) : null}

        {children}
      </div>
    </div>
  );
}
