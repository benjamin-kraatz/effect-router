import type { ReactNode } from "react";
import { z } from "zod";
import { Effect } from "effect";

export type Route<
  Path extends string,
  P extends z.AnyZodObject = z.AnyZodObject,
  R = unknown
> = {
  path: Path;
  component?: ReactNode;
  params?: P;
  loader?: P extends z.AnyZodObject
    ? (params: z.infer<P>) => Effect.Effect<R, unknown, never>
    : undefined;
};

export type ParsedRoute = {
  component: ReactNode;
  params?: z.AnyZodObject;
};
