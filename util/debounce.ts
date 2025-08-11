import AstalIO from "gi://AstalIO";
import { timeout } from "ags/time";

/**
 * Returns a debounced version of the given function `fn`.
 */
export const debounce = <
  F extends (
    ...args: Parameters<F>
  ) => Exclude<ReturnType<F>, PromiseLike<unknown>>
>(
  fn: F,
  options: {
    /**
     * The number of milliseconds to wait between executions of `fn`, if it's
     * called again during cooldown.
     */
    readonly waitForMs: number;
    /**
     * Whether to execute `fn` immediately when it's called for the first time.
     * Defaults to `true`.
     */
    readonly immediate?: boolean;
    /**
     * Whether to reset the timer if `fn` is called again during cooldown.
     * Defaults to `true`.
     */
    readonly resetCooldown?: boolean;
  }
): ((...args: Parameters<F>) => void) => {
  const { waitForMs, immediate = true, resetCooldown = true } = options;

  let timer: AstalIO.Time | undefined = undefined;
  let lastArgs: Parameters<F> | undefined = undefined;

  const later = () => {
    timer = undefined;
    if (!immediate) {
      fn(...(lastArgs! as Parameters<F>));
    }
  };

  return (...args: Parameters<F>): void => {
    lastArgs = args;

    const callNow = immediate && timer === undefined;

    if (timer === undefined || resetCooldown) {
      timer?.cancel();
      timer = timeout(waitForMs, later);
    }

    if (callNow) {
      fn(...args);
    }
  };
};
