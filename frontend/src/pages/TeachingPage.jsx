import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import LoadingPlaceholder from "../components/LoadingPlaceholder.jsx";
import IllustratedGuide from "../components/IllustratedGuide.jsx";
import StudyHeader from "../components/StudyHeader.jsx";
import UiIcon from "../components/UiIcon.jsx";
import "./LessonsPage.css";

const SYMBOLS = { "pawn-capture": "♙", "pawn-promotion": "♕", "knight-move": "♘" };

export default function TeachingPage() {
  const [examples, setExamples] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    apiRequest("/api/v1/teaching-examples")
      .then((data) => { if (active) setExamples(data); })
      .catch((err) => { if (active) setError(`Could not load examples: ${err.message}`); });
    return () => { active = false; };
  }, [attempt]);

  return <section className={`study-page${selected ? " study-page--detail" : ""}`}>
    <StudyHeader eyebrow="LEARN & PRACTISE" title="Teaching examples" description="Explore a position and see the idea play out on the board." />
    {error ? <><p className="error" role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></> :
      examples === null ? <LoadingPlaceholder variant="cards" count={3} label="Loading examples" /> : examples.length === 0 ? <p className="muted">No examples are available yet.</p> :
        selected ? <><button type="button" className="study-inline-back" onClick={() => setSelected(null)}><UiIcon name="back" /> All examples</button><IllustratedGuide key={selected.id} guide={selected} /></> :
          <div className="study-cards">{examples.map((example, index) => <button key={example.id} type="button" className="study-card" aria-label={example.title} onClick={() => setSelected(example)}>
            <span className="study-card-art" aria-hidden="true">{SYMBOLS[example.id] ?? <UiIcon name="board" />}</span>
            <span className="study-card-content"><span className="study-card-index">Example {String(index + 1).padStart(2, "0")}</span><strong>{example.title}</strong><span className="study-card-meta">{example.steps.length - 1} illustrated {example.steps.length === 2 ? "move" : "moves"}</span></span>
            <UiIcon name="arrow" className="study-card-arrow" />
          </button>)}</div>}
  </section>;
}
