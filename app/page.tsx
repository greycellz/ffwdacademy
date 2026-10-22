"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "ffa-founder-bingo-v2";
const BOARD_SIZE = 5;

const members = [
  "Keith Pemberton",
  "Malti John",
  "George Nunez",
  "Abhi Jha",
  "Jessica Faith Carter",
  "Daley Gruen",
  "Manisha Priya",
  "Molly Morris",
  "Bikira Radcliffe",
  "Adrienne Heinz",
  "Shanelle Roberson",
  "Army Armstead",
  "Xavier Rivera-Lanza",
  "Audrey Fan",
  "Adele Taylor",
  "DE LU",
] as const;

const squares = [
  { id: "square-01", label: "Rewrote our pitch" },
  { id: "square-02", label: "Celebrated a tiny win" },
  { id: "square-17", label: "Snacked more than 4 times per day" },
  { id: "square-04", label: "Built a “Board” of AI Characters" },
  { id: "square-19", label: "Used “pivot” unironically" },
  { id: "square-05", label: "Talked to users" },
  { id: "square-06", label: "Changed our plan" },
  { id: "square-18", label: "Carpooled to or from the office" },
  { id: "square-08", label: "Had an aha! moment" },
  { id: "square-20", label: "Had 47 browser tabs open" },
  { id: "square-09", label: "Shipped something" },
  { id: "square-10", label: "Helped a founder" },
  { id: "square-11", label: "Asked for help" },
  { id: "square-21", label: "Said “quick question” (it wasn’t)" },
  { id: "square-12", label: "Demoed under pressure" },
  { id: "square-22", label: "Took a call from the car" },
  { id: "square-13", label: "Tried a new tool" },
  { id: "square-23", label: "Made coffee a personality trait" },
  { id: "square-14", label: "Questioned everything" },
  { id: "square-24", label: "Dozed off" },
  { id: "square-15", label: "Revisited our mission" },
  { id: "square-25", label: "Googled an acronym mid-meeting" },
  { id: "square-16", label: "Made a founder friend" },
  { id: "square-26", label: "Turned it off and on again" },
  { id: "square-27", label: "Created a skill for the first time" },
];

type Assignments = Record<string, string>;

const winningLines = [
  ...Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, column) =>
      row * BOARD_SIZE + column,
    ),
  ),
  ...Array.from({ length: BOARD_SIZE }, (_, column) =>
    Array.from({ length: BOARD_SIZE }, (_, row) =>
      row * BOARD_SIZE + column,
    ),
  ),
  Array.from(
    { length: BOARD_SIZE },
    (_, index) => index * BOARD_SIZE + index,
  ),
  Array.from(
    { length: BOARD_SIZE },
    (_, index) => index * BOARD_SIZE + (BOARD_SIZE - 1 - index),
  ),
];

const confetti = [
  ["8%", "#F5B942", "0s", "10deg"],
  ["18%", "#F17858", ".08s", "-16deg"],
  ["30%", "#FFFFFF", ".17s", "24deg"],
  ["42%", "#F17858", ".03s", "-8deg"],
  ["56%", "#F2C66E", ".13s", "18deg"],
  ["68%", "#F5B942", ".2s", "-25deg"],
  ["80%", "#FFFFFF", ".06s", "14deg"],
  ["91%", "#F17858", ".16s", "-12deg"],
];

function completedLineIndexes(selected: Set<string>) {
  return winningLines
    .map((line, index) => ({
      index,
      complete: line.every((squareIndex) =>
        selected.has(squares[squareIndex].id),
      ),
    }))
    .filter(({ complete }) => complete)
    .map(({ index }) => index);
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const time = [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return hours > 0 ? `${hours}:${time}` : time;
}

export default function FounderBingo() {
  const [currentUser, setCurrentUser] = useState("");
  const [assignments, setAssignments] = useState<Assignments>({});
  const [hydrated, setHydrated] = useState(false);
  const [celebration, setCelebration] = useState(0);
  const [activeSquareId, setActiveSquareId] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submittedTime, setSubmittedTime] = useState<number | null>(null);
  const completedRef = useRef<Set<number>>(new Set());
  const userSelectRef = useRef<HTMLSelectElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage is client-only,
     so persisted state must be restored after hydration. */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      const validIds = new Set(squares.map(({ id }) => id));
      const validMembers = new Set<string>(members);
      const restoredUser =
        typeof saved.currentUser === "string" &&
        validMembers.has(saved.currentUser)
          ? saved.currentUser
          : "";
      const restoredStartedAt =
        restoredUser &&
        typeof saved.startedAt === "number" &&
        Number.isFinite(saved.startedAt)
          ? saved.startedAt
          : restoredUser
            ? Date.now()
            : null;
      const restoredAssignments: Assignments = {};
      for (const [id, member] of Object.entries(saved.assignments ?? {})) {
        if (
          validIds.has(id) &&
          typeof member === "string" &&
          validMembers.has(member) &&
          member !== restoredUser
        ) {
          restoredAssignments[id] = member;
        }
      }
      const restoredSelected = new Set(Object.keys(restoredAssignments));
      completedRef.current = new Set(
        completedLineIndexes(restoredSelected),
      );
      setCurrentUser(restoredUser);
      setAssignments(restoredAssignments);
      setStartedAt(restoredStartedAt);
      setElapsedSeconds(
        restoredStartedAt
          ? Math.max(0, Math.floor((Date.now() - restoredStartedAt) / 1000))
          : 0,
      );
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!startedAt || showResults) return;

    const interval = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [startedAt, showResults]);

  const selected = useMemo(
    () => new Set(Object.keys(assignments)),
    [assignments],
  );

  const assignmentCounts = useMemo(
    () =>
      Object.values(assignments).reduce<Record<string, number>>(
        (counts, member) => {
          counts[member] = (counts[member] ?? 0) + 1;
          return counts;
        },
        {},
      ),
    [assignments],
  );

  const completedLines = useMemo(
    () => completedLineIndexes(selected),
    [selected],
  );

  const winningSquares = useMemo(() => {
    const ids = new Set<string>();
    completedLines.forEach((lineIndex) => {
      winningLines[lineIndex].forEach((squareIndex) =>
        ids.add(squares[squareIndex].id),
      );
    });
    return ids;
  }, [completedLines]);

  const activeSquare = squares.find(({ id }) => id === activeSquareId);

  function persist(
    nextUser: string,
    nextAssignments: Assignments,
    nextStartedAt = startedAt,
  ) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentUser: nextUser,
        assignments: nextAssignments,
        startedAt: nextStartedAt,
      }),
    );
  }

  function updateAssignments(next: Assignments, celebrate = true) {
    const nextCompleted = new Set(
      completedLineIndexes(new Set(Object.keys(next))),
    );
    const hasNewLine = [...nextCompleted].some(
      (line) => !completedRef.current.has(line),
    );
    completedRef.current = nextCompleted;
    setAssignments(next);
    persist(currentUser, next);
    if (celebrate && hasNewLine) {
      setCelebration((value) => value + 1);
    }
  }

  function changeCurrentUser(nextUser: string) {
    const nextStartedAt = nextUser ? startedAt ?? Date.now() : null;
    const nextAssignments = Object.fromEntries(
      Object.entries(assignments).filter(([, member]) => member !== nextUser),
    );
    setCurrentUser(nextUser);
    setStartedAt(nextStartedAt);
    setElapsedSeconds(
      nextStartedAt
        ? Math.max(0, Math.floor((Date.now() - nextStartedAt) / 1000))
        : 0,
    );
    setSubmittedTime(null);
    setIdentityError(false);
    setAssignments(nextAssignments);
    completedRef.current = new Set(
      completedLineIndexes(new Set(Object.keys(nextAssignments))),
    );
    persist(nextUser, nextAssignments, nextStartedAt);
  }

  function openPicker(id: string) {
    if (!currentUser) {
      setIdentityError(true);
      userSelectRef.current?.focus();
      return;
    }

    setIdentityError(false);
    setActiveSquareId(id);
  }

  function saveMatch(member: string) {
    if (!activeSquareId || !member || member === currentUser) return;
    const existingMember = assignments[activeSquareId];
    if (existingMember !== member && (assignmentCounts[member] ?? 0) >= 2) {
      return;
    }
    updateAssignments({ ...assignments, [activeSquareId]: member });
    setActiveSquareId(null);
  }

  function clearMatch() {
    if (!activeSquareId) return;
    const next = { ...assignments };
    delete next[activeSquareId];
    updateAssignments(next, false);
    setActiveSquareId(null);
  }

  function startOver() {
    if (
      !window.confirm(
        "Start over and clear every matched moment on this device?",
      )
    ) {
      return;
    }

    completedRef.current = new Set();
    setAssignments({});
    const nextStartedAt = currentUser ? Date.now() : null;
    setStartedAt(nextStartedAt);
    setElapsedSeconds(0);
    setSubmittedTime(null);
    persist(currentUser, {}, nextStartedAt);
    setCelebration(0);
    setShowResults(false);
  }

  if (showResults) {
    return (
      <main className="result-page">
        <section className="result-shell" aria-labelledby="result-title">
          <div className="result-card">
            <span className="result-starburst" aria-hidden="true">
              ✦
            </span>
            <p className="result-eyebrow">Fast Forward Academy</p>
            <h1 id="result-title">Founder Bingo!</h1>
            <div className="result-score">
              <strong>
                {selected.size} <span>/ {squares.length}</span>
              </strong>
              <p>Founder moments unlocked</p>
            </div>
            <p className="result-time">
              <span aria-hidden="true">◷</span>{" "}
              {formatDuration(submittedTime ?? elapsedSeconds)}
            </p>
            {completedLines.length > 0 && (
              <p className="result-win">BINGO achieved · {completedLines.length} line{completedLines.length === 1 ? "" : "s"}</p>
            )}
            <div className="result-divider" />
            <p className="result-closing">Still building. Still believing.</p>
            <p className="result-footer">
              Class of 2026 <span aria-hidden="true">•</span> Fast Forward Academy
            </p>
          </div>
          <div className="result-actions">
            <button type="button" onClick={() => setShowResults(false)}>
              Back to my board
            </button>
            <button className="result-reset" type="button" onClick={startOver}>
              Start over
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      {celebration > 0 && (
        <div className="confetti" key={celebration} aria-hidden="true">
          {confetti.map(([left, color, delay, rotation], index) => (
            <span
              key={index}
              style={{
                left,
                backgroundColor: color,
                animationDelay: delay,
                rotate: rotation,
              }}
            />
          ))}
        </div>
      )}

      <section className="game" aria-labelledby="page-title">
        <header className="hero">
          <p className="eyebrow">Fast Forward Academy</p>
          <h1 id="page-title">
            Look how far we’ve come<span className="title-period">.</span>
          </h1>
          <p className="subtitle">
            A little founder nostalgia. A lot of progress.
          </p>
        </header>

        <div className="progress-card">
          <div className="progress" aria-live="polite" aria-atomic="true">
            <span className="counter-chip">
              <strong>{selected.size}</strong> of {squares.length} moments
            </span>
            {startedAt && (
              <>
                <span className="progress-separator" aria-hidden="true">
                  ·
                </span>
                <span
                  className="timer"
                  aria-label={`Elapsed time ${formatDuration(elapsedSeconds)}`}
                >
                  <span className="timer-dot" aria-hidden="true" />
                  <span className="timer-digits">
                    {formatDuration(elapsedSeconds)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className={`identity-card ${identityError ? "has-error" : ""}`}>
          <div>
            <label htmlFor="current-user">First, who are you?</label>
            <p id="identity-help">Your name won’t appear as a match.</p>
          </div>
          <select
            id="current-user"
            ref={userSelectRef}
            value={currentUser}
            disabled={!hydrated}
            aria-describedby={
              identityError ? "identity-help identity-error" : "identity-help"
            }
            onChange={(event) => changeCurrentUser(event.target.value)}
          >
            <option value="">Choose your name</option>
            {members.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
          {identityError && (
            <p id="identity-error" className="identity-error" role="alert">
              Choose your name before matching a moment.
            </p>
          )}
        </div>

        <section className="game-board" aria-label="Founder Bingo board">
          <div className="bingo-header" aria-hidden="true">
            {"BINGO".split("").map((letter) => (
              <span key={letter}>{letter}</span>
            ))}
          </div>
          <div
            className={`board ${!hydrated ? "board-loading" : ""}`}
            aria-busy={!hydrated}
          >
            {squares.map(({ id, label }) => {
              const isSelected = selected.has(id);
              const isWinning = winningSquares.has(id);

              return (
                <button
                  className={`tile ${isSelected ? "selected" : ""} ${
                    isWinning ? "winner" : ""
                  }`}
                  key={id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={
                    assignments[id]
                      ? `${label} — matched with ${assignments[id]}`
                      : `${label} — choose a founder`
                  }
                  disabled={!hydrated}
                  onClick={() => openPicker(id)}
                >
                  {isSelected && (
                    <span className="tile-check" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="m5 12.5 4.2 4.2L19 7" />
                      </svg>
                    </span>
                  )}
                  <span className="tile-label">{label}</span>
                  {assignments[id] && (
                    <span className="assignee">{assignments[id]}</span>
                  )}
                </button>
              );
            })}
            <div className="mobile-blank-tile" aria-hidden="true">
              <span>★</span>
            </div>
          </div>
        </section>

        <p className="board-instruction">
          Tap a moment, match another founder. Five in a row wins!
        </p>

        {completedLines.length > 0 && (
          <div className="bingo-message show">
            <span aria-hidden="true">🎉</span>
            <p role="status">
              <strong>BINGO!</strong> Look how far you’ve come.
            </p>
          </div>
        )}

        <footer>
          <p>
            You’re not the only one. Compare your board with another founder!
          </p>
          <div className="footer-actions">
            <button
              className="submit-board"
              type="button"
              onClick={() => {
                const finalElapsed = startedAt
                  ? Math.max(
                      0,
                      Math.floor((Date.now() - startedAt) / 1000),
                    )
                  : 0;
                setElapsedSeconds(finalElapsed);
                setSubmittedTime(finalElapsed);
                setShowResults(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Submit my board
            </button>
            <button
              className="reset"
              type="button"
              onClick={startOver}
              disabled={!selected.size}
            >
              Start over
            </button>
          </div>
        </footer>
      </section>

      {activeSquare && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveSquareId(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setActiveSquareId(null);
          }}
        >
          <section
            className="match-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-dialog-title"
          >
            <button
              className="dialog-close"
              type="button"
              aria-label="Close"
              onClick={() => setActiveSquareId(null)}
            >
              ×
            </button>
            <p className="dialog-eyebrow">Who did this?</p>
            <h2 id="match-dialog-title">{activeSquare.label}</h2>
            <label htmlFor="founder-match">Choose another cohort member</label>
            <select
              id="founder-match"
              value={assignments[activeSquare.id] ?? ""}
              autoFocus
              onChange={(event) => saveMatch(event.target.value)}
            >
              <option value="">Select a founder</option>
              {members
                .filter((member) => member !== currentUser)
                .map((member) => (
                  <option
                    key={member}
                    value={member}
                    disabled={
                      assignments[activeSquare.id] !== member &&
                      (assignmentCounts[member] ?? 0) >= 2
                    }
                  >
                    {member}
                    {(assignmentCounts[member] ?? 0) >= 2 ? " — max 2" : ""}
                  </option>
                ))}
            </select>
            {assignments[activeSquare.id] && (
              <div className="dialog-actions">
                <button
                  className="clear-match"
                  type="button"
                  onClick={clearMatch}
                >
                  Clear match
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
