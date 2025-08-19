import { Accessor } from "ags";
import GObject from "ags/gobject";

type SubscribeCallback = () => void;
type DisposeFunction = () => void;
type SubscribeFunction = (callback: SubscribeCallback) => DisposeFunction;

type AnyFunc = (...args: any[]) => any;
type NonNullish<T> = Exclude<T, null | undefined>;
type Join<K extends string, P> = P extends string ? `${K}.${P}` : never;

type Depth = 0 | 1 | 2;
type DepthMinusOne<TDepth extends Depth> = TDepth extends 2
  ? 1
  : TDepth extends 1
    ? 0
    : 0;

type KeyDict<TObject> = {
  [K in Extract<keyof TObject, string> as K extends `$${string}`
    ? never
    : TObject[K] extends AnyFunc
      ? never
      : K]: `${K}`;
};

type Key<TObject> = TObject extends GObject.Object
  ? KeyDict<TObject>[keyof KeyDict<TObject>]
  : never;

type Value<TObject, K extends string> = K extends keyof TObject
  ? K extends Key<TObject>
    ? TObject[K]
    : never
  : never;

type DeepKeyDict<TObject, TDepth extends Depth = 2> = {
  [K in Extract<keyof TObject, string> as K extends Key<TObject>
    ? K
    : never]: NonNullish<TObject[K]> extends GObject.Object
    ? `${K}` | Join<K, DeepKey<NonNullish<TObject[K]>, DepthMinusOne<TDepth>>>
    : `${K}`;
};

type DeepKey<TObject, TDepth extends Depth = 2> = [TDepth] extends [0]
  ? never
  : TObject extends GObject.Object
    ? DeepKeyDict<TObject, TDepth>[keyof DeepKeyDict<TObject, TDepth>]
    : never;

type DeepValue<T, K extends string> = K extends keyof T
  ? K extends Key<T>
    ? T[K]
    : never
  : K extends `${infer K0 extends Extract<keyof T, string>}.${infer Rest}`
    ? DeepValue<T[K0], Rest>
    : never;

const kebabify = (str: string): string =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replaceAll("_", "-")
    .toLowerCase();

const getValue = <T extends GObject.Object, P extends Key<T>>(
  obj: T,
  key: P,
): Value<T, P> => {
  const prop = kebabify(key);

  const getter = `get_${prop.replaceAll("-", "_")}` as keyof typeof obj;
  if (getter in obj && typeof obj[getter] === "function") {
    return (obj[getter] as () => unknown)() as Value<T, P>;
  }

  if (prop in obj) return obj[prop as keyof T] as Value<T, P>;
  if (key in obj) return obj[key as keyof T] as Value<T, P>;

  throw Error(`Cannot get property ${key}`);
};

const getValueDeep = <T extends GObject.Object, P extends DeepKey<T>>(
  obj: T,
  propertyPath: P,
): DeepValue<T, P> => {
  const path = (propertyPath as string).split(".");
  const firstKey = path[0] as Key<T>;

  if (!(firstKey in obj)) {
    throw Error(`Property ${firstKey} does not exist in object`);
  }
  if (path.length === 1) {
    return getValue(obj, firstKey) as DeepValue<T, P>;
  }

  const firstObject = getValue(obj, firstKey) as unknown as GObject.Object;

  return getValueDeep(
    firstObject,
    path.slice(1).join(".") as never,
  ) as DeepValue<T, P>;
};

const subscribeProperty = <T extends GObject.Object, P extends Key<T>>(
  obj: T,
  key: P,
  callback: SubscribeCallback,
): DisposeFunction => {
  const prop = kebabify(key);
  const id = obj.connect(`notify::${prop}`, () => callback());

  return () => obj.disconnect(id);
};

const subscribePropertyDeep = <T extends GObject.Object, P extends DeepKey<T>>(
  obj: T,
  propertyPath: P,
  callback: SubscribeCallback,
): DisposeFunction => {
  const path = (propertyPath as string).split(".");
  const firstKey = path[0] as Key<T>;

  if (path.length === 1) {
    return subscribeProperty(obj, firstKey, callback);
  }

  let disposeOuter: DisposeFunction | undefined;
  let disposeInner: DisposeFunction | undefined;

  const resubscribeInner = () => {
    // Drop previous inner subscription.
    disposeInner?.();
    disposeInner = undefined;

    // (Re)-subscribe to current nested object if present.
    let firstObject: GObject.Object | undefined;
    try {
      firstObject = getValue(obj, firstKey) as unknown as
        | GObject.Object
        | undefined;
    } catch {
      firstObject = undefined;
    }

    if (firstObject) {
      disposeInner = subscribePropertyDeep(
        firstObject,
        path.slice(1).join(".") as never,
        callback,
      );
    }
  };

  // Subscribe to the outer object.
  disposeOuter = subscribeProperty(obj, firstKey, () => {
    // Resubscribe to the inner object whenever the outer object changes.
    resubscribeInner();
    // Call the callback to notify subscribers about the change.
    callback();
  });

  // Initialize subscription to the inner object.
  resubscribeInner();

  // Return a stable disposer that tears down both current subscriptions.
  return () => {
    disposeInner?.();
    disposeInner = undefined;
    disposeOuter?.();
    disposeOuter = undefined;
  };
};

/**
 * Create an `Accessor` on a `GObject.Object`'s nested `property`.
 *
 * @param object The `GObject.Object` to create the `Accessor` on.
 * @param propertyPath A path to the nested property, e.g. `a.b.c`.
 */
export const createBindingDeep = <
  T extends GObject.Object,
  P extends DeepKey<T>,
>(
  object: T,
  propertyPath: P & DeepKey<T>,
): Accessor<DeepValue<T, P>> => {
  const get = () => getValueDeep(object, propertyPath);
  const subscribe: SubscribeFunction = (callback) =>
    subscribePropertyDeep(object, propertyPath, callback);

  return new Accessor<DeepValue<T, P>>(get, subscribe);
};
