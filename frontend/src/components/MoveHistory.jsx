import { useLayoutEffect, useRef } from "react";

export default function MoveHistory({ moves = [] }) {
  const scrollRef = useRef(null);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const frameId = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [moves.length]);

  return (
    <section className="panel move-panel">
      <h2>Moves</h2>
      {moves.length === 0 ? (
        <div className="panel-scroll" ref={scrollRef}>
          <p className="muted">No moves yet.</p>
        </div>
      ) : (
        <div className="panel-scroll" ref={scrollRef}>
          <ol className="move-list">
            {moves.map((move, index) => (
              <li key={move.id ?? `${move.move_number ?? index}-${move.move_uci}`}>
                {move.move_san ?? move.move_uci ?? move.move ?? "Move"}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
