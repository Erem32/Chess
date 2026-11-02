import UiIcon from "./UiIcon.jsx";

export default function StudyPagination({ page, pageCount, onChange }) {
  return <nav className="study-pagination" aria-label="Pages">
    <button type="button" className="secondary-button" disabled={page === 0} onClick={() => onChange(page - 1)}><UiIcon name="back" /> Previous</button>
    <span>Page {page + 1} / {pageCount}</span>
    <button type="button" className="secondary-button" disabled={page + 1 >= pageCount} onClick={() => onChange(page + 1)}>Next <UiIcon name="arrow" /></button>
  </nav>;
}
