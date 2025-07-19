import { Effect, Exit } from "effect";
import { YieldableError } from "effect/Cause";

export type LoaderResult<Loader> =
  | {
      data: Loader;
      state: "loaded";
      error?: never;
    }
  | {
      data?: never;
      state: "loading" | "no-loader";
      error?: Error;
    }
  | {
      data?: never;
      state: "error";
      error: Error;
    };

export type LoaderError = YieldableError;

export type LoaderEffect<Loader, E extends LoaderError> = Effect.Effect<
  Loader,
  E | never,
  never
>;

export type LoaderExit<Loader, E extends LoaderError> = Exit.Exit<Loader, E>;

// Utility type to extract all possible errors from an Effect
export type InferEffectErrors<T> = T extends Effect.Effect<unknown, infer E, unknown>
  ? E
  : never;

// Utility type to ensure all errors are properly typed
export type EnsureAllErrors<
  EffectType,
  DeclaredErrors extends LoaderError
> = InferEffectErrors<EffectType> extends never
  ? DeclaredErrors
  : InferEffectErrors<EffectType> extends DeclaredErrors
  ? DeclaredErrors
  : InferEffectErrors<EffectType> | DeclaredErrors;
