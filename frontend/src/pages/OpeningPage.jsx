import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../api/client.js";
import IllustratedGuide from "../components/IllustratedGuide.jsx";
import "./LessonsPage.css";

export default function OpeningPage() {
  const [guide, setGuide] = useState(undefined);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    apiRequest("/api/v1/opening")
      .then((data) => { if (active) { setGuide(data); } })
      .catch((err) => { if (active) setError(`Could not load the opening guide: ${err.message}`); });
    return () => { active = false; };
  }, [attempt]);

  return <section className="panel lessons-page">
    <h1>Opening study</h1>
    {error ? <><p className="error" role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></> :
      guide === undefined ? <p>Loading opening guide...</p> : guide === null ? <p className="muted">No opening guide is available yet.</p> :
        <IllustratedGuide guide={guide} />}
    <p><Link to="/dashboard">Back to dashboard</Link></p>
  </section>;
}
