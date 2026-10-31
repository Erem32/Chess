export function PlayerSummaryPanel({ playerSummary }) {
  return (
    <section className="panel player-summary-panel">
      <h2>Players</h2>
      {playerSummary.length === 0 ? (
        <p className="muted">Player names unavailable.</p>
      ) : (
        <div className="player-summary-list">
          {playerSummary.map((player) => (
            <p key={player.user_id} className="player-summary-row">
              <span className="player-summary-name">{player.name}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

export function GameActionPanel({
  canClaimDraw,
  claimBusy,
  onCheckClaim,
  canOfferDraw,
  canRespondToDraw,
  onAcceptDraw,
  onDeclineDraw,
  onOfferDraw,
  onResign
}) {
  return (
    <div className="panel button-panel">
      <div className="actions">
        <button type="button" className="danger-button" onClick={onResign}>
          <span aria-hidden="true">🏁</span> Resign
        </button>
      </div>
      <div className="actions">
        {canClaimDraw && (
          <button type="button" className="secondary-button" onClick={onCheckClaim} disabled={claimBusy}>
            {claimBusy ? "Checking..." : "Check draw claim"}
          </button>
        )}
        {canOfferDraw && (
          <button type="button" className="secondary-button" onClick={onOfferDraw}>½ Offer draw</button>
        )}
        {canRespondToDraw && (
          <>
            <button type="button" className="secondary-button" onClick={onAcceptDraw}>½ Accept draw</button>
            <button type="button" className="danger-button" onClick={onDeclineDraw}>Decline</button>
          </>
        )}
      </div>
    </div>
  );
}

export function DrawClaimPanel({ options, selectedMove, onSelect, onClaim, onCancel, busy }) {
  const hasCurrentClaim = options.current_reasons.length > 0;
  const hasClaim = hasCurrentClaim || options.moves.length > 0;
  const reasons = (values) => values.map((value) => value === "threefold" ? "threefold repetition" : "50-move rule").join(" and ");
  return (
    <section className="panel draw-claim-panel" aria-label="Draw claim">
      <h2>Claim a draw</h2>
      {hasClaim ? (
        <>
          <p>Choose the current position or a legal move you intend to play. A declared move is not played if the claim succeeds.</p>
          <label>
            Claim based on
            <select value={selectedMove} onChange={(event) => onSelect(event.target.value)} disabled={busy}>
              {hasCurrentClaim && <option value="">Current position: {reasons(options.current_reasons)}</option>}
              {options.moves.map((move) => <option key={move.uci} value={move.uci}>{move.san}: {reasons(move.reasons)}</option>)}
            </select>
          </label>
          <div className="actions"><button type="button" onClick={onClaim} disabled={busy}>{busy ? "Claiming..." : "Claim draw"}</button></div>
        </>
      ) : <p>No draw claim is currently available.</p>}
      <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>Close</button>
    </section>
  );
}

export function DrawOfferPanel({ drawOfferByUserId, hasPendingDrawOffer, isOwnDrawOffer, playerNamesById }) {
  if (!hasPendingDrawOffer) return null;

  return (
    <section className="panel draw-offer-panel">
      <p className="muted draw-offer-copy">
        {isOwnDrawOffer
          ? "½ Draw offered. Waiting for opponent response."
          : `½ ${playerNamesById[drawOfferByUserId] ?? "Opponent"} offered a draw.`}
      </p>
    </section>
  );
}
