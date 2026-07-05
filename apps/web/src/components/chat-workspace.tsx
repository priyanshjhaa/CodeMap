"use client";

import { useState } from "react";
import { useProduct } from "./product-provider";

const STARTER_PROMPTS = [
  "Where should I start reading this repository?",
  "What are the main request flows?",
  "Which files define the data layer?",
  "Where is GitHub integration handled?"
];

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
  const [draft, setDraft] = useState("");
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const repositoryReady = activeRepository?.syncStatus === "ready";

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
    <div className="chat-product">
      <section className="chat-command-center">
        <div>
          <p className="eyebrow">Repository intelligence</p>
          <h2>Ask precise questions. Get cited answers.</h2>
          <p>
            CodeMap searches the indexed repository, retrieves the closest files and symbols, then
            keeps the response grounded with source citations.
          </p>
        </div>
        <div className="chat-command-center__status">
          <span className={`status-pill status-pill--${activeRepository?.syncStatus ?? "indexing"}`}>
            {activeRepository?.syncStatus ?? "loading"}
          </span>
          <strong>{activeRepository ? `${activeRepository.owner}/${activeRepository.name}` : "No repository selected"}</strong>
        </div>
      </section>

      <div className="chat-layout chat-layout--pro">
        <aside className="chat-sidebar">
        <p className="eyebrow">Threads</p>
        <h2>{activeRepository?.name ?? "Repository chat"}</h2>
        <div className="thread-list">
          {sessions.length ? (
            sessions.map((session) => (
              <button
                key={session.id}
                className={`thread-item ${activeSessionId === session.id ? "thread-item--active" : ""}`}
                type="button"
                onClick={() => setActiveSession(session.id)}
              >
                <strong>{session.title}</strong>
                <span>{session.lastQuestion}</span>
              </button>
            ))
          ) : (
            <p className="empty-note">
              No threads yet. Ask your first repository question to start a focused conversation.
            </p>
          )}
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-main__topbar">
          <div>
            <p className="eyebrow">Repository chat</p>
            <h2>{activeSession?.title ?? "New conversation"}</h2>
          </div>
          <span>{activeSession?.messages.length ?? 0} messages</span>
        </div>

        <div className="starter-list starter-list--chat">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="starter-chip"
              type="button"
              onClick={() => setDraft(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="message-list chat-scrollport">
          {!repositoryReady ? (
            <article className="message-bubble message-bubble--assistant">
              <span className="message-role">CodeMap</span>
              <p>
                This repository is not fully indexed yet. You can still ask, but answers may be low-confidence until sync finishes.
              </p>
            </article>
          ) : null}

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

          {!activeSession && !pending ? (
            <article className="message-bubble message-bubble--assistant">
              <span className="message-role">CodeMap</span>
              <p>
                Ask a repository question to start a new thread. Messages and citations will appear
                here once the chat endpoint responds.
              </p>
            </article>
          ) : null}
        </div>

        <form className="chat-form chat-composer" onSubmit={onSubmit}>
          <textarea
            aria-label="Ask a repository question"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about architecture, flows, modules, or where functionality lives."
          />
          <button className="button" disabled={pending} type="submit">
            {pending ? "Thinking..." : "Ask CodeMap"}
          </button>
        </form>
      </section>

      <aside className="citation-rail">
        <p className="eyebrow">Grounding</p>
        <h2>Citations</h2>
        <div className="citation-list">
          {selectedCitations.length ? (
            selectedCitations.map((citation) => (
              <article key={`${citation.filePath}-${citation.symbol ?? "file"}`} className="citation-item">
                <strong>{citation.filePath}</strong>
                <p>{citation.reason}</p>
                <span>
                  {citation.symbol ? `${citation.symbol} · ` : ""}
                  {citation.lineStart ? `L${citation.lineStart}-${citation.lineEnd}` : "File context"}
                </span>
                <pre>{citation.excerpt}</pre>
              </article>
            ))
          ) : (
            <p className="empty-note">
              Source previews appear after CodeMap retrieves repository context for an answer.
            </p>
          )}
        </div>
      </aside>
      </div>
    </div>
  );
}
