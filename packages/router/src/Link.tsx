import { ComponentProps, MouseEvent } from "react";
import { useRouterContext } from "./routerHooks";
import { KnownRoutes, TypedLinkProps } from "./types";

export function Link<Path extends KnownRoutes>({
  onClick,
  href,
  params,
  ...props
}: Omit<ComponentProps<"a">, "href"> & TypedLinkProps<Path>) {
  const url =
    params == null
      ? href
      : Object.entries(params).reduce((acc, [key, value]) => {
          return acc.replace(`:${key}`, value.toString());
        }, href as string);

  const { goToUrl } = useRouterContext();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onClick?.(event);
    goToUrl(url);
  };
  return <a onClick={handleClick} href={url} {...props} />;
}
