import { useEffect, useRef, useState } from "react";

import { submitAttempt } from "../api/practice.js";
import ChessBoard from "../components/ChessBoard.jsx";
import LoadingPlaceholder from "../components/LoadingPlaceholder.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StudyPagination from "../components/StudyPagination.jsx";
import UiIcon from "../components/UiIcon.jsx";
import { groupByCategory } from "../features/study/groupByCategory.js";
import "./LessonsPage.css";

const LESSON_PIECES = {
  "lesson-pawn": "♙", "lesson-knight": "♘", "lesson-bishop": "♗", "lesson-rook": "♖", "lesson-queen": "♕", "lesson-king": "♔",
  "lesson-pawn-capture": "♙", "lesson-knight-jump": "♘", "lesson-rook-capture": "♖", "lesson-bishop-capture": "♗",
  "lesson-castle-kingside": "♔", "lesson-castle-queenside": "♔", "lesson-en-passant": "♙",
  "lesson-promote-queen": "♕", "lesson-underpromotion": "♖", "lesson-escape-check": "♔", "lesson-block-check": "♗",
  "lesson-capture-checker": "♔", "lesson-give-check": "♖", "lesson-checkmate": "♕", "lesson-knight-fork": "♘",
  "lesson-absolute-pin": "♗", "lesson-skewer": "♖", "lesson-capture-attacker": "♕"
};
const PUZZLE_TITLES = { "puzzle-win-queen": "Win the queen", "puzzle-mate-one": "Find checkmate", "puzzle-promotion": "Pawn promotion" };

export default function PracticePage({ title, singular, loadExercises, revealSolution }) {
  const [lessons, setLessons] = useState(null);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const [fen, setFen] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [complete, setComplete] = useState(false);
  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    setError("");
    loadExercises().then((items) => { if (active) setLessons(items); })
      .catch((err) => { if (active) setError(`Could not load ${title.toLowerCase()}: ${err.message}`); });
    return () => { active = false; revision.current += 1; };
  }, [loadExercises, title, loadAttempt]);

  function selectLesson(lesson) {
    revision.current += 1;
    setSelected(lesson);
    setFen(lesson?.fen ?? "");
    setFeedback("");
    setError("");
    setComplete(false);
    setPending(false);
  }

  async function attempt(move) {
    if (!selected || pending || complete) return;
    const currentRevision = revision.current;
    setPending(true);
    setError("");
    setFeedback("");
    try {
      const result = await submitAttempt(selected.id, move);
      if (currentRevision !== revision.current) return;
      setFen(result.fen);
      setComplete(result.result === "correct");
      setFeedback(result.feedback || ({ illegal: "That move is not legal.", incorrect: "Not quite. Try another move.", correct: "Correct!" })[result.result]);
    } catch (err) {
      if (currentRevision === revision.current) setError(`Could not check your move: ${err.message}`);
    } finally {
      if (currentRevision === revision.current) setPending(false);
    }
  }

  async function reveal() {
    if (!selected || pending || complete) return;
    const currentRevision = revision.current;
    setPending(true);
    setError("");
    try {
      const solution = await revealSolution(selected.id);
      if (currentRevision !== revision.current) return;
      setFen(solution.fen);
      setComplete(true);
      setFeedback(`Solution: ${solution.move_uci}${solution.explanation ? ` — ${solution.explanation}` : ""}`);
    } catch (err) {
      if (currentRevision === revision.current) setError(`Could not reveal the solution: ${err.message}`);
    } finally {
      if (currentRevision === revision.current) setPending(false);
    }
  }

  const selectedIndex = lessons?.findIndex((item) => item.id === selected?.id) ?? -1;
  const nextExercise = selectedIndex >= 0 ? lessons[selectedIndex + 1] : null;
  const pageSize = 9;
  const pageCount = Math.max(1, Math.ceil((lessons?.length ?? 0) / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const groups = groupByCategory(lessons?.slice(currentPage * pageSize, (currentPage + 1) * pageSize) ?? [], singular === "Lesson" ? "Lessons" : "Exercises");

  return (
    <section className={`study-page${selected ? " study-page--detail" : " study-catalog-page"}`}>
      <PageHeader eyebrow="LEARN & PRACTISE" title={title} description={singular === "Lesson" ? "Practise the rules, king safety and basic tactics, one move at a time." : "Find the right move in each position."}
        backToList={selected ? { label: `All ${title.toLowerCase()}`, onClick: () => selectLesson(null) } : null} />
      {error && <p className="error" role="alert">{error}</p>}
      {error && lessons === null && <button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>Retry loading</button>}
      {lessons === null && !error && <LoadingPlaceholder variant="cards" count={singular === "Lesson" ? 6 : 3} label={`Loading ${title.toLowerCase()}`} />}
      {lessons?.length === 0 && <p className="muted">No {title.toLowerCase()} are available yet.</p>}
      {lessons?.length > 0 && !selected && <><div className="study-catalog-scroll" key={currentPage}>{groups.map(({ category, entries }) => <section className="study-group" key={category}>
        <h2 className="study-group-title">{category}</h2>
        <div className="study-cards">{entries.map(({ item: lesson, index: pageIndex }) => {
          const index = currentPage * pageSize + pageIndex;
          const label = singular === "Lesson" && lesson.instruction.includes(":") ? lesson.instruction.split(":", 1)[0] : lesson.instruction;
          const cardTitle = singular === "Lesson" ? (lesson.title ?? label) : (PUZZLE_TITLES[lesson.id] ?? `Puzzle ${index + 1}`);
          return <button key={lesson.id} type="button" className="study-card" aria-label={`${singular} ${index + 1}: ${cardTitle}`} onClick={() => selectLesson(lesson)}>
            <span className="study-card-art" aria-hidden="true">{singular === "Lesson" ? (LESSON_PIECES[lesson.id] ?? "♟") : <UiIcon name="spark" />}</span>
            <span className="study-card-content"><span className="study-card-index">{singular} {String(index + 1).padStart(2, "0")}</span><strong>{cardTitle}</strong>
              <span className="study-card-meta">{singular === "Lesson" ? `${lesson.category ?? "Practice"} · One move` : `${lesson.fen.split(" ")[1] === "b" ? "Black" : "White"} to move · One move`}</span></span>
            <UiIcon name="arrow" className="study-card-arrow" />
          </button>;
        })}</div>
      </section>)}</div><StudyPagination page={currentPage} pageCount={pageCount} onChange={setPage} /></>}
      {selected && <>
        <div className="lesson-exercise">
          <div className="lesson-board"><ChessBoard fen={fen} playerColor={selected.fen.split(" ")[1] === "b" ? "black" : "white"}
            isInteractive={!pending && !complete} onMove={attempt}
            onInvalidAttempt={({ sourceSquare, targetSquare }) => attempt(sourceSquare + targetSquare)} /></div>
          <div className="lesson-copy">
            <span className="study-card-index">{singular} {String(selectedIndex + 1).padStart(2, "0")} / {String(lessons.length).padStart(2, "0")}</span>
            <h2>{singular === "Lesson" ? (selected.title ?? selected.instruction.split(":", 1)[0]) : (PUZZLE_TITLES[selected.id] ?? "Find the move")}</h2>
            <p className="study-instruction">{selected.instruction}</p>
            {pending && <p className="study-feedback">Checking move...</p>}
            {feedback && <p className={`study-feedback${complete ? " is-success" : ""}`} role="status">{feedback}</p>}
            <div className="actions study-actions">
              {revealSolution && !complete && <button type="button" className="secondary-button" onClick={reveal} disabled={pending}>Reveal solution</button>}
              {complete && nextExercise && <button type="button" onClick={() => selectLesson(nextExercise)}>Next {singular.toLowerCase()} <UiIcon name="arrow" /></button>}
              <button type="button" className="secondary-button" onClick={() => selectLesson(selected)}><UiIcon name="refresh" /> Retry</button>
            </div>
          </div>
        </div>
      </>}
    </section>
  );
}
