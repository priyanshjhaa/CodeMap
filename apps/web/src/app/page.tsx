import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">CodeMap</div>
          <div className="navbar-links">
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How it Works</Link>
            <Link href="#pricing">Pricing</Link>
          </div>
          <div className="navbar-actions">
            <Link href="/login" className="navbar-button navbar-button-ghost">
              Login
            </Link>
            <Link href="/login" className="navbar-button navbar-button-filled">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-container">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            AI-Powered Code Understanding
          </div>
          <h1 className="hero-title">
            Chat With Your Codebase
          </h1>
          <p className="hero-description">
            Instantly understand architecture, dependencies, and pull requests
            with AI-powered insights. Transform onboarding from weeks to hours.
          </p>
          <div className="hero-cta">
            <input
              type="email"
              placeholder="Enter your email"
              className="email-input"
            />
            <Link href="/login" className="cta-button cta-button-primary">
              Get Started
            </Link>
            <Link href="/demo" className="cta-button cta-button-secondary">
              View Demo
            </Link>
          </div>
          <div className="hero-trust">
            <span>✓ No credit card required</span>
            <span>✓ Free forever for individuals</span>
            <span>✓ Setup in 2 minutes</span>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <div className="social-proof-container">
          <p className="social-proof-text">
            Trusted by engineering teams at
          </p>
          <div className="company-logos">
            <div className="company-logos-row">
              <div className="company-logo">
                <img src="/images/stripe-ar21.svg" alt="Stripe" />
                <span>Stripe</span>
              </div>
              <div className="company-logo">
                <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#fff" d="M50 8L20 32h60L50 8z"/>
                </svg>
                <span>Vercel</span>
              </div>
              <div className="company-logo">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" alt="Notion" />
                <span>Notion</span>
              </div>
              <div className="company-logo">
                <img src="/images/Figma_Symbol_0.svg" alt="Figma" />
                <span>Figma</span>
              </div>
              <div className="company-logo">
                <img src="/images/airbnb-ar21.svg" alt="Airbnb" />
                <span>Airbnb</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-subtitle">
              Everything you need to understand and navigate any codebase
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card glass-card">
              <h3>Architectural Insights</h3>
              <p>Automatically visualize system architecture and relationships between components.</p>
            </div>
            <div className="feature-card glass-card">
              <h3>Semantic Search</h3>
              <p>Find relevant code instantly using natural language queries across your repository.</p>
            </div>
            <div className="feature-card glass-card">
              <h3>Dependency Graphs</h3>
              <p>Understand how components interact and depend on each other across the codebase.</p>
            </div>
            <div className="feature-card glass-card">
              <h3>PR Summaries</h3>
              <p>Quickly review pull requests with AI-generated insights and context-aware explanations.</p>
            </div>
            <div className="feature-card glass-card">
              <h3>Context-Aware Chat</h3>
              <p>Ask questions and get accurate answers grounded in your actual code and documentation.</p>
            </div>
            <div className="feature-card glass-card">
              <h3>Commit Insights</h3>
              <p>Track the evolution of features and understand the history behind any piece of code.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get started in minutes, not days
            </p>
          </div>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Connect Your Repository</h3>
                <p>Link your GitHub, GitLab, or Bitbucket repository with one click.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Analysis</h3>
                <p>Our system indexes and understands your codebase architecture and patterns.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Start Chatting</h3>
                <p>Ask questions in natural language and get instant, accurate answers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">
              Choose the plan that fits your team
            </p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card glass-card">
              <h3>Free</h3>
              <div className="pricing-price">$0<span>/month</span></div>
              <p className="pricing-description">Perfect for individuals and open source</p>
              <ul className="pricing-features">
                <li>✓ Up to 3 repositories</li>
                <li>✓ Basic code search</li>
                <li>✓ Community support</li>
              </ul>
              <button className="pricing-button">Get Started</button>
            </div>
            <div className="pricing-card pricing-card-popular glass-card">
              <div className="popular-badge">Most Popular</div>
              <h3>Pro</h3>
              <div className="pricing-price">$29<span>/month</span></div>
              <p className="pricing-description">For startups and growing teams</p>
              <ul className="pricing-features">
                <li>✓ Unlimited repositories</li>
                <li>✓ Advanced insights</li>
                <li>✓ Priority support</li>
                <li>✓ Team collaboration</li>
              </ul>
              <button className="pricing-button pricing-button-primary">Start Free Trial</button>
            </div>
            <div className="pricing-card glass-card">
              <h3>Enterprise</h3>
              <div className="pricing-price">Custom</div>
              <p className="pricing-description">For large organizations</p>
              <ul className="pricing-features">
                <li>✓ Everything in Pro</li>
                <li>✓ SSO & SAML</li>
                <li>✓ Custom integrations</li>
                <li>✓ Dedicated support</li>
              </ul>
              <button className="pricing-button">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Loved by Developers</h2>
            <p className="section-subtitle">
              Join thousands of teams shipping faster with CodeMap
            </p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card glass-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "CodeMap reduced our onboarding time from 4 weeks to 3 days. New engineers can now contribute from day one."
              </p>
              <div className="testimonial-author">
                <div className="author-name">Sarah Chen</div>
                <div className="author-role">Engineering Lead, Stripe</div>
              </div>
            </div>
            <div className="testimonial-card glass-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "Finally, a tool that actually understands our codebase context. It's like having a senior engineer available 24/7."
              </p>
              <div className="testimonial-author">
                <div className="author-name">Marcus Johnson</div>
                <div className="author-role">Senior Developer, Vercel</div>
              </div>
            </div>
            <div className="testimonial-card glass-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "PR reviews that used to take hours now take minutes. The impact analysis alone is worth the price."
              </p>
              <div className="testimonial-author">
                <div className="author-name">Emily Rodriguez</div>
                <div className="author-role">Tech Lead, Linear</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Transform Your Onboarding?</h2>
          <p className="cta-description">
            Join thousands of teams shipping faster with CodeMap. Start your free trial today.
          </p>
          <div className="cta-actions">
            <Link href="/login" className="cta-button cta-button-primary">
              Get Started Free
            </Link>
            <Link href="#how-it-works" className="cta-button cta-button-secondary">
              How it Works
            </Link>
          </div>
          <div className="cta-trust">
            <span>✓ No credit card required</span>
            <span>✓ 14-day free trial</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-bottom">
          <p>&copy; 2024 CodeMap. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
