import Link from "next/link";
import "../demo.css";

export default function DemoPage() {
  return (
    <main className="demo-page">
      <div className="demo-bg-gradient-2"></div>
      {/* Navigation */}
      <nav className="demo-navbar">
        <div className="demo-navbar-container">
          <Link href="/" className="demo-logo">
            CodeMap
          </Link>
          <Link href="/login" className="demo-back-button">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="demo-hero">
        <div className="demo-hero-container">
          <div className="demo-badge">
            <span className="demo-badge-dot"></span>
            Product Demo
          </div>
          <h1 className="demo-title">
            See How CodeMap Transforms Your Development Workflow
          </h1>
          <p className="demo-description">
            An interactive walkthrough of CodeMap's core features and capabilities
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="demo-section">
        <div className="demo-container">
          <div className="demo-section-header">
            <h2 className="demo-section-title">How CodeMap Works</h2>
            <p className="demo-section-subtitle">
              A simple three-step process to transform your codebase into an intelligent, searchable knowledge base
            </p>
          </div>

          <div className="demo-steps">
            <div className="demo-step">
              <div className="demo-step-number">1</div>
              <div className="demo-step-content">
                <h3>Connect Your Repository</h3>
                <p>
                  Connect a GitHub repository with a guided onboarding flow.
                  CodeMap prepares the selected codebase for indexing and cited chat.
                </p>
                <ul className="demo-feature-list">
                  <li>✓ GitHub-first repository connection</li>
                  <li>✓ OAuth authentication for secure access</li>
                  <li>✓ Single-repository onboarding for the MVP</li>
                </ul>
              </div>
            </div>

            <div className="demo-step">
              <div className="demo-step-number">2</div>
              <div className="demo-step-content">
                <h3>AI-Powered Analysis</h3>
                <p>
                  CodeMap indexes TS/JS-first repositories, extracts useful file context,
                  and prepares lightweight architecture summaries.
                </p>
                <ul className="demo-feature-list">
                  <li>✓ Tracks entry points and module relationships</li>
                  <li>✓ Stores chunks for retrieval-backed answers</li>
                  <li>✓ Shows sync readiness and failure states</li>
                  <li>✓ Generates onboarding-oriented architecture notes</li>
                </ul>
              </div>
            </div>

            <div className="demo-step">
              <div className="demo-step-number">3</div>
              <div className="demo-step-content">
                <h3>Chat With Your Code</h3>
                <p>
                  Ask questions in natural language and get accurate, context-aware answers
                  grounded in your actual codebase. No more grep searches or manual code tracing.
                </p>
                <ul className="demo-feature-list">
                  <li>✓ Semantic code search</li>
                  <li>✓ Natural language queries</li>
                  <li>✓ Citations with files, symbols, and line ranges</li>
                  <li>✓ Onboarding guides for new developers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="demo-section demo-section-alt">
        <div className="demo-container">
          <div className="demo-section-header">
            <h2 className="demo-section-title">Key Features</h2>
            <p className="demo-section-subtitle">
              Powerful capabilities designed for modern development teams
            </p>
          </div>

          <div className="demo-features-grid">
            <div className="demo-feature-card">
              <h3>Semantic Search</h3>
              <p>
                Find code by intent, not just keywords. Search for "authentication logic"
                and get relevant files, symbols, and citations.
              </p>
            </div>

            <div className="demo-feature-card">
              <h3>Architecture Visualization</h3>
              <p>
                Lightweight diagrams and summaries showing entry points, modules,
                and major repository flows.
              </p>
            </div>

            <div className="demo-feature-card">
              <h3>AI-Powered Insights</h3>
              <p>
                Get onboarding-focused explanations grounded in indexed repository context.
              </p>
            </div>

            <div className="demo-feature-card">
              <h3>Cited Answers</h3>
              <p>
                Answers point back to relevant files, symbols, line ranges,
                and source snippets so users can verify the context.
              </p>
            </div>

            <div className="demo-feature-card">
              <h3>Smart Onboarding</h3>
              <p>
                New team members can quickly understand codebases through interactive
                guides and contextual explanations.
              </p>
            </div>

            <div className="demo-feature-card">
              <h3>Sync Visibility</h3>
              <p>
                See when repositories are ready, indexing, failed, or waiting for
                access repair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="demo-section">
        <div className="demo-container">
          <div className="demo-section-header">
            <h2 className="demo-section-title">Use Cases</h2>
            <p className="demo-section-subtitle">
              How teams use CodeMap to ship faster
            </p>
          </div>

          <div className="demo-use-cases">
            <div className="demo-use-case">
              <h3>Speed Up Onboarding</h3>
              <p>
                New developers can understand your codebase in days instead of weeks.
                CodeMap provides context-aware explanations and interactive exploration
                tools that accelerate learning.
              </p>
            </div>

            <div className="demo-use-case">
              <h3>Knowledge Sharing</h3>
              <p>
                Capture institutional knowledge in a searchable format. Find answers
                to "how does this work?" questions instantly without disturbing colleagues.
              </p>
            </div>

            <div className="demo-use-case">
              <h3>Legacy Code</h3>
              <p>
                Build a starting map for older repositories with entry points,
                important modules, and cited explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="demo-cta-section">
        <div className="demo-cta-container">
          <h2 className="demo-cta-title">Ready to Transform Your Workflow?</h2>
          <p className="demo-cta-description">
            Join thousands of developers who ship faster with CodeMap
          </p>
          <div className="demo-cta-actions">
            <Link href="/login" className="demo-button demo-button-primary">
              Get Started Free
            </Link>
            <Link href="/login" className="demo-button demo-button-secondary">
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="demo-footer">
        <div className="demo-footer-container">
          <p>&copy; 2024 CodeMap. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
