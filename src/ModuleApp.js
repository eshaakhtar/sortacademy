// src/ModuleApp.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProfileChip, useGuestProfile } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; 

// Main module landing page component
function ModuleApp() {
  // Controls whether the sidebar is open (useful for smaller screens)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Accessibility toggle states
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Controls visibility of the accessibility dropdown menu
  const [accessOpen, setAccessOpen] = useState(false);

  // Guest profile information and profile switcher controls
  const { activeId, sharedDeviceMode, openSwitcher } = useGuestProfile();

// Load saved accessibility preferences from localStorage when the page first loads
  useEffect(() => {
    const savedContrast = localStorage.getItem("sat_contrast") === "1";
    const savedDyslexia = localStorage.getItem("sat_dyslexia") === "1";
    const savedLargeText = localStorage.getItem("sat_largetext") === "1";

    setContrast(savedContrast);
    setDyslexia(savedDyslexia);
    setLargeText(savedLargeText);
  }, []);

  // Open the profile switcher automatically:
  // - every time the module loads if shared device mode is enabled
  // - only when no active profile exists if shared device mode is disabled
  useEffect(() => {
    if (sharedDeviceMode || !activeId) {
      openSwitcher();
    }
  }, [activeId, sharedDeviceMode, openSwitcher]);

   // Apply/remove high contrast mode and save preference
  useEffect(() => {
    document.body.classList.toggle("contrast", contrast);
    localStorage.setItem("sat_contrast", contrast ? "1" : "0");
  }, [contrast]);

   // Apply/remove dyslexia-friendly font and save preference
  useEffect(() => {
    document.body.classList.toggle("dyslexia", dyslexia);
    localStorage.setItem("sat_dyslexia", dyslexia ? "1" : "0");
  }, [dyslexia]);

  // Apply/remove larger text mode and save preference
  useEffect(() => {
    document.body.classList.toggle("large-text", largeText);
    localStorage.setItem("sat_largetext", largeText ? "1" : "0");
  }, [largeText]);

  return (
    <>
     {/* Skip link improves keyboard accessibility by allowing users to jump straight to main content */}
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="topbar">
    <div className="brand">
        <img src={logo} alt="SortAcademy logo" className="brand-logo" />
        <span className="brand-name">SortAcademy</span>
     </div>

       {/* Breadcrumb navigation showing the current page location */}
        <nav className="crumbs" aria-label="Main navigation">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-current="page">Module</li>
          </ol>
        </nav>

       {/* Right-side header actions */}
        <div className="actions">
         {/* Displays the currently selected guest profile */}
        <ProfileChip />
         {/* Accessibility settings dropdown toggle */}
          <button
            type="button"
            className="action-btn"
            aria-haspopup="true"
            aria-expanded={accessOpen}
            onClick={() => setAccessOpen((prev) => !prev)}
          >
            Accessibility ▾
          </button>

         {/* Sidebar toggle button, mainly useful on smaller screens */}
          <button
            type="button"
            className="action-btn sidebar-toggle"
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>
        </div>

         {/* Accessibility dropdown menu */}
        {accessOpen && (
          <div
            className="access-menu"
            role="dialog"
            aria-label="Accessibility options"
          >
            <h3>Accessibility options</h3>

           {/* High contrast toggle */}
            <label className="access-option">
              <input
                type="checkbox"
                checked={contrast}
                onChange={() => setContrast((prev) => !prev)}
              />
              High contrast mode
            </label>

           {/* Dyslexia-friendly font toggle */}
            <label className="access-option">
              <input
                type="checkbox"
                checked={dyslexia}
                onChange={() => setDyslexia((prev) => !prev)}
              />
              Dyslexia-friendly font
            </label>

             {/* Larger text toggle */}
            <label className="access-option">
              <input
                type="checkbox"
                checked={largeText}
                onChange={() => setLargeText((prev) => !prev)}
              />
              Larger text
            </label>

             {/* Reset all accessibility settings back to defaults */}
            <button
              className="access-reset"
              onClick={() => {
                setContrast(false);
                setDyslexia(false);
                setLargeText(false);
              }}
            >
              Reset to defaults
            </button>
          </div>
        )}
      </header>

       {/* Main page layout: sidebar + content area */}
      <div className="layout">
        {/* Sidebar navigation */}
        <aside
          id="sidebar"
          className={`sidebar ${sidebarOpen ? "open" : ""}`}
          aria-label="Course navigation"
        >
          {/* Group 1: Getting started */}
          <h2 className="sidebar-title">Getting started</h2>
          <ul className="toc">
            <li>
              {/* Current page marked active */}
            <Link className="active" to="/module">
             Module overview
            </Link>
            </li>
            <li>
              <Link to="/what-is-sorting">What is sorting? (recap)</Link>
            </li>
            <li>
                {/* Anchor link to the learning outcomes section on this page */}
              <a href="#learning-outcomes">Learning outcomes</a>
            </li>
          </ul>

          {/* Group 2: Lessons */}
          <h2 className="sidebar-title">Lessons</h2>
          <ul className="toc">
            <li>
              <Link to="/bubble-sort">Bubble sort</Link>
            </li>
            <li>
               <Link to="/selection-sort"> Selection sort</Link>
            </li>
            <li>
               <Link to="/insertion-sort"> Insertion sort</Link>
            </li>
            <li>
               <Link to="/merge-sort">Merge sort</Link>
            </li>
            <li>
               <Link to="/quick-sort">Quick sort</Link>
            </li>
          </ul>

          {/* Group 3: Interactive features*/}
          <h2 className="sidebar-title">Interactive</h2>
          <ul className="toc">
            <li>
              <Link to="/visualiser">Visualiser & practice</Link>
            </li>
            <li>
              <Link to="/quiz-assessment">Quiz & Assessment</Link>
            </li>
          </ul>

          {/* Group 4: Support Resources*/}
          <h2 className="sidebar-title">Support</h2>
          <ul className="toc">
            <li>
            <Link to="/glossary-feedback">Glossary & Feedback</Link>
            </li>
          </ul>
        </aside>

        {/* Main content */}
        <main id="main" className="content">
          {/* HERO SECTION: Introduces the module */}
          <section className="hero">
            <div className="hero-text">
              <p className="eyebrow">Module · Foundations</p>
              <h1>Introduction to Sorting Algorithms</h1>
              <p className="tagline">
                Learn what sorting is, why it matters in real systems, and how
                this hybrid course will guide you from visual intuition to
                code-level understanding.
              </p>

               {/* Main call-to-action buttons */}
              <div className="hero-cta-row">
                <Link className="btn" to="/bubble-sort">
                  Start with Bubble sort →
                </Link>
                <Link className="btn secondary" to="/visualiser">
                  Preview visualiser →
                </Link>
                <Link className="btn secondary" to="/what-is-sorting">
                  Review: What is sorting? →
                </Link>
              </div>

               {/* Static progress bar showing starting point in the module */}
              <div className="progress-strip" aria-label="Module progress">
                <span className="progress-label">Your progress</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: "20%" }}
                    aria-hidden="true"
                  />
                </div>
                <span className="progress-text">
                  Lesson 1 of 5 · Getting started
                </span>
              </div>
            </div>

             {/* Summary panel explaining today's focus */}
            <div className="hero-panel" aria-label="Today’s focus">
              <h2>Today you will:</h2>
              <ul>
                <li>Define what a sorting algorithm does.</li>
                <li>Recognise common use-cases for sorting.</li>
                <li>Meet the key families of sorting algorithms.</li>
                <li>
                  Understand how this module blends lessons, demos, practice and
                  quizzes.
                </li>
              </ul>
            </div>
          </section>

          {/* Small metadata pills showing time, level, and learning format */}
          <section className="meta-row" aria-label="Course metadata">
            <div className="pill">
              ⏱ Estimated time: <strong>20–30 minutes</strong>
            </div>
            <div className="pill">
              🎯 Level: <strong>Foundations</strong>
            </div>
            <div className="pill">
              🧩 Mode:{" "}
              <strong>Hybrid (Lesson → Demo → Practice → Quiz)</strong>
            </div>
          </section>

          {/* LEARNING OBJECTIVES + WHY IT MATTERS */}
          <section className="two-col" id="learning-outcomes">
            <article className="card">
              <h2>Learning objectives</h2>
              <ul>
                <li>
                  Explain what sorting is and where it is used in computing.
                </li>
                <li>Describe stability and in-place sorting with examples.</li>
                <li>
                  Trace the steps of Bubble, Selection, Insertion, Merge, and
                  Quick sort at a high level.
                </li>
                <li>
                  Choose an algorithm based on input size, order, and
                  constraints.
                </li>
              </ul>
            </article>

            <article className="card emphasis-card">
              <h2>Why sorting matters</h2>
              <p>
                Sorting is a building block for search, indexing, optimisation
                and data analysis. Faster sorting often leads directly to faster
                systems.
              </p>
              <ul className="chip-list">
                <li className="chip">Search &amp; filters</li>
                <li className="chip">Databases &amp; indexing</li>
                <li className="chip">Recommendation systems</li>
                <li className="chip">Scheduling &amp; routing</li>
              </ul>
            </article>
          </section>

          {/* REAL-WORLD EXAMPLES OF SORTING*/}
          <section>
            <h2>Real-world examples of sorting</h2>
            <div className="kpi-row">
              <article className="kpi-card">
                <h3>📱 Apps &amp; feeds</h3>
                <p>
                  Social media timelines, message lists and notifications are
                  continuously sorted so the most relevant items appear first.
                </p>
              </article>
              <article className="kpi-card">
                <h3>🗂 Databases</h3>
                <p>
                  Database engines sort records to speed up queries, joins and
                  range searches over millions of rows.
                </p>
              </article>
              <article className="kpi-card">
                <h3>🚚 Logistics</h3>
                <p>
                  Warehouses and delivery routes rely on sorted data to plan
                  efficient picking orders and journeys.
                </p>
              </article>
              <article className="kpi-card">
                <h3>🧪 Data science</h3>
                <p>
                  Many analysis pipelines sort data before computing statistics,
                  visualisations or machine-learning features.
                </p>
              </article>
            </div>
          </section>

          {/* Explanation of the lesson-to-quiz learning pathway */}
          <section>
            <h2>How this hybrid module works</h2>
            <p>
              SortAcademy is designed around active learning. You won’t just
              read about algorithms—you will <strong>see</strong> them,{" "}
              <strong>interact</strong> with them and <strong>test</strong> your
              understanding.
            </p>

            <div className="steps">
              <div className="step">
                <span className="badge">1</span>
                <strong>Lesson</strong>
                <br />
                Read a short explanation and pseudocode.
              </div>
              <div className="step">
                <span className="badge">2</span>
                <strong>Demo</strong>
                <br />
                Watch the algorithm animate on an array.
              </div>
              <div className="step">
                <span className="badge">3</span>
                <strong>Practice</strong>
                <br />
                Predict steps or complete drag-and-drop tasks.
              </div>
              <div className="step">
                <span className="badge">4</span>
                <strong>Quiz</strong>
                <br />
                Answer timed questions with instant feedback.
              </div>
            </div>

            <p>
              Ready to begin? Start with the first lesson or jump straight to
              the interactive visualiser once you feel confident.
            </p>

              {/* Final action buttons */}
            <div className="btn-row">
              <Link className="btn" to="/bubble-sort">
                Start with Bubble sort →
              </Link>
              <Link className="btn secondary" to="/visualiser">
                Open visualiser →
              </Link>
            </div>
          </section>

           {/* Helpful accessibility reminder */}
          <section className="callout tip" role="note">
            <strong>Tip:</strong> Turn on <em>Contrast</em> or <em>Font</em> in
            the header if you prefer higher contrast or a dyslexia-friendly
            typeface. These tools are designed to support different learning
            needs.
          </section>
        </main>
      </div>

       {/* Footer */}
      <footer className="site-footer">
        <p>
        © 2025 SortAcademy · Built as a Final Year Project.{" "}
        </p>
      </footer>
    </>
  );
}

export default ModuleApp;
