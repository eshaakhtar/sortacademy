// src/SelectionSortExercises.js
import React, { useMemo, useState } from "react";

// ---------- Helpers ----------
// Returns a random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a shuffled copy of an array using the Fisher–Yates algorithm
function shuffleFisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Checks whether an array of numbers is sorted in ascending order
function isSortedAscending(nums) {
  for (let i = 1; i < nums.length; i++) {
    if (nums[i - 1] > nums[i]) return false;
  }
  return true;
}

// Simulates one full Selection Sort pass starting at index i
// It finds the minimum in the unsorted region and swaps it into position i
function selectionPassResult(arr, i) {
  const a = [...arr];
  let minIndex = i;
  for (let j = i + 1; j < a.length; j++) {
    if (a[j] < a[minIndex]) minIndex = j;
  }
  if (minIndex !== i) {
    [a[i], a[minIndex]] = [a[minIndex], a[i]];
  }
  return a;
}

// Returns the index of the minimum value in arr from position i onward
function selectionMinIndex(arr, i) {
  let minIndex = i;
  for (let j = i + 1; j < arr.length; j++) {
    if (arr[j] < arr[minIndex]) minIndex = j;
  }
  return minIndex;
}

// Formats a number as a pound price for the T-shirt exercise
function formatMoney(n) {
  return `£${n}`;
}

/**
 * generate unique random integers (no repeats).
 * If count > available numbers, it returns as many as possible.
 */
function uniqueRandInts(count, min, max) {
  const range = max - min + 1;
  const actualCount = Math.min(count, range);

  const pool = [];
  for (let n = min; n <= max; n++) pool.push(n);

  const shuffled = shuffleFisherYates(pool);
  return shuffled.slice(0, actualCount);
}

// Builds a random T-shirt rail for the shopping-themed Selection Sort exercise
function makeRandomTshirtRail(count = 6) {
  const palette = [
    { name: "Blue Tee", color: "#3b82f6" },
    { name: "Red Tee", color: "#ef4444" },
    { name: "Green Tee", color: "#22c55e" },
    { name: "Black Tee", color: "#111827" },
    { name: "Purple Tee", color: "#a855f7" },
    { name: "Yellow Tee", color: "#eab308" },
    { name: "Pink Tee", color: "#ec4899" },
    { name: "Teal Tee", color: "#14b8a6" },
    { name: "Grey Tee", color: "#9ca3af" },
    { name: "Orange Tee", color: "#f97316" },
  ];

  // Pick a subset of shirt styles
  const picked = shuffleFisherYates(palette).slice(0, Math.min(count, palette.length));

  // Safer unique ids than Date.now() alone (fast clicks can collide)
  const base = Date.now() + Math.floor(Math.random() * 100000);

  // wider range + unique prices to avoid repeats
  const prices = uniqueRandInts(picked.length, 6, 30);

  const rail = picked.map((p, idx) => ({
    id: base + idx,
    name: p.name,
    color: p.color,
    price: prices[idx],
  }));

  // Shuffle the final rail so the cheapest is not already in the correct place
  return shuffleFisherYates(rail);
}

// Small reusable SVG T-shirt icon
// The fill colour changes based on the shirt's colour
function TeeIcon({ fill = "#3b82f6" }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", margin: "0 auto 6px" }}
    >
      <path
        d="M18 12l8-6h12l8 6 10 6-6 12-8-4v30H22V26l-8 4-6-12 10-6z"
        fill={fill}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M26 6c2 6 10 6 12 0"
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------- Main Component ----------
// This component contains four interactive Selection Sort exercises.
// onComplete is an optional callback used by the parent lesson page to record completion.
export default function SelectionSortExercises({ onComplete }) {
  const [activeTab, setActiveTab] = useState("ex1");

  const markComplete = (key) => {
    if (typeof onComplete === "function") onComplete(key);
  };

  // ---------------- EX1: Drive the pass ----------------
  // Random array for exercise 1
  const [ex1Array, setEx1Array] = useState(() =>
    Array.from({ length: 6 }, () => randInt(1, 50))
  );

  // i = current sorted-front boundary
  const [ex1I, setEx1I] = useState(0);
  // j = current scan index
  const [ex1J, setEx1J] = useState(1);

  // minIndex = current position of smallest found item during the scan
  const [ex1MinIndex, setEx1MinIndex] = useState(0);

  // scan = still comparing values
  // swap = finished scan, ready to move min into place
  // done = full exercise complete
  const [ex1Phase, setEx1Phase] = useState("scan"); // scan | swap | done

  // Feedback message shown to the learner
  const [ex1Msg, setEx1Msg] = useState("Press “Next compare” to begin scanning.");

  // Lives system to make the activity more game-like
  const [ex1Lives, setEx1Lives] = useState(3);

  // Score increases when learner correctly updates minIndex
  const [ex1Score, setEx1Score] = useState(0);

  // Whether the exercise has been completed
  const [ex1Completed, setEx1Completed] = useState(false);

  // Resets the first exercise with a fresh array and default state
  const ex1Reset = () => {
    const fresh = Array.from({ length: 6 }, () => randInt(1, 20));
    setEx1Array(fresh);
    setEx1I(0);
    setEx1J(1);
    setEx1MinIndex(0);
    setEx1Phase("scan");
    setEx1Msg("New round! Scan the unsorted part and keep track of the minimum.");
    setEx1Lives(3);
    setEx1Score(0);
    setEx1Completed(false);
  };

  // Current minimum value during the scan
  const ex1CurrentMin = ex1Array[ex1MinIndex];

  // Advances the scan by one comparison in exercise 1
  const ex1NextCompare = () => {
    if (ex1Completed) return;
    if (ex1Phase !== "scan") return;

    if (ex1J >= ex1Array.length) {
      setEx1Phase("swap");
      setEx1Msg(
        `Scan finished ✅ Now swap the minimum (${ex1Array[ex1MinIndex]}) into position i=${ex1I}.`
      );
      return;
    }

    const candidate = ex1Array[ex1J];
    setEx1Msg(
      `Compare j=${ex1J} (value ${candidate}) with current min at index ${ex1MinIndex} (value ${ex1CurrentMin}). If smaller, click “Update minIndex”.`
    );
    setEx1J((prev) => prev + 1);
  };

  // Lets the learner update minIndex if the compared value is smaller
  const ex1UpdateMin = () => {
    if (ex1Completed) return;
    if (ex1Phase !== "scan") return;

    // ex1J has already been incremented after compare, so the actual compared item is j - 1
    const compareIndex = ex1J - 1;
    if (compareIndex < ex1I || compareIndex >= ex1Array.length) {
      setEx1Msg("Press “Next compare” first to choose which item you’re comparing.");
      return;
    }

    if (ex1Array[compareIndex] < ex1Array[ex1MinIndex]) {
      setEx1MinIndex(compareIndex);
      setEx1Score((s) => s + 1);
      setEx1Msg(`✅ Correct! minIndex → ${compareIndex} (new min = ${ex1Array[compareIndex]}).`);
    } else {
      setEx1Lives((l) => Math.max(0, l - 1));
      setEx1Msg("❌ Not smaller than the current minimum. Only update when strictly smaller.");
    }
  };

  // Swaps the minimum value into position i and starts the next pass
  const ex1Swap = () => {
    if (ex1Completed) return;
    if (ex1Phase !== "swap") return;

    const a = [...ex1Array];
    const i = ex1I;
    const m = ex1MinIndex;

    if (m !== i) [a[i], a[m]] = [a[m], a[i]];

    const nextI = i + 1;
    const done = nextI >= a.length - 1 || isSortedAscending(a);
    setEx1Array(a);

    if (done) {
      setEx1Phase("done");
      setEx1Completed(true);
      setEx1Msg("🎉 Completed! You drove Selection Sort to a sorted array.");
      markComplete("ex1");
      return;
    }

    // Prepare the next pass
    setEx1I(nextI);
    setEx1MinIndex(nextI);
    setEx1J(nextI + 1);
    setEx1Phase("scan");
    setEx1Msg(
      `Pass complete ✅ Start pass i=${nextI}. Assume index ${nextI} (value ${a[nextI]}) is the minimum.`
    );
  };

  // Learner loses when lives reach zero before finishing
  const ex1GameOver = ex1Lives === 0 && !ex1Completed;

  // ---------------- EX2: T-shirt rail ----------------
  // Random shopping rail
  const [tshirts, setTshirts] = useState(() => makeRandomTshirtRail(6));

  // Selection Sort pointers for exercise 2
  const [tI, setTI] = useState(0);
  const [tJ, setTJ] = useState(1);
  const [tMinIndex, setTMinIndex] = useState(0);
  const [tPhase, setTPhase] = useState("scan"); // scan | move | done

  // Instruction/feedback text
  const [tMsg, setTMsg] = useState("Press “Next compare” to start scanning for the cheapest.");

  // Marks exercise completion
  const [tCompleted, setTCompleted] = useState(false);

  // Stats for the learner
  const [tCorrectMarks, setTCorrectMarks] = useState(0);
  const [tMistakes, setTMistakes] = useState(0);

  // wrong-move feedback + wrong-choice marker
  const [tMoveError, setTMoveError] = useState(false);
  const [tWrongChosenIndex, setTWrongChosenIndex] = useState(null);

  // Stats for the learner
  const [tHistory, setTHistory] = useState([]);
  const MAX_UNDO = 25;

  // Saves the current state into undo history
  const pushTState = () => {
    const snap = {
      tshirts,
      tI,
      tJ,
      tMinIndex,
      tPhase,
      tMsg,
      tCompleted,
      tCorrectMarks,
      tMistakes,
      tMoveError,
      tWrongChosenIndex,
    };
    setTHistory((prev) => {
      const next = [snap, ...prev];
      return next.slice(0, MAX_UNDO);
    });
  };

  // Restores the most recent snapshot from history
  const tUndo = () => {
    setTHistory((prev) => {
      if (prev.length === 0) return prev;
      const [snap, ...rest] = prev;

      setTshirts(snap.tshirts);
      setTI(snap.tI);
      setTJ(snap.tJ);
      setTMinIndex(snap.tMinIndex);
      setTPhase(snap.tPhase);
      setTMsg(snap.tMsg);
      setTCompleted(snap.tCompleted);
      setTCorrectMarks(snap.tCorrectMarks);
      setTMistakes(snap.tMistakes);
      setTMoveError(snap.tMoveError);
      setTWrongChosenIndex(snap.tWrongChosenIndex);

      return rest;
    });
  };

  // Resets the T-shirt exercise
  const resetTshirts = () => {
    const fresh = makeRandomTshirtRail(6);
    setTshirts(fresh);
    setTI(0);
    setTJ(1);
    setTMinIndex(0);
    setTPhase("scan");
    setTMsg("New rail ✅ Scan the unsorted section and track the cheapest.");
    setTCompleted(false);
    setTCorrectMarks(0);
    setTMistakes(0);
    setTMoveError(false);
    setTWrongChosenIndex(null);
    setTHistory([]); //  clear undo history on reset
  };

  // Advances the scan by one compare in exercise 2
  const tNextCompare = () => {
    if (tCompleted) return;
    if (tPhase !== "scan") return;

    pushTState(); // allow undo

    // Clear previous warning highlights
    setTMoveError(false);
    setTWrongChosenIndex(null);

    // End of scan: switch to move phase
    if (tJ >= tshirts.length) {
      setTPhase("move");
      setTMsg(
        `Scan finished ✅ Move the cheapest (${formatMoney(
          tshirts[tMinIndex].price
        )}) to the sorted front at i=${tI}.`
      );
      return;
    }

    // End of scan: switch to move phase
    const cand = tshirts[tJ];
    const cur = tshirts[tMinIndex];
    setTMsg(
      `Compare j=${tJ} (${cand.name}, ${formatMoney(
        cand.price
      )}) with current cheapest (${cur.name}, ${formatMoney(cur.price)}).`
    );
    setTJ((prev) => prev + 1);
  };

  // Lets the learner mark the currently compared shirt as the new cheapest
  const tMarkCheapest = () => {
    if (tCompleted) return;
    if (tPhase !== "scan") return;

    pushTState(); // allow undo

    // clear previous error visuals as they retry
    setTMoveError(false);
    setTWrongChosenIndex(null);

    const compareIndex = tJ - 1;
    if (compareIndex < tI || compareIndex >= tshirts.length) {
      setTMsg("Press “Next compare” first.");
      return;
    }

    const cand = tshirts[compareIndex];
    const cur = tshirts[tMinIndex];

    if (cand.price < cur.price) {
      setTMinIndex(compareIndex);
      setTCorrectMarks((x) => x + 1);
      setTMsg(`✅ Good call! New cheapest is ${cand.name} at ${formatMoney(cand.price)}.`);
    } else {
      setTMistakes((m) => m + 1);
      setTMsg("❌ Not cheaper than the current cheapest. Only mark when it's strictly cheaper.");
    }
  };

  // Moves the chosen cheapest shirt into the sorted front
  // If learner picked the wrong shirt, it explains the mistake and restarts the scan
  const tMoveCheapest = () => {
    if (tCompleted) return;
    if (tPhase !== "move") return;

    pushTState(); // allow undo

    // recompute true cheapest from i..end
    let actualMin = tI;
    for (let k = tI + 1; k < tshirts.length; k++) {
      if (tshirts[k].price < tshirts[actualMin].price) actualMin = k;
    }

    // Block move if learner chose the wrong cheapest
    if (tMinIndex !== actualMin) {
      setTMoveError(true);
      setTWrongChosenIndex(tMinIndex);
      setTMistakes((m) => m + 1);

      // Return to scan mode so learner can correct the mistake
      setTPhase("scan");
      setTJ(tI + 1);
      setTMinIndex(tI);

      setTMsg(
        `❌ Not quite! The cheapest in the unsorted rail is ${tshirts[actualMin].name} (${formatMoney(
          tshirts[actualMin].price
        )}). Go back to scanning for i=${tI}, mark the correct cheapest, then try moving again.`
      );
      return;
    }

    // Allow move if the chosen cheapest is correct
    setTMoveError(false);
    setTWrongChosenIndex(null);

    const a = [...tshirts];
    if (tMinIndex !== tI) [a[tI], a[tMinIndex]] = [a[tMinIndex], a[tI]];

    const nextI = tI + 1;
    const done = nextI >= a.length - 1;

    setTshirts(a);

    if (done) {
      setTCompleted(true);
      setTPhase("done");
      setTMsg("🎉 Rail sorted! Cheapest → most expensive.");
      markComplete("ex2");
      return;
    }

     // Prepare the next Selection Sort pass
    setTI(nextI);
    setTMinIndex(nextI);
    setTJ(nextI + 1);
    setTPhase("scan");
    setTMsg(`Pass complete ✅ Now scan again to find the cheapest for i=${nextI}.`);
  };

  // ---------------- EX3: Predict (2-stage) ----------------
  // Seed used to regenerate a fresh prediction question
  const [ex3Seed, setEx3Seed] = useState(1);

  // Stage 1 = predict minIndex
  // Stage 2 = predict post-swap array
  const [ex3Stage, setEx3Stage] = useState(1);

  // Stores learner selections in each stage
  const [ex3PickStage1, setEx3PickStage1] = useState(null);
  const [ex3PickStage2, setEx3PickStage2] = useState(null);

  // Feedback message for exercise 3
  const [ex3Msg, setEx3Msg] = useState("");

  // Whether the learner has successfully completed the exercise once
  const [ex3Completed, setEx3Completed] = useState(false);

   // Builds a random two-stage prediction question
  const ex3Question = useMemo(() => {
    // Create base array of small values for readability
    const base = [randInt(1, 9), randInt(1, 9), randInt(1, 9), randInt(1, 9), randInt(1, 9)];
    base[0] = (base[0] % 9) + 1;

    // Choose which Selection Sort pass to ask about
    const i = randInt(0, 2);

    // Correct answers for the question
    const correctMin = selectionMinIndex(base, i);
    const correctArr = selectionPassResult(base, i);

    // Build answer options for minIndex stage
    const idxOptionsRaw = [
      i,
      correctMin,
      Math.min(base.length - 1, i + 1),
      Math.min(base.length - 1, i + 2),
    ];
    const uniqueIdx = Array.from(new Set(idxOptionsRaw)).slice(0, 3);

    // Ensure at least 3 options exist
    while (uniqueIdx.length < 3) uniqueIdx.push(randInt(i, base.length - 1));
    const idxOptions = shuffleFisherYates(uniqueIdx).map((idx, k) => ({
      id: k,
      idx,
      correct: idx === correctMin,
      label: `Index ${idx}`,
    }));

     // Create plausible array-state distractors
    const fullySorted = [...base].sort((a, b) => a - b);
    const bubbleish = [...base];
    if (i + 1 < bubbleish.length) {
      [bubbleish[i], bubbleish[i + 1]] = [bubbleish[i + 1], bubbleish[i]];
    }

    let arrOptionsRaw = [
      { id: 0, arr: correctArr, correct: true, label: "Option A" },
      { id: 1, arr: fullySorted, correct: false, label: "Option B" },
      { id: 2, arr: bubbleish, correct: false, label: "Option C" },
    ];

    // Ensure array options are distinct
    const str = (a) => a.join(",");
    if (str(arrOptionsRaw[1].arr) === str(arrOptionsRaw[0].arr)) {
      arrOptionsRaw[1].arr = selectionPassResult(base, Math.min(i + 1, base.length - 2));
    }
    if (
      str(arrOptionsRaw[2].arr) === str(arrOptionsRaw[0].arr) ||
      str(arrOptionsRaw[2].arr) === str(arrOptionsRaw[1].arr)
    ) {
      arrOptionsRaw[2].arr = [...base].reverse();
    }

    const arrOptions = shuffleFisherYates(arrOptionsRaw);

    return { base, i, correctMin, idxOptions, arrOptions };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex3Seed]);

  // Creates a new prediction question
  const ex3New = () => {
    setEx3Seed((s) => s + 1);
    setEx3Stage(1);
    setEx3PickStage1(null);
    setEx3PickStage2(null);
    setEx3Msg("");
    setEx3Completed(false);
  };

  // Handles learner answer for stage 1 (predict minIndex)
  const ex3ChooseStage1 = (id) => {
    setEx3PickStage1(id);
    const opt = ex3Question.idxOptions.find((o) => o.id === id);
    if (!opt) return;

    if (opt.correct) {
      setEx3Msg(
        `✅ Correct! After scanning from i=${ex3Question.i}, minIndex ends at ${ex3Question.correctMin}. Now predict the array AFTER the swap.`
      );
      setEx3Stage(2);
    } else {
      setEx3Msg("❌ Not quite. minIndex should point to the smallest value in the unsorted region.");
    }
  };

  // Handles learner answer for stage 2 (predict array after swap)
  const ex3ChooseStage2 = (id) => {
    setEx3PickStage2(id);
    const opt = ex3Question.arrOptions.find((o) => o.id === id);
    if (!opt) return;

    if (opt.correct) {
      setEx3Msg(
        `✅ Perfect! After pass i=${ex3Question.i}, only that position is guaranteed correct (one minimum swap).`
      );
      if (!ex3Completed) {
        setEx3Completed(true);
        markComplete("ex3");
      }
    } else {
      setEx3Msg(
        "❌ Not quite. Selection Sort swaps the smallest value found into position i — it does not fully sort in one pass."
      );
    }
  };

  // ---------------- EX4: Debug ----------------

  // Stores selected fix option
  const [ex4Pick, setEx4Pick] = useState(null);

  // Feedback message for debugging exercise
  const [ex4Msg, setEx4Msg] = useState("");
 
  // Tracks completion
  const [ex4Completed, setEx4Completed] = useState(false);

  // Fix options for the buggy pseudocode
  const ex4FixOptions = [
    { id: 0, text: "if A[j] < A[minIndex]:", correct: true },
    { id: 1, text: "if A[j] > A[minIndex]:", correct: false },
    { id: 2, text: "if A[i] < A[minIndex]:", correct: false },
    { id: 3, text: "if A[j] <= A[minIndex]:", correct: false },
  ];

  // Handles learner choice in debugging exercise
  const ex4Select = (id) => {
    setEx4Pick(id);
    const opt = ex4FixOptions.find((o) => o.id === id);
    if (!opt) return;

    if (opt.correct) {
      setEx4Msg(
        "✅ Correct! The scan keeps the smallest value seen so far — so we update only when we find a strictly smaller candidate."
      );
      if (!ex4Completed) {
        setEx4Completed(true);
        markComplete("ex4");
      }
    } else {
      setEx4Msg("❌ Not quite. Think about the invariant: minIndex should never move to a bigger value.");
    }
  };

  // Resets the debug exercise
  const ex4Reset = () => {
    setEx4Pick(null);
    setEx4Msg("");
    setEx4Completed(false);
  };

  // ---------- Tabs meta ----------
  // Metadata used to render the exercise tab buttons
  const tabs = [
    { id: "ex1", title: "Exercise 1" },
    { id: "ex2", title: "Exercise 2" },
    { id: "ex3", title: "Exercise 3" },
    { id: "ex4", title: "Exercise 4" },
  ];

  return (
    <section className="lesson-section">
      <h2>Interactive exercises</h2>

      {/* Exercise tab navigation */}
      <div className="exercise-tabs" role="tablist" aria-label="Exercises">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={activeTab === t.id ? "exercise-tab active" : "exercise-tab"}
            onClick={() => setActiveTab(t.id)}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* ---------------- EX1 ---------------- */}
      {activeTab === "ex1" && (
        <div className="exercise">
          <h3>Exercise 1: Drive the pass 🕹️</h3>
          <p>
            Control Selection Sort: scan with <code>j</code>, update <code>minIndex</code> only when
            you find a smaller value, then swap into position <code>i</code>.
          </p>

          {/* Status line */}
          <div className="exercise-footer" style={{ justifyContent: "space-between" }}>
            <span>
              i = <strong>{ex1I}</strong>, j = <strong>{ex1Phase === "scan" ? ex1J : "-"}</strong>,
              minIndex = <strong>{ex1MinIndex}</strong>
            </span>
            <span>
              Lives: <strong>{"❤️".repeat(ex1Lives)}</strong>{" "}
              {ex1Lives === 0 ? <strong>0</strong> : null}
            </span>
          </div>

          {/* Array cards */}
          <div className="card-row" aria-label="Number cards for exercise 1">
            {ex1Array.map((v, idx) => {
              const isSorted = idx < ex1I;
              const isMin = idx === ex1MinIndex;
              const isCompared = ex1Phase === "scan" && idx === ex1J - 1;
              return (
                <div
                  key={idx}
                  className={
                    "number-card" +
                    (isSorted ? " number-card-selected" : "") +
                    (isMin ? " exercise-option-selected" : "")
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "64px",
                    outline: isCompared ? "2px solid rgba(59,130,246,.55)" : undefined,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                    {isSorted ? "✅ sorted" : isMin ? "🏁 min" : isCompared ? "👀 comparing" : " "}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="exercise-footer">
            <button
              className="btn-secondary"
              onClick={ex1NextCompare}
              disabled={ex1Completed || ex1GameOver}
            >
              Next compare
            </button>
            <button
              className="btn-secondary"
              onClick={ex1UpdateMin}
              disabled={ex1Completed || ex1GameOver || ex1Phase !== "scan"}
            >
              Update minIndex
            </button>
            <button
              className="btn-primary"
              onClick={ex1Swap}
              disabled={ex1Completed || ex1GameOver || ex1Phase !== "swap"}
            >
              Swap into position i
            </button>

            <span>
              Score: <strong>{ex1Score}</strong>
            </span>
            <button className="btn-ghost" onClick={ex1Reset}>
              New round
            </button>
          </div>

          {/* Game-over feedback */}
          {ex1GameOver && (
            <div className="feedback-text">
              💥 Out of lives! Reset and try again — update the minimum only when the candidate is{" "}
              <strong>strictly smaller</strong>.
            </div>
          )}

          {ex1Msg && <div className="feedback-text">{ex1Msg}</div>}
        </div>
      )}

      {/* ---------------- EX2 ---------------- */}
      {activeTab === "ex2" && (
        <div className="exercise">
          <h3>Exercise 2: Cheapest T-shirt on the rail 👕</h3>
          <p>
            Drive a full pass: <strong>scan</strong> the unsorted rail with <code>j</code>, mark a new cheapest
            when appropriate, then <strong>move</strong> it into position <code>i</code>.
          </p>

          {/* Status line */}
          <div className="exercise-footer" style={{ justifyContent: "space-between" }}>
            <span>
              i = <strong>{tI}</strong>, j = <strong>{tPhase === "scan" ? tJ : "-"}</strong>, cheapest index ={" "}
              <strong>{tMinIndex}</strong>
            </span>
            <span>
              Correct marks: <strong>{tCorrectMarks}</strong> · Mistakes: <strong>{tMistakes}</strong>
            </span>
          </div>

          {/* Two-column layout: sorted front + unsorted rail */}
          <div className="complexity-grid" style={{ marginTop: "10px" }}>
            <div>
              <h4 style={{ marginTop: 0 }}>✅ Sorted front</h4>
              <div className="card-row" aria-label="Sorted front rail">
                {tshirts.slice(0, tI).length === 0 ? (
                  <div className="feedback-text">Nothing sorted yet — start from i=0.</div>
                ) : (
                  tshirts.slice(0, tI).map((shirt) => (
                    <div
                      key={shirt.id}
                      className="number-card"
                      style={{ minWidth: "120px", textAlign: "center", padding: "10px" }}
                    >
                      <TeeIcon fill={shirt.color} />
                      <div style={{ fontWeight: 700 }}>{shirt.name}</div>
                      <div style={{ fontSize: "0.85rem" }}>{formatMoney(shirt.price)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 style={{ marginTop: 0 }}>🛒 Unsorted rail (scan it)</h4>
              <div className="card-row" aria-label="Unsorted rail">
                {tshirts.map((shirt, index) => {
                  const isSorted = index < tI;
                  const isMin = index === tMinIndex;
                  const isCompared = tPhase === "scan" && index === tJ - 1;
                  const isWrongChosen = tMoveError && index === tWrongChosenIndex;
                  const dim = isSorted ? 0.45 : 1;

                  return (
                    <div
                      key={shirt.id}
                      className="number-card"
                      style={{
                        minWidth: "140px",
                        padding: "10px",
                        textAlign: "center",
                        opacity: dim,
                        outline: isCompared ? "2px solid rgba(59,130,246,.6)" : undefined,
                        border: isWrongChosen
                          ? "2px solid rgba(239,68,68,.95)"
                          : isMin
                          ? "2px dashed rgba(16,185,129,.9)"
                          : undefined,
                      }}
                    >
                      <TeeIcon fill={shirt.color} />
                      <div style={{ fontWeight: 700 }}>{shirt.name}</div>
                      <div style={{ fontSize: "0.85rem" }}>
                        Price tag: <strong>{formatMoney(shirt.price)}</strong>
                      </div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.9, marginTop: 4 }}>
                        {isSorted
                          ? "✅ sorted"
                          : isWrongChosen
                          ? "❌ wrong choice"
                          : isMin
                          ? "🏁 cheapest"
                          : isCompared
                          ? "👀 comparing"
                          : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

           {/* Controls */}
          <div className="exercise-footer">
            <button className="btn-secondary" onClick={tNextCompare} disabled={tCompleted || tPhase !== "scan"}>
              Next compare
            </button>
            <button className="btn-secondary" onClick={tMarkCheapest} disabled={tCompleted || tPhase !== "scan"}>
              Mark as cheapest
            </button>
            <button className="btn-primary" onClick={tMoveCheapest} disabled={tCompleted || tPhase !== "move"}>
              Move cheapest to sorted front
            </button>

            {/* ✅ NEW: Undo (1 step) */}
            <button className="btn-ghost" onClick={tUndo} disabled={tHistory.length === 0}>
              ↩ Undo (1 step)
            </button>

            <button className="btn-ghost" onClick={resetTshirts}>
              New rail
            </button>
          </div>

          {/* Main feedback text */}
          {tMsg && <div className="feedback-text">{tMsg}</div>}
        </div>
      )}

      {/* ---------------- EX3 ---------------- */}
      {activeTab === "ex3" && (
        <div className="exercise">
          <h3>Exercise 3: Predict the next state 🔮</h3>
          <p>
            Two-step challenge: first predict the final <code>minIndex</code> after the scan, then predict the array
            after the swap for pass <code>i = {ex3Question.i}</code>.
          </p>

          {/* Show the starting array */}
          <p style={{ marginTop: 0 }}>
            Array: <code>[{ex3Question.base.join(", ")}]</code>
          </p>

          {/* Stage 1: choose final minIndex */}
          {ex3Stage === 1 && (
            <>
              <p>
                <strong>Stage 1:</strong> After scanning the unsorted region (from index <code>{ex3Question.i}</code>{" "}
                to end), what should <code>minIndex</code> be?
              </p>

              <div className="exercise-options">
                {ex3Question.idxOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className={
                      "exercise-option" + (ex3PickStage1 === opt.id ? " exercise-option-selected" : "")
                    }
                    onClick={() => ex3ChooseStage1(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Stage 2: choose resulting array after swap */}
          {ex3Stage === 2 && (
            <>
              <p>
                <strong>Stage 2:</strong> Now what does the array look like <strong>immediately after</strong> the swap
                for this pass?
              </p>

              <div className="exercise-options exercise-options-cards">
                {ex3Question.arrOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className={
                      "exercise-option" + (ex3PickStage2 === opt.id ? " exercise-option-selected" : "")
                    }
                    onClick={() => ex3ChooseStage2(opt.id)}
                  >
                    <div className="exercise-option-label">{opt.label}</div>
                    <div className="card-row">
                      {opt.arr.map((v, i) => (
                        <div key={i} className="number-card mini">
                          {v}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Footer actions */}
          <div className="exercise-footer">
            <button className="btn-ghost" onClick={ex3New}>
              New question
            </button>
            {ex3Completed && <span>✅ Completed once — nice!</span>}
          </div>

          {ex3Msg && <div className="feedback-text">{ex3Msg}</div>}
        </div>
      )}

      {/* ---------------- EX4 ---------------- */}
      {activeTab === "ex4" && (
        <div className="exercise">
          <h3>Exercise 4: Debug the bug 🐞</h3>
          <p>
            Fix the inner-loop condition so Selection Sort correctly tracks the smallest value. Then sanity-check: on{" "}
            <code>[3, 1, 2]</code>, the first pass should put <code>1</code> in position <code>0</code>.
          </p>

          <pre className="code-block" style={{ marginBottom: "10px" }}>
            <div className="code-line">
              <span className="code-line-number">1</span>
              <span className="code-line-text">for j from i+1 to n-1:</span>
            </div>
            <div className="code-line code-line-hinted">
              <span className="code-line-number">2</span>
              <span className="code-line-text">{"    // choose the correct condition below"}</span>
            </div>
            <div className="code-line">
              <span className="code-line-number">3</span>
              <span className="code-line-text">{"    if ??? : minIndex = j"}</span>
            </div>
          </pre>

          {/* Fix options */}
          <div className="exercise-options">
            {ex4FixOptions.map((opt) => (
              <button
                key={opt.id}
                className={"exercise-option" + (ex4Pick === opt.id ? " exercise-option-selected" : "")}
                onClick={() => ex4Select(opt.id)}
              >
                <code>{opt.text}</code>
              </button>
            ))}
          </div>

          {/* Footer actions */}
          <div className="exercise-footer">
            <button className="btn-ghost" onClick={ex4Reset}>
              Reset
            </button>
            {ex4Completed && <span>✅ Bug fixed!</span>}
          </div>

          {ex4Msg && <div className="feedback-text">{ex4Msg}</div>}
        </div>
      )}
    </section>
  );
}
