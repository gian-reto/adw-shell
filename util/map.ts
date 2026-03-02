export type MapKey<TMap> = TMap extends Map<infer TKey, unknown> ? TKey : never;
export type MapValue<TMap> = TMap extends Map<unknown, infer TValue>
  ? TValue
  : never;
