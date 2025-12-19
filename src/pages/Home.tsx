import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1 className="home-logo">MemoLink</h1>
          <nav className="home-nav">
            <button className="nav-link">Features</button>
            <button className="nav-link">About</button>
            <button className="nav-link">Pricing</button>
          </nav>
          <div className="home-auth-buttons">
            <button className="btn-login" onClick={() => navigate('/login')}>
              Sign in
            </button>
            <button className="btn-signup" onClick={() => navigate('/signup')}>
              Sign up →
            </button>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-section">
          <h1 className="hero-title">
            Your memories,
            <br />
            <span className="gradient-text">beautifully connected</span>
          </h1>
          <p className="hero-subtitle">
            Capture, organize, and visualize your precious moments in an interactive memory network. 
            Experience the future of personal memory management.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/signup')}>
              Start free
            </button>
            <button className="btn-secondary">
              <span>Watch demo</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          
          <div className="hero-demo">
            <div className="demo-card">
              <div className="demo-header">
                <div className="demo-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="demo-title">Memory Graph</div>
              </div>
              <div className="demo-content">
                <div className="demo-graph">
                  <div className="graph-node node-1"></div>
                  <div className="graph-node node-2"></div>
                  <div className="graph-node node-3"></div>
                  <div className="graph-node node-4"></div>
                  <div className="graph-line line-1"></div>
                  <div className="graph-line line-2"></div>
                  <div className="graph-line line-3"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">
              Everything you need to
              <br />
              <span className="gradient-text">preserve your memories</span>
            </h2>
            <p className="section-subtitle">
              Powerful features to help you organize, connect, and explore your life's moments
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              </div>
              <h3>Capture moments</h3>
              <p>Store photos, descriptions, and tags. Keep everything organized in one beautiful place.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m6-12l-4.2 4.2m-3.6 3.6L6 19m13-1l-4.2-4.2m-3.6-3.6L7 6"/>
                  </svg>
                </div>
              </div>
              <h3>Connect & visualize</h3>
              <p>Create meaningful connections and see how your memories relate in an interactive graph.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                </div>
              </div>
              <h3>Beautiful albums</h3>
              <p>Browse your memories in stunning layouts. Filter by tags and search your collection.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>
              <h3>Secure & private</h3>
              <p>Your memories are encrypted and stored securely. Only you have access.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20m10-10H2"/>
                  </svg>
                </div>
              </div>
              <h3>Smart tagging</h3>
              <p>Automatically tag and categorize your memories with AI-powered organization.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
              </div>
              <h3>Time travel</h3>
              <p>Navigate through your timeline and rediscover forgotten moments from any period.</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to get started?</h2>
            <p>Join thousands of users preserving their precious moments with MemoLink</p>
            <div className="cta-buttons">
              <button className="btn-cta-primary" onClick={() => navigate('/signup')}>
                Start free trial
              </button>
              <button className="btn-cta-secondary" onClick={() => navigate('/login')}>
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="footer-logo">MemoLink</h3>
            <p>Preserve your memories, beautifully.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#about">About</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About us</a>
              <a href="#blog">Blog</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 MemoLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
