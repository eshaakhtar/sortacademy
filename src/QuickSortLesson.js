// src/QuickSortLesson.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import QuickSortExercises from "./QuickSortExercises"; // separate component for the 4 interactive exercises 
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { useGuestProfile, ProfileChip } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; // shared layout (topbar, sidebar, footer)
import "./LessonPages.css"; // specific styles for lesson pages (hero, sections, quiz, etc.)

/* ============================================================
  Helpers
============================================================ */

// Generate a random array of integers for the visualiser
function generateRandomArray(length = 8, min = 1, max = 99) {
  const out = [];
  for (let i = 0; i < length; i++) out.push(Math.floor(Math.random() * (max - min + 1)) + min);
  return out;
}

// Parse a user-entered array string such as "8, 3, 5, 1"
// Returns null if the input is empty or contains invalid numbers
function parseInputArray(input) {
  if (!input.trim()) return null;
  const parts = input.split(/[, ]+/).filter(Boolean);
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n))) return null;
  return nums;
}

// Rough estimate of n log n used for the complexity visual comparison
// This is for intuition only, not an exact count
function approximateNLogN(n) {
  if (n <= 1) return 0;
  const log2 = Math.log2 ? Math.log2(n) : Math.log(n) / Math.log(2);
  return Math.round(n * log2);
}

/* ============================================================
  Quick Sort step generator (Lomuto partition)
  - Visual teaching: pivot, i, j scanning, swaps, recursion ranges
============================================================ */

// Create a full sequence of visualisation steps for Quick Sort
// This uses Lomuto partitioning and records every important teaching moment
function generateQuickSteps(initialArray, pivotStrategy = "last") {
  const steps = [];
  const original = [...initialArray];

  // Edge case: empty array
  if (original.length === 0) {
    steps.push({
      array: [],
      phase: "done",
      description: "The array is empty, nothing to sort.",
      done: true,
      range: null,
      depth: 0,
      pivotIndex: null,
      pivotValue: null,
      i: null,
      j: null,
      stack: [],
    });
    return steps;
  }

  // First step: explain the starting idea
  steps.push({
    array: [...original],
    phase: "init",
    description:
      "Starting Quick Sort. We’ll pick a pivot, partition the array around it, then recursively sort left and right parts.",
    done: false,
    range: { l: 0, r: original.length - 1 },
    depth: 0,
    pivotIndex: null,
    pivotValue: null,
    i: null,
    j: null,
    stack: [{ l: 0, r: original.length - 1 }],
  });

  const arr = [...original];

  // Choose a pivot index based on the selected pivot strategy
  function choosePivotIndex(l, r) {
    if (pivotStrategy === "first") return l;
    if (pivotStrategy === "random") return l + Math.floor(Math.random() * (r - l + 1));
    if (pivotStrategy === "median") {
      const mid = Math.floor((l + r) / 2);
      const a = { idx: l, v: arr[l] };
      const b = { idx: mid, v: arr[mid] };
      const c = { idx: r, v: arr[r] };
      const trio = [a, b, c].sort((x, y) => x.v - y.v);
      return trio[1].idx;
    }
    // default: last
    return r;
  }

  // Swap two values in the working array
  function swap(i, j) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  // Lomuto partition that records visual steps
  function partitionLomuto(l, r, depth, stack) {
    // choose pivot index + move pivot to end for Lomuto
    const chosen = choosePivotIndex(l, r);
    let pivotIndex = chosen;

    steps.push({
      array: [...arr],
      phase: "pivot-choice",
      description: `Choose pivot within range [${l}..${r}]. Strategy: ${pivotStrategy.toUpperCase()}.`,
      done: false,
      range: { l, r },
      depth,
      pivotIndex,
      pivotValue: arr[pivotIndex],
      i: null,
      j: null,
      stack,
    });

    // If pivot is not already at the end, move it there first
    if (pivotIndex !== r) {
      steps.push({
        array: [...arr],
        phase: "swap",
        description: `Move pivot ${arr[pivotIndex]} to the end (index ${r}) so we can partition cleanly.`,
        done: false,
        range: { l, r },
        depth,
        pivotIndex,
        pivotValue: arr[pivotIndex],
        i: null,
        j: null,
        stack,
        swap: { a: pivotIndex, b: r },
      });
      swap(pivotIndex, r);
      pivotIndex = r;
    }

    const pivotValue = arr[r];

    let i = l - 1;

    // Begin partitioning
    steps.push({
      array: [...arr],
      phase: "partition-start",
      description: `Partitioning around pivot ${pivotValue}. Everything ≤ pivot should end up on the LEFT.`,
      done: false,
      range: { l, r },
      depth,
      pivotIndex,
      pivotValue,
      i,
      j: l,
      stack,
    });

    // Scan from left to right with j
    for (let j = l; j < r; j++) {
      steps.push({
        array: [...arr],
        phase: "compare",
        description: `Compare A[j]=${arr[j]} with pivot=${pivotValue}. If A[j] ≤ pivot, grow the LEFT region.`,
        done: false,
        range: { l, r },
        depth,
        pivotIndex,
        pivotValue,
        i,
        j,
        stack,
      });

      if (arr[j] <= pivotValue) {
        i++;
         // Swap only if needed
        if (i !== j) {
          steps.push({
            array: [...arr],
            phase: "swap",
            description: `A[j]=${arr[j]} belongs on the LEFT. Swap A[i] and A[j].`,
            done: false,
            range: { l, r },
            depth,
            pivotIndex,
            pivotValue,
            i,
            j,
            stack,
            swap: { a: i, b: j },
          });
          swap(i, j);
        } else {
          steps.push({
            // Sometimes the value is already in the correct LEFT region
            array: [...arr],
            phase: "mark-left",
            description: `A[j]=${arr[j]} is already in the correct LEFT region (i == j).`,
            done: false,
            range: { l, r },
            depth,
            pivotIndex,
            pivotValue,
            i,
            j,
            stack,
          });
        }
      }
    }

    // Final step of partition: place pivot into its correct position
    steps.push({
      array: [...arr],
      phase: "pivot-place",
      description: `Place pivot into its final spot by swapping A[i+1] with pivot at A[r].`,
      done: false,
      range: { l, r },
      depth,
      pivotIndex,
      pivotValue,
      i,
      j: r,
      stack,
      swap: { a: i + 1, b: r },
    });
    swap(i + 1, r);

    const p = i + 1;

    steps.push({
      array: [...arr],
      phase: "partition-done",
      description: `Partition complete. Pivot ${arr[p]} is now at index ${p}. Left: [${l}..${p - 1}], Right: [${p + 1}..${r}].`,
      done: false,
      range: { l, r },
      depth,
      pivotIndex: p,
      pivotValue: arr[p],
      i: null,
      j: null,
      stack,
      pivotFinal: p,
    });

    return p;
  }

  // Recursive Quick Sort that keeps generating teaching steps
  function quickSort(l, r, depth, stack) {
    // Recursive Quick Sort that keeps generating teaching steps
    if (l >= r) {
      steps.push({
        array: [...arr],
        phase: "base",
        description: `Base case: range [${l}..${r}] has 0 or 1 element → already sorted.`,
        done: false,
        range: { l, r },
        depth,
        pivotIndex: null,
        pivotValue: null,
        i: null,
        j: null,
        stack,
      });
      return;
    }

    const p = partitionLomuto(l, r, depth, stack);

    // These next ranges represent the recursive calls
    const leftRange = { l, r: p - 1 };
    const rightRange = { l: p + 1, r };

    // This stack is only for visual explanation
    const nextStack = [
      ...stack.filter((x) => !(x.l === l && x.r === r)),
      ...(rightRange.l < rightRange.r ? [rightRange] : []),
      ...(leftRange.l < leftRange.r ? [leftRange] : []),
    ];

    steps.push({
      array: [...arr],
      phase: "recurse",
      description: `Recurse on subarrays (divide-and-conquer): sort left then right.`,
      done: false,
      range: { l, r },
      depth,
      pivotIndex: p,
      pivotValue: arr[p],
      i: null,
      j: null,
      stack: nextStack,
      recurse: { left: leftRange, right: rightRange },
    });

    // Recurse into left and right sides
    quickSort(l, p - 1, depth + 1, nextStack);
    quickSort(p + 1, r, depth + 1, nextStack);
  }

  quickSort(0, arr.length - 1, 0, [{ l: 0, r: arr.length - 1 }]);

  // Final step: fully sorted
  steps.push({
    array: [...arr],
    phase: "done",
    description: "All elements are now in ascending order. Quick Sort is complete.",
    done: true,
    range: { l: 0, r: arr.length - 1 },
    depth: 0,
    pivotIndex: null,
    pivotValue: null,
    i: null,
    j: null,
    stack: [],
  });

  return steps;
}

/* ============================================================
  Quiz
============================================================ */

// Mini quiz questions for checking understanding
const QUICK_QUIZ = [
  {
    id: 1,
    question: "What is the key idea behind Quick Sort?",
    options: [
      "Repeatedly swap adjacent out-of-order neighbours",
      "Pick a pivot, partition values around it, then recursively sort subarrays",
      "Repeatedly select the smallest value and move it to the front",
      "Build a sorted prefix by inserting each new value",
    ],
    correctIndex: 1,
    explanation:
      "Quick Sort uses divide-and-conquer: choose a pivot, partition into left/right groups, then sort those groups recursively.",
  },
  {
    id: 2,
    question: "What does partitioning guarantee after it finishes?",
    options: [
      "The whole array is sorted",
      "The pivot is in its final correct position",
      "The left side is always fully sorted",
      "The algorithm becomes stable automatically",
    ],
    correctIndex: 1,
    explanation:
      "Partitioning places the pivot where it belongs in the final sorted array. Left values are ≤ pivot and right values are ≥ pivot (depending on implementation).",
  },
  {
    id: 3,
    question: "Quick Sort is typically fast because:",
    options: [
      "It always does exactly n² comparisons",
      "Good pivots create balanced partitions → about log₂(n) recursion depth",
      "It uses extra arrays to merge elements",
      "It avoids comparisons entirely",
    ],
    correctIndex: 1,
    explanation:
      "When partitions are balanced, recursion depth is about log₂(n) and each level does linear work → O(n log n).",
  },
  {
    id: 4,
    question: "Quick Sort’s worst case is usually:",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
    correctIndex: 2,
    explanation:
      "Worst case happens with very unbalanced partitions repeatedly (e.g., always picking smallest/largest pivot in already sorted data), leading to O(n²).",
  },
];

// Keys and reward values for lesson completion + gamification
const LESSON_KEY = "lesson_quick";
const BADGES = {
  sim: "badge_quick_sim",
  warmup: "badge_quick_warmup",
  exercises: "badge_quick_exercises",
  quiz: "badge_quick_quiz",
  complete: "badge_quick_complete",
};

const POINTS = {
  sim: 10,
  warmup: 10,
  exercises: 20,
  quiz: 30,
  complete: 50,
};

/* ============================================================
  Component
============================================================ */
const QuickSortLesson = () => {
  // --- Layout / accessibility ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Guest profile / gamification helpers
  const { activeProfile, awardBadge, markLessonComplete, openSwitcher } = useGuestProfile();

  // Accessibility preferences
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Refs used to manage focus and outside-click closing
  const accessBtnRef = useRef(null);
  const accessMenuRef = useRef(null);

  // Load saved accessibility preferences from localStorage
  useEffect(() => {
    setContrast(localStorage.getItem("sat_contrast") === "1");
    setDyslexia(localStorage.getItem("sat_dyslexia") === "1");
    setLargeText(localStorage.getItem("sat_largetext") === "1");
  }, []);

  // Apply accessibility classes to the page and save preferences
  useEffect(() => {
    document.body.classList.toggle("contrast", contrast);
    document.body.classList.toggle("dyslexia", dyslexia);
    document.body.classList.toggle("large-text", largeText);

    localStorage.setItem("sat_contrast", contrast ? "1" : "0");
    localStorage.setItem("sat_dyslexia", dyslexia ? "1" : "0");
    localStorage.setItem("sat_largetext", largeText ? "1" : "0");
  }, [contrast, dyslexia, largeText]);

  // Close accessibility menu with Escape or outside click
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

  // --- Visualiser state ---

  // User input + current base array for the visualiser
  const [inputValue, setInputValue] = useState("8, 3, 5, 1, 9, 2, 7, 4");
  const [arrayError, setArrayError] = useState("");
  const [baseArray, setBaseArray] = useState([8, 3, 5, 1, 9, 2, 7, 4]);

  // Visualiser options
  const [representationMode, setRepresentationMode] = useState("bars");
  const [highlightActiveRange, setHighlightActiveRange] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState("normal");
  const [pivotStrategy, setPivotStrategy] = useState("last");

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Generate all Quick Sort teaching steps whenever array or pivot strategy changes
  const steps = useMemo(
    () => generateQuickSteps(baseArray, pivotStrategy),
    [baseArray, pivotStrategy]
  );
  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;

  // --- Warm-up: quick partition idea ---
  // Small partition warm-up activity
  const [warmArray, setWarmArray] = useState([7, 2, 9, 1, 5]);
  const [warmPivotIndex, setWarmPivotIndex] = useState(2); // pivot = 9 initially
  const warmPivotValue = warmArray[warmPivotIndex];

  // Left and right placements for warm-up
  const [warmLeft, setWarmLeft] = useState([]);
  const [warmRight, setWarmRight] = useState([]);
  const [warmMsg, setWarmMsg] = useState("Pick a pivot, then send values left (smaller) or right (larger).");
  const [warmCompleted, setWarmCompleted] = useState(false);
  const [warmupDone, setWarmupDone] = useState(false);

  // --- Quiz ---
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizPassed, setQuizPassed] = useState(false);

  // --- Complexity slider ---
  const [complexityN, setComplexityN] = useState(16);

  // --- Progress flags ---
  const [simulatorTouched, setSimulatorTouched] = useState(false);
  const [ex1Done, setEx1Done] = useState(false);
  const [ex2Done, setEx2Done] = useState(false);
  const [ex3Done, setEx3Done] = useState(false);
  const [ex4Done, setEx4Done] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

   // Reset playback when input array or pivot strategy changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [baseArray, pivotStrategy]);

  // Auto-play through steps according to selected speed
  useEffect(() => {
    if (!isPlaying) return;

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

  // Award simulator badge once the user has interacted with it
  useEffect(() => {
    if (!activeProfile) return;
    if (simulatorTouched) awardBadge(BADGES.sim, { points: POINTS.sim });
  }, [simulatorTouched, activeProfile, awardBadge]);
  
  // Award warm-up badge once completed
  useEffect(() => {
    if (!activeProfile) return;
    if (warmupDone) awardBadge(BADGES.warmup, { points: POINTS.warmup });
  }, [warmupDone, activeProfile, awardBadge]);
  
  // Award exercises badge once all four exercise tabs are completed
  useEffect(() => {
    if (!activeProfile) return;
    const exercisesDone = ex1Done && ex2Done && ex3Done && ex4Done;
    if (exercisesDone) awardBadge(BADGES.exercises, { points: POINTS.exercises });
  }, [ex1Done, ex2Done, ex3Done, ex4Done, activeProfile, awardBadge]);
  
  // Award quiz badge only for a perfect score
  useEffect(() => {
    if (!activeProfile) return;
    if (quizPassed) awardBadge(BADGES.quiz, { points: POINTS.quiz });
  }, [quizPassed, activeProfile, awardBadge]);
  
  // Apply the user-entered array to the visualiser
  const handleApplyArray = () => {
    const parsed = parseInputArray(inputValue);
    if (!parsed || parsed.length === 0) {
      setArrayError("Please enter a comma- or space-separated list of numbers (e.g. 8, 3, 5, 1).");
      return;
    }
    if (parsed.length > 28) {
      setArrayError("Please use 28 numbers or fewer for the Quick Sort visualiser.");
      return;
    }
    setArrayError("");
    setBaseArray(parsed);
  };

  // Generate a new random array
  const handleRandomizeArray = () => {
    const randomArr = generateRandomArray(8, 1, 99);
    setInputValue(randomArr.join(", "));
    setArrayError("");
    setBaseArray(randomArr);
  };

  // Move to next visualiser step
  const handleStepForward = () => {
    setSimulatorTouched(true);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  // Move to previous visualiser step
  const handleStepBack = () => setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Play / pause visualiser
  const togglePlay = () => {
    setSimulatorTouched(true);
  
    // if at end and user hits Play/Space, restart first
    if (!isPlaying && currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
  
    setIsPlaying((p) => !p);
  };

  // Keyboard shortcuts for the visualiser
  useKeyboardShortcuts(
    {
      Space: () => togglePlay(),
      ArrowRight: () => handleStepForward(),
      ArrowLeft: () => handleStepBack(),
      r: () => handleRestart(),
      R: () => handleRestart(),
    },
    [isPlaying, currentStepIndex, totalSteps, pivotStrategy]
  );
  
  // --- Warm-up partition ---

  // Reset warm-up task
  const warmReset = () => {
    setWarmArray([7, 2, 9, 1, 5]);
    setWarmPivotIndex(2);
    setWarmLeft([]);
    setWarmRight([]);
    setWarmMsg("Pick a pivot, then send values left (smaller) or right (larger).");
    setWarmCompleted(false);
    setWarmupDone(false);
  };

  // Choose a pivot in the warm-up
  const warmChoosePivot = (idx) => {
    if (warmCompleted) return;
    setWarmPivotIndex(idx);
    setWarmLeft([]);
    setWarmRight([]);
    setWarmMsg(`Pivot set to ${warmArray[idx]}. Now place each other number LEFT or RIGHT.`);
  };

  // Place one warm-up value left or right of the pivot
  const warmPlace = (idx, side) => {
    if (warmCompleted) return;
    if (idx === warmPivotIndex) return;

    const value = warmArray[idx];
    const correctSide = value <= warmPivotValue ? "L" : "R";

    if (side !== correctSide) {
      setWarmMsg(`❌ ${value} should go ${correctSide === "L" ? "LEFT (≤ pivot)" : "RIGHT (> pivot)"} of pivot ${warmPivotValue}.`);
      return;
    }

    // prevent duplicates from double-placing
    const alreadyPlaced = warmLeft.includes(idx) || warmRight.includes(idx);
    if (alreadyPlaced) return;

    if (side === "L") setWarmLeft((a) => [...a, idx]);
    else setWarmRight((a) => [...a, idx]);

    const placedCount = (warmLeft.length + warmRight.length) + 1;
    const needCount = warmArray.length - 1;

    if (placedCount === needCount) {
      setWarmCompleted(true);
      setWarmupDone(true);
      setWarmMsg("✅ Nice! You just did a partition: all values are on the correct side of the pivot.");
    } else {
      setWarmMsg("✅ Correct — keep placing the remaining values.");
    }
  };

  // --- Quiz helpers ---

  // Check if every quiz answer is correct
  const isQuizPerfect = (answers) => QUICK_QUIZ.every((q) => answers[q.id] === q.correctIndex);

  // Update a selected quiz answer
  const handleQuizChange = (qId, optionIndex) => {
    setQuizAnswers((prev) => {
      const updated = { ...prev, [qId]: optionIndex };
      // If already submitted, update pass state immediately
      if (quizSubmitted) {
        const perfect = isQuizPerfect(updated);
        setQuizPassed(perfect);
        if (!perfect) setShowCompletionModal(false);
      }
      return updated;
    });
  };

  // Submit quiz and calculate score
  const handleQuizSubmit = () => {
    let score = 0;
    QUICK_QUIZ.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);

    const perfect = score === QUICK_QUIZ.length;
    setQuizPassed(perfect);
    if (!perfect) setShowCompletionModal(false);
  };

  // Reset quiz state
  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizPassed(false);
    setShowCompletionModal(false);
  };

  // --- Progress / completion ---
  // Track lesson completion status across all major activities
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
  const progressPercent = completedFlags.length
    ? Math.round((completedCount / completedFlags.length) * 100)
    : 0;
  const allComplete = completedFlags.every(Boolean);

  // Mark the whole lesson complete once everything is finished
  useEffect(() => {
    if (!allComplete) return;
  
    setShowCompletionModal(true);
  
    // If there is no active profile, open the switcher first
    if (!activeProfile) {
      openSwitcher?.();
      return;
    }
  
    markLessonComplete(LESSON_KEY, {
      badgeId: BADGES.complete,
      points: POINTS.complete,
    });
  }, [allComplete, activeProfile, markLessonComplete, openSwitcher]);
  
  // Allow closing completion modal with Escape
  useEffect(() => {
    if (!showCompletionModal) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowCompletionModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCompletionModal]);

  // Badge display data for the achievements section
  const achievements = [
    {
      id: "sim",
      label: "Partition Explorer",
      description: "Run the Quick Sort visual simulator.",
      earned: simulatorTouched,
      icon: "🧭",
    },
    {
      id: "warm",
      label: "Pivot Picker",
      description: "Complete the warm-up partition activity.",
      earned: warmupDone,
      icon: "🎯",
    },
    {
      id: "ex",
      label: "Quick Sort Adventurer",
      description: "Complete all four interactive exercises.",
      earned: ex1Done && ex2Done && ex3Done && ex4Done,
      icon: "🎮",
    },
    {
      id: "quiz",
      label: "Quick Quiz Master",
      description: "Pass the Quick Sort quiz (perfect score).",
      earned: quizPassed,
      icon: "🏆",
    },
  ];

   // Helper: check whether an array index is inside the currently active recursive range
  const inRange = (idx) => {
    const rg = currentStep?.range;
    if (!rg) return false;
    return idx >= rg.l && idx <= rg.r;
  };

  // Step-specific highlights for the visualiser
  const pivotIdx = currentStep?.pivotIndex;
  const swapPair = currentStep?.swap || null;
  const iPtr = currentStep?.i;
  const jPtr = currentStep?.j;

  return (
    <>
    {/* Skip link improves keyboard accessibility */}
      <a className="skip-link" href="#main">
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
            <li aria-current="page">Quick sort</li>
          </ol>
        </nav>

        {/* Header action buttons */}
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

        {/* Accessibility dropdown */}
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

             {/* Keyboard shortcut help */}
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
              <Link to="/merge-sort">Merge sort</Link>
            </li>
            <li>
              <Link className="active" to="/quick-sort">
                Quick sort
              </Link>
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

        {/* Main content */}
        <main id="main" className="content">
          <div className="bubble-lesson quick-lesson">
            {/* Header */}
            <header className="lesson-header">
              <div className="lesson-breadcrumbs">Algorithms &gt; Sorting &gt; Quick Sort</div>

              <div className="lesson-header-main">
                <div>
                  <h1>Quick Sort – Pivot, Partition, Recurse</h1>
                  <p>
                    Learn how Quick Sort uses a pivot to split data into smaller groups, then sorts each group using
                    divide-and-conquer.
                  </p>
                </div>

                {/* Overall lesson progress bar */}
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
                Unlock badges as you master partitioning, pivot choices, and performance intuition.
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

            {/* Hero section */}
            <section className="lesson-hero">
              <div className="lesson-hero-text">
                <h2>Fast in practice — when pivots behave</h2>
                <ul>
                  <li>Pick a pivot and partition values into left vs right.</li>
                  <li>Pivot ends in its final correct position after partitioning.</li>
                  <li>Balanced partitions → fast. Bad pivots repeatedly → slow.</li>
                </ul>
                {/* Smooth scroll to simulator */}
                <button
                  className="btn-primary"
                  onClick={() => {
                    const el = document.getElementById("quick-visual-simulator");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Start Quick Sort
                </button>
              </div>

               {/* Small visual preview */}
              <div className="lesson-hero-preview">
                <div className="preview-array">
                  {[8, 3, 5, 1, 9, 2, 7, 4].map((v, i) => (
                    <div key={i} className="preview-bar" style={{ height: `${40 + v}px` }}>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <p className="preview-caption">Quick Sort partitions around a pivot.</p>
              </div>
            </section>

            {/* Warm-up section */}
            <section className="lesson-section">
              <h2>Warm-up: Pivot &amp; partition</h2>
              <p className="section-intro">
                Quick Sort only “clicks” when partitioning makes sense. Practice: choose a pivot and place values
                on the correct side.
              </p>

              <div className="concept-builder">
                <div className="concept-builder-text">
                  <h3>Mini partition warm-up 🎯</h3>
                  <p>
                    Step 1: pick a pivot. Step 2: for each other number, send it{" "}
                    <strong>LEFT if ≤ pivot</strong> or <strong>RIGHT if &gt; pivot</strong>.
                  </p>
                  <button className="btn-ghost" onClick={warmReset}>
                    Reset warm-up
                  </button>
                </div>

                <div className="concept-builder-interactive">
                  <div style={{ fontWeight: 800 }}>Choose a pivot</div>
                  {/* Pivot choice buttons */}
                  <div className="card-row">
                    {warmArray.map((v, idx) => (
                      <button
                        key={idx}
                        className={"number-card" + (idx === warmPivotIndex ? " number-card-selected" : "")}
                        onClick={() => warmChoosePivot(idx)}
                        disabled={warmCompleted}
                        aria-label={`Choose pivot ${v}`}
                      >
                        {v} {idx === warmPivotIndex ? " (pivot)" : ""}
                      </button>
                    ))}
                  </div>

                   {/* Partitioning practice card */}
                  <div className="card-exercise" style={{ background: "var(--bg-softer)" }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                      Place numbers around pivot <span style={{ color: "var(--accent)" }}>{warmPivotValue}</span>
                    </div>

                    <div className="card-row" style={{ alignItems: "center", gap: 10 }}>
                      {warmArray.map((v, idx) => {
                        if (idx === warmPivotIndex) return null;

                        const placedL = warmLeft.includes(idx);
                        const placedR = warmRight.includes(idx);
                        const placed = placedL || placedR;

                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              className="number-card"
                              style={{
                                cursor: "default",
                                opacity: placed ? 0.6 : 1,
                                borderColor: placedL
                                  ? "rgba(21, 128, 61, 0.35)"
                                  : placedR
                                  ? "rgba(234, 88, 12, 0.35)"
                                  : undefined,
                                background: placedL
                                  ? "rgba(21, 128, 61, 0.10)"
                                  : placedR
                                  ? "rgba(234, 88, 12, 0.10)"
                                  : undefined,
                              }}
                            >
                              {v}
                            </span>

                            <button
                              className="btn-icon"
                              onClick={() => warmPlace(idx, "L")}
                              disabled={warmCompleted || placed}
                              aria-label={`Place ${v} left`}
                            >
                              ⬅ Left
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => warmPlace(idx, "R")}
                              disabled={warmCompleted || placed}
                              aria-label={`Place ${v} right`}
                            >
                              Right ➡
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Left and right zones */}
                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="card-exercise" style={{ background: "var(--bg-soft)" }}>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>LEFT (≤ pivot)</div>
                        <div className="card-row">
                          {warmLeft.length === 0 ? (
                            <span style={{ color: "var(--muted)" }}>Add items…</span>
                          ) : (
                            warmLeft.map((idx) => (
                              <span key={idx} className="number-card" style={{ cursor: "default" }}>
                                {warmArray[idx]}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="card-exercise" style={{ background: "var(--bg-soft)" }}>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>RIGHT (&gt; pivot)</div>
                        <div className="card-row">
                          {warmRight.length === 0 ? (
                            <span style={{ color: "var(--muted)" }}>Add items…</span>
                          ) : (
                            warmRight.map((idx) => (
                              <span key={idx} className="number-card" style={{ cursor: "default" }}>
                                {warmArray[idx]}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {warmMsg && <div className="feedback-text">{warmMsg}</div>}
                  </div>
                </div>
              </div>
            </section>

            {/* Explanation */}
            <section className="lesson-section">
              <article className="card">
                <h2>What is Quick Sort?</h2>
                <p>
                  Quick Sort is a <strong>divide-and-conquer</strong> sorting algorithm. It works by choosing a{" "}
                  <strong>pivot</strong>, splitting (partitioning) the array so that smaller values go to the left and
                  larger values go to the right, then recursively sorting those subarrays.
                </p>

                <h3>How it works (high-level)</h3>
                <ol>
                  <li>Choose a pivot (e.g., first, last, random, or median-of-three).</li>
                  <li> Partition: items less than the pivot go left (&lt;), greater than go right (&gt;)
                  (equal elements depend on implementation).</li>
                  <li>Pivot ends up in its final correct position.</li>
                  <li>Recursively quick sort the left and right partitions.</li>
                </ol>

                <h3>Real-life analogy</h3>
                <p>
                  Imagine you’re organising a line of students by height. Pick one student as the “pivot”, then ask
                  everyone shorter to stand on the left and taller on the right. Now you have two smaller groups that
                  you can organise the same way — that’s Quick Sort.
                </p>
              </article>
            </section>

            {/* Visual simulator */}
            <section className="lesson-section" id="quick-visual-simulator">
              <h2>Quick Sort Visual Simulator</h2>
              <p className="section-intro">
                Watch pivot choice, partitioning, and recursion. Notice how the pivot moves into its final position
                after each partition.
              </p>

              <div className="simulator-grid">
                <div className="simulator-left">
                  {/* Array input area */}
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
                  
                   {/* Visualiser controls */}
                  <div className="simulator-controls">
                    <div className="simulator-buttons">
                      <button className="btn-icon" onClick={handleStepBack} disabled={currentStepIndex === 0}>
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
                      {/* Shortcuts help toggle */}
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
                     {/* Shortcuts help panel */}
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
                  {/* Simulator options */}
                    <div className="simulator-options">
                      <div className="option-group">
                        <span className="option-label">Speed:</span>
                        <label>
                          <input
                            type="radio"
                            name="quick-speed"
                            checked={animationSpeed === "slow"}
                            onChange={() => setAnimationSpeed("slow")}
                          />
                          Slow
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="quick-speed"
                            checked={animationSpeed === "normal"}
                            onChange={() => setAnimationSpeed("normal")}
                          />
                          Normal
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="quick-speed"
                            checked={animationSpeed === "fast"}
                            onChange={() => setAnimationSpeed("fast")}
                          />
                          Fast
                        </label>
                      </div>

                      <div className="option-group">
                        <span className="option-label">Pivot:</span>
                        {["first", "last", "random", "median"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={"btn-icon" + (pivotStrategy === p ? " btn-selected" : "")}
                            onClick={() => setPivotStrategy(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <div className="option-group">
                        <span className="option-label">View:</span>
                        <label>
                          <input
                            type="radio"
                            name="quick-view"
                            checked={representationMode === "bars"}
                            onChange={() => setRepresentationMode("bars")}
                          />
                          Bars
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="quick-view"
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

                  {/* Main visualiser display */}
                  <div className="simulator-visual">
                    <div className="array-visual">
                      {currentStep.array.map((v, idx) => {
                        const inActive = highlightActiveRange && inRange(idx);

                        const classNames = [
                          "array-item",
                          representationMode === "circles" ? "array-item-circle" : "array-item-bar",
                        ];

                        if (inActive) classNames.push("array-item-comparing");

                        // extra “meaning” highlights (pivot, i, j, swap)
                        const isPivot = pivotIdx === idx && (currentStep.phase !== "done");
                        const isSwapA = swapPair?.a === idx;
                        const isSwapB = swapPair?.b === idx;
                        const isI = typeof iPtr === "number" && iPtr === idx;
                        const isJ = typeof jPtr === "number" && jPtr === idx;

                        const extraStyle =
                          isPivot
                            ? { outline: "3px solid rgba(37,99,235,0.55)", outlineOffset: 2 }
                            : isSwapA || isSwapB
                            ? { outline: "3px solid rgba(234,88,12,0.55)", outlineOffset: 2 }
                            : isI || isJ
                            ? { outline: "3px solid rgba(21,128,61,0.45)", outlineOffset: 2 }
                            : undefined;

                        const badge =
                          isPivot ? "PIVOT" : isSwapA || isSwapB ? "SWAP" : isI ? "i" : isJ ? "j" : "";

                        return (
                          <div
                            key={idx}
                            className={classNames.join(" ")}
                            style={extraStyle}
                            aria-label={`Index ${idx}, value ${v}${
                              isPivot ? ", pivot" : ""
                            }${inActive ? ", active range" : ""}`}
                          >
                            {representationMode === "bars" && (
                              <div
                                className="array-item-bar-inner"
                                style={{ height: `${20 + v * 1.1}px` }}
                              />
                            )}
                            <span className="array-item-value">{v}</span>

                            {/* Small badge shown above important elements */}
                            {badge && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: -10,
                                  fontSize: "0.7rem",
                                  background: "var(--bg-soft)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  color: "var(--muted)",
                                }}
                              >
                                {badge}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Step explanation below the visualiser */}
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
                          pivot ={" "}
                          <code>
                            {typeof currentStep?.pivotIndex === "number"
                              ? `${currentStep.pivotValue} @ ${currentStep.pivotIndex}`
                              : "-"}
                          </code>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right panel: explanation of what you’re seeing */}
                <div className="simulator-right">
                  <h3>Partition &amp; recursion hints</h3>
                  <p className="section-intro">
                    Watch for: pivot selection, scanning pointer <strong>j</strong>, boundary pointer <strong>i</strong>,
                    swaps, then recursive ranges.
                  </p>

                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <span className="exercise-pill">🔵 Pivot (blue outline)</span>
                      <span className="exercise-pill">🟢 i / j pointers (green outline)</span>
                      <span className="exercise-pill">🟠 Swap step (orange outline)</span>
                    </div>

                    <div style={{ marginTop: 10, color: "var(--muted)", fontSize: "0.9rem" }}>
                      <div>
                        <strong>Pivot rule:</strong> after partition, pivot is in its final correct position.
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <strong>Recursion:</strong> Quick Sort then repeats on the left and right subarrays.
                      </div>
                      {/* Display a visual version of the recursive call stack */}
                      {currentStep?.stack?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontWeight: 800, marginBottom: 6 }}>“Call stack” (intuition)</div>
                          <div className="card-row">
                            {currentStep.stack.slice(0, 6).map((rg, idx) => (
                              <span key={idx} className="number-card" style={{ cursor: "default" }}>
                                [{rg.l}..{rg.r}]
                              </span>
                            ))}
                            {currentStep.stack.length > 6 && (
                              <span className="exercise-pill">+{currentStep.stack.length - 6} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Code view tabs for different languages */}
                  <QuickCodeTabs currentStep={currentStep} />
                </div>
              </div>
            </section>

            {/* Complexity */}
            <section className="lesson-section">
              <h2>Time &amp; space complexity</h2>

              <div className="complexity-grid">
                <div>
                  <p>
                    Quick Sort is often fast in practice. When pivots split the array into fairly even halves, the depth
                    is about <code>log₂(n)</code>, giving <strong>O(n log n)</strong>.
                  </p>
                  <ul>
                    <li>
                      Best / average (good pivots): <code>O(n log n)</code>
                    </li>
                    <li>
                      Worst (bad pivots repeatedly): <code>O(n²)</code>
                    </li>
                    <li>
                      Space (in-place partition typical): <code>O(log n)</code> recursion stack on average
                    </li>
                  </ul>
                </div>

                {/* Interactive complexity comparison */}
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
                      <span>Typical (≈ n log n)</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill fast"
                          style={{
                            width: `${Math.min(100, (approximateNLogN(complexityN) / 600) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">≈ {approximateNLogN(complexityN)}</span>
                    </div>

                    <div className="complexity-row">
                      <span>Worst case (≈ n²)</span>
                      <div className="complexity-bar">
                        <div
                          className="complexity-bar-fill bubble"
                          style={{
                            width: `${Math.min(100, ((complexityN * complexityN) / 1500) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="complexity-value">≈ {complexityN * complexityN}</span>
                    </div>
                  </div>

                  <p className="complexity-caption">
                    Quick Sort shines when pivots keep partitions balanced — and struggles when partitions are extremely
                    unbalanced.
                  </p>
                </div>
              </div>
            </section>

            {/* Interactive exercises component */}
            <QuickSortExercises
              onComplete={(key) => {
                if (key === "ex1") setEx1Done(true);
                if (key === "ex2") setEx2Done(true);
                if (key === "ex3") setEx3Done(true);
                if (key === "ex4") setEx4Done(true);
              }}
            />

            {/* Quiz section */}
            <section className="lesson-section lesson-quiz" id="quick-quiz">
              <h2>Mini quiz</h2>
              <p className="section-intro">
                Check your understanding of pivot choice, partitioning, recursion, and performance.
              </p>

              <div className="quiz">
                {QUICK_QUIZ.map((q) => {
                  const selected = quizAnswers[q.id];
                  let explanation = null;

                   // Show explanation only after quiz submission
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
                              name={`quick-quiz-${q.id}`}
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
                      Score: {quizScore} / {QUICK_QUIZ.length} {quizPassed ? "🎉 Great job!" : "Keep practising!"}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Summary section */}
            <section className="lesson-section lesson-summary">
              <h2>Summary &amp; next steps</h2>

              <div className="summary-grid">
                <div>
                  <h3>Key ideas</h3>
                  <ul>
                    <li>
                      Quick Sort uses <strong>pivot + partition</strong>, then sorts subarrays recursively.
                    </li>
                    <li>
                      Partition places the pivot in its <strong>final position</strong>.
                    </li>
                    <li>
                      Balanced partitions → <code>O(n log n)</code>; bad pivot choices repeatedly → <code>O(n²)</code>.
                    </li>
                    <li>
                      Quick Sort is usually <strong>not stable</strong> in typical in-place implementations.
                    </li>
                  </ul>

                  <h4>Quick self-check</h4>
                  <ul>
                    <li>What does partition guarantee about the pivot?</li>
                    <li>Why do balanced pivots make Quick Sort fast?</li>
                    <li>What input patterns can cause worst-case behaviour?</li>
                  </ul>
                </div>

                {/* Navigation to related pages */}
                <div className="summary-next">
                  <h3>Where to go next?</h3>
                  <Link to="/merge-sort" className="btn-secondary">
                    ↩ Review Merge Sort
                  </Link>
                  <Link to="/selection-sort" className="btn-secondary">
                    🔁 Review Selection Sort
                  </Link>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("quick-visual-simulator");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    🔄 Replay the visualiser
                  </button>
                </div>
              </div>
            </section>

            {/* Completion modal shown after everything is complete */}
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
                  <p>You completed Quick Sort and earned <strong>{POINTS.complete}</strong> bonus points 🎉</p>

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
        <p>© 2025 SortAcademy · Quick Sort Page</p>
      </footer>
    </>
  );
};

/* ============================================================
  Code Tabs (Quick Sort)
============================================================ */

// This component shows the Quick Sort algorithm in multiple languages
// and highlights lines that relate to the current visualisation step
const QuickCodeTabs = ({ currentStep }) => {
  const [activeTab, setActiveTab] = useState("python");

   // Decide which code lines should be highlighted based on the current phase
  const highlightLine = (lineNumber) => {
    const ph = currentStep?.phase || "init";
    if (ph === "pivot-choice") return lineNumber === 4 || lineNumber === 5;
    if (ph === "partition-start") return lineNumber === 8 || lineNumber === 9;
    if (ph === "compare") return lineNumber === 10 || lineNumber === 11;
    if (ph === "swap") return lineNumber === 12;
    if (ph === "pivot-place") return lineNumber === 14;
    if (ph === "recurse") return lineNumber === 16 || lineNumber === 17;
    if (ph === "base") return lineNumber === 2;
    return lineNumber === 1;
  };

  const pythonCode = [
    "def quicksort(a, l, r):",
    "    if l >= r: return",
    "    p = partition(a, l, r)",
    "    quicksort(a, l, p-1)",
    "    quicksort(a, p+1, r)",
    "",
    "def partition(a, l, r):  # Lomuto",
    "    pivot = a[r]",
    "    i = l - 1",
    "    for j in range(l, r):",
    "        if a[j] <= pivot:",
    "            i += 1; a[i], a[j] = a[j], a[i]",
    "    a[i+1], a[r] = a[r], a[i+1]",
    "    return i+1",
  ];

  const javaCode = [
    "void quickSort(int[] a, int l, int r) {",
    "  if (l >= r) return;",
    "  int p = partition(a, l, r);",
    "  quickSort(a, l, p-1);",
    "  quickSort(a, p+1, r);",
    "}",
    "",
    "int partition(int[] a, int l, int r) { // Lomuto",
    "  int pivot = a[r];",
    "  int i = l - 1;",
    "  for (int j = l; j < r; j++) {",
    "    if (a[j] <= pivot) {",
    "      i++; swap(a, i, j);",
    "    }",
    "  }",
    "  swap(a, i+1, r);",
    "  return i+1;",
    "}",
  ];

  const cppCode = [
    "void quickSort(vector<int>& a, int l, int r) {",
    "  if (l >= r) return;",
    "  int p = partition(a, l, r);",
    "  quickSort(a, l, p-1);",
    "  quickSort(a, p+1, r);",
    "}",
    "",
    "int partition(vector<int>& a, int l, int r) {",
    "  int pivot = a[r];",
    "  int i = l - 1;",
    "  for (int j = l; j < r; j++) {",
    "    if (a[j] <= pivot) {",
    "      i++; swap(a[i], a[j]);",
    "    }",
    "  }",
    "  swap(a[i+1], a[r]);",
    "  return i+1;",
    "}",
  ];

  const pseudoCode = [
    "procedure quickSort(A, l, r):",
    "    if l ≥ r: return",
    "    p ← partition(A, l, r)",
    "    quickSort(A, l, p-1)",
    "    quickSort(A, p+1, r)",
    "",
    "procedure partition(A, l, r):",
    "    pivot ← A[r]",
    "    i ← l-1",
    "    for j from l to r-1:",
    "        if A[j] ≤ pivot:",
    "            i ← i+1; swap A[i], A[j]",
    "    swap A[i+1], A[r]",
    "    return i+1",
  ];

  // Render a syntax-style code block with line numbers and highlights
  const renderCodeBlock = (lines, baseLineNumber = 1) => (
    <pre className="code-block">
      {lines.map((line, idx) => {
        const lineNumber = baseLineNumber + idx;
        const strongHighlight = highlightLine(lineNumber);

        // Slightly highlight structural lines even when they are not the active focus
        const isStructural =
          line.includes("if") ||
          line.includes("for") ||
          line.includes("return") ||
          line.includes("partition") ||
          line.includes("pivot") ||
          line.includes("swap") ||
          line.includes("quickSort") ||
          line.includes("quicksort");

        return (
          <div
            key={idx}
            className={
              "code-line" + (strongHighlight ? " code-line-active" : isStructural ? " code-line-hinted" : "")
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
       {/* Tab buttons */}
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

      {/* Code body for the selected tab */}
      <div className="code-tabs-body">
        {activeTab === "python" && renderCodeBlock(pythonCode)}
        {activeTab === "java" && renderCodeBlock(javaCode)}
        {activeTab === "cpp" && renderCodeBlock(cppCode)}
        {activeTab === "pseudo" && renderCodeBlock(pseudoCode)}
      </div>
    </div>
  );
};

export default QuickSortLesson;
