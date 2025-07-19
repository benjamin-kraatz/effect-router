import { z } from "zod";
import { Effect } from "effect";
import {
  BaseRoute,
  DynamicRoute,
  RouteWithParams,
  RouteWithNoParams,
  isDynamicRoute,
} from "./types";
import { useLoaderContext } from "./outletHooks";
import { LoaderError, LoaderResult } from "./routerTypes";
import { useRouterContext } from "./routerHooks";

// Helper type to ensure all errors from an Effect are included in the loader error type
export type WithAllErrors<
  T extends Effect.Effect<unknown, unknown, unknown>,
  DeclaredErrors extends LoaderError
> = T extends Effect.Effect<infer A, infer E, infer R>
  ? Effect.Effect<A, E | DeclaredErrors, R>
  : never;

// Type to extract all parameter keys from a path
type ExtractAllParamKeys<Path> =
  Path extends `${string}/:${infer Param}/${infer Rest}`
    ? Param | ExtractAllParamKeys<`/${Rest}`>
    : Path extends `${string}/:${infer Param}`
    ? Param
    : never;

// Type to validate that params schema matches the path parameters exactly
type ValidateParams<
  Path extends string,
  Schema extends z.AnyZodObject
> = string extends Path
  ? Schema // If Path is just string, allow any schema
  : ExtractAllParamKeys<Path> extends never
  ? Schema // No params in path, allow any schema
  : keyof z.infer<Schema> extends ExtractAllParamKeys<Path>
  ? ExtractAllParamKeys<Path> extends keyof z.infer<Schema>
    ? Schema
    : never // Missing required keys
  : never; // Extra keys

export function defineRoute<
  const Path extends string,
  const Params extends z.AnyZodObject &
    (Path extends DynamicRoute
      ? ValidateParams<Path, Params> extends never
        ? {
            __validateError: "Params schema must include all path parameters. Check that your params object contains all parameters from the route path.";
          }
        : z.AnyZodObject
      : z.AnyZodObject),
  const Loader,
  const LoaderErrorType extends LoaderError,
  const Layout extends boolean = false
>(
  path: Path,
  route: Path extends DynamicRoute
    ? Omit<RouteWithParams<Params, Loader, LoaderErrorType, Layout>, "path">
    : Omit<RouteWithNoParams<Loader, LoaderErrorType, Layout>, "path">
) {
  const isDynamic = path.includes(":");

  const result = {
    ...route,
    path,
    layout: (route.layout ?? false) as Layout,
    useLoaderData: () => useLoaderContext() as LoaderResult<Loader>,
    useParams: (): Path extends DynamicRoute
      ? z.infer<Params>
      : Record<string, never> => {
      const rawParams = useRouterContext().rawParams;
      if (isDynamic && isDynamicRoute(route)) {
        return route.params.parse(rawParams) as Path extends DynamicRoute
          ? z.infer<Params>
          : Record<string, never>;
      } else {
        return {} as Path extends DynamicRoute
          ? z.infer<Params>
          : Record<string, never>;
      }
    },
  };

  // Type assertion to ensure compatibility with BaseRoute
  return result as BaseRoute<Layout> & {
    path: Path;
    params: Path extends DynamicRoute ? Params : never;
    useLoaderData: () => LoaderResult<Loader>;
    useParams: () => Path extends DynamicRoute
      ? z.infer<Params>
      : Record<string, never>;
  };
}
