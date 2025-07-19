import { Effect, Data } from "effect";
import { defineRoute, useRouterContext, LoaderEffect } from "effect-router";

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

  // Type-safe navigation examples
  const handleValidNavigation = () => {
    // ✅ These work correctly with type safety
    navigate({ url: "/" }); // Valid route without params
    navigate({ url: "/about/:id", params: { id: 1 } }); // Valid route with correct params
  };

  // ❌ These would cause TypeScript errors (uncomment to test):
  // navigate({ url: "/nonexistent" }); // Error: route doesn't exist
  // navigate({ url: "/about/:id" }); // Error: missing required params
  // navigate({ url: "/about/:id", params: { wrongParam: 1 } }); // Error: wrong parameter name
  // navigate({ url: "/about/:id", params: { id: "string" } }); // Error: wrong parameter type
  // navigate({ url: "/about/:id", params: { id: 1, extra: "value" } }); // Error: extra parameters
  // navigate({ url: "/", params: { something: "value" } }); // Error: params for non-dynamic route

  return (
    <>
      <div className="absolute flex flex-col items-center justify-center top-2 right-2 text-xs px-2 py-1 rounded-lg bg-red-800 font-bold hover:opacity-10 transition-opacity select-none cursor-default">
        <span className="text-center text-sm">&alpha; Early Alpha</span>
        <span className="text-center tracking-tighter">Effect Router</span>
      </div>
      <h2>Home - {state === "loaded" ? data.hi : "loading"}</h2>
      <div className="space-y-2">
        <button
          onClick={() => navigate({ url: "/about/:id", params: { id: 1 } })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go To About 1
        </button>
        <button 
          onClick={() => navigate({ url: "/" })}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Go To Home
        </button>
        <button 
          onClick={handleValidNavigation}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Type Safety
        </button>
      </div>
    </>
  );
}
