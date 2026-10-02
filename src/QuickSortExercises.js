// src/QuickSortExercises.js
import React, { useEffect, useMemo, useState } from "react";

/* ============================================================
  Utilities
============================================================ */

// Generate a random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check whether an array is sorted in ascending order
function isSortedAsc(arr) {
  for (let i = 1; i < arr.length; i++) if (arr[i - 1] > arr[i]) return false;
  return true;
}

// Restrict a number so it stays within the range [lo, hi]
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/* ============================================================
  EX1: Partition activity helpers
============================================================ */

// Create a random array for partition practice
// If the array happens to already be sorted, tweak it slightly
function makePartitionArray(len = 8) {
  const arr = Array.from({ length: len }, () => randInt(1, 20));
  if (isSortedAsc(arr)) arr[0] += 7;
  return arr;
}

// Pick a default pivot index based on the selected pivot strategy
function defaultPivotIndex(arr, strategy = "last") {
  if (!arr.length) return 0;

  // First element as pivot
  if (strategy === "first") return 0;

  // Random pivot
  if (strategy === "random") return randInt(0, arr.length - 1);

   // Median-of-three pivot: pick the median of first, middle, and last values
  if (strategy === "median") {
    const l = 0;
    const r = arr.length - 1;
    const m = Math.floor((l + r) / 2);

    const trio = [
      { idx: l, v: arr[l] },
      { idx: m, v: arr[m] },
      { idx: r, v: arr[r] },
    ].sort((a, b) => a.v - b.v);
    return trio[1].idx;
  }
  
  // Default: last element as pivot
  return arr.length - 1;
}

/* ============================================================
  EX2: Pivot quality helper
============================================================ */

// Classify how balanced a pivot split is
// This helps explain whether a chosen pivot is good or poor
function balanceClass(arr, pivotIdx) {
  const pivot = arr[pivotIdx];

  // Count how many items would go left of the pivot
  const left = arr.filter((x, i) => i !== pivotIdx && x <= pivot).length;

  // Remaining items go to the right
  const right = arr.length - 1 - left;
  const diff = Math.abs(left - right);

  if (diff <= 1) return "balanced";
  if (diff <= 3) return "okay";
  return "unbalanced";
}

/* ============================================================
  EX3: Books
============================================================ */

// Create a set of books with random heights for a real-life partition task
function makeBooks(n = 8) {
  const heights = Array.from({ length: n }, () => randInt(10, 35));
  const emojis = ["📘", "📗", "📙", "📕", "📓", "📔", "📒", "📚"];
  return heights.map((h, i) => ({
    id: `B${i + 1}`,
    height: h,
    emoji: emojis[i % emojis.length],
  }));
}

/* ============================================================
  EX4: Performance Playground - REAL pivot simulation
============================================================ */

// Generate input data in different patterns for performance comparison
function generateDataPattern(n, pattern) {
  const base = Array.from({ length: n }, () => randInt(1, 99));
  if (pattern === "random") return base;
  const sorted = [...base].sort((a, b) => a - b);
  if (pattern === "sorted") return sorted;
  if (pattern === "reverse") return [...sorted].reverse();
  return base;
}

// Choose a pivot index for the actual Quick Sort simulation
function choosePivotIndexForMode(a, l, r, mode) {
  if (mode === "first") return l;
  if (mode === "random") return l + Math.floor(Math.random() * (r - l + 1));
  if (mode === "median") {
    const m = Math.floor((l + r) / 2);
    const trio = [
      { idx: l, v: a[l] },
      { idx: m, v: a[m] },
      { idx: r, v: a[r] },
    ].sort((x, y) => x.v - y.v);
    return trio[1].idx;
  }
  return r; // default = last
}

// Simulate Quick Sort and count comparisons, swaps, and recursion depth
function simulateQuickSortCounts(arr, pivotMode = "last") {
  const a = [...arr];
  let comparisons = 0;
  let swaps = 0;
  let maxDepth = 0;

  // Swap two values in the array and count the swap
  function swap(i, j) {
    if (i === j) return;
    swaps++;
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }

  // Lomuto partition scheme with configurable pivot choice
  function partition(l, r, depth) {
  // choose pivot index based on pivotMode, then move pivot to end for Lomuto
    const pIdx = choosePivotIndexForMode(a, l, r, pivotMode);
    if (pIdx !== r) swap(pIdx, r);

    // Place pivot in its final sorted position
    const pivot = a[r];
    let i = l - 1;

    for (let j = l; j < r; j++) {
      comparisons++;
      if (a[j] <= pivot) {
        i++;
        swap(i, j);
      }
    }

    // Place pivot in its final sorted position
    swap(i + 1, r);
    return i + 1;
  }

   // Recursive Quick Sort
  function qs(l, r, depth) {
    maxDepth = Math.max(maxDepth, depth);
    if (l >= r) return;
    const p = partition(l, r, depth);
    qs(l, p - 1, depth + 1);
    qs(p + 1, r, depth + 1);
  }

  qs(0, a.length - 1, 1);

  return { comparisons, swaps, maxDepth };
}

/* ============================================================
  Component
============================================================ */

// Track which exercise tab is active
export default function QuickSortExercises({ onComplete }) {
  const [activeTab, setActiveTab] = useState("ex1");

  // Notify parent component when an exercise is completed
  const markComplete = (key) => typeof onComplete === "function" && onComplete(key);

  // Shared inline style for pill-shaped counters / labels
  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--bg-softer)",
    color: "var(--muted)",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  };

  /* ============================================================
    EX1: Partition Simulator
  ============================================================ */

  // Guided mode gives hints, challenge mode gives fewer hints
  const [ex1Mode, setEx1Mode] = useState("guided"); // guided | challenge
 
  // Current pivot strategy for selecting a default pivot
  const [ex1PivotStrategy, setEx1PivotStrategy] = useState("last");

  // Array used for partition practice
  const [ex1Array, setEx1Array] = useState(() => makePartitionArray(8));

  // Current pivot index in the array
  const [ex1PivotIdx, setEx1PivotIdx] = useState(() => defaultPivotIndex(ex1Array, "last"));

  // Current pivot value
  const ex1PivotValue = ex1Array[ex1PivotIdx];

  // Track which indices the user has placed on the left and right
  const [ex1Left, setEx1Left] = useState([]); // indices
  const [ex1Right, setEx1Right] = useState([]); // indices

  // Feedback message and message type
  const [ex1Msg, setEx1Msg] = useState("Choose a pivot, then place each number LEFT (≤ pivot) or RIGHT (> pivot).");
  const [ex1MsgType, setEx1MsgType] = useState("tip"); // tip | success | error

  // Completion state
  const [ex1Completed, setEx1Completed] = useState(false);

  // Number of values already placed
  const ex1PlacedCount = ex1Left.length + ex1Right.length;

  // How many values still remain to be placed
  const ex1Remaining = Math.max(0, (ex1Array.length - 1) - ex1PlacedCount);

  // Reset exercise 1 with a new array and pivot based on chosen strategy
  const ex1Reset = (strategy = ex1PivotStrategy) => {
    const arr = makePartitionArray(8);
    setEx1Array(arr);
    setEx1PivotStrategy(strategy);
    setEx1PivotIdx(defaultPivotIndex(arr, strategy));
    setEx1Left([]);
    setEx1Right([]);
    setEx1Completed(false);
    setEx1MsgType("tip");
    setEx1Msg("New array generated ✅ Pick / confirm a pivot, then partition.");
  };

  // When pivot strategy changes, update pivot and clear progress
  useEffect(() => {
    setEx1PivotIdx(defaultPivotIndex(ex1Array, ex1PivotStrategy));
    setEx1Left([]);
    setEx1Right([]);
    setEx1Completed(false);
    setEx1MsgType("tip");
    setEx1Msg(`Pivot strategy set to ${ex1PivotStrategy.toUpperCase()}. Now partition around the pivot.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex1PivotStrategy]);

  // Let the user manually choose a pivot
  const ex1ChoosePivot = (idx) => {
    if (ex1Completed) return;
    setEx1PivotIdx(idx);
    setEx1Left([]);
    setEx1Right([]);
    setEx1MsgType("tip");
    setEx1Msg(`Pivot chosen: ${ex1Array[idx]} 🔵 Now place each other value left or right.`);
  };

  // Place one value either left or right of the pivot
  const ex1Place = (idx, side) => {
    if (ex1Completed) return;
    if (idx === ex1PivotIdx) return;
    if (ex1Left.includes(idx) || ex1Right.includes(idx)) return;

    const value = ex1Array[idx];
    const correctSide = value <= ex1PivotValue ? "L" : "R";

    // Wrong placement
    if (side !== correctSide) {
      setEx1MsgType("error");
      if (ex1Mode === "guided") {
        setEx1Msg(`❌ ${value} should go ${correctSide === "L" ? "LEFT (≤ pivot)" : "RIGHT (> pivot)"} of pivot ${ex1PivotValue}.`);
      } else {
        setEx1Msg("❌ Incorrect placement.");
      }
      return;
    }

    // Update state + completion check WITHOUT stale derived state
    const totalToPlace = ex1Array.length - 1;
    const placedSoFar = ex1Left.length + ex1Right.length + 1;

     // Add to correct side
    if (side === "L") setEx1Left((a) => [...a, idx]);
    else setEx1Right((a) => [...a, idx]);

    // Check for completion
    if (placedSoFar === totalToPlace) {
      setEx1Completed(true);
      setEx1MsgType("success");
      setEx1Msg("🎉 Partition complete! Now notice: the pivot’s final position is between LEFT and RIGHT.");
      markComplete("ex1");
    } else {
      setEx1MsgType("success");
      setEx1Msg("✅ Correct — keep placing the remaining numbers.");
    }
  };

  // Build a “final partition layout” row: LEFT | PIVOT | RIGHT
  // Keep order as placed, but you could also keep original array order.
  const ex1PartitionedLayout = useMemo(() => {
    const leftVals = ex1Left.map((i) => ex1Array[i]);
    const rightVals = ex1Right.map((i) => ex1Array[i]);
    const pivotVal = ex1Array[ex1PivotIdx];

    // In partitioning, pivot’s final index is the size of the left region
    const pivotFinalIndex = leftVals.length;
    return { leftVals, rightVals, pivotVal, pivotFinalIndex };
  }, [ex1Left, ex1Right, ex1Array, ex1PivotIdx]);

  /* ============================================================
    EX2: Pivot Choice Challenge
  ============================================================ */

  // Array for pivot quality prediction
  const [ex2Array, setEx2Array] = useState(() => makePartitionArray(10));

  // Selected pivot index
  const [ex2PickIdx, setEx2PickIdx] = useState(null);

  // User's prediction: balanced / okay / unbalanced
  const [ex2Prediction, setEx2Prediction] = useState(null);
  const [ex2Msg, setEx2Msg] = useState("Pick a pivot, then predict if it creates a balanced split.");
  const [ex2MsgType, setEx2MsgType] = useState("tip");
  const [ex2Completed, setEx2Completed] = useState(false);

  // Completion target and score tracking
  const [ex2Target, setEx2Target] = useState(3); // require 3 correct
  const [ex2Score, setEx2Score] = useState({ correct: 0, tries: 0 });
  // Input pattern for the current challenge
  const [ex2Pattern, setEx2Pattern] = useState("random"); // random | sorted | reverse

  // Reset exercise 2 and optionally choose a different array pattern
  const ex2Reset = (pattern = ex2Pattern) => {
    let arr = makePartitionArray(10);
    if (pattern === "sorted") arr = [...arr].sort((a, b) => a - b);
    if (pattern === "reverse") arr = [...arr].sort((a, b) => b - a);

    setEx2Array(arr);
    setEx2PickIdx(null);
    setEx2Prediction(null);
    setEx2MsgType("tip");
    setEx2Msg("New challenge ✅ Pick a pivot and predict the split.");
    setEx2Completed(false);
    setEx2Score({ correct: 0, tries: 0 });
  };

  // Compute the actual split quality for the chosen pivot
  const ex2ActualClass = useMemo(() => {
    if (ex2PickIdx == null) return null;
    return balanceClass(ex2Array, ex2PickIdx);
  }, [ex2Array, ex2PickIdx]);

  // Extra insight shown after pivot selection
  const ex2Insight = useMemo(() => {
    if (ex2PickIdx == null) return null;
    const pivot = ex2Array[ex2PickIdx];
    const leftCount = ex2Array.filter((x, i) => i !== ex2PickIdx && x <= pivot).length;
    const rightCount = ex2Array.length - 1 - leftCount;

    const complexityHint =
      ex2ActualClass === "balanced"
        ? "Balanced partitions often lead to ~O(n log n)."
        : ex2ActualClass === "okay"
        ? "Not perfect, but still usually efficient."
        : "Repeated unbalanced partitions can drift toward O(n²).";

    return { pivot, leftCount, rightCount, complexityHint };
  }, [ex2Array, ex2PickIdx, ex2ActualClass]);

  // Check the user's prediction
  const ex2Submit = () => {
    if (ex2PickIdx == null) {
      setEx2MsgType("error");
      setEx2Msg("Pick a pivot first.");
      return;
    }
    if (!ex2Prediction) {
      setEx2MsgType("error");
      setEx2Msg("Choose a prediction (balanced / okay / unbalanced).");
      return;
    }

    const actual = ex2ActualClass;
    const isCorrect = actual === ex2Prediction;

     // Update score
    setEx2Score((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      tries: s.tries + 1,
    }));

    if (isCorrect) {
      setEx2MsgType("success");
      setEx2Msg(`✅ Correct! That pivot creates a ${actual.toUpperCase()} split.`);
      const nextCorrect = ex2Score.correct + 1;
      if (nextCorrect >= ex2Target) {
        setEx2Completed(true);
        markComplete("ex2");
      }
    } else {
      setEx2MsgType("error");
      setEx2Msg(`❌ Not quite. Actual: ${actual.toUpperCase()}. Try a different pivot.`);
    }
  };

  /* ============================================================
    EX3: Books by Height (real-life + mini recursion)
  ============================================================ */

  // Bookshelf data for real-world Quick Sort analogy
  const [ex3Books, setEx3Books] = useState(() => makeBooks(8));

   // Currently selected pivot book
  const [ex3PivotId, setEx3PivotId] = useState(() => ex3Books[3]?.id || "B4");

  // The pivot book object
  const ex3Pivot = useMemo(() => ex3Books.find((b) => b.id === ex3PivotId) || ex3Books[0], [ex3Books, ex3PivotId]);

  const [ex3Left, setEx3Left] = useState([]); // ids
  const [ex3Right, setEx3Right] = useState([]); // ids
  const [ex3Msg, setEx3Msg] = useState("Pick a pivot book, then move shorter books left and taller books right.");
  const [ex3MsgType, setEx3MsgType] = useState("tip");
  const [ex3Completed, setEx3Completed] = useState(false);

  // mini recursion (just a small extra interactive step)
  const [ex3Mini, setEx3Mini] = useState({ active: false, shelf: null, items: [] });

  // Small extra step to illustrate recursion after partitioning
  const ex3Reset = () => {
    const books = makeBooks(8);
    setEx3Books(books);
    setEx3PivotId(books[3]?.id || books[0].id);
    setEx3Left([]);
    setEx3Right([]);
    setEx3Completed(false);
    setEx3MsgType("tip");
    setEx3Msg("New bookshelf ✅ Choose a pivot book and partition by height.");
    setEx3Mini({ active: false, shelf: null, items: [] });
  };

   // Choose a pivot book
  const ex3ChoosePivot = (id) => {
    if (ex3Completed) return;
    setEx3PivotId(id);
    setEx3Left([]);
    setEx3Right([]);
    setEx3Mini({ active: false, shelf: null, items: [] });
    const book = ex3Books.find((b) => b.id === id);
    setEx3MsgType("tip");
    setEx3Msg(`Pivot book: ${book?.emoji} ${book?.height}cm. Now place others left/right.`);
  };

   // Move a book left or right of the pivot book
  const ex3Move = (id, side) => {
    if (ex3Completed) return;
    if (id === ex3PivotId) return;
    if (ex3Left.includes(id) || ex3Right.includes(id)) return;

    const book = ex3Books.find((b) => b.id === id);
    const pivotH = ex3Pivot?.height ?? 0;
    const correctSide = (book?.height ?? 0) <= pivotH ? "L" : "R";

     // Incorrect move
    if (side !== correctSide) {
      setEx3MsgType("error");
      setEx3Msg(`❌ ${book?.emoji} ${book?.height}cm should go ${correctSide === "L" ? "LEFT (shorter/equal)" : "RIGHT (taller)"} of ${pivotH}cm.`);
      return;
    }

    const totalToPlace = ex3Books.length - 1;
    const placedSoFar = ex3Left.length + ex3Right.length + 1;

    // Add to correct side
    if (side === "L") setEx3Left((a) => [...a, id]);
    else setEx3Right((a) => [...a, id]);

    // Check completion
    if (placedSoFar === totalToPlace) {
      setEx3Completed(true);
      setEx3MsgType("success");
      setEx3Msg("🎉 Great! You partitioned the bookshelf. Next: Quick Sort would recurse on each shelf.");
      markComplete("ex3");
    } else {
      setEx3MsgType("success");
      setEx3Msg("✅ Correct — keep sorting the remaining books.");
    }
  };

  // Convert selected IDs into actual book objects for left/right shelves
  const ex3LeftBooks = useMemo(() => ex3Left.map((id) => ex3Books.find((b) => b.id === id)).filter(Boolean), [ex3Left, ex3Books]);
  const ex3RightBooks = useMemo(() => ex3Right.map((id) => ex3Books.find((b) => b.id === id)).filter(Boolean), [ex3Right, ex3Books]);

  // Start a mini recursion preview on either left or right shelf
  const ex3StartMiniRecursion = (which) => {
    if (!ex3Completed) return;
    const source = which === "left" ? ex3LeftBooks : ex3RightBooks;
    // take up to 4 to keep it lightweight
    const items = source.slice(0, 4);
    setEx3Mini({ active: true, shelf: which, items });
  };

  /* ============================================================
    EX4: Performance Playground (real pivot simulation + table)
  ============================================================ */

  // Size of input array
  const [ex4N, setEx4N] = useState(18);

  // Chosen pivot rule for simulation
  const [ex4PivotMode, setEx4PivotMode] = useState("last");

  // Data pattern: random / sorted / reverse
  const [ex4Pattern, setEx4Pattern] = useState("random");

   // Current data array
  const [ex4Data, setEx4Data] = useState(() => generateDataPattern(18, "random"));

  // Feedback and completion state
  const [ex4Msg, setEx4Msg] = useState("Run experiments and compare swaps/comparisons.");
  const [ex4MsgType, setEx4MsgType] = useState("tip");
  const [ex4Completed, setEx4Completed] = useState(false);

  // Saved comparison runs
  const [ex4Runs, setEx4Runs] = useState([]); // saved comparisons

  // Generate fresh data for the chosen size and pattern
  const ex4Generate = (pattern = ex4Pattern, n = ex4N) => {
    const data = generateDataPattern(n, pattern);
    setEx4Data(data);
    setEx4MsgType("tip");
    setEx4Msg(`Generated ${pattern.toUpperCase()} data. Now compare pivot strategies.`);
  };

  // Generate initial data on first load
  useEffect(() => {
    ex4Generate(ex4Pattern, ex4N);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

   // Current simulation results for the chosen data and pivot mode
  const ex4Result = useMemo(() => simulateQuickSortCounts(ex4Data, ex4PivotMode), [ex4Data, ex4PivotMode]);

  /// Detect a common worst-case combination
  const ex4WorstCaseWarning =
    (ex4Pattern === "sorted" || ex4Pattern === "reverse") &&
    (ex4PivotMode === "first" || ex4PivotMode === "last");

  // Save one run of Quick Sort stats
  const ex4Run = () => {
    const { comparisons, swaps, maxDepth } = ex4Result;

    setEx4MsgType("success");
    setEx4Msg(
      `✅ Run complete — comparisons: ${comparisons}, swaps: ${swaps}, max depth: ${maxDepth}.`
      + (ex4WorstCaseWarning ? " ⚠️ This setup often risks worst-case behaviour." : "")
    );

    // Save run to comparison table
    setEx4Runs((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        pattern: ex4Pattern,
        pivot: ex4PivotMode,
        n: ex4N,
        comparisons,
        swaps,
        maxDepth,
      },
      ...prev,
    ]);

    if (!ex4Completed) {
      setEx4Completed(true);
      markComplete("ex4");
    }
  };

  /* ============================================================
    Tabs
  ============================================================ */

  // Tab labels for the four activities
  const tabs = [
    { id: "ex1", title: "Exercise 1" },
    { id: "ex2", title: "Exercise 2" },
    { id: "ex3", title: "Exercise 3" },
    { id: "ex4", title: "Exercise 4" },
  ];

   // Helper to choose correct feedback style class
  const feedbackClass = (type) =>
    type === "success" ? "feedback-text feedback-success" : type === "error" ? "feedback-text feedback-error" : "feedback-text feedback-tip";

  return (
    <section className="lesson-section">
      <h2>Interactive exercises</h2>

      {/* Tab navigation */}
      <div className="exercise-tabs" role="tablist" aria-label="Exercises">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            id={`tab-${t.id}`}
            role="tab"
            aria-controls={`panel-${t.id}`}
            aria-selected={activeTab === t.id}
            className={activeTab === t.id ? "exercise-tab active" : "exercise-tab"}
            onClick={() => setActiveTab(t.id)}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* ================= EX1 ================= */}
      {activeTab === "ex1" && (
        <div id="panel-ex1" role="tabpanel" aria-labelledby="tab-ex1" className="exercise">
          <h3>Exercise 1: Partition Practice 🔁</h3>
          <p>
            Choose a pivot, then place each number: <strong>LEFT (≤ pivot)</strong> or <strong>RIGHT (&gt; pivot)</strong>.
          </p>

          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div className="option-group" style={{ gap: 10, flexWrap: "wrap" }}>
              <span className="option-label">Mode:</span>

              {/* Guided vs challenge mode buttons */}
              {["guided", "challenge"].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={"btn-icon" + (ex1Mode === m ? " btn-selected" : "")}
                  onClick={() => {
                    setEx1Mode(m);
                    setEx1MsgType("tip");
                    setEx1Msg(m === "guided" ? "Guided mode: you’ll get helpful hints." : "Challenge mode: fewer hints!");
                  }}
                >
                  {m}
                </button>
              ))}

              <span className="option-label" style={{ marginLeft: 6 }}>Pivot strategy:</span>
              {/* Default pivot strategy buttons */}
              {["first", "last", "random", "median"].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={"btn-icon" + (ex1PivotStrategy === p ? " btn-selected" : "")}
                  onClick={() => setEx1PivotStrategy(p)}
                >
                  {p}
                </button>
              ))}
              
               {/* Remaining unplaced items */}
              <span style={pillStyle}>
                remaining <strong style={{ color: "var(--text)" }}>{ex1Remaining}</strong>
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>Status: <strong>{ex1Completed ? "Completed ✅" : "Working…"}</strong></span>
              <button className="btn-ghost" onClick={() => ex1Reset(ex1PivotStrategy)}>New array</button>
            </div>
          </div>

         {/* Step 1: choose pivot */}
          <div className="card-exercise" style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Step 1: Choose a pivot (🔵)</div>
            <div className="card-row">
              {ex1Array.map((v, idx) => (
                <button
                  key={idx}
                  className={"number-card" + (idx === ex1PivotIdx ? " number-card-selected quick-pivot" : "")}
                  onClick={() => ex1ChoosePivot(idx)}
                  disabled={ex1Completed}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

           {/* Step 2: place values left or right of pivot */}
          <div className="card-exercise" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              Step 2: Place items around pivot <span style={{ color: "var(--accent)" }}>{ex1PivotValue}</span>
            </div>

            <div className="card-row" style={{ alignItems: "center", gap: 10 }}>
              {ex1Array.map((v, idx) => {
                if (idx === ex1PivotIdx) return null;

                const placedL = ex1Left.includes(idx);
                const placedR = ex1Right.includes(idx);
                const placed = placedL || placedR;

                const extraClass = placedL ? " placed placed-left" : placedR ? " placed placed-right" : "";

                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={"number-card" + extraClass} style={{ cursor: "default" }}>
                      {v}
                    </span>

                    <button className="btn-icon" onClick={() => ex1Place(idx, "L")} disabled={ex1Completed || placed}>
                      ⬅ Left
                    </button>
                    <button className="btn-icon" onClick={() => ex1Place(idx, "R")} disabled={ex1Completed || placed}>
                      Right ➡
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Left and right partition zones */}
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card-exercise quick-zone-left">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>🟢 LEFT (≤ pivot)</div>
                <div className="card-row">
                  {ex1Left.length === 0 ? (
                    <span style={{ color: "var(--muted)" }}>Place items here…</span>
                  ) : (
                    ex1Left.map((i) => (
                      <span key={`L-${i}`} className="number-card placed-left" style={{ cursor: "default" }}>
                        {ex1Array[i]}
                      </span>
                    ))
                  )}
                </div>
                <div className="card-exercise-caption">Subarray to be sorted next (recursion).</div>
              </div>

              <div className="card-exercise quick-zone-right">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>🟠 RIGHT (&gt; pivot)</div>
                <div className="card-row">
                  {ex1Right.length === 0 ? (
                    <span style={{ color: "var(--muted)" }}>Place items here…</span>
                  ) : (
                    ex1Right.map((i) => (
                      <span key={`R-${i}`} className="number-card placed-right" style={{ cursor: "default" }}>
                        {ex1Array[i]}
                      </span>
                    ))
                  )}
                </div>
                <div className="card-exercise-caption">Subarray to be sorted next (recursion).</div>
              </div>
            </div>
          </div>

         {/* Final partition layout after completion */}
          {ex1Completed && (
            <div className="card-exercise" style={{ marginTop: 12, background: "var(--bg-softer)" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Pivot final position ✅</div>
              <div style={{ color: "var(--muted)" }}>
                The pivot’s final index equals the size of the LEFT region:
                <strong> {ex1PartitionedLayout.pivotFinalIndex}</strong>
              </div>

              <div className="partition-layout" style={{ marginTop: 10 }}>
                <div className="partition-block">
                  <div className="partition-label">LEFT</div>
                  <div className="card-row">
                    {ex1PartitionedLayout.leftVals.length ? ex1PartitionedLayout.leftVals.map((v, i) => (
                      <span key={i} className="number-card placed-left" style={{ cursor: "default" }}>{v}</span>
                    )) : <span style={{ color: "var(--muted)" }}>empty</span>}
                  </div>
                </div>

                <div className="partition-block partition-pivot">
                  <div className="partition-label">PIVOT</div>
                  <span className="number-card quick-pivot" style={{ cursor: "default" }}>
                    {ex1PartitionedLayout.pivotVal}
                  </span>
                </div>

                <div className="partition-block">
                  <div className="partition-label">RIGHT</div>
                  <div className="card-row">
                    {ex1PartitionedLayout.rightVals.length ? ex1PartitionedLayout.rightVals.map((v, i) => (
                      <span key={i} className="number-card placed-right" style={{ cursor: "default" }}>{v}</span>
                    )) : <span style={{ color: "var(--muted)" }}>empty</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

           {/* Feedback message */}
          {ex1Msg && <div className={feedbackClass(ex1MsgType)}>{ex1Msg}</div>}
        </div>
      )}

      {/* ================= EX2 ================= */}
      {activeTab === "ex2" && (
        <div id="panel-ex2" role="tabpanel" aria-labelledby="tab-ex2" className="exercise">
          <h3>Exercise 2: Pivot Quality 🎯</h3>
          <p>
            Pick a pivot and predict the split quality. Complete when you get <strong>{ex2Target}</strong> correct predictions.
          </p>

         {/* Explanation of quality bands */}
          <div className="card-exercise" style={{ background: "var(--bg-softer)" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>What counts as “balanced”?</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)" }}>
              <li><strong>Balanced:</strong> left/right differ by ≤ 1</li>
              <li><strong>Okay:</strong> differ by ≤ 3</li>
              <li><strong>Unbalanced:</strong> differ by &gt; 3</li>
            </ul>
          </div>

          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={pillStyle}>
                correct <strong style={{ color: "var(--text)" }}>{ex2Score.correct}</strong> / {ex2Target}
              </span>
              <span style={pillStyle}>
                tries <strong style={{ color: "var(--text)" }}>{ex2Score.tries}</strong>
              </span>

              <span className="option-label" style={{ marginLeft: 6 }}>Round type:</span>
              {["random", "sorted", "reverse"].map((p) => (
                <button
                  key={p}
                  className={"btn-icon" + (ex2Pattern === p ? " btn-selected" : "")}
                  onClick={() => {
                    setEx2Pattern(p);
                    ex2Reset(p);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>Status: <strong>{ex2Completed ? "Completed ✅" : "Predicting…"}</strong></span>
              <button className="btn-ghost" onClick={() => ex2Reset(ex2Pattern)}>New challenge</button>
            </div>
          </div>

           {/* Pivot selection */}
          <div className="card-exercise" style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Pick a pivot</div>
            <div className="card-row">
              {ex2Array.map((v, idx) => (
                <button
                  key={idx}
                  className={"number-card" + (ex2PickIdx === idx ? " number-card-selected quick-pivot" : "")}
                  onClick={() => setEx2PickIdx(idx)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

           {/* Prediction options */}
          <div className="card-exercise" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Your prediction</div>
            <div className="exercise-options">
              {["balanced", "okay", "unbalanced"].map((x) => (
                <button
                  key={x}
                  className={"exercise-option" + (ex2Prediction === x ? " exercise-option-selected" : "")}
                  onClick={() => setEx2Prediction(x)}
                >
                  {x}
                </button>
              ))}
            </div>

            <div className="exercise-footer" style={{ justifyContent: "flex-start", marginTop: 10 }}>
              <button className="btn-primary" onClick={ex2Submit}>Check prediction</button>
            </div>
          </div>

           {/* Insight panel with bar visualisation */}
          {ex2Insight && (
            <div className="card-exercise" style={{ marginTop: 12, background: "var(--bg-softer)" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Partition insight</div>

              <div className="split-bars">
                <div className="split-bar">
                  <span>Left</span>
                  <div className="split-track">
                    <div className="split-fill" style={{ width: `${(ex2Insight.leftCount / (ex2Array.length - 1)) * 100}%` }} />
                  </div>
                  <span>{ex2Insight.leftCount}</span>
                </div>

                <div className="split-bar">
                  <span>Right</span>
                  <div className="split-track">
                    <div className="split-fill" style={{ width: `${(ex2Insight.rightCount / (ex2Array.length - 1)) * 100}%` }} />
                  </div>
                  <span>{ex2Insight.rightCount}</span>
                </div>
              </div>

              <div style={{ marginTop: 8, color: "var(--muted)" }}>{ex2Insight.complexityHint}</div>
            </div>
          )}

          {ex2Msg && <div className={feedbackClass(ex2MsgType)}>{ex2Msg}</div>}
        </div>
      )}

      {/* ================= EX3 ================= */}
      {activeTab === "ex3" && (
        <div id="panel-ex3" role="tabpanel" aria-labelledby="tab-ex3" className="exercise">
          <h3>Exercise 3: Bookshelf Partition 📚</h3>
          <p>
            Real-life Quick Sort: pick a pivot book, then place <strong>shorter/equal</strong> left and <strong>taller</strong> right.
          </p>

          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={pillStyle}>pivot <strong style={{ color: "var(--text)" }}>{ex3Pivot?.height ?? "-"}cm</strong></span>
              <span style={pillStyle}>left <strong style={{ color: "var(--text)" }}>{ex3Left.length}</strong></span>
              <span style={pillStyle}>right <strong style={{ color: "var(--text)" }}>{ex3Right.length}</strong></span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>Status: <strong>{ex3Completed ? "Completed ✅" : "Sorting…"}</strong></span>
              <button className="btn-ghost" onClick={ex3Reset}>New bookshelf</button>
            </div>
          </div>

        
          {/* Choose pivot book */}
          <div className="card-exercise" style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Choose a pivot book</div>
            <div className="card-row">
              {ex3Books.map((b) => (
                <button
                  key={b.id}
                  className={"number-card" + (b.id === ex3PivotId ? " number-card-selected quick-pivot" : "")}
                  onClick={() => ex3ChoosePivot(b.id)}
                  disabled={ex3Completed}
                >
                  {b.emoji} {b.height}cm
                </button>
              ))}
            </div>
          </div>

           {/* Place books around pivot */}
          <div className="card-exercise" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              Place around pivot <span style={{ color: "var(--accent)" }}>{ex3Pivot?.height ?? "-"}cm</span>
            </div>

            <div className="card-row" style={{ alignItems: "center", gap: 10 }}>
              {ex3Books.map((b) => {
                if (b.id === ex3PivotId) return null;

                const placedL = ex3Left.includes(b.id);
                const placedR = ex3Right.includes(b.id);
                const placed = placedL || placedR;

                const extraClass = placedL ? " placed placed-left" : placedR ? " placed placed-right" : "";

                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={"number-card" + extraClass} style={{ cursor: "default" }}>
                      {b.emoji} {b.height}cm
                    </span>

                    <button className="btn-icon" onClick={() => ex3Move(b.id, "L")} disabled={ex3Completed || placed}>
                      ⬅ Shorter
                    </button>
                    <button className="btn-icon" onClick={() => ex3Move(b.id, "R")} disabled={ex3Completed || placed}>
                      Taller ➡
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="shelf-grid" style={{ marginTop: 12 }}>
              <div className="shelf-box shelf-left">
                <div className="shelf-title">🟢 Left shelf (shorter/equal)</div>
                <div className="card-row">
                  {ex3LeftBooks.length === 0 ? (
                    <span style={{ color: "var(--muted)" }}>Move books here…</span>
                  ) : (
                    ex3LeftBooks.map((b) => (
                      <span key={b.id} className="number-card placed-left" style={{ cursor: "default" }}>
                        {b.emoji} {b.height}cm
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="shelf-box shelf-right">
                <div className="shelf-title">🟠 Right shelf (taller)</div>
                <div className="card-row">
                  {ex3RightBooks.length === 0 ? (
                    <span style={{ color: "var(--muted)" }}>Move books here…</span>
                  ) : (
                    ex3RightBooks.map((b) => (
                      <span key={b.id} className="number-card placed-right" style={{ cursor: "default" }}>
                        {b.emoji} {b.height}cm
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mini recursion preview */}
          {ex3Completed && (
            <div className="card-exercise" style={{ marginTop: 12, background: "var(--bg-softer)" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Mini recursion (what happens next?)</div>
              <div style={{ color: "var(--muted)" }}>
                Quick Sort would now run again on the left and right shelves.
                Try a mini “next step”:
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button className="btn-secondary" onClick={() => ex3StartMiniRecursion("left")} disabled={!ex3LeftBooks.length}>
                  Sort left shelf
                </button>
                <button className="btn-secondary" onClick={() => ex3StartMiniRecursion("right")} disabled={!ex3RightBooks.length}>
                  Sort right shelf
                </button>
              </div>

              {ex3Mini.active && (
                <div className="card-exercise" style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 700 }}>
                    You selected: <span style={{ color: "var(--accent)" }}>{ex3Mini.shelf}</span> shelf
                  </div>
                  <div style={{ color: "var(--muted)", marginTop: 4 }}>
                    Quick Sort would pick a pivot again and partition this smaller shelf.
                  </div>
                  <div className="card-row" style={{ marginTop: 8 }}>
                    {ex3Mini.items.map((b) => (
                      <span key={b.id} className="number-card" style={{ cursor: "default" }}>
                        {b.emoji} {b.height}cm
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Feedback */}
          {ex3Msg && <div className={feedbackClass(ex3MsgType)}>{ex3Msg}</div>}
        </div>
      )}

      {/* ================= EX4 ================= */}
      {activeTab === "ex4" && (
        <div id="panel-ex4" role="tabpanel" aria-labelledby="tab-ex4" className="exercise">
          <h3>Exercise 4: Performance Playground 🚀</h3>
          <p>
            Compare real Quick Sort counters: <strong>comparisons</strong>, <strong>swaps</strong>, and <strong>max recursion depth</strong>.
          </p>

          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div className="option-group" style={{ gap: 10, flexWrap: "wrap" }}>
              <span className="option-label">n:</span>

              {/* Slider for input size */}
              <input
                type="range"
                min="8"
                max="30"
                value={ex4N}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setEx4N(n);
                  ex4Generate(ex4Pattern, n);
                }}
                style={{ width: 180 }}
              />
              <span style={pillStyle}>size <strong style={{ color: "var(--text)" }}>{ex4N}</strong></span>

              <span className="option-label" style={{ marginLeft: 6 }}>pattern:</span>
               {/* Pattern selection buttons */}
              {["random", "sorted", "reverse"].map((p) => (
                <button
                  key={p}
                  className={"btn-icon" + (ex4Pattern === p ? " btn-selected" : "")}
                  onClick={() => {
                    setEx4Pattern(p);
                    ex4Generate(p, ex4N);
                  }}
                >
                  {p}
                </button>
              ))}

              <span className="option-label" style={{ marginLeft: 6 }}>pivot:</span>
              {["first", "last", "random", "median"].map((m) => (
                <button
                  key={m}
                  className={"btn-icon" + (ex4PivotMode === m ? " btn-selected" : "")}
                  onClick={() => setEx4PivotMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>Status: <strong>{ex4Completed ? "Completed ✅" : "Experimenting…"}</strong></span>
              <button
                className="btn-ghost"
                onClick={() => {
                  ex4Generate(ex4Pattern, ex4N);
                  setEx4Completed(false);
                  setEx4MsgType("tip");
                  setEx4Msg("Fresh data generated ✅ Run again to compare.");
                }}
              >
                New data
              </button>
            </div>
          </div>

          {/* Warning for common worst-case setup */}
          {ex4WorstCaseWarning && (
            <div className="warning-pill" style={{ marginTop: 10 }}>
              ⚠️ Worst-case risk: sorted/reverse + first/last pivot often creates very unbalanced partitions.
            </div>
          )}

          {/* Preview of generated data */}
          <div className="card-exercise" style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Data preview</div>
            <div className="card-row">
              {ex4Data.slice(0, 18).map((v, i) => (
                <span key={i} className="number-card" style={{ cursor: "default" }}>{v}</span>
              ))}
              {ex4Data.length > 18 && <span style={pillStyle}>+{ex4Data.length - 18} more</span>}
            </div>
          </div>

         {/* Results panel */}
          <div className="card-exercise" style={{ marginTop: 12, background: "var(--bg-softer)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 800 }}>Results</div>
                <div style={{ color: "var(--muted)", marginTop: 4 }}>
                  These counters come from a real quicksort simulation with your chosen pivot mode.
                </div>
              </div>
              <button className="btn-primary" onClick={ex4Run}>Run Quick Sort ▶</button>
            </div>

           
            {/* Counter pills */}
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={pillStyle}>comparisons <strong style={{ color: "var(--text)" }}>{ex4Result.comparisons}</strong></span>
              <span style={pillStyle}>swaps <strong style={{ color: "var(--text)" }}>{ex4Result.swaps}</strong></span>
              <span style={pillStyle}>max depth <strong style={{ color: "var(--text)" }}>{ex4Result.maxDepth}</strong></span>
            </div>

              {/* Bar-style visual comparison */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 6 }}>
                Visual comparison (scaled)
              </div>
              <div className="complexity-bars">
                <div className="complexity-row">
                  <span>Comparisons</span>
                  <div className="complexity-bar">
                    <div className="complexity-bar-fill fast" style={{ width: `${clamp((ex4Result.comparisons / 350) * 100, 0, 100)}%` }} />
                  </div>
                  <span className="complexity-value">{ex4Result.comparisons}</span>
                </div>

                <div className="complexity-row">
                  <span>Swaps</span>
                  <div className="complexity-bar">
                    <div className="complexity-bar-fill bubble" style={{ width: `${clamp((ex4Result.swaps / 220) * 100, 0, 100)}%` }} />
                  </div>
                  <span className="complexity-value">{ex4Result.swaps}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Saved runs table */}
          <div className="card-exercise" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800 }}>Saved runs</div>
              <button className="btn-ghost" onClick={() => setEx4Runs([])} disabled={!ex4Runs.length}>Clear</button>
            </div>

            {!ex4Runs.length ? (
              <div style={{ color: "var(--muted)", marginTop: 8 }}>Run a few experiments to compare results.</div>
            ) : (
              <div className="runs-table-wrap" style={{ marginTop: 10 }}>
                <table className="runs-table">
                  <thead>
                    <tr>
                      <th>Pattern</th>
                      <th>Pivot</th>
                      <th>n</th>
                      <th>Comparisons</th>
                      <th>Swaps</th>
                      <th>Max depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex4Runs.slice(0, 8).map((r) => (
                      <tr key={r.id}>
                        <td>{r.pattern}</td>
                        <td>{r.pivot}</td>
                        <td>{r.n}</td>
                        <td>{r.comparisons}</td>
                        <td>{r.swaps}</td>
                        <td>{r.maxDepth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
 
          {/* Feedback */}
          {ex4Msg && <div className={feedbackClass(ex4MsgType)}>{ex4Msg}</div>}
        </div>
      )}
    </section>
  );
}
