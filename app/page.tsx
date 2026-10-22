"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "ffa-founder-bingo-v2";
const BOARD_SIZE = 5;

const members = [
  "Keith Pemberton",
  "Jorge Calderon",
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
  { id: "square-04", label: "Got cohort advice" },
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
  ["18%", "#8DC6A2", ".08s", "-16deg"],
  ["30%", "#FFFFFF", ".17s", "24deg"],
  ["42%", "#F08D72", ".03s", "-8deg"],
  ["56%", "#D9EEDF", ".13s", "18deg"],
  ["68%", "#F5B942", ".2s", "-25deg"],
  ["80%", "#FFFFFF", ".06s", "14deg"],
  ["91%", "#8DC6A2", ".16s", "-12deg"],
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

export default function FounderBingo() {
  const [currentUser, setCurrentUser] = useState("");
  const [assignments, setAssignments] = useState<Assignments>({});
  const [hydrated, setHydrated] = useState(false);
  const [celebration, setCelebration] = useState(0);
  const [activeSquareId, setActiveSquareId] = useState<string | null>(null);
  const [pickerValue, setPickerValue] = useState("");
  const [identityError, setIdentityError] = useState(false);
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
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selected = useMemo(
    () => new Set(Object.keys(assignments)),
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

  function persist(nextUser: string, nextAssignments: Assignments) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentUser: nextUser,
        assignments: nextAssignments,
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
    const nextAssignments = Object.fromEntries(
      Object.entries(assignments).filter(([, member]) => member !== nextUser),
    );
    setCurrentUser(nextUser);
    setIdentityError(false);
    setAssignments(nextAssignments);
    completedRef.current = new Set(
      completedLineIndexes(new Set(Object.keys(nextAssignments))),
    );
    persist(nextUser, nextAssignments);
  }

  function openPicker(id: string) {
    if (!currentUser) {
      setIdentityError(true);
      userSelectRef.current?.focus();
      return;
    }

    setIdentityError(false);
    setActiveSquareId(id);
    setPickerValue(assignments[id] ?? "");
  }

  function saveMatch() {
    if (!activeSquareId || !pickerValue || pickerValue === currentUser) return;
    updateAssignments({ ...assignments, [activeSquareId]: pickerValue });
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
    persist(currentUser, {});
    setCelebration(0);
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
          <p className="eyebrow">Fast Forward Academy · Cohort Edition</p>
          <h1 id="page-title">Look how far we’ve come.</h1>
          <p className="subtitle">
            We played Bingo when we first met. Let’s play again.
          </p>
        </header>

        <div className="status-card">
          <p>
            Tap a moment, then choose someone else who did it.{" "}
            <strong>Five in a row = BINGO!</strong>
          </p>
          <div className="progress" aria-live="polite" aria-atomic="true">
            <span className="progress-dot" aria-hidden="true" />
            <span>
              <strong>{selected.size}</strong> of {squares.length} moments
            </span>
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

        <div
          className={`board ${!hydrated ? "board-loading" : ""}`}
          aria-label="Founder Bingo board"
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
                <span className="tile-label">{label}</span>
                {assignments[id] && (
                  <span className="assignee">{assignments[id]}</span>
                )}
              </button>
            );
          })}
        </div>

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
          <button
            className="reset"
            type="button"
            onClick={startOver}
            disabled={!selected.size}
          >
            Start over
          </button>
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
              value={pickerValue}
              autoFocus
              onChange={(event) => setPickerValue(event.target.value)}
            >
              <option value="">Select a founder</option>
              {members
                .filter((member) => member !== currentUser)
                .map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
            </select>
            <div className="dialog-actions">
              {assignments[activeSquare.id] && (
                <button
                  className="clear-match"
                  type="button"
                  onClick={clearMatch}
                >
                  Clear match
                </button>
              )}
              <button
                className="save-match"
                type="button"
                disabled={!pickerValue}
                onClick={saveMatch}
              >
                Add to my board
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
