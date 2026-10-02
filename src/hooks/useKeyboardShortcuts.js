// src/hooks/useKeyboardShortcuts.js
import { useEffect } from "react";

/**
 * Reusable keyboard shortcut hook for handling global key events
 * in a consistent and accessible way across the application.
 *
 * @param {Object} shortcuts - An object mapping keyboard keys (e.code or e.key)
 * to callback handler functions.
 * @param {Array} deps - Dependency array to ensure handlers remain up-to-date.
 * @param {Object} options - Configuration options.
 * @param {boolean} options.enabled - Enables or disables shortcuts (default: true).
 * @param {boolean} options.disableWhenTyping - Prevents shortcuts when typing in input fields (default: true).
 */
export default function useKeyboardShortcuts(
  shortcuts,
  deps = [],
  options = {}
) {
  const {
    enabled = true,
    disableWhenTyping = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e) {
      if (disableWhenTyping) {
        const tag = e.target?.tagName?.toLowerCase?.() || "";
        const typing =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          e.target?.isContentEditable;

        if (typing) return;
      }

      // Prefer e.code for consistent physical key detection (e.g. Arrow keys, Space)
      const handler = shortcuts?.[e.code] || shortcuts?.[e.key];
      if (!handler) return;

      e.preventDefault();
      handler(e);
    }

    window.addEventListener("keydown", onKeyDown);
    // Cleanup event listener to prevent memory leaks
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
