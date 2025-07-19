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

export type LoaderError = YieldableError ;

export type LoaderEffect<Loader, E extends LoaderError> = Effect.Effect<
  Loader,
  E,
  never
>;

export type LoaderExit<Loader, E extends LoaderError> = Exit.Exit<Loader, E>;
