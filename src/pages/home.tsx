import { Effect, Data } from "effect";
import { defineRoute } from "../router/defineRoute";
import { useRouterContext } from "../router/routerHooks";
import { LoaderEffect } from "../router/routerTypes";

export class TaggedError extends Data.TaggedError("TaggedError")<{
  message: string;
}> {}
export class SimpleError extends Data.Error<{ message: string }> {}

export const homeRoute = defineRoute("/", {
  component: HomePage,
  loader: (): LoaderEffect<{ hi: string }, TaggedError> => {
    return Effect.tryPromise({
      try: async () => {
        // randomly fail
        const random = Math.random();
        if (random < 0.5) {
          throw new Error("Failed to fetch home");
        }
        return new Promise<{ hi: string }>((resolve) => {
          setTimeout(() => {
            resolve({ hi: "hello" });
          }, 1000);
        });
      },
      catch: (error) =>
        new TaggedError({ message: `Failed to fetch home: ${error}` }),
    });
  },
});

// eslint-disable-next-line react-refresh/only-export-components
function HomePage() {
  const { data, state } = homeRoute.useLoaderData();
  const { navigate } = useRouterContext();

  return (
    <>
      <h2>Home - {state === "loaded" ? data.hi : "loading"}</h2>
      <button
        onClick={() => navigate({ url: "/about/:id", params: { id: 1 } })}
      >
        Go To About 1
      </button>
    </>
  );
}
