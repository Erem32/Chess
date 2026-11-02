import { useState } from "react";
import ChessBoard from "./ChessBoard.jsx";

export default function IllustratedGuide({ guide }) {
  const [step, setStep] = useState(0);
  const current = guide.steps[step];
  return <div className="lesson-exercise">
    <div className="lesson-board"><ChessBoard fen={current.fen} playerColor="white" isInteractive={false} /></div>
    <div className="lesson-copy">
      <h2>{guide.title}</h2>
      <p>Step {step + 1} of {guide.steps.length}{current.move ? ` · ${current.move}` : " · Starting position"}</p>
      <p>{current.explanation}</p>
      <div className="actions">
        <button type="button" className="secondary-button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Previous</button>
        <button type="button" disabled={step === guide.steps.length - 1} onClick={() => setStep((value) => value + 1)}>Next</button>
      </div>
      {guide.video_url && <p><a href={guide.video_url} target="_blank" rel="noreferrer">Watch video</a></p>}
    </div>
  </div>;
}
