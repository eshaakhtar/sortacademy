// src/BubbleSortExercises.js
import React, { useState } from "react";
import "./LessonPages.css";

// -------------------- Shared helpers (moved from lesson, unchanged logic) --------------------

// Check whether a numeric array is sorted in ascending order
function isSortedAscending(array) {
  for (let i = 1; i < array.length; i++) {
    if (array[i - 1] > array[i]) return false;
  }
  return true;
}

// Generate a random Bubble Sort scenario where the user predicts the next step
function generatePredictScenario() {
  const scenarios = [
    { array: [2, 5, 4, 1], compareIndex: 1 }, // 5 vs 4
    { array: [3, 6, 2, 8], compareIndex: 1 }, // 6 vs 2
    { array: [1, 7, 9, 3], compareIndex: 2 }, // 9 vs 3
    { array: [4, 2, 5, 9], compareIndex: 0 }, // 4 vs 2
  ];
  // Select a random predefined scenario
  const base = scenarios[Math.floor(Math.random() * scenarios.length)];
  const arr = [...base.array];
  const j = base.compareIndex;
  const a = arr[j];
  const b = arr[j + 1];

// Compute the correct result after comparing and possibly swapping neighbours
  let correctArr = [...arr];
  if (a > b) {
    correctArr[j] = b;
    correctArr[j + 1] = a;
  }
// Create distractor options so the learner must think about Bubble Sort behaviour
  const option1 = [...arr]; // no swap
  let option2 = [...arr];
  if (j > 0) {
    const tmp = option2[j - 1];
    option2[j - 1] = option2[j];
    option2[j] = tmp;
  } else {
    const last = option2.length - 1;
    const tmp = option2[last - 1];
    option2[last - 1] = option2[last];
    option2[last] = tmp;
  }

  const options = [
    { arr: correctArr, isCorrect: true },
    { arr: option1, isCorrect: false },
    { arr: option2, isCorrect: false },
  ];
// Shuffle options so the correct answer appears in a random position
  for (let i = options.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [options[i], options[k]] = [options[k], options[i]];
  }
// Record which shuffled option is the correct answer
  const correctIndex = options.findIndex((o) => o.isCorrect);
// Return the scenario data needed by Exercise 1 to display the question and options
  return {
    baseArray: arr,
    compareIndex: j,
    options: options.map((o) => o.arr),
    correctIndex,
  };
}

// -------------------- Exercise 3 component (moved from lesson, unchanged logic) --------------------
// Exercise component where users identify the Bubble Sort pseudocode
const SpotBubbleSort = ({ onComplete }) => {
  // Example pseudocode snippets for different sorting algorithms
  const snippets = [   
    {
      id: 1,
      title: "Snippet A",
      text: [
        "for i from 0 to n - 1:",
        "    minIndex ← i",
        "    for j from i + 1 to n - 1:",
        "        if A[j] < A[minIndex]:",
        "            minIndex ← j",
        "    swap A[i] and A[minIndex]",
      ],
      type: "selection",
    },
    {
      id: 2,
      title: "Snippet B",
      text: [
        "for i from 0 to n - 1:",
        "    for j from 0 to n - i - 2:",
        "        if A[j] > A[j + 1]:",
        "            swap A[j] and A[j + 1]",
      ],
      type: "bubble",
    },
    {
      id: 3,
      title: "Snippet C",
      text: [
        "for i from 1 to n - 1:",
        "    key ← A[i]",
        "    j ← i - 1",
        "    while j ≥ 0 and A[j] > key:",
        "        A[j + 1] ← A[j]",
        "        j ← j - 1",
        "    A[j + 1] ← key",
      ],
      type: "insertion",
    },
  ];
// Track which snippet the learner has selected and the feedback shown after selection
  const [selectedId, setSelectedId] = useState(null);
  const [feedback, setFeedback] = useState("");
// Handle user selection and provide feedback based on chosen algorithm
  const handleSelect = (id) => {
    setSelectedId(id);
    const snippet = snippets.find((s) => s.id === id);
    // Award completion only when the correct Bubble Sort snippet is chosen
    if (snippet.type === "bubble") {
      setFeedback(
        "✅ Correct! Bubble Sort repeatedly compares neighbours and swaps them if they are out of order."
      );
      onComplete?.();
    } else if (snippet.type === "selection") {
      setFeedback(
        "❌ This is Selection Sort: it finds the minimum element and swaps it into place."
      );
    } else {
      setFeedback(
        "❌ This is Insertion Sort: it inserts each element into a growing sorted prefix."
      );
    }
  };

  return (
    <div className="spot-bubble">
      <div className="spot-bubble-snippets">
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            className={
              "spot-bubble-snippet" +
              (selectedId === snippet.id ? " spot-bubble-snippet-selected" : "")
            }
            onClick={() => handleSelect(snippet.id)}
          >
            <div className="spot-bubble-title">{snippet.title}</div>
            <pre className="spot-bubble-code">
              {snippet.text.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </pre>
          </button>
        ))}
      </div>
      {feedback && <div className="feedback-text">{feedback}</div>}
    </div>
  );
};

// -------------------- Exercise 4 (your old CardSortExercise.js logic, moved unchanged) --------------------

// CARD DATA
// Custom ordering rules used for the card-sorting exercise
const CARD_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUIT_ORDER = ["♣", "♦", "♥", "♠"];
// Card suit metadata used for rendering suit symbols and colours
const CARD_SUITS = [ 
  { symbol: "♣", color: "black" },
  { symbol: "♦", color: "red" },
  { symbol: "♥", color: "red" },
  { symbol: "♠", color: "black" },
];
// Convert a card into a sortable numeric value (suit priority, then rank)
function cardKey(card) {
  const suitIndex = SUIT_ORDER.indexOf(card.suit);
  const rankIndex = CARD_RANKS.indexOf(card.rank);
  return suitIndex * CARD_RANKS.length + rankIndex;
}
// Generate a random hand of unique playing cards for the exercise
function generateRandomHand(length = 6) {
  const hand = [];  // Build a hand with no duplicate cards
  const used = new Set();

  while (hand.length < length) {
    const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)];
    const suitObj = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
    const key = `${rank}-${suitObj.symbol}`;
// Only add the card if it has not already been generated
    if (!used.has(key)) {
      used.add(key);
      hand.push({
        id: key,
        rank,
        suit: suitObj.symbol,
        color: suitObj.color,
      });
    }
  }
  return hand;
}
// Check if cards are sorted by suit first, then by rank
function isCardArraySorted(cards) {
  for (let i = 1; i < cards.length; i++) {
    if (cardKey(cards[i - 1]) > cardKey(cards[i])) return false;
  }
  return true;
}

/**
 * Pip layouts (2–10) – coordinates as % of the centre box.
 */
const PIP_LAYOUTS = {
  "2": [
    { x: 50, y: 24 },
    { x: 50, y: 76 },
  ],
  "3": [
    { x: 50, y: 20 },
    { x: 50, y: 50 },
    { x: 50, y: 80 },
  ],
  "4": [
    { x: 28, y: 24 },
    { x: 72, y: 24 },
    { x: 28, y: 76 },
    { x: 72, y: 76 },
  ],
  "5": [
    { x: 28, y: 24 },
    { x: 72, y: 24 },
    { x: 50, y: 50 },
    { x: 28, y: 76 },
    { x: 72, y: 76 },
  ],
  "6": [
    { x: 28, y: 20 },
    { x: 72, y: 20 },
    { x: 28, y: 50 },
    { x: 72, y: 50 },
    { x: 28, y: 80 },
    { x: 72, y: 80 },
  ],
  "7": [
    { x: 28, y: 18 },
    { x: 50, y: 18 },
    { x: 72, y: 18 },
    { x: 28, y: 50 },
    { x: 72, y: 50 },
    { x: 28, y: 80 },
    { x: 72, y: 80 },
  ],
  "8": [
    { x: 28, y: 18 },
    { x: 50, y: 18 },
    { x: 72, y: 18 },
    { x: 28, y: 48 },
    { x: 72, y: 48 },
    { x: 28, y: 78 },
    { x: 50, y: 78 },
    { x: 72, y: 78 },
  ],
  "9": [
    { x: 28, y: 16 },
    { x: 72, y: 16 },
    { x: 28, y: 38 },
    { x: 50, y: 38 },
    { x: 72, y: 38 },
    { x: 28, y: 60 },
    { x: 72, y: 60 },
    { x: 28, y: 82 },
    { x: 72, y: 82 },
  ],
  "10": [
    { x: 28, y: 16 },
    { x: 50, y: 16 },
    { x: 72, y: 16 },
    { x: 28, y: 36 },
    { x: 72, y: 36 },
    { x: 28, y: 56 },
    { x: 50, y: 56 },
    { x: 72, y: 56 },
    { x: 28, y: 82 },
    { x: 72, y: 82 },
  ],
};
// Interactive exercise allowing users to perform Bubble Sort using card swaps
const CardSortExercise = ({ onComplete }) => {
  // State for the current hand, selected card, swap count, feedback, and completion
  const [cards, setCards] = useState(() => generateRandomHand(6));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [swapCount, setSwapCount] = useState(0);
  const [message, setMessage] = useState(
    "Sort the cards by suit first (♣, ♦, ♥, ♠), then by rank (2 → A), using only neighbour swaps like Bubble Sort."
  );
  const [completed, setCompleted] = useState(false);
  
// Handle card selection and enforce neighbour-only swaps (Bubble Sort logic)
  const handleCardClick = (index) => {
    setMessage("");
    // First click selects a card; second click attempts a swap
    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }

    if (selectedIndex === index) {
      // Clicking the same card again cancels the selection
      setSelectedIndex(null);
      return;
    }

    if (Math.abs(selectedIndex - index) !== 1) {
      setMessage("Bubble Sort only swaps neighbouring cards.");
      setSelectedIndex(null);
      return;
    }

    const newCards = [...cards];
    // Perform the neighbour swap on a copied array to preserve React state rules
    [newCards[selectedIndex], newCards[index]] = [
      newCards[index],
      newCards[selectedIndex],
    ];

    setCards(newCards);
    setSelectedIndex(null);
    setSwapCount((prev) => prev + 1);

    if (isCardArraySorted(newCards)) {
      // Check whether the learner has fully sorted the hand
      setMessage(
        `🎉 Well done! You sorted the hand in ${swapCount + 1} swaps using Bubble Sort neighbour swaps.`
      );
      if (!completed) {
        setCompleted(true);
        onComplete?.();
      }
    } else {
      setMessage(
        "Good swap! Continue swapping neighbours until suits and ranks are in order."
      );
    }
  };
// Reset the card exercise with a new random hand
  const handleReset = () => {
    setCards(generateRandomHand(6));
    setSelectedIndex(null);
    setSwapCount(0);
    setCompleted(false);
    setMessage(
      "Sort the cards by suit first (♣, ♦, ♥, ♠), then by rank (2 → A), using only neighbour swaps like Bubble Sort."
    );
  };
// Render the visual centre of the card depending on rank (number, face, or ace)
  const renderCardCenter = (card) => {
    const { rank, suit } = card;
    const isFace = rank === "J" || rank === "Q" || rank === "K";
    const isAce = rank === "A";

    if (isFace) {
      return (
        <div className="card-center-face">
          <span className="card-face-letter">{rank}</span>
        </div>
      );
    }

    if (isAce) {
      return (
        <div className="card-center-ace">
          <span className="card-ace-suit">{suit}</span>
        </div>
      );
    }

    const layout = PIP_LAYOUTS[rank] || [];
    return (
      <div className="card-center-pips">
        {layout.map((pip, idx) => (
          <span
            key={idx}
            className="card-pip"
            style={{ left: `${pip.x}%`, top: `${pip.y}%` }}
          >
            {suit}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="card-exercise">
      <div className="card-row-playing">
        {cards.map((card, i) => (
          <button
            key={card.id}
            className={
              "playing-card " +
              (selectedIndex === i ? "playing-card-selected " : "") +
              (card.color === "red" ? "playing-card-red" : "")
            }
            onClick={() => handleCardClick(i)}
          >
            <div className="card-corner card-corner-top">
              <span className="card-rank-corner">{card.rank}</span>
              <span className="card-suit-corner">{card.suit}</span>
            </div>

            {renderCardCenter(card)}

            <div className="card-corner card-corner-bottom">
              <span className="card-rank-corner">{card.rank}</span>
              <span className="card-suit-corner">{card.suit}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="card-exercise-footer">
        <span className="card-exercise-swaps">Swaps: {swapCount}</span>
        <button className="btn-ghost" onClick={handleReset}>
          New hand
        </button>
      </div>

      {message && <div className="feedback-text">{message}</div>}

      <p className="card-exercise-caption">
        <strong>Sorting rule:</strong> Compare suits first (
        <strong>♣ → ♦ → ♥ → ♠</strong>). If suits are the same, compare ranks (
        <strong>2 → A</strong>). You can only swap neighbouring cards.
      </p>
    </div>
  );
};

// -------------------- Main Exercises wrapper (all 4 exercises, moved from lesson) --------------------
// Main component that manages and displays all Bubble Sort exercises using tabs
const BubbleSortExercise = ({ onEx1Done, onEx2Done, onEx3Done, onEx4Done }) => {
  const [activeExerciseTab, setActiveExerciseTab] = useState("ex1");

  // --- Exercise 1: Predict-next-step ---
  const [predictScenario, setPredictScenario] = useState(generatePredictScenario());
  const [predictAnswerIndex, setPredictAnswerIndex] = useState(null);
  const [predictFeedback, setPredictFeedback] = useState("");
// Check if the selected option is correct for the next Bubble Sort step
  const handlePredictOptionClick = (index) => {
    setPredictAnswerIndex(index);
    if (index === predictScenario.correctIndex) {
      setPredictFeedback(
        "✅ Correct! Bubble Sort swaps the two neighbours if the left one is bigger."
      );
      onEx1Done?.();
    } else {
      setPredictFeedback(
        "❌ Not quite. Remember: Bubble Sort only swaps those two neighbours if the left value is larger."
      );
    }
  };
// Generate a new prediction scenario for Exercise 1
  const handlePredictNewScenario = () => {
    setPredictScenario(generatePredictScenario());
    setPredictAnswerIndex(null);
    setPredictFeedback("");
  };

  // --- Exercise 2: Manual neighbour swaps ---
  const [manualArray, setManualArray] = useState([6, 2, 4, 1]);
  const [manualSelectedIndex, setManualSelectedIndex] = useState(null);
  const [manualSwaps, setManualSwaps] = useState(0);
  const [manualMessage, setManualMessage] = useState("");
 // Handle neighbour swaps for manual Bubble Sort simulation (Exercise 2)
  const handleManualCardClick = (index) => {
    setManualMessage("");
    if (manualSelectedIndex === null) {
      setManualSelectedIndex(index);
      return;
    }
    if (manualSelectedIndex === index) {
      setManualSelectedIndex(null);
      return;
    }

    if (Math.abs(manualSelectedIndex - index) !== 1) {
      setManualMessage("Bubble Sort only swaps neighbours. Choose two adjacent cards.");
      setManualSelectedIndex(null);
      return;
    }

    const newArr = [...manualArray];
    const tmp = newArr[manualSelectedIndex];
    newArr[manualSelectedIndex] = newArr[index];
    newArr[index] = tmp;

    setManualArray(newArr);
    setManualSelectedIndex(null);
    setManualSwaps((s) => s + 1);

    if (isSortedAscending(newArr)) {
      setManualMessage(
        `🎉 Well done! You sorted the array in ${
          manualSwaps + 1
        } swaps, just like Bubble Sort would swap neighbours.`
      );
      onEx2Done?.();
    }
  };
 // Reset Exercise 2 to its original unsorted state
  const handleManualReset = () => {
    setManualArray([6, 2, 4, 1]);
    setManualSelectedIndex(null);
    setManualSwaps(0);
    setManualMessage("");
  };

  return (
    <>
      {/* Tabs */}
      <div className="exercise-tabs" role="tablist" aria-label="Exercises">
        {/* Tab navigation for switching between the four Bubble Sort exercises */}
        <button
          type="button"
          role="tab"
          aria-selected={activeExerciseTab === "ex1"}
          className={activeExerciseTab === "ex1" ? "exercise-tab active" : "exercise-tab"}
          onClick={() => setActiveExerciseTab("ex1")}
        >
          Exercise 1
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeExerciseTab === "ex2"}
          className={activeExerciseTab === "ex2" ? "exercise-tab active" : "exercise-tab"}
          onClick={() => setActiveExerciseTab("ex2")}
        >
          Exercise 2
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeExerciseTab === "ex3"}
          className={activeExerciseTab === "ex3" ? "exercise-tab active" : "exercise-tab"}
          onClick={() => setActiveExerciseTab("ex3")}
        >
          Exercise 3
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeExerciseTab === "ex4"}
          className={activeExerciseTab === "ex4" ? "exercise-tab active" : "exercise-tab"}
          onClick={() => setActiveExerciseTab("ex4")}
        >
          Exercise 4 (Cards)
        </button>
      </div>

      {/* Exercise 1 */}
      {activeExerciseTab === "ex1" && (
        <div className="exercise">
          <h3>Exercise 1: Predict the next step</h3>
          <p>
            Bubble Sort is currently comparing indices{" "}
            <strong>{predictScenario.compareIndex}</strong> and{" "}
            <strong>{predictScenario.compareIndex + 1}</strong> in this array:
          </p>
          <p>
            Current array: <code>{JSON.stringify(predictScenario.baseArray)}</code>
          </p>
          <p>What will the array look like after this step?</p>

          <div className="exercise-options">
            {/* Multiple-choice answer options for predicting the next Bubble Sort step */}
            {predictScenario.options.map((opt, idx) => (
              <button
                key={idx}
                className={
                  "exercise-option" +
                  (predictAnswerIndex === idx ? " exercise-option-selected" : "")
                }
                onClick={() => handlePredictOptionClick(idx)}
              >
                {JSON.stringify(opt)}
              </button>
            ))}
          </div>

          <div className="exercise-footer">
            {predictFeedback && <div className="feedback-text">{predictFeedback}</div>}
            <button className="btn-ghost" onClick={handlePredictNewScenario}>
              New scenario
            </button>
          </div>
        </div>
      )}

      {/* Exercise 2 */}
      {activeExerciseTab === "ex2" && (
        <div className="exercise">
          <h3>Exercise 2: Be the Bubble Sort algorithm</h3>
          <p>
            You’re the algorithm! You may only swap <strong>neighboring</strong> cards. Try
            to sort the array in ascending order.
          </p>

          {/* Clickable number cards used for manually simulating neighbour swaps */}
          <div className="card-row">
            {manualArray.map((v, i) => (
              <button
                key={i}
                className={
                  "number-card" + (manualSelectedIndex === i ? " number-card-selected" : "")
                }
                onClick={() => handleManualCardClick(i)}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="exercise-footer">
            <span>Swaps so far: {manualSwaps}</span>
            <button className="btn-ghost" onClick={handleManualReset}>
              Reset
            </button>
          </div>

          {manualMessage && <div className="feedback-text">{manualMessage}</div>}
        </div>
      )}

      {/* Exercise 3 */}
      {activeExerciseTab === "ex3" && (
        <div className="exercise">
          <h3>Exercise 3: Spot the Bubble Sort code</h3>
          <p>Which of the following code snippets is Bubble Sort?</p>
          <SpotBubbleSort onComplete={onEx3Done} />
        </div>
      )}

      {/* Exercise 4 */}
      {activeExerciseTab === "ex4" && (
        <div className="exercise" id="card-sort-exercise">
          <h3>Exercise 4: Sort a hand of cards</h3>
          <p>
            Imagine you are holding a messy hand of playing cards. Bubble Sort works by
            repeatedly comparing neighbouring cards and swapping them if they are in the
            wrong order. Use only neighbour swaps to sort this hand from <strong>2</strong>{" "}
            up to <strong>A</strong>.
          </p>
          {/* Card-based Bubble Sort activity using suit and rank ordering rules */}
          <CardSortExercise onComplete={onEx4Done} />
        </div>
      )}
    </>
  );
};

export default BubbleSortExercise;
