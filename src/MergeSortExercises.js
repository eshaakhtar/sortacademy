// src/MergeSortExercises.js
import React, { useEffect, useMemo, useState } from "react";

/* ============================================================
  Utilities
============================================================ */

// Generate a random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Convert a time string like "09:30" into total minutes
// This makes time comparison easier for sorting/merging logic
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Convert total minutes back into HH:MM format
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Perform a stable merge on two arrays of objects using a key function
// If two values tie, the LEFT item is taken first to preserve stability
function stableMergeObjects(left, right, keyFn) {
  const out = [];
  let i = 0,
    j = 0;
  while (i < left.length && j < right.length) {
    if (keyFn(left[i]) <= keyFn(right[j])) out.push(left[i++]); // LEFT on ties => stable
    else out.push(right[j++]);
  }
  // Add any remaining items from the left half
  while (i < left.length) out.push(left[i++]);
  
  // Add any remaining items from the right half
  while (j < right.length) out.push(right[j++]);
  return out;
}

// Check whether an array is sorted in ascending order
function isSortedAsc(arr) {
  for (let i = 1; i < arr.length; i++) if (arr[i - 1] > arr[i]) return false;
  return true;
}

/* ============================================================
  EX1: Merge Trainer (Difficulty + Explain-on-wrong + Progressive reveal)
============================================================ */

// Difficulty settings for Exercise 1
const EX1_LEVELS = {
  easy: { len: 4, min: 1, max: 20, allowDupes: false, progressiveReveal: false },
  medium: { len: 6, min: -5, max: 30, allowDupes: true, progressiveReveal: false },
  hard: { len: 8, min: -20, max: 55, allowDupes: true, progressiveReveal: true },
};

// Create a sorted list of objects for merging practice
// Each object includes a value and an ID to help distinguish duplicates
function makeSortedItems(len, min, max, allowDupes, sideLabel = "L") {
  const values = Array.from({ length: len }, () => randInt(min, max)).sort((a, b) => a - b);

  // If duplicates are not allowed, adjust equal neighbouring values
  if (!allowDupes) {
    for (let i = 1; i < values.length; i++) {
      if (values[i] === values[i - 1]) values[i] += 1;
    }
    values.sort((a, b) => a - b);
  }

  // IDs make duplicates visible + help stability reasoning
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return values.map((v, i) => ({
    value: v,
    id: `${sideLabel}${letters[i] || `#${i + 1}`}`,
  }));
}

/* ============================================================
  EX2: Delivery Route Scheduler (lateness cost + streak feedback)
============================================================ */

// Pool of stop names used when generating route data
const STOP_NAMES = [
  "Baker St",
  "Oxford St",
  "King's Cross",
  "Waterloo",
  "Camden Town",
  "Soho",
  "Shoreditch",
  "Greenwich",
  "Notting Hill",
  "Covent Garden",
  "Paddington",
  "London Bridge",
];

// Create a sorted list of delivery stops for one driver
// Each stop is later than the previous one, so the route is already sorted by time
function makeSortedStops(len, startTime, whoLabel) {
  let cur = timeToMinutes(startTime);
  const used = new Set();
  const out = [];

  for (let i = 0; i < len; i++) {
    let name = STOP_NAMES[randInt(0, STOP_NAMES.length - 1)];
    let guard = 0;

     // Avoid repeating the same stop name in one route
    while (used.has(name) && guard++ < 30) name = STOP_NAMES[randInt(0, STOP_NAMES.length - 1)];
    used.add(name);

     // Add a random travel gap between stops (between 8 and 20 minutes)
    cur += randInt(8, 20);
    out.push({
      time: minutesToTime(cur),
      minutes: cur,
      stop: name,
      who: whoLabel,
    });
  }

  return out.sort((a, b) => a.minutes - b.minutes);
}

/* ============================================================
  EX3: Recursion Tree Split (Difficulty modes + Predict-the-mid quiz)
============================================================ */
// Difficulty settings for Exercise 3
const EX3_LEVELS = {
  easy: { n: 8, highlightEligible: true },
  medium: { n: 10, highlightEligible: true },
  hard: { n: 12, highlightEligible: false },
};

// Generate an unsorted array for the recursion tree exercise
function makeUnsortedArray(n) {
  const a = Array.from({ length: n }, () => randInt(1, 25));
  // If by chance it is already sorted, force it to become unsorted
  if (isSortedAsc(a)) a[0] += 9;
  return a;
}

// Split a node's values into left and right halves using the correct mid index
function splitRange(values, l, r) {
  const mid = Math.floor((l + r) / 2);
  const left = values.slice(0, mid - l + 1);
  const right = values.slice(mid - l + 1);
  return { mid, left, right };
}

/* ============================================================
  EX4: Stability (Switch scenarios + Challenge mode)
============================================================ */
// Different real-world scenarios used to explain stability

const EX4_SCENARIOS = {
  exams: {
    title: "Exam papers",
    emoji: "📄",
    metaEmoji: "✏️",
    halves: () => {
      const leftScores = [55, 70, 70, 84];
      const rightScores = [60, 70, 75, 84];
      let order = 1;
      return {
        left: leftScores.map((s, idx) => ({ id: `L${idx + 1}`, side: "L", value: s, order: order++ })),
        right: rightScores.map((s, idx) => ({ id: `R${idx + 1}`, side: "R", value: s, order: order++ })),
      };
    },
    ruleText: "School policy: if scores tie, keep earlier submission first (LEFT on ties).",
  },

  tickets: {
    title: "Support tickets",
    emoji: "🎫",
    metaEmoji: "🕒",
    halves: () => {
      const leftSev = [1, 2, 2, 4];
      const rightSev = [1, 2, 3, 4];
      let order = 1;
      return {
        left: leftSev.map((s, idx) => ({ id: `L${idx + 1}`, side: "L", value: s, order: order++ })),
        right: rightSev.map((s, idx) => ({ id: `R${idx + 1}`, side: "R", value: s, order: order++ })),
      };
    },
    ruleText: "Helpdesk policy: if severity ties, handle older tickets first (LEFT on ties).",
  },

  race: {
    title: "Race finishers",
    emoji: "🏁",
    metaEmoji: "⏱️",
    halves: () => {
      const leftTimes = [128, 140, 140, 154];
      const rightTimes = [132, 140, 149, 154];
      let bib = 101;
      return {
        left: leftTimes.map((t, idx) => ({ id: `L${idx + 1}`, side: "L", value: t, order: bib++ })),
        right: rightTimes.map((t, idx) => ({ id: `R${idx + 1}`, side: "R", value: t, order: bib++ })),
      };
    },
    ruleText: "Race policy: ties keep bib/order for consistent results (LEFT on ties).",
  },
};

  // Track which exercise tab is currently open and handle completion callback
  export default function MergeSortExercises({ onComplete }) {
  const [activeTab, setActiveTab] = useState("ex1");
  // Helper for notifying the parent component when an exercise is completed
  const markComplete = (key) => typeof onComplete === "function" && onComplete(key);

  /* ============================================================
    Small UI helper (no CSS required)
  ============================================================ */
  // Shared inline style for small pill badges

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
    EX1 state (completion based on merged length)
  ============================================================ */

  // Selected difficulty level
  const [ex1Level, setEx1Level] = useState("easy");
  const ex1Cfg = EX1_LEVELS[ex1Level];

   // Left and right sorted lists for merge practice
  const [ex1Left, setEx1Left] = useState(() =>
    makeSortedItems(EX1_LEVELS.easy.len, EX1_LEVELS.easy.min, EX1_LEVELS.easy.max, EX1_LEVELS.easy.allowDupes, "L")
  );
  const [ex1Right, setEx1Right] = useState(() =>
    makeSortedItems(EX1_LEVELS.easy.len, EX1_LEVELS.easy.min, EX1_LEVELS.easy.max, EX1_LEVELS.easy.allowDupes, "R")
  );

  // User's merged output and feedback
  const [ex1Merged, setEx1Merged] = useState([]);
  const [ex1Msg, setEx1Msg] = useState("Compare the two fronts and pick the smaller next.");
  const [ex1Completed, setEx1Completed] = useState(false);

  // Simple performance tracking
  const [ex1Comparisons, setEx1Comparisons] = useState(0);
  const [ex1Moves, setEx1Moves] = useState(0);
  const [ex1Mistakes, setEx1Mistakes] = useState(0);

  // Total number of items to merge
  const ex1Total = ex1Cfg.len * 2;

  // Reset Exercise 1 with a fresh set of sorted lists
  const ex1Reset = (level = ex1Level) => {
    const cfg = EX1_LEVELS[level];

    setEx1Completed(false);
    setEx1Merged([]);
    setEx1Comparisons(0);
    setEx1Moves(0);
    setEx1Mistakes(0);

    setEx1Left(makeSortedItems(cfg.len, cfg.min, cfg.max, cfg.allowDupes, "L"));
    setEx1Right(makeSortedItems(cfg.len, cfg.min, cfg.max, cfg.allowDupes, "R"));
    setEx1Msg("New lists 🔒 They are already sorted — your job is to merge.");
  };

   // When difficulty changes, reset the exercise
  useEffect(() => {
    ex1Reset(ex1Level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex1Level]);

   // Current front items from each list
  const ex1FrontL = ex1Left[0] || null;
  const ex1FrontR = ex1Right[0] || null;

  // Work out which side is the correct next pick
  const ex1CorrectSide = useMemo(() => {
    if (!ex1FrontL && !ex1FrontR) return null;
    if (!ex1FrontL) return "R";
    if (!ex1FrontR) return "L";
    return ex1FrontL.value <= ex1FrontR.value ? "L" : "R"; // stable on ties
  }, [ex1FrontL, ex1FrontR]);

    // Create explanation text for correct reasoning
  const ex1ExplainText = useMemo(() => {
    if (!ex1CorrectSide) return "";
    if (!ex1FrontL) return `Left is empty, so you must take RIGHT (${ex1FrontR.value}).`;
    if (!ex1FrontR) return `Right is empty, so you must take LEFT (${ex1FrontL.value}).`;
    const L = ex1FrontL.value;
    const R = ex1FrontR.value;
    // Handle the user picking from the left or right list
    if (L < R) return `Because ${L} < ${R}, the next item must come from LEFT.`;
    if (L > R) return `Because ${R} < ${L}, the next item must come from RIGHT.`;
    return `Tie (${L} = ${R}) → take LEFT to keep the merge stable.`;
  }, [ex1CorrectSide, ex1FrontL, ex1FrontR]);

  const ex1Pick = (side) => {
    if (ex1Completed || !ex1CorrectSide) return;

    if (ex1FrontL && ex1FrontR) setEx1Comparisons((c) => c + 1);

    if (side !== ex1CorrectSide) {
      setEx1Mistakes((m) => m + 1);
      setEx1Msg(`❌ Not quite. ${ex1ExplainText}`);
      return;
    }

    setEx1Moves((m) => m + 1);

    // Move the correct front item into the merged result
    if (side === "L") {
      setEx1Merged((m) => [...m, ex1Left[0]]);
      setEx1Left((a) => a.slice(1));
    } else {
      setEx1Merged((m) => [...m, ex1Right[0]]);
      setEx1Right((a) => a.slice(1));
    }

    setEx1Msg("✅ Correct. Keep merging by comparing the two fronts.");
  };

  // Mark exercise complete once all items have been merged
  useEffect(() => {
    if (!ex1Completed && ex1Merged.length === ex1Total) {
      setEx1Completed(true);
      setEx1Msg("🎉 Perfect merge! This is the core operation inside Merge Sort.");
      markComplete("ex1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex1Merged.length, ex1Total]);

  /* ============================================================
    EX2 state
  ============================================================ */
  // Two sorted routes to merge into one master timeline
  const [ex2Left, setEx2Left] = useState(() => makeSortedStops(5, "09:00", "🚗 Driver A"));
  const [ex2Right, setEx2Right] = useState(() => makeSortedStops(5, "09:05", "🚙 Driver B"));
  const [ex2Timeline, setEx2Timeline] = useState([]);
  const [ex2Msg, setEx2Msg] = useState("Pick the earliest next delivery to keep the schedule on time.");
  const [ex2Completed, setEx2Completed] = useState(false);

  // Gamified progress tracking
  const [ex2DelayMinutes, setEx2DelayMinutes] = useState(0);
  const [ex2Streak, setEx2Streak] = useState(0);
  const [ex2BestStreak, setEx2BestStreak] = useState(0);
  const [ex2Mistakes, setEx2Mistakes] = useState(0);

  // Reset Exercise 2 with new routes
  const ex2Reset = () => {
    setEx2Left(makeSortedStops(5, "09:00", "🚗 Driver A"));
    setEx2Right(makeSortedStops(5, "09:05", "🚙 Driver B"));
    setEx2Timeline([]);
    setEx2Msg("New routes ✅ Keep choosing the earliest next stop.");
    setEx2Completed(false);
    setEx2DelayMinutes(0);
    setEx2Streak(0);
    setEx2BestStreak(0);
    setEx2Mistakes(0);
  };

  // Current candidate stops
  const ex2FrontL = ex2Left[0] || null;
  const ex2FrontR = ex2Right[0] || null;

   // Determine which route has the earliest next stop
  const ex2CorrectSide = useMemo(() => {
    if (!ex2FrontL && !ex2FrontR) return null;
    if (!ex2FrontL) return "R";
    if (!ex2FrontR) return "L";
    return ex2FrontL.minutes <= ex2FrontR.minutes ? "L" : "R";
  }, [ex2FrontL, ex2FrontR]);

  // Show a preview of the next candidates from both drivers
  const ex2CandidatePreview = useMemo(() => {
    const a = ex2FrontL ? `${ex2FrontL.time} · ${ex2FrontL.stop}` : "—";
    const b = ex2FrontR ? `${ex2FrontR.time} · ${ex2FrontR.stop}` : "—";
    return `Next candidates → A: ${a} | B: ${b}`;
  }, [ex2FrontL, ex2FrontR]);

    // Handle route choice
  const ex2Pick = (side) => {
    if (ex2Completed || !ex2CorrectSide) return;

     // Wrong choice adds delay and breaks the streak
    if (side !== ex2CorrectSide) {
      setEx2Mistakes((m) => m + 1);
      setEx2DelayMinutes((d) => d + 5);
      setEx2Streak(0);
      setEx2Msg("⚠️ Wrong pick → schedule slips. Always take the earliest next stop.");
      return;
    }

    // Correct choice slightly reduces delay and improves streak
    setEx2DelayMinutes((d) => Math.max(0, d - 1));
    setEx2Streak((s) => {
      const next = s + 1;
      setEx2BestStreak((best) => Math.max(best, next));
      return next;
    });

    if (side === "L") {
      setEx2Timeline((t) => [...t, ex2Left[0]]);
      setEx2Left((a) => a.slice(1));
    } else {
      setEx2Timeline((t) => [...t, ex2Right[0]]);
      setEx2Right((a) => a.slice(1));
    }

    setEx2Msg("✅ On time. Keep merging the two sorted routes.");
  };

  // Mark Exercise 2 complete once both routes are fully merged
  useEffect(() => {
    if (!ex2Completed && ex2Left.length === 0 && ex2Right.length === 0) {
      setEx2Completed(true);
      setEx2Msg("🎉 Master route complete! You merged two sorted schedules.");
      markComplete("ex2");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex2Left, ex2Right]);

  /* ============================================================
    EX3 state (UPDATED: mid-lock stays unlocked once solved for that node)
  ============================================================ */
   // Difficulty and config for recursion tree
  const [ex3Level, setEx3Level] = useState("easy");
  const ex3Cfg = EX3_LEVELS[ex3Level];

  // Tree nodes, starting with one root node
  const [ex3Nodes, setEx3Nodes] = useState(() => {
    const arr = makeUnsortedArray(EX3_LEVELS.easy.n);
    return [{ id: "root", values: arr, depth: 0, split: false, parent: null, range: { l: 0, r: arr.length - 1 } }];
  });

   // Selected node and exercise state
  const [ex3SelectedId, setEx3SelectedId] = useState("root");
  const [ex3Msg, setEx3Msg] = useState("Select a node and split it into halves until all leaves are size 1.");
  const [ex3Completed, setEx3Completed] = useState(false);

  // Mid prediction input/lock state
  const [ex3MidChoice, setEx3MidChoice] = useState("");
  const [ex3MidLocked, setEx3MidLocked] = useState(false);

  // remember which nodes have had mid solved (so selecting again doesn't relock)
  const [ex3SolvedMidIds, setEx3SolvedMidIds] = useState(() => new Set());

  // Reset Exercise 3 to a new unsorted root array
  const ex3Reset = (level = ex3Level) => {
    const cfg = EX3_LEVELS[level];
    const arr = makeUnsortedArray(cfg.n);
    setEx3Nodes([{ id: "root", values: arr, depth: 0, split: false, parent: null, range: { l: 0, r: arr.length - 1 } }]);
    setEx3SelectedId("root");
    setEx3Msg("Select a node and split it into halves until all leaves are size 1.");
    setEx3Completed(false);
    setEx3MidChoice("");
    setEx3MidLocked(false);
    setEx3SolvedMidIds(new Set());
  };

   // Reset when difficulty changes
  useEffect(() => {
    ex3Reset(ex3Level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex3Level]);

  // Find the currently selected node
  const ex3SelectedNode = useMemo(() => ex3Nodes.find((n) => n.id === ex3SelectedId) || null, [ex3Nodes, ex3SelectedId]);

  // Find all nodes that can still be split
  const ex3EligibleIds = useMemo(() => new Set(ex3Nodes.filter((n) => !n.split && n.values.length > 1).map((n) => n.id)), [ex3Nodes]);

  // Correct mid for the selected node's range
  const ex3CorrectMid = useMemo(() => {
    if (!ex3SelectedNode) return null;
    const { l, r } = ex3SelectedNode.range;
    return Math.floor((l + r) / 2);
  }, [ex3SelectedNode]);

  // Update mid-lock behaviour whenever the selected node changes
  useEffect(() => {
    if (!ex3SelectedNode) return;

    // Base cases or already split nodes do not need mid prediction
    if (ex3SelectedNode.values.length <= 1 || ex3SelectedNode.split) {
      setEx3MidChoice("");
      setEx3MidLocked(false);
      return;
    }

    setEx3MidChoice("");

    // Only lock if the user has not yet solved the mid for this node
    const alreadySolved = ex3SolvedMidIds.has(ex3SelectedNode.id);
    setEx3MidLocked(!alreadySolved);
  }, [ex3SelectedId, ex3SelectedNode, ex3SolvedMidIds]);

   // Check submitted mid guess
  const ex3SubmitMid = () => {
    if (!ex3SelectedNode || ex3CorrectMid == null) return;

    const guess = Number(ex3MidChoice);
    if (Number.isNaN(guess)) {
      setEx3Msg("Type a mid index number (e.g., 3).");
      return;
    }
    if (guess !== ex3CorrectMid) {
      setEx3Msg(`❌ Not quite. For range [${ex3SelectedNode.range.l}..${ex3SelectedNode.range.r}], mid is ${ex3CorrectMid}. Try again.`);
      return;
    }

    // Store solved node ID so this node stays unlocked in future
    setEx3SolvedMidIds((prev) => {
      const next = new Set(prev);
      next.add(ex3SelectedNode.id);
      return next;
    });

    setEx3MidLocked(false);
    setEx3Msg(`✅ Correct! mid = ${ex3CorrectMid}. Now split this node.`);
  };

  // Split the selected node into left/right child nodes
  const ex3SplitSelected = () => {
    if (ex3Completed || !ex3SelectedNode) return;

    const node = ex3SelectedNode;

    if (node.split) {
      setEx3Msg("This node is already split. Pick an unsplit node.");
      return;
    }
    if (node.values.length <= 1) {
      setEx3Msg("Base case: size 1. Pick a larger node to split.");
      return;
    }
    if (ex3MidLocked) {
      setEx3Msg("🔒 Predict the mid index first, then split.");
      return;
    }

    const { l, r } = node.range;
    const { mid, left, right } = splitRange(node.values, l, r);

    const leftId = `${node.id}-L`;
    const rightId = `${node.id}-R`;

    setEx3Nodes((prev) => {
      const next = prev.map((n) => (n.id === node.id ? { ...n, split: true } : n));
      next.push({ id: leftId, values: left, depth: node.depth + 1, split: false, parent: node.id, range: { l, r: mid } });
      next.push({ id: rightId, values: right, depth: node.depth + 1, split: false, parent: node.id, range: { l: mid + 1, r } });
      return next;
    });

    setEx3Msg(`✅ Split created: ${leftId} and ${rightId}. Keep splitting.`);
  };

  // Complete Exercise 3 when all nodes are either leaves or already split
  useEffect(() => {
    const allDone = ex3Nodes.every((n) => n.values.length <= 1 || n.split);
    if (allDone && !ex3Completed) {
      setEx3Completed(true);
      setEx3Msg("🎉 Recursion tree complete! Every leaf is size 1.");
      markComplete("ex3");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex3Nodes]);

  // Group nodes by depth so the tree can be displayed level by level
  const ex3ByDepth = useMemo(() => {
    const map = new Map();
    ex3Nodes.forEach((n) => {
      if (!map.has(n.depth)) map.set(n.depth, []);
      map.get(n.depth).push(n);
    });
    const depths = Array.from(map.keys()).sort((a, b) => a - b);
    return depths.map((d) => ({ depth: d, nodes: map.get(d) }));
  }, [ex3Nodes]);

  // Count current leaves and target number of leaves
  const ex3LeafCount = useMemo(() => ex3Nodes.filter((n) => n.values.length <= 1).length, [ex3Nodes]);
  const ex3TargetLeaves = useMemo(() => ex3Nodes.find((n) => n.id === "root")?.values.length ?? 0, [ex3Nodes]);

  /* ============================================================
    EX4 state (UPDATED: challenge toggle message uses fresh scenario lookup)
  ============================================================ */

  // Selected real-world scenario for stability practice
  const [ex4ScenarioKey, setEx4ScenarioKey] = useState("exams");
  const scenario = EX4_SCENARIOS[ex4ScenarioKey];

  // Base halves and current merge state
  const [{ left: ex4LeftBase, right: ex4RightBase }, setEx4Base] = useState(() => scenario.halves());
  const [ex4Left, setEx4Left] = useState(() => [...ex4LeftBase]);
  const [ex4Right, setEx4Right] = useState(() => [...ex4RightBase]);
  const [ex4Merged, setEx4Merged] = useState([]);

  // Store expected stable order for validation/reference
  const [ex4ExpectedIds, setEx4ExpectedIds] = useState(() =>
    stableMergeObjects(ex4LeftBase, ex4RightBase, (x) => x.value).map((x) => x.id)
  );
  const [ex4Msg, setEx4Msg] = useState(scenario.ruleText);
  const [ex4Completed, setEx4Completed] = useState(false);

  // Challenge mode tracking
  const [ex4Mistakes, setEx4Mistakes] = useState(0);
  const [ex4ChallengeMode, setEx4ChallengeMode] = useState(false);
  const [ex4ChallengeFailed, setEx4ChallengeFailed] = useState(false);

  // Initialise or reset Exercise 4 from the chosen scenario
  const ex4InitFromScenario = (key = ex4ScenarioKey) => {
    const sc = EX4_SCENARIOS[key];
    const base = sc.halves();

    setEx4Base(base);
    setEx4Left([...base.left]);
    setEx4Right([...base.right]);
    setEx4Merged([]);

    setEx4ExpectedIds(stableMergeObjects(base.left, base.right, (x) => x.value).map((x) => x.id));

    setEx4Msg(sc.ruleText);
    setEx4Completed(false);
    setEx4Mistakes(0);
    setEx4ChallengeFailed(false);
  };

   // Rebuild the exercise whenever the scenario changes
  useEffect(() => {
    ex4InitFromScenario(ex4ScenarioKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex4ScenarioKey]);

  // Simple reset wrapper
  const ex4Reset = () => ex4InitFromScenario(ex4ScenarioKey);

   // Current front items
  const ex4FrontL = ex4Left[0] || null;
  const ex4FrontR = ex4Right[0] || null;

  // Determine correct side, enforcing LEFT on ties for stability
  const ex4CorrectSide = useMemo(() => {
    if (!ex4FrontL && !ex4FrontR) return null;
    if (!ex4FrontL) return "R";
    if (!ex4FrontR) return "L";
    if (ex4FrontL.value < ex4FrontR.value) return "L";
    if (ex4FrontL.value > ex4FrontR.value) return "R";
    return "L";
  }, [ex4FrontL, ex4FrontR]);

   // Handle pick for Exercise 4
  const ex4Pick = (side) => {
    if (ex4Completed || ex4ChallengeFailed || !ex4CorrectSide) return;

    // Wrong pick
    if (side !== ex4CorrectSide) {
      setEx4Mistakes((m) => m + 1);

       // In challenge mode, one mistake ends the attempt
      if (ex4ChallengeMode) {
        setEx4ChallengeFailed(true);
        setEx4Msg("❌ Challenge failed! One mistake ends the run. Reset and try again (LEFT on ties).");
        return;
      }

      setEx4Msg("❌ Stability broken. When values tie, pick LEFT first.");
      return;
    }

    // Correct pick: move item into merged output 
    if (side === "L") {
      setEx4Merged((m) => [...m, ex4Left[0]]);
      setEx4Left((a) => a.slice(1));
    } else {
      setEx4Merged((m) => [...m, ex4Right[0]]);
      setEx4Right((a) => a.slice(1));
    }

    setEx4Msg("✅ Correct. Keep merging stably (LEFT on ties).");
  };

  // Check final merged order once all items are used
  useEffect(() => {
    const total = ex4LeftBase.length + ex4RightBase.length;
    if (!ex4Completed && ex4Merged.length === total) {
      const actualIds = ex4Merged.map((x) => x.id);
      const ok = actualIds.join("|") === ex4ExpectedIds.join("|");

      if (ok && (!ex4ChallengeMode || (ex4ChallengeMode && ex4Mistakes === 0 && !ex4ChallengeFailed))) {
        setEx4Completed(true);
        setEx4Msg("🎉 Stable merge complete!");
        markComplete("ex4");
      } else if (!ok) {
        setEx4Msg("❌ Final order wasn’t stable. Reset and try again (LEFT on ties).");
      } else {
        setEx4Msg("✅ Stable order, but Challenge Mode requires 0 mistakes. Reset and try again!");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex4Merged]);

  // Build the expected stable sequence as full objects for display
  const ex4Expected = useMemo(() => {
    const map = new Map([...ex4LeftBase, ...ex4RightBase].map((x) => [x.id, x]));
    return ex4ExpectedIds.map((id) => map.get(id)).filter(Boolean);
  }, [ex4ExpectedIds, ex4LeftBase, ex4RightBase]);

  /* ============================================================
    Tabs
  ============================================================ */

  // Tab definitions for the four exercises
  const tabs = [
    { id: "ex1", title: "Exercise 1" },
    { id: "ex2", title: "Exercise 2" },
    { id: "ex3", title: "Exercise 3" },
    { id: "ex4", title: "Exercise 4" },
  ];

  return (
    <section className="lesson-section">
      <h2>Interactive exercises</h2>

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
          <h3>Exercise 1: Merge Trainer 🧩</h3>
          <p>
            The lists are <strong>already sorted 🔒</strong>. Only pick the <strong>front</strong> item of Left or Right.
            On <strong>Hard</strong>, you only see the front item (progressive reveal).
          </p>

          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div className="option-group" style={{ gap: 10 }}>
              <span className="option-label">Difficulty:</span>
               {/* Difficulty selection buttons */}
              {Object.keys(EX1_LEVELS).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={"btn-icon" + (ex1Level === lvl ? " btn-selected" : "")}
                  onClick={() => setEx1Level(lvl)}
                >
                  {lvl}
                </button>
              ))}
                {/* Stats display */}
              <span style={pillStyle}>
                comparisons <strong style={{ color: "var(--text)" }}>{ex1Comparisons}</strong>
              </span>
              <span style={pillStyle}>
                moves <strong style={{ color: "var(--text)" }}>{ex1Moves}</strong>
              </span>
              <span style={pillStyle}>
                mistakes{" "}
                <strong style={{ color: ex1Mistakes ? "var(--danger)" : "var(--text)" }}>{ex1Mistakes}</strong>
              </span>
            </div>

            <span>
              Status: <strong>{ex1Completed ? "Completed ✅" : "Merging…"}</strong>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
             {/* Left list */}
            <div className="card-exercise">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Left list (sorted)</div>
              <div className="card-row">
                {ex1Left.map((it, idx) => {
                  const isFront = idx === 0;
                  const hidden = ex1Cfg.progressiveReveal && !isFront;

                 // On hard mode, only reveal the front item
                  if (hidden) return null;

                  return (
                    <button
                      key={it.id}
                      className={"number-card" + (isFront ? " number-card-selected" : "")}
                      onClick={() => ex1Pick("L")}
                      disabled={ex1Completed || !isFront}
                      style={{ opacity: isFront ? 1 : 0.65 }}
                      aria-label={isFront ? `Pick left front ${it.value} ${it.id}` : `Left value ${it.value} ${it.id}`}
                    >
                      {it.value} <span style={{ opacity: 0.75 }}>({it.id})</span>
                    </button>
                  );
                })}

                {/* Show how many values remain hidden in hard mode */}
                {ex1Cfg.progressiveReveal && ex1Left.length > 1 && (
                  <span style={{ ...pillStyle, alignSelf: "center" }}>+{ex1Left.length - 1} hidden</span>
                )}
              </div>
            </div>

            {/* Right list */}
            <div className="card-exercise">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Right list (sorted)</div>
              <div className="card-row">
                {ex1Right.map((it, idx) => {
                  const isFront = idx === 0;
                  const hidden = ex1Cfg.progressiveReveal && !isFront;
                  if (hidden) return null;
                  return (
                    <button
                      key={it.id}
                      className={"number-card" + (isFront ? " number-card-selected" : "")}
                      onClick={() => ex1Pick("R")}
                      disabled={ex1Completed || !isFront}
                      style={{ opacity: isFront ? 1 : 0.65 }}
                      aria-label={isFront ? `Pick right front ${it.value} ${it.id}` : `Right value ${it.value} ${it.id}`}
                    >
                      {it.value} <span style={{ opacity: 0.75 }}>({it.id})</span>
                    </button>
                  );
                })}
                {ex1Cfg.progressiveReveal && ex1Right.length > 1 && (
                  <span style={{ ...pillStyle, alignSelf: "center" }}>+{ex1Right.length - 1} hidden</span>
                )}
              </div>
            </div>
          </div>
          
            {/* Merged output display */}
          <div className="card-exercise" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              Merged output ({ex1Merged.length}/{ex1Total})
            </div>
            <div className="card-row">
              {ex1Merged.length === 0 ? (
                <span style={{ color: "var(--muted)" }}>Start merging by choosing a front item…</span>
              ) : (
                ex1Merged.map((it) => (
                  <span key={`m-${it.id}-${it.value}`} className="number-card" style={{ cursor: "default" }}>
                    {it.value} <span style={{ opacity: 0.75 }}>({it.id})</span>
                  </span>
                ))
              )}
            </div>
          </div>
          
           {/* Reset button */}
          <div className="exercise-footer" style={{ justifyContent: "flex-start", gap: 10 }}>
            <button className="btn-ghost" onClick={() => ex1Reset(ex1Level)}>
              New lists
            </button>
          </div>

          {/* Live feedback */}
          {ex1Msg && (
            <div className="feedback-text" aria-live="polite">
              {ex1Msg}
            </div>
          )}
        </div>
      )}

      {/* ================= EX2 ================= */}
      {activeTab === "ex2" && (
        <div id="panel-ex2" role="tabpanel" aria-labelledby="tab-ex2" className="exercise">
          <h3>Exercise 2: Delivery Route Scheduler 🚗</h3>
          <p>
            Two drivers have routes already sorted by time. Merge them into one master route by always choosing the{" "}
            <strong>earliest next stop</strong>.
          </p>

          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ color: "var(--muted)" }}>
              <div>{ex2CandidatePreview}</div>

               {/* Exercise stats */}
              <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={pillStyle}>
                  delay{" "}
                  <strong style={{ color: ex2DelayMinutes ? "var(--danger)" : "var(--text)" }}>{ex2DelayMinutes}</strong>{" "}
                  min
                </span>
                <span style={pillStyle}>
                  streak 🔥 <strong style={{ color: "var(--text)" }}>{ex2Streak}</strong> (best {ex2BestStreak})
                </span>
                <span style={pillStyle}>
                  mistakes{" "}
                  <strong style={{ color: ex2Mistakes ? "var(--danger)" : "var(--text)" }}>{ex2Mistakes}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                Status: <strong>{ex2Completed ? "Completed ✅" : "Scheduling…"}</strong>
              </span>
              <button className="btn-ghost" onClick={ex2Reset}>
                New routes
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
             {/* Driver A */}
            <div className="card-exercise">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>🚗 Driver A (sorted)</div>
              <div className="card-row">
                {ex2Left.map((s, idx) => {
                  const isFront = idx === 0;
                  return (
                    <button
                      key={`${s.time}-${s.stop}`}
                      className={"number-card" + (isFront ? " number-card-selected" : "")}
                      onClick={() => ex2Pick("L")}
                      disabled={ex2Completed || !isFront}
                      style={{ opacity: isFront ? 1 : 0.55 }}
                    >
                      {s.time} <span style={{ opacity: 0.75 }}>· {s.stop}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card-exercise">
                {/* Driver B */}
              <div style={{ fontWeight: 800, marginBottom: 6 }}>🚙 Driver B (sorted)</div>
              <div className="card-row">
                {ex2Right.map((s, idx) => {
                  const isFront = idx === 0;
                  return (
                    <button
                      key={`${s.time}-${s.stop}`}
                      className={"number-card" + (isFront ? " number-card-selected" : "")}
                      onClick={() => ex2Pick("R")}
                      disabled={ex2Completed || !isFront}
                      style={{ opacity: isFront ? 1 : 0.55 }}
                    >
                      {s.time} <span style={{ opacity: 0.75 }}>· {s.stop}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card-exercise" style={{ marginTop: 12 }}>
            {/* Final merged route */}
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Master timeline</div>
            <div className="card-row" style={{ gap: 10 }}>
              {ex2Timeline.length === 0 ? (
                <span style={{ color: "var(--muted)" }}>Start picking the earliest stops…</span>
              ) : (
                ex2Timeline.map((s, idx) => (
                  <span key={`${s.time}-${s.stop}-${idx}`} className="number-card" style={{ cursor: "default" }}>
                    {s.time} <span style={{ opacity: 0.75 }}>· {s.stop} · {s.who}</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {ex2Msg && (
            <div className="feedback-text" aria-live="polite">
              {ex2Msg}
            </div>
          )}
        </div>
      )}

      {/* ================= EX3 ================= */}
      {activeTab === "ex3" && (
        <div id="panel-ex3" role="tabpanel" aria-labelledby="tab-ex3" className="exercise">
          <h3>Exercise 3: Recursion Tree Builder 🌳</h3>
          <p>
            Select a node and split it. Before splitting, predict the <strong>mid index</strong> for that node’s range.
            Difficulty changes the array size and whether eligible nodes are highlighted.
          </p>

          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div className="option-group" style={{ gap: 10 }}>
              <span className="option-label">Difficulty:</span>
              {/* Difficulty buttons */}
              {Object.keys(EX3_LEVELS).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={"btn-icon" + (ex3Level === lvl ? " btn-selected" : "")}
                  onClick={() => setEx3Level(lvl)}
                >
                  {lvl}
                </button>
              ))}
               {/* Leaf progress */}
              <span style={pillStyle}>
                leaves <strong style={{ color: "var(--text)" }}>{ex3LeafCount}</strong> / {ex3TargetLeaves}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                Status: <strong>{ex3Completed ? "Completed ✅" : "Splitting…"}</strong>
              </span>
              <button className="btn-ghost" onClick={() => ex3Reset(ex3Level)}>
                New tree
              </button>
            </div>
          </div>

          {/* Mid prediction card shown only for valid unsplit non-leaf nodes */}
          {ex3SelectedNode && ex3SelectedNode.values.length > 1 && !ex3SelectedNode.split && (
            <div className="card-exercise" style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Predict the mid index</div>
              <div style={{ color: "var(--muted)", marginBottom: 8 }}>
                Range [{ex3SelectedNode.range.l}..{ex3SelectedNode.range.r}] → what is mid?
              </div>

              <div className="card-row" style={{ alignItems: "center" }}>
                <input
                  type="text"
                  value={ex3MidChoice}
                  onChange={(e) => setEx3MidChoice(e.target.value)}
                  placeholder="e.g. 3"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: "var(--bg-soft)",
                    minWidth: 120,
                  }}
                />
                <button className="btn-secondary" onClick={ex3SubmitMid}>
                  Submit mid
                </button>
                
               {/* Lock status display */}
                {ex3MidLocked ? (
                  <span style={{ ...pillStyle, borderColor: "rgba(185, 28, 28, 0.35)" }}>🔒 split locked</span>
                ) : (
                  <span style={{ ...pillStyle, borderColor: "rgba(21, 128, 61, 0.35)" }}>✅ unlocked</span>
                )}
              </div>
            </div>
          )}

            {/* Tree display grouped by depth */}
          <div className="card-exercise" style={{ marginTop: 10 }}>
            {ex3ByDepth.map((group) => (
              <div key={group.depth} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Depth {group.depth}</div>

                <div className="card-row" style={{ gap: 10 }}>
                  {group.nodes.map((n) => {
                    const isSelected = n.id === ex3SelectedId;
                    const isLeaf = n.values.length <= 1;
                    const isEligible = ex3EligibleIds.has(n.id);
                    const showHighlight = ex3Cfg.highlightEligible && isEligible;

                    return (
                      <button
                        key={n.id}
                        className={"exercise-option" + (isSelected ? " exercise-option-selected" : "")}
                        onClick={() => setEx3SelectedId(n.id)}
                        style={{
                          borderRadius: 14,
                          padding: "8px 12px",
                          minWidth: 170,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          alignItems: "flex-start",
                          background: showHighlight ? "rgba(37, 99, 235, 0.08)" : undefined,
                          borderColor: showHighlight ? "rgba(37, 99, 235, 0.45)" : undefined,
                        }}
                      >
                         {/* Node label and range */}
                        <div style={{ fontWeight: 800 }}>
                          {n.id}{" "}
                          <span style={{ fontWeight: 600, color: "var(--muted)" }}>
                            [{n.range.l}..{n.range.r}]
                          </span>
                        </div>
                         {/* Values inside the node */}
                        <div style={{ color: "var(--muted)" }}>[{n.values.join(", ")}]</div>
                          {/* Node state */}
                        <div style={{ fontSize: "0.8rem", color: isLeaf || n.split ? "var(--success)" : "var(--muted)" }}>
                          {isLeaf ? "✅ base case" : n.split ? "✅ split" : isEligible ? "⏳ unsplit" : "—"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Split button */}
          <div className="exercise-footer" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={ex3SplitSelected} disabled={ex3Completed}>
              Split selected node
            </button>
          </div>

          {/* Live feedback */}
          {ex3Msg && (
            <div className="feedback-text" aria-live="polite">
              {ex3Msg}
            </div>
          )}
        </div>
      )}

      {/* ================= EX4 ================= */}
      {activeTab === "ex4" && (
        <div id="panel-ex4" role="tabpanel" aria-labelledby="tab-ex4" className="exercise">
          <h3>Exercise 4: Stability Challenge (switch scenarios) 🎯</h3>
          <p>
            Pick a scenario, then merge two sorted halves. The stability rule stays the same: if values tie, choose{" "}
            <strong>LEFT</strong> first.
          </p>

          <div className="exercise-footer" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div className="option-group" style={{ gap: 10, flexWrap: "wrap" }}>
              <span className="option-label">Scenario:</span>

              {/* Scenario buttons */}
              {Object.keys(EX4_SCENARIOS).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={"btn-icon" + (ex4ScenarioKey === key ? " btn-selected" : "")}
                  onClick={() => setEx4ScenarioKey(key)}
                >
                  {EX4_SCENARIOS[key].emoji} {EX4_SCENARIOS[key].title}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Challenge mode toggle */}
              <label className="option-group checkbox" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={ex4ChallengeMode}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const sc = EX4_SCENARIOS[ex4ScenarioKey]; // ✅ NEW: always use fresh lookup
                    setEx4ChallengeMode(checked);
                    setEx4ChallengeFailed(false);
                    setEx4Msg(checked ? "Challenge Mode: 0 mistakes allowed. LEFT on ties!" : sc.ruleText);
                  }}
                />
                Challenge mode (0 mistakes)
              </label>

               {/* Mistake counter */}
              <span style={pillStyle}>
                mistakes{" "}
                <strong style={{ color: ex4Mistakes ? "var(--danger)" : "var(--text)" }}>{ex4Mistakes}</strong>
              </span>

              <span>
                Status: <strong>{ex4Completed ? "Completed ✅" : ex4ChallengeFailed ? "Failed ❌" : "Merging…"}</strong>
              </span>

              <button className="btn-ghost" onClick={ex4Reset}>
                Reset
              </button>
            </div>
          </div>

           {/* Rule explanation */}
          <div className="card-exercise" style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              Rule: <span style={{ color: "var(--muted)", fontWeight: 600 }}>{scenario.ruleText}</span>
            </div>
            {ex4ChallengeMode && (
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                Challenge Mode tip: a single wrong tie decision ends the run.
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
            {/* Left half */}
            <div className="card-exercise">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>
                {scenario.emoji} Left half (sorted)
              </div>
              <div className="card-row">
                {ex4Left.map((x, idx) => {
                  const isFront = idx === 0;
                  return (
                    <button
                      key={x.id}
                      className={"number-card" + (isFront ? " number-card-selected" : "")}
                      onClick={() => ex4Pick("L")}
                      disabled={ex4Completed || ex4ChallengeFailed || !isFront}
                      style={{ opacity: isFront ? 1 : 0.55 }}
                    >
                      {scenario.emoji} {x.value} <span style={{ opacity: 0.75 }}>({x.id})</span>{" "}
                      <span style={{ opacity: 0.75 }}>
                        {scenario.metaEmoji} #{x.order}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right half */}
            <div className="card-exercise">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>
                {scenario.emoji} Right half (sorted)
              </div>
              <div className="card-row">
                {ex4Right.map((x, idx) => {
                  const isFront = idx === 0;
                  return (
                    <button
                      key={x.id}
                      className={"number-card" + (isFront ? " number-card-selected" : "")}
                      onClick={() => ex4Pick("R")}
                      disabled={ex4Completed || ex4ChallengeFailed || !isFront}
                      style={{ opacity: isFront ? 1 : 0.55 }}
                    >
                      {scenario.emoji} {x.value} <span style={{ opacity: 0.75 }}>({x.id})</span>{" "}
                      <span style={{ opacity: 0.75 }}>
                        {scenario.metaEmoji} #{x.order}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User's merged output */}
          <div className="card-exercise" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Merged output</div>
            <div className="card-row" style={{ gap: 10 }}>
              {ex4Merged.length === 0 ? (
                <span style={{ color: "var(--muted)" }}>Start merging… remember LEFT on ties.</span>
              ) : (
                ex4Merged.map((x) => (
                  <span key={x.id} className="number-card" style={{ cursor: "default" }}>
                    {scenario.emoji} {x.value} <span style={{ opacity: 0.75 }}>({x.id})</span>{" "}
                    <span style={{ opacity: 0.75 }}>
                      {scenario.metaEmoji} #{x.order}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>

           {/* Show expected stable order after successful completion */}
          {ex4Completed && (
            <div className="card-exercise" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Expected stable order (reference)</div>
              <div className="card-row" style={{ gap: 10 }}>
                {ex4Expected.map((x) => (
                  <span key={`exp-${x.id}`} className="number-card" style={{ cursor: "default" }}>
                    {scenario.emoji} {x.value} <span style={{ opacity: 0.75 }}>({x.id})</span>{" "}
                    <span style={{ opacity: 0.75 }}>
                      {scenario.metaEmoji} #{x.order}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
           {/* Live feedback */}
          {ex4Msg && (
            <div className="feedback-text" aria-live="polite">
              {ex4Msg}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
