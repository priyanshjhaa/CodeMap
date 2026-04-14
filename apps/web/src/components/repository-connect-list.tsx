import Link from "next/link";
import type { RepositoryListItem } from "@codemap/shared";

export function RepositoryConnectList({ repositories }: { repositories: RepositoryListItem[] }) {
  return (
    <div className="repo-picker-grid">
      {repositories.map((repository) => (
        <article key={repository.id} className="card repo-card">
          <div className="repo-card__top">
            <div>
              <p className="eyebrow">{repository.visibility} repository</p>
              <h3>{repository.owner}/{repository.name}</h3>
            </div>
            <span className={`status-pill status-pill--${repository.health}`}>
              {repository.health.replace("_", " ")}
            </span>
          </div>
          <p>{repository.description}</p>
          <div className="mini-meta">
            <span>{repository.language}</span>
            <span>{repository.fileCount} files</span>
            <span>{repository.lastActivity}</span>
          </div>
          <div className="button-row">
            <Link className="button" href={`/onboarding/sync?repo=${repository.id}`}>
              Select repository
            </Link>
            <button className="button button--secondary" type="button">
              Preview index plan
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
