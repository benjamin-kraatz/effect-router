import { useCallback, useEffect, useState } from "react";
import { Effect } from "effect";
import { Outlet, OutletWrapper } from "./Outlet";
import { routeParser } from "./routeParser";
import { LoaderResult } from "./routerTypes";
import {
  BaseRoute,
  DynamicRoute,
  isDynamicRoute,
  ParamsForPath,
} from "./types";
import { RouterContext } from "./routerHooks";

export function RouterProvider<T extends readonly BaseRoute[]>({
  routes,
}: {
  routes: T;
}) {
  const [matchedRoutes, setMatchedRoutes] = useState<T[number][]>([]);
  const [rawParams, setRawParams] = useState<Record<string, string>>({});
  const [loaderData, setLoaderData] = useState<LoaderResult<unknown>[]>([]);

  const handleRouteChange = useCallback(() => {
    const currentUrl = window.location.pathname;
    const parseResult = routeParser(routes, currentUrl);

    Effect.runPromise(parseResult).then(({ routes: matchedRoutes, params }) => {
      setMatchedRoutes(matchedRoutes as T[number][]);
      setRawParams(params);
      setLoaderData(
        matchedRoutes.map((route) => ({
          state: route.loader ? "no-loader" : "loading",
        }))
      );
    });
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

        const loaderEffect = isDynamicRoute(route)
          ? route.loader(route.params.parse(rawParams))
          : route.loader();

        Effect.runPromise(loaderEffect)
          .then((result) => {
            setLoaderData((data) => {
              const newData = [...data];
              newData[index] = {
                data: result,
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

  function navigate<Path extends string>({
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
        <Outlet />
      </OutletWrapper>
    </RouterContext>
  );
}
