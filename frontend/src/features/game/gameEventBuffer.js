// Buffer socket updates until the authoritative REST snapshot is applied.
export function createGameEventBuffer(applyEvent, isOpen) {
  let synchronized = false;
  const queued = [];

  function receive(event) {
    if (synchronized) applyEvent(event);
    else queued.push(event);
  }

  function synchronize() {
    synchronized = true;
    for (const event of queued) {
      if (!isOpen()) return false;
      applyEvent(event);
    }
    return isOpen();
  }

  return { receive, synchronize };
}
