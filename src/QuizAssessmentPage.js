// src/QuizAssessmentPage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGuestProfile, ProfileChip } from "./guestProfile";
import logo from "./assets/Logo.png";
import "./style.css"; // shared styles
import "./QuizAssessmentPage.css"; // specific styles for quiz lesson page

import { QUIZ_BANK, BADGES, lessonRoutes, MASTERY_TIERS } from "./quizBank";

// --------------------- Constants ---------------------
// Different screens/views shown on this page
const VIEW = {
  DASHBOARD: "dashboard",
  INSTRUCTIONS: "instructions",
  QUIZ: "quiz",
  RESULTS: "results",
  REVIEW: "review",
};

// localStorage keys for persistent quiz progress
const LS_BEST = "sat_quiz_bestScores"; 
const LS_BADGES = "sat_quiz_badges"; 
const LS_ATTEMPTS = "sat_quiz_attempts"; 
const LS_MASTERY = "sat_quiz_masteryTier";

// Badge IDs used specifically for guest profile rewards
const QUIZ_BADGES = {
  first: (quizId) => `badge_quiz_first_${quizId}`,
  perfect: (quizId) => `badge_quiz_perfect_${quizId}`,
  finalPass: "badge_quiz_final_pass80",
};

// per-quiz marks storage
const marksKey = (quizId) => `sat_quiz_marks_${quizId}`;

// --------------------- Helpers ---------------------
// Returns a shuffled copy of an array
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Restricts a number to stay within min/max bounds
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Converts seconds into mm:ss format for exam timer display
function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// Builds the initial answers object for a set of questions
// Order questions are pre-filled with a shuffled version of the items
function initAnswersForQuestions(questions) {
  const initial = {};
  for (const q of questions) {
    if (q.type === "order") {
      // start order questions shuffled instead of solved
      initial[q.id] = shuffle(q.items);
    }
  }
  return initial;
}

// Checks whether two arrays are exactly equal in order and value
function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Checks whether two arrays contain the same items regardless of order
function setEqual(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size !== B.size) return false;
  for (const x of A) if (!B.has(x)) return false;
  return true;
}

// Safely parse JSON from localStorage and return a fallback if invalid
function safeJSONParse(str, fallback) {
  try {
    const v = JSON.parse(str);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

// Returns the mastery tier object that matches a percentage score
function tierFromScore(pct) {
  let tier = MASTERY_TIERS[0];
  for (const t of MASTERY_TIERS) {
    if (pct >= t.min && t.level >= tier.level) tier = t;
  }
  return tier;
}

// Uses browser speech synthesis to read text aloud
function speakText(text) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  utter.lang = "en-GB";
  window.speechSynthesis.speak(utter);
  return true;
}

// Loads the saved flagged/review later marks for one quiz from localStorage
function loadMarks(quizId) {
  if (!quizId) return { flagged: {}, later: {} };
  const raw = localStorage.getItem(marksKey(quizId));
  const parsed = safeJSONParse(raw, null);
  if (!parsed || typeof parsed !== "object") return { flagged: {}, later: {} };
  return {
    flagged: parsed.flagged && typeof parsed.flagged === "object" ? parsed.flagged : {},
    later: parsed.later && typeof parsed.later === "object" ? parsed.later : {},
  };
}

// Saves flagged and review-later marks for a quiz to localStorage
function saveMarks(quizId, flaggedObj, laterObj) {
  if (!quizId) return;
  localStorage.setItem(
    marksKey(quizId),
    JSON.stringify({ flagged: flaggedObj || {}, later: laterObj || {} })
  );
}

// --------------------- Main Component ---------------------
export default function QuizAssessmentPage() {

// ---------- Layout and accessibility state ----------
  // Sidebar open/close state for smaller screens
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Accessibility toggles
  const [contrast, setContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  // Guest profile helpers: active profile, badge/point awarding, and profile switcher
  const { activeProfile, awardBadge, addPoints, openSwitcher } = useGuestProfile();

  // Load saved accessibility settings on first mount
  useEffect(() => {
    setContrast(localStorage.getItem("sat_contrast") === "1");
    setDyslexia(localStorage.getItem("sat_dyslexia") === "1");
    setLargeText(localStorage.getItem("sat_largetext") === "1");
  }, []);

  // Apply/remove high contrast class and save setting
  useEffect(() => {
    document.body.classList.toggle("contrast", contrast);
    localStorage.setItem("sat_contrast", contrast ? "1" : "0");
  }, [contrast]);

  // Apply/remove dyslexia-friendly font class and save setting
  useEffect(() => {
    document.body.classList.toggle("dyslexia", dyslexia);
    localStorage.setItem("sat_dyslexia", dyslexia ? "1" : "0");
  }, [dyslexia]);

  // Apply/remove large text class and save setting
  useEffect(() => {
    document.body.classList.toggle("large-text", largeText);
    localStorage.setItem("sat_largetext", largeText ? "1" : "0");
  }, [largeText]);

  // persistent progress
  const [bestScores, setBestScores] = useState(() => safeJSONParse(localStorage.getItem(LS_BEST), {}));

  // General unlocked badges
  const [earnedBadges, setEarnedBadges] = useState(() => safeJSONParse(localStorage.getItem(LS_BADGES), []));

  // Total number of quiz attempts
  const [attemptCount, setAttemptCount] = useState(() => Number(localStorage.getItem(LS_ATTEMPTS) || "0"));

  // Highest mastery tier reached
  const [masteryTier, setMasteryTier] = useState(() => Number(localStorage.getItem(LS_MASTERY) || "0"));

  // Tracks badges unlocked in the most recent attempt so they can be highlighted
  const [newBadges, setNewBadges] = useState([]);

  // Persist overall progress whenever it changes
  useEffect(() => localStorage.setItem(LS_BEST, JSON.stringify(bestScores)), [bestScores]);
  useEffect(() => localStorage.setItem(LS_BADGES, JSON.stringify(earnedBadges)), [earnedBadges]);
  useEffect(() => localStorage.setItem(LS_ATTEMPTS, String(attemptCount)), [attemptCount]);
  useEffect(() => localStorage.setItem(LS_MASTERY, String(masteryTier)), [masteryTier]);

   // ---------- Current quiz attempt state ----------
  // Which screen is currently displayed
  const [view, setView] = useState(VIEW.DASHBOARD);
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  const [mode, setMode] = useState("practice"); // practice | exam
  const [shuffleQuestions, setShuffleQuestions] = useState(true);

  const [attemptQuestions, setAttemptQuestions] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const [showFeedback, setShowFeedback] = useState(false);

  // NOW PERSISTED PER QUIZ (loaded on instructions)
  const [flagged, setFlagged] = useState({});
  const [reviewLater, setReviewLater] = useState({});

  // read aloud state
  const [speaking, setSpeaking] = useState(false);

  // timer
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);

  // Cleanup timer + speech when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  // The currently selected quiz definition from QUIZ_BANK
  const quizBase = useMemo(() => {
    if (!selectedQuizId) return null;
    return QUIZ_BANK[selectedQuizId] || null;
  }, [selectedQuizId]);

  // The current question being shown
  const currentQ = useMemo(() => {
    if (!attemptQuestions) return null;
    return attemptQuestions[qIndex] || null;
  }, [attemptQuestions, qIndex]);

  const totalQuestions = attemptQuestions?.length || 0;

  // Count how many questions have been answered
  const answeredCount = useMemo(() => {
    if (!attemptQuestions) return 0;
    return attemptQuestions.reduce((acc, q) => (answers[q.id] === undefined ? acc : acc + 1), 0);
  }, [attemptQuestions, answers]);

  const unansweredCount = totalQuestions - answeredCount;

  // Progress percentage for current attempt
  const completionPct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // --------------------- Score helpers ---------------------
    // Checks whether a user's answer is correct for a given question

  function isAnswerCorrect(q, user) {
    if (user === undefined || user === null) return false;
    switch (q.type) {
      case "mcq":
      case "tf":
        return user === q.answer;
      case "multi":
        return Array.isArray(user) && setEqual(user, q.answer);
      case "order":
        return Array.isArray(user) && arraysEqual(user, q.answer);
      case "match":
        if (typeof user !== "object") return false;
        for (const leftKey of q.left) if (user[leftKey] !== q.answer[leftKey]) return false;
        return true;
      default:
        return false;
    }
  }

  // Builds score data for results/review pages
  const scoreData = useMemo(() => {
    if (!quizBase || !attemptQuestions) return null;

    let correct = 0;
    const perAlgo = {};
    const details = [];

    for (const q of attemptQuestions) {
      const user = answers[q.id];
      const ok = isAnswerCorrect(q, user);

      // Group score by algorithm type
      if (!perAlgo[q.algo]) perAlgo[q.algo] = { correct: 0, total: 0 };
      perAlgo[q.algo].total += 1;
      if (ok) {
        correct += 1;
        perAlgo[q.algo].correct += 1;
      }

      // Detailed info for review screen
      details.push({
        q,
        user,
        isCorrect: ok,
        flagged: !!flagged[q.id],
        reviewLater: !!reviewLater[q.id],
      });
    }

    const total = attemptQuestions.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;

    return {
      correct,
      total,
      pct,
      perAlgo,
      details,
      unanswered: attemptQuestions.filter((q) => answers[q.id] === undefined).length,
      flaggedCount: attemptQuestions.filter((q) => flagged[q.id]).length,
      reviewLaterCount: attemptQuestions.filter((q) => reviewLater[q.id]).length,
    };
  }, [quizBase, attemptQuestions, answers, flagged, reviewLater]);

  // --------------------- Dashboard: recommended quiz ---------------------
  // Chooses a recommended quiz based on lowest or missing best score
  const recommendedQuiz = useMemo(() => {
    const all = Object.values(QUIZ_BANK);
    const hasAnyScore = Object.keys(bestScores).length > 0;
    // If no quizzes attempted yet, avoid recommending the final immediately
    const candidates = all.filter((q) => (hasAnyScore ? true : q.id !== "final"));

    let best = null;
    for (const q of candidates) {
      const s = bestScores[q.id];
      const scoreVal = typeof s === "number" ? s : -1;
      if (!best || scoreVal < best.scoreVal) best = { quiz: q, scoreVal };
    }
    return best?.quiz || QUIZ_BANK.bubble;
  }, [bestScores]);

  // Quick summary stats for dashboard header
  const quickStats = useMemo(() => {
    const quizIds = Object.keys(QUIZ_BANK);
     // Number of quizzes with a saved best score
    const completed = quizIds.filter((id) => typeof bestScores[id] === "number").length;
     // Average of best scores across completed quizzes
    const bestAvg =
      completed > 0
        ? Math.round(
            quizIds.reduce((acc, id) => acc + (typeof bestScores[id] === "number" ? bestScores[id] : 0), 0) / completed
          )
        : 0;

    return {
      completed,
      total: quizIds.length,
      bestAvg,
      badges: earnedBadges.length,
      attempts: attemptCount,
    };
  }, [bestScores, earnedBadges.length, attemptCount]);

  // --------------------- Attempt lifecycle ---------------------
  // Resets current attempt state
  function resetAttempt() {
    setQIndex(0);
    setAnswers({});
    setShowFeedback(false);
    setRemaining(0);
    setAttemptQuestions(null);
     // Keep flagged/reviewLater because they are now persisted per quiz
    setNewBadges([]);
    setSpeaking(false);

    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

   // Load saved marks when opening a quiz instructions screen
  function goToInstructions(quizId) {
    resetAttempt();
    setSelectedQuizId(quizId);

    // Restore quiz-specific flagged/review-later state
    const m = loadMarks(quizId);
    setFlagged(m.flagged);
    setReviewLater(m.later);

    setView(VIEW.INSTRUCTIONS);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Start quiz with filters: all | flagged | later
  function startSelectedQuiz({ forceQuizId = null, filter = "all" } = {}) {
    const base = forceQuizId ? QUIZ_BANK[forceQuizId] : quizBase;
    if (!base) return;

    // Shuffle or keep original order depending on setting
    let qs = shuffleQuestions ? shuffle(base.questions) : [...base.questions];

    // Filter to saved revision subsets if needed
    if (filter === "flagged") qs = qs.filter((q) => flagged[q.id]);
    if (filter === "later") qs = qs.filter((q) => reviewLater[q.id]);

    // fallback if none marked
    if (qs.length === 0) {
      qs = shuffleQuestions ? shuffle(base.questions) : [...base.questions];
    }

    setAttemptQuestions(qs);

    setQIndex(0);
    setAnswers(initAnswersForQuestions(qs)); 
    setShowFeedback(false);
    setNewBadges([]);
    setSpeaking(false);

    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    const limit = base.timeLimitSec || 0;
    setRemaining(limit);

     // Clear any previous timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    // Start countdown timer in exam mode only
    if (mode === "exam" && limit > 0) {
      timerRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            submitQuiz({ reason: "timeout", base, questions: qs, answersOverride: answersRef.current });
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }

    setSelectedQuizId(base.id);
    setView(VIEW.QUIZ);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Stop timer if user leaves quiz screen
  useEffect(() => {
    if (view !== VIEW.QUIZ && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [view]);

  // --------------------- Answer handlers ---------------------
  function setUserAnswer(q, value) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (showFeedback) setShowFeedback(false);
  }
  // Toggle selection for multiple-answer question
  function toggleMulti(q, idx) {
    const prev = answers[q.id] || [];
    const set = new Set(prev);
    if (set.has(idx)) set.delete(idx);
    else set.add(idx);
    setUserAnswer(q, Array.from(set).sort((a, b) => a - b));
  }
  // Moves an item up/down in an ordering question
  function moveOrderItem(q, fromIndex, toIndex) {
    const current = answers[q.id] || q.items;
    const arr = [...current];
    const from = clamp(fromIndex, 0, arr.length - 1);
    const to = clamp(toIndex, 0, arr.length - 1);
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setUserAnswer(q, arr);
  }

  function nextQuestion() {
    if (!attemptQuestions) return;
    setShowFeedback(false);
    setQIndex((i) => clamp(i + 1, 0, attemptQuestions.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function prevQuestion() {
    if (!attemptQuestions) return;
    setShowFeedback(false);
    setQIndex((i) => clamp(i - 1, 0, attemptQuestions.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function jumpTo(index) {
    if (!attemptQuestions) return;
    setShowFeedback(false);
    setQIndex(clamp(index, 0, attemptQuestions.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Persist flag toggles to localStorage per quiz
  function toggleFlag(qId) {
    setFlagged((prev) => {
      const next = { ...prev };
      if (next[qId]) delete next[qId];
      else next[qId] = true;

      saveMarks(selectedQuizId, next, reviewLater);
      return next;
    });
  }

  //  Persist reviewLater toggles to localStorage per quiz
  function toggleReviewLater(qId) {
    setReviewLater((prev) => {
      const next = { ...prev };
      if (next[qId]) delete next[qId];
      else next[qId] = true;

      saveMarks(selectedQuizId, flagged, next);
      return next;
    });
  }

  // Clears all saved flagged/review-later marks for the selected quiz
  function clearMarksForQuiz() {
    if (!selectedQuizId) return;
    setFlagged({});
    setReviewLater({});
    saveMarks(selectedQuizId, {}, {});
  }

  // --------------------- Tiered mastery awarding ---------------------
  // Unlocks general badges and updates mastery tier based on score
  function awardBadgesAndTier({ pct, unanswered, isFinal }) {
    const unlocked = [];
    const have = new Set(earnedBadges);

    const maybeUnlock = (id) => {
      if (!have.has(id)) unlocked.push(id);
    };

    // General badges
    if (attemptCount === 0) maybeUnlock("first_attempt");
    if (unanswered === 0) maybeUnlock("no_skips");
    if (isFinal) maybeUnlock("final_boss");

    const t = tierFromScore(pct);
    setMasteryTier((prev) => Math.max(prev, t.level));

    if (unlocked.length > 0) setEarnedBadges((prev) => [...new Set([...prev, ...unlocked])]);
    return unlocked;
  }

  // --------------------- Submit ---------------------
  // Stores the latest submitted percentage so the results page can show it immediately
  const [lastSubmittedPct, setLastSubmittedPct] = useState(null);

   // Handles quiz submission, either manual or timeout-based
  function submitQuiz({ reason = "manual", base = quizBase, questions = attemptQuestions, answersOverride = null } = {}) {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);

    setAttemptCount((c) => c + 1);

    if (!base || !questions) {
      setView(VIEW.RESULTS);
      return;
    }

     // Use passed answers, or latest answers from ref, or current state
    const usedAnswers = answersOverride || answersRef.current || answers;

    let correct = 0; // Calculate total correct
    for (const q of questions) {
      const user = usedAnswers[q.id];
      if (isAnswerCorrect(q, user)) correct += 1;
    }

    const total = questions.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const unanswered = questions.filter((q) => usedAnswers[q.id] === undefined).length;

    // ---------- Guest profile scoring ----------
if (activeProfile) {
  const quizId = base.id;

  const prevBest =
    typeof bestScores[quizId] === "number" ? bestScores[quizId] : null;

  const isFirstCompletion = prevBest === null;
  const improved = prevBest !== null && pct > prevBest;
  const isPerfect = pct === 100;

  let gained = 0;

  //  First completion
  if (isFirstCompletion) {
    gained += 20;
    awardBadge(QUIZ_BADGES.first(quizId), { points: 0 });
  }

  if (improved) {
    const diff = pct - prevBest;
    gained += Math.min(10, diff); 
  }

  //  Perfect score bonus
  if (isPerfect) {
    gained += 30; //  now handled directly as points
    awardBadge(QUIZ_BADGES.perfect(quizId), { points: 0 });
  }

  //  Final pass ≥ 80%
  if (quizId === "final" && pct >= 80) {
    gained += 50;
    awardBadge(QUIZ_BADGES.finalPass, { points: 0 });
  }

  if (gained > 0) {
    addPoints(gained, {
      source: `quiz_${quizId}`,
      meta: { pct, prevBest },
    });
  }
} else {
  // Optional: ask user to choose profile if none is active
  openSwitcher?.();
}

    setLastSubmittedPct(pct);
  // Update best score for this quiz
    setBestScores((prev) => {
      const prevBest = typeof prev[base.id] === "number" ? prev[base.id] : -1;
      return { ...prev, [base.id]: Math.max(prevBest, pct) };
    });

     // Award general badges/mastery
    const unlockedNow = awardBadgesAndTier({
      pct,
      unanswered,
      isFinal: base.id === "final",
    });
    setNewBadges(unlockedNow);

    setShowFeedback(false);
    setView(VIEW.RESULTS);

    void reason;
  }

   // Prevent accidental submission in exam mode if questions are unanswered
  function submitWithGuard() {
    if (mode === "exam" && unansweredCount > 0) {
      const ok = window.confirm(`You still have ${unansweredCount} unanswered question(s). Submit anyway?`);
      if (!ok) return;
    }
    submitQuiz({ reason: "manual" });
  }

  // --------------------- Render helpers ---------------------
  function algoLabel(a) {
    switch (a) {
      case "bubble":
        return "Bubble";
      case "selection":
        return "Selection";
      case "insertion":
        return "Insertion";
      case "merge":
        return "Merge";
      case "quick":
        return "Quick";
      case "final":
        return "Final";
      default:
        return a;
    }
  }

  // Small algorithm badge used across the UI
  function AlgoBadge({ algo }) {
    const label = algoLabel(algo);
    return <span className={`qa-algo-badge qa-algo-${algo}`}>{label}</span>;
  }

   // Chip showing difficulty text
  function DifficultyChip({ text }) {
    return <span className="qa-chip qa-chip-soft">🎯 {text}</span>;
  }

   // Chip showing which question types appear in a quiz
  function TypesChip({ quiz }) {
    const types = new Set(quiz.questions.map((q) => q.type));
    const label = Array.from(types).slice(0, 3).join(", ") + (types.size > 3 ? "…" : "");
    return <span className="qa-chip qa-chip-soft">🧠 {label}</span>;
  }

  // Chip showing current mastery tier title
  function MasteryTierChip() {
    const t = MASTERY_TIERS.find((x) => x.level === masteryTier) || MASTERY_TIERS[0];
    return (
      <span className={`qa-chip qa-chip-soft qa-tier qa-tier-${t.id}`}>
        🏆 Tier: {t.title}
      </span>
    );
  }

  // Reusable card for each quiz on the dashboard
  function QuizCard({ qz }) {
    const best = typeof bestScores[qz.id] === "number" ? bestScores[qz.id] : null;
    return (
      <button className="qa-quiz-card qa-quiz-card-v2" onClick={() => goToInstructions(qz.id)}>
        <div className="qa-quiz-card-top">
          <h3 className="qa-h3">{qz.title}</h3>
          <span className="qa-meta">{qz.questions.length} Q</span>
        </div>

        <p className="qa-desc">{qz.description}</p>

        <div className="qa-card-chips">
          <DifficultyChip text={qz.difficulty || "Foundations"} />
          <TypesChip quiz={qz} />
          <span className="qa-chip">
            {mode === "exam" && qz.timeLimitSec
              ? `⏱ ${Math.round(qz.timeLimitSec / 60)} min`
              : "⏱ Practice (Untimed)"}
          </span>
          {best !== null && <span className="qa-chip qa-chip-good">⭐ Best: {best}%</span>}
        </div>

        <div className="qa-quiz-card-bottom">
          <span className="qa-start">Open →</span>
          <span className="qa-meta">{best === null ? "Not attempted" : "Attempted"}</span>
        </div>
      </button>
    );
  }

  // Question navigation dots shown in the right-side quiz panel
  const questionNav = useMemo(() => {
    if (!attemptQuestions) return [];
    return attemptQuestions.map((q, idx) => {
      const isAnswered = answers[q.id] !== undefined;
      const isFlagged = !!flagged[q.id];
      const isLater = !!reviewLater[q.id];
      return { idx, q, isAnswered, isFlagged, isLater };
    });
  }, [attemptQuestions, answers, flagged, reviewLater]);

  // Build text for speech synthesis based on question type and options
  function buildReadText(q) {
    if (!q) return "";
    let text = q.prompt;
    if (q.type === "mcq" || q.type === "multi") {
      const opts = q.options.map((o, i) => `Option ${i + 1}: ${o}.`).join(" ");
      text += " " + opts;
      if (q.type === "multi") text += " Select all that apply.";
    } else if (q.type === "tf") {
      text += " True or False.";
    } else if (q.type === "order") {
      const items = q.items.map((it, i) => `Item ${i + 1}: ${it}.`).join(" ");
      text += " " + items + " Reorder the items.";
    } else if (q.type === "match") {
      const left = q.left.map((it, i) => `Left ${i + 1}: ${it}.`).join(" ");
      const right = q.right.map((it, i) => `Choice ${i + 1}: ${it}.`).join(" ");
      text += " Match items. " + left + " " + right;
    }
    return text;
  }

  // Toggle browser read-aloud for the current question
  function toggleReadAloud() {
    if (!currentQ) return;
    if (!("speechSynthesis" in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const ok = speakText(buildReadText(currentQ));
    setSpeaking(ok);
  }

  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [qIndex]);

  // --------------------- UI ---------------------
 // Best score shown on results screen: latest attempt or stored best, whichever is higher
  const bestShown =
    quizBase && typeof bestScores[quizBase.id] === "number"
      ? Math.max(bestScores[quizBase.id], lastSubmittedPct ?? 0)
      : lastSubmittedPct ?? 0;

  const flaggedCountForQuiz = Object.keys(flagged).length;
  const laterCountForQuiz = Object.keys(reviewLater).length;

  return (
    <>
     {/* Keyboard accessibility skip link */}
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
            <li aria-current="page">Quiz &amp; Assessment</li>
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

        {/* Accessibility dropdown menu */}
        {accessOpen && (
          <div className="access-menu" role="dialog" aria-label="Accessibility options">
            <h3>Accessibility options</h3>

            <label className="access-option">
              <input type="checkbox" checked={contrast} onChange={() => setContrast((p) => !p)} />
              High contrast mode
            </label>

            <label className="access-option">
              <input type="checkbox" checked={dyslexia} onChange={() => setDyslexia((p) => !p)} />
              Dyslexia-friendly font
            </label>

            <label className="access-option">
              <input type="checkbox" checked={largeText} onChange={() => setLargeText((p) => !p)} />
              Larger text
            </label>

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
        {/* Sidebar */}
        <aside id="sidebar" className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Course navigation">
          <h2 className="sidebar-title">Getting started</h2>
          <ul className="toc">
            <li>
              <Link to="/module">Module overview</Link>
            </li>
            <li>
              <Link to="/what-is-sorting">What is sorting? (recap)</Link>
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
              <Link to="/quick-sort">Quick sort</Link>
            </li>
          </ul>

          <h2 className="sidebar-title">Interactive</h2>
          <ul className="toc">
            <li>
              <Link to="/visualiser">Visualiser &amp; practice</Link>
            </li>
            <li>
              <Link className="active" to="/quiz-assessment" aria-current="page">
                Quiz &amp; Assessment
              </Link>
            </li>
          </ul>

          <h2 className="sidebar-title">Support</h2>
          <ul className="toc">
            <li>
              <Link to="/glossary-feedback">Glossary &amp; Feedback</Link>
            </li>
          </ul>
        </aside>

        {/* Main */}
        <main id="main" className="content">
          <div className="qa-shell">
            {/* HERO */}
            <section className="qa-card qa-hero">
              <div className="qa-hero-left">
                <div className="qa-eyebrow">Interactive · Assessment</div>
                <h1 className="qa-title">Quiz &amp; Assessment</h1>
                <p className="qa-subtitle">
                  Test your understanding across Bubble, Selection, Insertion, Merge and Quick sort. Practice for feedback
                  as you go, or switch to Exam mode for a timed assessment.
                </p>

                <div className="qa-hero-chips">
                  <span className="qa-chip">🧩 Mode: {mode === "exam" ? "Exam" : "Practice"}</span>
                  <span className="qa-chip">🎯 Focus: Sorting fundamentals</span>
                  <MasteryTierChip />
                  <span className="qa-chip">
                    🏅 Badges: <strong>{quickStats.badges}</strong>
                  </span>
                </div>
              </div>

              <div className="qa-hero-right">
                <div className="qa-mini-kpis">
                  <div className="qa-kpi">
                    <div className="qa-kpi-label">Quizzes completed</div>
                    <div className="qa-kpi-value">
                      {quickStats.completed}/{quickStats.total}
                    </div>
                  </div>
                  <div className="qa-kpi">
                    <div className="qa-kpi-label">Avg best score</div>
                    <div className="qa-kpi-value">{quickStats.completed ? `${quickStats.bestAvg}%` : "—"}</div>
                  </div>
                  <div className="qa-kpi">
                    <div className="qa-kpi-label">Attempts</div>
                    <div className="qa-kpi-value">{quickStats.attempts}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* DASHBOARD */}
            {view === VIEW.DASHBOARD && (
              <>
                <section className="qa-stats-strip" aria-label="Quick stats">
                  <div className="qa-stat">
                    <div className="qa-stat-icon">✅</div>
                    <div>
                      <div className="qa-stat-label">Completed</div>
                      <div className="qa-stat-value">
                        {quickStats.completed}/{quickStats.total}
                      </div>
                    </div>
                  </div>

                  <div className="qa-stat">
                    <div className="qa-stat-icon">⭐</div>
                    <div>
                      <div className="qa-stat-label">Avg best</div>
                      <div className="qa-stat-value">{quickStats.completed ? `${quickStats.bestAvg}%` : "—"}</div>
                    </div>
                  </div>

                  <div className="qa-stat">
                    <div className="qa-stat-icon">🏆</div>
                    <div>
                      <div className="qa-stat-label">Mastery tier</div>
                      <div className="qa-stat-value">
                        {(MASTERY_TIERS.find((t) => t.level === masteryTier) || MASTERY_TIERS[0]).title}
                      </div>
                    </div>
                  </div>
                   {/* Mode switch buttons */}
                  <div className="qa-stat qa-stat-actions">
                    <button className={`qa-pill ${mode === "practice" ? "active" : ""}`} onClick={() => setMode("practice")} type="button">
                      Practice
                    </button>
                    <button className={`qa-pill ${mode === "exam" ? "active" : ""}`} onClick={() => setMode("exam")} type="button">
                      Exam
                    </button>
                  </div>
                </section>
                {/* Recommended quiz section */}
                <section className="qa-featured">
                  <div className="qa-featured-card">
                    <div className="qa-featured-left">
                      <div className="qa-featured-badge">Recommended</div>
                      <h2 className="qa-h2">{recommendedQuiz.title}</h2>
                      <p className="qa-desc">
                        Based on your progress, this is a great next step. Try it now — you’ll get revision suggestions after.
                      </p>

                      <div className="qa-card-chips">
                        <DifficultyChip text={recommendedQuiz.difficulty || "Foundations"} />
                        <TypesChip quiz={recommendedQuiz} />
                        <span className="qa-chip">
                          {mode === "exam" && recommendedQuiz.timeLimitSec
                            ? `⏱ ${Math.round(recommendedQuiz.timeLimitSec / 60)} min`
                            : "⏱ Practice (Untimed)"}
                        </span>
                        {typeof bestScores[recommendedQuiz.id] === "number" && (
                          <span className="qa-chip qa-chip-good">⭐ Best: {bestScores[recommendedQuiz.id]}%</span>
                        )}
                      </div>

                      <div className="qa-featured-actions">
                        <button
                          className="qa-primary"
                          onClick={() => {
                            goToInstructions(recommendedQuiz.id);
                          }}
                        >
                          Open recommended →
                        </button>
                        <button className="qa-secondary" onClick={() => startSelectedQuiz({ forceQuizId: recommendedQuiz.id, filter: "all" })}>
                          Start now
                        </button>
                      </div>
                    </div>

                    <div className="qa-featured-right">
                      <div className="qa-badge-shelf">
                        <div className="qa-badge-shelf-title">Your badges</div>
                        <div className="qa-badge-grid">
                          {BADGES.map((b) => {
                            const earned = b.id === "mastery_tier" ? masteryTier > 0 : earnedBadges.includes(b.id);
                            const tierLabel =
                              b.id === "mastery_tier"
                                ? (MASTERY_TIERS.find((t) => t.level === masteryTier) || MASTERY_TIERS[0]).title
                                : null;

                            return (
                              <div key={b.id} className={`qa-badge ${earned ? "earned" : "locked"}`}>
                                <div className="qa-badge-top">
                                  <div className="qa-badge-title">{b.title}</div>
                                  <div className="qa-badge-pill">
                                    {b.id === "mastery_tier" ? `Tier: ${tierLabel}` : earned ? "Unlocked" : "Locked"}
                                  </div>
                                </div>
                                <div className="qa-badge-desc">{b.desc}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Quiz selection grid */}
                <section className="qa-card">
                  <div className="qa-dashboard-head">
                    <div>
                      <h2 className="qa-h2">Choose a quiz</h2>
                      <p className="qa-desc">Pick a topic, then choose Practice or Exam mode.</p>
                    </div>

                    <label className="qa-check">
                      <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
                      Shuffle questions
                    </label>
                  </div>

                  <div className="qa-quiz-grid">
                    {Object.values(QUIZ_BANK).map((qz) => (
                      <QuizCard key={qz.id} qz={qz} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* INSTRUCTIONS */}
            {view === VIEW.INSTRUCTIONS && quizBase && (
              <section className="qa-card qa-instructions-card">
                <div className="qa-instructions-top">
                  <div>
                    <h2 className="qa-h2">{quizBase.title}</h2>
                    <p className="qa-desc">{quizBase.description}</p>

                     {/* Summary tags for the selected quiz */}
                    <div className="qa-instruction-tags">
                      <span className="qa-tag">{quizBase.questions.length} questions</span>
                      <span className="qa-tag">
                        {quizBase.timeLimitSec && mode === "exam"
                          ? `Time limit: ${Math.round(quizBase.timeLimitSec / 60)} min`
                          : "No time pressure (practice)"}
                      </span>
                      <span className="qa-tag">Mode: {mode === "exam" ? "Exam" : "Practice"}</span>
                      {typeof bestScores[quizBase.id] === "number" && <span className="qa-tag">Best: {bestScores[quizBase.id]}%</span>}
                      <span className="qa-tag">🚩 Flagged saved: {flaggedCountForQuiz}</span>
                      <span className="qa-tag">🕒 Review later saved: {laterCountForQuiz}</span>
                    </div>
                  </div>

                  <button className="qa-secondary" onClick={() => setView(VIEW.DASHBOARD)}>
                    ← Back
                  </button>
                </div>

                 {/* Instructions box */}
                <div className="qa-instructions-box">
                  <h3 className="qa-h3">How it works</h3>
                  <ul className="qa-list">
                    <li>
                      <strong>Practice Mode:</strong> check answers, get hints, then “explain why”.
                    </li>
                    <li>
                      <strong>Exam Mode:</strong> timed; feedback shown after submission.
                    </li>
                    <li>
                      Use <strong>Flag</strong> or <strong>Review later</strong> to build revision sets (saved for this quiz).
                    </li>
                    <li>
                      Your <strong>Mastery Tier</strong> upgrades as your scores improve.
                    </li>
                    <li>
                      Use <strong>🔊 Read aloud</strong> to hear the question and options.
                    </li>
                  </ul>
                </div>

                {/* review modes + clear marks */}
                <div className="qa-actions-row">
                  <button className="qa-primary" onClick={() => startSelectedQuiz({ filter: "all" })}>
                    Start Quiz
                  </button>

                  <button
                    className="qa-secondary"
                    onClick={() => startSelectedQuiz({ filter: "flagged" })}
                    disabled={flaggedCountForQuiz === 0}
                    title={flaggedCountForQuiz === 0 ? "No flagged questions yet" : "Start only flagged questions"}
                  >
                    Review Flagged
                  </button>

                  <button
                    className="qa-secondary"
                    onClick={() => startSelectedQuiz({ filter: "later" })}
                    disabled={laterCountForQuiz === 0}
                    title={laterCountForQuiz === 0 ? "No review-later questions yet" : "Start only review-later questions"}
                  >
                    Review Later
                  </button>

                  <button
                    className="qa-secondary qa-clear"
                    onClick={clearMarksForQuiz}
                    disabled={flaggedCountForQuiz === 0 && laterCountForQuiz === 0}
                    title="Remove all flagged/review-later marks for this quiz"
                  >
                    Clear Marks
                  </button>

                  <button
                    className="qa-secondary"
                    onClick={() => {
                      setMode("practice");
                      startSelectedQuiz({ filter: "all" });
                    }}
                  >
                    Start in Practice Mode
                  </button>
                </div>
              </section>
            )}

            {/* QUIZ */}
            {view === VIEW.QUIZ && quizBase && attemptQuestions && currentQ && (
              <section className="qa-quiz-layout">
                <div className="qa-quiz-main">
                  <div className="qa-card qa-quiz-main-card">
                    <div className="qa-quiz-topbar">
                      <div className="qa-quiz-topbar-left">
                        <div className="qa-quiz-title-row">
                          <h2 className="qa-h2">{quizBase.title}</h2>
                          <div className="qa-quiz-mini-tags">
                            <span className="qa-chip qa-chip-soft">
                              Q {qIndex + 1}/{attemptQuestions.length}
                            </span>
                            <AlgoBadge algo={currentQ.algo} />
                            <span className="qa-chip qa-chip-soft">Difficulty: {currentQ.difficulty}</span>
                          </div>
                        </div>

                         {/* Progress bar */}
                        <div className="qa-progress-wrap" aria-label="Progress">
                          <div className="qa-progress-label">
                          Completion {completionPct}% · Question {qIndex + 1}/{attemptQuestions.length} · Answered {answeredCount}/{attemptQuestions.length}
                          </div>
                          <div className="qa-progress">
                            <div className="qa-progress-bar" style={{ width: `${completionPct}%` }} />
                          </div>
                        </div>
                      </div>

                       {/* Timer shown only in exam mode */}
                      <div className="qa-quiz-topbar-right">
                        {mode === "exam" && (quizBase.timeLimitSec || 0) > 0 && (
                          <div className={`qa-timer ${remaining <= 30 ? "danger" : ""}`} aria-label="Time remaining">
                            ⏱ {formatTime(remaining)}
                          </div>
                        )}
                      </div>
                    </div>

                  {/* Current question block */}
                    <div className="qa-question">
                      <div className="qa-question-head">
                        <p className="qa-prompt">{currentQ.prompt}</p>

                        <button
                          type="button"
                          className={`qa-read-btn ${speaking ? "speaking" : ""}`}
                          onClick={toggleReadAloud}
                          aria-label={speaking ? "Stop reading aloud" : "Read aloud"}
                          title={speaking ? "Stop" : "Read aloud"}
                        >
                          {speaking ? "⏹ Stop" : "🔊 Read"}
                        </button>
                      </div>

                       {/* Flag/review-later actions */}
                      <div className="qa-q-actions">
                        <button
                          type="button"
                          className={`qa-action-chip ${flagged[currentQ.id] ? "active" : ""}`}
                          onClick={() => toggleFlag(currentQ.id)}
                        >
                          🚩 Flag
                        </button>
                        <button
                          type="button"
                          className={`qa-action-chip ${reviewLater[currentQ.id] ? "active" : ""}`}
                          onClick={() => toggleReviewLater(currentQ.id)}
                        >
                          🕒 Review later
                        </button>
                      </div>

                      <QuestionBody
                        q={currentQ}
                        value={answers[currentQ.id]}
                        setValue={(v) => setUserAnswer(currentQ, v)}
                        toggleMulti={(idx) => toggleMulti(currentQ, idx)}
                        moveOrderItem={(from, to) => moveOrderItem(currentQ, from, to)}
                      />

                      <div className="qa-nav-row">
                        <button className="qa-secondary" onClick={prevQuestion} disabled={qIndex === 0}>
                          ← Back
                        </button>

                        <div className="qa-nav-center">
                          {mode === "practice" && (
                            <button
                              className="qa-primary"
                              onClick={() => setShowFeedback(true)}
                              disabled={answers[currentQ.id] === undefined}
                              title={answers[currentQ.id] === undefined ? "Answer the question first" : "Check your answer"}
                            >
                              Check Answer
                            </button>
                          )}

                          {qIndex < attemptQuestions.length - 1 ? (
                            <button className="qa-primary" onClick={nextQuestion}>
                              Next →
                            </button>
                          ) : (
                            <button className="qa-primary" onClick={submitWithGuard}>
                              Submit Quiz
                            </button>
                          )}
                        </div>

                        <button
                          className="qa-secondary"
                          onClick={() => {
                            resetAttempt();
                            setView(VIEW.DASHBOARD);
                          }}
                        >
                          Exit
                        </button>
                      </div>

                      {/* Practice-mode feedback box */}
                      {mode === "practice" && showFeedback && (
                        <FeedbackBox q={currentQ} user={answers[currentQ.id]} correct={isAnswerCorrect(currentQ, answers[currentQ.id])} />
                      )}
                    </div>
                  </div>
                </div>
                
                 {/* Right-side quiz panel */}
                <aside className="qa-quiz-panel">
                  <div className="qa-card qa-panel-card">
                    <div className="qa-panel-head">
                      <div>
                        <div className="qa-panel-title">Quiz Panel</div>
                        <div className="qa-panel-sub">
                          Unanswered: <strong>{unansweredCount}</strong>
                        </div>
                      </div>

                      <button className="qa-mini-btn qa-mini-danger" type="button" onClick={submitWithGuard} title="Submit anytime">
                        Submit
                      </button>
                    </div>

                       {/* Current attempt summary */}
                    <div className="qa-panel-section">
                      <div className="qa-panel-row">
                        <span className="qa-meta">Answered</span>
                        <strong>
                          {answeredCount}/{attemptQuestions.length}
                        </strong>
                      </div>

                      <div className="qa-panel-row">
                        <span className="qa-meta">Flagged</span>
                        <strong>{attemptQuestions.filter((q) => flagged[q.id]).length}</strong>
                      </div>

                      <div className="qa-panel-row">
                        <span className="qa-meta">Review later</span>
                        <strong>{attemptQuestions.filter((q) => reviewLater[q.id]).length}</strong>
                      </div>
                    </div>

                    {/* Jump-to-question dots */}
                    <div className="qa-panel-section">
                      <div className="qa-panel-section-title">Jump to question</div>
                      <div className="qa-qnav">
                        {questionNav.map((it) => (
                          <button
                            key={it.q.id}
                            type="button"
                            onClick={() => jumpTo(it.idx)}
                            className={[
                              "qa-qdot",
                              it.idx === qIndex ? "current" : "",
                              it.isAnswered ? "answered" : "unanswered",
                              it.isFlagged ? "flagged" : "",
                              it.isLater ? "later" : "",
                            ].join(" ")}
                            aria-label={`Go to question ${it.idx + 1}`}
                            title={[
                              `Q${it.idx + 1}`,
                              it.isAnswered ? "Answered" : "Unanswered",
                              it.isFlagged ? "Flagged" : "",
                              it.isLater ? "Review later" : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          >
                            {it.idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                     {/* Shortcut actions */}
                    <div className="qa-panel-section">
                      <div className="qa-panel-section-title">Quick actions</div>

                      <button
                        type="button"
                        className="qa-secondary qa-panel-btn"
                        onClick={() => {
                          const firstUnanswered = questionNav.find((x) => !x.isAnswered);
                          if (firstUnanswered) jumpTo(firstUnanswered.idx);
                        }}
                        disabled={unansweredCount === 0}
                      >
                        Go to first unanswered →
                      </button>

                      <button
                        type="button"
                        className="qa-secondary qa-panel-btn"
                        onClick={() => {
                          const firstFlagged = questionNav.find((x) => x.isFlagged);
                          if (firstFlagged) jumpTo(firstFlagged.idx);
                        }}
                        disabled={attemptQuestions.filter((q) => flagged[q.id]).length === 0}
                      >
                        Go to first flagged →
                      </button>

                      <button
                        type="button"
                        className="qa-secondary qa-panel-btn"
                        onClick={() => {
                          const firstLater = questionNav.find((x) => x.isLater);
                          if (firstLater) jumpTo(firstLater.idx);
                        }}
                        disabled={attemptQuestions.filter((q) => reviewLater[q.id]).length === 0}
                      >
                        Go to first “review later” →
                      </button>

                      {/* clear marks from the panel too (handy) */}
                      <button
                        type="button"
                        className="qa-secondary qa-panel-btn qa-clear"
                        onClick={clearMarksForQuiz}
                        disabled={Object.keys(flagged).length === 0 && Object.keys(reviewLater).length === 0}
                      >
                        Clear marks (this quiz)
                      </button>
                    </div>

                    <div className="qa-panel-foot">
                      <Link className="qa-link-btn qa-panel-link" to="/module">
                        Back to Modules
                      </Link>
                    </div>
                  </div>
                </aside>
              </section>
            )}

            {/* RESULTS */}
            {view === VIEW.RESULTS && quizBase && scoreData && (
              <section className="qa-results-wrap">
                <div className="qa-card qa-results-hero">
                  <div className="qa-results-hero-left">
                    <div className="qa-results-pill">🎉 Results</div>
                    <h2 className="qa-results-title">{quizBase.title}</h2>
                    <p className="qa-desc">
                      You scored <strong>{scoreData.correct}</strong> / <strong>{scoreData.total}</strong> (
                      <strong>{scoreData.pct}%</strong>)
                      {scoreData.unanswered > 0 && (
                        <>
                          {" "}
                          · Unanswered: <strong>{scoreData.unanswered}</strong>
                        </>
                      )}
                    </p>

                    {/* Result summary chips */}
                    <div className="qa-results-chips">
                      <span className="qa-chip qa-chip-good">⭐ Best: {bestShown}%</span>
                      <span className="qa-chip">🏆 Tier: {tierFromScore(Math.max(bestShown, scoreData.pct)).title}</span>
                      <span className="qa-chip">🚩 Flagged: {scoreData.flaggedCount}</span>
                      <span className="qa-chip">🕒 Review later: {scoreData.reviewLaterCount}</span>
                      <span className="qa-chip">🧩 Mode: {mode === "exam" ? "Exam" : "Practice"}</span>
                    </div>

                    <div className="qa-results-actions">
                      <button className="qa-secondary" onClick={() => startSelectedQuiz({ filter: "all" })}>
                        Retry
                      </button>

                      <button className="qa-primary" onClick={() => setView(VIEW.REVIEW)}>
                        Review Answers
                      </button>

                      {/* instant review modes after results */}
                      <button className="qa-secondary" onClick={() => startSelectedQuiz({ filter: "flagged" })} disabled={flaggedCountForQuiz === 0}>
                        Review Flagged
                      </button>

                      <button className="qa-secondary" onClick={() => startSelectedQuiz({ filter: "later" })} disabled={laterCountForQuiz === 0}>
                        Review Later
                      </button>

                      <button
                        className="qa-secondary"
                        onClick={() => {
                          resetAttempt();
                          setView(VIEW.DASHBOARD);
                        }}
                      >
                        Back to Quiz List
                      </button>
                    </div>
                  </div>

                  {/* Visual score ring */}
                  <div className="qa-results-hero-right">
                    <div className="qa-score-ring" aria-label={`Score ${scoreData.pct}%`}>
                      <div className="qa-score-num">{scoreData.pct}%</div>
                      <div className="qa-score-sub">Score</div>
                    </div>
                  </div>
                </div>

                 {/* Newly unlocked badges from this attempt */}
                {newBadges.length > 0 && (
                  <div className="qa-card qa-new-badges" aria-label="New badges unlocked">
                    <h3 className="qa-h3">New badges unlocked</h3>
                    <div className="qa-new-badges-grid">
                      {newBadges.map((id) => {
                        const b = BADGES.find((x) => x.id === id);
                        return (
                          <div key={id} className="qa-badge earned">
                            <div className="qa-badge-top">
                              <div className="qa-badge-title">{b?.title || id}</div>
                              <div className="qa-badge-pill">Unlocked</div>
                            </div>
                            <div className="qa-badge-desc">{b?.desc || "Nice work!"}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Results breakdown cards */}
                <div className="qa-results-grid">
                  <div className="qa-results-card">
                    <h3 className="qa-h3">Algorithm breakdown</h3>
                    <div className="qa-breakdown">
                      {Object.entries(scoreData.perAlgo).map(([algo, v]) => {
                        const pct = v.total ? Math.round((v.correct / v.total) * 100) : 0;
                        return (
                          <div className="qa-break-row" key={algo}>
                            <div className="qa-break-left">
                              <AlgoBadge algo={algo} />
                              <span className="qa-meta">
                                {v.correct}/{v.total}
                              </span>
                            </div>
                            <div className="qa-break-right">
                              <div className="qa-mini-bar">
                                <div className="qa-mini-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="qa-meta">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                 {/* Suggested revision targets */}
                  <div className="qa-results-card">
                    <h3 className="qa-h3">Next best step</h3>
                    <p className="qa-desc">
                      Your strongest improvement usually comes from revising your weakest algorithm first — then retrying.
                    </p>

                    <RevisionSuggestions
                      perAlgo={scoreData.perAlgo}
                      onOpenLesson={(algo) => lessonRoutes[algo] || "/module"}
                      AlgoBadge={AlgoBadge}
                      algoLabel={algoLabel}
                    />

                    <div className="qa-tip">
                      Tip: In practice, use <strong>Check Answer</strong> → read the hint → then open <strong>Explain why</strong>.
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* REVIEW */}
            {view === VIEW.REVIEW && quizBase && scoreData && (
              <section className="qa-card">
                <div className="qa-review-top">
                  <div>
                    <h2 className="qa-h2">Review answers</h2>
                    <p className="qa-desc">See what you chose, the correct answer, and the explanation.</p>
                  </div>

                  <div className="qa-results-actions">
                    <button className="qa-secondary" onClick={() => setView(VIEW.RESULTS)}>
                      ← Back to Results
                    </button>
                    <button
                      className="qa-secondary"
                      onClick={() => {
                        resetAttempt();
                        setView(VIEW.DASHBOARD);
                      }}
                    >
                      Quiz List
                    </button>
                  </div>
                </div>

                <div className="qa-review-list">
                  {scoreData.details.map((d, idx) => (
                    <div className={`qa-review-card ${d.isCorrect ? "correct" : "wrong"}`} key={d.q.id}>
                      <div className="qa-review-head">
                        <div className="qa-review-title">
                          <span className="qa-qnum">Q{idx + 1}</span>
                          <span className="qa-chip qa-chip-soft">{d.q.difficulty}</span>
                          <AlgoBadge algo={d.q.algo} />
                          {d.flagged && <span className="qa-chip">🚩 Flagged</span>}
                          {d.reviewLater && <span className="qa-chip">🕒 Review later</span>}
                        </div>

                        <div className={`qa-status ${d.isCorrect ? "ok" : "bad"}`}>{d.isCorrect ? "✅ Correct" : "❌ Incorrect"}</div>
                      </div>

                      <div className="qa-review-body">
                        <div className="qa-prompt">{d.q.prompt}</div>

                        <div className="qa-review-answers">
                          <div>
                            <div className="qa-small-label">Your answer</div>
                            <div className="qa-answer-chip">{renderUserAnswer(d.q, d.user)}</div>
                          </div>
                          <div>
                            <div className="qa-small-label">Correct answer</div>
                            <div className="qa-answer-chip">{renderCorrectAnswer(d.q)}</div>
                          </div>
                        </div>

                        {(d.q.whyCorrect || d.q.whyWrong) && (
                          <div className="qa-why-box">
                            <div className="qa-why-title">Explain why</div>
                            {d.q.whyCorrect && (
                              <div className="qa-why-line">
                                <strong>Why correct:</strong> {d.q.whyCorrect}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="qa-explain">
                          <strong>Explanation:</strong> {d.q.explanation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <footer className="site-footer">
        <p>© 2025 SortAcademy · Quiz & Assessment Page ·</p>
      </footer>
    </>
  );
}

// --------------------- Revision suggestions component ---------------------
// Shows the weakest 1–2 algorithms so the learner knows what to revise next
function RevisionSuggestions({ perAlgo, onOpenLesson, AlgoBadge, algoLabel }) {
  const sorted = Object.entries(perAlgo || {})
    .map(([algo, v]) => ({
      algo,
      correct: v.correct,
      total: v.total,
      pct: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2);

  if (sorted.length === 0) return null;

  return (
    <div className="qa-revision-list">
      {sorted.map((r) => (
        <div className="qa-revision-item" key={r.algo}>
          <div>
            <AlgoBadge algo={r.algo} /> <span className="qa-meta">{r.pct}%</span>
            <div className="qa-revision-hint">
              Suggestion: revise <strong>{algoLabel(r.algo)}</strong> concepts, then retry.
            </div>
          </div>
          <Link className="qa-link-btn" to={onOpenLesson(r.algo)}>
            Open lesson →
          </Link>
        </div>
      ))}
    </div>
  );
}

// --------------------- Subcomponents ---------------------
// Renders different question input UIs depending on question type
function QuestionBody({ q, value, setValue, toggleMulti, moveOrderItem }) {
  switch (q.type) {
    case "mcq":
      return (
        <fieldset className="qa-fieldset">
          <legend className="qa-legend">Choose one</legend>
          <div className="qa-options">
            {q.options.map((opt, idx) => (
              <label key={idx} className={`qa-option ${value === idx ? "selected" : ""}`}>
                <input type="radio" name={q.id} checked={value === idx} onChange={() => setValue(idx)} />
                <span className="qa-option-text">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );

    case "tf":
      return (
        <fieldset className="qa-fieldset">
          <legend className="qa-legend">Choose one</legend>
          <div className="qa-options">
            {[true, false].map((opt) => (
              <label key={String(opt)} className={`qa-option ${value === opt ? "selected" : ""}`}>
                <input type="radio" name={q.id} checked={value === opt} onChange={() => setValue(opt)} />
                <span className="qa-option-text">{opt ? "True" : "False"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );

    // Multiple-select question
    case "multi": {
      const requiredCount = Array.isArray(q.answer) ? q.answer.length : null;
      return (
        <div className="qa-options">
          {q.options.map((opt, idx) => {
            const selected = Array.isArray(value) && value.includes(idx);
            return (
              <label key={idx} className={`qa-option ${selected ? "selected" : ""}`}>
                <input type="checkbox" checked={selected} onChange={() => toggleMulti(idx)} />
                <span className="qa-option-text">{opt}</span>
              </label>
            );
          })}
          <div className="qa-hint">Select {requiredCount ? requiredCount : "all"} that apply.</div>
        </div>
      );
    }

    case "order": {    // Ordering question
      const items = value || q.items;
      return (
        <div className="qa-order">
          <div className="qa-hint">Use ↑ ↓ to reorder.</div>
          {items.map((item, idx) => (
            <div key={`${q.id}-${idx}`} className="qa-order-row">
              <div className="qa-order-item">
                <span className="qa-order-index">{idx + 1}</span>
                <span>{item}</span>
              </div>
              <div className="qa-order-actions">
                <button className="qa-mini-btn" onClick={() => moveOrderItem(idx, idx - 1)} disabled={idx === 0} aria-label="Move up">
                  ↑
                </button>
                <button
                  className="qa-mini-btn"
                  onClick={() => moveOrderItem(idx, idx + 1)}
                  disabled={idx === items.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    // Matching question
    case "match": {
      const user = value || {};
      const chosen = new Set(Object.values(user).filter(Boolean));
      return (
        <div className="qa-match">
          <div className="qa-hint">Choose the best match (each choice can be used once).</div>
          {q.left.map((l) => (
            <div className="qa-match-row" key={l}>
              <div className="qa-match-left">{l}</div>
              <select className="qa-select" value={user[l] || ""} onChange={(e) => setValue({ ...user, [l]: e.target.value })}>
                <option value="" disabled>
                  Select…
                </option>
                {q.right.map((r) => (
                  <option key={r} value={r} disabled={chosen.has(r) && user[l] !== r}>
                    {r}
                  </option>
                ))}
              </select>

              <button className="qa-mini-btn" type="button" onClick={() => setValue({ ...user, [l]: "" })} disabled={!user[l]}>
                Clear
              </button>
            </div>
          ))}
        </div>
      );
    }

    default:
      return <div className="qa-desc">Unsupported question type.</div>;
  }
}

// Feature 1 + 4: explain-why learning mode + hint-first feedback
// Shown in practice mode after clicking "Check Answer"
function FeedbackBox({ q, user, correct }) {
  const [revealWhy, setRevealWhy] = useState(false);

  // Reset explain-why toggle when question changes
  useEffect(() => {
    setRevealWhy(false);
  }, [q?.id]);

  const showHint = !correct && !!q.hint;
  const canExplainWhy = !!q.whyCorrect || !!q.whyWrong;

  return (
    <div className={`qa-feedback qa-feedback-v2 ${correct ? "ok" : "bad"}`} aria-live="polite">
      <div className="qa-feedback-banner">
        <div className="qa-feedback-status">{correct ? "✅ Correct" : "❌ Not quite"}</div>

        <div className="qa-feedback-mini">
          <span className="qa-small-label">Your answer:</span> <span className="qa-answer-chip">{renderUserAnswer(q, user)}</span>
          <span className="qa-small-label">Correct:</span> <span className="qa-answer-chip">{renderCorrectAnswer(q)}</span>
        </div>
      </div>

     {/* Hint shown for incorrect answers if available */}
      {showHint && (
        <div className="qa-hint-box">
          <strong>Hint:</strong> {q.hint}
        </div>
      )}

      {canExplainWhy && (
        <div className="qa-why-controls">
          <button type="button" className="qa-secondary qa-reveal-btn" onClick={() => setRevealWhy((p) => !p)}>
            {revealWhy ? "Hide explain why" : "Explain why"}
          </button>
        </div>
      )}

      {revealWhy && (
        <div className="qa-why-box">
          {q.whyCorrect && (
            <div className="qa-why-line">
              <strong>Why correct:</strong> {q.whyCorrect}
            </div>
          )}

          {q.type === "mcq" && q.whyWrong && (
            <div className="qa-why-list">
              <div className="qa-why-title">Why the others are wrong</div>
              {q.options.map((opt, idx) => {
                if (idx === q.answer) return null;
                const msg = q.whyWrong?.[idx];
                if (!msg) return null;
                return (
                  <div className="qa-why-item" key={idx}>
                    <strong>{opt}:</strong> {msg}
                  </div>
                );
              })}
            </div>
          )}

          {q.type === "tf" && q.whyWrong && (
            <div className="qa-why-list">
              <div className="qa-why-title">Why the other choice is wrong</div>
              {q.answer === true && q.whyWrong.false && (
                <div className="qa-why-item">
                  <strong>False:</strong> {q.whyWrong.false}
                </div>
              )}
              {q.answer === false && q.whyWrong.true && (
                <div className="qa-why-item">
                  <strong>True:</strong> {q.whyWrong.true}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="qa-feedback-explain">
        <strong>Explanation:</strong> {q.explanation}
      </div>
    </div>
  );
}

// Converts a user's raw answer into readable text for results/review display
function renderUserAnswer(q, user) {
  if (user === undefined || user === null || user === "") return "—";
  switch (q.type) {
    case "mcq":
      return q.options[user] ?? "—";
    case "tf":
      return user ? "True" : "False";
    case "multi":
      if (!Array.isArray(user)) return "—";
      return user.map((i) => q.options[i]).join(", ");
    case "order":
      if (!Array.isArray(user)) return "—";
      return user.join(" → ");
    case "match":
      if (typeof user !== "object") return "—";
      return q.left.map((l) => `${l}: ${user[l] || "—"}`).join(" | ");
    default:
      return "—";
  }
}

// Converts the correct answer into readable text for results/review display
function renderCorrectAnswer(q) {
  switch (q.type) {
    case "mcq":
      return q.options[q.answer];
    case "tf":
      return q.answer ? "True" : "False";
    case "multi":
      return q.answer.map((i) => q.options[i]).join(", ");
    case "order":
      return q.answer.join(" → ");
    case "match":
      return q.left.map((l) => `${l}: ${q.answer[l]}`).join(" | ");
    default:
      return "—";
  }
}