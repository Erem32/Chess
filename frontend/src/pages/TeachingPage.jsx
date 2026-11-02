import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import LoadingPlaceholder from "../components/LoadingPlaceholder.jsx";
import IllustratedGuide from "../components/IllustratedGuide.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StudyPagination from "../components/StudyPagination.jsx";
import UiIcon from "../components/UiIcon.jsx";
import { useCatalogPageSize } from "../features/study/useCatalogPageSize.js";
import "./LessonsPage.css";

const SYMBOLS = { "pawn-capture": "♙", "pawn-promotion": "♕", "knight-move": "♘" };

export default function TeachingPage() {
  const [examples, setExamples] = useState(null);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
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

  const [catalogRef, pageSize] = useCatalogPageSize();
  const pageCount = Math.max(1, Math.ceil((examples?.length ?? 0) / pageSize));
  const currentPage = Math.min(page, pageCount - 1);

  return <section className={`study-page${selected ? " study-page--detail" : " study-catalog-page"}`}>
    <PageHeader eyebrow="LEARN & PRACTISE" title="Teaching examples" description="Explore a position and see the idea play out on the board."
      backToList={selected ? { label: "All examples", onClick: () => setSelected(null) } : null} />
    {error ? <><p className="error" role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></> :
      examples === null ? <LoadingPlaceholder variant="cards" count={3} label="Loading examples" /> : examples.length === 0 ? <p className="muted">No examples are available yet.</p> :
        selected ? <IllustratedGuide key={selected.id} guide={selected} /> :
          <><div className="study-catalog-scroll" ref={catalogRef}><div className="study-cards">{examples.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((example, index) => <button key={example.id} type="button" className="study-card" aria-label={example.title} onClick={() => setSelected(example)}>
            <span className="study-card-art" aria-hidden="true">{SYMBOLS[example.id] ?? <UiIcon name="board" />}</span>
            <span className="study-card-content"><span className="study-card-index">Example {String(currentPage * pageSize + index + 1).padStart(2, "0")}</span><strong>{example.title}</strong><span className="study-card-meta">{example.category ? `${example.category} · ` : ""}{example.steps.length - 1} illustrated {example.steps.length === 2 ? "move" : "moves"}</span></span>
            <UiIcon name="arrow" className="study-card-arrow" />
          </button>)}</div></div><StudyPagination page={currentPage} pageCount={pageCount} onChange={setPage} /></>}
  </section>;
}
