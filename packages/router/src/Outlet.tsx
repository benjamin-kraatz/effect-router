import type { ReactNode, ComponentType } from "react";
import { useRouterContext } from "./routerHooks";
import { useOutletContext, OutletContext, LoaderContext } from "./outletHooks";

export function Outlet() {
  const { matchedRoutes } = useRouterContext();
  const { depth } = useOutletContext();
  
  if (depth >= matchedRoutes.length) return null;

  const route = matchedRoutes.at(depth);
  const Component = (route as { component: ComponentType } | undefined)?.component;

  return (
    <OutletWrapper depth={depth}>
      {Component ? <Component /> : <Outlet />}
    </OutletWrapper>
  );
}

export function OutletWrapper({
  children,
  depth,
}: {
  children: ReactNode;
  depth: number;
}) {
  const { loaderData } = useRouterContext();
  return (
    <LoaderContext.Provider value={{ data: loaderData[depth] }}>
      <OutletContext.Provider value={{ depth: depth + 1 }}>{children}</OutletContext.Provider>
    </LoaderContext.Provider>
  );
}
