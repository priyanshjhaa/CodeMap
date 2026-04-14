import type { PropsWithChildren } from "react";

export function Panel({
  title,
  description,
  children
}: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
