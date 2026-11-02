// Reserve space while data loads without briefly flashing text on every navigation.
export default function LoadingPlaceholder({ label, variant = "rows", count = 3 }) {
  if (variant === "board") {
    return <div className="loading-board" role="status" aria-label={label} />;
  }
  return <div className={variant === "cards" ? "study-cards" : "loading-rows"} role="status" aria-label={label}>
    {Array.from({ length: count }, (_, index) => <div key={index} className={variant === "cards" ? "study-card loading-card" : "loading-row"} aria-hidden="true">
      {variant === "cards" && <span className="loading-block loading-card-icon" />}
      <span className="loading-lines"><span className="loading-block loading-line-short" /><span className="loading-block loading-line-long" /></span>
    </div>)}
  </div>;
}
