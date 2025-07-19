import { Effect, Schema } from "effect";
import { ParseError } from "effect/ParseResult";
import { LoaderError } from "./routerTypes";

// Utility function to ensure all errors from Schema validation are handled
export function withSchemaErrors<TIn, DeclaredErrors extends LoaderError>(
  effect: Effect.Effect<TIn, DeclaredErrors, never>,
  schema: Schema.Schema<TIn, TIn, never>
): Effect.Effect<TIn, DeclaredErrors | ParseError, never> {
  return Effect.gen(function* () {
    const result = yield* effect;
    return yield* Schema.decodeUnknown(schema)(result);
  });
}

/**
 * **⚠️ EXPERIMENTAL: Do not use this function yet. Let the loader infer types instead. ⚠️**
 *
 * **ℹ️ And actually, the `loader` already seems to correctly infer types, so we might no longer need this function. ℹ️**
 *
 * Creates a loader that automatically handles schema validation and error types.
 * This is an experimental utility that aims to simplify loader creation by combining
 * effect handling and schema validation.
 *
 * @experimental This API is experimental and subject to breaking changes.
 * Instead of using this function, let your loader naturally infer types.
 *
 * @param effect - The Effect that performs the actual data loading
 * @param schema - Optional Schema for validating the loaded data
 *
 * @returns An Effect that includes both the declared errors and potential parse errors
 *
 * @example
 * // ❌ DON'T use this yet - let inference work instead:
 * const userLoader = createLoader(
 *   Effect.tryPromise({
 *     try: () => fetch("/api/user").then(r => r.json()),
 *     catch: () => new UserFetchError()
 *   }),
 *   UserSchema
 * );
 *
 * // ✅ DO use natural inference:
 * const userLoader = Effect.gen(function*() {
 *   const data = yield* Effect.tryPromise({
 *     try: () => fetch("/api/user").then(r => r.json()),
 *     catch: () => new UserFetchError()
 *   });
 *   return yield* Schema.decodeUnknown(UserSchema)(data);
 * });
 */
export function createLoader<
  TIn,
  DeclaredErrors extends LoaderError,
  SchemaType extends Schema.Schema<TIn, TIn, never> = Schema.Schema<
    TIn,
    TIn,
    never
  >
>(
  effect: Effect.Effect<TIn, DeclaredErrors, never>,
  schema?: SchemaType
): Effect.Effect<TIn, DeclaredErrors | ParseError, never> {
  if (schema) {
    return withSchemaErrors(effect, schema);
  }
  return effect;
}

// Type helper to extract all possible errors from an Effect
export type InferEffectErrors<T> = T extends Effect.Effect<
  unknown,
  infer E,
  unknown
>
  ? E
  : never;

// Type helper to ensure all errors are included in the loader error type
export type EnsureAllErrors<
  EffectType,
  DeclaredErrors extends LoaderError
> = InferEffectErrors<EffectType> extends never
  ? DeclaredErrors
  : InferEffectErrors<EffectType> extends DeclaredErrors
  ? DeclaredErrors
  : InferEffectErrors<EffectType> | DeclaredErrors;

/**
 * Best Practices for Error Handling in Loaders:
 *
 * 1. Always include ParseError in your loader error type when using Schema validation
 * 2. Use createLoader() or withSchemaErrors() to automatically include ParseError
 * 3. Manually catch and transform ParseError if you want custom error messages
 * 4. Use Effect.catchTags() to handle specific error types
 *
 * Example:
 * ```typescript
 * const userRoute = defineRoute("/users/:id", {
 *   component: UserComponent,
 *   params: z.object({ id: z.string() }),
 *   loader: (params) =>
 *     createLoader(
 *       Effect.tryPromise({
 *         try: () => fetch(`/api/users/${params.id}`).then(res => res.json()),
 *         catch: (error) => new UserFetchError({ message: String(error) })
 *       }),
 *       UserSchema // This automatically includes ParseError in the return type
 *     )
 * });
 * ```
 */
