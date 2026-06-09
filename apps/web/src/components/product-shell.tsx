"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useProduct } from "./product-provider";
import { signOutFromCodeMap } from "../lib/actions";

const navItems = [
  { href: "/dashboard" as Route, label: "Overview", marker: "01" },
  { href: "/dashboard/chat" as Route, label: "Chat", marker: "02" },
  { href: "/dashboard/architecture" as Route, label: "Architecture", marker: "03" },
  { href: "/dashboard/syncs" as Route, label: "Syncs", marker: "04" }
];

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    appReady,
    pending,
    bootstrapError,
    repositoryError,
    repositories,
    activeRepoId,
    activeRepository,
    workspace,
    user,
    setActiveRepo,
    triggerSync
  } = useProduct();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <Link href="/" className="sidebar-brand__mark" aria-label="CodeMap home">
            <span>{`</>`}</span>
          </Link>
          <div>
            <p className="eyebrow">CodeMap</p>
            <h2>{workspace?.name ?? "Loading workspace"}</h2>
          </div>
          <p>
            {workspace
              ? `${workspace.teamSize} teammates`
              : "Setting up your workspace view"}
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Product navigation">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} className={`nav-link ${active ? "nav-link--active" : ""}`} href={item.href}>
                <span className="nav-link__marker">{item.marker}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-section">
          <p className="eyebrow">Repositories</p>
          <div className="repo-switcher">
            {repositories.length ? (
              repositories.map((repository) => (
                <button
                  key={repository.id}
                  className={`repo-switch ${activeRepoId === repository.id ? "repo-switch--active" : ""}`}
                  type="button"
                  onClick={() => setActiveRepo(repository.id)}
                >
                  <span className="repo-switch__dot" aria-hidden="true" />
                  <span className="repo-switch__copy">
                    <strong>{repository.name}</strong>
                    <span>{repository.health.replace("_", " ")}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="empty-note">No repositories available yet.</p>
            )}
          </div>
        </div>

        <div className="sidebar-section sidebar-section--user">
          <div className="avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name ? `${user.name} avatar` : "User avatar"} />
            ) : (
              user?.avatarLabel ?? "CM"
            )}
          </div>
          <div>
            <strong>{user?.name ?? "Loading user"}</strong>
            <span>{user?.role ?? "Preparing workspace"}</span>
          </div>
        </div>

        <form action={signOutFromCodeMap} className="sidebar-signout">
          <button className="button button--secondary button--full" type="submit">
            Sign out
          </button>
        </form>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="app-header__copy">
            <p className="app-breadcrumb">
              {workspace?.name ?? "Workspace"} <span>/</span> Current repository
            </p>
            <h1>
              {activeRepository
                ? `${activeRepository.owner}/${activeRepository.name}`
                : "No repository selected"}
            </h1>
            <p>
              {activeRepository?.description ??
                "Connect a repository to populate dashboard, chat, and architecture data."}
            </p>
          </div>
          <div className="header-actions">
            <span
              className={`status-pill status-pill--${activeRepository?.syncStatus ?? "indexing"}`}
            >
              {activeRepository?.syncStatus ?? "loading"}
            </span>
            <button
              className="button button--secondary"
              type="button"
              disabled={!activeRepoId || pending}
              onClick={() => void triggerSync()}
            >
              Re-sync repository
            </button>
          </div>
        </header>

        {!appReady ? (
          <section className="card loading-card">
            <p className="eyebrow">Refreshing product state</p>
            <h2>Bringing your repository context into view.</h2>
            <div className="loading-bar">
              <span />
            </div>
          </section>
        ) : null}

        {bootstrapError ? (
          <section className="card">
            <p className="eyebrow">Workspace status</p>
            <h2>We could not load your workspace yet.</h2>
            <p>{bootstrapError}</p>
          </section>
        ) : null}

        {repositoryError ? (
          <section className="card">
            <p className="eyebrow">Repository status</p>
            <h2>Repository data is partially unavailable.</h2>
            <p>{repositoryError}</p>
          </section>
        ) : null}

        {children}
      </div>
    </div>
  );
}
