import { useState } from "react";
import ChessBoard from "./ChessBoard.jsx";
import UiIcon from "./UiIcon.jsx";

export default function IllustratedGuide({ guide }) {
  const [step, setStep] = useState(0);
  const current = guide.steps[step];
  return <div className="lesson-exercise">
    <div className="lesson-board"><ChessBoard fen={current.fen} playerColor="white" isInteractive={false} /></div>
    <div className="lesson-copy">
      <span className="study-card-index">STEP {step + 1} / {guide.steps.length}</span>
      <h2>{guide.title}</h2>
      <p className="guide-move">{current.move ?? "Starting position"}</p>
      <p className="study-instruction">{current.explanation}</p>
      <div className="actions study-actions">
        <button type="button" className="secondary-button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><UiIcon name="back" /> Previous</button>
        <button type="button" disabled={step === guide.steps.length - 1} onClick={() => setStep((value) => value + 1)}>Next <UiIcon name="arrow" /></button>
      </div>
      {guide.video_url && <p><a href={guide.video_url} target="_blank" rel="noreferrer">Watch video</a></p>}
    </div>
  </div>;
}
