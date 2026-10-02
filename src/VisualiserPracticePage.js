// src/VisualiserPracticePage.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useGuestProfile, ProfileChip } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; // general styles for the website
import "./VisualiserPracticePage.css"; // specific styles for this page

// imported from VisualiserPracticeData file
import {
  clamp,
  parseInputArray,
  makeRandomArray,
  makeReversedArray,
  makeNearlySortedArray,
  makeDuplicatesArray,
  buildStepsForAlgo,
  PSEUDOCODE,
  INSIGHTS,
  getVarLabel,
} from "./VisualiserPracticeData";

// Lesson key used when marking this page complete in guest progress
const LESSON_KEY = "lesson_visualiser";

// Badge IDs used in the guest profile system
const BADGES = {
  explore: "badge_visualiser_explore",
  practice: "badge_visualiser_practice",
  compare: "badge_visualiser_compare",
  streak: "badge_visualiser_streak",
  complete: "badge_visualiser_complete",
};

// Point rewards linked to each badge/achievement
const POINTS = {
  explore: 10,
  practice: 15,
  compare: 15,
  streak: 20,
  complete: 50,
};


export default function VisualiserPracticePage() {
  // --- nav/accessibility state ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  // Guest profile helpers for awarding badges and recording progress
  const { activeProfile, awardBadge, markLessonComplete, openSwitcher } = useGuestProfile();

  // UI states for optional panels
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);

  // Current page mode: visualiser, practice, or compare
  const [mode, setMode] = useState("visualiser"); // visualiser | practice | compare

  // Dataset controls
  const [pattern, setPattern] = useState("Random");
  const [size, setSize] = useState(10);
  const [speed, setSpeed] = useState(650);
  const [customInput, setCustomInput] = useState("");

  // Base array used as the starting dataset for all modes
  const [baseArray, setBaseArray] = useState(() => makeRandomArray(10));

  // --- single (visualiser/practice) ---
  const [algorithm, setAlgorithm] = useState("Bubble");
  const [singleSteps, setSingleSteps] = useState([]);
  const [singleIdx, setSingleIdx] = useState(0);
  const [displayArray, setDisplayArray] = useState(() => [...baseArray]);

  // --- compare ---
  const [algoA, setAlgoA] = useState("Bubble");
  const [algoB, setAlgoB] = useState("Insertion");
  const [stepsA, setStepsA] = useState([]);
  const [stepsB, setStepsB] = useState([]);
  const [compareIdx, setCompareIdx] = useState(0);
  const [displayA, setDisplayA] = useState(() => [...baseArray]);
  const [displayB, setDisplayB] = useState(() => [...baseArray]);

  // shared playback
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  // practice
  const [guessA, setGuessA] = useState("");
  const [guessB, setGuessB] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // learning support prediction
  const [prediction, setPrediction] = useState("");
  const [predictionNote, setPredictionNote] = useState("");

  // Badge / completion tracking states
  const [explored, setExplored] = useState(false);
  const [practiceUsed, setPracticeUsed] = useState(false);
  const [compareUsed, setCompareUsed] = useState(false);
  const [streakAchieved, setStreakAchieved] = useState(false);

  const allComplete =
  explored &&
  practiceUsed &&
  compareUsed &&
  streakAchieved;

   // --- load saved accessibility prefs ---
  useEffect(() => {
    const savedContrast = localStorage.getItem("sat_contrast") === "1";
    const savedDyslexia = localStorage.getItem("sat_dyslexia") === "1";
    const savedLargeText = localStorage.getItem("sat_largetext") === "1";
    setContrast(savedContrast);
    setDyslexia(savedDyslexia);
    setLargeText(savedLargeText);
  }, []);

    // Apply/remove high-contrast class and save preference
  useEffect(() => {
    document.body.classList.toggle("contrast", contrast);
    localStorage.setItem("sat_contrast", contrast ? "1" : "0");
  }, [contrast]);

    // Apply/remove dyslexia-friendly font class and save preference
  useEffect(() => {
    document.body.classList.toggle("dyslexia", dyslexia);
    localStorage.setItem("sat_dyslexia", dyslexia ? "1" : "0");
  }, [dyslexia]);

    // Apply/remove large text class and save preference
  useEffect(() => {
    document.body.classList.toggle("large-text", largeText);
    localStorage.setItem("sat_largetext", largeText ? "1" : "0");
  }, [largeText]);

  // When all completion conditions are met, mark the lesson complete
  useEffect(() => {
    if (!allComplete) return;
  
    // If there is no active profile, prompt the profile switcher first
    if (!activeProfile) {
      openSwitcher?.();
      return;
    }
  
    // Mark the lesson complete and award the completion badge/points
    markLessonComplete(LESSON_KEY, {
      badgeId: BADGES.complete,
      points: POINTS.complete,
    });
  }, [allComplete, activeProfile, markLessonComplete, openSwitcher]);
  
  // Stops playback and clears the timer
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // Choose the currently active step index depending on mode
  const activeIdx = mode === "compare" ? compareIdx : singleIdx;
  const activeSetIdx = mode === "compare" ? setCompareIdx : setSingleIdx;

  // Total number of available steps in single mode
  const singleLen = useMemo(() => Math.max(singleSteps.length, 1), [singleSteps.length]);

  // Total number of available steps in compare mode
  const compareLen = useMemo(() => Math.max(stepsA.length, stepsB.length, 1), [stepsA.length, stepsB.length]);
  
  // Active max step count depending on current mode
  const activeMaxLen = mode === "compare" ? compareLen : singleLen;

  // Prevent changing dataset controls while animation is playing
  const disableDatasetControls = isPlaying;

  // Clears all temporary practice inputs and feedback
  const clearPracticeState = useCallback(() => {
    setPracticeFeedback(null);
    setGuessA("");
    setGuessB("");
    setSelectedIndices([]);
    setStreak(0);
    setBestStreak((b) => b);
  }, []);

  // Regenerates the dataset using either custom input or the selected pattern
  const regenerateArray = useCallback(
    (nextPattern = pattern, nextSize = size) => {
      let arr;

      // Use the custom array if the user typed valid input
      if (customInput.trim()) {
        const parsed = parseInputArray(customInput);
        if (parsed && parsed.length >= 2) arr = parsed.map((n) => clamp(Math.floor(n), -999, 999));
        else arr = makeRandomArray(nextSize);
      } else {
        // Otherwise generate an array based on the selected pattern
        if (nextPattern === "Random") arr = makeRandomArray(nextSize);
        if (nextPattern === "Reversed") arr = makeReversedArray(nextSize);
        if (nextPattern === "Nearly") arr = makeNearlySortedArray(nextSize);
        if (nextPattern === "Duplicates") arr = makeDuplicatesArray(nextSize);
      }

      // Reset playback and practice state when a new array is created
      stopPlayback();
      clearPracticeState();
      setPrediction("");
      setPredictionNote("");

      // Update all array-related displays
      setBaseArray(arr);
      setSingleIdx(0);
      setCompareIdx(0);

      setDisplayArray(arr);
      setDisplayA(arr);
      setDisplayB(arr);
    },
    [pattern, size, customInput, stopPlayback, clearPracticeState]
  );

   // Applies a new dataset size and regenerates the array
  const applySize = useCallback(
    (next) => {
      const n = clamp(next, 5, 35);
      setSize(n);
      regenerateArray(pattern, n);
    },
    [pattern, regenerateArray]
  );

  // Applies a new pattern and regenerates the array
  const applyPattern = useCallback(
    (next) => {
      setPattern(next);
      regenerateArray(next, size);
    },
    [size, regenerateArray]
  );

  // rebuild steps (single)
  useEffect(() => {
    const s = buildStepsForAlgo(algorithm, baseArray);
    setSingleSteps(s);
    setSingleIdx(0);
    setDisplayArray(baseArray);
    clearPracticeState();
  }, [algorithm, baseArray, clearPracticeState]);

  // rebuild steps (compare)
  useEffect(() => {
    const sA = buildStepsForAlgo(algoA, baseArray);
    const sB = buildStepsForAlgo(algoB, baseArray);
    setStepsA(sA);
    setStepsB(sB);
    setCompareIdx(0);
    setDisplayA(baseArray);
    setDisplayB(baseArray);
  }, [algoA, algoB, baseArray]);

  // Playback loop: automatically moves through steps at the chosen speed
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      activeSetIdx((idx) => {
        const next = idx + 1;
        if (next >= activeMaxLen) {
          setIsPlaying(false);
          return idx;
        }
        return next;
      });
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isPlaying, speed, activeMaxLen, activeSetIdx]);

  // Get the currently visible step for single mode
  const currentSingleStep =
    singleSteps[Math.min(singleIdx, Math.max(0, singleSteps.length - 1))] || null;

  // Get the currently visible steps for compare mode
  const currentStepA = stepsA[Math.min(compareIdx, Math.max(0, stepsA.length - 1))] || null;
  const currentStepB = stepsB[Math.min(compareIdx, Math.max(0, stepsB.length - 1))] || null;

  // Update displayed bars in single mode whenever the step changes
  useEffect(() => {
    if (currentSingleStep?.array) setDisplayArray(currentSingleStep.array);
  }, [singleIdx, currentSingleStep]);

  // Update displayed bars in compare mode whenever the step changes
  useEffect(() => {
    if (currentStepA?.array) setDisplayA(currentStepA.array);
    if (currentStepB?.array) setDisplayB(currentStepB.array);
  }, [compareIdx, currentStepA, currentStepB]);

  // Clear selected practice bars whenever the step changes
  useEffect(() => {
    setSelectedIndices([]);
  }, [singleIdx]);

  // Award exploration badge once the user has played the visualiser
  useEffect(() => {
    if (!activeProfile) return;
    if (explored) awardBadge(BADGES.explore, { points: POINTS.explore });
  }, [explored, activeProfile, awardBadge]);
  
  // Award practice badge once the user uses practice mode
  useEffect(() => {
    if (!activeProfile) return;
    if (practiceUsed) awardBadge(BADGES.practice, { points: POINTS.practice });
  }, [practiceUsed, activeProfile, awardBadge]);
  
  // Award compare badge once compare mode has been meaningfully used
  useEffect(() => {
    if (!activeProfile) return;
    if (compareUsed) awardBadge(BADGES.compare, { points: POINTS.compare });
  }, [compareUsed, activeProfile, awardBadge]);
  
  // Award streak badge once the user achieves the required streak
  useEffect(() => {
    if (!activeProfile) return;
    if (streakAchieved) awardBadge(BADGES.streak, { points: POINTS.streak });
  }, [streakAchieved, activeProfile, awardBadge]);

  // Move forward one step
  const stepForward = useCallback(() => {
    stopPlayback();
    setPracticeFeedback(null);
    activeSetIdx((idx) => Math.min(idx + 1, activeMaxLen - 1));
  }, [activeMaxLen, activeSetIdx, stopPlayback]);

  // Move back one step
  const stepBack = useCallback(() => {
    stopPlayback();
    setPracticeFeedback(null);
    activeSetIdx((idx) => Math.max(idx - 1, 0));
  }, [activeSetIdx, stopPlayback]);

    // Reset the current visualisation back to the starting state
  const reset = useCallback(() => {
    stopPlayback();
    setPracticeFeedback(null);
    activeSetIdx(0);
    if (mode === "compare") {
      setDisplayA(baseArray);
      setDisplayB(baseArray);
    } else {
      setDisplayArray(baseArray);
    }
    setSelectedIndices([]);
  }, [baseArray, mode, activeSetIdx, stopPlayback]);

  // Toggle between play and pause
  const togglePlay = useCallback(() => {
    setExplored(true); //
    setPracticeFeedback(null);
     // If at the last step, restart from the beginning before playing
    activeSetIdx((idx) => (idx >= activeMaxLen - 1 ? 0 : idx));
    setIsPlaying((p) => !p);
  }, [activeMaxLen, activeSetIdx]);

  // Jump directly to a chosen step using the range slider
  const jumpToStep = useCallback(
    (idx) => {
      stopPlayback();
      setPracticeFeedback(null);
      activeSetIdx(clamp(idx, 0, activeMaxLen - 1));
    },
    [activeMaxLen, activeSetIdx, stopPlayback]
  );

    // Safely switch between visualiser, practice, and compare modes
  const setModeSafe = useCallback(
    (nextMode) => {
      stopPlayback();
      setPracticeFeedback(null);
      setSelectedIndices([]);
      setMode(nextMode);

      if (nextMode === "compare") setCompareIdx(0);
      else setSingleIdx(0);
    },
    [stopPlayback]
  );

  // Keyboard shortcuts for playback controls
  useEffect(() => {
    function onKeyDown(e) {
      const tag = e.target?.tagName?.toLowerCase?.() || "";
      const typing =
        tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable;
      if (typing) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepForward();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepBack();
      } else if (e.key?.toLowerCase?.() === "r") {
        e.preventDefault();
        reset();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, stepForward, stepBack, reset]);

  // Calculate overall progress percentage
  const progressPct = useMemo(() => {
    if (activeMaxLen <= 1) return 0;
    return Math.round((activeIdx / (activeMaxLen - 1)) * 100);
  }, [activeIdx, activeMaxLen]);

  // Mark compare mode as used once the learner has progressed far enough
  useEffect(() => {
  if (mode !== "compare") return;
  if (progressPct >= 25) {
    setCompareUsed(true);
  }
}, [mode, progressPct]);

// Determine the type of the current step for display
  const singleStepType = useMemo(() => {
    const h = currentSingleStep?.highlight || {};
    if (h.swap && h.swap.length) return "Swap/Write";
    if (h.compare && h.compare.length) return "Compare";
    if (typeof h.pivot === "number") return "Pivot";
    return "Info";
  }, [currentSingleStep]);

    // Generate the practice prompt based on the current step's upcoming action
  const practicePrompt = useMemo(() => {
    const hint = currentSingleStep?.actionHint;
    if (!hint || hint.type === "none") return "Step forward until there is a swap/write to predict.";
    if (hint.type === "swap") return "Predict: which TWO indices will be swapped next? (Click two bars or type A & B)";
    if (hint.type === "write") return "Predict: which index will be written/updated next? (Click one bar or type A)";
    return "Predict the next action.";
  }, [currentSingleStep]);

    // Returns the CSS classes needed for each bar depending on the current step
  function barClassFor(step, i, extra = {}) {
    const highlightCompare = step?.highlight?.compare || [];
    const highlightSwap = step?.highlight?.swap || [];
    const pivotIdx = step?.highlight?.pivot;
    const range = step?.highlight?.range;
    const sortedSet = new Set(step?.sorted || []);

    const cls = ["vp-bar"];
    if (sortedSet.has(i)) cls.push("is-sorted");
    if (range && i >= range[0] && i <= range[1]) cls.push("in-range");
    if (highlightCompare.includes(i)) cls.push("is-compare");
    if (highlightSwap.includes(i)) cls.push("is-swap");
    if (pivotIdx === i) cls.push("is-pivot");
    if (extra.isSelected) cls.push("is-selected");
    return cls.join(" ");
  }

  // Handles bar selection in practice mode
  const onBarClickPractice = useCallback(
    (i) => {
      if (mode !== "practice") return;
      const hint = currentSingleStep?.actionHint;
      if (!hint || hint.type === "none") return;

      stopPlayback();
      setPracticeFeedback(null);

      // Swap needs 2 selected bars, write needs 1
      const needed = hint.type === "swap" ? 2 : 1;

      setSelectedIndices((prev) => {
        let next = [...prev];

       // Toggle selection if already selected
        if (next.includes(i)) next = next.filter((x) => x !== i);
        else {
        // If full selection already exists, replace it with the new bar
          if (next.length >= needed) next = [i];
          else next.push(i);
        }

        // Keep text inputs in sync with selected bars
        if (next.length >= 1) setGuessA(String(next[0]));
        else setGuessA("");

        if (needed === 2) {
          if (next.length === 2) setGuessB(String(next[1]));
          else setGuessB("");
        } else {
          setGuessB("");
        }

        return next;
      });
    },
    [mode, currentSingleStep, stopPlayback]
  );

  //  keyboard support for focusable bars (Enter/Space)
  const onBarKeyDownPractice = useCallback(
    (e, i) => {
      if (mode !== "practice") return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onBarClickPractice(i);
      }
    },
    [mode, onBarClickPractice]
  );

  // Checks the learner's practice prediction against the actual next action
  function checkPracticeGuess() {
    if (mode !== "practice") return;
    if (!currentSingleStep?.actionHint) return;
    // Mark practice mode as used
    if (mode === "practice") {
      setPracticeUsed(true);
    }
    
    const hint = currentSingleStep.actionHint;

    // If there is no meaningful prediction at this step, tell the user to move on
    if (hint.type === "none" || hint.indices.length === 0) {
      setPracticeFeedback({
        ok: true,
        msg: "No action to predict on this step — step forward to a swap/write moment.",
      });
      return;
    }

    const target = hint.indices;
    const needed = target.length;

    // Prefer clicked bars over manual input if available
    const chosen = selectedIndices.length ? selectedIndices : [];

    let user = [];
    if (chosen.length) {
      user = chosen;
    } else {
      const a = Number(guessA);
      const b = guessB.trim() === "" ? null : Number(guessB);
      if (Number.isNaN(a) || (b !== null && Number.isNaN(b))) {
        setPracticeFeedback({ ok: false, msg: "Enter valid indices (numbers) or click bars to select." });
        return;
      }
      user = b === null ? [a] : [a, b];
    }

    // Ensure the correct number of indices has been chosen
    if (user.length !== needed) {
      setPracticeFeedback({
        ok: false,
        msg:
          needed === 2
            ? "Select TWO bars (or enter A and B) for a swap step."
            : "Select ONE bar (or enter A) for a write step.",
      });
      return;
    }

    // Compare user answer against target answer
    let ok = false;
    if (needed === 1) ok = user[0] === target[0];
    if (needed === 2) {
      const s1 = [...target].sort((x, y) => x - y).join(",");
      const s2 = [...user].sort((x, y) => x - y).join(",");
      ok = s1 === s2;
    }

    const verb = hint.type === "swap" ? "swap" : "write";

    // Update streak tracking when the learner answers correctly
    if (ok) {
      setStreak((s) => {
        const next = s + 1;
        if (next >= 3) {
          setStreakAchieved(true); 
        }
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    // Show supporting explanation if available
    const why = currentSingleStep?.why ? ` Why: ${currentSingleStep.why}` : "";
    setPracticeFeedback(
      ok
        ? { ok: true, msg: `✅ Correct! This step will ${verb} at ${target.join(", ")}.${why}` }
        : { ok: false, msg: `❌ Not quite. This step will ${verb} at ${target.join(", ")}.${why}` }
    );
  }

    // Metrics for single mode
  const singleComparisons = currentSingleStep?.comparisons ?? 0;
  const singleWrites = currentSingleStep?.writes ?? 0;
  const singleMessage = currentSingleStep?.message ?? "—";
  const singleWhy = currentSingleStep?.why ?? "";
  const singleCodeLine = currentSingleStep?.codeLine ?? -1;

  // Metrics for compare mode
  const compsA = currentStepA?.comparisons ?? 0;
  const writesA = currentStepA?.writes ?? 0;
  const msgA = currentStepA?.message ?? "—";
  const codeA = currentStepA?.codeLine ?? -1;

  const compsB = currentStepB?.comparisons ?? 0;
  const writesB = currentStepB?.writes ?? 0;
  const msgB = currentStepB?.message ?? "—";
  const codeB = currentStepB?.codeLine ?? -1;

  // Track whether each algorithm has reached its final step
  const finishedA = stepsA.length > 0 && compareIdx >= stepsA.length - 1;
  const finishedB = stepsB.length > 0 && compareIdx >= stepsB.length - 1;
  const finishedAtA = stepsA.length > 0 ? stepsA.length : 0;
  const finishedAtB = stepsB.length > 0 ? stepsB.length : 0;

  // Maximum values used to scale bar heights visually
  const maxValueSingle = useMemo(() => Math.max(10, ...displayArray), [displayArray]);
  const maxValueA = useMemo(() => Math.max(10, ...displayA), [displayA]);
  const maxValueB = useMemo(() => Math.max(10, ...displayB), [displayB]);

  // Learning support helpers
  // Applies a preset compare experiment and scrolls to the learning support section
  const applyExperiment = useCallback(
    (expPattern, expSize, a, b) => {
      stopPlayback();
      setMode("compare");
      setAlgoA(a);
      setAlgoB(b);
      setPrediction("");
      setPredictionNote("");
      setCustomInput("");
      setPattern(expPattern);
      setSize(expSize);
      regenerateArray(expPattern, expSize);
      requestAnimationFrame(() => {
        const el = document.getElementById("learning-support");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [stopPlayback, regenerateArray]
  );
  // Quickly saves a simple prediction message for the learner
  const setPredictionQuick = useCallback((text) => {
    setPrediction(text);
    setPredictionNote("Saved. Now press Play and see if your prediction matches the result.");
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      {/* TOP BAR */}
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
            <li aria-current="page">Visualiser &amp; practice</li>
          </ol>
        </nav>

        <div className="actions">
         {/* Current guest profile summary */}
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
        {/* Accessibility settings dropdown */}
        {accessOpen && (
          <div className="access-menu" role="dialog" aria-label="Accessibility options">
            <h3>Accessibility options</h3>

            <label className="access-option">
              <input type="checkbox" checked={contrast} onChange={() => setContrast((prev) => !prev)} />
              High contrast mode
            </label>

            <label className="access-option">
              <input type="checkbox" checked={dyslexia} onChange={() => setDyslexia((prev) => !prev)} />
              Dyslexia-friendly font
            </label>

            <label className="access-option">
              <input type="checkbox" checked={largeText} onChange={() => setLargeText((prev) => !prev)} />
              Larger text
            </label>

            <hr className="access-sep" />
            {/* Shortcut help shown inside accessibility menu */}
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

            {/* Reset all accessibility options */}
            <button
              className="access-reset"
              type="button"
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
       {/* ================= SIDEBAR ================= */}
        <aside id="sidebar" className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Course navigation">
          <h2 className="sidebar-title">Getting started</h2>
          <ul className="toc">
            <li>
              <Link to="/module">Module overview</Link>
            </li>
            <li>
              <Link to="/what-is-sorting">What is sorting? (recap)</Link>
            </li>
            <li>
              <a href="#learning-support">Learning support</a>
            </li>
          </ul>

          <h2 className="sidebar-title">Lessons</h2>
          <ul className="toc">
            <li>
              <Link to="/bubble-sort">Bubble sort</Link>
            </li>
            <li>
              <Link to="/Selection-sort">Selection sort</Link>
            </li>
            <li>
              <Link to="/Insertion-sort">Insertion sort</Link>
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
              <NavLink to="/visualiser" className={({ isActive }) => (isActive ? "active" : undefined)}>
                Visualiser &amp; practice
              </NavLink>
            </li>
            <li>
              <Link to="/quiz-assessment">Quiz & Assessment</Link>
            </li>
          </ul>

          <h2 className="sidebar-title">Support</h2>
          <ul className="toc">
            <li>
              <Link to="/glossary-feedback">Glossary &amp; Feedback</Link>
            </li>
          </ul>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main id="main" className="content">
          <section className="vp-pagehead">
            <div>
              <h1 className="vp-h1">Visualiser &amp; Practice</h1>
              <p className="vp-sub">Visualise step-by-step, practise predictions, or compare algorithms side-by-side.</p>
            </div>

            <div className="vp-pagehead-actions">
              <button
                className={`vp-chipbtn ${mode === "visualiser" ? "active" : ""}`}
                onClick={() => setModeSafe("visualiser")}
                type="button"
                aria-pressed={mode === "visualiser"}
              >
                Visualiser
              </button>

              <button
                className={`vp-chipbtn ${mode === "practice" ? "active" : ""}`}
                onClick={() => setModeSafe("practice")}
                type="button"
                aria-pressed={mode === "practice"}
              >
                Practice
              </button>

              <button
                className={`vp-chipbtn ${mode === "compare" ? "active" : ""}`}
                onClick={() => setModeSafe("compare")}
                type="button"
                aria-pressed={mode === "compare"}
              >
                Compare
              </button>
            </div>
          </section>

          <div className={`vp-content-grid ${mode === "compare" ? "vp-compare-layout" : ""}`}>
            <div className="vp-maincol">
              {/* ========= Visualiser / Practice ========= */}
              {mode !== "compare" && (
                <section className="vp-card vp-visual-main" aria-label="Visualisation">
                  <div className="vp-visual-top">
                    <div className="vp-visual-title">
                      <h2 className="vp-h2">Visualisation</h2>
                       {/* Current step information and metrics */}
                      <div className="vp-mini">
                        <span className="vp-mini-badge">
                          Step {Math.min(singleIdx + 1, singleLen)} / {singleLen}
                        </span>
                        <span className="vp-mini-badge is-muted">Type: {singleStepType}</span>
                        <span className="vp-mini-badge">Comparisons: {singleComparisons}</span>
                        <span className="vp-mini-badge">Swaps/Writes: {singleWrites}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="vp-progress" aria-label="Progress">
                        <div className="vp-progress-bar" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                     {/* Legend showing bar colour meanings */}
                    <div className="vp-visual-legend" aria-label="Legend">
                      <span className="vp-dot compare" /> Compare
                      <span className="vp-dot swap" /> Swap/Write
                      <span className="vp-dot pivot" /> Pivot
                      <span className="vp-dot sorted" /> Sorted
                    </div>
                  </div>
                   {/* Main bar visualisation */}
                  <div className="vp-bars" role="img" aria-label="Array visualisation as bars">
                    {displayArray.map((v, i) => {
                      const height = Math.round((v / maxValueSingle) * 100);
                      const varLabel = getVarLabel(algorithm, currentSingleStep, i);
                      const isSel = selectedIndices.includes(i);

                      return (
                        <div
                          key={i}
                          className={barClassFor(currentSingleStep, i, { isSelected: isSel })}
                          style={{ height: `${height}%` }}
                          title={`Index ${i} · Value ${v}`}
                          onClick={() => onBarClickPractice(i)}
                          onKeyDown={(e) => onBarKeyDownPractice(e, i)} // keyboard support
                          role={mode === "practice" ? "button" : undefined}
                          tabIndex={mode === "practice" ? 0 : undefined}
                        >
                          {varLabel && <span className="vp-var">{varLabel}</span>}
                          <span className="vp-bar-label">{v}</span>
                          <span className="vp-bar-index">{i}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="vp-explain" aria-live="polite">
                    <div className="vp-explain-title">What’s happening?</div>
                    <div className="vp-explain-text">{singleMessage}</div>

                    {singleWhy && (
                      <div className="vp-why">
                        <span className="vp-why-tag">Why?</span> {singleWhy}
                      </div>
                    )}
                  </div>

                  {/* Practice panel only shown in practice mode */}
                  {mode === "practice" && (
                    <div className="vp-practice" aria-label="Practice mode">
                      <div className="vp-practice-title">Practice: Predict the next action</div>

                      <div className="vp-practice-metrics">
                        <span className="vp-mini-badge">🔥 Streak: {streak}</span>
                        <span className="vp-mini-badge">🏆 Best: {bestStreak}</span>
                        <span className="vp-mini-badge is-muted">Tip: click bars (or press Enter/Space) to answer</span>
                      </div>

                      <p className="vp-practice-prompt">{practicePrompt}</p>

                     {/* Practice answer inputs */}
                      <div className="vp-practice-row">
                        <label className="vp-label small">
                          Index A
                          <input
                            className="vp-input small"
                            value={guessA}
                            onChange={(e) => setGuessA(e.target.value)}
                            placeholder="e.g., 2"
                          />
                        </label>

                        <label className="vp-label small">
                          Index B (optional)
                          <input
                            className="vp-input small"
                            value={guessB}
                            onChange={(e) => setGuessB(e.target.value)}
                            placeholder="e.g., 3"
                          />
                        </label>

                        <button className="vp-btn" onClick={checkPracticeGuess} type="button">
                          Check
                        </button>

                        {/* Clear current answer */}
                        <button
                          className="vp-btn subtle"
                          type="button"
                          onClick={() => {
                            setGuessA("");
                            setGuessB("");
                            setPracticeFeedback(null);
                            setSelectedIndices([]);
                          }}
                        >
                          Clear
                        </button>
                      </div>

                      {/* Feedback after checking answer */}
                      {practiceFeedback && (
                        <div className={`vp-feedback ${practiceFeedback.ok ? "ok" : "bad"}`}>
                          {practiceFeedback.msg}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* ========= Compare mode ========= */}
              {mode === "compare" && (
                <section className="vp-compare-grid" aria-label="Compare mode">
                  {/* Panel A */}
                  <section className="vp-card vp-compare-panel" aria-label="Algorithm A panel">
                    <div className="vp-compare-head">
                      <div className="vp-compare-title">
                        <div className="vp-compare-hrow">
                          <h2 className="vp-h2">Algorithm A</h2>
                          {finishedA && <span className="vp-finished-badge">Finished</span>}
                        </div>
                        <div className="vp-mini">
                          <span className={`vp-mini-badge ${finishedA ? "is-muted" : ""}`}>
                            Step {Math.min(compareIdx + 1, finishedAtA || 1)} / {finishedAtA || 1}
                          </span>
                          <span className="vp-mini-badge">Comparisons: {compsA}</span>
                          <span className="vp-mini-badge">Swaps/Writes: {writesA}</span>
                        </div>
                      </div>

                      <label className="vp-label vp-compare-select">
                        Algorithm
                        <select
                          value={algoA}
                          onChange={(e) => setAlgoA(e.target.value)}
                          className="vp-select"
                          disabled={disableDatasetControls}
                        >
                          <option>Bubble</option>
                          <option>Insertion</option>
                          <option>Selection</option>
                          <option>Merge</option>
                          <option>Quick</option>
                        </select>
                      </label>
                    </div>

                    <div className="vp-bars" role="img" aria-label="Algorithm A bars">
                      {displayA.map((v, i) => {
                        const height = Math.round((v / maxValueA) * 100);
                        const varLabel = getVarLabel(algoA, currentStepA, i);
                        return (
                          <div key={i} className={barClassFor(currentStepA, i)} style={{ height: `${height}%` }}>
                            {varLabel && <span className="vp-var">{varLabel}</span>}
                            <span className="vp-bar-label">{v}</span>
                            <span className="vp-bar-index">{i}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="vp-explain" aria-live="polite">
                      <div className="vp-explain-title">What’s happening?</div>
                      <div className="vp-explain-text">{msgA}</div>
                    </div>

                    <div className="vp-code" role="region" aria-label="Algorithm A pseudocode">
                      {(PSEUDOCODE[algoA] || []).map((line, idx) => {
                        const active = idx + 1 === codeA;
                        return (
                          <div key={idx} className={`vp-code-line ${active ? "active" : ""}`}>
                            <span className="vp-code-num">{idx + 1}</span>
                            <span className="vp-code-text">{line}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Panel B */}
                  <section className="vp-card vp-compare-panel" aria-label="Algorithm B panel">
                    <div className="vp-compare-head">
                      <div className="vp-compare-title">
                        <div className="vp-compare-hrow">
                          <h2 className="vp-h2">Algorithm B</h2>
                          {finishedB && <span className="vp-finished-badge">Finished</span>}
                        </div>
                        <div className="vp-mini">
                          <span className={`vp-mini-badge ${finishedB ? "is-muted" : ""}`}>
                            Step {Math.min(compareIdx + 1, finishedAtB || 1)} / {finishedAtB || 1}
                          </span>
                          <span className="vp-mini-badge">Comparisons: {compsB}</span>
                          <span className="vp-mini-badge">Swaps/Writes: {writesB}</span>
                        </div>
                      </div>

                      <label className="vp-label vp-compare-select">
                        Algorithm
                        <select
                          value={algoB}
                          onChange={(e) => setAlgoB(e.target.value)}
                          className="vp-select"
                          disabled={disableDatasetControls}
                        >
                          <option>Bubble</option>
                          <option>Insertion</option>
                          <option>Selection</option>
                          <option>Merge</option>
                          <option>Quick</option>
                        </select>
                      </label>
                    </div>

                   {/* Highlighted pseudocode for algorithm B */}
                    <div className="vp-bars" role="img" aria-label="Algorithm B bars">
                      {displayB.map((v, i) => {
                        const height = Math.round((v / maxValueB) * 100);
                        const varLabel = getVarLabel(algoB, currentStepB, i);
                        return (
                          <div key={i} className={barClassFor(currentStepB, i)} style={{ height: `${height}%` }}>
                            {varLabel && <span className="vp-var">{varLabel}</span>}
                            <span className="vp-bar-label">{v}</span>
                            <span className="vp-bar-index">{i}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="vp-explain" aria-live="polite">
                      <div className="vp-explain-title">What’s happening?</div>
                      <div className="vp-explain-text">{msgB}</div>
                    </div>

                    <div className="vp-code" role="region" aria-label="Algorithm B pseudocode">
                      {(PSEUDOCODE[algoB] || []).map((line, idx) => {
                        const active = idx + 1 === codeB;
                        return (
                          <div key={idx} className={`vp-code-line ${active ? "active" : ""}`}>
                            <span className="vp-code-num">{idx + 1}</span>
                            <span className="vp-code-text">{line}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </section>
              )}

            {/* ================= CONTROLS ================= */}
              <section id="controls" className="vp-card vp-controls-under" aria-label="Controls">
                <div className="vp-controls-header">
                  <div className="vp-controls-titlewrap">
                    <h2 className="vp-h2">Controls</h2>

                    <div className="vp-shortcuts-wrap">
                      <button
                        type="button"
                        className="vp-shortcuts-chip"
                        aria-expanded={shortcutsOpen}
                        aria-haspopup="true"
                        onClick={() => setShortcutsOpen((p) => !p)}
                        title="Keyboard shortcuts"
                      >
                        ⌨ Shortcuts
                      </button>
                      
                      {shortcutsOpen && (
                        <div className="vp-shortcuts-panel" role="dialog" aria-label="Keyboard shortcuts">
                          <div className="vp-shortcuts-title">Keyboard shortcuts</div>
                          <ul className="vp-shortcuts-list">
                            <li>
                              <kbd>Space</kbd> = Play / Pause
                            </li>
                            <li>
                              <kbd>→</kbd> = Step Forward
                            </li>
                            <li>
                              <kbd>←</kbd> = Step Back
                            </li>
                            <li>
                              <kbd>R</kbd> = Reset
                            </li>
                          </ul>
                          <div className="vp-shortcuts-note">Tip: shortcuts won’t trigger while typing in an input.</div>
                        </div>
                      )}
                    </div>
                  </div>

                  
                  <div className="vp-playrow">
                    <button className="vp-btn" onClick={togglePlay} type="button">
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <button className="vp-btn" onClick={stepBack} type="button" disabled={activeIdx === 0}>
                      Step Back
                    </button>
                    <button className="vp-btn" onClick={stepForward} type="button" disabled={activeIdx >= activeMaxLen - 1}>
                      Step Forward
                    </button>
                    <button className="vp-btn subtle" onClick={reset} type="button">
                      Reset
                    </button>
                  </div>
                </div>

                 {/* Step scrubber */}
                <div className="vp-scrubber">
                  <label className="vp-label">
                    {mode === "compare" ? "Comparison progress" : "Jump to step"}{" "}
                    <span className="vp-inline">{Math.min(activeIdx + 1, activeMaxLen || 1)}</span>
                    <input
                      className="vp-range"
                      type="range"
                      min={0}
                      max={Math.max(0, activeMaxLen - 1)}
                      value={activeIdx}
                      onChange={(e) => jumpToStep(Number(e.target.value))}
                      aria-label={mode === "compare" ? "Comparison progress scrubber" : "Step scrubber"}
                    />
                  </label>
                  {mode === "compare" && (
                    <div className="vp-muted">
                      Progress follows the slower algorithm. Finished algorithms remain frozen on their final frame.
                    </div>
                  )}
                </div>

                {/* Dataset and algorithm settings */}
                <div className="vp-controls-grid">
                  {mode !== "compare" && (
                    <label className="vp-label">
                      Algorithm
                      <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="vp-select"
                        disabled={disableDatasetControls}
                      >
                        <option>Bubble</option>
                        <option>Insertion</option>
                        <option>Selection</option>
                        <option>Merge</option>
                        <option>Quick</option>
                      </select>
                    </label>
                  )}

                  <label className="vp-label">
                    Dataset pattern
                    <select
                      value={pattern}
                      onChange={(e) => applyPattern(e.target.value)}
                      className="vp-select"
                      disabled={disableDatasetControls}
                    >
                      <option value="Random">Random</option>
                      <option value="Reversed">Reversed</option>
                      <option value="Nearly">Nearly-sorted</option>
                      <option value="Duplicates">Duplicates</option>
                    </select>
                  </label>

                  <label className="vp-label">
                    Size: <span className="vp-inline">{size}</span>
                    <input
                      className="vp-range"
                      type="range"
                      min={5}
                      max={35}
                      value={size}
                      onChange={(e) => applySize(Number(e.target.value))}
                      disabled={disableDatasetControls}
                    />
                  </label>

                  <label className="vp-label">
                    Speed: <span className="vp-inline">{speed}ms</span>
                    <input
                      className="vp-range"
                      type="range"
                      min={120}
                      max={1200}
                      step={10}
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                    />
                  </label>

                  <label className="vp-label vp-span2">
                    Custom array (comma/space separated)
                    <input
                      className="vp-input"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="e.g., 9, 3, 5, 1, 8"
                      disabled={disableDatasetControls}
                    />
                  </label>

                  <div className="vp-controls-actions">
                    <button
                      className="vp-btn subtle"
                      onClick={() => regenerateArray(pattern, size)}
                      type="button"
                      disabled={disableDatasetControls}
                    >
                      Apply / Regenerate
                    </button>
                  </div>
                </div>
              </section>

               {/* ================= LEARNING SUPPORT (COMPARE MODE ONLY) ================= */}
              {mode === "compare" && (
                <section className="vp-card vp-support" id="learning-support" aria-label="Learning support">
                  <div className="vp-support-head">
                    <h2 className="vp-h2">Learning support</h2>
                    <button
                      type="button"
                      className="vp-btn subtle vp-support-toggle"
                      onClick={() => setSupportExpanded((p) => !p)}
                      aria-expanded={supportExpanded}
                    >
                      {supportExpanded ? "Hide" : "Show"}
                    </button>
                  </div>

                  {!supportExpanded && (
                    <div className="vp-muted">
                      Includes learning goals, mini experiments, what to notice, metrics explained, and prediction prompts.
                    </div>
                  )}

                  {supportExpanded && (
                    <>
                     {/* Learning goals */}
                      <div className="vp-support-block vp-support-card">
                        <div className="vp-support-title">🎯 Learning goals</div>
                        <ul className="vp-support-list">
                          <li>
                            <b>Compare behaviour</b> on the same dataset (same values, different strategies).
                          </li>
                          <li>
                            <b>Connect visuals to efficiency</b> using comparisons and swaps/writes.
                          </li>
                          <li>
                            <b>Explore best vs worst cases</b> (nearly-sorted vs reversed).
                          </li>
                        </ul>
                      </div>

                    {/* Prediction activity */}
                      <div className="vp-support-block vp-support-card">
                        <div className="vp-support-title">✏️ Predict first</div>
                        <p className="vp-muted" style={{ marginTop: 0 }}>
                          Before pressing <b>Play</b>, predict which algorithm will finish first and why.
                        </p>

                        <div className="vp-predict-row">
                          <label className="vp-label">
                            Your prediction
                            <input
                              className="vp-input"
                              value={prediction}
                              onChange={(e) => setPrediction(e.target.value)}
                              placeholder='e.g., "Insertion wins on nearly-sorted because it shifts less."'
                            />
                          </label>

                          <div className="vp-predict-actions">
                            <button type="button" className="vp-btn" onClick={() => setPredictionQuick("Algorithm A wins")}>
                              A wins
                            </button>
                            <button type="button" className="vp-btn" onClick={() => setPredictionQuick("Algorithm B wins")}>
                              B wins
                            </button>
                            <button
                              type="button"
                              className="vp-btn subtle"
                              onClick={() => {
                                setPrediction("");
                                setPredictionNote("");
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {predictionNote && <div className="vp-feedback ok">{predictionNote}</div>}
                      </div>

                     {/* Preset mini experiments */}
                      <div className="vp-support-block vp-support-card">
                        <div className="vp-support-title">🔬 Mini experiments</div>
                        <div className="vp-exp-grid">
                          <button type="button" className="vp-exp" onClick={() => applyExperiment("Reversed", 12, "Bubble", "Insertion")}>
                            <div className="vp-exp-title">Experiment 1: Worst case</div>
                            <div className="vp-exp-desc">
                              Bubble vs Insertion with <b>Reversed</b> data (size 12). Watch swaps explode.
                            </div>
                          </button>

                          <button type="button" className="vp-exp" onClick={() => applyExperiment("Nearly", 12, "Insertion", "Bubble")}>
                            <div className="vp-exp-title">Experiment 2: Nearly-sorted advantage</div>
                            <div className="vp-exp-desc">
                              Insertion vs Bubble with <b>Nearly-sorted</b> data. Notice how quickly Insertion finishes.
                            </div>
                          </button>

                          <button type="button" className="vp-exp" onClick={() => applyExperiment("Duplicates", 14, "Selection", "Bubble")}>
                            <div className="vp-exp-title">Experiment 3: Duplicates</div>
                            <div className="vp-exp-desc">
                              Selection vs Bubble with <b>Duplicates</b>. Compare swaps/writes and stability.
                            </div>
                          </button>
                        </div>

                        <div className="vp-tip" style={{ marginTop: 10 }}>
                          Tip: Use the <b>Comparison progress</b> scrubber to compare the same “moment” side-by-side.
                        </div>
                      </div>

                      {/* What learners should notice */}
                      <div className="vp-support-block vp-support-card">
                        <div className="vp-support-title">👀 What to notice</div>
                        <ul className="vp-support-list">
                          <li>
                            <b>Where does “sorted” appear?</b> Bubble/Selection fix final positions; Insertion grows a sorted prefix.
                          </li>
                          <li>
                            <b>Which swaps more?</b> High swaps/writes usually means more data movement.
                          </li>
                          <li>
                            <b>Does one finish earlier?</b> Finished panels freeze while the other continues.
                          </li>
                          <li>
                            <b>How does input order change behaviour?</b> Nearly-sorted usually helps Insertion.
                          </li>
                        </ul>
                      </div>

                       {/* Explanation of comparison metrics */}
                      <div className="vp-support-block vp-support-card">
                        <div className="vp-support-title">📊 Metrics explained</div>
                        <ul className="vp-support-list">
                          <li>
                            <b>Comparisons</b> = value checks (e.g., “is A &gt; B?”).
                          </li>
                          <li>
                            <b>Swaps/Writes</b> = data movement (swapping elements or writing into an index).
                          </li>
                          <li>
                            Lower counts often indicate better efficiency, but consider <b>input type</b> and <b>strategy</b>.
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </section>
              )}
            </div>

            {/* Right Guide for non-compare */}
            {mode !== "compare" && (
              <aside className="vp-rightcol" id="guide" aria-label="Algorithm guide">
                <section className="vp-card vp-guide-card">
                  <h2 className="vp-h2">Algorithm Guide</h2>

                  <div className="vp-guide-block">
                    <div className="vp-guide-title">Pseudocode</div>
                    <div className="vp-code" role="region" aria-label="Pseudocode">
                      {(PSEUDOCODE[algorithm] || []).map((line, idx) => {
                        const active = idx + 1 === singleCodeLine;
                        return (
                          <div key={idx} className={`vp-code-line ${active ? "active" : ""}`}>
                            <span className="vp-code-num">{idx + 1}</span>
                            <span className="vp-code-text">{line}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="vp-tip">
                      Use <b>Step Forward</b> to match each visual action to the highlighted pseudocode line.
                    </div>
                  </div>

                  <div className="vp-guide-block">
                    <div className="vp-guide-title">How to learn faster</div>
                    <ul className="vp-bullets">
                      <li>Use size 8–12 first (clearer steps).</li>
                      <li>
                        Try <b>Reversed</b> and <b>Nearly-sorted</b> to compare behaviour.
                      </li>
                      <li>
                        Switch to <b>Practice</b> and predict swaps/writes.
                      </li>
                      <li>Try duplicates to see stability differences.</li>
                    </ul>
                  </div>
                </section>

                {/* Extra algorithm facts and insights */}
                <section className="vp-card vp-insights-card" aria-label="Algorithm insights">
                  <div className="vp-insights-head">
                    <h2 className="vp-h2">Algorithm Insights</h2>
                    <span className="vp-mini-badge is-muted">{algorithm}</span>
                  </div>

                  <p className="vp-muted vp-insights-summary">{INSIGHTS[algorithm]?.summary}</p>

                  <div className="vp-insights-grid">
                    <div className="vp-insight">
                      <div className="vp-insight-k">Best when</div>
                      <div className="vp-insight-v">{INSIGHTS[algorithm]?.best}</div>
                    </div>

                    <div className="vp-insight">
                      <div className="vp-insight-k">Time</div>
                      <div className="vp-insight-v">{INSIGHTS[algorithm]?.time}</div>
                    </div>

                    <div className="vp-insight">
                      <div className="vp-insight-k">Space</div>
                      <div className="vp-insight-v">{INSIGHTS[algorithm]?.space}</div>
                    </div>
                  </div>

                  <div className="vp-tip">
                    <b>Note:</b> {INSIGHTS[algorithm]?.note}
                  </div>
                </section>
              </aside>
            )}
          </div>
        </main>
      </div>
      
      {/* ================= FOOTER ================= */}
      <footer className="site-footer">
        <p>© 2025 SortAcademy · Visualiser &amp; Practice Page ·</p>
      </footer>
    </>
  );
}
