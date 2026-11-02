import { useEffect, useMemo, useRef, useState } from "react";

import { getPuzzleHint, getPuzzleSolution, getPuzzles, submitPuzzleMove } from "../api/practice.js";
import ChessBoard from "../components/ChessBoard.jsx";
import LoadingPlaceholder from "../components/LoadingPlaceholder.jsx";
import PageHeader from "../components/PageHeader.jsx";
import UiIcon from "../components/UiIcon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { loadPuzzleProgress, savePuzzleProgress } from "../features/puzzles/puzzleProgress.js";
import "./LessonsPage.css";
import "./PuzzlesPage.css";

const PAGE_SIZE = 12;
const TITLES = { "puzzle-win-queen": "Win the queen", "puzzle-mate-one": "Find checkmate", "puzzle-promotion": "Pawn promotion" };

function browserStorage() {
  try { return window.localStorage; } catch { return null; }
}

export default function PuzzlesPage() {
  const { user } = useAuth();
  const userId = user?.id == null ? null : String(user.id);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selected, setSelected] = useState(null);
  const [fen, setFen] = useState("");
  const [moves, setMoves] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [hint, setHint] = useState("");
  const [status, setStatus] = useState("playing");
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [progress, setProgress] = useState(() => loadPuzzleProgress(browserStorage(), user?.id));
  const revision = useRef(0);
  const completed = useMemo(() => new Set(progress.userId === userId ? progress.completed : []), [progress, userId]);

  useEffect(() => {
    let active = true;
    setError("");
    getPuzzles().then((items) => { if (active) setCatalog(items); })
      .catch((err) => { if (active) setError(`Could not load puzzles: ${err.message}`); });
    return () => { active = false; revision.current += 1; };
  }, [loadAttempt]);

  useEffect(() => {
    function refresh() { setProgress(loadPuzzleProgress(browserStorage(), user?.id)); }
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [user?.id]);

  function selectPuzzle(puzzle) {
    revision.current += 1;
    setSelected(puzzle);
    setFen(puzzle?.fen ?? "");
    setMoves([]);
    setFeedback("");
    setHint("");
    setError("");
    setStatus("playing");
    setPending(false);
  }

  function markSolved(id) {
    const storage = browserStorage();
    const saved = loadPuzzleProgress(storage, user?.id);
    const current = progress.userId === userId ? progress.completed : [];
    const next = [...new Set([...saved.completed, ...current, id])];
    const persistent = savePuzzleProgress(storage, user?.id, next);
    setProgress({ userId, completed: next, persistent });
  }

  async function attempt(move) {
    if (!selected || pending || status !== "playing") return;
    const currentRevision = revision.current;
    setPending(true);
    setError("");
    setFeedback("");
    try {
      const result = await submitPuzzleMove(selected.id, moves, move);
      if (currentRevision !== revision.current) return;
      setFen(result.fen);
      if (result.result === "correct") {
        setHint("");
        if (result.complete) {
          setStatus("solved");
          setFeedback(result.feedback || "Puzzle solved!");
          markSolved(selected.id);
        } else {
          setMoves((previous) => [...previous, move]);
          setFeedback(`Correct! Opponent played ${result.opponent_move}. Find the next move.`);
        }
      } else {
        setFeedback(result.feedback || (result.result === "illegal" ? "That move is not legal." : "Not quite. Try another move."));
      }
    } catch (err) {
      if (currentRevision === revision.current) setError(`Could not check your move: ${err.message}`);
    } finally {
      if (currentRevision === revision.current) setPending(false);
    }
  }

  async function showHint() {
    if (!selected || pending || status !== "playing") return;
    const currentRevision = revision.current;
    setPending(true);
    setError("");
    try {
      const result = await getPuzzleHint(selected.id, moves);
      if (currentRevision === revision.current) setHint(`Hint: consider the ${result.piece} on ${result.square}.`);
    } catch (err) {
      if (currentRevision === revision.current) setError(`Could not load a hint: ${err.message}`);
    } finally {
      if (currentRevision === revision.current) setPending(false);
    }
  }

  async function reveal() {
    if (!selected || pending || status !== "playing") return;
    const currentRevision = revision.current;
    setPending(true);
    setError("");
    try {
      const result = await getPuzzleSolution(selected.id, moves);
      if (currentRevision !== revision.current) return;
      setFen(result.fen);
      setStatus("revealed");
      setHint("");
      setFeedback(`Solution: ${result.moves.join(" ")}${result.explanation ? ` — ${result.explanation}` : ""} Retry to solve it yourself.`);
    } catch (err) {
      if (currentRevision === revision.current) setError(`Could not reveal the solution: ${err.message}`);
    } finally {
      if (currentRevision === revision.current) setPending(false);
    }
  }

  const completedCount = catalog?.filter((puzzle) => completed.has(puzzle.id)).length ?? 0;
  const visible = catalog?.filter((puzzle) => filter === "all" || (filter === "solved" ? completed.has(puzzle.id) : !completed.has(puzzle.id))) ?? [];
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const selectedIndex = catalog?.findIndex((puzzle) => puzzle.id === selected?.id) ?? -1;
  const nextPuzzle = selectedIndex >= 0 ? catalog[selectedIndex + 1] : null;
  const storageWarning = progress.userId === userId && !progress.persistent;

  return <section className={`study-page puzzles-page${selected ? " study-page--detail" : ""}`}>
    <PageHeader eyebrow="LEARN & PRACTISE" title="Puzzles" description="Find the best continuation in each position."
      backToList={selected ? { label: "All puzzles", onClick: () => selectPuzzle(null) } : null} />
    {storageWarning && <p className="puzzle-warning" role="status">Progress could not be saved in this browser. You can still solve puzzles.</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {error && catalog === null && <button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>Retry loading</button>}
    {catalog === null && !error && <LoadingPlaceholder variant="cards" count={3} label="Loading puzzles" />}
    {catalog?.length === 0 && <p className="muted">No puzzles are available yet.</p>}
    {catalog?.length > 0 && !selected && <>
      <div className="puzzle-summary">
        <div><strong>{completedCount} / {catalog.length} solved</strong><p className="muted">Hints are allowed. Progress is saved in this browser for your account.</p></div>
        <button type="button" onClick={() => selectPuzzle(catalog.find((puzzle) => !completed.has(puzzle.id)) ?? catalog[0])}>Start next unsolved <UiIcon name="arrow" /></button>
      </div>
      <div className="puzzle-filters" role="group" aria-label="Filter puzzles">
        {[["all", "All"], ["new", "Unsolved"], ["solved", "Solved"]].map(([value, label]) => <button key={value} type="button"
          className={filter === value ? "is-active" : ""} aria-pressed={filter === value}
          onClick={() => { setFilter(value); setPage(0); }}>{label}</button>)}
      </div>
      {visible.length === 0 ? <p className="muted">No puzzles match this filter.</p> : <>
        <div className="study-cards">
          {visible.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((puzzle) => {
            const index = catalog.indexOf(puzzle);
            return <button key={puzzle.id} type="button" className="study-card" aria-label={`Puzzle ${index + 1}: ${puzzle.instruction}`}
              onClick={() => selectPuzzle(puzzle)}>
              <span className="study-card-art" aria-hidden="true"><UiIcon name="spark" /></span>
              <span className="study-card-content"><span className="study-card-index">Puzzle {String(index + 1).padStart(2, "0")}</span>
                <strong>{TITLES[puzzle.id] ?? "Find the move"}</strong>
                <span className="study-card-meta">{puzzle.fen.split(" ")[1] === "b" ? "Black" : "White"} to move{puzzle.rating != null ? ` · Lichess ${puzzle.rating}` : ""} · {completed.has(puzzle.id) ? "Solved" : "Unsolved"}</span>
              </span><UiIcon name="arrow" className="study-card-arrow" />
            </button>;
          })}
        </div>
        <div className="puzzle-pagination"><button type="button" className="secondary-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span>Page {currentPage + 1} / {pageCount}</span>
          <button type="button" className="secondary-button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div>
      </>}
    </>}
    {selected && <>
      <div className="lesson-exercise">
        <div className="lesson-board"><ChessBoard fen={fen} playerColor={selected.fen.split(" ")[1] === "b" ? "black" : "white"}
          isInteractive={!pending && status === "playing"} onMove={attempt}
          onInvalidAttempt={({ sourceSquare, targetSquare }) => attempt(sourceSquare + targetSquare)} /></div>
        <div className="lesson-copy">
          <span className="study-card-index">Puzzle {selectedIndex + 1} / {catalog.length} · {completedCount} solved</span>
          <h2>{TITLES[selected.id] ?? "Find the move"}</h2>
          <p className="study-instruction">{selected.instruction}{selected.rating != null ? ` Lichess puzzle rating: ${selected.rating}.` : ""}</p>
          {pending && <p className="study-feedback">Checking...</p>}
          {hint && <p className="study-feedback" role="status">{hint}</p>}
          {feedback && <p className={`study-feedback${status === "solved" ? " is-success" : ""}`} role="status">{feedback}</p>}
          <div className="actions study-actions">
            {status === "playing" && <><button type="button" className="secondary-button" onClick={showHint} disabled={pending}>Hint</button>
              <button type="button" className="secondary-button" onClick={reveal} disabled={pending}>Reveal solution</button></>}
            {status !== "playing" && nextPuzzle && <button type="button" onClick={() => selectPuzzle(nextPuzzle)}>Next puzzle <UiIcon name="arrow" /></button>}
            <button type="button" className="secondary-button" onClick={() => selectPuzzle(selected)}><UiIcon name="refresh" /> Retry</button>
          </div>
          {status !== "playing" && selected.source_url && <p className="puzzle-source"><a href={selected.source_url} target="_blank" rel="noreferrer noopener">View original puzzle on Lichess</a></p>}
        </div>
      </div>
    </>}
  </section>;
}
