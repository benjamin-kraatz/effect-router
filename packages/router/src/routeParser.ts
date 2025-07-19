import { Effect } from "effect";
import type { BaseRoute } from "./types";

export function routeParser(routes: readonly BaseRoute[], url: string) {
  return Effect.sync(() => {
    const layoutRoutes = routes.filter((route) => route.layout);
    const contentRoutes = routes.filter((route) => !route.layout);

    const matchedRoute = contentRoutes.find((route) =>
      isRouteMatch(url, route.path)
    );

    if (matchedRoute == null) {
      return { routes: [], params: {} };
    }

    const normalizedUrlParts = normalizeUrl(url).split("/");
    const matchingLayouts = layoutRoutes
      .filter((route) => {
        for (let i = normalizedUrlParts.length; i > 0; i--) {
          const prefix = normalizedUrlParts.slice(0, i).join("/");
          if (isRouteMatch(prefix, route.path)) {
            return true;
          }
        }
      })
      .sort((a, b) => {
        return a.path.split("/").length - b.path.split("/").length;
      });

    return {
      routes: [...matchingLayouts, matchedRoute],
      params: getParamsFromRoute(url, matchedRoute.path),
    };
  });
}

function isRouteMatch(url: string, routeUrl: string) {
  const normalizedUrl = normalizeUrl(url).split("/");
  const normalizedRouteUrl = normalizeUrl(routeUrl).split("/");

  if (normalizedUrl.length !== normalizedRouteUrl.length) return false;

  return normalizedRouteUrl.every((segment, index) => {
    if (segment.startsWith(":")) return true; // Ignore dynamic segments
    return normalizedUrl[index] === segment;
  });
}

function normalizeUrl(url: string) {
  if (url === "" || url === "/") return "";
  return url.replace(/^\/+|\/+$/g, "");
}

function getParamsFromRoute(url: string, routeUrl: string) {
  const normalizedUrl = normalizeUrl(url).split("/");
  const normalizedRouteUrl = normalizeUrl(routeUrl).split("/");
  const params: Record<string, string> = {};

  normalizedRouteUrl.forEach((segment, index) => {
    if (segment.startsWith(":")) {
      const value = normalizedUrl[index];
      if (typeof value === "string") {
        params[segment.slice(1)] = value;
      }
    }
  });

  return params;
}
