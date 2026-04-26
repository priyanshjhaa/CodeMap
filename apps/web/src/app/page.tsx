'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    id: 'architectural',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Architectural Insights',
    benefit: 'Instantly map your entire codebase structure'
  },
  {
    id: 'semantic',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Semantic Search',
    benefit: 'Find any code using natural language'
  },
  {
    id: 'sync',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
        <path d="M16 21h5v-5"/>
      </svg>
    ),
    title: 'Sync Status',
    benefit: 'Track repository readiness in real-time'
  },
  {
    id: 'cited',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    title: 'Cited Answers',
    benefit: 'Review answers with source citations'
  },
  {
    id: 'chat',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Context-Aware Chat',
    benefit: 'Get accurate answers grounded in your code'
  },
  {
    id: 'onboarding',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title: 'Guided Onboarding',
    benefit: 'Onboard developers in hours, not weeks'
  }
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeFeature, setActiveFeature] = useState('architectural');
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(1); // 0: Free, 1: Pro, 2: Enterprise

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // Initial check
    handleScroll();
    console.log('Scroll detection active, scrolled:', scrolled);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="landing-page">
      {/* Fixed wrapper for proper centering */}
      <div className="navbar-wrapper">
        <motion.nav
          className="navbar"
          initial={false}
          animate={{
            scale: scrolled ? 0.92 : 1,
            y: scrolled ? 8 : 0,
            borderRadius: scrolled ? "999px" : "0px",
            backgroundColor: scrolled
              ? "rgba(2, 6, 23, 0.85)"
              : "transparent",
            backdropFilter: scrolled ? "blur(25px)" : "blur(0px)",
            WebkitBackdropFilter: scrolled ? "blur(25px)" : "blur(0px)",
            border: scrolled ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid transparent",
            boxShadow: scrolled
              ? "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
              : "none",
          }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
            mass: 0.8,
          }}
          onHoverStart={() => scrolled && setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          style={{
            transformOrigin: "top center",
          }}
        >
        <div className={`navbar-container ${scrolled ? 'island-mode' : ''}`}>
          <div className="navbar-logo">
            <span className="navbar-logo-gradient">CodeMap</span>
          </div>

          {/* Navigation links - animate opacity separately */}
          <motion.div
            className="navbar-links"
            animate={{
              gap: scrolled ? "16px" : "32px",
            }}
            transition={{
              type: "spring",
              stiffness: 90,
              damping: 18,
              mass: 0.8,
            }}
          >
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How it Works</Link>
            <Link href="#pricing">Pricing</Link>
          </motion.div>

          {/* CTA Buttons - animate separately */}
          <div className="navbar-actions">
            <AnimatePresence mode="wait">
              {!scrolled ? (
                <>
                  <motion.div
                    key="login"
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link href="/login" className="navbar-button navbar-button-ghost">
                      Login
                    </Link>
                  </motion.div>
                  <motion.div
                    key="get-started-full"
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link href="/login" className="navbar-button navbar-button-aurora">
                      Get Started
                    </Link>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  key="get-started-compact"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15, delay: 0.05 }}
                >
                  <Link href="/login" className="navbar-button navbar-button-aurora navbar-button-compact">
                    Get Started
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-aurora-layer">
          <div className="aurora-glow aurora-glow-emerald"></div>
          <div className="aurora-glow aurora-glow-cyan"></div>
        </div>
        <div className="hero-container">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            AI-Powered Code Understanding
          </div>
          <h1 className="hero-title">
            Chat with your <span className="hero-title-gradient">codebase</span>.
          </h1>
          <p className="hero-description">
            Understand architecture, repository flows, and code context instantly.
            Turn onboarding from weeks into hours.
          </p>
          <div className="hero-cta">
            <div className="email-input-wrapper">
              <input
                type="email"
                placeholder="Enter your email"
                className="email-input"
              />
              <Link href="/login" className="cta-button-primary">
                Get Started
              </Link>
            </div>
            <Link href="/demo" className="cta-button-secondary">
              View Demo
            </Link>
          </div>
          <div className="hero-trust">
            <span>✓ No credit card required</span>
            <span>✓ Setup in 2 minutes</span>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <div className="social-proof-container">
          <p className="social-proof-text">
            Powering next-generation engineering at
          </p>
          <p className="social-proof-subtext">
            From startups to Fortune 500 — teams ship faster with CodeMap
          </p>
          <div className="company-logos">
            <div className="company-logos-row">
              <div className="company-logo">
                <img src="/images/stripe-ar21.svg" alt="Stripe" />
              </div>
              <div className="company-logo">
                <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#fff" d="M50 8L20 32h60L50 8z"/>
                </svg>
              </div>
              <div className="company-logo">
                <span>Notion</span>
              </div>
              <div className="company-logo">
                <img src="/images/Figma_Symbol_0.svg" alt="Figma" />
              </div>
              <div className="company-logo">
                <img src="/images/airbnb-ar21.svg" alt="Airbnb" />
              </div>
            </div>
          </div>

          <div className="social-proof-metrics">
            <div className="metric-item">
              <div className="metric-value">10,000+</div>
              <div className="metric-label">Developers</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <div className="metric-value">50M+</div>
              <div className="metric-label">Lines Indexed</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <div className="metric-value">99.9%</div>
              <div className="metric-label">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">
              Understand Any <span className="gradient-text">Codebase Instantly</span>
            </h2>
            <p className="features-subtitle">
              Experience the future of code understanding with AI-powered insights
            </p>
          </div>

          <div className="features-layout">
            <div className="features-grid-interactive">
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`feature-card-interactive ${activeFeature === feature.id ? 'active' : ''}`}
                  onMouseEnter={() => setActiveFeature(feature.id)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-benefit">{feature.benefit}</p>
                  <div className="feature-hover-indicator">
                    <span>Click to explore</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <div className="feature-preview-panel">
              {activeFeature === 'architectural' && (
                <div className="preview-content">
                  <div className="preview-header">
                    <span className="preview-badge">Architecture</span>
                    <span className="preview-status">Live Preview</span>
                  </div>
                  <div className="architecture-preview">
                    <div className="arch-diagram">
                      <div className="arch-node arch-entry">Entry Point</div>
                      <div className="arch-node arch-api">API Layer</div>
                      <div className="arch-node arch-service">Services</div>
                      <div className="arch-node arch-db">Database</div>
                      <div className="arch-connector"></div>
                      <div className="arch-connector"></div>
                      <div className="arch-connector"></div>
                    </div>
                    <div className="arch-insight">
                      <div className="insight-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <div className="insight-text">
                        <div>Mapped 47 modules</div>
                        <div className="insight-sub">3 entry points detected</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'semantic' && (
                <div className="preview-content">
                  <div className="preview-header">
                    <span className="preview-badge">Semantic Search</span>
                    <span className="preview-status">Live Preview</span>
                  </div>
                  <div className="search-preview">
                    <div className="search-input-simulated">
                      <span className="search-prompt">find auth middleware</span>
                      <span className="search-cursor">|</span>
                    </div>
                    <div className="search-results">
                      <div className="search-result">
                        <div className="result-file">auth/middleware.ts</div>
                        <div className="result-match">
                          <span className="highlight">export function authenticate</span>
                        </div>
                        <div className="result-confidence">98% match</div>
                      </div>
                      <div className="search-result">
                        <div className="result-file">guards/auth.guard.ts</div>
                        <div className="result-match">
                          <span className="highlight">AuthGuard implements</span>
                        </div>
                        <div className="result-confidence">94% match</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'sync' && (
                <div className="preview-content">
                  <div className="preview-header">
                    <span className="preview-badge">Sync Status</span>
                    <span className="preview-status">Live Preview</span>
                  </div>
                  <div className="sync-preview">
                    <div className="sync-progress">
                      <div className="progress-bar">
                        <div className="progress-fill"></div>
                      </div>
                      <div className="progress-stats">
                        <span>Indexing: 2,847 files</span>
                        <span className="progress-percent">87%</span>
                      </div>
                    </div>
                    <div className="sync-repos">
                      <div className="repo-status repo-ready">
                        <span className="status-dot ready"></span>
                        <span>frontend-app</span>
                        <span className="status-badge">Ready</span>
                      </div>
                      <div className="repo-status repo-syncing">
                        <span className="status-dot syncing"></span>
                        <span>api-service</span>
                        <span className="status-badge">Syncing</span>
                      </div>
                      <div className="repo-status repo-pending">
                        <span className="status-dot pending"></span>
                        <span>shared-utils</span>
                        <span className="status-badge">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'cited' && (
                <div className="preview-content">
                  <div className="preview-header">
                    <span className="preview-badge">Cited Answers</span>
                    <span className="preview-status">Live Preview</span>
                  </div>
                  <div className="cited-preview">
                    <div className="cited-question">
                      <span className="question-icon">Q</span>
                      <span>How is user authentication handled?</span>
                    </div>
                    <div className="cited-answer">
                      <div className="answer-text">
                        Authentication uses JWT tokens stored in HTTP-only cookies.
                        The middleware validates tokens on each protected route.
                      </div>
                      <div className="citations">
                        <div className="citation">
                          <span className="citation-file">auth/middleware.ts</span>
                          <span className="citation-line">:24-32</span>
                        </div>
                        <div className="citation">
                          <span className="citation-file">auth/jwt.service.ts</span>
                          <span className="citation-line">:15-18</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'chat' && (
                <div className="preview-content">
                  <div className="preview-header">
                    <span className="preview-badge">Context Chat</span>
                    <span className="preview-status">Live Preview</span>
                  </div>
                  <div className="chat-preview">
                    <div className="chat-message user">
                      <span className="chat-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </span>
                      <div className="chat-bubble">Where is login handled?</div>
                    </div>
                    <div className="chat-message assistant">
                      <span className="chat-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>
                      </span>
                      <div className="chat-bubble">
                        Login is handled in the auth controller:
                        <div className="chat-citation">
                          <code>apps/api/src/modules/auth/auth.controller.ts:42</code>
                        </div>
                      </div>
                    </div>
                    <div className="chat-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'onboarding' && (
                <div className="preview-content">
                  <div className="preview-header">
                    <span className="preview-badge">Guided Onboarding</span>
                    <span className="preview-status">Live Preview</span>
                  </div>
                  <div className="onboarding-preview">
                    <div className="onboarding-path">
                      <div className="path-step completed">
                        <div className="step-number">✓</div>
                        <div className="step-content">
                          <div className="step-title">Project Setup</div>
                          <div className="step-time">5 min</div>
                        </div>
                      </div>
                      <div className="path-step completed">
                        <div className="step-number">✓</div>
                        <div className="step-content">
                          <div className="step-title">Core Architecture</div>
                          <div className="step-time">15 min</div>
                        </div>
                      </div>
                      <div className="path-step active">
                        <div className="step-number">3</div>
                        <div className="step-content">
                          <div className="step-title">API Routes</div>
                          <div className="step-time">10 min</div>
                        </div>
                      </div>
                      <div className="path-step">
                        <div className="step-number">4</div>
                        <div className="step-content">
                          <div className="step-title">Database Models</div>
                          <div className="step-time">12 min</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Guided Flow Timeline */}
      <section id="how-it-works" className="how-it-works-flow">
        <div className="flow-container">
          <div className="flow-header">
            <h2 className="flow-title">How It Works</h2>
            <p className="flow-subtitle">
              Get started in minutes, not days
            </p>
          </div>

          {/* Flow Timeline */}
          <div className="flow-timeline">
            {/* Progress Line */}
            <div className="flow-progress-line">
              <div
                className="flow-progress-fill"
                style={{ width: `${((activeFlowStep + 1) / 3) * 100}%` }}
              ></div>
            </div>

            {/* Flow Steps */}
            <div className="flow-steps">
              {[
                {
                  number: 1,
                  title: "Connect Your Codebase",
                  description: "Link your GitHub repository in seconds",
                  icon: "🔗"
                },
                {
                  number: 2,
                  title: "AI Analysis",
                  description: "We index and understand your code structure",
                  icon: "🤖"
                },
                {
                  number: 3,
                  title: "Start Chatting",
                  description: "Ask questions and get instant answers",
                  icon: "💬"
                }
              ].map((step, index) => (
                <div
                  key={step.number}
                  className={`flow-step ${activeFlowStep === index ? 'active' : ''}`}
                  onMouseEnter={() => setActiveFlowStep(index)}
                >
                  <div className="flow-step-circle">
                    <span className="flow-step-number">{step.number}</span>
                    <div className="flow-step-glow"></div>
                  </div>
                  <div className="flow-step-content">
                    <h3 className="flow-step-title">{step.title}</h3>
                    <p className="flow-step-description">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="flow-preview-panel">
            {activeFlowStep === 0 && (
              <div className="flow-preview-content">
                <div className="preview-header">
                  <span className="preview-badge">Step 1: Connect</span>
                  <span className="preview-status">Live Preview</span>
                </div>
                <div className="connect-preview">
                  <div className="connect-status">
                    <div className="status-icon connecting">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                    </div>
                    <div className="status-text">
                      <div className="status-main">Connecting to github.com</div>
                      <div className="status-sub">github.com/yourusername/repo</div>
                    </div>
                    <div className="status-indicator">
                      <span className="status-dot"></span>
                    </div>
                  </div>
                  <div className="connect-success">
                    <div className="success-icon">✓</div>
                    <div className="success-text">Repository linked successfully</div>
                  </div>
                </div>
              </div>
            )}

            {activeFlowStep === 1 && (
              <div className="flow-preview-content">
                <div className="preview-header">
                  <span className="preview-badge">Step 2: AI Analysis</span>
                  <span className="preview-status">Live Preview</span>
                </div>
                <div className="analysis-preview">
                  <div className="analysis-progress">
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill"></div>
                    </div>
                    <div className="progress-text">
                      <span>Indexing files...</span>
                      <span className="progress-percent">78%</span>
                    </div>
                  </div>
                  <div className="analysis-stats">
                    <div className="stat-item">
                      <div className="stat-icon">📁</div>
                      <div className="stat-content">
                        <div className="stat-label">Files scanned</div>
                        <div className="stat-value">2,847</div>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">📝</div>
                      <div className="stat-content">
                        <div className="stat-label">Functions found</div>
                        <div className="stat-value">1,234</div>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">🔗</div>
                      <div className="stat-content">
                        <div className="stat-label">Dependencies</div>
                        <div className="stat-value">456</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFlowStep === 2 && (
              <div className="flow-preview-content">
                <div className="preview-header">
                  <span className="preview-badge">Step 3: Start Chatting</span>
                  <span className="preview-status">Live Preview</span>
                </div>
                <div className="chat-preview-flow">
                  <div className="chat-message-flow user">
                    <span className="chat-avatar-flow">👤</span>
                    <div className="chat-bubble-flow">Where is authentication handled?</div>
                  </div>
                  <div className="chat-message-flow assistant">
                    <span className="chat-avatar-flow">🤖</span>
                    <div className="chat-bubble-flow">
                      Found in <code>middleware/auth.js</code>
                      <div className="chat-citation-flow">
                        Line 24-32: JWT token validation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section - Interactive */}
      <section id="pricing" className="pricing-section-interactive">
        <div className="pricing-container">
          <div className="pricing-header">
            <h2 className="pricing-title">Simple, Transparent Pricing</h2>
            <p className="pricing-subtitle">
              Choose the plan that grows with your team
            </p>
          </div>

          {/* Plan Selector Flow */}
          <div className="plan-flow">
            <div className="plan-flow-progress">
              <div
                className="plan-progress-fill"
                style={{ left: `${selectedPlan * 50}%` }}
              ></div>
            </div>

            <div className="plan-cards">
              {[
                {
                  id: 0,
                  name: 'Free',
                  price: '$0',
                  period: 'forever',
                  description: 'Perfect for individuals and open source',
                  icon: '🎯',
                  features: ['Up to 3 repositories', 'Repository onboarding chat', 'Community support'],
                  cta: 'Get Started'
                },
                {
                  id: 1,
                  name: 'Pro',
                  price: '$29',
                  period: '/month',
                  description: 'For startups and growing teams',
                  icon: '🚀',
                  features: ['Unlimited repositories', 'Team workspaces', 'Architecture views', 'Priority support', 'Team collaboration'],
                  cta: 'Start Free Trial',
                  popular: true
                },
                {
                  id: 2,
                  name: 'Enterprise',
                  price: 'Custom',
                  period: '',
                  description: 'For large organizations',
                  icon: '🏢',
                  features: ['Everything in Pro', 'Unlimited team members', 'SSO & SAML', 'Private repository controls', 'Workspace governance', 'Dedicated support', 'SLA guarantee'],
                  cta: 'Contact Sales'
                }
              ].map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-card ${selectedPlan === plan.id ? 'active' : ''} ${plan.popular ? 'popular' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && <div className="popular-ribbon">Most Popular</div>}
                  <div className="plan-icon">{plan.icon}</div>
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">
                    {plan.price}
                    <span className="plan-period">{plan.period}</span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                  <ul className="plan-features">
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  <button className={`plan-button ${plan.popular ? 'plan-button-primary' : ''}`}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Plan Details Preview */}
          <div className="plan-details-preview">
            {selectedPlan === 0 && (
              <div className="plan-preview-content">
                <div className="preview-header">
                  <span className="preview-badge">Free Plan</span>
                  <span className="preview-status">No credit card required</span>
                </div>
                <div className="free-plan-preview">
                  <div className="free-plan-features">
                    <div className="free-feature-item">
                      <div className="feature-icon-large">📁</div>
                      <div className="feature-content">
                        <div className="feature-title">3 Repositories</div>
                        <div className="feature-subtitle">Connect up to 3 GitHub repos</div>
                      </div>
                    </div>
                    <div className="free-feature-item">
                      <div className="feature-icon-large">💬</div>
                      <div className="feature-content">
                        <div className="feature-title">Smart Chat</div>
                        <div className="feature-subtitle">AI-powered code assistance</div>
                      </div>
                    </div>
                    <div className="free-feature-item">
                      <div className="feature-icon-large">👥</div>
                      <div className="feature-content">
                        <div className="feature-title">Community Support</div>
                        <div className="feature-subtitle">Help from our community</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPlan === 1 && (
              <div className="plan-preview-content">
                <div className="preview-header">
                  <span className="preview-badge">Pro Plan</span>
                  <span className="preview-status">14-day free trial</span>
                </div>
                <div className="pro-plan-preview">
                  <div className="pro-highlight">
                    <div className="pro-highlight-icon">⚡</div>
                    <div className="pro-highlight-text">
                      <div className="pro-highlight-title">Everything in Free, plus:</div>
                      <div className="pro-highlight-sub">Unlimited repositories & team features</div>
                    </div>
                  </div>
                  <div className="pro-features-grid">
                    <div className="pro-feature-card">
                      <div className="pro-feature-icon">👥</div>
                      <div className="pro-feature-title">Team Workspaces</div>
                      <div className="pro-feature-desc">Collaborate with your entire team</div>
                    </div>
                    <div className="pro-feature-card">
                      <div className="pro-feature-icon">🏗️</div>
                      <div className="pro-feature-title">Architecture Views</div>
                      <div className="pro-feature-desc">Visualize your codebase structure</div>
                    </div>
                    <div className="pro-feature-card">
                      <div className="pro-feature-icon">⚡</div>
                      <div className="pro-feature-title">Priority Support</div>
                      <div className="pro-feature-desc">24-hour response time</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPlan === 2 && (
              <div className="plan-preview-content">
                <div className="preview-header">
                  <span className="preview-badge">Enterprise</span>
                  <span className="preview-status">Custom pricing</span>
                </div>
                <div className="enterprise-preview">
                  <div className="enterprise-highlight">
                    <div className="enterprise-highlight-icon">🏢</div>
                    <div className="enterprise-highlight-text">
                      <div className="enterprise-highlight-title">Everything in Pro, plus:</div>
                      <div className="enterprise-highlight-sub">Enterprise-grade security & governance</div>
                    </div>
                  </div>
                  <div className="enterprise-features-list">
                    <div className="enterprise-feature">
                      <div className="enterprise-feature-icon">🔐</div>
                      <div className="enterprise-feature-content">
                        <div className="enterprise-feature-title">SSO & SAML</div>
                        <div className="enterprise-feature-desc">Single sign-on with your identity provider</div>
                      </div>
                    </div>
                    <div className="enterprise-feature">
                      <div className="enterprise-feature-icon">🎛️</div>
                      <div className="enterprise-feature-content">
                        <div className="enterprise-feature-title">Workspace Governance</div>
                        <div className="enterprise-feature-desc">Advanced access controls and permissions</div>
                      </div>
                    </div>
                    <div className="enterprise-feature">
                      <div className="enterprise-feature-icon">💬</div>
                      <div className="enterprise-feature-content">
                        <div className="enterprise-feature-title">Dedicated Support</div>
                        <div className="enterprise-feature-desc">Priority access to our engineering team</div>
                      </div>
                    </div>
                    <div className="enterprise-feature">
                      <div className="enterprise-feature-icon">📊</div>
                      <div className="enterprise-feature-content">
                        <div className="enterprise-feature-title">SLA Guarantee</div>
                        <div className="enterprise-feature-desc">99.99% uptime commitment</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                "The cited answers make it much easier to trust what the assistant is saying about unfamiliar code."
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
