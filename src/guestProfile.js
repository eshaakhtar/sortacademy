// src/guestProfile.js
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import styles from "./guestProfile.module.css";
import "./style.css";

/* ============================================================
  Guest Profiles (local-only, ethics-safe)

   Behaviour:
   Profile does NOT auto-open the modal on app load (so Landing stays clean)
   Modal opens only when:
      - Module page decides to open it (based on active profile / shared mode)
      - User clicks ProfileChip (switch)

  Shared Device Mode:
  - Stored in localStorage
  - When enabled, Module page can choose to prompt every time Module loads
============================================================ */

const LS_PROFILES = "sa_profiles_v3";
const LS_ACTIVE_ID = "sa_active_profile_id_v3";
const LS_SHARED_DEVICE = "sa_shared_device_mode_v1";

const MAX_NICKNAME_LEN = 24;
const MAX_EVENTS = 50;

/* ---------------- Safe storage helpers ---------------- */
// Safely parse JSON from localStorage without crashing if stored data is invalid
function safeJSONParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// Safely read a value from localStorage and fall back if storage is unavailable
function safeGetItem(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

// Safely save a value to localStorage and return whether the operation succeeded
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/* ---------------- Utils ---------------- */
// Generate a unique identifier for each guest profile
function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "g_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// Return the current time in ISO format for timestamps
function nowISO() {
  return new Date().toISOString();
}

// Clean and limit the nickname entered by the user
function normaliseNickname(nickname) {
  return (nickname || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_NICKNAME_LEN);
}

// Ensure a profile always has the correct structure before use or storage
function ensureProfileShape(p) {
  const progress = p?.progress || {};
  return {
    id: String(p?.id || uuid()),
    nickname: String(p?.nickname || "Guest"),
    points: Number(p?.points || 0),
    badges: Array.isArray(p?.badges) ? p.badges : [],
    progress: {
      lessons:
        progress.lessons && typeof progress.lessons === "object" ? progress.lessons : {},
      quizzes:
        progress.quizzes && typeof progress.quizzes === "object" ? progress.quizzes : {},
    },
    events: Array.isArray(p?.events) ? p.events : [],
    createdAt: p?.createdAt || nowISO(),
    updatedAt: p?.updatedAt || p?.createdAt || nowISO(),
  };
}

/* ---------------- Storage load/save ---------------- */
// Load all saved guest profiles from localStorage and normalise their structure
function loadProfiles() {
  const raw = safeGetItem(LS_PROFILES, "{}");
  const parsed = safeJSONParse(raw, {});
  const next = {};
  if (parsed && typeof parsed === "object") {
    for (const [id, p] of Object.entries(parsed)) {
      next[id] = ensureProfileShape({ ...p, id: p?.id || id });
    }
  }
  return next;
}

// Save the full profile collection to localStorage
function saveProfiles(profiles) {
  safeSetItem(LS_PROFILES, JSON.stringify(profiles));
}

// Load the currently active guest profile ID from localStorage
function loadActiveId() {
  return safeGetItem(LS_ACTIVE_ID, "") || "";
}

// Save the currently active guest profile ID to localStorage
function saveActiveId(id) {
  safeSetItem(LS_ACTIVE_ID, id || "");
}

// Load whether shared device mode is enabled
function loadSharedDeviceMode() {
  // OFF by default
  const raw = safeGetItem(LS_SHARED_DEVICE, "false");
  return raw === "true";
}

// Save the shared device mode preference
function saveSharedDeviceMode(v) {
  safeSetItem(LS_SHARED_DEVICE, String(!!v));
}

// Check whether a nickname is already in use on this device
function nicknameTaken(name, profiles) {
  const lower = name.toLowerCase();
  return Object.values(profiles || {}).some(
    (p) => (p.nickname || "").toLowerCase() === lower
  );
}

// Generate a default guest nickname that does not clash with existing profiles
function makeGuestName(profiles) {
  for (let i = 1; i < 1000; i++) {
    const candidate = `Guest${String(i).padStart(2, "0")}`;
    if (!nicknameTaken(candidate, profiles)) return candidate;
  }
  return `Guest${Math.floor(Math.random() * 9999)}`;
}

/* ---------------- Context ---------------- */
const GuestCtx = createContext(null);

// Custom hook for accessing guest profile data and actions from context
export function useGuestProfile() {
  const ctx = useContext(GuestCtx);
  if (!ctx) throw new Error("useGuestProfile must be used inside <GuestProfileProvider>");
  return ctx;
}

export function GuestProfileProvider({ children }) {
  const [profiles, setProfiles] = useState(() =>
    typeof window !== "undefined" ? loadProfiles() : {}
  );
  const [activeId, setActiveId] = useState(() =>
    typeof window !== "undefined" ? loadActiveId() : ""
  );
  const [sharedDeviceMode, setSharedDeviceMode] = useState(() =>
    typeof window !== "undefined" ? loadSharedDeviceMode() : false
  );

  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Persist
  useEffect(() => {
    if (typeof window !== "undefined") saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    if (typeof window !== "undefined") saveActiveId(activeId);
  }, [activeId]);

  useEffect(() => {
    if (typeof window !== "undefined") saveSharedDeviceMode(sharedDeviceMode);
  }, [sharedDeviceMode]);

  const activeProfile = useMemo(() => {
    if (!activeId) return null;
    return profiles[activeId] || null;
  }, [profiles, activeId]);


  // If localStorage activeId points to a deleted profile, open the modal to recover.
  useEffect(() => {
    if (activeId && !profiles[activeId]) {
      setActiveId("");
      setSwitcherOpen(true);
    }
  }, [activeId, profiles]);

  const openSwitcher = useCallback(() => setSwitcherOpen(true), []);
  const closeSwitcher = useCallback(() => setSwitcherOpen(false), []);

  function pushEvent(p, type, meta = {}) {
    const events = [...(p.events || []), { type, meta, at: nowISO() }];
    return { ...p, events: events.slice(-MAX_EVENTS) };
  }

  // Create a new named guest profile and make it the active profile
  function createProfile(nickname) {
    const name = normaliseNickname(nickname);
    if (!name) return { ok: false, error: "Please enter a nickname." };
    if (nicknameTaken(name, profiles)) {
      return { ok: false, error: "That nickname is already taken on this device." };
    }

    const id = uuid();

    let newProfile = ensureProfileShape({
      id,
      nickname: name,
      points: 0,
      badges: [],
      progress: { lessons: {}, quizzes: {} },
      events: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    newProfile = pushEvent(newProfile, "PROFILE_CREATED");

    setProfiles((prev) => ({ ...prev, [id]: newProfile }));
    setActiveId(id);
    setSwitcherOpen(false);

    return { ok: true, id };
  }

  // Create a new named guest profile and make it the active profile
  function continueAsGuest({ silent = false } = {}) {
    const id = uuid();
    const guestName = makeGuestName(profiles);

    let newProfile = ensureProfileShape({
      id,
      nickname: guestName,
      points: 0,
      badges: [],
      progress: { lessons: {}, quizzes: {} },
      events: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    newProfile = pushEvent(newProfile, silent ? "GUEST_AUTO_CREATED" : "GUEST_QUICK_START");

    setProfiles((prev) => ({ ...prev, [id]: newProfile }));
    setActiveId(id);
    setSwitcherOpen(false);

    return { ok: true, id };
  }

  // Switch the active profile to an existing saved profile
  function selectProfile(id) {
    if (!profiles[id]) return;
    setActiveId(id);
    setSwitcherOpen(false);
  }

  // Delete a saved profile from this device
  function deleteProfile(id) {
    setProfiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (id === activeId) {
      setActiveId("");
      setSwitcherOpen(true);
    }
  }

  // Reset the active profile's points, badges, and progress while keeping the profile itself
  function resetActiveProfile() {
    if (!activeProfile) return;
    const id = activeProfile.id;

    setProfiles((prev) => {
      const p = prev[id];
      if (!p) return prev;

      let nextP = ensureProfileShape({
        ...p,
        points: 0,
        badges: [],
        progress: { lessons: {}, quizzes: {} },
        updatedAt: nowISO(),
      });

      nextP = pushEvent(nextP, "PROFILE_RESET");
      return { ...prev, [id]: nextP };
    });
  }

  // Add points to the active profile and record the reason in the event log
  function addPoints(amount, reason = "POINTS") {
    if (!activeProfile) return;
    const id = activeProfile.id;
    const n = Number(amount) || 0;
    if (!n) return;

    setProfiles((prev) => {
      const p = prev[id];
      if (!p) return prev;

      let nextP = ensureProfileShape({
        ...p,
        points: Math.max(0, (p.points || 0) + n),
        updatedAt: nowISO(),
      });

      nextP = pushEvent(nextP, "POINTS_AWARDED", { amount: n, reason });
      return { ...prev, [id]: nextP };
    });
  }

  // Award a badge to the active profile, optionally adding bonus points
  function awardBadge(badgeId, opts = {}) {
    if (!activeProfile) return { awarded: false, reason: "no_active_profile" };

    const alreadyHas = (activeProfile.badges || []).includes(badgeId);
    if (alreadyHas) return { awarded: false, reason: "already_awarded" };

    const id = activeProfile.id;
    const points = Number(opts.points || 0);

    setProfiles((prev) => {
      const p = prev[id];
      if (!p) return prev;

      const nextBadges = [...(p.badges || []), badgeId];

      let nextP = ensureProfileShape({
        ...p,
        badges: nextBadges,
        points: Math.max(0, (p.points || 0) + points),
        updatedAt: nowISO(),
      });

      nextP = pushEvent(nextP, "BADGE_AWARDED", { badgeId, points });
      return { ...prev, [id]: nextP };
    });

    return { awarded: true };
  }

  // Mark a lesson as completed and optionally award a badge and points
  function markLessonComplete(lessonKey, opts = {}) {
    if (!activeProfile) return { ok: false, reason: "no_active_profile" };
    const already = !!activeProfile.progress?.lessons?.[lessonKey];
    if (already) return { ok: false, reason: "already_completed" };

    const id = activeProfile.id;
    const badgeId = opts.badgeId || null;
    const points = Number(opts.points || 0);

    setProfiles((prev) => {
      const p = prev[id];
      if (!p) return prev;

      const lessons = { ...(p.progress?.lessons || {}), [lessonKey]: true };
      const quizzes = { ...(p.progress?.quizzes || {}) };

      const badges =
        badgeId && !(p.badges || []).includes(badgeId)
          ? [...(p.badges || []), badgeId]
          : p.badges || [];

      let nextP = ensureProfileShape({
        ...p,
        progress: { lessons, quizzes },
        badges,
        points: Math.max(0, (p.points || 0) + points),
        updatedAt: nowISO(),
      });

      nextP = pushEvent(nextP, "LESSON_COMPLETED", { lessonKey, badgeId, points });
      return { ...prev, [id]: nextP };
    });

    return { ok: true };
  }

  // Build a leaderboard ranked by points, then badge count, then most recent activity
  const leaderboard = useMemo(() => {
    const arr = Object.values(profiles || {}).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      points: p.points || 0,
      badges: (p.badges || []).length,
      updatedAt: p.updatedAt || p.createdAt || "",
    }));

    arr.sort(
      (a, b) =>
        (b.points - a.points) ||
        (b.badges - a.badges) ||
        b.updatedAt.localeCompare(a.updatedAt)
    );

    return arr.slice(0, 10);
  }, [profiles]);

  // Build a list of saved profiles sorted by most recently updated
  const profileList = useMemo(() => {
    const arr = Object.values(profiles || {});
    arr.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    return arr;
  }, [profiles]);

  // Expose guest profile state and actions through the context provider
  const value = {
    profiles,
    profileList,
    activeId,
    activeProfile,
    leaderboard,

    switcherOpen,
    openSwitcher,
    closeSwitcher,

    sharedDeviceMode,
    setSharedDeviceMode,

    createProfile,
    continueAsGuest,
    selectProfile,
    deleteProfile,
    resetActiveProfile,

    addPoints,
    awardBadge,
    markLessonComplete,
  };

  return (
    <GuestCtx.Provider value={value}>
      <ProfileSwitcherModal />
      {children}
    </GuestCtx.Provider>
  );
}

/* ============================================================
  UI: Profile Chip
============================================================ */
// Small button shown in the UI for opening the profile switcher modal
export function ProfileChip() {
  const { activeProfile, openSwitcher } = useGuestProfile();

  return (
    <button
      type="button"
      onClick={openSwitcher}
      className={styles.profileChip}
      aria-label="Open profile switcher"
      title="Switch profile"
    >
      <span className={styles.profileChipIcon} aria-hidden="true">
        👤
      </span>
      <span className={styles.profileChipName}>
        {activeProfile ? activeProfile.nickname : "Choose profile"}
      </span>
      <span className={styles.profileChipMeta}>
        ⭐ {activeProfile ? activeProfile.points || 0 : 0}
      </span>
      <span className={styles.profileChipMeta} aria-hidden="true">
        ↔
      </span>
    </button>
  );
}

/* ============================================================
  UI: Profile Switcher Modal
============================================================ */
function ProfileSwitcherModal() {
  const {
    profileList,
    activeId,
    leaderboard,
    switcherOpen,
    closeSwitcher,
    createProfile,
    continueAsGuest,
    selectProfile,
    deleteProfile,
    resetActiveProfile,
    profiles,
    sharedDeviceMode,
    setSharedDeviceMode,
  } = useGuestProfile();

  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (switcherOpen) {
      setError("");
      setNickname("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [switcherOpen]);

  // Close behaviour:
  // - If no active profile and there ARE existing profiles -> keep modal open (force selection)
  // - If no profiles exist at all -> create a silent Guest so site can proceed
  const onClose = useCallback(() => {
    if (!activeId) {
      const hasAnyProfiles = Object.keys(profiles || {}).length > 0;
      if (hasAnyProfiles) return;
      continueAsGuest({ silent: true });
      return;
    }
    closeSwitcher();
  }, [activeId, profiles, continueAsGuest, closeSwitcher]);

  useEffect(() => {
    if (!switcherOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [switcherOpen, onClose]);

  if (!switcherOpen) return null;

  // Try to create a profile using the entered nickname and show validation errors if needed
  function onCreate() {
    setError("");
    const res = createProfile(nickname);
    if (!res.ok) setError(res.error || "Could not create profile.");
  }

  // Ask for confirmation before permanently deleting a saved profile
  function onDeleteProfile(p) {
    const ok = window.confirm(
      `Delete profile "${p.nickname}"?\n\nThis removes points and badges from this device.`
    );
    if (!ok) return;
    deleteProfile(p.id);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gp-title"
      aria-describedby="gp-desc"
      className={styles.overlay}
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon} aria-hidden="true">
              🏅
            </div>
            <div>
              <h2 id="gp-title" className={styles.title}>
                Guest Profiles
              </h2>
              <p id="gp-desc" className={styles.subtitle}>
                Track <b>badges</b> and <b>points</b> locally (no email, no identity).
              </p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <label className={styles.startupToggle}>
              <input
                type="checkbox"
                checked={sharedDeviceMode}
                onChange={(e) => setSharedDeviceMode(e.target.checked)}
              />
              <span>
                Ask for profile on startup
                <span className={styles.toggleHelp}> — recommended for labs/shared PCs</span>
              </span>
            </label>

            <button type="button" className={styles.btnSecondary} onClick={onClose} title="Close">
              Close ✕
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {/* Left */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Start</h3>

            {!activeId && Object.keys(profiles || {}).length > 0 && (
              <p className={styles.muted} style={{ marginTop: 8 }}>
                Select a profile below to continue (shared device mode).
              </p>
            )}

            <div className={styles.row}>
              <input
                ref={inputRef}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname (e.g., SortingNinja42)"
                className={styles.input}
                aria-label="Nickname"
              />
              <button type="button" onClick={onCreate} className={styles.btnPrimary}>
                Continue
              </button>
            </div>

            <div className={styles.rowSmall}>
              <button
                type="button"
                onClick={() => continueAsGuest({ silent: false })}
                className={styles.btnGhost}
              >
                Continue without nickname
              </button>
              <span className={styles.mutedSmall}>(You can create a named profile later.)</span>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <hr className={styles.hr} />

            <h3 className={styles.cardTitle}>Profiles on this device</h3>

            {profileList.length === 0 ? (
              <p className={styles.muted}>No profiles yet. Create one above or continue as guest.</p>
            ) : (
              <div className={styles.profileList}>
                {profileList.map((p) => {
                  const isActive = p.id === activeId;
                  return (
                    <div
                      key={p.id}
                      className={`${styles.profileCard} ${isActive ? styles.profileCardActive : ""}`}
                    >
                      <div className={styles.profileMain}>
                        <div className={styles.avatar} aria-hidden="true">
                          {(p.nickname || "G").slice(0, 1).toUpperCase()}
                        </div>

                        <div className={styles.profileInfo}>
                          <div className={styles.profileTopLine}>
                            <span className={styles.profileName}>{p.nickname}</span>
                            {isActive && <span className={styles.pill}>Active</span>}
                          </div>
                          <div className={styles.profileMeta}>
                            ⭐ {p.points || 0} points • 🏅 {(p.badges || []).length} badges
                          </div>
                        </div>
                      </div>

                      <div className={styles.profileActions}>
                        <button
                          type="button"
                          onClick={() => selectProfile(p.id)}
                          className={styles.btnPrimarySmall}
                        >
                          Select
                        </button>

                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => onDeleteProfile(p)}
                            className={styles.btnDangerSmall}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={styles.footerRow}>
              <button type="button" onClick={resetActiveProfile} className={styles.btnSecondary}>
                Reset active profile
              </button>
            </div>
          </div>

          {/* Right */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Local Leaderboard (this device)</h3>
            <p className={styles.muted}>Scores are calculated from profiles stored on this device only.</p>

            <div className={styles.leaderboard}>
              {leaderboard.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon} aria-hidden="true">
                    📈
                  </div>
                  <div>
                    <div className={styles.emptyTitle}>No scores yet</div>
                    <div className={styles.mutedSmall}>Complete a lesson or quiz to earn points.</div>
                  </div>
                </div>
              ) : (
                leaderboard.map((row, idx) => {
                  const isYou = row.id === activeId;
                  return (
                    <div
                      key={row.id}
                      className={`${styles.leaderRow} ${isYou ? styles.leaderRowYou : ""}`}
                    >
                      <div className={styles.leaderLeft}>
                        <span className={styles.rank}>#{idx + 1}</span>
                        <span className={styles.leaderName}>
                          {row.nickname} {isYou ? <span className={styles.you}>(You)</span> : null}
                        </span>
                      </div>
                      <div className={styles.leaderRight}>
                        ⭐ {row.points} • 🏅 {row.badges}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.tip}>
              Tip: For ethics-safe testing, use nicknames (not real names). This data never leaves the device.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
