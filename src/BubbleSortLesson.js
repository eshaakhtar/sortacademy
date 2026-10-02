// src/BubbleSortLesson.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BubbleSortExercise from "./BubbleSortExercises";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { useGuestProfile, ProfileChip } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; // shared layout (topbar, sidebar, footer)
import "./LessonPages.css"; // LessonPages specific styles (e.g. headers, sections)

// ---------- Helper Functions ----------
// Generate a random array of numbers for the Bubble Sort simulator
function generateRandomArray(length = 7, min = 1, max = 99) {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return result;
}
// Parse a user-entered string of numbers into an array for the simulator
function parseInputArray(input) {
  if (!input.trim()) return null;
  const parts = input.split(/[, ]+/).filter(Boolean);
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n))) {
    return null;
  }
  return nums;
}

// Generate every comparison and swap step needed to animate Bubble Sort
function generateBubbleSteps(initialArray) {
  // Work on a copy so the original input array is not mutated
  const arr = [...initialArray];
  const n = arr.length;
  const steps = [];

  if (n === 0) {
    steps.push({
      array: [],
      comparing: null,
      swapped: false,
      willSwap: false,
      pass: 0,
      outerIndex: 0,
      innerIndex: 0,
      done: true,
    });
    return steps;
  }

  // Outer loop represents each Bubble Sort pass
  for (let i = 0; i < n; i++) {
    let swappedInPass = false;
    // Inner loop compares neighbouring values in the unsorted part of the array
    for (let j = 0; j < n - i - 1; j++) {
      const needSwap = arr[j] > arr[j + 1];

      // Step BEFORE doing the swap
      const stepBefore = {
        array: [...arr],
        comparing: [j, j + 1],
        swapped: false,
        willSwap: needSwap,
        pass: i,
        outerIndex: i,
        innerIndex: j,
        done: false,
      };
      steps.push(stepBefore);

      // If needed, perform the swap and add an AFTER step
      if (needSwap) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
        swappedInPass = true;

        const stepAfter = {
          array: [...arr],
          comparing: [j, j + 1],
          swapped: true,
          willSwap: false,
          pass: i,
          outerIndex: i,
          innerIndex: j,
          done: false,
        };
        steps.push(stepAfter);
      }
    }
    // Early exit optimisation
    if (!swappedInPass) break;
  }

  // Final "done" step
  steps.push({
    array: [...arr],
    comparing: null,
    swapped: false,
    willSwap: false,
    pass: n - 1,
    outerIndex: n - 1,
    innerIndex: 0,
    done: true,
  });

  return steps;
}

// Check whether an array is sorted in ascending order
function isSortedAscending(array) {
  for (let i = 1; i < array.length; i++) {
    if (array[i - 1] > array[i]) return false;
  }
  return true;
}

// Estimate the number of comparisons Bubble Sort performs in the worst case
function countBubbleComparisons(n) {
  return (n * (n - 1)) / 2;
}

// Approximate n log n to compare Bubble Sort against faster algorithms
function approximateNLogN(n) {
  if (n <= 1) return 0;
  const log2 = Math.log2 ? Math.log2(n) : Math.log(n) / Math.log(2);
  return Math.round(n * log2);
}

// Bubble Sort simulation for stats (optimised with early exit)
// Simulate an optimised Bubble Sort run and return passes, comparisons, and swaps
function simulateOptimizedBubbleSort(array) {
  const arr = [...array];
  const n = arr.length;
  let comparisons = 0;
  let passes = 0;
  let swaps = 0;

  for (let i = 0; i < n; i++) {
    let swapped = false;
    passes++;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
        swapped = true;
        swaps++;
      }
    }
    if (!swapped) break;
  }
  return { arr, passes, comparisons, swaps };
}

// Quiz questions with explanations
// Mini quiz questions used to test learner understanding of Bubble Sort
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What does Bubble Sort repeatedly do?",
    options: [
      "Finds the smallest element and puts it at the front",
      "Compares adjacent elements and swaps them if out of order",
      "Divides the array into two halves and merges them",
      "Inserts each element into a sorted prefix of the array",
    ],
    correctIndex: 1,
    explanation:
      "Bubble Sort only looks at neighbouring elements. If the left one is larger than the right one, it swaps them. Over many passes, larger values 'bubble' to the end.",
  },
  {
    id: 2,
    question: "Bubble Sort's worst-case time complexity is:",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
    correctIndex: 2,
    explanation:
      "In the worst case (e.g. a reverse-sorted list), Bubble Sort must compare and potentially swap almost every pair of neighbours on every pass, leading to about n² operations.",
  },
  {
    id: 3,
    question: "Space complexity of Bubble Sort (typical implementation) is:",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctIndex: 0,
    explanation:
      "Bubble Sort sorts the array in place: it only needs a few extra variables (like i, j and a temporary swap variable), so the extra memory stays constant regardless of input size.",
  },
  {
    id: 4,
    question: "Bubble Sort is usually considered:",
    options: [
      "Stable and in-place",
      "Unstable and not in-place",
      "Stable but not in-place",
      "Unstable but in-place",
    ],
    correctIndex: 0,
    explanation:
      "Bubble Sort only swaps when the left element is strictly greater than the right. Equal elements keep their original order (stable), and it reuses the same array (in-place).",
  },
  {
    id: 5,
    question:
      "You need to sort 1,000,000 numbers as fast as possible. Is Bubble Sort a good choice?",
    options: ["Yes, it is very fast for large n", "No, O(n²) is too slow for large n"],
    correctIndex: 1,
    explanation:
      "For very large datasets, algorithms like Merge Sort or Quick Sort (O(n log n)) are far more efficient than Bubble Sort’s O(n²) behaviour.",
  },
];

// Identifier used to store lesson completion progress
const LESSON_KEY = "lesson_bubble";

// Badge IDs awarded for completing different parts of the lesson
const BADGES = {
  sim: "badge_bubble_sim",
  warmup: "badge_bubble_warmup",
  exercises: "badge_bubble_exercises",
  quiz: "badge_bubble_quiz",
  complete: "badge_bubble_complete",
};

// Points awarded for interacting with lesson activities and completing the lesson
const POINTS = {
  sim: 10,
  warmup: 10,
  exercises: 20,
  quiz: 30,
  complete: 50,
};

// ---------- Main Component ----------
const BubbleSortLesson = () => {
  // Main Bubble Sort lesson component combining theory, simulation, exercises, quiz and progress tracking
  // --- Layout / accessibility state ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { activeProfile, awardBadge, markLessonComplete, openSwitcher } = useGuestProfile();


  useEffect(() => {
    // Load previously saved accessibility preferences from localStorage
    const savedContrast = localStorage.getItem("sat_contrast") === "1";
    const savedDyslexia = localStorage.getItem("sat_dyslexia") === "1";
    const savedLargeText = localStorage.getItem("sat_largetext") === "1";

    setContrast(savedContrast);
    setDyslexia(savedDyslexia);
    setLargeText(savedLargeText);
  }, []);

  useEffect(() => {
    // Apply accessibility preferences to the page and persist them in localStorage
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

  // --- Simulator state ---
  const [inputValue, setInputValue] = useState("5, 3, 8, 4, 2");
  const [arrayError, setArrayError] = useState("");
  const [baseArray, setBaseArray] = useState([5, 3, 8, 4, 2]);
  const [representationMode, setRepresentationMode] = useState("bars"); // 'bars' | 'circles'
  const [highlightComparisons, setHighlightComparisons] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState("normal"); // 'slow' | 'normal' | 'fast'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Precompute all animation steps whenever the base array changes
  const steps = useMemo(() => generateBubbleSteps(baseArray), [baseArray]);
  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;

  // --- Concept builder (manual mini sort) ---
  const [conceptArray, setConceptArray] = useState([7, 2, 9, 1, 5]);
  const [conceptSelectedIndex, setConceptSelectedIndex] = useState(null);
  const [conceptFeedback, setConceptFeedback] = useState("");

  // --- Stability & adaptive demo ---
  const [stabilityAnswer, setStabilityAnswer] = useState(null);
  const [stabilityFeedback, setStabilityFeedback] = useState("");
  const [adaptiveStats, setAdaptiveStats] = useState(null);

  // --- Best / worst / random presets stats ---
  const [caseStats, setCaseStats] = useState({
    best: null,
    worst: null,
    random: null,
  });

  // --- Complexity slider ---
  const [complexityN, setComplexityN] = useState(10);

  // --- Quiz ---
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // --- Lesson progress / gamification flags ---
  const [simulatorTouched, setSimulatorTouched] = useState(false);
  const [conceptCompleted, setConceptCompleted] = useState(false);

  // Exercise completion flags
  const [ex1Done, setEx1Done] = useState(false); // Predict next step
  const [ex2Done, setEx2Done] = useState(false); // Manual neighbour swaps
  const [ex3Done, setEx3Done] = useState(false); // Spot Bubble Sort
  const [ex4Done, setEx4Done] = useState(false); // Card hand sort

  const [quizPassed, setQuizPassed] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ---------- Simulator logic ----------
  // Reset the simulator whenever a new array is applied
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [baseArray]);

  useEffect(() => {
    // Advance through Bubble Sort steps automatically while playback is active
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

  // Validate and apply the user's custom input array
  const handleApplyArray = () => {
    const parsed = parseInputArray(inputValue);
    if (!parsed || parsed.length === 0) {
      setArrayError(
        "Please enter a comma- or space-separated list of numbers (e.g. 5, 3, 8, 4, 2)."
      );
      return;
    }
    setArrayError("");
    setBaseArray(parsed);
  };

  // Replace the current array with a randomly generated example
  const handleRandomizeArray = () => {
    const randomArr = generateRandomArray(7, 1, 99);
    setInputValue(randomArr.join(", "));
    setArrayError("");
    setBaseArray(randomArr);
  };

  // Move forward by one animation step
  const handleStepForward = () => {
    setSimulatorTouched(true);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  // Move backward by one animation step
  const handleStepBack = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  // Restart the simulator from the first step
  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Toggle automatic playback of the Bubble Sort animation
  const togglePlay = () => {
    setSimulatorTouched(true);

    if (!isPlaying && currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }

    setIsPlaying((p) => !p);
  };

  // Enable keyboard shortcuts for simulator control
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

  // Calculate where the sorted tail begins so completed items can be highlighted
  const sortedTailStartIndex = useMemo(() => {
    if (!currentStep || baseArray.length === 0) return baseArray.length;
    const n = baseArray.length;
    const pass = currentStep.pass || 0;
    const sortedCount = Math.min(pass, n);
    return n - sortedCount;
  }, [currentStep, baseArray.length]);

  // ---------- Best / Worst / Random presets ----------
  const handleCasePreset = (type) => {
    const length = baseArray.length || 7;
    let arr;
    if (type === "best") {
      arr = Array.from({ length }, (_, i) => i + 1);
    } else if (type === "worst") {
      arr = Array.from({ length }, (_, i) => length - i);
    } else {
      arr = generateRandomArray(length, 1, 99);
    }

    const stats = simulateOptimizedBubbleSort(arr);

    setCaseStats((prev) => ({
      ...prev,
      [type]: { type, ...stats },
    }));

    setInputValue(arr.join(", "));
    setArrayError("");
    setBaseArray(arr);
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  // ---------- Concept builder logic ----------
  // Allow learners to swap two selected cards in the warm-up sorting activity
  const handleConceptCardClick = (index) => {
    setConceptFeedback("");
    if (conceptSelectedIndex === null) {
      setConceptSelectedIndex(index);
    } else if (conceptSelectedIndex === index) {
      setConceptSelectedIndex(null);
    } else {
      const newArr = [...conceptArray];
      const tmp = newArr[conceptSelectedIndex];
      newArr[conceptSelectedIndex] = newArr[index];
      newArr[index] = tmp;
      setConceptArray(newArr);
      setConceptSelectedIndex(null);
    }
  };

  // Check whether the warm-up card sequence is sorted correctly
  const handleConceptCheck = () => {
    if (isSortedAscending(conceptArray)) {
      setConceptFeedback(
        "✅ Nice! You arranged the numbers in ascending order. That's what sorting does."
      );
      setConceptCompleted(true);
    } else {
      setConceptFeedback("⚠️ Not quite sorted yet. Try swapping a few more cards.");
    }
  };

  // Reset the warm-up activity back to its original unsorted state
  const handleConceptReset = () => {
    setConceptArray([7, 2, 9, 1, 5]);
    setConceptSelectedIndex(null);
    setConceptFeedback("");
  };

  // ---------- Stability & adaptive ----------
  // Provide feedback for the learner's answer about Bubble Sort stability
  const handleStabilityAnswer = (answer) => {
    setStabilityAnswer(answer);
    if (answer === "yes") {
      setStabilityFeedback(
        "✅ Correct. Bubble Sort is stable when it only swaps on '>' and keeps equal items in order."
      );
    } else {
      setStabilityFeedback(
        "❌ Actually, Bubble Sort is stable in its standard form because it doesn't swap equal elements."
      );
    }
  };

  // Demonstrate how optimised Bubble Sort behaves on nearly sorted versus reversed input
  const handleAdaptiveClick = (type) => {
    let arr;
    if (type === "nearly") {
      arr = [1, 2, 3, 5, 4, 6, 7];
    } else {
      arr = [7, 6, 5, 4, 3, 2, 1];
    }
    const stats = simulateOptimizedBubbleSort(arr);
    setAdaptiveStats({ type, ...stats });
  };

  // ---------- Quiz ----------
  // Check whether every quiz answer is correct
  const isQuizPerfect = (answers) =>
    QUIZ_QUESTIONS.every((q) => answers[q.id] === q.correctIndex);

  // Store the learner's selected quiz answer and update completion state if needed
  const handleQuizChange = (qId, optionIndex) => {
    setQuizAnswers((prev) => {
      const updated = { ...prev, [qId]: optionIndex };

      if (quizSubmitted) {
        const perfect = isQuizPerfect(updated);
        setQuizPassed(perfect);
        if (!perfect) setShowCompletionModal(false);
      }

      return updated;
    });
  };

  // Mark the quiz, calculate the score, and determine whether the quiz was passed perfectly
  const handleQuizSubmit = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) score++;
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    const perfect = score === QUIZ_QUESTIONS.length;
    setQuizPassed(perfect);

    if (!perfect) setShowCompletionModal(false);


  };

  const quizTotal = QUIZ_QUESTIONS.length;

  // ---------- Progress & Gamification ----------
  // Track which key lesson activities have been completed
  const completedFlags = [
    simulatorTouched,
    conceptCompleted,
    ex1Done,
    ex2Done,
    ex3Done,
    ex4Done,
    quizPassed,
  ];
  const completedCount = completedFlags.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / completedFlags.length) * 100);
  const allComplete = completedFlags.every(Boolean);

  // Award badges as the learner completes simulator, exercises, and quiz milestones
  useEffect(() => {
    if (!activeProfile) return;
    if (simulatorTouched) awardBadge(BADGES.sim, { points: POINTS.sim });
  }, [simulatorTouched, activeProfile, awardBadge]);
  
  useEffect(() => {
    if (!activeProfile) return;
    if (conceptCompleted) awardBadge(BADGES.warmup, { points: POINTS.warmup });
  }, [conceptCompleted, activeProfile, awardBadge]);
  
  useEffect(() => {
    if (!activeProfile) return;
    const exercisesDone = ex1Done && ex2Done && ex3Done && ex4Done;
    if (exercisesDone) awardBadge(BADGES.exercises, { points: POINTS.exercises });
  }, [ex1Done, ex2Done, ex3Done, ex4Done, activeProfile, awardBadge]);
  
  useEffect(() => {
    if (!activeProfile) return;
    if (quizPassed) awardBadge(BADGES.quiz, { points: POINTS.quiz });
  }, [quizPassed, activeProfile, awardBadge]);
  
  useEffect(() => {
    if (!allComplete) return;
  
    setShowCompletionModal(true);
  
    if (!activeProfile) {
      openSwitcher?.();
      return;
    }
  
    markLessonComplete(LESSON_KEY, {
      badgeId: BADGES.complete,
      points: POINTS.complete,
    });
  }, [allComplete, activeProfile, markLessonComplete, openSwitcher]);
  
  // Achievement cards displayed to the learner during the lesson
  const achievements = [
    {
      id: "sim",
      label: "Visualizer Explorer",
      description: "Run the Bubble Sort visual simulator.",
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
      description: "Pass the Bubble Sort quiz (perfect score).",
      earned: quizPassed,
      icon: "🏆",
    },
  ];

  // ---------- Rendering ----------
  return (
    <>
      {/* Skip link for keyboard users */}
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
            <li aria-current="page">Bubble sort</li>
          </ol>
        </nav>

        <div className="actions">
        <ProfileChip />
          <button
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

        {accessOpen && (
          <div className="access-menu" role="dialog" aria-label="Accessibility options">
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

      {/* Layout: sidebar + main */}
      <div className="layout">
        {/* Sidebar */}
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
              <Link to="/module#learning-outcomes">Learning outcomes</Link>
            </li>
          </ul>

          <h2 className="sidebar-title">Lessons</h2>
          <ul className="toc">
            <li>
              <Link className="active" to="/bubble-sort">
                Bubble sort
              </Link>
            </li>
            <li>
              <Link to="/selection-sort"> Selection sort</Link>
            </li>
            <li>
              <Link to="/insertion-sort"> Insertion sort</Link>
            </li>
            <li>
              <Link to="/merge-sort"> Merge sort</Link>
            </li>
            <li>
              <Link to="/quick-sort"> Quick sort</Link>
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

        {/* Main Bubble Sort lesson content */}
        <main id="main" className="content">
          <div className="bubble-lesson">
            {/* Header */}
            <header className="lesson-header">
              <div className="lesson-breadcrumbs">
                Algorithms &gt; Sorting &gt; Bubble Sort
              </div>
              <div className="lesson-header-main">
                <div>
                  <h1>Bubble Sort – Compare and Swap Neighbours</h1>
                  <p>
                    See how Bubble Sort works, step by step, and practice being the algorithm yourself.
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

            {/* Gamification / Achievements */}
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

            {/* Hero / Overview */}
            <section className="lesson-hero">
              <div className="lesson-hero-text">
                <h2>Watch items “bubble” into place</h2>
                <ul>
                  <li>Visualize each comparison and swap.</li>
                  <li>Control the speed and step through the algorithm.</li>
                  <li>Connect the animation to real code in multiple languages.</li>
                </ul>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const el = document.getElementById("bubble-visual-simulator");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Start Sorting
                </button>
              </div>
              <div className="lesson-hero-preview">
                <div className="preview-array">
                  {[5, 3, 8, 4, 2].map((v, i) => (
                    <div key={i} className="preview-bar" style={{ height: `${40 + v}px` }}>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <p className="preview-caption">A preview of Bubble Sort in action.</p>
              </div>
            </section>

            {/* Concept Builder */}
            <section className="lesson-section">
              <h2>Why sorting?</h2>
              <p className="section-intro">
                Sorting helps us organise data so we can search and analyse faster. Bubble Sort is one of
                the simplest ways to sort: it just keeps swapping out-of-order neighbours.
              </p>

              <div className="concept-builder">
                <div className="concept-builder-text">
                  <h3>Quick warm-up: sort these cards</h3>
                  <p>
                    Click two cards to swap them. Try to arrange the numbers from smallest to largest.
                    When you think it’s sorted, click <strong>Check</strong>.
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

            <section className="lesson-section">
              <article className="card">
                <h2>What is Bubble Sort?</h2>

                <p>
                  Bubble Sort is a simple sorting algorithm that repeatedly compares
                  <strong> neighbouring items </strong> and swaps them if they are in the wrong
                  order. On each pass through the list, the largest value gradually “bubbles” to the
                  end, just like a bubble rising to the surface.
                </p>

                <h3>How Bubble Sort works</h3>
                <ol>
                  <li>Start at the beginning of the list.</li>
                  <li>Compare the first two elements.</li>
                  <li>If the left value is larger, swap the two.</li>
                  <li>Move one step to the right and repeat.</li>
                  <li>After each full pass, the largest item is in its correct final position.</li>
                  <li>
                    Repeat the process until a pass completes with <strong> no swaps </strong>.
                  </li>
                </ol>

                <p>
                  This final condition acts as an optimisation: if nothing is swapped, the list is
                  already sorted.
                </p>

                <h3>Real-life analogy</h3>
                <p>
                  Think of holding a messy hand of playing cards. You can only swap cards{" "}
                  <strong> next to each other </strong>. You repeatedly correct local mistakes until
                  the whole hand becomes ordered. This is exactly how Bubble Sort behaves.
                </p>
              </article>
            </section>

            {/* Bubble Sort Visual Simulator */}
            <section className="lesson-section" id="bubble-visual-simulator">
              <h2>Bubble Sort Visual Simulator</h2>
              <p className="section-intro">
                Bubble Sort compares neighbouring elements and swaps them if they are in the wrong
                order. It repeats this until the list is sorted.
              </p>

              <div className="simulator-grid">
                {/* Left: Controls + Visual */}
                <div className="simulator-left">
                  <div className="simulator-input-panel">
                    <label className="input-label">
                      Array:
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g. 5, 3, 8, 4, 2"
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
                          setInputValue("5, 3, 8, 4, 2");
                          setArrayError("");
                          setBaseArray([5, 3, 8, 4, 2]);
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
                            if (currentStepIndex >= totalSteps - 1) {
                              setCurrentStepIndex(0);
                            }
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
                      <div
                        className="shortcuts-panel"
                        role="dialog"
                        aria-label="Keyboard shortcuts"
                      >
                        <div className="shortcuts-title">Keyboard shortcuts</div>
                        <ul className="shortcuts-list">
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
                            <kbd>R</kbd> Restart
                          </li>
                        </ul>

                        <div className="shortcuts-note">
                          Shortcuts are disabled while typing in input fields.
                        </div>
                      </div>
                    )}

                    <div className="simulator-options">
                      <div className="option-group">
                        <span className="option-label">Speed:</span>
                        <label>
                          <input
                            type="radio"
                            name="speed"
                            checked={animationSpeed === "slow"}
                            onChange={() => setAnimationSpeed("slow")}
                          />
                          Slow
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="speed"
                            checked={animationSpeed === "normal"}
                            onChange={() => setAnimationSpeed("normal")}
                          />
                          Normal
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="speed"
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
                            name="view-mode"
                            checked={representationMode === "bars"}
                            onChange={() => setRepresentationMode("bars")}
                          />
                          Bars
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="view-mode"
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
                      {currentStep.array.map((v, i) => {
                        const isComparing =
                          highlightComparisons &&
                          currentStep.comparing &&
                          (i === currentStep.comparing[0] || i === currentStep.comparing[1]);
                        const isSortedTail = i >= sortedTailStartIndex;
                        const classNames = [
                          "array-item",
                          representationMode === "circles"
                            ? "array-item-circle"
                            : "array-item-bar",
                        ];
                        if (isComparing) classNames.push("array-item-comparing");
                        if (isSortedTail) classNames.push("array-item-sorted");

                        return (
                          <div
                            key={i}
                            className={classNames.join(" ")}
                            aria-label={`Index ${i}, value ${v}${
                              isComparing ? ", being compared" : ""
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

                    <div className="simulator-step-info">
                      <div className="simulator-step-summary">
                        <span>
                          Step {currentStepIndex + 1} of {totalSteps}
                        </span>
                        <span>Pass: {currentStep.outerIndex + 1}</span>
                      </div>

                      <div className="simulator-step-detail">
                        {currentStep.done ? (
                          <p>🎉 Done! The array is sorted.</p>
                        ) : currentStep.comparing ? (
                          (() => {
                            const leftVal = currentStep.array[currentStep.comparing[0]];
                            const rightVal = currentStep.array[currentStep.comparing[1]];

                            let message;
                            if (currentStep.swapped) {
                              const bigger = Math.max(leftVal, rightVal);
                              const smaller = Math.min(leftVal, rightVal);
                              message = `→ swapped because ${bigger} was larger than ${smaller}.`;
                            } else if (currentStep.willSwap) {
                              message = `→ these are out of order; a swap will occur next because ${leftVal} is larger than ${rightVal}.`;
                            } else {
                              message =
                                "→ no swap needed; they are already in the correct order.";
                            }

                            return (
                              <p>
                                Comparing <strong>{leftVal}</strong> and{" "}
                                <strong>{rightVal}</strong> {message}
                              </p>
                            );
                          })()
                        ) : (
                          <p>Starting Bubble Sort on this array.</p>
                        )}
                      </div>

                      <div className="simulator-variables">
                        <span>
                          i (pass index) = <code>{currentStep.outerIndex}</code>
                        </span>
                        <span>
                          j (inner index) ={" "}
                          <code>
                            {currentStep.comparing ? currentStep.comparing[0] : "-"}
                          </code>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Code view */}
                <div className="simulator-right">
                  <h3>Code view &amp; trace</h3>
                  <p className="section-intro">
                    Follow which line of code is running as the algorithm compares and swaps
                    neighbours.
                  </p>
                  <CodeTabs currentStep={currentStep} />
                </div>
              </div>
            </section>

            {/* Complexity & Concepts */}
            <section className="lesson-section">
              <h2>Time &amp; space complexity</h2>
              <div className="complexity-grid">
                <div>
                  <p>Bubble Sort is easy to understand but not very fast on large inputs:</p>
                  <ul>
                    <li>
                      Worst-case time: <code>O(n²)</code>
                    </li>
                    <li>
                      Average-case time: <code>O(n²)</code>
                    </li>
                    <li>
                      Best-case time (with early exit optimisation): <code>O(n)</code>
                    </li>
                    <li>
                      Space: <code>O(1)</code> (in-place; it reuses the same array)
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
                      <span>Bubble Sort ~ comparisons</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill bubble"
                          style={{
                            width: `${Math.min(
                              100,
                              (countBubbleComparisons(complexityN) / 1250) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">
                        ≈ {countBubbleComparisons(complexityN)}
                      </span>
                    </div>

                    <div className="complexity-row">
                      <span>“Fast sort” O(n log n) ~ comparisons</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill fast"
                          style={{
                            width: `${Math.min(
                              100,
                              (approximateNLogN(complexityN) / 400) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">
                        ≈ {approximateNLogN(complexityN)}
                      </span>
                    </div>
                  </div>

                  <p className="complexity-caption">
                    As <code>n</code> grows, <code>n²</code> grows much faster than{" "}
                    <code>n log n</code>, so Bubble Sort becomes inefficient.
                  </p>
                </div>
              </div>

              {/* Best / Worst / Average presets */}
              <div className="case-presets">
                <h3>Best, worst &amp; average cases</h3>
                <p>
                  Use these presets to see how Bubble Sort behaves on already sorted, reverse sorted,
                  and random arrays. The simulator will auto-play, and we’ll record how many passes,
                  comparisons and swaps it makes.
                </p>

                <div className="case-presets-buttons">
                  <button className="btn-secondary" onClick={() => handleCasePreset("best")}>
                    Show best case (sorted)
                  </button>
                  <button className="btn-secondary" onClick={() => handleCasePreset("worst")}>
                    Show worst case (reversed)
                  </button>
                  <button className="btn-secondary" onClick={() => handleCasePreset("random")}>
                    Show random case
                  </button>
                </div>

                <div className="case-presets-table-wrapper">
                  <table className="case-presets-table">
                    <thead>
                      <tr>
                        <th>Scenario</th>
                        <th>Example array</th>
                        <th>Passes</th>
                        <th>Comparisons</th>
                        <th>Swaps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["best", "worst", "random"].map((type) => {
                        const stat = caseStats[type];
                        let label;
                        if (type === "best") label = "Best (already sorted)";
                        else if (type === "worst") label = "Worst (reverse sorted)";
                        else label = "Random (average-type)";
                        return (
                          <tr key={type}>
                            <td>{label}</td>
                            <td>{stat ? <code>{JSON.stringify(stat.arr)}</code> : "—"}</td>
                            <td>{stat ? stat.passes : "—"}</td>
                            <td>{stat ? stat.comparisons : "—"}</td>
                            <td>{stat ? stat.swaps : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Stability & Adaptive */}
            <section className="lesson-section">
              <h2>Stability &amp; adaptive behaviour</h2>
              <div className="stability-grid">
                <div className="stability-panel">
                  <h3>Is Bubble Sort stable?</h3>
                  <p>
                    Consider records sorted by <strong>score</strong>, but also carrying a name:
                  </p>
                  <div className="stability-cards">
                    <div className="stability-card">
                      <span className="stability-name">Alice</span>
                      <span className="stability-score">score 3</span>
                    </div>
                    <div className="stability-card">
                      <span className="stability-name">Bob</span>
                      <span className="stability-score">score 1</span>
                    </div>
                    <div className="stability-card">
                      <span className="stability-name">Cara</span>
                      <span className="stability-score">score 3</span>
                    </div>
                  </div>
                  <p>
                    If we sort these by score (ascending), will <strong>Alice</strong> still appear
                    before <strong>Cara</strong> among the 3s when using Bubble Sort?
                  </p>
                  <div className="stability-buttons">
                    <button
                      className={
                        "btn-secondary" + (stabilityAnswer === "yes" ? " btn-selected" : "")
                      }
                      onClick={() => handleStabilityAnswer("yes")}
                    >
                      Yes
                    </button>
                    <button
                      className={
                        "btn-secondary" + (stabilityAnswer === "no" ? " btn-selected" : "")
                      }
                      onClick={() => handleStabilityAnswer("no")}
                    >
                      No
                    </button>
                  </div>
                  {stabilityFeedback && <div className="feedback-text">{stabilityFeedback}</div>}
                </div>

                <div className="stability-panel">
                  <h3>Optimised Bubble Sort on different inputs</h3>
                  <p>
                    An optimised version of Bubble Sort stops early if a full pass makes no swaps.
                    It’s fast on nearly sorted arrays but still slow on reversed ones.
                  </p>
                  <div className="adaptive-buttons">
                    <button className="btn-secondary" onClick={() => handleAdaptiveClick("nearly")}>
                      Run on nearly sorted array
                    </button>
                    <button className="btn-secondary" onClick={() => handleAdaptiveClick("reverse")}>
                      Run on reverse sorted array
                    </button>
                  </div>
                  {adaptiveStats && (
                    <div className="adaptive-results">
                      <p>
                        Array: <code>{JSON.stringify(adaptiveStats.arr)}</code>
                      </p>
                      <p>
                        Passes: <strong>{adaptiveStats.passes}</strong>, Comparisons:{" "}
                        <strong>{adaptiveStats.comparisons}</strong>, Swaps:{" "}
                        <strong>{adaptiveStats.swaps}</strong>
                      </p>
                      <p>
                        This was a{" "}
                        <strong>
                          {adaptiveStats.type === "nearly" ? "nearly sorted" : "reverse sorted"}
                        </strong>{" "}
                        input.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Interactive Exercises (moved out) */}
            <section className="lesson-section" id="bubble-exercises">
              <h2>Interactive exercises</h2>
              <BubbleSortExercise
                onEx1Done={() => setEx1Done(true)}
                onEx2Done={() => setEx2Done(true)}
                onEx3Done={() => setEx3Done(true)}
                onEx4Done={() => setEx4Done(true)}
              />
            </section>

            {/* Quiz */}
            <section className="lesson-section lesson-quiz">
              <h2>Mini quiz</h2>
              <p className="section-intro">
                Check your understanding of Bubble Sort’s behaviour and complexity.
              </p>

              <div className="quiz">
                {QUIZ_QUESTIONS.map((q) => {
                  const selected = quizAnswers[q.id];
                  let explanation = null;

                  if (quizSubmitted) {
                    const correct = selected === q.correctIndex;
                    const correctText = q.options[q.correctIndex];
                    explanation = (
                      <div
                        className={
                          "quiz-explanation " + (correct ? "quiz-correct" : "quiz-incorrect")
                        }
                      >
                        <div>
                          {correct
                            ? "Correct!"
                            : `Not quite. The correct answer is: "${correctText}".`}
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
                              name={`quiz-${q.id}`}
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

            {/* Summary & Next steps */}
            <section className="lesson-section lesson-summary">
              <h2>Summary &amp; next steps</h2>

              <div className="summary-grid">
                <div>
                  <h3>Key ideas</h3>
                  <ul>
                    <li>
                      Bubble Sort repeatedly compares <strong>neighbouring items </strong>
                      and swaps them when they are out of order.
                    </li>
                    <li>
                      It is <strong>stable</strong> and <strong>in-place</strong>, but
                      performs about <code>n² / 2</code> comparisons in the average and
                      worst cases.
                    </li>
                    <li>
                      Best case with early exit is <code>O(n)</code>; average and worst
                      cases are <code>O(n²)</code>.
                    </li>
                    <li>
                      It’s mainly useful for <strong>teaching</strong> and for
                      <strong> very small or nearly sorted</strong> lists.
                    </li>
                  </ul>

                  <h4>Quick self-check</h4>
                  <ul>
                    <li>Can you explain Bubble Sort in one sentence?</li>
                    <li>Can you say why its worst-case is O(n²)?</li>
                    <li>Can you name one situation where Bubble Sort is a poor choice in practice?</li>
                  </ul>
                </div>

                <div className="summary-next">
                  <h3>Where to go next?</h3>

                  <button className="btn-secondary">🔁 Try Selection Sort</button>
                  <button className="btn-secondary">⚡ Compare Bubble vs Quick Sort</button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("card-sort-exercise");
                      if (el) {
                        const offset = -120;
                        const top = el.getBoundingClientRect().top + window.pageYOffset + offset;
                        window.scrollTo({ top, behavior: "smooth" });
                      }
                    }}
                  >
                    🃏 Practise with card sorting again
                  </button>
                </div>
              </div>
            </section>

            {/* Completion popup when 100% */}
            {showCompletionModal && (
              <div className="completion-modal-backdrop">
                <div className="completion-modal">
                  <div className="completion-trophy">🏆</div>
                  <h2>Congratulations!</h2>
                  <p>  You completed Bubble Sort and earned <strong>{POINTS.complete}</strong> bonus points 🎉</p>
                  <button className="btn-primary" onClick={() => setShowCompletionModal(false)}>
                    Awesome!
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <p>© 2025 SortAcademy · Bubble Sort Page</p>
      </footer>
    </>
  );
};

// ---------- Code Tabs Component ----------
const CodeTabs = ({ currentStep }) => {
  const [activeTab, setActiveTab] = useState("python");

  // Decide which logical code lines should be highlighted for the current animation step
  const highlightLine = (lineNumber) => {
    if (!currentStep) return false;
    const { comparing } = currentStep;
    if (lineNumber === 2) return true; // outer loop
    if (lineNumber === 3) return true; // inner loop
    if (lineNumber === 4 && comparing) return true; // comparison
    if (lineNumber === 5 && comparing && currentStep.swapped) return true; // swap line
    return false;
  };

  // Example Bubble Sort implementations shown in different languages
  const pythonCode = [
    "def bubble_sort(arr):",
    "    n = len(arr)",
    "    for i in range(n):",
    "        for j in range(0, n - i - 1):",
    "            if arr[j] > arr[j + 1]:",
    "                arr[j], arr[j + 1] = arr[j + 1], arr[j]",
  ];

  const javaCode = [
    "void bubbleSort(int[] arr) {",
    "    int n = arr.length;",
    "    for (int i = 0; i < n; i++) {",
    "        for (int j = 0; j < n - i - 1; j++) {",
    "            if (arr[j] > arr[j + 1]) {",
    "                int temp = arr[j];",
    "                arr[j] = arr[j + 1];",
    "                arr[j + 1] = temp;",
    "            }",
    "        }",
    "    }",
    "}",
  ];

  const cppCode = [
    "void bubbleSort(vector<int>& arr) {",
    "    int n = arr.size();",
    "    for (int i = 0; i < n; i++) {",
    "        for (int j = 0; j < n - i - 1; j++) {",
    "            if (arr[j] > arr[j + 1]) {",
    "                int temp = arr[j];",
    "                arr[j] = arr[j + 1];",
    "                arr[j + 1] = temp;",
    "            }",
    "        }",
    "    }",
    "}",
  ];

  const pseudoCode = [
    "procedure bubbleSort(A):",
    "    n ← length(A)",
    "    for i from 0 to n - 1:",
    "        for j from 0 to n - i - 2:",
    "            if A[j] > A[j + 1]:",
    "                swap A[j] and A[j + 1]",
  ];

  // Render a code block with line numbers and dynamic highlighting
  const renderCodeBlock = (lines, baseLineNumber = 1) => (
    <pre className="code-block">
      {lines.map((line, idx) => {
        const lineNumber = baseLineNumber + idx;
        const isStructural =
          line.includes("for i") ||
          line.includes("for (int i") ||
          line.includes("for i from") ||
          line.includes("for j") ||
          line.includes("for (int j") ||
          line.includes("for j from") ||
          line.includes("if A[j]") ||
          line.includes("if arr[j]");
        const approxLine =
          line.includes("for i") || line.includes("for (int i") || line.includes("for i from")
            ? 2
            : line.includes("for j") || line.includes("for (int j") || line.includes("for j from")
            ? 3
            : line.includes("if arr") || line.includes("if A[")
            ? 4
            : line.includes("swap") || line.includes("arr[j], arr[j + 1]")
            ? 5
            : lineNumber;
        const strongHighlight = highlightLine(approxLine);

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
      <div className="code-tabs-body">
        {activeTab === "python" && renderCodeBlock(pythonCode)}
        {activeTab === "java" && renderCodeBlock(javaCode)}
        {activeTab === "cpp" && renderCodeBlock(cppCode)}
        {activeTab === "pseudo" && renderCodeBlock(pseudoCode)}
      </div>
    </div>
  );
};

export default BubbleSortLesson;
