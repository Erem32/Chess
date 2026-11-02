import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getLessons, submitAttempt } from "../api/practice.js";
import ChessBoard from "../components/ChessBoard.jsx";
import "./LessonsPage.css";

export default function LessonsPage() {
  const [lessons, setLessons] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fen, setFen] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    getLessons().then((items) => { if (active) setLessons(items); })
      .catch((err) => { if (active) setError(`Could not load lessons: ${err.message}`); });
    return () => { active = false; revision.current += 1; };
  }, []);

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

  return (
    <section className="panel lessons-page">
      <h1>Lessons</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {lessons === null && !error && <p>Loading lessons...</p>}
      {lessons?.length === 0 && <p className="muted">No lessons are available yet.</p>}
      {lessons?.length > 0 && !selected && <div className="lessons-list">
        <p>Choose an exercise to practise.</p>
        {lessons.map((lesson, index) => <button key={lesson.id} type="button" className="secondary-button" onClick={() => selectLesson(lesson)}>
          Lesson {index + 1}: {lesson.instruction}
        </button>)}
      </div>}
      {selected && <div className="lesson-exercise">
        <div className="lesson-board">
          <ChessBoard fen={fen} playerColor={selected.fen.split(" ")[1] === "b" ? "black" : "white"}
            isInteractive={!pending && !complete} onMove={attempt}
            onInvalidAttempt={({ sourceSquare, targetSquare }) => attempt(sourceSquare + targetSquare)} />
        </div>
        <div>
          <h2>Practice</h2>
          <p>{selected.instruction}</p>
          {pending && <p>Checking move...</p>}
          {feedback && <p role="status">{feedback}</p>}
          <div className="actions">
            <button type="button" className="secondary-button" onClick={() => selectLesson(selected)}>Retry</button>
            <button type="button" className="secondary-button" onClick={() => selectLesson(null)}>All lessons</button>
          </div>
        </div>
      </div>}
      <p><Link to="/dashboard">Back to dashboard</Link></p>
    </section>
  );
}
