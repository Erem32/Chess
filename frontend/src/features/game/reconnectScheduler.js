import { reconnectDelay } from "../../api/gameSync.js";

// Keep retry state across socket instances while cancelling timers on cleanup.
export function createReconnectScheduler(onRetry, {
  now = Date.now,
  delayForAttempt = reconnectDelay,
  schedule = setTimeout,
  cancel = clearTimeout,
} = {}) {
  let attempt = 0;
  let timer = null;

  function resetAttempts() {
    attempt = 0;
  }

  function retry(stableSince) {
    if (stableSince && now() - stableSince >= 30000) resetAttempts();
    const delay = delayForAttempt(attempt++);
    timer = schedule(onRetry, delay);
  }

  function cancelRetry() {
    if (timer !== null) {
      cancel(timer);
      timer = null;
    }
  }

  return { resetAttempts, retry, cancelRetry };
}
