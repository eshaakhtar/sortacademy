// src/MergeSortLesson.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MergeSortExercises from "./MergeSortExercises"; // interactive exercises component
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { useGuestProfile, ProfileChip } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; // shared layout (topbar, sidebar, footer)
import "./LessonPages.css"; // specific styles for lesson pages (hero, sections, etc.)

// ---------- Helper Functions ----------
// Generates a random array of integers for the simulator
function generateRandomArray(length = 8, min = 1, max = 99) {
  const result = [];
  for (let i = 0; i < length; i++)
    result.push(Math.floor(Math.random() * (max - min + 1)) + min);
  return result;
}

// Converts a comma- or space-separated string into an array of numbers
// Returns null if any value is invalid
function parseInputArray(input) {
  if (!input.trim()) return null;
  const parts = input.split(/[, ]+/).filter(Boolean);
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n))) return null;
  return nums;
}

// ---------- Merge sort step generator (visualiser) ----------
// Creates a detailed list of Merge Sort steps so the algorithm can be visualised step by step
function generateMergeSteps(initialArray) {
  const steps = [];
  const original = [...initialArray];

   // Special case: empty array
  if (original.length === 0) {
    steps.push({
      array: [],
      phase: "done",
      description: "The array is empty, nothing to sort.",
      done: true,
      focus: null,
      left: null,
      right: null,
      merged: null,
      range: null,
      depth: 0,
    });
    return steps;
  }

  // Initial explanation step
  steps.push({
    array: [...original],
    phase: "init",
    description:
      "Starting Merge Sort. We’ll repeatedly split the list into halves, then merge sorted halves back together.",
    done: false,
    focus: null,
    left: null,
    right: null,
    merged: null,
    range: { l: 0, r: original.length - 1 },
    depth: 0,
  });

  // Working copy used during step generation
  const arr = [...original];

  // Helper function to merge two sorted halves [l..m] and [m+1..r]
  function merge(l, m, r, depth) {
    const left = arr.slice(l, m + 1);
    const right = arr.slice(m + 1, r + 1);

    // Step showing merge start with both halves visible
    steps.push({
      array: [...arr],
      phase: "merge-start",
      description: `Merge step: combine two sorted halves [${l}..${m}] and [${m + 1}..${r}].`,
      done: false,
      focus: { l, m, r, i: 0, j: 0 },
      left: [...left],
      right: [...right],
      merged: [],
      range: { l, r },
      depth,
    });

    let i = 0;
    let j = 0;
    const merged = [];

    // Compare the front of left and right arrays, always taking the smaller item
    while (i < left.length && j < right.length) {
      steps.push({
        array: [...arr],
        phase: "merge-compare",
        description: `Compare fronts: left=${left[i]} vs right=${right[j]}. Take the smaller.`,
        done: false,
        focus: { l, m, r, i, j },
        left: [...left],
        right: [...right],
        merged: [...merged],
        range: { l, r },
        depth,
      });

      if (left[i] <= right[j]) {
        merged.push(left[i]);

        // Taking from the left when values are equal preserves stability
        steps.push({
          array: [...arr],
          phase: "merge-take-left",
          description: `Take ${left[i]} from LEFT (≤ keeps merge stable).`,
          done: false,
          focus: { l, m, r, took: "left", value: left[i], i, j },
          left: [...left],
          right: [...right],
          merged: [...merged],
          range: { l, r },
          depth,
        });
        i++;
      } else {
        merged.push(right[j]);

        // Taking from the right when it is smaller
        steps.push({
          array: [...arr],
          phase: "merge-take-right",
          description: `Take ${right[j]} from RIGHT.`,
          done: false,
          focus: { l, m, r, took: "right", value: right[j], i, j },
          left: [...left],
          right: [...right],
          merged: [...merged],
          range: { l, r },
          depth,
        });
        j++;
      }
    }

    // Copy any remaining values from the left side
    while (i < left.length) {
      merged.push(left[i]);
      steps.push({
        array: [...arr],
        phase: "merge-copy-rest",
        description: `Right side is empty. Copy remaining LEFT value ${left[i]}.`,
        done: false,
        focus: { l, m, r, took: "left", value: left[i], i, j },
        left: [...left],
        right: [...right],
        merged: [...merged],
        range: { l, r },
        depth,
      });
      i++;
    }

    // Copy any remaining values from the right side
    while (j < right.length) {
      merged.push(right[j]);
      steps.push({
        array: [...arr],
        phase: "merge-copy-rest",
        description: `Left side is empty. Copy remaining RIGHT value ${right[j]}.`,
        done: false,
        focus: { l, m, r, took: "right", value: right[j], i, j },
        left: [...left],
        right: [...right],
        merged: [...merged],
        range: { l, r },
        depth,
      });
      j++;
    }

    // Write merged values back into the main array
    for (let k = 0; k < merged.length; k++) {
      arr[l + k] = merged[k];
    }

    // Step showing completed merge for the current range
    steps.push({
      array: [...arr],
      phase: "merged",
      description: `Merged range [${l}..${r}] is now sorted.`,
      done: false,
      focus: { l, r },
      left: [...left],
      right: [...right],
      merged: [...merged],
      range: { l, r },
      depth,
    });
  }

  // Recursive helper function for Merge Sort
  function sort(l, r, depth) {
    // Base case: one element is already sorted
    if (l >= r) {
      steps.push({
        array: [...arr],
        phase: "base",
        description: `Base case reached: subarray [${l}..${r}] has 1 element → already sorted.`,
        done: false,
        focus: { l, r },
        left: null,
        right: null,
        merged: null,
        range: { l, r },
        depth,
      });
      return;
    }

    const m = Math.floor((l + r) / 2);

    // Step showing the split into two halves
    steps.push({
      array: [...arr],
      phase: "split",
      description: `Split range [${l}..${r}] into halves: [${l}..${m}] and [${m + 1}..${r}].`,
      done: false,
      focus: { l, m, r },
      left: null,
      right: null,
      merged: null,
      range: { l, r },
      depth,
    });

    // Recursively sort left half
    sort(l, m, depth + 1);

    // Recursively sort right half
    sort(m + 1, r, depth + 1);

     // Merge the two sorted halves
    merge(l, m, r, depth);
  }

  // Start recursive sorting on the full array
  sort(0, arr.length - 1, 0);

  // Final completion step
  steps.push({
    array: [...arr],
    phase: "done",
    description: "All elements are now in ascending order. Merge Sort is complete.",
    done: true,
    focus: { l: 0, r: arr.length - 1 },
    left: null,
    right: null,
    merged: null,
    range: { l: 0, r: arr.length - 1 },
    depth: 0,
  });

  return steps;
}

// Complexity helpers
// Approximates n log n for visual complexity comparisons
function approximateNLogN(n) {
  if (n <= 1) return 0;
  const log2 = Math.log2 ? Math.log2(n) : Math.log(n) / Math.log(2);
  return Math.round(n * log2);
}

// Approximate Merge Sort comparison count for n items (used in complexity slider)
function approxMergeSortComparisons(n) {
  return approximateNLogN(n);
}

// ---------- Quiz data ----------
const MERGE_QUIZ = [
  {
    id: 1,
    question: "What is the key idea behind Merge Sort?",
    options: [
      "Repeatedly swap adjacent out-of-order neighbours",
      "Divide the array into halves, sort them, then merge sorted halves",
      "Repeatedly select the smallest element and move it to the front",
      "Insert each new item into a growing sorted prefix",
    ],
    correctIndex: 1,
    explanation:
      "Merge Sort uses divide-and-conquer: split into halves until base cases, then merge sorted halves back together.",
  },
  {
    id: 2,
    question: "Why is the merge step considered linear time?",
    options: [
      "Because it sorts each half in constant time",
      "Because it only compares the first and last elements",
      "Because each element is moved into the merged list exactly once",
      "Because it uses nested loops",
    ],
    correctIndex: 2,
    explanation:
      "In merging, you scan the two lists from the front; each item is taken once, so the work is proportional to total items.",
  },
  {
    id: 3,
    question: "Merge Sort’s typical time complexity is:",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
    correctIndex: 1,
    explanation:
      "The split creates log n levels of recursion, and each level does O(n) merging work → O(n log n).",
  },
  {
    id: 4,
    question: "Merge Sort is stable when implemented correctly because:",
    options: [
      "It never compares equal values",
      "It always takes from the right half first",
      "When values are equal, it takes from the left half first",
      "It swaps elements in place",
    ],
    correctIndex: 2,
    explanation:
      "Choosing from the left subarray when equal preserves original order among duplicates (stability).",
  },
];

// Set of simulator phases that belong to merging (used for highlighting and quiz focus)
const MERGE_PHASES = new Set([
  "merge-start",
  "merge-compare",
  "merge-take-left",
  "merge-take-right",
  "merge-copy-rest",
  "merged",
]);

// Unique lesson ID for progress saving
const LESSON_KEY = "lesson_merge";

// Badge IDs used in the guest profile system
const BADGES = {
  sim: "badge_merge_sim",
  warmup: "badge_merge_warmup",
  exercises: "badge_merge_exercises",
  quiz: "badge_merge_quiz",
  complete: "badge_merge_complete",
};

// Points awarded for each lesson milestone
const POINTS = {
  sim: 10,
  warmup: 10,
  exercises: 20,
  quiz: 30,
  complete: 50,
};

const MergeSortLesson = () => {
  // --- Layout / accessibility ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
   // Guest profile state and progress helpers
  const { activeProfile, awardBadge, markLessonComplete, openSwitcher } = useGuestProfile();

  // Accessibility settings
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Accessibility settings
  const accessBtnRef = useRef(null);
  const accessMenuRef = useRef(null);

  // Load saved accessibility settings from localStorage
  useEffect(() => {
    setContrast(localStorage.getItem("sat_contrast") === "1");
    setDyslexia(localStorage.getItem("sat_dyslexia") === "1");
    setLargeText(localStorage.getItem("sat_largetext") === "1");
  }, []);

  // Apply accessibility classes to the document body and save preferences
  useEffect(() => {
    document.body.classList.toggle("contrast", contrast);
    document.body.classList.toggle("dyslexia", dyslexia);
    document.body.classList.toggle("large-text", largeText);

    localStorage.setItem("sat_contrast", contrast ? "1" : "0");
    localStorage.setItem("sat_dyslexia", dyslexia ? "1" : "0");
    localStorage.setItem("sat_largetext", largeText ? "1" : "0");
  }, [contrast, dyslexia, largeText]);

  // Close accessibility menu when pressing Escape or clicking outside
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
  const [inputValue, setInputValue] = useState("8, 3, 5, 1, 9, 2, 7, 4");
  const [arrayError, setArrayError] = useState("");
  const [baseArray, setBaseArray] = useState([8, 3, 5, 1, 9, 2, 7, 4]);

   // Simulator view and playback settings
  const [representationMode, setRepresentationMode] = useState("bars");
  const [highlightActiveRange, setHighlightActiveRange] = useState(true); // ✅ renamed
  const [animationSpeed, setAnimationSpeed] = useState("normal");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Generate simulator steps whenever the base array changes
  const steps = useMemo(() => generateMergeSteps(baseArray), [baseArray]);
  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;

  // --- Warm-up: manual merge ---
  const [warmLeft, setWarmLeft] = useState([1, 4, 8]);
  const [warmRight, setWarmRight] = useState([2, 3, 9]);
  const [warmMerged, setWarmMerged] = useState([]);
  const [warmMsg, setWarmMsg] = useState(
    "Pick the smallest FRONT element to build the merged list."
  );
  const [warmCompleted, setWarmCompleted] = useState(false);

  // --- Quiz state ---
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizPassed, setQuizPassed] = useState(false);

  // --- Complexity slider ---
  const [complexityN, setComplexityN] = useState(16);

  // --- Progress flags ---
  const [simulatorTouched, setSimulatorTouched] = useState(false);
  const [warmupDone, setWarmupDone] = useState(false);
  const [ex1Done, setEx1Done] = useState(false);
  const [ex2Done, setEx2Done] = useState(false);
  const [ex3Done, setEx3Done] = useState(false);
  const [ex4Done, setEx4Done] = useState(false);

   // Controls the lesson completion popup
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ---------- Simulator logic ----------
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [baseArray]);

  // Reset playback whenever the input array changes
  useEffect(() => {
    if (!isPlaying) return;

    // Automatic playback logic for the visualiser
    let intervalMs = 600;
    if (animationSpeed === "slow") intervalMs = 950;
    if (animationSpeed === "fast") intervalMs = 220;

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


  // Award simulator badge when the learner uses the visualiser
  useEffect(() => {
    if (!activeProfile) return;
    if (simulatorTouched) awardBadge(BADGES.sim, { points: POINTS.sim });
  }, [simulatorTouched, activeProfile, awardBadge]);
  
  // Award warm-up badge when warm-up is completed
  useEffect(() => {
    if (!activeProfile) return;
    if (warmupDone) awardBadge(BADGES.warmup, { points: POINTS.warmup });
  }, [warmupDone, activeProfile, awardBadge]);
  
  // Award exercise badge when all exercises are complete
  useEffect(() => {
    if (!activeProfile) return;
    const exercisesDone = ex1Done && ex2Done && ex3Done && ex4Done;
    if (exercisesDone) awardBadge(BADGES.exercises, { points: POINTS.exercises });
  }, [ex1Done, ex2Done, ex3Done, ex4Done, activeProfile, awardBadge]);
  
  // Award quiz badge when quiz is passed perfectly
  useEffect(() => {
    if (!activeProfile) return;
    if (quizPassed) awardBadge(BADGES.quiz, { points: POINTS.quiz });
  }, [quizPassed, activeProfile, awardBadge]);
  

  // Applies the user-entered array to the simulator
  const handleApplyArray = () => {
    const parsed = parseInputArray(inputValue);
    if (!parsed || parsed.length === 0) {
      setArrayError(
        "Please enter a comma- or space-separated list of numbers (e.g. 8, 3, 5, 1)."
      );
      return;
    }

    // guard to prevent huge step generation / freezing
    if (parsed.length > 32) {
      setArrayError("Please use 32 numbers or fewer for the visualiser.");
      return;
    }

    setArrayError("");
    setBaseArray(parsed);
  };

  // Replaces current array with a random one
  const handleRandomizeArray = () => {
    const randomArr = generateRandomArray(8, 1, 99);
    setInputValue(randomArr.join(", "));
    setArrayError("");
    setBaseArray(randomArr);
  };

   // Move simulator forward one step
  const handleStepForward = () => {
    setSimulatorTouched(true);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

   // Move simulator back one step
  const handleStepBack = () => setCurrentStepIndex((prev) => Math.max(prev - 1, 0));

  // Restart simulator playback
  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Play or pause the simulator
  const togglePlay = () => {
    setSimulatorTouched(true);
  
    // If we are at the end and user presses play, restart first
    if (!isPlaying && currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
  
    setIsPlaying((p) => !p);
  };

   // Register keyboard shortcuts
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
  

  // ---------- Warm-up logic ----------
   // Reset the merge warm-up activity
  const warmReset = () => {
    setWarmLeft([1, 4, 8]);
    setWarmRight([2, 3, 9]);
    setWarmMerged([]);
    setWarmMsg("Pick the smallest FRONT element to build the merged list.");
    setWarmCompleted(false);
    setWarmupDone(false);
  };

   // Handles choosing the next front value from left or right list
  const warmPick = (side) => {
    if (warmCompleted) return;

    const l = warmLeft[0];
    const r = warmRight[0];

    const canPickLeft = warmLeft.length > 0 && side === "L";
    const canPickRight = warmRight.length > 0 && side === "R";
    if (!canPickLeft && !canPickRight) return;

    // Determine which side is correct based on smaller front element
    const nextCorrect =
      warmLeft.length === 0
        ? "R"
        : warmRight.length === 0
        ? "L"
        : l <= r
        ? "L"
        : "R";

    // Correct pick: move the value into the merged output
    if (side !== nextCorrect) {
      setWarmMsg("❌ Compare the front elements again — pick the smallest next.");
      return;
    }

    if (side === "L") {
      setWarmMerged((m) => [...m, warmLeft[0]]);
      setWarmLeft((a) => a.slice(1));
    } else {
      setWarmMerged((m) => [...m, warmRight[0]]);
      setWarmRight((a) => a.slice(1));
    }

    // Finish warm-up when both lists are empty
    const nextLeftLen = side === "L" ? warmLeft.length - 1 : warmLeft.length;
    const nextRightLen = side === "R" ? warmRight.length - 1 : warmRight.length;
    const remaining = nextLeftLen + nextRightLen;

    if (remaining === 0) {
      setWarmCompleted(true);
      setWarmupDone(true);
      setWarmMsg("✅ Great! You performed a correct merge. That’s the heart of Merge Sort.");
    } else {
      setWarmMsg("✅ Correct. Keep merging by comparing the two fronts.");
    }
  };

  // ---------- Quiz logic ----------
  // Returns true only if every quiz answer is correct
  const isQuizPerfect = (answers) =>
    MERGE_QUIZ.every((q) => answers[q.id] === q.correctIndex);
   // Updates a learner's answer
  const handleQuizChange = (qId, optionIndex) => {
    setQuizAnswers((prev) => {
      const updated = { ...prev, [qId]: optionIndex };
      // If already submitted, update pass state live
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
    MERGE_QUIZ.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);

    const perfect = score === MERGE_QUIZ.length;
    setQuizPassed(perfect);
    if (!perfect) setShowCompletionModal(false);
  };

  // quiz reset (since perfection is required)
  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizPassed(false);
    setShowCompletionModal(false);
  };

  // ---------- Progress ----------
  const completedFlags = [
    simulatorTouched,
    warmupDone,
    ex1Done,
    ex2Done,
    ex3Done,
    ex4Done,
    quizPassed,
  ];
  const completedCount = completedFlags.filter(Boolean).length;
  const progressPercent =
    completedFlags.length > 0
      ? Math.round((completedCount / completedFlags.length) * 100)
      : 0;
  const allComplete = completedFlags.every(Boolean);

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
  
  // close completion modal with Escape
  useEffect(() => {
    if (!showCompletionModal) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowCompletionModal(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCompletionModal]);

  // Achievement cards displayed at the top of the lesson
  const achievements = [
    {
      id: "sim",
      label: "Visualizer Explorer",
      description: "Run the Merge Sort visual simulator.",
      earned: simulatorTouched,
      icon: "🔍",
    },
    {
      id: "concept",
      label: "Warm-up Sorter",
      description: "Complete the quick merge warm-up.",
      earned: warmupDone,
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
      description: "Pass the Merge Sort quiz (perfect score).",
      earned: quizPassed,
      icon: "🏆",
    },
  ];

  const quizTotal = MERGE_QUIZ.length;

  // helper: highlight range in visualiser
  const inRange = (idx) => {
    const rg = currentStep?.range;
    if (!rg) return false;
    return idx >= rg.l && idx <= rg.r;
  };

  const isMerging = MERGE_PHASES.has(currentStep?.phase); 
  const focus = currentStep?.focus || {};

  return (
    <>
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
            <li aria-current="page">Merge sort</li>
          </ol>
        </nav>

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
              <Link to="/insertion-sort">Insertion sort</Link>
            </li>
            <li>
              <Link className="active" to="/merge-sort">
                Merge sort
              </Link>
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
          <div className="bubble-lesson merge-lesson">
            {/* Header */}
            <header className="lesson-header">
              <div className="lesson-breadcrumbs">
                Algorithms &gt; Sorting &gt; Merge Sort
              </div>

              <div className="lesson-header-main">
                <div>
                  <h1>Merge Sort – Divide, then Merge</h1>
                  <p>
                    Learn how Merge Sort splits data into halves, then merges
                    sorted halves efficiently with a linear-time merge step.
                  </p>
                </div>

                <div className="lesson-progress">
                  <div className="lesson-progress-label">
                    Lesson progress{" "}
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

            {/* Gamification */}
            <section className="lesson-gamification">
              <h2>Achievements</h2>
              <p className="gamification-intro">
                Unlock badges as you explore the recursion, master the merge step,
                and pass the quiz.
              </p>
              <div className="gamification-badges">
                {achievements.map((badge) => (
                  <div
                    key={badge.id}
                    className={
                      "badge-card" +
                      (badge.earned ? " badge-card-earned" : " badge-card-locked")
                    }
                  >
                    <div className="badge-icon">{badge.icon}</div>
                    <div className="badge-info">
                      <div className="badge-label">{badge.label}</div>
                      <div className="badge-desc">{badge.description}</div>
                    </div>
                    <div className="badge-status">
                      {badge.earned ? "Unlocked" : "Locked"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Hero */}
            <section className="lesson-hero">
              <div className="lesson-hero-text">
                <h2>Fast sorting with divide-and-conquer</h2>
                <ul>
                  <li>Split into halves until each subarray has one item.</li>
                  <li>
                    Merge sorted halves by always taking the smallest front element.
                  </li>
                  <li>Stable sorting: ties can keep their original order.</li>
                </ul>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const el = document.getElementById("merge-visual-simulator");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Start Merge Sort
                </button>
              </div>

              <div className="lesson-hero-preview">
                <div className="preview-array">
                  {[8, 3, 5, 1, 9, 2, 7, 4].map((v, i) => (
                    <div key={i} className="preview-bar" style={{ height: `${40 + v}px` }}>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <p className="preview-caption">
                  Merge Sort splits and merges efficiently.
                </p>
              </div>
            </section>

            {/* Warm-up */}
            <section className="lesson-section">
              <h2>Warm-up: the merge step</h2>
              <p className="section-intro">
                Merge Sort’s power comes from one simple tool:{" "}
                <strong>merging two sorted lists</strong>. Practice by selecting
                the smallest front element.
              </p>

              <div className="concept-builder">
                <div className="concept-builder-text">
                  <h3>Quick merge warm-up</h3>
                  <p>
                    Only the <strong>front</strong> item of each list is selectable.
                    Choose the smallest to build the merged output.
                  </p>
                </div>

                <div className="concept-builder-interactive">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Left (sorted)</div>
                      <div className="card-row" style={{ justifyContent: "flex-start" }}>
                        {warmLeft.map((v, idx) => (
                          <button
                            key={idx}
                            className={"number-card" + (idx === 0 ? " number-card-selected" : "")}
                            onClick={() => warmPick("L")}
                            disabled={warmCompleted || idx !== 0}
                            aria-label={idx === 0 ? `Pick left front ${v}` : `Left value ${v}`}
                            style={{ opacity: idx === 0 ? 1 : 0.55 }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Right (sorted)</div>
                      <div className="card-row" style={{ justifyContent: "flex-start" }}>
                        {warmRight.map((v, idx) => (
                          <button
                            key={idx}
                            className={"number-card" + (idx === 0 ? " number-card-selected" : "")}
                            onClick={() => warmPick("R")}
                            disabled={warmCompleted || idx !== 0}
                            aria-label={idx === 0 ? `Pick right front ${v}` : `Right value ${v}`}
                            style={{ opacity: idx === 0 ? 1 : 0.55 }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Merged output</div>
                    <div className="card-row">
                      {warmMerged.length === 0 ? (
                        <span style={{ color: "var(--muted)" }}>Start merging…</span>
                      ) : (
                        warmMerged.map((v, i) => (
                          <span key={i} className="number-card" style={{ cursor: "default" }}>
                            {v}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="concept-builder-controls" style={{ marginTop: 10 }}>
                    <button className="btn-ghost" onClick={warmReset}>
                      Reset
                    </button>
                    {warmCompleted && (
                      <span style={{ color: "var(--success)", fontWeight: 700 }}>✅ Completed</span>
                    )}
                  </div>

                  {warmMsg && <div className="feedback-text">{warmMsg}</div>}
                </div>
              </div>
            </section>

            {/* Explanation */}
            <section className="lesson-section">
              <article className="card">
                <h2>What is Merge Sort?</h2>
                <p>
                  Merge Sort is a <strong>divide-and-conquer</strong> sorting algorithm.
                  It splits the array into halves until each piece has one element
                  (already sorted), then merges those sorted halves back together.
                </p>

                <h3>How Merge Sort works</h3>
                <ol>
                  <li>Split the array into two halves.</li>
                  <li>Recursively sort each half.</li>
                  <li>
                    Merge the two sorted halves by repeatedly taking the smallest
                    front element.
                  </li>
                </ol>

                <h3>Real-life analogy</h3>
                <p>
                  Imagine two students have already sorted their notes by page number.
                  To create one combined pack, you can merge them by always taking the
                  smaller page number at the front. That merge step is fast and predictable.
                </p>
              </article>
            </section>

            {/* Visual simulator */}
            <section className="lesson-section" id="merge-visual-simulator">
              <h2>Merge Sort Visual Simulator</h2>
              <p className="section-intro">
                Watch splits and merges. During merging, focus on comparing the{" "}
                <strong>front</strong> of left and right sublists.
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
                          setInputValue("8, 3, 5, 1, 9, 2, 7, 4");
                          setArrayError("");
                          setBaseArray([8, 3, 5, 1, 9, 2, 7, 4]);
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
                            name="merge-speed"
                            checked={animationSpeed === "slow"}
                            onChange={() => setAnimationSpeed("slow")}
                          />
                          Slow
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="merge-speed"
                            checked={animationSpeed === "normal"}
                            onChange={() => setAnimationSpeed("normal")}
                          />
                          Normal
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="merge-speed"
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
                            name="merge-view"
                            checked={representationMode === "bars"}
                            onChange={() => setRepresentationMode("bars")}
                          />
                          Bars
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="merge-view"
                            checked={representationMode === "circles"}
                            onChange={() => setRepresentationMode("circles")}
                          />
                          Circles
                        </label>
                      </div>

                      <label className="option-group checkbox">
                        <input
                          type="checkbox"
                          checked={highlightActiveRange}
                          onChange={(e) => setHighlightActiveRange(e.target.checked)}
                        />
                        Highlight active range
                      </label>
                    </div>
                  </div>
                  {/* Middle panel: visualisation and step info */}
                  <div className="simulator-visual">
                    <div className="array-visual">
                      {currentStep.array.map((v, idx) => {
                        const inActive = highlightActiveRange && inRange(idx);

                        const classNames = [
                          "array-item",
                          representationMode === "circles"
                            ? "array-item-circle"
                            : "array-item-bar",
                        ];

                        if (inActive) classNames.push("array-item-comparing");

                        return (
                          <div
                            key={idx}
                            className={classNames.join(" ")}
                            aria-label={`Index ${idx}, value ${v}${inActive ? ", active range" : ""}`}
                          >
                            {representationMode === "bars" && (
                              <div
                                className="array-item-bar-inner"
                                style={{ height: `${20 + v * 1.1}px` }}
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
                          Phase: <strong>{currentStep.phase}</strong>
                        </span>
                      </div>

                      <div className="simulator-step-detail">
                        <p>{currentStep.description}</p>
                      </div>

                      <div className="simulator-variables">
                        <span>
                          range ={" "}
                          <code>
                            {currentStep?.range
                              ? `[${currentStep.range.l}..${currentStep.range.r}]`
                              : "-"}
                          </code>
                        </span>
                        <span>
                          depth = <code>{currentStep?.depth ?? "-"}</code>
                        </span>
                        <span>
                          mode = <code>{isMerging ? "merge" : "split"}</code>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right panel: merge window */}
                <div className="simulator-right">
                  <h3>Merge window</h3>
                  <p className="section-intro">
                    When merging, you compare the <strong>front</strong> of Left vs Right
                    and build the merged output.
                  </p>

                  {MERGE_PHASES.has(currentStep.phase) ? (
                    <div className="card" style={{ padding: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>Left</div>
                          <div className="card-row">
                            {(currentStep.left || []).map((x, i) => {
                              const ptr = focus.i ?? 0;
                              const consumed = i < ptr;
                              const isPtr = i === ptr;

                              return (
                                <span
                                  key={i}
                                  className={[
                                    "number-card",
                                    consumed ? "number-card-consumed" : "",
                                    isPtr ? "number-card-pointer" : "",
                                  ].join(" ")}
                                  style={{ cursor: "default" }}
                                >
                                  {x}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>Right</div>
                          <div className="card-row">
                            {(currentStep.right || []).map((x, i) => {
                              const ptr = focus.j ?? 0;
                              const consumed = i < ptr;
                              const isPtr = i === ptr;

                              return (
                                <span
                                  key={i}
                                  className={[
                                    "number-card",
                                    consumed ? "number-card-consumed" : "",
                                    isPtr ? "number-card-pointer" : "",
                                  ].join(" ")}
                                  style={{ cursor: "default" }}
                                >
                                  {x}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Merged output</div>
                        <div className="card-row">
                          {(currentStep.merged || []).length === 0 ? (
                            <span style={{ color: "var(--muted)" }}>No items merged yet…</span>
                          ) : (
                            (currentStep.merged || []).map((x, i) => (
                              <span
                                key={i}
                                className="number-card number-card-merged"
                                style={{ cursor: "default" }}
                              >
                                {x}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 10, color: "var(--muted)", fontSize: "0.85rem" }}>
                        Tip: When values are equal, taking from the <strong>left</strong>{" "}
                        keeps merge stable.
                      </div>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: 12 }}>
                      <p style={{ margin: 0, color: "var(--muted)" }}>
                        You’re currently in a split/base case step. The merge window appears
                        during merge phases.
                      </p>
                    </div>
                  )}

                  <MergeCodeTabs currentStep={currentStep} />
                </div>
              </div>
            </section>

            {/* Complexity */}
            <section className="lesson-section">
              <h2>Time &amp; space complexity</h2>

              <div className="complexity-grid">
                <div>
                  <p>
                    Merge Sort is a classic <strong>O(n log n)</strong> algorithm: it splits
                    the data into log n levels, and each level does linear merging work.
                  </p>
                  <ul>
                    <li>
                      Best-case time: <code>O(n log n)</code>
                    </li>
                    <li>
                      Average-case time: <code>O(n log n)</code>
                    </li>
                    <li>
                      Worst-case time: <code>O(n log n)</code>
                    </li>
                    <li>
                      Space: <code>O(n)</code> extra (because merging uses temporary arrays)
                    </li>
                  </ul>
                </div>

                <div className="complexity-interactive">
                  <label className="input-label">
                    List size n: <strong>{complexityN}</strong>
                    <input
                      type="range"
                      min="4"
                      max="80"
                      value={complexityN}
                      onChange={(e) => setComplexityN(Number(e.target.value))}
                    />
                  </label>

                  <div className="complexity-bars">
                    <div className="complexity-row">
                      <span>Merge Sort ~ comparisons (≈ n log n)</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill fast"
                          style={{
                            width: `${Math.min(
                              100,
                              (approxMergeSortComparisons(complexityN) / 600) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">
                        ≈ {approxMergeSortComparisons(complexityN)}
                      </span>
                    </div>

                    <div className="complexity-row">
                      <span>Bubble/Selection ~ comparisons (≈ n²)</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill bubble"
                          style={{
                            width: `${Math.min(
                              100,
                              ((complexityN * complexityN) / 1500) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">≈ {complexityN * complexityN}</span>
                    </div>
                  </div>

                  <p className="complexity-caption">
                    The reason Merge Sort scales well is that merging is linear and happens
                    across about log₂(n) levels.
                  </p>
                </div>
              </div>
            </section>

            {/* Exercises */}
            <MergeSortExercises
              onComplete={(key) => {
                if (key === "ex1") setEx1Done(true);
                if (key === "ex2") setEx2Done(true);
                if (key === "ex3") setEx3Done(true);
                if (key === "ex4") setEx4Done(true);
              }}
            />

            {/* Quiz */}
            <section className="lesson-section lesson-quiz" id="merge-quiz">
              <h2>Mini quiz</h2>
              <p className="section-intro">
                Check your understanding of recursion, merging, complexity, and stability.
              </p>

              <div className="quiz">
                {MERGE_QUIZ.map((q) => {
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
                              name={`merge-quiz-${q.id}`}
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

                  {quizSubmitted && !quizPassed && (
                    <button className="btn-ghost" onClick={resetQuiz}>
                      Reset quiz
                    </button>
                  )}

                  {quizSubmitted && (
                    <div className="quiz-score">
                      Score: {quizScore} / {quizTotal}{" "}
                      {quizPassed ? "🎉 Great job!" : "Keep practising!"}
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
                      Merge Sort uses <strong>divide-and-conquer</strong>: split → sort halves
                      → merge.
                    </li>
                    <li>
                      The <strong>merge step</strong> is linear: each element is taken once.
                    </li>
                    <li>
                      Time complexity is <code>O(n log n)</code> consistently.
                    </li>
                    <li>
                      Merge Sort can be <strong>stable</strong> when ties choose the left
                      element first.
                    </li>
                  </ul>

                  <h4>Quick self-check</h4>
                  <ul>
                    <li>What is the base case in merge sort?</li>
                    <li>Why is merging two sorted lists O(n)?</li>
                    <li>How do you preserve stability when values are equal?</li>
                  </ul>
                </div>

                <div className="summary-next">
                  <h3>Where to go next?</h3>
                  <Link to="/insertion-sort" className="btn-secondary">
                    ↩ Review Insertion Sort
                  </Link>
                  <Link to="/selection-sort" className="btn-secondary">
                    🔁 Review Selection Sort
                  </Link>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("merge-visual-simulator");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    🔄 Replay the visualiser
                  </button>
                </div>
              </div>
            </section>

            {/* Completion modal */}
            {showCompletionModal && (
              <div
                className="completion-modal-backdrop"
                onClick={() => setShowCompletionModal(false)}
                role="presentation"
              >
                <div
                  className="completion-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Lesson completed"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="completion-trophy">🏆</div>
                  <h2>Nice work!</h2>
                  <p>You completed Merge Sort and earned <strong>{POINTS.complete}</strong> bonus points 🎉</p>
                  <button className="btn-primary" onClick={() => setShowCompletionModal(false)}>
                  Great job!
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="site-footer">
        <p>© 2025 SortAcademy · Merge Sort Page</p>
      </footer>
    </>
  );
};

// ---------- Code Tabs (Merge Sort) ----------
const MergeCodeTabs = ({ currentStep }) => {
   // Track which code language tab is selected
  const [activeTab, setActiveTab] = useState("python");

   // Determines which code lines should be highlighted for the current simulator phase
  const highlightLine = (lineNumber) => {
    const ph = currentStep?.phase || "init";
    if (ph === "split") return lineNumber === 3 || lineNumber === 4;
    if (ph === "base") return lineNumber === 2;
    if (ph === "merge-compare" || ph === "merge-start") return lineNumber === 10 || lineNumber === 11;
    if (ph === "merge-take-left" || ph === "merge-take-right") return lineNumber === 12 || lineNumber === 14;
    if (ph === "merge-copy-rest") return lineNumber === 16 || lineNumber === 18;
    if (ph === "merged") return lineNumber === 20;
    return lineNumber === 1;
  };

  // Code snippets for each language, with line numbers for highlighting
  const pythonCode = [
    "def merge_sort(a):",
    "    if len(a) <= 1:",
    "        return a",
    "    mid = len(a) // 2",
    "    left = merge_sort(a[:mid])",
    "    right = merge_sort(a[mid:])",
    "    return merge(left, right)",
    "",
    "def merge(left, right):",
    "    merged = []",
    "    i = j = 0",
    "    while i < len(left) and j < len(right):",
    "        if left[i] <= right[j]:",
    "            merged.append(left[i]); i += 1",
    "        else:",
    "            merged.append(right[j]); j += 1",
    "    merged.extend(left[i:])",
    "    merged.extend(right[j:])",
    "    return merged",
  ];

  const javaCode = [
    "int[] mergeSort(int[] a) {",
    "  if (a.length <= 1) return a;",
    "  int mid = a.length / 2;",
    "  int[] left = mergeSort(Arrays.copyOfRange(a, 0, mid));",
    "  int[] right = mergeSort(Arrays.copyOfRange(a, mid, a.length));",
    "  return merge(left, right);",
    "}",
    "",
    "int[] merge(int[] left, int[] right) {",
    "  int i=0, j=0, k=0;",
    "  int[] out = new int[left.length + right.length];",
    "  while (i < left.length && j < right.length) {",
    "    if (left[i] <= right[j]) out[k++] = left[i++];",
    "    else out[k++] = right[j++];",
    "  }",
    "  while (i < left.length) out[k++] = left[i++];",
    "  while (j < right.length) out[k++] = right[j++];",
    "  return out;",
    "}",
  ];

  const cppCode = [
    "vector<int> mergeSort(vector<int> a) {",
    "  if (a.size() <= 1) return a;",
    "  int mid = (int)a.size()/2;",
    "  vector<int> left(a.begin(), a.begin()+mid);",
    "  vector<int> right(a.begin()+mid, a.end());",
    "  left = mergeSort(left);",
    "  right = mergeSort(right);",
    "  return merge(left, right);",
    "}",
    "",
    "vector<int> merge(vector<int>& left, vector<int>& right) {",
    "  vector<int> out;",
    "  int i=0, j=0;",
    "  while(i<left.size() && j<right.size()) {",
    "    if(left[i] <= right[j]) out.push_back(left[i++]);",
    "    else out.push_back(right[j++]);",
    "  }",
    "  while(i<left.size()) out.push_back(left[i++]);",
    "  while(j<right.size()) out.push_back(right[j++]);",
    "  return out;",
    "}",
  ];

  const pseudoCode = [
    "procedure mergeSort(A):",
    "    if length(A) ≤ 1: return A",
    "    mid ← length(A)/2",
    "    left ← mergeSort(A[0..mid-1])",
    "    right ← mergeSort(A[mid..end])",
    "    return merge(left, right)",
    "",
    "procedure merge(L, R):",
    "    out ← empty list",
    "    while L and R not empty:",
    "        if front(L) ≤ front(R): take front(L)",
    "        else: take front(R)",
    "    append remaining items",
    "    return out",
  ];

   // Reusable code block renderer with line numbers and highlighting
  const renderCodeBlock = (lines, baseLineNumber = 1) => (
    <pre className="code-block">
      {lines.map((line, idx) => {
        const lineNumber = baseLineNumber + idx;
         // Structural lines are lightly hinted for readability
        const isStructural =
          line.includes("if") ||
          line.includes("while") ||
          line.includes("return") ||
          line.includes("merge") ||
          line.includes("mid") ||
          line.includes("left") ||
          line.includes("right");
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
    <div className="code-tabs" style={{ marginTop: 10 }}>
      {/* Code language tab buttons */}
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

       {/* Selected code tab content */}
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
export default MergeSortLesson;
