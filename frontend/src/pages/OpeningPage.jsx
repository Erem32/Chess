import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import LoadingPlaceholder from "../components/LoadingPlaceholder.jsx";
import IllustratedGuide from "../components/IllustratedGuide.jsx";
import StudyHeader from "../components/StudyHeader.jsx";
import UiIcon from "../components/UiIcon.jsx";
import "./LessonsPage.css";

const UPCOMING = [
  { title: "Sicilian Defence", moves: "1. e4 c5" },
  { title: "French Defence", moves: "1. e4 e6" },
  { title: "Queen’s Gambit", moves: "1. d4 d5 2. c4" }
];

export default function OpeningPage() {
  const [guide, setGuide] = useState(undefined);
  const [selected, setSelected] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    apiRequest("/api/v1/opening")
      .then((data) => { if (active) setGuide(data); })
      .catch((err) => { if (active) setError(`Could not load the opening guide: ${err.message}`); });
    return () => { active = false; };
  }, [attempt]);

  return <section className="study-page">
    <StudyHeader eyebrow="LEARN & PRACTISE" title="Opening study" description="Explore opening ideas at your own pace, move by move." />
    {error ? <><p className="error" role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></> :
      guide === undefined ? <LoadingPlaceholder variant="cards" count={4} label="Loading opening guide" /> : selected && guide ? <>
        <button type="button" className="study-inline-back" onClick={() => setSelected(false)}><UiIcon name="back" /> All openings</button>
        <IllustratedGuide guide={guide} />
      </> : <>
        {guide === null && <p className="muted">No opening guide is available yet.</p>}
        <div className="study-cards">
          {guide && <button type="button" className="study-card" onClick={() => setSelected(true)}>
            <span className="study-card-art" aria-hidden="true"><UiIcon name="book" /></span>
            <span className="study-card-content"><span className="study-card-index">OPENING GUIDE</span><strong>{guide.title}</strong><span className="study-card-meta">{guide.steps.length - 1} moves · Available</span></span>
            <UiIcon name="arrow" className="study-card-arrow" />
          </button>}
          {UPCOMING.map((item) => <div key={item.title} className="study-card study-card--unavailable">
            <span className="study-card-art" aria-hidden="true"><UiIcon name="book" /></span>
            <span className="study-card-content"><span className="study-card-index">NOT YET AVAILABLE</span><strong>{item.title}</strong><span className="study-card-meta">{item.moves}</span></span>
          </div>)}
        </div>
      </>}
  </section>;
}
