import { createContext, useContext } from "react";
import {
  BaseRoute,
  DynamicRoute,
  ParamsForPath,
  RoutePath,
} from "./types";
import { LoaderResult } from "./routerTypes";

export const RouterContext = createContext<{
  matchedRoutes: BaseRoute[];
  goToUrl: (url: string) => void;
  navigate<Path extends RoutePath>(
    options: { url: Path } & (Path extends DynamicRoute
      ? { params: ParamsForPath<Path> }
      : { params?: never })
  ): void;
  rawParams: Record<string, string>;
  loaderData: LoaderResult<unknown>[];
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
