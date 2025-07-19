import { createContext, useCallback, useEffect, useState } from "react";
import { Outlet, OutletWrapper } from "./Outlet";
import { routeParser } from "./routeParser";
import { LoaderResult } from "./routerTypes";
import {
  DynamicRoute,
  isDynamicRoute,
  NavigableRoutes,
  ParamsForPath,
  RegisteredRoutes,
} from "./types";

const RouterContext = createContext<{
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

export function RouterProvider({
  routes,
}: {
  routes: readonly RegisteredRoutes[];
}) {
  const [matchedRoutes, setMatchedRoutes] = useState<RegisteredRoutes[]>([]);
  const [rawParams, setRawParams] = useState<Record<string, string>>({});
  const [loaderData, setLoaderData] = useState<LoaderResult<unknown>[]>([]);

  const handleRouteChange = useCallback(() => {
    const currentUrl = window.location.pathname;
    const { routes: matchedRoutes, params } = routeParser(routes, currentUrl);
    setMatchedRoutes(matchedRoutes);
    setRawParams(params);
    setLoaderData(
      matchedRoutes.map((route) => ({
        state: route.loader ? "no-loader" : "loading",
      }))
    );
  }, [routes]);

  useEffect(() => {
    matchedRoutes.forEach((route, index) => {
      if (route.loader != null) {
        setLoaderData((data) => {
          const newData = [...data];
          newData[index] = {
            state: "loading",
          };
          return newData;
        });
        const loader = isDynamicRoute(route)
          ? route.loader(route.params.parse(rawParams))
          : route.loader();

        loader
          .then((res) => {
            setLoaderData((data) => {
              const newData = [...data];
              newData[index] = {
                data: res,
                state: "loaded",
              };
              return newData;
            });
          })
          .catch((error) => {
            setLoaderData((data) => {
              const newData = [...data];
              newData[index] = {
                state: "error",
                error,
              };
              return newData;
            });
          });
      }
    });
  }, [matchedRoutes, rawParams]);

  // Can this be done better
  useEffect(() => {
    handleRouteChange();
  }, [handleRouteChange]);

  useEffect(() => {
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [handleRouteChange]);

  function goToUrl(url: string) {
    window.history.pushState({}, "", url);
    handleRouteChange();
  }

  function navigate<Path extends NavigableRoutes["path"]>({
    url,
    params,
  }: { url: Path } & (Path extends DynamicRoute
    ? { params: ParamsForPath<Path> }
    : { params?: never })) {
    const parsedUrl =
      params == null
        ? url
        : Object.entries(params).reduce((acc, [key, value]) => {
            return acc.replace(`:${key}`, value.toString());
          }, url as string);

    window.history.pushState({}, "", parsedUrl);
    handleRouteChange();
  }

  return (
    <RouterContext
      value={{ matchedRoutes, navigate, goToUrl, rawParams, loaderData }}
    >
      <OutletWrapper depth={-1}>
        <div className="absolute flex flex-col items-center justify-center top-2 right-2 text-xs px-2 py-1 rounded-lg bg-red-800 font-bold hover:opacity-10 transition-opacity select-none cursor-default">
          <span className="text-center text-sm">&alpha; Early Alpha</span>
          <span className="text-center tracking-tighter">Effect Router</span>
        </div>
        <Outlet />
      </OutletWrapper>
    </RouterContext>
  );
}
