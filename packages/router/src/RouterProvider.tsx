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
  RoutePath,
} from "./types";
import { RouterContext } from "./routerHooks";

export function RouterProvider<T extends readonly BaseRoute[]>({
  routes,
  children,
}: {
  routes: T;
  children?: React.ReactNode;
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
          state: route.loader ? "loading" : "no-loader",
        }))
      );
    });
  }, [routes]);

  useEffect(() => {
    // Collect all loader effects first
    const loaderEffects: Array<{ index: number; effect: Effect.Effect<unknown, unknown, never> }> = [];
    
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

        loaderEffects.push({ index, effect: loaderEffect });
      }
    });

    // Run all loader effects in parallel using Effect.all with proper error handling
    if (loaderEffects.length > 0) {
      // Transform each effect to always succeed, carrying success/error state
      const safeEffects = loaderEffects.map(({ index, effect }) =>
        effect.pipe(
          Effect.map((data) => ({ index, success: true as const, data })),
          Effect.catchAll((error) => 
            Effect.succeed({ index, success: false as const, error })
          )
        )
      );
      
      const allEffects = Effect.all(safeEffects);
      
      //#region Run effects from loaders
      Effect.runPromise(allEffects).then((results) => {
        setLoaderData((data) => {
          const newData = [...data];
          
          results.forEach((result) => {
            if (result.success) {
              newData[result.index] = {
                data: result.data,
                state: "loaded",
              };
            } else {
              newData[result.index] = {
                state: "error",
                error: result.error as Error,
              };
            }
          });
          
          return newData;
        });
      });
      //#endregion
    }
  }, [matchedRoutes, rawParams]);

  // Ensure initial route matching on mount and when routes change
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

  const navigate = useCallback(
    <Path extends RoutePath>(
      options: { url: Path } & (Path extends DynamicRoute
        ? { params: ParamsForPath<Path> }
        : { params?: undefined })
    ): void => {
      const { url, params } = options;
      const parsedUrl =
        params == null
          ? url
          : Object.entries(params).reduce((acc, [key, value]) => {
              return acc.replace(`:${key}`, value.toString());
            }, url as string);

      window.history.pushState({}, "", parsedUrl);
      handleRouteChange();
    },
    [handleRouteChange]
  );

  return (
    <RouterContext
      value={{ matchedRoutes, navigate, goToUrl, rawParams, loaderData }}
    >
      <OutletWrapper depth={-1}>
        {children ?? <Outlet />}
      </OutletWrapper>
    </RouterContext>
  );
}
