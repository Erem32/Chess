export default function MoveHistory({ moves = [] }) {
  return (
    <section className="panel">
      <h2>Moves</h2>
      {moves.length === 0 ? (
        <p className="muted">No moves yet.</p>
      ) : (
        <ol className="move-list">
          {moves.map((move, index) => (
            <li key={move.id ?? `${move.move_number ?? index}-${move.move_uci}`}>
              {move.move_san ?? move.move_uci ?? move.move ?? "Move"}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
