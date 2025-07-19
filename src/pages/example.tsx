/* eslint-disable react-refresh/only-export-components */
import { Context, Effect, Schedule, Schema } from "effect";
import { z } from "zod";
import { defineRoute } from "../router/defineRoute";

// Define User type
type User = {
  id: number;
  name: string;
  email: string;
};

// Example 1: Simple route with Effect-based loader
const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
});

const userRoute = defineRoute("/users/:id", {
  component: UserComponent,
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  loader: (params) =>
    Effect.gen(function* () {
      // Simulate API call with Effect
      const user = yield* Effect.tryPromise({
        try: () => fetch(`/api/users/${params.id}`).then((res) => res.json()),
        catch: (error) => new Error(`Failed to fetch user: ${error}`),
      });

      // Validate the response with Schema
      return yield* Schema.decodeUnknown(UserSchema)(user);
    }),
});

// Example 2: Route with error handling using Effect
const PostSchema = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
  content: Schema.String,
});

const postRoute = defineRoute("/posts/:id", {
  component: PostComponent,
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  loader: (params) =>
    Effect.gen(function* () {
      // Use Effect for error handling and retry logic
      const post = yield* Effect.retry(
        Effect.tryPromise({
          try: () => fetch(`/api/posts/${params.id}`).then((res) => res.json()),
          catch: (error) => new Error(`Failed to fetch post: ${error}`),
        }),
        Schedule.exponential(1000)
      );

      return yield* Schema.decodeUnknown(PostSchema)(post);
    }),
});

// Example 3: Route with dependencies using Effect Context
class UserService extends Context.Tag("UserService")<
  UserService,
  {
    getUser: (id: number) => Effect.Effect<User, Error, never>;
  }
>() {}

const userWithServiceRoute = defineRoute("/users/:id/profile", {
  component: UserProfileComponent,
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  loader: (params) =>
    Effect.gen(function* () {
      const userService = yield* UserService;
      return yield* userService.getUser(params.id);
    }).pipe(
      Effect.provideService(
        UserService,
        UserService.of({
          getUser: (id) =>
            Effect.gen(function* () {
              const user = yield* Effect.tryPromise({
                try: () => fetch(`/api/users/${id}`).then((res) => res.json()),
                catch: (error) => new Error(`Failed to fetch user: ${error}`),
              });
              return yield* Schema.decodeUnknown(UserSchema)(user);
            }),
        })
      )
    ),
});

// Example 4: Layout route with Effect-based loader
const layoutRoute = defineRoute("/", {
  component: LayoutComponent,
  layout: true,
  loader: () =>
    Effect.gen(function* () {
      // Load layout data
      const config = yield* Effect.sync(() => ({
        title: "My App",
        theme: "dark",
      }));

      return config;
    }),
});

// Example components (these would be actual React components)
function UserComponent() {
  const { data, state } = userRoute.useLoaderData();

  if (state === "loading") return <div>Loading...</div>;
  if (state === "error") return <div>Error loading user</div>;
  if (!data) return <div>User not found</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}

function PostComponent() {
  const { data, state } = postRoute.useLoaderData();
  // const params = postRoute.useParams();

  if (state === "loading") return <div>Loading...</div>;
  if (state === "error") return <div>Error loading post</div>;
  if (!data) return <div>Post not found</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </div>
  );
}

function UserProfileComponent() {
  const { data, state } = userWithServiceRoute.useLoaderData();

  if (state === "loading") return <div>Loading...</div>;
  if (state === "error") return <div>Error loading user profile</div>;
  if (!data) return <div>User not found</div>;
  return (
    <div>
      <h1>Profile: {data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}

function LayoutComponent() {
  const { data, state } = layoutRoute.useLoaderData();

  if (state === "loading") return <div>Loading layout...</div>;

  if (!data) return <div>Layout not found</div>;
  return (
    <div className={`theme-${data.theme}`}>
      <header>
        <h1>{data.title}</h1>
      </header>
      <main>{/* Outlet will render child routes here */}</main>
    </div>
  );
}
