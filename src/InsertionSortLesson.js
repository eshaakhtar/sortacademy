// src/InsertionSortLesson.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import InsertionSortExercises from "./InsertionSortExercises"; // interactive exercises component
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { useGuestProfile, ProfileChip } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; // shared layout (topbar, sidebar, footer)
import "./LessonPages.css";  // LessonPages specific styles (e.g. headers, sections)

// ---------- Helper Functions ----------
// Generates a random array of integers for the visualiser
function generateRandomArray(length = 7, min = 1, max = 99) {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return result;
}

// Converts a comma- or space-separated string into an array of numbers
// Returns null if the input is invalid
function parseInputArray(input) {
  if (!input.trim()) return null;
  const parts = input.split(/[, ]+/).filter(Boolean);
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n))) return null;
  return nums;
}

// Checks whether an array is sorted in ascending order
function isSortedAscending(array) {
  for (let i = 1; i < array.length; i++) {
    if (array[i - 1] > array[i]) return false;
  }
  return true;
}

// Insertion sort step generator for the visualiser
// This creates a list of "steps" that can be replayed in the animation
function generateInsertionSteps(initialArray) {
  const arr = [...initialArray];
  const n = arr.length;
  const steps = [];

  // Special case: empty array
  if (n === 0) {
    steps.push({
      array: [],
      i: 0,
      j: null,
      key: null,
      keyIndex: null,
      phase: "done",
      description: "The array is empty, nothing to sort.",
      done: true,
    });
    return steps;
  }

  // Initial step
  steps.push({
    array: [...arr],
    i: 1,
    j: null,
    key: null,
    keyIndex: null,
    phase: "init",
    description:
      "Starting Insertion Sort. We build a sorted prefix on the left, inserting one item at a time.",
    done: false,
  });

  // Main insertion sort loop
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;

    // Step showing the selected key value
    steps.push({
      array: [...arr],
      i,
      j,
      key,
      keyIndex: i,
      phase: "pick-key",
      description: `Pick key = ${key} at index ${i}. We'll insert it into the sorted prefix [0..${i - 1}].`,
      done: false,
    });

    // Shift all larger elements one place to the right
    while (j >= 0 && arr[j] > key) {
      steps.push({
        array: [...arr],
        i,
        j,
        key,
        keyIndex: i,
        phase: "compare",
        description: `Compare key ${key} with ${arr[j]} at index ${j}. Since ${arr[j]} > ${key}, shift ${arr[j]} right.`,
        done: false,
      });

      arr[j + 1] = arr[j];

      steps.push({
        array: [...arr],
        i,
        j,
        key,
        keyIndex: i,
        phase: "shift",
        description: `Shifted ${arr[j + 1]} to index ${j + 1}. Continue moving left.`,
        done: false,
      });

      j--;
    }

    // Insert the key into its final correct position
    arr[j + 1] = key;

    steps.push({
      array: [...arr],
      i,
      j,
      key,
      keyIndex: j + 1,
      phase: "insert",
      description: `Insert key ${key} into position ${j + 1}. Prefix [0..${i}] is now sorted.`,
      done: false,
    });
  }

  // Final completed step
  steps.push({
    array: [...arr],
    i: n,
    j: null,
    key: null,
    keyIndex: null,
    phase: "done",
    description: "All elements are now in ascending order. Insertion Sort is complete.",
    done: true,
  });

  return steps;
}

// ---------- Complexity helper functions ----------
// Worst-case comparisons for insertion sort: about n(n-1)/2
function countInsertionWorstComparisons(n) {
  return (n * (n - 1)) / 2;
}

// Best-case comparisons for insertion sort: about n-1
function countInsertionBestComparisons(n) {
  return Math.max(0, n - 1);
}

// Approximation for an O(n log n) algorithm to compare against insertion sort
function approximateNLogN(n) {
  if (n <= 1) return 0;
  const log2 = Math.log2 ? Math.log2(n) : Math.log(n) / Math.log(2);
  return Math.round(n * log2);
}

// ---------- Quiz data ----------
const INSERTION_QUIZ = [
  {
    id: 1,
    question: "What is the main idea of Insertion Sort?",
    options: [
      "Swap adjacent out-of-order neighbours until sorted",
      "Repeatedly select the smallest element and move it to the front",
      "Build a sorted prefix by inserting each new element into the correct position",
      "Split the array, sort halves, then merge them",
    ],
    correctIndex: 2,
    explanation:
      "Insertion Sort grows a sorted prefix. Each new item is inserted into its correct place by shifting larger values to the right.",
  },
  {
    id: 2,
    question: "Insertion Sort is particularly fast when the input is:",
    options: ["Random", "Nearly sorted", "Reverse sorted", "Very large"],
    correctIndex: 1,
    explanation:
      "If the array is nearly sorted, each element moves only a small distance, so runtime approaches O(n).",
  },
  {
    id: 3,
    question: "Worst-case time complexity of Insertion Sort is:",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
    correctIndex: 2,
    explanation:
      "In reverse order, each element shifts across most of the sorted prefix, producing about n²/2 comparisons and shifts.",
  },
  {
    id: 4,
    question: "Insertion Sort is usually considered:",
    options: [
      "Stable and in-place",
      "Unstable and not in-place",
      "Stable but not in-place",
      "Unstable but in-place",
    ],
    correctIndex: 0,
    explanation:
      "It’s in-place (constant extra memory) and stable in the common form because equal items do not need to move ahead of each other.",
  },
];

// Lesson ID used for progress saving
const LESSON_KEY = "lesson_insertion";

// Badge IDs for gamification
const BADGES = {
  sim: "badge_insertion_sim",
  warmup: "badge_insertion_warmup",
  exercises: "badge_insertion_exercises",
  quiz: "badge_insertion_quiz",
  complete: "badge_insertion_complete",
};

// Points awarded for each activity
const POINTS = {
  sim: 10,
  warmup: 10,
  exercises: 20,
  quiz: 30,
  complete: 50,
};

const InsertionSortLesson = () => {
  // --- Layout / accessibility ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Guest profile / gamification functions
  const { activeProfile, awardBadge, markLessonComplete, openSwitcher } = useGuestProfile();

  // Accessibility toggles
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Refs used for accessibility menu interactions
  const accessBtnRef = useRef(null);
  const accessMenuRef = useRef(null);

  // Load saved accessibility settings from localStorage when component mounts
  useEffect(() => {
    setContrast(localStorage.getItem("sat_contrast") === "1");
    setDyslexia(localStorage.getItem("sat_dyslexia") === "1");
    setLargeText(localStorage.getItem("sat_largetext") === "1");
  }, []);

  // Apply accessibility classes to the body and save preferences
  useEffect(() => {
    document.body.classList.toggle("contrast", contrast);
    document.body.classList.toggle("dyslexia", dyslexia);
    document.body.classList.toggle("large-text", largeText);

    localStorage.setItem("sat_contrast", contrast ? "1" : "0");
    localStorage.setItem("sat_dyslexia", dyslexia ? "1" : "0");
    localStorage.setItem("sat_largetext", largeText ? "1" : "0");
  }, [contrast, dyslexia, largeText]);

  // Close accessibility menu with Escape or by clicking outside
  useEffect(() => {
    if (!accessOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setAccessOpen(false);
        accessBtnRef.current?.focus?.();
      }
    };

    const onPointerDown = (e) => {
      const menu = accessMenuRef.current;
      const btn = accessBtnRef.current;
      if (!menu || !btn) return;
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      setAccessOpen(false);
      accessBtnRef.current?.focus?.();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [accessOpen]);

  // --- Simulator state ---
  const [inputValue, setInputValue] = useState("8, 3, 5, 1, 9");
  const [arrayError, setArrayError] = useState("");
  const [baseArray, setBaseArray] = useState([8, 3, 5, 1, 9]);

  // Controls for simulator display and playback
  const [representationMode, setRepresentationMode] = useState("bars");
  const [highlightComparisons, setHighlightComparisons] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState("normal");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Generate steps whenever the base array changes
  const steps = useMemo(() => generateInsertionSteps(baseArray), [baseArray]);
  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;

  // --- Warm-up ---
  const [conceptArray, setConceptArray] = useState([7, 2, 9, 1, 5]);
  const [conceptSelectedIndex, setConceptSelectedIndex] = useState(null);
  const [conceptFeedback, setConceptFeedback] = useState("");
  const [conceptCompleted, setConceptCompleted] = useState(false);

  // --- Quiz ---
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizPassed, setQuizPassed] = useState(false);

  // --- Complexity slider ---
  const [complexityN, setComplexityN] = useState(10);

  // --- Progress flags ---
  const [simulatorTouched, setSimulatorTouched] = useState(false);
  const [ex1Done, setEx1Done] = useState(false);
  const [ex2Done, setEx2Done] = useState(false);
  const [ex3Done, setEx3Done] = useState(false);
  const [ex4Done, setEx4Done] = useState(false);

  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ---------- Simulator logic ----------
  // Reset simulator playback whenever a new base array is applied
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [baseArray]);

  // Controls autoplay behaviour for the simulator based on the current step and selected speed
  useEffect(() => {
    if (!isPlaying) return;

    let intervalMs = 500;
    if (animationSpeed === "slow") intervalMs = 900;
    if (animationSpeed === "fast") intervalMs = 200;

    const id = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next >= totalSteps - 1) {
          setIsPlaying(false);
          return totalSteps - 1;
        }
        return next;
      });
      setSimulatorTouched(true);
    }, intervalMs);

    return () => clearInterval(id);
  }, [isPlaying, animationSpeed, totalSteps]);

  // Award simulator badge once learner interacts with simulator
  useEffect(() => {
    if (!activeProfile) return;
    if (simulatorTouched) awardBadge(BADGES.sim, { points: POINTS.sim });
  }, [simulatorTouched, activeProfile, awardBadge]);

  // Award warm-up badge
  useEffect(() => {
    if (!activeProfile) return;
    if (conceptCompleted) awardBadge(BADGES.warmup, { points: POINTS.warmup });
  }, [conceptCompleted, activeProfile, awardBadge]);

  // Award exercise badge once all exercise flags are complete
  useEffect(() => {
    if (!activeProfile) return;
    const exercisesDone = ex1Done && ex2Done && ex3Done && ex4Done;
    if (exercisesDone) awardBadge(BADGES.exercises, { points: POINTS.exercises });
  }, [ex1Done, ex2Done, ex3Done, ex4Done, activeProfile, awardBadge]);

  // Award quiz badge after perfect score
  useEffect(() => {
    if (!activeProfile) return;
    if (quizPassed) awardBadge(BADGES.quiz, { points: POINTS.quiz });
  }, [quizPassed, activeProfile, awardBadge]);

// Applies user-entered array to simulator
  const handleApplyArray = () => {
    const parsed = parseInputArray(inputValue);
    if (!parsed || parsed.length === 0) {
      setArrayError(
        "Please enter a comma- or space-separated list of numbers (e.g. 8, 3, 5, 1, 9)."
      );
      return;
    }
    setArrayError("");
    setBaseArray(parsed);
  };

  // Generates a random array and applies it
  const handleRandomizeArray = () => {
    const randomArr = generateRandomArray(7, 1, 99);
    setInputValue(randomArr.join(", "));
    setArrayError("");
    setBaseArray(randomArr);
  };

   // Move visualiser one step forward
  const handleStepForward = () => {
    setSimulatorTouched(true);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  // Move visualiser one step backwards
  const handleStepBack = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

   // Restart visualiser from beginning
  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Toggle play / pause state
  const togglePlay = () => {
    setSimulatorTouched(true);
  
    // If play is pressed at the end, restart first
    if (!isPlaying && currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    
    setIsPlaying((p) => !p);
  };

  // Register keyboard shortcuts for simulator controls
  useKeyboardShortcuts(
    {
      Space: () => togglePlay(),
      ArrowRight: () => handleStepForward(),
      ArrowLeft: () => handleStepBack(),
      r: () => handleRestart(),
      R: () => handleRestart(),
    },
    [isPlaying, currentStepIndex, totalSteps]
  );
  
  // Sorted prefix end (Insertion: [0..i-1] sorted while processing i)
  const sortedPrefixEnd = useMemo(() => {
    if (!currentStep || baseArray.length === 0) return 1;
    if (currentStep.phase === "done") return baseArray.length;
    return Math.min(currentStep.i ?? 1, baseArray.length);
  }, [currentStep, baseArray.length]);

  // ---------- Warm-up logic ----------
   // Allows learner to click two cards to swap them
  const handleConceptCardClick = (index) => {
    setConceptFeedback("");
    if (conceptSelectedIndex === null) {
      setConceptSelectedIndex(index);
    } else if (conceptSelectedIndex === index) {
      setConceptSelectedIndex(null);
    } else {
      const newArr = [...conceptArray];
      [newArr[conceptSelectedIndex], newArr[index]] = [
        newArr[index],
        newArr[conceptSelectedIndex],
      ];
      setConceptArray(newArr);
      setConceptSelectedIndex(null);
    }
  };

    // Checks whether the warm-up array is sorted and provides feedback
  const handleConceptCheck = () => {
    if (isSortedAscending(conceptArray)) {
      setConceptFeedback(
        "✅  Great! You arranged the numbers in ascending order. That’s what every sorting algorithm is trying to achieve."
      );
      setConceptCompleted(true);
    } else {
      setConceptFeedback("⚠️ Not quite sorted yet. Try swapping a few more cards.");
    }
  };


  // Resets the warm-up task
  const handleConceptReset = () => {
    setConceptArray([7, 2, 9, 1, 5]);
    setConceptSelectedIndex(null);
    setConceptFeedback("");
    setConceptCompleted(false);
  };

  // ---------- Quiz (UPDATED to match SelectionSort behaviour) ----------
  // Returns true only if every answer is correct
  const isQuizPerfect = (answers) =>
    INSERTION_QUIZ.every((q) => answers[q.id] === q.correctIndex);

  const handleQuizChange = (qId, optionIndex) => {
    setQuizAnswers((prev) => {
      const updated = { ...prev, [qId]: optionIndex };

      // If learner already submitted once, keep quizPassed live-updating,
      // so completion popup can appear automatically after they fix answers.
      if (quizSubmitted) {
        const perfect = isQuizPerfect(updated);
        setQuizPassed(perfect);
        if (!perfect) setShowCompletionModal(false);
      }

      return updated;
    });
  };

  // Submits quiz and calculates score
  const handleQuizSubmit = () => {
    let score = 0;
    INSERTION_QUIZ.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) score++;
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    // perfect score only (100%)
    const perfect = score === INSERTION_QUIZ.length;
    setQuizPassed(perfect);

    // if they didn't get perfect, ensure the completion modal is not showing
    if (!perfect) setShowCompletionModal(false);
  };

  // ---------- Progress tracking ----------
  // Track lesson completion across simulator, warm-up, exercises and quiz
  const completedFlags = [
    simulatorTouched,
    conceptCompleted,
    ex1Done,
    ex2Done,
    ex3Done,
    ex4Done,
    quizPassed, // now only true for perfect score
  ];

  const completedCount = completedFlags.filter(Boolean).length;
   // Calculate lesson progress percentage based on completed activities
  const progressPercent =
    completedFlags.length > 0
      ? Math.round((completedCount / completedFlags.length) * 100)
      : 0;

  // True only when every activity is complete
  const allComplete = completedFlags.every(Boolean);

  // Once lesson is fully complete, show modal and save progress
  useEffect(() => {
    if (!allComplete) return;
  
    setShowCompletionModal(true);
  
    // If learner has no active profile, open profile switcher instead
    if (!activeProfile) {
      openSwitcher?.();
      return;
    }
  
    markLessonComplete(LESSON_KEY, {
      badgeId: BADGES.complete,
      points: POINTS.complete,
    });
  }, [allComplete, activeProfile, markLessonComplete, openSwitcher]);
  
  // Achievement cards shown at top of page
  const achievements = [
    {
      id: "sim",
      label: "Visualizer Explorer",
      description: "Run the Insertion Sort visual simulator.",
      earned: simulatorTouched,
      icon: "🔍",
    },
    {
      id: "concept",
      label: "Warm-up Sorter",
      description: "Complete the card sorting warm-up.",
      earned: conceptCompleted,
      icon: "🃏",
    },
    {
      id: "ex-pack",
      label: "Exercise Adventurer",
      description: "Complete all four interactive exercises.",
      earned: ex1Done && ex2Done && ex3Done && ex4Done,
      icon: "🎮",
    },
    {
      id: "quiz",
      label: "Quiz Master",
      description: "Pass the Insertion Sort quiz (perfect score).",
      earned: quizPassed,
      icon: "🏆",
    },
  ];

  const quizTotal = INSERTION_QUIZ.length;

  return (
    <>
      <a className="skip-link" href="#main">
        {/* Skip link for keyboard/screen-reader accessibility */}
        Skip to main content
      </a>

      {/* Topbar */}
      <header className="topbar">
        <div className="brand">
        <img src={logo} alt="SortAcademy logo" className="brand-logo" />
          <span className="brand-name">SortAcademy</span>
        </div>

        {/* Breadcrumb navigation */}
        <nav className="crumbs" aria-label="Main navigation">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-current="page">Insertion sort</li>
          </ol>
        </nav>

        {/* Topbar action buttons */}
        <div className="actions">
        <ProfileChip />
          <button
            ref={accessBtnRef}
            type="button"
            className="action-btn"
            aria-haspopup="true"
            aria-expanded={accessOpen}
            onClick={() => setAccessOpen((prev) => !prev)}
          >
            Accessibility ▾
          </button>

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
            ref={accessMenuRef}
            className="access-menu"
            role="dialog"
            aria-label="Accessibility options"
          >
            <h3>Accessibility options</h3>

            <label className="access-option">
              <input
                type="checkbox"
                checked={contrast}
                onChange={() => setContrast((prev) => !prev)}
              />
              High contrast mode
            </label>

            <label className="access-option">
              <input
                type="checkbox"
                checked={dyslexia}
                onChange={() => setDyslexia((prev) => !prev)}
              />
              Dyslexia-friendly font
            </label>

            <label className="access-option">
              <input
                type="checkbox"
                checked={largeText}
                onChange={() => setLargeText((prev) => !prev)}
              />
              Larger text
            </label>

            <hr className="access-sep" />

             {/* Shortcut help shown inside accessibility panel */}
            <div className="access-shortcuts" aria-label="Shortcut list">
              <div className="access-shortcuts-title">⌨ Keyboard shortcuts</div>
              <ul>
                <li>
                  <kbd>Space</kbd> Play / Pause
                </li>
                <li>
                  <kbd>→</kbd> Step Forward
                </li>
                <li>
                  <kbd>←</kbd> Step Back
                </li>
                <li>
                  <kbd>R</kbd> Reset
                </li>
              </ul>
            </div>
            
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
              <a href="/#learning-outcomes">Learning outcomes</a>
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
              <Link className="active" to="/insertion-sort">
                Insertion sort
              </Link>
            </li>
            <li>
              <Link to="/merge-sort">Merge sort</Link>
            </li>
            <li>
              <Link to="/quick-sort">Quick sort</Link>
            </li>
          </ul>

          <h2 className="sidebar-title">Interactive</h2>
          <ul className="toc">
            <li>
              <Link to="/visualiser">Visualiser &amp; practice</Link>
            </li>
            <li>
              <Link to="/quiz-assessment">Quiz & Assessment</Link>
            </li>
          </ul>

          <h2 className="sidebar-title">Support</h2>
          <ul className="toc">
            <li>
            <Link to="/glossary-feedback">Glossary & Feedback</Link>
            </li>
          </ul>
        </aside>

        <main id="main" className="content">
           {/* Main lesson content */}
          <div className="bubble-lesson insertion-lesson">
            {/* Header */}
            <header className="lesson-header">
              <div className="lesson-breadcrumbs">
                Algorithms &gt; Sorting &gt; Insertion Sort
              </div>

              <div className="lesson-header-main">
                <div>
                  <h1>Insertion Sort – Insert Items into Place</h1>
                  <p>
                    Learn how Insertion Sort grows a sorted prefix by inserting each new item into
                    the correct position.
                  </p>
                </div>

                <div className="lesson-progress">
                  <div className="lesson-progress-label">
                    Lesson progress
                    <span className="lesson-progress-value">{progressPercent}%</span>
                  </div>
                  <div className="lesson-progress-bar">
                    <div
                      className="lesson-progress-bar-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Achievement / badge section */}
            <section className="lesson-gamification">
              <h2>Achievements</h2>
              <p className="gamification-intro">
                Unlock badges as you explore the visualizer, complete exercises, and pass the quiz.
              </p>
              <div className="gamification-badges">
                {achievements.map((badge) => (
                  <div
                    key={badge.id}
                    className={
                      "badge-card" + (badge.earned ? " badge-card-earned" : " badge-card-locked")
                    }
                  >
                    <div className="badge-icon">{badge.icon}</div>
                    <div className="badge-info">
                      <div className="badge-label">{badge.label}</div>
                      <div className="badge-desc">{badge.description}</div>
                    </div>
                    <div className="badge-status">{badge.earned ? "Unlocked" : "Locked"}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Hero */}
            <section className="lesson-hero">
              <div className="lesson-hero-text">
                <h2>Grow a sorted prefix, one insertion at a time</h2>
                <ul>
                  <li>Watch the “key” item move left into its correct position.</li>
                  <li>See how shifting works instead of swapping everything.</li>
                  <li>Notice why it’s great for nearly sorted lists.</li>
                </ul>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const el = document.getElementById("insertion-visual-simulator");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Start Insertion Sort
                </button>
              </div>
              <div className="lesson-hero-preview">
                <div className="preview-array">
                  {[8, 3, 5, 1, 9].map((v, i) => (
                    <div key={i} className="preview-bar" style={{ height: `${40 + v}px` }}>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <p className="preview-caption">Insertion Sort inserts each item into place.</p>
              </div>
            </section>

            {/* Warm-up */}
            <section className="lesson-section">
              <h2>Warm-up: sorting as re-ordering</h2>
              <p className="section-intro">
                Before we dive into insertion, remember the overall goal: transform a jumbled list
                into ascending order.
              </p>

              <div className="concept-builder">
                <div className="concept-builder-text">
                  <h3>Quick warm-up: sort these cards</h3>
                  <p>
                    Click two cards to swap them. Arrange from smallest to largest, then click{" "}
                    <strong>Check</strong>.
                  </p>
                </div>

                <div className="concept-builder-interactive">
                  <div className="card-row">
                    {conceptArray.map((v, i) => (
                      <button
                        key={i}
                        className={
                          "number-card" + (conceptSelectedIndex === i ? " number-card-selected" : "")
                        }
                        onClick={() => handleConceptCardClick(i)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <div className="concept-builder-controls">
                    <button className="btn-secondary" onClick={handleConceptCheck}>
                      Check
                    </button>
                    <button className="btn-ghost" onClick={handleConceptReset}>
                      Reset
                    </button>
                  </div>

                  {conceptFeedback && <div className="feedback-text">{conceptFeedback}</div>}
                </div>
              </div>
            </section>

            {/* Explanation */}
            <section className="lesson-section">
              <article className="card">
                <h2>What is Insertion Sort?</h2>
                <p>
                  Insertion Sort is a simple algorithm that builds a sorted section on the left.
                  It takes the next item (the <strong>key</strong>) and inserts it into the correct
                  position by <strong>shifting bigger items right</strong>.
                </p>

                <h3>How Insertion Sort works</h3>
                <ol>
                  <li>Start from index 1 (treat index 0 as a sorted prefix of length 1).</li>
                  <li>Pick the key = A[i].</li>
                  <li>Move left through the sorted prefix while elements are larger than the key.</li>
                  <li>Shift those larger elements one position right.</li>
                  <li>Insert the key into the gap that opens.</li>
                </ol>

                <h3>Real-life analogy</h3>
                <p>
                  Imagine sorting exam papers by score as they arrive. Each new paper gets inserted
                  into the right spot among the already-sorted stack. If it belongs near the front,
                  you slide the others down and insert it.
                </p>
              </article>
            </section>

            {/* Visual simulator */}
            <section className="lesson-section" id="insertion-visual-simulator">
              <h2>Insertion Sort Visual Simulator</h2>
              <p className="section-intro">
                Watch Insertion Sort grow a sorted prefix. The algorithm picks a key and shifts
                larger values right until it can insert the key.
              </p>

              <div className="simulator-grid">
                <div className="simulator-left">
                  <div className="simulator-input-panel">
                    <label className="input-label">
                      Array:
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g. 8, 3, 5, 1, 9"
                      />
                    </label>
                    {arrayError && <div className="input-error">{arrayError}</div>}
                    <div className="simulator-input-buttons">
                      <button className="btn-secondary" onClick={handleApplyArray}>
                        Apply
                      </button>
                      <button className="btn-ghost" onClick={handleRandomizeArray}>
                        Randomize
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          setInputValue("8, 3, 5, 1, 9");
                          setArrayError("");
                          setBaseArray([8, 3, 5, 1, 9]);
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="simulator-controls">
                    <div className="simulator-buttons">
                      <button
                        className="btn-icon"
                        onClick={handleStepBack}
                        disabled={currentStepIndex === 0}
                      >
                        ◀ Step back
                      </button>

                      {isPlaying ? (
                        <button className="btn-primary" onClick={() => setIsPlaying(false)}>
                          ❚❚ Pause
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => {
                            if (currentStepIndex >= totalSteps - 1) setCurrentStepIndex(0);
                            setIsPlaying(true);
                          }}
                        >
                          ▶ Play
                        </button>
                      )}

                      <button
                        className="btn-icon"
                        onClick={handleStepForward}
                        disabled={currentStepIndex >= totalSteps - 1}
                      >
                        Step forward ▶
                      </button>

                      <button className="btn-ghost" onClick={handleRestart}>
                        ⟲ Restart
                      </button>
                      <button
                        className="btn-ghost"
                        type="button"
                        aria-expanded={shortcutsOpen}
                        aria-haspopup="dialog"
                        onClick={() => setShortcutsOpen((p) => !p)}
                      >
                         ⌨ Shortcuts
                      </button>
                    </div>

                    {shortcutsOpen && (
                     <div className="shortcuts-panel" role="dialog" aria-label="Keyboard shortcuts">
                     <div className="shortcuts-title">Keyboard shortcuts</div>
                      <ul className="shortcuts-list">
                        <li><kbd>Space</kbd> Play / Pause</li>
                        <li><kbd>→</kbd> Step Forward</li>
                        <li><kbd>←</kbd> Step Back</li>
                        <li><kbd>R</kbd> Restart</li>
                     </ul>
                        <div className="shortcuts-note">Shortcuts won’t trigger while typing in inputs.</div>
                  </div>
                  )}
                    <div className="simulator-options">
                      <div className="option-group">
                        <span className="option-label">Speed:</span>
                        <label>
                          <input
                            type="radio"
                            name="ins-speed"
                            checked={animationSpeed === "slow"}
                            onChange={() => setAnimationSpeed("slow")}
                          />
                          Slow
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="ins-speed"
                            checked={animationSpeed === "normal"}
                            onChange={() => setAnimationSpeed("normal")}
                          />
                          Normal
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="ins-speed"
                            checked={animationSpeed === "fast"}
                            onChange={() => setAnimationSpeed("fast")}
                          />
                          Fast
                        </label>
                      </div>

                      <div className="option-group">
                        <span className="option-label">View:</span>
                        <label>
                          <input
                            type="radio"
                            name="ins-view"
                            checked={representationMode === "bars"}
                            onChange={() => setRepresentationMode("bars")}
                          />
                          Bars
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="ins-view"
                            checked={representationMode === "circles"}
                            onChange={() => setRepresentationMode("circles")}
                          />
                          Circles
                        </label>
                      </div>

                      <label className="option-group checkbox">
                        <input
                          type="checkbox"
                          checked={highlightComparisons}
                          onChange={(e) => setHighlightComparisons(e.target.checked)}
                        />
                        Highlight comparisons
                      </label>
                    </div>
                  </div>

                  <div className="simulator-visual">
                    <div className="array-visual">
                      {currentStep.array.map((v, idx) => {
                        const isSortedPrefix = idx < sortedPrefixEnd;

                        const isJ =
                          highlightComparisons &&
                          (currentStep.phase === "compare" || currentStep.phase === "shift") &&
                          currentStep.j === idx;

                        const isKey =
                          highlightComparisons &&
                          (currentStep.phase === "pick-key" ||
                            currentStep.phase === "compare" ||
                            currentStep.phase === "shift" ||
                            currentStep.phase === "insert") &&
                          currentStep.keyIndex === idx;

                        const classNames = [
                          "array-item",
                          representationMode === "circles" ? "array-item-circle" : "array-item-bar",
                        ];

                        if (isSortedPrefix) classNames.push("array-item-sorted");
                        if (isJ || isKey) classNames.push("array-item-comparing");

                        return (
                          <div
                            key={idx}
                            className={classNames.join(" ")}
                            aria-label={`Index ${idx}, value ${v}${
                              isSortedPrefix ? ", in sorted prefix" : ""
                            }${isKey ? ", key item" : ""}${isJ ? ", being compared" : ""}`}
                          >
                            {representationMode === "bars" && (
                              <div
                                className="array-item-bar-inner"
                                style={{ height: `${20 + v * 1.2}px` }}
                              />
                            )}
                            <span className="array-item-value">{v}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="simulator-step-info">
                      <div className="simulator-step-summary">
                        <span>
                          Step {currentStepIndex + 1} of {totalSteps}
                        </span>
                        <span>
                          Pass:{" "}
                          {currentStep.phase === "done"
                            ? "-"
                            : currentStep.i !== null
                            ? currentStep.i ?? 1
                            : 1}
                        </span>
                      </div>

                      <div className="simulator-step-detail">
                        <p>{currentStep.description}</p>
                      </div>

                      <div className="simulator-variables">
                        <span>
                          i (key index) ={" "}
                          <code>{currentStep.phase === "done" ? "-" : currentStep.i ?? "-"}</code>
                        </span>
                        <span>
                          j (scan left) = <code>{currentStep.j ?? "-"}</code>
                        </span>
                        <span>
                          key = <code>{currentStep.key ?? "-"}</code>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right panel: code trace */}
                <div className="simulator-right">
                  <h3>Code view &amp; trace</h3>
                  <p className="section-intro">
                    Follow which part of the Insertion Sort code is active as we shift and insert.
                  </p>
                  <InsertionCodeTabs currentStep={currentStep} />
                </div>
              </div>
            </section>

            {/* Complexity */}
            <section className="lesson-section">
              <h2>Time &amp; space complexity</h2>

              <div className="complexity-grid">
                <div>
                  <p>
                    Insertion Sort is often faster than Bubble/Selection on nearly sorted inputs,
                    but can still be slow in the worst case:
                  </p>
                  <ul>
                    <li>
                      Best-case time (already sorted): <code>O(n)</code>
                    </li>
                    <li>
                      Average-case time: <code>O(n²)</code>
                    </li>
                    <li>
                      Worst-case time (reverse sorted): <code>O(n²)</code>
                    </li>
                    <li>
                      Space: <code>O(1)</code> (in-place)
                    </li>
                  </ul>
                </div>

                <div className="complexity-interactive">
                  <label className="input-label">
                    List size n: <strong>{complexityN}</strong>
                    <input
                      type="range"
                      min="4"
                      max="50"
                      value={complexityN}
                      onChange={(e) => setComplexityN(Number(e.target.value))}
                    />
                  </label>

                  <div className="complexity-bars">
                    <div className="complexity-row">
                      <span>Insertion Sort ~ worst-case comparisons</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill bubble"
                          style={{
                            width: `${Math.min(
                              100,
                              (countInsertionWorstComparisons(complexityN) / 1250) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">≈ {countInsertionWorstComparisons(complexityN)}</span>
                    </div>

                    <div className="complexity-row">
                      <span>Insertion Sort ~ best-case comparisons</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill fast"
                          style={{
                            width: `${Math.min(
                              100,
                              (countInsertionBestComparisons(complexityN) / 400) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">≈ {countInsertionBestComparisons(complexityN)}</span>
                    </div>

                    <div className="complexity-row">
                      <span>“Fast sort” O(n log n) ~ comparisons</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill fast"
                          style={{
                            width: `${Math.min(100, (approximateNLogN(complexityN) / 400) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">≈ {approximateNLogN(complexityN)}</span>
                    </div>
                  </div>

                  <p className="complexity-caption">
                    Insertion Sort can be close to <code>O(n)</code> when the list is nearly sorted,
                    but can degrade to <code>O(n²)</code> when items must move far.
                  </p>
                </div>
              </div>
            </section>

            {/* Exercises */}
            <InsertionSortExercises
              onComplete={(key) => {
                if (key === "ex1") setEx1Done(true);
                if (key === "ex2") setEx2Done(true);
                if (key === "ex3") setEx3Done(true);
                if (key === "ex4") setEx4Done(true);
              }}
            />

            {/* Quiz */}
            <section className="lesson-section lesson-quiz" id="insertion-quiz">
              <h2>Mini quiz</h2>
              <p className="section-intro">
                Check your understanding of Insertion Sort’s behaviour and complexity.
              </p>

              <div className="quiz">
                {INSERTION_QUIZ.map((q) => {
                  const selected = quizAnswers[q.id];
                  let explanation = null;

                  if (quizSubmitted) {
                    const correct = selected === q.correctIndex;
                    const correctText = q.options[q.correctIndex];
                    explanation = (
                      <div className={"quiz-explanation " + (correct ? "quiz-correct" : "quiz-incorrect")}>
                        <div>
                          {correct ? "Correct!" : `Not quite. The correct answer is: "${correctText}".`}
                        </div>
                        <div className="quiz-explanation-detail">{q.explanation}</div>
                      </div>
                    );
                  }

                  return (
                    <div key={q.id} className="quiz-question">
                      <p className="quiz-question-text">
                        {q.id}. {q.question}
                      </p>
                      <div className="quiz-options">
                        {q.options.map((opt, idx) => (
                          <label key={idx} className="quiz-option">
                            <input
                              type="radio"
                              name={`ins-quiz-${q.id}`}
                              checked={selected === idx}
                              onChange={() => handleQuizChange(q.id, idx)}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                      {explanation}
                    </div>
                  );
                })}

                <div className="quiz-footer">
                  <button className="btn-primary" onClick={handleQuizSubmit}>
                    Submit quiz
                  </button>
                  {quizSubmitted && (
                    <div className="quiz-score">
                      Score: {quizScore} / {quizTotal} {quizPassed ? "🎉 Great job!" : "Keep practising!"}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Summary */}
            <section className="lesson-section lesson-summary">
              <h2>Summary &amp; next steps</h2>

              <div className="summary-grid">
                <div>
                  <h3>Key ideas</h3>
                  <ul>
                    <li>
                      Insertion Sort builds a <strong>sorted prefix</strong> on the left.
                    </li>
                    <li>
                     Each pass picks a <strong>key</strong> and shifts larger items right to insert it into the correct position in the sorted prefix.
                    </li>
                    <li>
                      Best-case is <code>O(n)</code> when nearly sorted; worst-case is <code>O(n²)</code>.
                    </li>
                    <li>
                      It is <strong>stable</strong> and <strong>in-place</strong> in typical implementations.
                    </li>
                  </ul>

                  <h4>Quick self-check</h4>
                  <ul>
                    <li>What is the key in insertion sort, and where does it come from?</li>
                    <li>Why does insertion sort use shifting instead of swapping?</li>
                    <li>What happens to the number of shifts when the array is nearly sorted?</li>
                  </ul>
                </div>

                <div className="summary-next">
                  <h3>Where to go next?</h3>
                  <Link to="/selection-sort" className="btn-secondary">
                    🔁 Review Selection Sort
                  </Link>
                  <Link to="/bubble-sort" className="btn-secondary">
                    🫧 Review Bubble Sort
                  </Link>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("insertion-visual-simulator");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    📉 Replay the visualiser
                  </button>
                </div>
              </div>
            </section>

            {/* Completion modal */}
            {showCompletionModal && (
              <div className="completion-modal-backdrop">
                <div className="completion-modal">
                  <div className="completion-trophy">🏆</div>
                  <h2>Nice work!</h2>
                  <p>You completed Insertion Sort and earned <strong>{POINTS.complete}</strong> bonus points 🎉</p>
                  <button className="btn-primary" onClick={() => setShowCompletionModal(false)}>
                    Well done!
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="site-footer">
        <p>© 2025 SortAcademy · Insertion Sort Page</p>
      </footer>
    </>
  );
};

// ---------- Code Tabs (Insertion Sort) ----------
const InsertionCodeTabs = ({ currentStep }) => {
// Track which language tab is currently selected
  const [activeTab, setActiveTab] = useState("python");

  // Highlights lines depending on the current simulator step
  const highlightLine = (lineNumber) => {
    if (!currentStep) return false;

    // Simple mapping by phase
    switch (currentStep.phase) {
      case "pick-key":
        return lineNumber === 3 || lineNumber === 4;
      case "compare":
        return lineNumber === 5 || lineNumber === 6;
      case "shift":
        return lineNumber === 6;
      case "insert":
        return lineNumber === 7;
      default:
        return lineNumber === 2;
    }
  };

  // Code for each language as arrays of lines
  const pythonCode = [
    "def insertion_sort(arr):",
    "    n = len(arr)",
    "    for i in range(1, n):",
    "        key = arr[i]",
    "        j = i - 1",
    "        while j >= 0 and arr[j] > key:",
    "            arr[j + 1] = arr[j]",
    "            j -= 1",
    "        arr[j + 1] = key",
  ];

  const javaCode = [
    "void insertionSort(int[] arr) {",
    "    for (int i = 1; i < arr.length; i++) {",
    "        int key = arr[i];",
    "        int j = i - 1;",
    "        while (j >= 0 && arr[j] > key) {",
    "            arr[j + 1] = arr[j];",
    "            j--;",
    "        }",
    "        arr[j + 1] = key;",
    "    }",
    "}",
  ];

  const cppCode = [
    "void insertionSort(vector<int>& arr) {",
    "    for (int i = 1; i < (int)arr.size(); i++) {",
    "        int key = arr[i];",
    "        int j = i - 1;",
    "        while (j >= 0 && arr[j] > key) {",
    "            arr[j + 1] = arr[j];",
    "            j--;",
    "        }",
    "        arr[j + 1] = key;",
    "    }",
    "}",
  ];

  const pseudoCode = [
    "procedure insertionSort(A):",
    "    for i from 1 to length(A) - 1:",
    "        key ← A[i]",
    "        j ← i - 1",
    "        while j ≥ 0 and A[j] > key:",
    "            A[j + 1] ← A[j]",
    "            j ← j - 1",
    "        A[j + 1] ← key",
  ];

   // Reusable code block renderer with line numbers and highlighting
  const renderCodeBlock = (lines, baseLineNumber = 1) => (
    <pre className="code-block">
      {lines.map((line, idx) => {
        const lineNumber = baseLineNumber + idx;
         // Structural lines are lightly hinted for readability
        const isStructural =
          line.includes("for i") ||
          line.includes("for (int i") ||
          line.includes("while") ||
          line.includes("if") ||
          line.includes("key") ||
          line.includes("j");
        const strongHighlight = highlightLine(lineNumber);

        return (
          <div
            key={idx}
            className={
              "code-line" +
              (strongHighlight ? " code-line-active" : isStructural ? " code-line-hinted" : "")
            }
          >
            <span className="code-line-number">{lineNumber}</span>
            <span className="code-line-text">{line}</span>
          </div>
        );
      })}
    </pre>
  );

  return (
    <div className="code-tabs">
      <div className="code-tabs-header">
        <button
          className={activeTab === "python" ? "code-tab code-tab-active" : "code-tab"}
          onClick={() => setActiveTab("python")}
        >
          Python
        </button>
        <button
          className={activeTab === "java" ? "code-tab code-tab-active" : "code-tab"}
          onClick={() => setActiveTab("java")}
        >
          Java
        </button>
        <button
          className={activeTab === "cpp" ? "code-tab code-tab-active" : "code-tab"}
          onClick={() => setActiveTab("cpp")}
        >
          C++
        </button>
        <button
          className={activeTab === "pseudo" ? "code-tab code-tab-active" : "code-tab"}
          onClick={() => setActiveTab("pseudo")}
        >
          Pseudocode
        </button>
      </div>

     {/* Display currently selected code tab */}
      <div className="code-tabs-body">
        {activeTab === "python" && renderCodeBlock(pythonCode)}
        {activeTab === "java" && renderCodeBlock(javaCode)}
        {activeTab === "cpp" && renderCodeBlock(cppCode)}
        {activeTab === "pseudo" && renderCodeBlock(pseudoCode)}
      </div>
    </div>
  );
};
// Export the lesson component
export default InsertionSortLesson;
