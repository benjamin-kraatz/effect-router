import type { ComponentType } from "react";
import { z } from "zod";
import { Effect } from "effect";
import type { Register } from "./effect-router";
import { LoaderError } from "./routerTypes";

export type RegisteredRoutes = Register extends { routes: infer R }
  ? R extends readonly (infer Route)[]
    ? Route
    : never
  : DefinedRoute<z.AnyZodObject, unknown, LoaderError, boolean>;

export type RegisteredRoutesArray = Register extends { routes: infer R }
  ? R extends readonly (infer Route)[]
    ? readonly Route[]
    : never
  : readonly DefinedRoute<z.AnyZodObject, unknown, LoaderError, boolean>[];

export type NavigableRoutes = Exclude<RegisteredRoutes, { layout: true }>;

export type DynamicRoute = `${string}/:${string}`;

// Extract path from a route
export type RoutePath<T> = T extends { path: infer P } ? P : never;

// Extract all valid paths from registered routes
export type ValidPaths = RoutePath<RegisteredRoutes>;

// Extract parameters from a route
export type RouteParams<T> = T extends { params: infer P } ? P : never;

// Create a more explicit type map for route parameters
export type RouteParamsMap = {
  [K in ValidPaths]: K extends DynamicRoute
    ? RouteParams<Extract<RegisteredRoutes, { path: K }>>
    : never;
};

// Get parameters for a specific path
export type ParamsForPath<Path extends ValidPaths> = RouteParamsMap[Path];

// Type-safe navigation options
export type NavigateOptions<Path extends ValidPaths> = Path extends DynamicRoute
  ? { url: Path; params: ParamsForPath<Path> }
  : { url: Path; params?: never };

// Type-safe link props
export type LinkProps<Path extends ValidPaths> = Path extends DynamicRoute
  ? { href: Path; params: ParamsForPath<Path> }
  : { href: Path; params?: never };

// Helper type to check if a path is valid
export type IsValidPath<Path extends string> = Path extends ValidPaths ? true : false;

// Helper type to check if a path requires parameters
export type RequiresParams<Path extends ValidPaths> = Path extends DynamicRoute ? true : false;

// Explicit route definitions for better type safety
export type KnownRoutes = "/" | "/about/:id";

// Explicit parameter definitions
export type RouteParameters = {
  "/": never;
  "/about/:id": { id: number };
};

// Type-safe navigation with explicit route mapping
export type TypedNavigateOptions<Path extends KnownRoutes> = Path extends keyof RouteParameters
  ? RouteParameters[Path] extends never
    ? { url: Path; params?: never }
    : { url: Path; params: RouteParameters[Path] }
  : never;

// Type-safe link props with explicit route mapping
export type TypedLinkProps<Path extends KnownRoutes> = Path extends keyof RouteParameters
  ? RouteParameters[Path] extends never
    ? { href: Path; params?: never }
    : { href: Path; params: RouteParameters[Path] }
  : never;

export type RouteWithParams<
  Params extends z.AnyZodObject,
  Loader,
  LoaderErrorType extends LoaderError,
  Layout extends boolean = false
> = BaseRoute<Layout> & {
  path: DynamicRoute;
  params: Params;
  loader?: (
    params: z.infer<Params>
  ) => Effect.Effect<Loader, LoaderErrorType, never>;
};

export type RouteWithNoParams<
  Loader,
  LoaderErrorType extends LoaderError,
  Layout extends boolean = false
> = BaseRoute<Layout> & {
  path: string;
  loader?: () => Effect.Effect<Loader, LoaderErrorType, never>;
};

export function isDynamicRoute<
  Params extends z.AnyZodObject,
  Loader,
  LoaderErrorType extends LoaderError,
  Layout extends boolean = false
>(
  route:
    | Omit<DefinedRoute<Params, Loader, LoaderErrorType, Layout>, "path">
    | DefinedRoute<Params, Loader, LoaderErrorType, Layout>
): route is RouteWithParams<Params, Loader, LoaderErrorType, Layout> {
  return (
    (route as RouteWithParams<Params, Loader, LoaderErrorType, Layout>)
      .params != null
  );
}

export type BaseRoute<Layout extends boolean = false> = {
  component: ComponentType;
  layout?: Layout;
  path: string;
  loader?: (...args: unknown[]) => Effect.Effect<unknown, LoaderError, never>;
};

type DefinedRoute<
  Params extends z.AnyZodObject,
  Loader,
  LoaderErrorType extends LoaderError,
  Layout extends boolean = false
> =
  | RouteWithParams<Params, Loader, LoaderErrorType, Layout>
  | RouteWithNoParams<Loader, LoaderErrorType, Layout>;
