// src/InsertionSortExercises.js
import React, { useEffect, useMemo, useState } from "react";

// ---------- Utility helpers ----------
// Returns a random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a shuffled copy of an array using Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Performs one insertion sort pass at index i
// This inserts arr[i] into the correct place in the sorted prefix
function insertionOnePass(arr, i) {
  const a = [...arr];
  const key = a[i];
  let j = i - 1;
  while (j >= 0 && a[j] > key) {
    a[j + 1] = a[j];
    j--;
  }
  a[j + 1] = key;
  return a;
}

// Finds the correct insertion index for arr[i] after scanning left
function insertionCorrectIndexAfterScan(arr, i) {
  const key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) j--;
  return j + 1;
}

// Counts how many shifts would happen when inserting arr[i]
function countShiftsForKey(arr, i) {
  const key = arr[i];
  let j = i - 1;
  let shifts = 0;
  while (j >= 0 && arr[j] > key) {
    shifts++;
    j--;
  }
  return shifts;
}

// Runs a full insertion sort and tracks performance metrics
// Returns the sorted array, total comparisons, and total shifts
function instrumentedInsertionSort(arr) {
  const a = [...arr];
  let comparisons = 0;
  let shifts = 0;

  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;

    while (j >= 0) {
      comparisons++;
      if (a[j] > key) {
        a[j + 1] = a[j];
        shifts++;
        j--;
      } else break;
    }
    a[j + 1] = key;
  }

  return { sorted: a, comparisons, shifts };
}

// Generates a random numeric array of length n
function generateRandomArray(n, min = 1, max = 60) {
  return Array.from({ length: n }, () => randInt(min, max));
}

// Generates a nearly sorted array for performance testing
function generateNearlySortedArray(n) {
  const base = Array.from({ length: n }, (_, i) => i + 1);
  const swaps = Math.max(1, Math.floor(n / 10));
  let a = [...base];
  for (let s = 0; s < swaps; s++) {
    const i = randInt(0, n - 2);
    [a[i], a[i + 1]] = [a[i + 1], a[i]];
  }
  // add scale so it looks less “perfect”
  return a.map((v) => v * randInt(1, 3));
}

// Generates a reverse sorted array for worst-case testing
function generateReverseSortedArray(n) {
  const a = Array.from({ length: n }, (_, i) => n - i);
  return a.map((v) => v * randInt(1, 3));
}

// ------------------------------------------------------------
// EX1 Cards: explicit ordering + “real card” look
// ------------------------------------------------------------
// Ordered card ranks from low to high
const CARD_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
// Suit order used when two cards share the same rank
const SUIT_ORDER = ["♣", "♦", "♥", "♠"];

// Available suits and their display colour
const CARD_SUITS = [
  { symbol: "♣", color: "black" },
  { symbol: "♦", color: "red" },
  { symbol: "♥", color: "red" },
  { symbol: "♠", color: "black" },
];

// Lookup tables for rank and suit values
const RANK_VALUE = Object.fromEntries(CARD_RANKS.map((r, i) => [r, i]));
const SUIT_VALUE = Object.fromEntries(SUIT_ORDER.map((s, i) => [s, i]));

// Creates one random playing card object
function makeCard() {
  const rankLabel = CARD_RANKS[randInt(0, CARD_RANKS.length - 1)];
  const suitObj = CARD_SUITS[randInt(0, CARD_SUITS.length - 1)];
  return {
    rankLabel,
    rankValue: RANK_VALUE[rankLabel],
    suit: suitObj.symbol,
    color: suitObj.color,
    id: `${rankLabel}${suitObj.symbol}-${Math.random().toString(16).slice(2)}`,
  };
}

// Rank-first, suit-second (realistic & teachable)
function cardCompare(a, b) {
  const r = a.rankValue - b.rankValue;
  if (r !== 0) return r;
  return SUIT_VALUE[a.suit] - SUIT_VALUE[b.suit];
}

// For “insert after all <=”
function cardLessOrEqual(a, b) {
  return cardCompare(a, b) <= 0;
}

// Pip layouts for 2–10 (simple/convincing)
const PIP_LAYOUTS = {
  2: [
    [50, 25],
    [50, 75],
  ],
  3: [
    [50, 22],
    [50, 50],
    [50, 78],
  ],
  4: [
    [30, 28],
    [70, 28],
    [30, 72],
    [70, 72],
  ],
  5: [
    [30, 28],
    [70, 28],
    [50, 50],
    [30, 72],
    [70, 72],
  ],
  6: [
    [30, 24],
    [70, 24],
    [30, 50],
    [70, 50],
    [30, 76],
    [70, 76],
  ],
  7: [
    [30, 22],
    [70, 22],
    [50, 36],
    [30, 50],
    [70, 50],
    [30, 78],
    [70, 78],
  ],
  8: [
    [30, 22],
    [70, 22],
    [30, 42],
    [70, 42],
    [30, 58],
    [70, 58],
    [30, 78],
    [70, 78],
  ],
  9: [
    [30, 22],
    [70, 22],
    [30, 40],
    [70, 40],
    [50, 50],
    [30, 60],
    [70, 60],
    [30, 78],
    [70, 78],
  ],
  10: [
    [30, 18],
    [70, 18],
    [30, 34],
    [70, 34],
    [30, 50],
    [70, 50],
    [30, 66],
    [70, 66],
    [30, 82],
    [70, 82],
  ],
};

// Renders a single playing card UI
function renderPlayingCard(card, selected = false) {
  const cls = [
    "playing-card",
    card.color === "red" ? "playing-card-red" : "",
    selected ? "playing-card-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isFace = ["J", "Q", "K"].includes(card.rankLabel);
  const isAce = card.rankLabel === "A";
  const pipCount = Number(card.rankLabel);
  const layout = PIP_LAYOUTS[pipCount];

  return (
    <div className={cls} role="img" aria-label={`${card.rankLabel} of ${card.suit}`}>
        {/* Top-left corner rank/suit */}
      <div className="card-corner card-corner-top">
        <div className="card-rank-corner">{card.rankLabel}</div>
        <div className="card-suit-corner">{card.suit}</div>
      </div>

       {/* Bottom-right corner rank/suit */}
      <div className="card-corner card-corner-bottom">
        <div className="card-rank-corner">{card.rankLabel}</div>
        <div className="card-suit-corner">{card.suit}</div>
      </div>

      {/* Special ace design */}
      {isAce && (
        <div className="card-center-ace">
          <div className="card-ace-suit">{card.suit}</div>
        </div>
      )}

      {/* Face card design */}
      {isFace && (
        <div className="card-center-face">
          <div className="card-face-letter">{card.rankLabel}</div>
        </div>
      )}

      {/* Pip layout for number cards */}
      {!isAce && !isFace && layout && (
        <div className="card-center-pips" aria-hidden="true">
          {layout.map(([x, y], idx) => (
            <div
              key={idx}
              className="card-pip"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {card.suit}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// EX3 question generator: ensures prefix is sorted at pass i
// ------------------------------------------------------------
// Builds an array state that matches a real insertion sort pass
// Prefix [0..i-1] will already be sorted
function buildStateAtPassI(n = 5) {
  let a = Array.from({ length: n }, () => randInt(1, 9));
  const i = randInt(1, n - 2);

  // simulate insertion sort up to i-1 so prefix [0..i-1] is sorted
  for (let p = 1; p <= i - 1; p++) {
    a = insertionOnePass(a, p);
  }

  return { a, i };
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export default function InsertionSortExercises({ onComplete }) {
  const [activeTab, setActiveTab] = useState("ex1");

  const markComplete = (key) => {
    if (typeof onComplete === "function") onComplete(key);
  };

  // ============================================================
  // EX1 (NEW): Real life — sorting playing cards in your hand
  // ============================================================
  const [hand, setHand] = useState(() => {
    const initial = [makeCard(), makeCard()].sort(cardCompare);
    return initial;
  });

  // Draw pile of six random cards
  const [drawPile, setDrawPile] = useState(() => Array.from({ length: 6 }, () => makeCard()));
  // Currently drawn card waiting to be inserted
  const [currentCard, setCurrentCard] = useState(null);

  // Exercise feedback message
  const [ex1Msg, setEx1Msg] = useState(
    "Draw a card, then insert it into the correct place so your hand stays in order."
  );
  const [ex1Completed, setEx1Completed] = useState(false);

  // Keep mistakes internal (optional), but not displayed loudly
  const [ex1Mistakes, setEx1Mistakes] = useState(0);

  const ex1Reset = () => {
    setHand([makeCard(), makeCard()].sort(cardCompare));
    setDrawPile(Array.from({ length: 6 }, () => makeCard()));
    setCurrentCard(null);
    setEx1Msg("New deal ✅ Draw a card and keep your hand sorted.");
    setEx1Completed(false);
    setEx1Mistakes(0);
  };

  // Draws the next card from the pile and prompts the user to insert it
  const ex1Draw = () => {
    if (ex1Completed) return;
    if (currentCard) return;

    // If no cards remain, check whether the hand is fully sorted and mark complete if so
    if (drawPile.length === 0) {
      // verify sorted
      const sorted = [...hand].sort(cardCompare);
      const ok = hand.every((c, idx) => c.id === sorted[idx].id);
      if (ok) {
        setEx1Completed(true);
        setEx1Msg("🎉 Hand is sorted and no cards left — nice!");
        markComplete("ex1");
      } else {
        setEx1Msg("No cards left — but your hand isn’t fully sorted. Try a new deal!");
      }
      return;
    }

    const next = drawPile[0];
    setDrawPile((p) => p.slice(1));
    setCurrentCard(next);

    setEx1Msg(`You drew ${next.rankLabel}${next.suit}. Insert it where it belongs in your hand.`);
  };

   // Calculates the correct insertion position for the drawn card
  const ex1CorrectInsertIndex = useMemo(() => {
    if (!currentCard) return null;
    let idx = 0;
    while (idx < hand.length && cardLessOrEqual(hand[idx], currentCard)) idx++;
    return idx;
  }, [currentCard, hand]);

   // Inserts the drawn card into a chosen slot and checks if it’s correct
  const ex1InsertAt = (index) => {
    if (ex1Completed) return;
    if (!currentCard) return;

    const correct = ex1CorrectInsertIndex;
    if (correct == null) return;

    // Wrong slot chosen — give feedback and a friendly hint based on neighbors
    if (index !== correct) {
      setEx1Mistakes((m) => m + 1);

      // Friendly hint: show neighbors
      const left = hand[index - 1];
      const right = hand[index];
      const betweenHint =
        left && right
          ? `It should go between ${left.rankLabel}${left.suit} and ${right.rankLabel}${right.suit}.`
          : left
          ? `It should come after ${left.rankLabel}${left.suit}.`
          : right
          ? `It should come before ${right.rankLabel}${right.suit}.`
          : "";

      setEx1Msg(`❌ Not quite. Keep the hand in order. ${betweenHint}`);
      return;
    }

    // Correct insertion — update hand and check for completion
    const newHand = [...hand.slice(0, index), currentCard, ...hand.slice(index)];
    setHand(newHand);
    setCurrentCard(null);

    const isHandSorted = newHand.every((c, idx) => idx === 0 || cardCompare(newHand[idx - 1], c) <= 0);
    const done = drawPile.length === 0 && isHandSorted;

    if (done) {
      setEx1Completed(true);
      setEx1Msg("🎉 Perfect! You kept your hand sorted as cards arrived — that’s insertion sort.");
      markComplete("ex1");
    } else {
      setEx1Msg("✅ Inserted! Draw the next card and keep the hand sorted.");
    }
  };

  // Creates possible insertion slots between/around current hand cards
  const ex1Slots = useMemo(
    () => Array.from({ length: hand.length + 1 }, (_, i) => i),
    [hand.length]
  );

  // ============================================================
  // EX2 (NEW): Simplified mini insertion sort (one decision only)
  // “Where does the key go?” — auto shift performed by UI.
  // ============================================================
  const [ex2Array, setEx2Array] = useState(() => Array.from({ length: 7 }, () => randInt(1, 25)));
  const [ex2I, setEx2I] = useState(1);
  const [ex2Msg, setEx2Msg] = useState(
    "Click the correct gap where the key should be inserted. (We’ll do the shifting for you.)"
  );
  const [ex2Completed, setEx2Completed] = useState(false);

  // Resets exercise 2 with a new random array and starting conditions
  const ex2Reset = () => {
    const fresh = Array.from({ length: 7 }, () => randInt(1, 25));
    setEx2Array(fresh);
    setEx2I(1);
    setEx2Msg("New round ✅ Choose the correct gap for the key each pass.");
    setEx2Completed(false);
  };

  // Current key being inserted
  const ex2Key = ex2Array[ex2I];

  // Correct insertion position for the current key
  const ex2CorrectPos = useMemo(() => {
    return insertionCorrectIndexAfterScan(ex2Array, ex2I);
  }, [ex2Array, ex2I]);

  // Handles learner choosing a gap to insert the key into
  const ex2ChooseGap = (pos) => {
    if (ex2Completed) return;

    if (pos !== ex2CorrectPos) {
      // Gentle hint, no j-talk
      setEx2Msg("❌ Not quite. The key must go after all smaller (or equal) values in the green prefix.");
      return;
    }

    // Apply one insertion pass automatically
    const nextArr = insertionOnePass(ex2Array, ex2I);
    setEx2Array(nextArr);

    const nextI = ex2I + 1;
    if (nextI >= nextArr.length) {
      setEx2Completed(true);
      setEx2Msg("🎉 Completed! You inserted each key into the sorted prefix.");
      markComplete("ex2");
      return;
    }

    setEx2I(nextI);
    setEx2Msg(`✅ Nice. Next pass: i = ${nextI}. Choose where the new key should be inserted.`);
  };

  // Gap positions available from 0 to i
  const ex2Gaps = useMemo(() => Array.from({ length: ex2I + 1 }, (_, p) => p), [ex2I]);

  // ============================================================
  // EX3: Predict the next step (fixed: prefix sorted)
  // ============================================================
  const [ex3Seed, setEx3Seed] = useState(1);
  const [ex3PickPos, setEx3PickPos] = useState(null);
  const [ex3PickShifts, setEx3PickShifts] = useState(null);
  const [ex3Msg, setEx3Msg] = useState("");
  const [ex3Completed, setEx3Completed] = useState(false);

  // Builds a new random question whenever ex3Seed changes
  const ex3Question = useMemo(() => {
    const { a: base, i } = buildStateAtPassI(5);

    const correctPos = insertionCorrectIndexAfterScan(base, i);
    const correctShifts = countShiftsForKey(base, i);

    // position options
    const posOptionsRaw = [correctPos, Math.max(0, correctPos - 1), Math.min(i, correctPos + 1)];
    const posUnique = Array.from(new Set(posOptionsRaw));
    while (posUnique.length < 3) posUnique.push(randInt(0, i));
    const posOptions = shuffle(posUnique.slice(0, 3)).map((pos, idx) => ({
      id: idx,
      value: pos,
      correct: pos === correctPos,
      label: `Position ${pos}`,
    }));

    // shifts options
    const sRaw = [correctShifts, Math.max(0, correctShifts - 1), Math.min(i, correctShifts + 1)];
    const sUnique = Array.from(new Set(sRaw));
    while (sUnique.length < 3) sUnique.push(randInt(0, i));
    const shiftOptions = shuffle(sUnique.slice(0, 3)).map((s, idx) => ({
      id: idx,
      value: s,
      correct: s === correctShifts,
      label: `${s} shift${s === 1 ? "" : "s"}`,
    }));

    return { base, i, correctPos, correctShifts, posOptions, shiftOptions };
  }, [ex3Seed]);

  // Generates a fresh EX3 question
  const ex3New = () => {
    setEx3Seed((s) => s + 1);
    setEx3PickPos(null);
    setEx3PickShifts(null);
    setEx3Msg("");
    setEx3Completed(false);
  };

  // Checks learner answer for EX3
  const ex3Submit = () => {
    const posOpt = ex3Question.posOptions.find((o) => o.id === ex3PickPos);
    const shiftOpt = ex3Question.shiftOptions.find((o) => o.id === ex3PickShifts);

    if (!posOpt || !shiftOpt) {
      setEx3Msg("Pick an insertion position AND a shift count.");
      return;
    }

    const posOk = posOpt.correct;
    const shiftsOk = shiftOpt.correct;

    if (posOk && shiftsOk) {
      setEx3Msg(
        `✅ Correct! The key inserts at position ${ex3Question.correctPos} after ${ex3Question.correctShifts} shift(s).`
      );
      if (!ex3Completed) {
        setEx3Completed(true);
        markComplete("ex3");
      }
      return;
    }

    const hints = [];
    if (!posOk) hints.push("Position hint: the key moves left until the left value is NOT bigger than it.");
    if (!shiftsOk) hints.push("Shift hint: count how many values in the prefix are bigger than the key.");

    setEx3Msg(`❌ Not quite. ${hints.join(" ")}`);
  };

  // ============================================================
  // EX4: Performance & efficiency experiment (fixed completion)
  // ============================================================
  const [ex4N, setEx4N] = useState(12);
  const [ex4Case, setEx4Case] = useState("nearly"); // nearly | random | reverse
  const [ex4Array, setEx4Array] = useState(() => generateNearlySortedArray(12));
  const [ex4Result, setEx4Result] = useState(null);
  const [ex4Msg, setEx4Msg] = useState(
    "Generate a case and run insertion sort. Try at least two different cases to complete this exercise."
  );
  const [ex4Completed, setEx4Completed] = useState(false);

  // Track cases *actually run* (not just selected)
  const [ex4RanCases, setEx4RanCases] = useState({ nearly: false, random: false, reverse: false });

  // Generates an array for the selected case type and resets results
  const ex4Generate = (caseType = ex4Case, n = ex4N) => {
    let arr = [];
    if (caseType === "nearly") arr = generateNearlySortedArray(n);
    if (caseType === "random") arr = generateRandomArray(n, 1, 60);
    if (caseType === "reverse") arr = generateReverseSortedArray(n);

    setEx4Array(arr);
    setEx4Result(null);
    setEx4Msg("Now click Run to measure comparisons and shifts.");
  };

  // Runs insertion sort on the generated array and tracks which cases have been run for completion criteria
  const ex4Run = () => {
    const res = instrumentedInsertionSort(ex4Array);
    setEx4Result(res);

    // Mark this case as tested for completion tracking
    setEx4RanCases((prev) => ({ ...prev, [ex4Case]: true }));

    const note =
      ex4Case === "nearly"
        ? "Nearly sorted (best-case-ish): usually few shifts."
        : ex4Case === "reverse"
        ? "Reverse sorted (worst-case): many shifts."
        : "Random: typically in the middle.";

    setEx4Msg(`Done ✅ ${note}`);
  };

   // Changes the selected case type and regenerates the data
  const ex4OnChangeCase = (v) => {
    setEx4Case(v);
    ex4Generate(v, ex4N);
  };

  // Changes array size and regenerates the data
  const ex4OnChangeN = (n) => {
    setEx4N(n);
    ex4Generate(ex4Case, n);
  };

   // Counts how many distinct cases have been tested
  const ex4CaseCount = Object.values(ex4RanCases).filter(Boolean).length;

   // Marks EX4 as complete after at least two different cases have been run
  useEffect(() => {
    if (!ex4Completed && ex4Result && ex4CaseCount >= 2) {
      setEx4Completed(true);
      markComplete("ex4");
      setEx4Msg((m) => `${m} 🎉 Completed (you compared at least two cases).`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex4Completed, ex4Result, ex4CaseCount]);

  // ------------------------------------------------------------
  // Tabs (now reflect swapped order)
  // ------------------------------------------------------------
  const tabs = [
    { id: "ex1", title: "Exercise 1" }, // Cards
    { id: "ex2", title: "Exercise 2" }, // Simplified insertion
    { id: "ex3", title: "Exercise 3" }, // Predict
    { id: "ex4", title: "Exercise 4" }, // Performance
  ];

  return (
    <section className="lesson-section">
      <h2>Interactive exercises</h2>

     {/* Tab buttons for switching between exercises */}
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

      {/* ---------------- EX1 (Cards) ---------------- */}
      {activeTab === "ex1" && (
        <div id="panel-ex1" role="tabpanel" aria-labelledby="tab-ex1" className="exercise">
          <h3>Exercise 1: Real life — sorting playing cards in your hand 🃏</h3>
          <p>
            Draw one card at a time and <strong>insert</strong> it into the correct place so your hand stays in order.
            <br />
            Order rule: <strong>rank first</strong> (2 → A). If ranks match, suits go <strong>♣ ♦ ♥ ♠</strong>.
          </p>

          {/* Exercise status row */}
          <div className="exercise-footer" style={{ justifyContent: "space-between" }}>
            <span>
              Cards remaining: <strong>{drawPile.length}</strong>
              {ex1Mistakes >= 3 ? (
                <span style={{ marginLeft: 10, color: "var(--muted)" }}>Tip: look for the neighbors it belongs between.</span>
              ) : null}
            </span>
            <span>{ex1Completed ? "Completed ✅" : currentCard ? "Insert the drawn card" : "Draw a card"}</span>
          </div>

          <div className="card-exercise">
            <div className="card-exercise-footer">
              <strong>Your hand (keep sorted)</strong>
              <span className="card-exercise-swaps">Insert the drawn card into the right slot.</span>
            </div>

            {/* Current hand */}
            <div className="card-row-playing" aria-label="Hand cards">
              {hand.map((c) => (
                <div key={c.id}>{renderPlayingCard(c)}</div>
              ))}
            </div>

            {/* Drawn card waiting to be inserted */}
            {currentCard && (
              <>
                <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <strong>Drawn card:</strong>
                  {renderPlayingCard(currentCard, true)}
                  <span style={{ color: "var(--muted)" }}>Choose insertion slot (0..{hand.length})</span>
                </div>

                {/* Slot buttons */}
                <div className="exercise-options" aria-label="Insertion slots">
                  {ex1Slots.map((slot) => (
                    <button
                      key={slot}
                      className="exercise-option"
                      onClick={() => ex1InsertAt(slot)}
                      disabled={ex1Completed}
                      aria-label={`Insert at position ${slot}`}
                    >
                      Insert at {slot}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

           {/* Exercise controls */}
          <div className="exercise-footer">
            <button className="btn-primary" onClick={ex1Draw} disabled={ex1Completed || !!currentCard}>
              Draw a card
            </button>
            <button className="btn-ghost" onClick={ex1Reset}>
              New deal
            </button>
            {ex1Completed && <span>✅ Sorted like a pro!</span>}
          </div>

          {ex1Msg && <div className="feedback-text">{ex1Msg}</div>}
        </div>
      )}

      {/* ---------------- EX2 (Simplified insertion) ---------------- */}
      {activeTab === "ex2" && (
        <div id="panel-ex2" role="tabpanel" aria-labelledby="tab-ex2" className="exercise">
          <h3>Exercise 2: Insert the key into the sorted prefix 🧩</h3>
          <p>
            The green part is already sorted. The highlighted key should be inserted into the correct <strong>gap</strong>.
            <br />
            You only choose the gap — we’ll handle the shifting.
          </p>

           {/* Exercise 2 status row */}
          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <span>
              Pass: <strong>i = {ex2I}</strong> · key = <strong>{ex2Key}</strong>
            </span>
            <span>Status: <strong>{ex2Completed ? "Completed ✅" : "Choose the gap"}</strong></span>
          </div>

         {/* Number cards with prefix/key highlighting */}
          <div className="card-row" aria-label="Number cards for exercise 2">
            {ex2Array.map((v, idx) => {
              const inPrefix = idx < ex2I;
              const isKeyIndex = idx === ex2I;

              const cls = [
                "number-card",
                inPrefix ? "number-card-prefix" : "",
                isKeyIndex ? "number-card-key" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={idx}
                  className={cls}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "64px",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                    {inPrefix ? "✅ prefix" : isKeyIndex ? "🔑 key" : " "}
                  </div>
                </div>
              );
            })}
          </div>

           {/* Gap buttons for choosing insertion position */}
          {!ex2Completed && (
            <div className="insert-slots" aria-label="Choose insertion gap">
              <span style={{ color: "var(--muted)" }}>Insert key at gap:</span>
              {ex2Gaps.map((pos) => (
                <button
                  key={pos}
                  className="insert-slot"
                  onClick={() => ex2ChooseGap(pos)}
                  aria-label={`Insert at position ${pos}`}
                >
                  {pos}
                </button>
              ))}
            </div>
          )}

          <div className="exercise-footer" style={{ justifyContent: "flex-start" }}>
            <button className="btn-ghost" onClick={ex2Reset}>
              New round
            </button>
          </div>

          {ex2Msg && <div className="feedback-text">{ex2Msg}</div>}
        </div>
      )}

      {/* ---------------- EX3 ---------------- */}
      {activeTab === "ex3" && (
        <div id="panel-ex3" role="tabpanel" aria-labelledby="tab-ex3" className="exercise">
          <h3>Exercise 3: Predict the next step 🔮</h3>
          <p>
            Predict <strong>where the key is inserted</strong> and <strong>how many shifts</strong> happen in this pass.
            <br />
            (The prefix is guaranteed sorted here — like real insertion sort.)
          </p>

          <p style={{ marginTop: 0 }}>
            Array: <code>[{ex3Question.base.join(", ")}]</code> · key index: <code>i = {ex3Question.i}</code> · key value:{" "}
            <code>{ex3Question.base[ex3Question.i]}</code>
          </p>

          <div style={{ marginTop: 10 }}>
            <p style={{ marginBottom: 6 }}>
              <strong>A)</strong> Where will the key be inserted?
            </p>
            <div className="exercise-options">
              {ex3Question.posOptions.map((opt) => (
                <button
                  key={opt.id}
                  className={"exercise-option" + (ex3PickPos === opt.id ? " exercise-option-selected" : "")}
                  onClick={() => setEx3PickPos(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <p style={{ marginBottom: 6 }}>
              <strong>B)</strong> How many shifts happen in this pass?
            </p>
            <div className="exercise-options">
              {ex3Question.shiftOptions.map((opt) => (
                <button
                  key={opt.id}
                  className={"exercise-option" + (ex3PickShifts === opt.id ? " exercise-option-selected" : "")}
                  onClick={() => setEx3PickShifts(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="exercise-footer" style={{ justifyContent: "flex-start", gap: 10 }}>
            <button className="btn-primary" onClick={ex3Submit}>
              Check answer
            </button>
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
        <div id="panel-ex4" role="tabpanel" aria-labelledby="tab-ex4" className="exercise">
          <h3>Exercise 4: Performance &amp; efficiency experiment 📈</h3>
          <p>
            Run insertion sort on different inputs and compare <strong>comparisons</strong> and <strong>shifts</strong>.
            Try at least <strong>two cases</strong> to complete this exercise.
          </p>

            {/* Controls for size and case type */}
          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <label className="input-label" style={{ minWidth: 220 }}>
              List size n: <strong>{ex4N}</strong>
              <input
                type="range"
                min="6"
                max="40"
                value={ex4N}
                onChange={(e) => ex4OnChangeN(Number(e.target.value))}
              />
            </label>

            <div className="option-group" style={{ gap: 10, flexWrap: "wrap" }}>
              <span className="option-label">Case:</span>
              <label>
                <input
                  type="radio"
                  name="ex4-case"
                  checked={ex4Case === "nearly"}
                  onChange={() => ex4OnChangeCase("nearly")}
                />{" "}
                Nearly sorted (best-case-ish)
              </label>
              <label>
                <input
                  type="radio"
                  name="ex4-case"
                  checked={ex4Case === "random"}
                  onChange={() => ex4OnChangeCase("random")}
                />{" "}
                Random
              </label>
              <label>
                <input
                  type="radio"
                  name="ex4-case"
                  checked={ex4Case === "reverse"}
                  onChange={() => ex4OnChangeCase("reverse")}
                />{" "}
                Reverse sorted (worst-case)
              </label>
            </div>
          </div>

          {/* Current generated array */}
          <div style={{ marginTop: 10 }}>
            <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Current array:
              <div style={{ marginTop: 6 }}>
                <code style={{ display: "inline-block" }}>[{ex4Array.join(", ")}]</code>
              </div>
            </div>
          </div>

          {/* Generate and run controls */}
          <div className="exercise-footer" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-secondary" onClick={() => ex4Generate(ex4Case, ex4N)}>
              Generate
            </button>
            <button className="btn-primary" onClick={ex4Run}>
              Run insertion sort
            </button>
            <span style={{ color: "var(--muted)" }}>
              Cases run: <strong>{ex4CaseCount}</strong> / 2 {ex4Completed ? "✅" : ""}
            </span>
          </div>

          {/* Performance results */}
          {ex4Result && (
            <div style={{ marginTop: 12 }}>
              <div className="complexity-bars" style={{ marginTop: 0 }}>
                <div className="complexity-row">
                  <span>Comparisons</span>
                  <div className="complexity-bar">
                    <div
                      className="complexity-bar-fill fast"
                      style={{ width: `${Math.min(100, (ex4Result.comparisons / 800) * 100)}%` }}
                    />
                  </div>
                  <span className="complexity-value">{ex4Result.comparisons}</span>
                </div>

                <div className="complexity-row">
                  <span>Shifts</span>
                  <div className="complexity-bar">
                    <div
                      className="complexity-bar-fill bubble"
                      style={{ width: `${Math.min(100, (ex4Result.shifts / 800) * 100)}%` }}
                    />
                  </div>
                  <span className="complexity-value">{ex4Result.shifts}</span>
                </div>
              </div>

               {/* Sorted output */}
              <p className="complexity-caption" style={{ marginTop: 10 }}>
                Sorted output:
                <br />
                <code>[{ex4Result.sorted.join(", ")}]</code>
              </p>
            </div>
          )}

          {ex4Msg && <div className="feedback-text">{ex4Msg}</div>}
        </div>
      )}
    </section>
  );
}
