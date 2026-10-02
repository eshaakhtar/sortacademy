// src/GlossaryFeedbackPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProfileChip } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; //  global theme + layout
import "./GlossaryFeedbackPage.css"; // page-specific

// --------------------------- Glossary data ---------------------------
const GLOSSARY = [
  // --- Fundamentals
  {
    term: "Algorithm",
    category: "Fundamentals",
    def: "A step-by-step procedure used to solve a problem or complete a task.",
    more: ["In this module: sorting is a common algorithmic task."],
  },
  {
    term: "Sorting algorithm",
    category: "Fundamentals",
    def: "A method for rearranging a list so that items follow an order (e.g., smallest to largest).",
    more: ["Common goal: improve searching, ranking, and reporting."],
  },
  {
    term: "Comparison",
    category: "Fundamentals",
    def: "An operation that checks the order of two values (e.g., is A[i] < A[j]?).",
    more: ["Many sorting algorithms are comparison-based."],
  },
  {
    term: "Swap",
    category: "Fundamentals",
    def: "An operation that exchanges the positions of two elements in an array.",
    more: ["Bubble/Selection often use swaps."],
  },
  
  {
    term: "Key",
    category: "Fundamentals",
    def: "The value used for ordering items (e.g., sorting students by grade uses grade as the key).",
    more: ["Stable sorts help when sorting by multiple keys (e.g., surname then first name)."],
  },

  // --- Complexity
  {
    term: "Big-O notation",
    category: "Complexity",
    def: "A way to describe how runtime or memory grows as input size increases (e.g., O(n), O(n log n)).",
    more: ["Big-O focuses on growth rate, not exact seconds."],
  },
  {
    term: "Time complexity",
    category: "Complexity",
    def: "An estimate of how the runtime grows with the size of the input.",
    more: ["Often analysed as best/average/worst case."],
  },
  {
    term: "Space complexity",
    category: "Complexity",
    def: "An estimate of how much extra memory an algorithm uses as input size increases.",
    more: ["In-place algorithms typically use less extra memory."],
  },
  {
    term: "Best case",
    category: "Complexity",
    def: "The fastest runtime an algorithm can achieve for some inputs of size n.",
    more: ["Example: Insertion sort can be O(n) on nearly-sorted data."],
  },
  {
    term: "Average case",
    category: "Complexity",
    def: "The expected runtime over typical/random inputs of size n.",
    more: ["Often used when worst case is rare in practice."],
  },
  {
    term: "Worst case",
    category: "Complexity",
    def: "The slowest runtime an algorithm can take for inputs of size n.",
    more: ["Example: Quick sort can be O(n²) in the worst case."],
  },

  // --- Properties
  {
    term: "Stable sort",
    category: "Properties",
    def: "A sorting algorithm is stable if equal items keep their original relative order after sorting.",
    more: ["Useful when sorting by multiple keys (e.g., name then grade)."],
  },
  {
    term: "Unstable sort",
    category: "Properties",
    def: "Equal items may change relative order after sorting.",
    more: ["This can matter when duplicates carry extra meaning."],
  },
  {
    term: "In-place",
    category: "Properties",
    def: "An algorithm that rearranges items mostly within the original array (uses little extra memory).",
    more: ["Often uses O(1) extra space (or small stack overhead)."],
  },
  {
    term: "Out-of-place",
    category: "Properties",
    def: "An algorithm that uses extra memory structures to produce the sorted result.",
    more: ["Merge sort commonly uses extra arrays during merging."],
  },

  // --- Concepts
  {
    term: "Iteration",
    category: "Concepts",
    def: "Repeating a set of steps using loops until a condition is met.",
    more: ["Bubble/Selection/Insertion are usually iterative."],
  },
  {
    term: "Recursion",
    category: "Concepts",
    def: "A technique where a function calls itself to solve smaller sub-problems.",
    more: ["Merge sort and quick sort are commonly recursive."],
  },
  {
    term: "Divide and conquer",
    category: "Concepts",
    def: "Solve a problem by splitting it into smaller parts, solving each part, then combining results.",
    more: ["Used by merge sort and quick sort."],
  },
  {
    term: "Subarray",
    category: "Concepts",
    def: "A contiguous section of an array (e.g., elements from index i to j).",
    more: ["Quick sort repeatedly works on subarrays."],
  },

  // --- Quick sort specific
  {
    term: "Pivot",
    category: "Quick sort",
    def: "A chosen element used to partition the array into values smaller and larger than it.",
    more: ["Pivot choice can affect performance."],
  },
  {
    term: "Partition",
    category: "Quick sort",
    def: "The step that rearranges elements so smaller values go left of the pivot and larger go right.",
    more: ["This is the core idea behind quick sort."],
  },

  // --- Merge sort specific
  {
    term: "Merge",
    category: "Merge sort",
    def: "Combining two sorted lists into a single sorted list by repeatedly taking the smallest next item.",
    more: ["The merge step is linear: O(n)."],
  },

  // --- Algorithms
  {
    term: "Bubble sort",
    category: "Algorithms",
    def: "Repeatedly compares adjacent elements and swaps them if they are in the wrong order.",
    more: ["Time: O(n²) worst/avg", "Stable: usually yes", "In-place: yes"],
  },
  {
    term: "Selection sort",
    category: "Algorithms",
    def: "Finds the smallest remaining element and places it into the next position in the array.",
    more: ["Time: O(n²)", "Stable: usually no", "In-place: yes"],
  },
  {
    term: "Insertion sort",
    category: "Algorithms",
    def: "Builds a sorted prefix by inserting each new element into its correct position.",
    more: ["Best case: O(n) on nearly-sorted data", "Stable: yes", "In-place: yes"],
  },
  {
    term: "Merge sort",
    category: "Algorithms",
    def: "Splits the array into halves, sorts each half, then merges them back together.",
    more: ["Time: O(n log n)", "Stable: yes", "Extra space: commonly yes"],
  },
  {
    term: "Quick sort",
    category: "Algorithms",
    def: "Chooses a pivot, partitions the array, then sorts the left and right parts recursively.",
    more: ["Average: O(n log n)", "Worst: O(n²)", "In-place: often yes"],
  },

  // --- Extra useful terms
  {
    term: "Nearly sorted",
    category: "Concepts",
    def: "Data that is already mostly in order, with only a few elements out of place.",
    more: ["Insertion sort can perform very well on nearly-sorted inputs."],
  },
  {
    term: "Duplicate values",
    category: "Concepts",
    def: "When the input contains repeated elements with the same value.",
    more: ["Stability matters more when duplicates exist."],
  },
  {
    term: "Pass",
    category: "Fundamentals",
    def: "One full sweep through the array (often used in bubble sort).",
    more: ["Bubble sort does multiple passes until no swaps occur."],
  },
];

// Available glossary categories shown in the filter dropdown
const CATEGORIES = [
  "All",
  "Fundamentals",
  "Complexity",
  "Properties",
  "Concepts",
  "Algorithms",
  "Quick sort",
  "Merge sort",
];

// Return the first alphabetical letter of a term for A–Z filtering
function firstLetter(s) {
  const ch = (s || "").trim().charAt(0).toUpperCase();
  return ch >= "A" && ch <= "Z" ? ch : "#";
}

// Main page component for browsing glossary terms and submitting learner feedback
export default function GlossaryFeedbackPage() {
  // --- match ModuleApp behaviour (accessibility toggles)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  // Load saved accessibility preferences from localStorage when the page opens
  useEffect(() => {
    setContrast(localStorage.getItem("sat_contrast") === "1");
    setDyslexia(localStorage.getItem("sat_dyslexia") === "1");
    setLargeText(localStorage.getItem("sat_largetext") === "1");
  }, []);

  // Apply accessibility settings to the page and save changes in localStorage
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

  // --- glossary controls
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("ALL");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(() => new Set()); // term strings in a Set

  // Build the A–Z filter options from the glossary terms
  const letters = useMemo(() => {
    const set = new Set(GLOSSARY.map((g) => firstLetter(g.term)));
    return ["ALL", ...Array.from(set).sort()];
  }, []);

  // Improved search: weighted relevance scoring to reduce unrelated matches
  // Filter and rank glossary terms based on search text, selected letter and category
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Apply letter + category filters first (keeps search cleaner)
    const base = GLOSSARY
      .filter((g) => (activeLetter === "ALL" ? true : firstLetter(g.term) === activeLetter))
      .filter((g) => (category === "All" ? true : g.category === category));

    if (!q) {
      return base.slice().sort((a, b) => a.term.localeCompare(b.term));
    }

    const scored = base
      .map((g) => {
        const term = g.term.toLowerCase();
        const def = g.def.toLowerCase();
        const more = (g.more || []).join(" ").toLowerCase();

        let score = 0;

        // Strong matches (term)
        if (term === q) score += 100;        // exact match
        if (term.startsWith(q)) score += 60; // prefix match
        if (term.includes(q)) score += 40;   // contains match

        // Medium matches (definition)
        if (def.includes(q)) score += 15;

        // Weak matches (extra info) - prevents unrelated results dominating
        if (more.includes(q)) score += 5;

        return { g, score };
      })
      // Only keep meaningful matches
      .filter((x) => x.score >= 10)
      // Sort by relevance then alphabetically
      .sort((a, b) => (b.score - a.score) || a.g.term.localeCompare(b.g.term))
      .map((x) => x.g);

    return scored;
  }, [query, activeLetter, category]);

  // Expand or collapse the extra details shown for a glossary term
  function toggleExpanded(term) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  }

  // Smoothly scroll to a page section from sidebar or quick-action buttons
  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Reset search text, filters, and expanded glossary items
  function clearAllFilters() {
    setQuery("");
    setActiveLetter("ALL");
    setCategory("All");
    setExpanded(new Set());
  }

  return (
    <>
      {/* Skip link */}
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      {/* Topbar */}
      <header className="topbar">
        <div className="brand">
        <img src={logo} alt="SortAcademy logo" className="brand-logo" />
          <span className="brand-name">SortAcademy</span>
        </div>

        <nav className="crumbs" aria-label="Main navigation">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-current="page">Glossary &amp; Feedback</li>
          </ol>
        </nav>

        <div className="actions">
          <ProfileChip />
          <button
            type="button"
            className="action-btn"
            aria-haspopup="true"
            aria-expanded={accessOpen}
            onClick={() => setAccessOpen((p) => !p)}
          >
            Accessibility ▾
          </button>

          <button
            type="button"
            className="action-btn sidebar-toggle"
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
            onClick={() => setSidebarOpen((p) => !p)}
          >
            ☰
          </button>
        </div>

        {accessOpen && (
          <div className="access-menu" role="dialog" aria-label="Accessibility options">
            <h3>Accessibility options</h3>

            <label className="access-option">
              <input type="checkbox" checked={contrast} onChange={() => setContrast((p) => !p)} />
              High contrast mode
            </label>

            <label className="access-option">
              <input type="checkbox" checked={dyslexia} onChange={() => setDyslexia((p) => !p)} />
              Dyslexia-friendly font
            </label>

            <label className="access-option">
              <input type="checkbox" checked={largeText} onChange={() => setLargeText((p) => !p)} />
              Larger text
            </label>

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

      {/* Layout */}
      <div className="layout">
        <aside
          id="sidebar"
          className={`sidebar ${sidebarOpen ? "open" : ""}`}
          aria-label="Course navigation"
        >
          <h2 className="sidebar-title">Getting started</h2>
          <ul className="toc">
            <li>
              <Link to="/module">Module overview</Link>
            </li>
            <li>
              <Link to="/what-is-sorting">What is sorting? (recap)</Link>
            </li>
            <li>
              <button type="button" className="toc-btn" onClick={() => scrollToSection("glossary")}>
                Glossary
              </button>
            </li>
          </ul>

          <h2 className="sidebar-title">Lessons</h2>
          <ul className="toc">
            <li>
              <Link to="/bubble-sort">Bubble sort</Link>
            </li>
            <li>
              <Link to="/selection-sort">Selection sort</Link>
            </li>
            <li>
              <Link to="/insertion-sort">Insertion sort</Link>
            </li>
            <li>
              <Link to="/merge-sort">Merge sort</Link>
            </li>
            <li>
              <Link to="/quick-sort">Quick sort</Link>
            </li>
          </ul>

          {/* Group 3: Interactive */}
          <h2 className="sidebar-title">Interactive</h2>
          <ul className="toc">
             <li>
                <Link to="/visualiser">Visualiser & practice</Link>
             </li>
             <li>
                 <Link to="/quiz-assessment">Quiz & Assessment</Link>
            </li>
            </ul>
          <h2 className="sidebar-title">Support</h2>
          <ul className="toc">
            <li>
              <a className="active" href="#glossary">
                Glossary &amp; Feedback
              </a>
            </li>
            <li>
              <button type="button" className="toc-btn" onClick={() => scrollToSection("feedback")}>
                Embedded feedback form
              </button>
            </li>
          </ul>
        </aside>

        <main id="main" className="content">
          <section className="card gf-hero">
            <p className="eyebrow">Support · Quick reference</p>
            <h1 className="gf-title">Glossary &amp; Learner Feedback</h1>
            <p className="tagline gf-tagline">
              Use the glossary to quickly check key terms while learning sorting algorithms. You can also leave optional,
              anonymous feedback via the embedded form.
            </p>

            <div className="btn-row">
              <button className="btn secondary" type="button" onClick={() => scrollToSection("glossary")}>
                Jump to glossary ↓
              </button>
              <button className="btn secondary" type="button" onClick={() => scrollToSection("feedback")}>
                Jump to feedback ↓
              </button>
              <Link className="btn" to="/module">
                Back to module →
              </Link>
            </div>
          </section>

          {/* GLOSSARY */}
          <section id="glossary" className="card gf-section">
            <div className="gf-head">
              <div>
                <h2>Glossary</h2>
                <p className="muted gf-muted">
                  All terms are listed by default. Use search or filters to narrow the list.
                </p>
              </div>

              <div className="gf-tip callout tip" role="note">
                <strong>Tip:</strong> If you’re new, start with <em>Algorithm</em>, <em>Big-O notation</em>, and{" "}
                <em>Stable sort</em>.
              </div>
            </div>

            <div className="gf-controls">
              <div className="gf-search">
                <label className="sr-only" htmlFor="gfSearch">
                  Search glossary
                </label>
                <input
                  id="gfSearch"
                  className="gf-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search terms (e.g., stability, pivot, O(n log n))…"
                />
                {query && (
                  <button className="gf-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search">
                    ✕
                  </button>
                )}
              </div>

              <div className="gf-filter-row">
                <div className="gf-filter">
                  <label className="gf-label" htmlFor="gfCategory">
                    Category
                  </label>
                  <select
                    id="gfCategory"
                    className="gf-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gf-filter">
                  <label className="gf-label">A–Z</label>
                  <div className="gf-chips" role="navigation" aria-label="Glossary letters">
                    {letters.map((L) => (
                      <button
                        key={L}
                        type="button"
                        className={`gf-chip ${activeLetter === L ? "active" : ""}`}
                        onClick={() => setActiveLetter(L)}
                      >
                        {L}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="gf-results" aria-live="polite">
              <span className="pill">
                📚 Showing <strong>{filtered.length}</strong> term{filtered.length === 1 ? "" : "s"}
                {category !== "All" ? (
                  <>
                    {" "}
                    in <strong>{category}</strong>
                  </>
                ) : null}
              </span>

              {query ? (
                <span className="pill">
                  🔎 Search: <strong>{query}</strong>
                </span>
              ) : null}

              {/* clear all filters */}
              {(query || category !== "All" || activeLetter !== "ALL") && (
                <button type="button" className="gf-clearall" onClick={clearAllFilters}>
                  Clear all filters
                </button>
              )}
            </div>

            <div className="gf-grid">
              {filtered.length === 0 ? (
                <div className="gf-empty">
                  <h3>No matching terms</h3>
                  <p className="muted">
                    Try a different keyword (e.g., “in-place”, “partition”, “worst case”).
                  </p>
                </div>
              ) : (
                filtered.map((g) => {
                  const isOpen = expanded.has(g.term);
                  return (
                    <article key={g.term} className="gf-term">
                      <div className="gf-term-top">
                        <h3 className="gf-term-title">{g.term}</h3>
                        <span className="gf-badge">{g.category}</span>
                      </div>

                      <p className="gf-def">{g.def}</p>

                      {g.more?.length ? (
                        <div className="gf-more">
                          <button
                            type="button"
                            className="gf-more-btn"
                            onClick={() => toggleExpanded(g.term)}
                            aria-expanded={isOpen}
                          >
                            {isOpen ? "Hide details" : "Show more"}
                          </button>

                          {isOpen && (
                            <ul className="gf-more-list">
                              {g.more.slice(0, 3).map((line, idx) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* FEEDBACK */}
          <section id="feedback" className="card gf-section">
            <h2>Learner feedback</h2>
            <p className="muted gf-muted">
              This is optional and anonymous. Please do not include personal or identifying information (e.g., name,
              email, phone). By submitting the form, you consent to your responses being used for academic evaluation
              of this project.
            </p>

            <div className="callout note gf-note">
              <strong>Privacy note:</strong> Any personal information accidentally submitted will be excluded from
              analysis and deleted.
            </div>

            <div className="gf-embed">
              <iframe
                title="SortAcademy Learner Feedback"
                src="https://docs.google.com/forms/d/e/1FAIpQLSeust2xC8snbQzl_PnShcYWs7zOLUeGMGW1d99aOWYOO325LA/viewform?usp=dialogembedded=true"

                width="100%"
                height="900"
                frameBorder="0"
                marginHeight="0"
                marginWidth="0"
              >
                Loading…
              </iframe>
            </div>

            <div className="gf-embed-help">
              <p className="muted small">If the embedded form doesn’t load, you can open it in a new tab:</p>
              <a
                className="btn secondary"
                href="https://docs.google.com/forms/d/e/1FAIpQLSeust2xC8snbQzl_PnShcYWs7zOLUeGMGW1d99aOWYOO325LA/viewform"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open feedback form →
              </a>
            </div>
          </section>
        </main>
      </div>

      <footer className="site-footer">
        <p>
          © 2025 SortAcademy · Glossary & Learner Feedback Page ·
        </p>
      </footer>
    </>
  );
}
