import { homeRoute } from "./pages/home";
import { aboutRoute } from "./pages/about/[id]";
import { rpcExampleRoute } from "./pages/rpc-example";

export const routes = [homeRoute, aboutRoute, rpcExampleRoute] as const;

declare module "effect-router" {
  interface Register {
    routes: typeof routes;
  }
}
