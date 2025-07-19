import { homeRoute } from "./pages/home";
import { aboutRoute } from "./pages/about/[id]";

export const routes = [homeRoute, aboutRoute] as const;

declare module "./router/effect-router" {
  interface Register {
    routes: typeof routes;
  }
}
