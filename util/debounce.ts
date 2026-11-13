import { timeout } from "ags/time";

/**
 * Returns a debounced version of the given function `fn`. Call `flush()` to
 * immediately execute a pending call, or `cancel()` to discard it.
 */
export const debounce = <
  F extends (
    ...args: Parameters<F>
  ) => Exclude<ReturnType<F>, PromiseLike<unknown>>,
>(
  fn: F,
  options: {
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
    /**
     * Whether to execute the latest pending call after cooldown. Defaults to
     * `true`.
     */
    readonly trailing?: boolean;
    /**
     * The number of milliseconds to wait between executions of `fn`, if it's
     * called again during cooldown.
     */
    readonly waitForMs: number;
  },
): ((...args: Parameters<F>) => void) & {
  readonly flush: () => void;
  readonly cancel: () => void;
} => {
  const {
    waitForMs,
    immediate = true,
    resetCooldown = true,
    trailing = true,
  } = options;

  let timer: ReturnType<typeof timeout> | undefined;
  let lastArgs: Parameters<F> | undefined;

  const invokePending = () => {
    const args = lastArgs;
    lastArgs = undefined;

    if (args !== undefined) {
      fn(...(args as Parameters<F>));
    }
  };

  const later = () => {
    timer = undefined;

    if (trailing) {
      invokePending();
    } else {
      lastArgs = undefined;
    }
  };

  const debounced = (...args: Parameters<F>): void => {
    lastArgs = args;

    const callNow = immediate && timer === undefined;

    if (timer === undefined || resetCooldown) {
      timer?.cancel();
      timer = timeout(waitForMs, later);
    }

    if (callNow) {
      invokePending();
    }
  };

  const flush = () => {
    timer?.cancel();
    timer = undefined;
    invokePending();
  };

  const cancel = () => {
    timer?.cancel();
    timer = undefined;
    lastArgs = undefined;
  };

  return Object.assign(debounced, { flush, cancel });
};
