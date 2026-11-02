import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";

export default function SettingsPage() {
  const { textSize, moveGuidance, setTextSize, setMoveGuidance } = useSettings();
  return <section className="panel settings-page">
    <h1>Settings</h1>
    <div className="settings-options">
      <label>Text size
        <select value={textSize} onChange={(event) => setTextSize(event.target.value)}>
          <option value="normal">Normal</option>
          <option value="large">Large</option>
          <option value="larger">Larger</option>
        </select>
      </label>
      <label className="settings-checkbox">
        <input type="checkbox" checked={moveGuidance} onChange={(event) => setMoveGuidance(event.target.checked)} />
        Show legal-move markers
      </label>
    </div>
    <p className="muted">Settings are saved in this browser.</p>
    <p><Link to="/dashboard">Back to dashboard</Link></p>
  </section>;
}
