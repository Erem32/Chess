import { Link } from "react-router-dom";
import UiIcon from "./UiIcon.jsx";

export default function PageHeader({ eyebrow, title, description, showBack = true }) {
  return <header className="study-header">
    {showBack && <Link className="study-back" to="/dashboard"><UiIcon name="back" /> Dashboard</Link>}
    <p className="study-eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    {description && <p className="study-description">{description}</p>}
  </header>;
}
