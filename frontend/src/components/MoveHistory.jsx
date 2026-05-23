export default function MoveHistory({ moves = [] }) {
  return (
    <section className="panel">
      <h2>Moves</h2>
      <ol className="move-list">
        {moves.map((move) => (
          <li key={move.id ?? move.move_number}>{move.move_san ?? move.move_uci}</li>
        ))}
      </ol>
    </section>
  );
}
