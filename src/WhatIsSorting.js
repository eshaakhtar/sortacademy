// src/WhatIsSorting.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./WhatIsSorting.css"; // Import page-specific styling
import logo from "./assets/Logo.png";


function WhatIsSorting() {
    // State: stores the current list of numbers shown in the demo
  const [numbers, setNumbers] = useState([9, 3, 7, 1, 5]);

    // State: tracks whether the list is currently sorted or not
  const [isSorted, setIsSorted] = useState(false);

  // Accessibility states
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  // Handles button click for sorting or resetting the numbers
  const handleSortClick = () => {
    if (isSorted) {
      // reset to original order
      setNumbers([9, 3, 7, 1, 5]);
      setIsSorted(false);
    } else {
      // Create a sorted copy of the array (ascending order)
      const sorted = [...numbers].sort((a, b) => a - b);
      setNumbers(sorted);
      setIsSorted(true);
    }

  };
  // On component mount, load saved accessibility settings from localStorage
    useEffect(() => {
      const savedContrast = localStorage.getItem("sat_contrast") === "1";
      const savedDyslexia = localStorage.getItem("sat_dyslexia") === "1";
      const savedLargeText = localStorage.getItem("sat_largetext") === "1";
    
      setContrast(savedContrast);
      setDyslexia(savedDyslexia);
      setLargeText(savedLargeText);
    }, []);
  
    // Whenever an accessibility setting changes, update the body class and save to localStorage
    useEffect(() => {
      document.body.classList.toggle("contrast", contrast);
      localStorage.setItem("sat_contrast", contrast ? "1" : "0");
    }, [contrast]);
    
    useEffect(() => {
      document.body.classList.toggle("dyslexia", dyslexia);
      localStorage.setItem("sat_dyslexia", dyslexia ? "1" : "0");
    }, [dyslexia]);
    
    useEffect(() => {
      document.body.classList.toggle("large-text", largeText);
      localStorage.setItem("sat_largetext", largeText ? "1" : "0");
    }, [largeText]);

  return (
    <div className="wis-shell">
  {/* HEADER */}
  <header className="wis-header">
    <div className="home-logo">
      <img src={logo} alt="SortAcademy logo" className="brand-logo" />
      <div>
        <span className="home-logo-text-main">SortAcademy</span>
        <br />
        <span className="home-logo-text-sub">
          Interactive sorting algorithm tutor
        </span>
      </div>
    </div>

  <div className="wis-header-right">
    <nav className="home-nav" aria-label="Main navigation">
      <Link to="/">Home</Link>
      <Link to="/what-is-sorting" className="active">
        What is sorting?
      </Link>
      <Link to="/module">Module 1</Link>
    </nav>

    {/* Accessibility button */}
    <div className="wis-access-wrap">
      <button
        className="wis-access-btn"
        onClick={() => setAccessOpen(prev => !prev)}
        aria-haspopup="true"
        aria-expanded={accessOpen}
      >
        Accessibility ▾
      </button>

      {accessOpen && (
        <div className="wis-access-menu">
          <h3>Accessibility options</h3>

          <label className="wis-access-option">
            <input
              type="checkbox"
              checked={contrast}
              onChange={() => setContrast(prev => !prev)}
            />
            High contrast mode
          </label>

          <label className="wis-access-option">
            <input
              type="checkbox"
              checked={dyslexia}
              onChange={() => setDyslexia(prev => !prev)}
            />
            Dyslexia-friendly font
          </label>

          <label className="wis-access-option">
            <input
              type="checkbox"
              checked={largeText}
              onChange={() => setLargeText(prev => !prev)}
            />
            Larger text
          </label>

          <hr className="wis-access-sep" />

          <button
            className="wis-access-reset"
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
    </div>
  </div>
</header>

      <main className="wis-main">
        {/* INTRO */}
        <section className="wis-hero">
          <div>
            <p className="wis-eyebrow">FOUNDATIONS · BEFORE MODULE 1</p>
            <h1 className="wis-title">What is sorting?</h1>
            {/* Intro explanation */}
            <p className="wis-body">
              Sorting is the process of arranging items in a specific order,
              such as smallest to largest or A–Z. In computing, sorting helps
              us organise data so that it is easier and faster to search,
              compare and use.
            </p>
            <p className="wis-body">
              This page gives you a gentle, real-life introduction to sorting
              before you dive into individual algorithms in Module 1.
            </p>
          </div>

           {/* Example: unsorted vs sorted */}
          <div
            className="wis-card wis-compare-card"
            aria-label="Example of unsorted vs sorted list"
          >
            <h2>From messy to ordered</h2>
            {/* Unsorted example */}
            <div className="wis-compare-grid">
              <div>
                <h3>Unsorted</h3>
                <ul>
                  <li>9</li>
                  <li>3</li>
                  <li>7</li>
                  <li>1</li>
                  <li>5</li>
                </ul>
              </div>
              <div>
                 {/* Sorted example */}
                <h3>Sorted (ascending)</h3>
                <ul>
                  <li>1</li>
                  <li>3</li>
                  <li>5</li>
                  <li>7</li>
                  <li>9</li>
                </ul>
              </div>
            </div>
            <p className="wis-caption">
              When items are ordered, it becomes much easier to scan, search and
              reason about the data.
            </p>
          </div>
        </section>

        {/* WHY DO WE SORT? */}
        <section className="wis-section">
          <h2>Why do we sort data?</h2>
          <p className="wis-section-intro">
            We sort data for the same reason we tidy a desk or arrange a
            bookshelf: to make things easier to find, compare and use. In
            computer science, sorting is one of the most common operations.
          </p>

          <div className="wis-card-row">
            {/* Benefits of sorting */}
            <article className="wis-info-card">
              <h3>👀 Make data easier to read</h3>
              <p>
                An ordered list is easier for humans to scan. Sorting names A–Z
                or numbers from small to large reduces cognitive load.
              </p>
            </article>
            <article className="wis-info-card">
              <h3>⚡ Speed up searching</h3>
              <p>
                Many fast searching techniques, like binary search, only work
                when the data is sorted.
              </p>
            </article>
            <article className="wis-info-card">
              <h3>🧹 Organise information</h3>
              <p>
                Sorted information helps us group similar items together, spot
                patterns and remove duplicates.
              </p>
            </article>
            <article className="wis-info-card">
              <h3>🚀 Improve performance</h3>
              <p>
                Behind the scenes, sorted data can make large systems more
                efficient and responsive.
              </p>
            </article>
          </div>
        </section>

        {/* REAL-LIFE EXAMPLES */}
        <section className="wis-section">
          <h2>Real-life examples of sorting</h2>
          <p className="wis-section-intro">
            You already rely on sorting every day, often without realising it.
            Here are some examples that connect algorithms to real systems.
          </p>

          <div className="wis-grid">
            <article className="wis-example-card">
              <h3>📱 Phone contacts</h3>
              <p>
                Your contacts are sorted alphabetically by name so you can find
                people quickly instead of scrolling through a random list.
              </p>
            </article>

            <article className="wis-example-card">
              <h3>🛒 Online shopping</h3>
              <p>
                Product lists can be sorted by price, newest first or top rated.
                Each option rearranges the same data in a different order.
              </p>
            </article>

            <article className="wis-example-card">
              <h3>🎵 Playlists &amp; music apps</h3>
              <p>
                Songs can be ordered by artist, album, release date or how often
                you listen to them.
              </p>
            </article>

            <article className="wis-example-card">
              <h3>🏦 Bank statements</h3>
              <p>
                Transactions are sorted by date so you can easily track spending
                over time and spot unusual activity.
              </p>
            </article>

            <article className="wis-example-card">
              <h3>🏥 Hospital triage</h3>
              <p>
                Patients are effectively sorted by urgency so that the most
                serious cases are seen first. This is sorting by priority.
              </p>
            </article>

            <article className="wis-example-card">
              <h3>🎮 Leaderboards in games</h3>
              <p>
                High scores are sorted from highest to lowest so players can see
                who is at the top.
              </p>
            </article>
          </div>
        </section>

        {/* SORTING ORDERS */}
        <section className="wis-section">
          <h2>Ascending vs descending order</h2>
          <p className="wis-section-intro">
            Sorting is not just about “tidying” data, it is about choosing a
            rule for ordering items.
          </p>

          <div className="wis-order-grid">
            <div className="wis-order-card">
              {/* Ascending */}
              <h3>⬆ Ascending</h3>
              <p>From smallest to largest, or A → Z.</p>
              <p className="wis-order-example">[2, 4, 7, 9, 12]</p>
              <p className="wis-order-example">[Apple, Book, Cat, Dog]</p>
            </div>
            <div className="wis-order-card">
              {/* Descending */}
              <h3>⬇ Descending</h3>
              <p>From largest to smallest, or Z → A.</p>
              <p className="wis-order-example">[12, 9, 7, 4, 2]</p>
              <p className="wis-order-example">[Dog, Cat, Book, Apple]</p>
            </div>
          </div>
        </section>

        {/* MINI INTERACTIVE DEMO */}
        <section className="wis-section">
          <h2>Try a tiny sorting demo</h2>
          <p className="wis-section-intro">
            Click the button to see how the same set of numbers can be
            rearranged into a sorted order. This is a simplified version of
            what sorting algorithms do.
          </p>

          <div
            className="wis-card wis-demo-card"
            aria-label="Interactive sorting example"
          >
            <div className="wis-number-row">
              {numbers.map((n, idx) => (
                <div key={idx} className="wis-number-pill">
                  {n}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="wis-demo-btn"
              onClick={handleSortClick}
            >
              {isSorted ? "Reset to original order" : "Sort these numbers →"}
            </button>
            <p className="wis-caption">
              Real sorting algorithms follow precise rules to decide which
              elements to compare and swap at each step.
            </p>
          </div>
        </section>

        {/* SORTING IN CS */}
        <section className="wis-section">
          <h2>Why sorting matters in computer science</h2>
          <p className="wis-section-intro">
            Sorting is a core building block in many areas of computing. Once
            data is ordered, other algorithms become much faster and simpler.
          </p>

          <div className="wis-card-row">
            <article className="wis-info-card">
              <h3>🔍 Searching</h3>
              <p>
                Fast searching techniques, like binary search, rely on sorted
                lists to locate items in logarithmic time instead of scanning
                every element.
              </p>
            </article>
            <article className="wis-info-card">
              <h3>🗄 Databases</h3>
              <p>
                Database indexes are stored in sorted structures so that queries
                over millions of records can run in milliseconds.
              </p>
            </article>
            <article className="wis-info-card">
              <h3>📊 Data analysis</h3>
              <p>
                Many statistics, visualisations and preprocessing steps involve
                sorting values before further calculations.
              </p>
            </article>
            <article className="wis-info-card">
              <h3>🤖 Machine learning</h3>
              <p>
                Sorting appears in tasks like cleaning duplicates, ranking
                results and batching training examples.
              </p>
            </article>
          </div>
        </section>

        {/* PREVIEW OF ALGORITHMS */}
        <section className="wis-section">
          <h2>What you will learn next</h2>
          <p className="wis-section-intro">
            There are many different sorting algorithms. They all aim to
            produce a sorted list, but they use different strategies and have
            different strengths.
          </p>

          <div className="wis-grid">
            <article className="wis-algo-card">
              <h3>Bubble sort</h3>
              <p>
                Repeatedly compares and swaps neighbouring items until
                everything “bubbles” into the correct place.
              </p>
            </article>
            <article className="wis-algo-card">
              <h3>Selection sort</h3>
              <p>
                Finds the smallest element and places it first, then repeats for
                the rest of the list.
              </p>
            </article>
            <article className="wis-algo-card">
              <h3>Insertion sort</h3>
              <p>
                Builds a sorted list one item at a time by inserting each new
                element into the correct position.
              </p>
            </article>
            <article className="wis-algo-card">
              <h3>Merge sort</h3>
              <p>
                Splits the list into halves, sorts each half, then merges the
                halves together in order.
              </p>
            </article>
            <article className="wis-algo-card">
              <h3>Quick sort</h3>
              <p>
                Picks a pivot, partitions elements around it, then recursively
                sorts the smaller sub-lists.
              </p>
            </article>
          </div>

          {/* Call-to-action button to move into the learning module */}
          <div className="wis-cta-row">
            <Link to="/module" className="wis-btn-primary">
              Continue to Module →
            </Link>
          </div>
        </section>
      </main>

      <footer className="wis-footer">
        <p>© 2025 SortAcademy · “What is sorting?” foundation page.</p>
      </footer>
    </div>
  );
}

// Export the component so it can be used in routing
export default WhatIsSorting;
