import { z } from "zod";
import { Effect } from "effect";
import {
  BaseRoute,
} from "./types";
import { useLoaderContext } from "./outletHooks";
import { LoaderError, LoaderResult } from "./routerTypes";
import { useRouterContext } from "./routerHooks";
import { ComponentType } from "react";

// Helper type to ensure all errors from an Effect are included in the loader error type
export type WithAllErrors<
  T extends Effect.Effect<unknown, unknown, unknown>,
  DeclaredErrors extends LoaderError
> = T extends Effect.Effect<infer A, infer E, infer R>
  ? Effect.Effect<A, E | DeclaredErrors, R>
  : never;

// Union type for route configurations
type RouteConfig<
  Params extends z.AnyZodObject | undefined,
  Loader,
  LoaderErrorType extends LoaderError,
  Layout extends boolean = false
> = Params extends z.AnyZodObject
  ? {
      component: ComponentType;
      params: Params;
      loader?: (
        params: z.infer<Params>
      ) => Effect.Effect<Loader, LoaderErrorType, never>;
      layout?: Layout;
    }
  : {
      component: ComponentType;
      loader?: () => Effect.Effect<Loader, LoaderErrorType, never>;
      layout?: Layout;
    };

export function defineRoute<
  const Path extends string,
  const Params extends z.AnyZodObject | undefined,
  const Loader,
  const LoaderErrorType extends LoaderError,
  const Layout extends boolean = false
>(
  path: Path,
  config: RouteConfig<Params, Loader, LoaderErrorType, Layout>
) {
  const isDynamic = path.includes(":");
  
  const result = {
    ...config,
    path,
    layout: (config.layout ?? false) as Layout,
    useLoaderData: () => useLoaderContext() as LoaderResult<Loader>,
    useParams: (): Params extends z.AnyZodObject ? z.infer<Params> : Record<string, never> => {
      const rawParams = useRouterContext().rawParams;
      if (isDynamic && 'params' in config && config.params) {
        return config.params.parse(rawParams) as Params extends z.AnyZodObject ? z.infer<Params> : Record<string, never>;
      } else {
        return {} as Params extends z.AnyZodObject ? z.infer<Params> : Record<string, never>;
      }
    },
  };

  // Type assertion to ensure compatibility with BaseRoute
  return result as BaseRoute<Layout> & {
    path: Path;
    useLoaderData: () => LoaderResult<Loader>;
    useParams: () => Params extends z.AnyZodObject ? z.infer<Params> : Record<string, never>;
  };
}
