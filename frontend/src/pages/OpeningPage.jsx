import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../api/client.js";
import ChessBoard from "../components/ChessBoard.jsx";
import "./LessonsPage.css";

export default function OpeningPage() {
  const [guide, setGuide] = useState(undefined);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    apiRequest("/api/v1/opening")
      .then((data) => { if (active) { setGuide(data); setStep(0); } })
      .catch((err) => { if (active) setError(`Could not load the opening guide: ${err.message}`); });
    return () => { active = false; };
  }, [attempt]);

  return <section className="panel lessons-page">
    <h1>Opening study</h1>
    {error ? <><p className="error" role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></> :
      guide === undefined ? <p>Loading opening guide...</p> : guide === null ? <p className="muted">No opening guide is available yet.</p> :
        <div className="lesson-exercise">
          <div className="lesson-board"><ChessBoard fen={guide.steps[step].fen} playerColor="white" isInteractive={false} /></div>
          <div>
            <h2>{guide.title}</h2>
            <p>Step {step + 1} of {guide.steps.length}{guide.steps[step].move ? ` · ${guide.steps[step].move}` : " · Starting position"}</p>
            <p>{guide.steps[step].explanation}</p>
            <div className="actions">
              <button type="button" className="secondary-button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Previous</button>
              <button type="button" disabled={step === guide.steps.length - 1} onClick={() => setStep((value) => value + 1)}>Next</button>
            </div>
            {guide.video_url && <p><a href={guide.video_url} target="_blank" rel="noreferrer">Watch video</a></p>}
          </div>
        </div>}
    <p><Link to="/dashboard">Back to dashboard</Link></p>
  </section>;
}
