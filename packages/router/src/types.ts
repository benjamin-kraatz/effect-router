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

export type ParamsForPath<Path extends string> =
  Path extends DynamicRoute
    ? Path extends "/about/:id"
      ? { id: number }
      : Record<string, string | number>
    : never;

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
  params?: z.AnyZodObject;
};

type DefinedRoute<
  Params extends z.AnyZodObject,
  Loader,
  LoaderErrorType extends LoaderError,
  Layout extends boolean = false
> =
  | RouteWithParams<Params, Loader, LoaderErrorType, Layout>
  | RouteWithNoParams<Loader, LoaderErrorType, Layout>;
