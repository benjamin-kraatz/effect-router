import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { RouterProvider, useRouterContext, defineRoute } from ".";
import { z } from "zod";
import { Effect } from "effect";

// Define a component that can navigate
const NavigateComponent = () => {
  const { navigate } = useRouterContext();
  return (
    <button onClick={() => navigate({ url: "/about/:id", params: { id: 123 } })}>
      Go to About
    </button>
  );
};

// Mock home route that includes the navigation component
const homeRoute = defineRoute("/", {
  component: () => (
    <div>
      <h1>Home</h1>
      <NavigateComponent />
    </div>
  ),
});

// Mock about route with params
const aboutRoute = defineRoute("/about/:id", {
  component: () => {
    const { id } = aboutRoute.useParams();
    return <h1>About {id}</h1>;
  },
  params: z.object({ id: z.coerce.number() }),
});

// Mock loader route
const loaderRoute = defineRoute("/loader", {
  component: () => {
    const { data, state } = loaderRoute.useLoaderData();
    if (state === "loading") return <h1>Loading...</h1>;
    if (state === "error") return <h1>Error</h1>;
    return <h1>{data?.message}</h1>;
  },
  loader: () =>
    Effect.succeed({ message: "Loader Success" }).pipe(Effect.delay(100)),
});

// Define all routes for the test router
const routes = [homeRoute, aboutRoute, loaderRoute] as const;

// Augment the module for type safety
declare module "effect-router" {
  interface Register {
    routes: typeof routes;
  }
}

// A single test router component to wrap our tests
const TestRouter: React.FC<{ initialUrl: string }> = ({ initialUrl }) => {
  window.history.pushState({}, "", initialUrl);
  return <RouterProvider routes={routes} />;
};

describe("RouterProvider", () => {
  it("should render the home route and the navigation component", async () => {
    await act(async () => render(<TestRouter initialUrl="/" />));
    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(await screen.findByText("Go to About")).toBeInTheDocument();
  });

  it("should render the about route with params", async () => {
    await act(async () => render(<TestRouter initialUrl="/about/42" />));
    expect(await screen.findByText("About 42")).toBeInTheDocument();
  });

  it("should navigate to a different route when the button is clicked", async () => {
    await act(async () => render(<TestRouter initialUrl="/" />));
    expect(await screen.findByText("Home")).toBeInTheDocument();

    await act(async () => {
      screen.getByText("Go to About").click();
    });

    expect(await screen.findByText("About 123")).toBeInTheDocument();
  });

  it("should handle loader success", async () => {
    vi.useFakeTimers();
    await act(async () => render(<TestRouter initialUrl="/loader" />));

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(screen.getByText("Loader Success")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
