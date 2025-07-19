/* eslint-disable react-refresh/only-export-components */
import { Context, Data, Effect, Schedule, Schema } from "effect";
import { z } from "zod";
import { defineRoute } from "../router/defineRoute";
import { createLoader, withSchemaErrors } from "../router/loaderUtils";

export class UserFetchError extends Data.Error<{ message: string }> {}
export class UserParseError extends Data.Error<{ message: string }> {}

export class PostFetchError extends Data.Error<{ message: string }> {}
export class PostParseError extends Data.Error<{ message: string }> {}

// Example 1: SOLUTION - Using createLoader to automatically include ParseError
// ⚠️ Not recommended since the latest version, as the `loader` function already infers the types correctly.
const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
});
type User = typeof UserSchema.Type;

const userRoute = defineRoute("/users/:id", {
  component: UserComponent,
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  loader: (params) =>
    // ✅ SOLUTION: createLoader automatically includes ParseError in the type
    createLoader<User, UserFetchError>(
      Effect.tryPromise({
        try: () => fetch(`/api/users/${params.id}`).then((res) => res.json()),
        catch: (error) =>
          new UserFetchError({ message: `Failed to fetch user: ${error}` }),
      }),
      UserSchema // This automatically includes ParseError in the return type
    ),
});

// Example 2: SOLUTION - Auto-inferred types, including the return type, the error type and the requirements.
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
      const post = yield* Effect.retry(
        Effect.tryPromise({
          try: () => fetch(`/api/posts/${params.id}`).then((res) => res.json()),
          catch: (error) =>
            new PostFetchError({ message: `Failed to fetch post: ${error}` }),
        }),
        Schedule.exponential(1000)
      );

      return yield* Schema.decodeUnknown(PostSchema)(post);
    }).pipe(
      // ✅ SOLUTION: Manually catch and transform ParseError and it'll no longer be included in the type. Instead, the returned type will be the declared errors.
      Effect.catchTags({
        ParseError: (error) => {
          return new PostParseError({
            message: `Failed to parse post: ${error}`,
          });
        },
      })
    ),
});

// Example 3: A loader effect HAS to be provided with all requirements. This is subject to change in future versions (custom runtime in context, etc.)
class UserService extends Context.Tag("UserService")<
  UserService,
  {
    getUser: (
      id: number
    ) => Effect.Effect<User, UserFetchError | UserParseError, never>;
  }
>() {}

const userWithServiceRoute = defineRoute("/users/:id/profile", {
  component: UserProfileComponent,
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  // @ts-expect-error - This is intentional to show that the loader effect must have been provided with all requirements.
  loader: (params) =>
    Effect.gen(function* () {
      const userService = yield* UserService;
      return yield* userService.getUser(params.id);
    }),
});

// Example 4: Layout route with Effect-based loader
const layoutRoute = defineRoute("/", {
  component: LayoutComponent,
  layout: true,
  loader: () =>
    Effect.gen(function* () {
      const config = yield* Effect.sync(() => ({
        title: "My App",
        theme: "dark",
      }));
      return config;
    }),
});

// Example components
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
