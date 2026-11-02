import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../api/client.js";
import ChessBoard from "../components/ChessBoard.jsx";
import LoadingPlaceholder from "../components/LoadingPlaceholder.jsx";
import PageHeader from "../components/PageHeader.jsx";
import UiIcon from "../components/UiIcon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { loadOpeningProgress, saveOpeningProgress } from "../features/opening/openingProgress.js";
import "./LessonsPage.css";
import "./OpeningPage.css";

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function moveLabel(step, san) {
  if (!san) return "Starting position";
  return `${Math.floor((step - 1) / 2) + 1}${step % 2 ? "." : "..."} ${san}`;
}

export default function OpeningPage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [progress, setProgress] = useState(() => loadOpeningProgress(browserStorage(), user?.id));
  const userId = user?.id == null ? null : String(user.id);
  const completed = useMemo(
    () => new Set(progress.userId === userId ? progress.completed : []),
    [progress, userId]
  );

  useEffect(() => {
    let active = true;
    setError("");
    apiRequest("/api/v1/opening/catalog")
      .then((data) => { if (active) setCatalog(data); })
      .catch((err) => { if (active) setError(`Could not load opening guides: ${err.message}`); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    function refreshProgress() {
      setProgress(loadOpeningProgress(browserStorage(), user?.id));
    }
    refreshProgress();
    window.addEventListener("storage", refreshProgress);
    return () => window.removeEventListener("storage", refreshProgress);
  }, [user?.id]);

  function completeOpening(id) {
    const storage = browserStorage();
    const saved = loadOpeningProgress(storage, user?.id);
    const inMemory = progress.userId === userId ? progress.completed : [];
    const next = [...new Set([...saved.completed, ...inMemory, id])];
    const persistent = saveOpeningProgress(storage, user?.id, next);
    setProgress({ userId, completed: next, persistent });
  }

  function selectOpening(id) {
    setSelectedId(id);
    window.scrollTo({ top: 0 });
  }

  const warning = progress.userId === userId && !progress.persistent
    ? <p className="opening-storage-warning" role="status">Progress could not be saved in this browser. You can still use the guides.</p>
    : null;
  const selected = catalog?.find((opening) => opening.id === selectedId);
  const completedCount = catalog?.filter((opening) => completed.has(opening.id)).length ?? 0;
  const search = query.trim().toLowerCase();
  const visible = catalog?.filter((opening) => {
    const matchesText = `${opening.title} ${opening.line} ${opening.introduction}`.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || (filter === "completed" ? completed.has(opening.id) : !completed.has(opening.id));
    return matchesText && matchesFilter;
  }) ?? [];

  return <section className={`study-page opening-page${selected ? " study-page--detail" : ""}`}>
    <PageHeader eyebrow="LEARN & PRACTISE" title={selected?.title ?? "Opening study"}
      description={selected?.introduction ?? "Choose an opening and explore an example line, one move at a time."} />
    {warning}
    {error ? <><p className="error" role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></> :
      catalog === null ? <LoadingPlaceholder variant="cards" count={4} label="Loading opening guides" /> :
        selected ? <OpeningDetails key={selected.id} opening={selected} completed={completed.has(selected.id)}
          onComplete={completeOpening} onBack={() => selectOpening(null)} /> : <>
          <section className="opening-controls-panel" aria-label="Opening selection">
            <div className="opening-library-summary">
              <div><h2>Your opening guides</h2><p className="muted">{completedCount} of {catalog.length} completed · You can repeat any guide</p></div>
              {catalog.length > 0 && <div className="opening-progress-track" role="progressbar" aria-label="Completed opening guides"
                aria-valuemin={0} aria-valuemax={catalog.length} aria-valuenow={completedCount}>
                <span style={{ width: `${(completedCount / catalog.length) * 100}%` }} />
              </div>}
            </div>
            <div className="opening-toolbar">
              <label className="opening-search"><span>Find an opening</span>
                <input type="search" placeholder="Search openings..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <div className="opening-filter" role="group" aria-label="Filter openings">
                {[["all", "All"], ["new", "Not completed"], ["completed", "Completed"]].map(([value, label]) => (
                  <button key={value} type="button" className={filter === value ? "is-active" : ""}
                    aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
                ))}
              </div>
            </div>
          </section>
          {catalog.length === 0 ? <p className="muted">No opening guides are available yet.</p> :
            visible.length === 0 ? <p className="muted">No openings match your search or filter.</p> :
              <ul className="opening-list" aria-label="Openings">
                {visible.map((opening) => {
                  const isCompleted = completed.has(opening.id);
                  const preview = opening.steps.slice(1, 5).map((step, index) => index % 2 === 0 ? moveLabel(index + 1, step.move) : step.move).join(" ");
                  return <li key={opening.id}>
                    <button type="button" className="opening-row" onClick={() => selectOpening(opening.id)}
                      aria-label={`${opening.title}, ${isCompleted ? "completed, study again" : "not completed, start guide"}`}>
                      <span className="opening-row-title"><strong>{opening.title}</strong><span>{opening.line}</span></span>
                      <span className="opening-row-preview">{preview}</span>
                      <span className="opening-row-meta"><span className={`opening-status ${isCompleted ? "is-completed" : ""}`}>{isCompleted ? "Completed" : "Not completed"}</span>
                        <span>{(opening.steps.length - 1) / 2} moves</span></span>
                      <UiIcon name="arrow" className="opening-row-arrow" />
                    </button>
                  </li>;
                })}
              </ul>}
        </>}
  </section>;
}

function OpeningDetails({ opening, completed, onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const current = opening.steps[step];
  const lastStep = opening.steps.length - 1;

  function nextMove() {
    const next = Math.min(lastStep, step + 1);
    setStep(next);
    if (next === lastStep) onComplete(opening.id);
  }

  return <>
    <button type="button" className="study-inline-back" onClick={onBack}><UiIcon name="back" /> All openings</button>
    <div className="lesson-exercise">
      <div className="lesson-board"><ChessBoard fen={current.fen} playerColor="white" isInteractive={false} /></div>
      <div className="lesson-copy">
        <span className="study-card-index">{opening.line} · STEP {step} / {lastStep}</span>
        <h2>{opening.title}</h2>
        <p className="guide-move">{moveLabel(step, current.move)}</p>
        <p className="study-instruction" aria-live="polite">{current.explanation}</p>
        <div className="actions study-actions">
          <button type="button" className="secondary-button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><UiIcon name="back" /> Previous</button>
          <button type="button" disabled={step === lastStep} onClick={nextMove}>Next move <UiIcon name="arrow" /></button>
        </div>
        {step === lastStep && <p className="study-feedback is-success" role="status">You've reached the end. You can go back or study this guide again.</p>}
        {completed && step !== lastStep && <p className="opening-completed-note">Completed — you can revisit this guide whenever you like.</p>}
      </div>
    </div>
    <section className="opening-ideas"><h3>Ideas to remember</h3><ul>{opening.ideas.map((idea) => <li key={idea}>{idea}</li>)}</ul>
      <p className="muted">This is one example line; your opponent can choose other moves.</p>
      {opening.video_url && <a href={opening.video_url} target="_blank" rel="noreferrer noopener">Watch an optional video</a>}
    </section>
  </>;
}
