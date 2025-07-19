import { createContext, useContext } from "react";
import {
  DynamicRoute,
  NavigableRoutes,
  ParamsForPath,
  RegisteredRoutes,
} from "./types";

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

export const RouterContext = createContext<{
  matchedRoutes: RegisteredRoutes[];
  goToUrl: (url: string) => void;
  navigate<Path extends NavigableRoutes["path"]>({
    url,
    params,
  }: { url: Path } & (Path extends DynamicRoute
    ? { params: ParamsForPath<Path> }
    : { params?: never })): void;
  rawParams: Record<string, string>;
  loaderData: unknown[];
}>({
  loaderData: [],
  matchedRoutes: [],
  navigate: () => {},
  goToUrl: () => {},
  rawParams: {},
});

export function useRouterContext() {
  const context = useContext(RouterContext);
  if (context == null) {
    throw new Error("useRouterContext must be used within a RouterProvider");
  }
  return context;
}
