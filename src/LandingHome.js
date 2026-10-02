// src/LandingHome.js
import React from "react";
import { Link } from "react-router-dom";
import "./LandingHome.css";
import logo from "./assets/Logo.png";

// Main landing/homepage component
function LandingHome() {
  return (
    <div className="home-shell">
      {/* HEADER */}
      <header className="home-header">
         {/* Logo section (branding) */}
        <div className="home-logo">
        <img src={logo} alt="SortAcademy logo" className="home-logo-image" />
          <div>
            <span className="home-logo-text-main">SortAcademy</span>
            <br />
            <span className="home-logo-text-sub">
              Interactive sorting algorithm tutor
            </span>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="home-nav" aria-label="Main navigation">
          <Link to="/" className="active">
            Home
          </Link>
          <Link to="/module">Module 1</Link>
        </nav>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="hero">
          <div>
            <p className="hero-eyebrow">
              INTERACTIVE LEARNING FOR SORTING ALGORITHMS
            </p>
            <h1 className="hero-title">
              Understand sorting algorithms, not just memorise code.
            </h1>
            <p className="hero-body">
              SortAcademy uses short explanations, animated visualisers and
              practice quizzes so you can see how sorting works step by step,
              instead of trying to decode static lectures.
            </p>

            <div className="hero-cta-row">
              <Link to="/module" className="btn-primary">
                Start Module 1 <span>→</span>
              </Link>
              <a href="#how-it-works" className="btn-ghost">
                See how it works
              </a>
            </div>

            <p className="hero-caption">
              No login required · Built with accessibility in mind (high
              contrast, dyslexia-friendly fonts, larger text).
            </p>
          </div>

          {/* ANIMATION PANEL – Unsorted → In progress → Sorted */}
          <div
            className="hero-story-card"
            aria-label="How sorting changes an array from unsorted to sorted"
          >
            <div className="storyboard">
              {/* Step 1: Unsorted */}
              <div className="story-step">
                <div className="story-bars">
                  <div className="story-bar h-sm" />
                  <div className="story-bar h-lg" />
                  <div className="story-bar h-md" />
                  <div className="story-bar h-xs" />
                </div>
                <p className="story-numbers">9 · 3 · 7 · 1</p>
                <p className="story-label">Unsorted array</p>
                <p className="story-caption">
                  Values are in a random order. It’s hard to search or reason
                  about them efficiently.
                </p>
              </div>

              {/* Step 2: In progress */}
              <div className="story-step">
                <div className="story-bars">
                  <div className="story-bar h-sm" />
                  <div className="story-bar h-md is-active" />
                  <div className="story-bar h-lg is-active" />
                  <div className="story-bar h-xs" />
                </div>
                <p className="story-numbers">3 ⇄ 7</p>
                <p className="story-label">Comparing &amp; swapping</p>
                <p className="story-caption">
                  The algorithm scans the array, compares neighbours and swaps
                  them when they are out of order.
                </p>
              </div>

              {/* Step 3: Sorted */}
              <div className="story-step">
                <div className="story-bars">
                  <div className="story-bar h-xs is-sorted" />
                  <div className="story-bar h-sm is-sorted" />
                  <div className="story-bar h-md is-sorted" />
                  <div className="story-bar h-lg is-sorted" />
                </div>
                <p className="story-numbers">
                  1 · 3 · 7 · 9 <span className="story-check">✓</span>
                </p>
                <p className="story-label">Sorted array</p>
                <p className="story-caption">
                  After a sequence of passes, the values are ordered from
                  smallest to largest, ready for fast searching.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="section" aria-labelledby="who-for">
          <h2 id="who-for">Who is SortAcademy for?</h2>
          <div className="card-row">
            <article className="info-card">
              <h3>CS students</h3>
              <p>
                Reinforce your algorithms module with visual explanations that
                match the steps you see in code and pseudocode.
              </p>
            </article>

            <article className="info-card">
              <h3>Visual learners</h3>
              <p>
                Watch comparisons and swaps animate on screen instead of trying
                to imagine them from static diagrams.
              </p>
            </article>

            <article className="info-card">
              <h3>Learners with difficulties</h3>
              <p>
                Use high-contrast mode, dyslexia-friendly fonts and clear
                layouts designed to reduce cognitive load while studying.
              </p>
            </article>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          className="section"
          id="how-it-works"
          aria-labelledby="how-works"
        >
          <h2 id="how-works">How SortAcademy works</h2>
          <p className="section-intro">
            Each algorithm is introduced through a short lesson, followed by an
            animation and a quick quiz. You learn by{" "}
            <strong>seeing</strong>, <strong>doing</strong> and{" "}
            <strong>checking</strong> your understanding.
          </p>

         {/* Step-by-step learning process */}
          <div className="steps-row">
            <div className="step-card">
              <span className="step-badge">1</span>
              <h3>Learn</h3>
              <p>Read a concise explanation and pseudocode.</p>
            </div>
            <div className="step-card">
              <span className="step-badge">2</span>
              <h3>Visualise</h3>
              <p>Watch the algorithm run on different arrays.</p>
            </div>
            <div className="step-card">
              <span className="step-badge">3</span>
              <h3>Practice</h3>
              <p>Predict the next step or order the operations.</p>
            </div>
            <div className="step-card">
              <span className="step-badge">4</span>
              <h3>Quiz</h3>
              <p>Check your understanding with instant feedback.</p>
            </div>
          </div>
        </section>

        {/* READY CTA */}
        <section className="home-footer-cta">
          <h2>Ready to get started?</h2>
          <p>
            Jump into Module 1 to learn the basics of sorting algorithms, then
            explore the visualiser and quizzes in your own time.
          </p>
          <Link to="/module" className="btn-primary">
            Start Module 1 →
          </Link>
        </section>
      </main>

    {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        <p>© 2025 SortAcademy · Built as a final year project.</p>
      </footer>
    </div>
  );
}

// Export component so it can be used in routing
export default LandingHome;
