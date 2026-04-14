"use client";

import { useState } from "react";
import { useProduct } from "./product-provider";

export function ChatWorkspace() {
  const {
    sessions,
    activeSessionId,
    setActiveSession,
    askQuestion,
    selectedCitations,
    pending,
    activeRepository
  } = useProduct();
  const [draft, setDraft] = useState("Where is authentication implemented?");
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    await askQuestion(trimmed);
    setDraft("");
  }

  return (
    <div className="chat-layout">
      <aside className="card chat-sidebar">
        <p className="eyebrow">Conversation threads</p>
        <h2>{activeRepository?.name ?? "Repository chat"}</h2>
        <div className="thread-list">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`thread-item ${activeSessionId === session.id ? "thread-item--active" : ""}`}
              type="button"
              onClick={() => setActiveSession(session.id)}
            >
              <strong>{session.title}</strong>
              <span>{session.lastQuestion}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="card chat-main">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Repository chat</p>
            <h2>{activeSession?.title ?? "New conversation"}</h2>
          </div>
          <span className="status-pill status-pill--ready">Mocked live flow</span>
        </div>

        <div className="message-list">
          {activeSession?.messages.map((message) => (
            <article key={message.id} className={`message-bubble message-bubble--${message.role}`}>
              <span className="message-role">{message.role === "user" ? "You" : "CodeMap"}</span>
              <p>{message.content}</p>
              {message.answer ? (
                <div className="answer-metadata">
                  <span>Confidence: {message.answer.confidence}</span>
                  <span>Intent: {message.answer.intent.replace("_", " ")}</span>
                </div>
              ) : null}
            </article>
          ))}

          {pending ? (
            <article className="message-bubble message-bubble--assistant">
              <span className="message-role">CodeMap</span>
              <p>Retrieving the most relevant code context and shaping an onboarding-quality answer.</p>
            </article>
          ) : null}
        </div>

        <div className="starter-list starter-list--chat">
          {activeRepository?.starterQuestions.map((question) => (
            <button key={question} className="starter-chip" type="button" onClick={() => setDraft(question)}>
              {question}
            </button>
          ))}
        </div>

        <form className="chat-form" onSubmit={onSubmit}>
          <textarea
            aria-label="Ask a repository question"
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about architecture, flows, modules, or where functionality lives."
          />
          <button className="button" disabled={pending} type="submit">
            {pending ? "Thinking..." : "Ask CodeMap"}
          </button>
        </form>
      </section>

      <aside className="card citation-rail">
        <p className="eyebrow">Citation previews</p>
        <h2>Why this answer is grounded</h2>
        <div className="citation-list">
          {selectedCitations.map((citation) => (
            <article key={`${citation.filePath}-${citation.symbol ?? "file"}`} className="citation-item">
              <strong>{citation.filePath}</strong>
              <p>{citation.reason}</p>
              <span>
                {citation.symbol ? `${citation.symbol} · ` : ""}
                {citation.lineStart ? `L${citation.lineStart}-${citation.lineEnd}` : "File context"}
              </span>
              <pre>{citation.excerpt}</pre>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
