import PageHeader from "../components/PageHeader.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import "./LessonsPage.css";

export default function SettingsPage() {
  const { textSize, moveGuidance, setTextSize, setMoveGuidance } = useSettings();
  return <section className="study-page settings-shell">
    <PageHeader eyebrow="Preferences" title="Settings" description="Adjust the display for this browser." />
    <div className="panel settings-page">
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
    </div>
  </section>;
}
