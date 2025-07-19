import { Effect, Exit } from "effect";

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

export type LoaderEffect<Loader> = Effect.Effect<Loader, unknown, never>;

export type LoaderExit<Loader> = Exit.Exit<Loader, unknown>; 