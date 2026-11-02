import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { submitAttempt } from "../api/practice.js";
import ChessBoard from "../components/ChessBoard.jsx";
import "./LessonsPage.css";

export default function PracticePage({ title, singular, loadExercises, revealSolution }) {
  const [lessons, setLessons] = useState(null);
  const [selected, setSelected] = useState(null);
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

  return (
    <section className="panel lessons-page">
      <h1>{title}</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {error && lessons === null && <button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>Retry loading</button>}
      {lessons === null && !error && <p>Loading {title.toLowerCase()}...</p>}
      {lessons?.length === 0 && <p className="muted">No {title.toLowerCase()} are available yet.</p>}
      {lessons?.length > 0 && !selected && <div className="lessons-list">
        <p>Choose an exercise to practise.</p>
        {lessons.map((lesson, index) => <button key={lesson.id} type="button" className="secondary-button" onClick={() => selectLesson(lesson)}>
          {singular} {index + 1}: {singular === "Lesson" && lesson.instruction.includes(":") ? lesson.instruction.split(":", 1)[0] : lesson.instruction}
        </button>)}
      </div>}
      {selected && <div className="lesson-exercise">
        <div className="lesson-board">
          <ChessBoard fen={fen} playerColor={selected.fen.split(" ")[1] === "b" ? "black" : "white"}
            isInteractive={!pending && !complete} onMove={attempt}
            onInvalidAttempt={({ sourceSquare, targetSquare }) => attempt(sourceSquare + targetSquare)} />
        </div>
        <div className="lesson-copy">
          <h2>Practice</h2>
          <p>{selected.instruction}</p>
          {pending && <p>Checking move...</p>}
          {feedback && <p role="status">{feedback}</p>}
          <div className="actions">
            {revealSolution && !complete && <button type="button" onClick={reveal} disabled={pending}>Reveal solution</button>}
            {complete && nextExercise && <button type="button" onClick={() => selectLesson(nextExercise)}>Next {singular.toLowerCase()}</button>}
            <button type="button" className="secondary-button" onClick={() => selectLesson(selected)}>Retry</button>
            <button type="button" className="secondary-button" onClick={() => selectLesson(null)}>All {title.toLowerCase()}</button>
          </div>
        </div>
      </div>}
      <p><Link to="/dashboard">Back to dashboard</Link></p>
    </section>
  );
}
