import { Data, Effect } from "effect";
import { defineRoute, useRouterContext } from "effect-router";

export class TaggedError extends Data.TaggedError("TaggedError")<{
  message: string;
}> {}
export class SimpleError extends Data.Error<{ message: string }> {}

export const homeRoute = defineRoute("/", {
  component: HomePage,
  loader: () => {
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
      <div className="absolute flex flex-col items-center justify-center top-2 right-2 text-xs px-2 py-1 rounded-lg bg-red-800 font-bold hover:opacity-10 transition-opacity select-none cursor-default">
        <span className="text-center text-sm">&alpha; Early Alpha</span>
        <span className="text-center tracking-tighter">Effect Router</span>
      </div>
      <h2>Home - {state === "loaded" ? data.hi : "loading"}</h2>
      <button
        onClick={() => navigate({ url: "/about/:id", params: { id: 1 } })}
      >
        Go To About 1
      </button>
    </>
  );
}
