import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import IllustratedGuide from "../components/IllustratedGuide.jsx";
import "./LessonsPage.css";

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

  return <section className="panel lessons-page">
    <h1>Teaching examples</h1>
    {error ? <><p className="error" role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></> :
      examples === null ? <p>Loading examples...</p> : examples.length === 0 ? <p className="muted">No examples are available yet.</p> :
        selected ? <><IllustratedGuide key={selected.id} guide={selected} /><p><button type="button" className="secondary-button" onClick={() => setSelected(null)}>All examples</button></p></> :
          <div className="lessons-list"><p>Choose an example.</p>{examples.map((example) => <button key={example.id} type="button" className="secondary-button" onClick={() => setSelected(example)}>{example.title}</button>)}</div>}
    <p><Link to="/dashboard">Back to dashboard</Link></p>
  </section>;
}
