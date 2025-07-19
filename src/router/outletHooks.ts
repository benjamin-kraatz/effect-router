import { createContext, useContext } from "react";

const OutletContext = createContext<{ depth: number } | null>(null);
const LoaderContext = createContext<{ data: unknown }>({
  data: undefined,
});

export function useOutletContext() {
  const context = useContext(OutletContext);
  if (context == null) {
    throw new Error("useOutletContext must be used within an Outlet");
  }
  return context;
}

export function useLoaderContext() {
  const context = useContext(LoaderContext);
  if (context == null) {
    throw new Error("useLoaderContext must be used within a LoaderContext");
  }
  return context.data;
}

export { OutletContext, LoaderContext }; 