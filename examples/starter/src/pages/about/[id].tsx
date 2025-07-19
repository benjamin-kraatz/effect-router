import { z } from "zod";
import { defineRoute } from "effect-router";

export const aboutRoute = defineRoute("/about/:id", {
  component: AboutPage,
  params: z.object({ id: z.coerce.number() }),
});

// eslint-disable-next-line react-refresh/only-export-components
function AboutPage() {
  const params = aboutRoute.useParams();
  return <h3>About - {params.id}</h3>;
}
