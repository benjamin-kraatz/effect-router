import { Effect } from "effect";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

// Effect-based route definition types
export interface EffectRoute<
  Path extends string,
  Params extends z.AnyZodObject = z.AnyZodObject,
  Loader = unknown
> {
  path: Path;
  component: React.ComponentType;
  params?: Params;
  loader?: (params: z.infer<Params>) => Effect.Effect<Loader, unknown, never>;
  layout?: boolean;
}

// Effect-based router context
export interface EffectRouterContext {
  routes: EffectRoute<string, z.AnyZodObject, unknown>[];
  navigate: (url: string, params?: Record<string, string>) => void;
  goToUrl: (url: string) => void;
  rawParams: Record<string, string>;
  loaderData: Array<{
    data?: unknown;
    state: "loaded" | "loading" | "error" | "no-loader";
    error?: Error;
  }>;
}
