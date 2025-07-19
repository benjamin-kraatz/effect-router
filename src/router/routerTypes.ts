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