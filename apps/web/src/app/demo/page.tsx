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
                  Link your GitHub, GitLab, or Bitbucket repository with a single click.
                  CodeMap securely accesses your code and begins the indexing process automatically.
                </p>
                <ul className="demo-feature-list">
                  <li>✓ Supports all major Git providers</li>
                  <li>✓ OAuth authentication for secure access</li>
                  <li>✓ Select specific branches or directories</li>
                </ul>
              </div>
            </div>

            <div className="demo-step">
              <div className="demo-step-number">2</div>
              <div className="demo-step-content">
                <h3>AI-Powered Analysis</h3>
                <p>
                  Our advanced AI analyzes your codebase architecture, identifies patterns,
                  and builds a comprehensive knowledge graph of your code structure.
                </p>
                <ul className="demo-feature-list">
                  <li>✓ Understands code relationships and dependencies</li>
                  <li>✓ Identifies design patterns and architecture</li>
                  <li>✓ Maps data flow and function calls</li>
                  <li>✓ Generates contextual documentation</li>
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
                  <li>✓ PR summaries and impact analysis</li>
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
                and get all related functions, classes, and their relationships.
              </p>
            </div>

            <div className="demo-feature-card">
              <h3>Architecture Visualization</h3>
              <p>
                Interactive diagrams showing system architecture, component relationships,
                and data flow. Understand complex systems at a glance.
              </p>
            </div>

            <div className="demo-feature-card">
              <h3>AI-Powered Insights</h3>
              <p>
                Get intelligent suggestions, detect potential issues, and understand
                the impact of changes before you commit.
              </p>
            </div>

            <div className="demo-feature-card">
              <h3>PR Summaries</h3>
              <p>
                Automatically generated pull request summaries with context-aware
                explanations, making code reviews faster and more thorough.
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
              <h3>Dependency Graphs</h3>
              <p>
                Visualize how components depend on each other. Trace function calls,
                imports, and data flow across your entire codebase.
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
              <h3>Code Reviews</h3>
              <p>
                Review pull requests faster with AI-generated summaries and impact analysis.
                Understand what changes affect and why they matter.
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
                Untangle complex legacy systems with visual dependency graphs and
                AI-powered explanations of obscure code patterns.
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
