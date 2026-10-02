// src/SelectionSortLesson.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SelectionSortExercises from "./SelectionSortExercises"; //seperate component for 4 exercises,
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { useGuestProfile, ProfileChip } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; //general styles for lesson pages (header, layout, etc)
import "./LessonPages.css"; //styles specific to the content of the lesson (simulator, quiz, etc)

// ---------- Helper Functions ----------
// Generates a random array of integers for the simulator
function generateRandomArray(length = 7, min = 1, max = 99) {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return result;
}

// Returns null if the input is empty or contains invalid values
function parseInputArray(input) {
  if (!input.trim()) return null;
  const parts = input.split(/[, ]+/).filter(Boolean);
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n))) return null;
  return nums;
}

// Step generator for Selection Sort visualiser
// Builds a full list of algorithm states so the simulator can step forward/backward
function generateSelectionSteps(initialArray) {
  const arr = [...initialArray];
  const n = arr.length;
  const steps = [];

  // Handle empty array case
  if (n === 0) {
    steps.push({
      array: [],
      i: 0,
      j: null,
      minIndex: null,
      phase: "done",
      description: "The array is empty, nothing to sort.",
      done: true,
    });
    return steps;
  }

  steps.push({
    array: [...arr],
    i: 0,
    j: null,
    minIndex: 0,
    phase: "init",
    description:
      "Starting Selection Sort. We'll build a sorted prefix from left to right.",
    done: false,
  });

   // Only loop to n - 1 because the last element will already be in place
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;

    // Start of each pass
    steps.push({
      array: [...arr],
      i,
      j: null,
      minIndex,
      phase: "start-pass",
      description: `Pass ${i + 1}: assume index ${i} (value ${arr[i]}) is the current minimum.`,
      done: false,
    });

    // Scan the remaining unsorted region
    for (let j = i + 1; j < n; j++) {
      const currentMinVal = arr[minIndex];
      const candidateVal = arr[j];
      const isNewMin = candidateVal < currentMinVal;

      // Comparison step
      steps.push({
        array: [...arr],
        i,
        j,
        minIndex,
        phase: "scan",
        description: `Compare value ${candidateVal} at index ${j} with current minimum ${currentMinVal} at index ${minIndex}.`,
        done: false,
      });

      // Update minIndex if a smaller value is found
      if (isNewMin) {
        minIndex = j;
        steps.push({
          array: [...arr],
          i,
          j,
          minIndex,
          phase: "update-min",
          description: `Update the current minimum to value ${arr[minIndex]} at index ${minIndex}.`,
          done: false,
        });
      }
    }

    // Swap the found minimum into position i if needed
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      steps.push({
        array: [...arr],
        i,
        j: null,
        minIndex: i,
        phase: "swap",
        description: `Swap the smallest value found (now ${arr[i]}) into position ${i}.`,
        done: false,
      });
    } else {
      steps.push({
        array: [...arr],
        i,
        j: null,
        minIndex,
        phase: "no-swap",
        description:
          "The element at index i was already the smallest in the unsorted part, so no swap is needed.",
        done: false,
      });
    }
  }
  // If the current position already holds the minimum, no swap is required
  steps.push({
    array: [...arr],
    i: n,
    j: null,
    minIndex: null,
    phase: "done",
    description: "All elements are now in ascending order. Selection Sort is complete.",
    done: true,
  });

  return steps;
}

// Checks whether an array is sorted in ascending order
function isSortedAscending(array) {
  for (let i = 1; i < array.length; i++) {
    if (array[i - 1] > array[i]) return false;
  }
  return true;
}

// Exact number of comparisons Selection Sort performs for n elements
function countSelectionComparisons(n) {
  return (n * (n - 1)) / 2;
}

function approximateNLogN(n) {
  if (n <= 1) return 0;
  const log2 = Math.log2 ? Math.log2(n) : Math.log(n) / Math.log(2);
  return Math.round(n * log2);
}

// Quiz questions for Selection Sort
const SELECTION_QUIZ = [
  {
    id: 1,
    question: "What is the main idea of Selection Sort?",
    options: [
      "Repeatedly insert the next element into a sorted prefix",
      "Repeatedly merge two sorted halves of the array",
      "Repeatedly select the smallest element from the unsorted part and move it into place",
      "Repeatedly partition the array around a pivot",
    ],
    correctIndex: 2,
    explanation:
      "Selection Sort scans the unsorted part, finds the smallest element, and swaps it into the current position i.",
  },
  {
    id: 2,
    question:
      "In each pass of Selection Sort, which part of the array is guaranteed to be sorted?",
    options: [
      "Everything after index i",
      "Nothing until the final pass",
      "Only the middle elements",
      "All positions from index 0 up to i",
    ],
    correctIndex: 3,
    explanation:
      "After pass i, the element at index i is correct. Over time, the prefix [0..i] becomes sorted.",
  },
  {
    id: 3,
    question: "What is the time complexity of Selection Sort in the best, average and worst cases?",
    options: [
      "Best: O(n), Average: O(n log n), Worst: O(n²)",
      "Best: O(n²), Average: O(n²), Worst: O(n²)",
      "Best: O(1), Average: O(n), Worst: O(n log n)",
      "Best: O(n log n), Average: O(n log n), Worst: O(n²)",
    ],
    correctIndex: 1,
    explanation:
      "Selection Sort always scans the remaining unsorted items to find the minimum, so all cases are O(n²).",
  },
  {
    id: 4,
    question: "Why might someone choose Selection Sort over Bubble Sort?",
    options: [
      "It is much faster on large inputs",
      "It uses less memory than Bubble Sort",
      "It usually performs fewer swaps than Bubble Sort",
      "It is always stable while Bubble Sort is not",
    ],
    correctIndex: 2,
    explanation:
      "Selection Sort does at most n − 1 swaps, which can help when swaps are expensive, even though comparisons are still O(n²).",
  },
];

// Lesson progress key used in guest profile storage
const LESSON_KEY = "lesson_selection";
// Badge IDs used for different lesson milestones
const BADGES = Object.freeze({
  sim: "badge_selection_sim",
  warmup: "badge_selection_warmup",
  exercises: "badge_selection_exercises",
  quiz: "badge_selection_quiz",
  complete: "badge_selection_complete",
});

// Points awarded for different milestones
const POINTS = Object.freeze({
  sim: 10,
  warmup: 10,
  exercises: 20,
  quiz: 30,
  complete: 50,
});

// ---------- Main Component ----------

const SelectionSortLesson = () => {
  
  // --- Layout / accessibility ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { activeProfile, awardBadge, markLessonComplete, openSwitcher } = useGuestProfile();

  // Accessibility preference states
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Refs used to manage focus and outside-click detection for accessibility menu
  const accessBtnRef = useRef(null);
  const accessMenuRef = useRef(null);

  // Load saved accessibility settings from localStorage on first render
  useEffect(() => {
    setContrast(localStorage.getItem("sat_contrast") === "1");
    setDyslexia(localStorage.getItem("sat_dyslexia") === "1");
    setLargeText(localStorage.getItem("sat_largetext") === "1");
  }, []);

  // single effect for body classes + persistence
  useEffect(() => {
    document.body.classList.toggle("contrast", contrast);
    document.body.classList.toggle("dyslexia", dyslexia);
    document.body.classList.toggle("large-text", largeText);

    localStorage.setItem("sat_contrast", contrast ? "1" : "0");
    localStorage.setItem("sat_dyslexia", dyslexia ? "1" : "0");
    localStorage.setItem("sat_largetext", largeText ? "1" : "0");
  }, [contrast, dyslexia, largeText]);

  // close accessibility menu on Escape + outside click, restore focus
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
  // User input text for array
  const [inputValue, setInputValue] = useState("7, 3, 5, 2, 9");

  // Validation error for array input
  const [arrayError, setArrayError] = useState("");

  // Actual array used by the simulator
  const [baseArray, setBaseArray] = useState([7, 3, 5, 2, 9]);

  // Simulator settings
  const [representationMode, setRepresentationMode] = useState("bars");
  const [highlightComparisons, setHighlightComparisons] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState("normal");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = useMemo(() => generateSelectionSteps(baseArray), [baseArray]);
  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;

  // --- Concept warm-up ---
  // Array used in the card-swap warm-up
  const [conceptArray, setConceptArray] = useState([9, 4, 6, 1, 3]);

  // Which card is currently selected for swapping
  const [conceptSelectedIndex, setConceptSelectedIndex] = useState(null);

  // Feedback text for warm-up
  const [conceptFeedback, setConceptFeedback] = useState("");

  // Whether warm-up has been completed
  const [conceptCompleted, setConceptCompleted] = useState(false);

  // --- Quiz ---
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizPassed, setQuizPassed] = useState(false);

  // --- Complexity slider ---
  const [complexityN, setComplexityN] = useState(10);

  // --- Progress / completion ---
  const [simulatorTouched, setSimulatorTouched] = useState(false);

  // Completion flags reported by SelectionSortExercises
  const [ex1Done, setEx1Done] = useState(false);
  const [ex2Done, setEx2Done] = useState(false);
  const [ex3Done, setEx3Done] = useState(false);
  const [ex4Done, setEx4Done] = useState(false);

  // Controls the end-of-lesson completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ---------- Simulator logic ----------
  // Controls the end-of-lesson completion modal
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [baseArray]);

  // Autoplay effect for simulator
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

  // Award simulator badge once the simulator has been used
    useEffect(() => {
      if (!activeProfile) return;
      if (simulatorTouched) awardBadge(BADGES.sim, { points: POINTS.sim });
    }, [simulatorTouched, activeProfile, awardBadge]);
  
    // Award warm-up badge once concept builder is completed
    useEffect(() => {
      if (!activeProfile) return;
      if (conceptCompleted) awardBadge(BADGES.warmup, { points: POINTS.warmup });
    }, [conceptCompleted, activeProfile, awardBadge]);
  
    // Award exercises badge once all four exercises are completed
    useEffect(() => {
      if (!activeProfile) return;
      const exercisesDone = ex1Done && ex2Done && ex3Done && ex4Done;
      if (exercisesDone) awardBadge(BADGES.exercises, { points: POINTS.exercises });
    }, [ex1Done, ex2Done, ex3Done, ex4Done, activeProfile, awardBadge]);
  
    // Award quiz badge once quiz is passed perfectly
    useEffect(() => {
      if (!activeProfile) return;
      if (quizPassed) awardBadge(BADGES.quiz, { points: POINTS.quiz });
    }, [quizPassed, activeProfile, awardBadge]);
  

  // Applies the array typed by the user into the simulator
  const handleApplyArray = () => {
    const parsed = parseInputArray(inputValue);
    if (!parsed || parsed.length === 0) {
      setArrayError("Please enter a comma- or space-separated list of numbers (e.g. 7, 3, 5, 2, 9).");
      return;
    }
    setArrayError("");
    setBaseArray(parsed);
  };

  // Replaces the simulator array with a new random one
  const handleRandomizeArray = () => {
    const randomArr = generateRandomArray(7, 1, 99);
    setInputValue(randomArr.join(", "));
    setArrayError("");
    setBaseArray(randomArr);
  };

  // Step one simulator state forward
  const handleStepForward = () => {
    setSimulatorTouched(true);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

    // Step one simulator state backward
  const handleStepBack = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Toggle play/pause state
  const togglePlay = () => {
    setSimulatorTouched(true);
  
    // If user hits play at the end, restart first
    if (!isPlaying && currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
  
    setIsPlaying((p) => !p);
  };
  
  // Keyboard shortcuts for simulator controls
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
  
  // Sorted prefix end (for highlighting)
  const sortedPrefixEnd = useMemo(() => {
    if (!currentStep || baseArray.length === 0) return 0;
    return Math.min(currentStep.i, baseArray.length);
  }, [currentStep, baseArray.length]);

  // ---------- Concept builder logic ----------

  // Handles clicking cards in the warm-up activity
  // First click selects a card, second click swaps it with another
  const handleConceptCardClick = (index) => {
    setConceptFeedback("");
    if (conceptSelectedIndex === null) {
      setConceptSelectedIndex(index);
    } else if (conceptSelectedIndex === index) {
      setConceptSelectedIndex(null);
    } else {
      const newArr = [...conceptArray];
      [newArr[conceptSelectedIndex], newArr[index]] = [newArr[index], newArr[conceptSelectedIndex]];
      setConceptArray(newArr);
      setConceptSelectedIndex(null);
    }
  };

  // Checks whether the warm-up array is sorted
  const handleConceptCheck = () => {
    if (isSortedAscending(conceptArray)) {
      setConceptFeedback(
        "✅ Great! You arranged the numbers in ascending order. That’s what every sorting algorithm is trying to achieve."
      );
      setConceptCompleted(true);
    } else {
      setConceptFeedback(
        "⚠️ Not fully sorted yet. Try a few more swaps until the numbers go from smallest to largest."
      );
    }
  };

  // Resets the warm-up activity
  const handleConceptReset = () => {
    setConceptArray([9, 4, 6, 1, 3]);
    setConceptSelectedIndex(null);
    setConceptFeedback("");
    setConceptCompleted(false);
  };

  // ---------- Quiz ----------
  // Returns true only if every answer is correct
  const isQuizPerfect = (answers) => SELECTION_QUIZ.every((q) => answers[q.id] === q.correctIndex);

  // Handles answer changes in the quiz
  const handleQuizChange = (qId, optionIndex) => {
    setQuizAnswers((prev) => {
      const updated = { ...prev, [qId]: optionIndex };
      // If quiz has already been submitted, update pass state live
      if (quizSubmitted) {
        const perfect = isQuizPerfect(updated);
        setQuizPassed(perfect);
        if (!perfect) setShowCompletionModal(false);
      }
      return updated;
    });
  };

  // Submits the quiz and calculates score
  const handleQuizSubmit = () => {
    let score = 0;
    SELECTION_QUIZ.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) score++;
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    const perfect = score === SELECTION_QUIZ.length;
    setQuizPassed(perfect);

    if (!perfect) setShowCompletionModal(false);
  };

  // ---------- Progress ----------
  // All progress flags that count toward lesson completion

  const completedFlags = [
    simulatorTouched,
    conceptCompleted,
    ex1Done,
    ex2Done,
    ex3Done,
    ex4Done,
    quizPassed,
  ];

  // Count how many activities are complete
  const completedCount = completedFlags.filter(Boolean).length;

  // Percentage progress across all counted activities
  const progressPercent =
    completedFlags.length > 0
      ? Math.round((completedCount / completedFlags.length) * 100)
      : 0;

  // Entire lesson is complete only if every required activity is done
  const allComplete = completedFlags.every(Boolean);

  // Final completion effect
  useEffect(() => {
    if (!allComplete) return;

    // Show your nice modal
    setShowCompletionModal(true);

    // If user somehow has no profile, prompt them (rare, but safe)
    if (!activeProfile) {
      openSwitcher?.();
      return;
    }

    // Final “lesson complete” entry in progress + final points+badge
    markLessonComplete(LESSON_KEY, {
      badgeId: BADGES.complete,
      points: POINTS.complete,
    });
  }, [allComplete, activeProfile, markLessonComplete, openSwitcher]);

  // Achievement cards shown at the top of the lesson page
  const achievements = [
    {
      id: "sim",
      label: "Visualizer Explorer",
      description: "Run the Selection Sort visual simulator.",
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
      description: "Pass the Selection Sort quiz (perfect score).",
      earned: quizPassed,
      icon: "🏆",
    },
  ];

    // Total number of quiz questions
  const quizTotal = SELECTION_QUIZ.length;

  // ---------- Rendering ----------
  return (
    <>
     {/* Keyboard accessibility skip link */}
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

       {/* Top navigation bar */}
      <header className="topbar">
        <div className="brand">
        <img src={logo} alt="SortAcademy logo" className="brand-logo" />
          <span className="brand-name">SortAcademy</span>
        </div>

        {/* Breadcrumbs */}
        <nav className="crumbs" aria-label="Main navigation">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-current="page">Selection sort</li>
          </ol>
        </nav>

         {/* Top-right actions */}
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

         {/* Accessibility settings popover */}
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

            {/* Shortcut reminder inside accessibility menu */}
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

      <div className="layout">
        {/* Sidebar navigation */}
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
              <Link className="active" to="/selection-sort">
                Selection sort
              </Link>
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

        {/* Main lesson content */}
        <main id="main" className="content">
          <div className="bubble-lesson selection-lesson">
            {/* HEADER */}
            <header className="lesson-header">
              <div className="lesson-breadcrumbs">
                Algorithms &gt; Sorting &gt; Selection Sort
              </div>
              <div className="lesson-header-main">
                <div>
                  <h1>Selection Sort – Find the Smallest, Step by Step</h1>
                  <p>
                    Learn how Selection Sort repeatedly finds the smallest value in the unsorted
                    part of the list and moves it into its correct position.
                  </p>
                </div>
                {/* Lesson progress bar */}
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

            {/* GAMIFICATION */}
            <section className="lesson-gamification">
              <h2>Achievements</h2>
              <p className="gamification-intro">
                Unlock badges as you explore the visualizer, complete the exercises, and pass the
                quiz.
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

            {/* HERO */}
            <section className="lesson-hero">
              <div className="lesson-hero-text">
                <h2>Build the sorted list from left to right</h2>
                <ul>
                  <li>See how Selection Sort scans for the smallest value on each pass.</li>
                  <li>Track which part of the array is already sorted.</li>
                  <li>Practise choosing the minimum value yourself.</li>
                </ul>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const el = document.getElementById("selection-visual-simulator");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Start Selection Sort
                </button>
              </div>
              <div className="lesson-hero-preview">
                <div className="preview-array">
                  {[7, 3, 5, 2, 9].map((v, i) => (
                    <div key={i} className="preview-bar" style={{ height: `${40 + v}px` }}>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <p className="preview-caption">
                  Selection Sort repeatedly selects the smallest item in the unsorted part.
                </p>
              </div>
            </section>

            {/* WARM-UP */}
            <section className="lesson-section">
              <h2>Warm-up: sorting as re-ordering</h2>
              <p className="section-intro">
                Before focusing on the details of Selection Sort, remember that every sorting
                algorithm has the same goal: transform a jumbled list into an ordered one.
              </p>

              <div className="concept-builder">
                <div className="concept-builder-text">
                  <h3>Quick warm-up: sort these cards</h3>
                  <p>
                    Click two cards to swap them. Try to arrange the numbers from smallest to
                    largest. When you think it’s sorted, click <strong>Check</strong>.
                  </p>
                </div>
                <div className="concept-builder-interactive">
                  <div className="card-row">
                    {conceptArray.map((v, i) => (
                      <button
                        key={i}
                        className={
                          "number-card" +
                          (conceptSelectedIndex === i ? " number-card-selected" : "")
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

            {/* EXPLANATION */}
            <section className="lesson-section">
              <article className="card">
                <h2>What is Selection Sort?</h2>
                <p>
                  Selection Sort is a simple sorting algorithm that repeatedly selects the{" "}
                  <strong>smallest item</strong> from the unsorted part of the list and moves it to
                  its correct position at the front. Over time, the left-hand side of the list
                  becomes sorted.
                </p>

                <h3>How Selection Sort works</h3>
                <ol>
                  <li>Start with an index i at the beginning of the list.</li>
                  <li>
                    Assume the element at position i is the minimum, and scan the rest of the list
                    to find the true smallest value.
                  </li>
                  <li>When the scan finishes, swap the smallest value into position i.</li>
                  <li>Move i one step to the right and repeat the process.</li>
                  <li>Stop when every position has been processed.</li>
                </ol>

                <h3>Real-life analogy</h3>
                <p>
                  Imagine organising T-shirts by price. You look through every T-shirt to find the{" "}
                  <strong>cheapest</strong> one and place it at the front of the rail. Then you look
                  through the remaining ones to find the next cheapest, and so on. That is Selection
                  Sort in action.
                </p>
              </article>
            </section>

            {/* VISUAL SIMULATOR */}
            <section className="lesson-section" id="selection-visual-simulator">
              <h2>Selection Sort Visual Simulator</h2>
              <p className="section-intro">
                Watch Selection Sort build a sorted prefix from left to right. The highlighted
                elements show where we are scanning and which value is currently considered the
                minimum.
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
                        placeholder="e.g. 7, 3, 5, 2, 9"
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
                          setInputValue("7, 3, 5, 2, 9");
                          setArrayError("");
                          setBaseArray([7, 3, 5, 2, 9]);
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
                  
                    {/* Keyboard shortcut help panel */}
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
                  {/* Speed/view options */}
                    <div className="simulator-options">
                      <div className="option-group">
                        <span className="option-label">Speed:</span>
                        <label>
                          <input
                            type="radio"
                            name="sel-speed"
                            checked={animationSpeed === "slow"}
                            onChange={() => setAnimationSpeed("slow")}
                          />
                          Slow
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="sel-speed"
                            checked={animationSpeed === "normal"}
                            onChange={() => setAnimationSpeed("normal")}
                          />
                          Normal
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="sel-speed"
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
                            name="sel-view-mode"
                            checked={representationMode === "bars"}
                            onChange={() => setRepresentationMode("bars")}
                          />
                          Bars
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="sel-view-mode"
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

                  {/* Main visualisation area */}
                  <div className="simulator-visual">
                    <div className="array-visual">
                      {currentStep.array.map((v, i) => {
                        const isSortedPrefix = i < sortedPrefixEnd;
                        const isCurrentMin = currentStep.minIndex === i;
                        const isScanning = currentStep.j === i;
                        const shouldHighlight = highlightComparisons && (isCurrentMin || isScanning);

                        const classNames = [
                          "array-item",
                          representationMode === "circles" ? "array-item-circle" : "array-item-bar",
                        ];
                        if (isSortedPrefix) classNames.push("array-item-sorted");
                        if (shouldHighlight) classNames.push("array-item-comparing");

                        return (
                          <div
                            key={i}
                            className={classNames.join(" ")}
                            aria-label={`Index ${i}, value ${v}${
                              isSortedPrefix
                                ? ", already selected and sorted"
                                : isCurrentMin
                                ? ", current minimum"
                                : isScanning
                                ? ", currently being compared"
                                : ""
                            }`}
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

                    {/* Step details and variable trace */}
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
                            ? currentStep.i + 1
                            : 1}
                        </span>
                      </div>

                      <div className="simulator-step-detail">
                        <p>{currentStep.description}</p>
                      </div>

                      <div className="simulator-variables">
                        <span>
                          i (sorted prefix index) ={" "}
                          <code>{currentStep.phase === "done" ? "-" : currentStep.i ?? "-"}</code>
                        </span>
                        <span>
                          j (scan index) = <code>{currentStep.j ?? "-"}</code>
                        </span>
                        <span>
                          current min index = <code>{currentStep.minIndex ?? "-"}</code>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="simulator-right">
                  <h3>Code view &amp; trace</h3>
                  <p className="section-intro">
                    Follow which part of the Selection Sort code is active as we scan for the
                    minimum and perform swaps.
                  </p>
                  <SelectionCodeTabs currentStep={currentStep} />
                </div>
              </div>
            </section>

            {/* COMPLEXITY */}
            <section className="lesson-section">
              <h2>Time &amp; space complexity</h2>
              <div className="complexity-grid">
                <div>
                  <p>
                    Like Bubble Sort, Selection Sort is easy to understand but not very fast on large
                    inputs:
                  </p>
                  <ul>
                    <li>
                      Best-case time: <code>O(n²)</code>
                    </li>
                    <li>
                      Average-case time: <code>O(n²)</code>
                    </li>
                    <li>
                      Worst-case time: <code>O(n²)</code>
                    </li>
                    <li>
                      Space: <code>O(1)</code> (in-place)
                    </li>
                  </ul>
                  <p>
                    The key difference is that Selection Sort does at most <strong>n − 1 swaps</strong>,
                    so it swaps less often than Bubble Sort but still performs roughly the same
                    number of comparisons.
                  </p>
                </div>

                {/* Interactive complexity comparison */}
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
                      <span>Selection Sort ~ comparisons</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill bubble"
                          style={{
                            width: `${Math.min(
                              100,
                              (countSelectionComparisons(complexityN) / 1250) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">≈ {countSelectionComparisons(complexityN)}</span>
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
                    As <code>n</code> grows, <code>n²</code> grows much faster than{" "}
                    <code>n log n</code>, so Selection Sort becomes inefficient on very large lists.
                  </p>
                </div>
              </div>
            </section>

            {/* Interactive exercises component */}
            <SelectionSortExercises
              onComplete={(key) => {
                if (key === "ex1") setEx1Done(true);
                if (key === "ex2") setEx2Done(true);
                if (key === "ex3") setEx3Done(true);
                if (key === "ex4") setEx4Done(true);
              }}
            />

            {/* QUIZ */}
            <section className="lesson-section lesson-quiz" id="selection-quiz">
              <h2>Mini quiz</h2>
              <p className="section-intro">
                Check your understanding of Selection Sort’s behaviour and complexity.
              </p>

              <div className="quiz">
                {SELECTION_QUIZ.map((q) => {
                  const selected = quizAnswers[q.id];
                  let explanation = null;

                  // After submission, show whether answer was correct plus explanation
                  if (quizSubmitted) {
                    const correct = selected === q.correctIndex;
                    const correctText = q.options[q.correctIndex];
                    explanation = (
                      <div
                        className={"quiz-explanation " + (correct ? "quiz-correct" : "quiz-incorrect")}
                      >
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
                              name={`sel-quiz-${q.id}`}
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

                 {/* Quiz footer */}
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

            {/* SUMMARY */}
            <section className="lesson-section lesson-summary">
              <h2>Summary &amp; next steps</h2>

              <div className="summary-grid">
                <div>
                  <h3>Key ideas</h3>
                  <ul>
                    <li>
                      Selection Sort repeatedly finds the <strong>smallest value</strong> in the
                      unsorted part and swaps it into position <code>i</code>.
                    </li>
                    <li>
                      After pass <code>i</code>, all positions from <code>0</code> to{" "}
                      <code>i</code> are in their final sorted places.
                    </li>
                    <li>
                      Its time complexity is <code>O(n²)</code> in best, average and worst cases,
                      with in-place <code>O(1)</code> extra space.
                    </li>
                    <li>
                      It typically performs fewer swaps than Bubble Sort, but has similar overall
                      running time.
                    </li>
                  </ul>

                  <h4>Quick self-check</h4>
                  <ul>
                    <li>Can you describe what happens in each Selection Sort pass?</li>
                    <li>Can you explain why it always does O(n²) comparisons?</li>
                    <li>Can you explain one key difference between Bubble Sort and Selection Sort?</li>
                  </ul>
                </div>

                <div className="summary-next">
                  <h3>Where to go next?</h3>
                  <Link to="/bubble-sort" className="btn-secondary">
                    🔁 Review Bubble Sort
                  </Link>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("selection-visual-simulator");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    📉 Replay the visualiser
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("selection-quiz");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    ❓ Try the quiz again
                  </button>
                </div>
              </div>
            </section>

            {/* Completion modal shown after full lesson completion */}
            {showCompletionModal && (
              <div className="completion-modal-backdrop">
                <div className="completion-modal">
                  <div className="completion-trophy">🏆</div>
                  <h2>Nice work!</h2>
                  <p>You completed Selection Sort and earned <strong>{POINTS.complete}</strong> bonus points 🎉</p>
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
        <p>© 2025 SortAcademy · Selection Sort Page</p>
      </footer>
    </>
  );
};

// ---------- Code Tabs Component for Selection Sort ----------

// Renders code examples in multiple languages and highlights the active line(s)
// based on the current simulator step
const SelectionCodeTabs = ({ currentStep }) => {
  const [activeTab, setActiveTab] = useState("python");

  const highlightLine = (lineNumber) => {
    if (!currentStep) return false;
    switch (currentStep.phase) {
      case "start-pass":
        return lineNumber === 3;
      case "scan":
        return lineNumber === 4 || lineNumber === 5;
      case "update-min":
        return lineNumber === 6;
      case "swap":
        return lineNumber === 7 || lineNumber === 8;
      default:
        return lineNumber === 2;
    }
  };

  const pythonCode = [
    "def selection_sort(arr):",
    "    n = len(arr)",
    "    for i in range(n - 1):",
    "        min_index = i",
    "        for j in range(i + 1, n):",
    "            if arr[j] < arr[min_index]:",
    "                min_index = j",
    "        if min_index != i:",
    "            arr[i], arr[min_index] = arr[min_index], arr[i]",
  ];

  const javaCode = [
    "void selectionSort(int[] arr) {",
    "    int n = arr.length;",
    "    for (int i = 0; i < n - 1; i++) {",
    "        int minIndex = i;",
    "        for (int j = i + 1; j < n; j++) {",
    "            if (arr[j] < arr[minIndex]) {",
    "                minIndex = j;",
    "            }",
    "        }",
    "        if (minIndex != i) {",
    "            int temp = arr[i];",
    "            arr[i] = arr[minIndex];",
    "            arr[minIndex] = temp;",
    "        }",
    "    }",
    "}",
  ];

  const cppCode = [
    "void selectionSort(vector<int>& arr) {",
    "    int n = arr.size();",
    "    for (int i = 0; i < n - 1; i++) {",
    "        int minIndex = i;",
    "        for (int j = i + 1; j < n; j++) {",
    "            if (arr[j] < arr[minIndex]) {",
    "                minIndex = j;",
    "            }",
    "        }",
    "        if (minIndex != i) {",
    "            int temp = arr[i];",
    "            arr[i] = arr[minIndex];",
    "            arr[minIndex] = temp;",
    "        }",
    "    }",
    "}",
  ];

  const pseudoCode = [
    "procedure selectionSort(A):",
    "    n ← length(A)",
    "    for i from 0 to n - 2:",
    "        minIndex ← i",
    "        for j from i + 1 to n - 1:",
    "            if A[j] < A[minIndex]:",
    "                minIndex ← j",
    "        if minIndex ≠ i:",
    "            swap A[i] and A[minIndex]",
  ];

    // Reusable code block renderer with line highlighting
  const renderCodeBlock = (lines, baseLineNumber = 1) => (
    <pre className="code-block">
      {lines.map((line, idx) => {
        const lineNumber = baseLineNumber + idx;
        // Used to give some extra visual hinting to loops and conditions
        const isStructural =
          line.includes("for i") ||
          line.includes("for (int i") ||
          line.includes("for j") ||
          line.includes("for (int j") ||
          line.includes("if A[j]") ||
          line.includes("if arr[j]");
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

      {/* Active code block */}
      <div className="code-tabs-body">
        {activeTab === "python" && renderCodeBlock(pythonCode)}
        {activeTab === "java" && renderCodeBlock(javaCode)}
        {activeTab === "cpp" && renderCodeBlock(cppCode)}
        {activeTab === "pseudo" && renderCodeBlock(pseudoCode)}
      </div>
    </div>
  );
};

export default SelectionSortLesson;
