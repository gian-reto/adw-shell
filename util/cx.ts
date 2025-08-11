import { Accessor, createComputed } from "ags";

type Argument = string[] | string | boolean | null | undefined;

const ACCESSOR_PLACEHOLDER = Symbol("Accessor");

/**
 * Merge class names and filter out falsy values. Note: Doesn't deduplicate
 * class names.
 *
 * @example
 * ```ts
 * cx("foo", "bar", false && "baz", null, undefined); // "foo bar"
 * ```
 *
 * @param args The expressions to evaluate.
 *
 * @returns The cleaned class names.
 */
function cx(...args: Argument[]): string;
function cx(...args: Accessor<Argument>[]): Accessor<string>;
function cx(
  ...args: Array<Argument | Accessor<Argument>>
): string | Accessor<string>;
function cx(
  ...args: Array<Argument | Accessor<Argument>>
): string | Accessor<string> {
  const accessors: Accessor<Argument>[] = [];
  // Contains each individual class as a string, or a placeholder for an
  // accessor at the respective index.
  const classNames: Array<string | typeof ACCESSOR_PLACEHOLDER> = [];

  for (const arg of args) {
    if (!arg) {
      continue;
    }
    if (Array.isArray(arg)) {
      classNames.push(cx(...arg));
      continue;
    }
    if (typeof arg === "string") {
      classNames.push(...arg.split(" "));
      continue;
    }
    if (arg instanceof Accessor) {
      accessors.push(arg);
      classNames.push(ACCESSOR_PLACEHOLDER);
      continue;
    }
  }

  // If there are any accessors, create a new computed accessor that is
  // subscribed to all of them, and returns the joined static class names along
  // with the current values of the accessors in the correct positions.
  if (accessors.length > 0) {
    return createComputed(accessors, (...values) => {
      const currentClasses: string[] = [];

      let accessorIndex = 0;
      for (const className of classNames) {
        if (className === ACCESSOR_PLACEHOLDER) {
          currentClasses.push(cx(values[accessorIndex++]));
          continue;
        }

        currentClasses.push(className);
      }

      return currentClasses.join(" ").trim();
    });
  }

  // No accessors, so `classNames` only contains strings.
  return classNames.join(" ").trim();
}

export { cx };
