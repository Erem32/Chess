import { Link } from "react-router-dom";
import UiIcon from "./UiIcon.jsx";

export default function PageHeader({ eyebrow, title, description, showBack = true, backToList }) {
  return <header className="study-header">
    {(showBack || backToList) && <nav className="study-navigation" aria-label="Page navigation">
      {showBack && <Link className="study-back" to="/dashboard"><UiIcon name="back" /> Dashboard</Link>}
      {backToList && <button type="button" className="study-inline-back" onClick={backToList.onClick}><UiIcon name="back" /> {backToList.label}</button>}
    </nav>}
    <p className="study-eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    {description && <p className="study-description">{description}</p>}
  </header>;
}
