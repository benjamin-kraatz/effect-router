# Effect Router Core

A React router built from the ground up with Effect, providing type-safe, composable, and resource-safe routing with advanced error handling.

## Core Features

- **Effect-First Design**: Every aspect of the router uses Effect for error handling, resource management, and composability
- **Type-Safe Loaders**: Loaders return `Effect.Effect<Data, Error, never>` instead of `Promise<Data>`
- **Advanced Error Handling**: Built-in retry logic, error recovery, and proper error types
- **Resource Safety**: Automatic cleanup and resource management through Effect
- **Composable**: Easy to compose complex routing logic using Effect's monadic operations

## Basic Usage

### Defining Routes with Effect Loaders

```typescript
import { Effect, Schema } from "effect";
import { z } from "zod";
import { defineRoute } from "./defineRoute";

// Define your data schemas
const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
});

// Create a route with Effect-based loader
const userRoute = defineRoute("/users/:id", {
  component: UserComponent,
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  loader: (params) =>
    Effect.gen(function* () {
      // Use Effect for API calls with proper error handling
      const user = yield* Effect.tryPromise({
        try: () => fetch(`/api/users/${params.id}`).then((res) => res.json()),
        catch: (error) => new Error(`Failed to fetch user: ${error}`),
      });
      
      // Validate response with Schema
      return yield* Schema.decodeUnknown(UserSchema)(user);
    }),
});
```

### Using Loader Data in Components

```typescript
function UserComponent() {
  const { data, state } = userRoute.useLoaderData();
  
  if (state === "loading") return <div>Loading...</div>;
  if (state === "error") return <div>Error loading user</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

### Advanced Error Handling

```typescript
const postRoute = defineRoute("/posts/:id", {
  component: PostComponent,
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  loader: (params) =>
    Effect.gen(function* () {
      // Use Effect's retry logic for resilience
      const post = yield* Effect.retry(
        Effect.tryPromise({
          try: () => fetch(`/api/posts/${params.id}`).then((res) => res.json()),
          catch: (error) => new Error(`Failed to fetch post: ${error}`),
        }),
        {
          times: 3,
          delay: 1000,
        }
      );
      
      return yield* Schema.decodeUnknown(PostSchema)(post);
    }),
});
```

### Using Effect Services

```typescript
// Define a service
class UserService extends Effect.Service("UserService")() {
  constructor(
    readonly getUser: (id: number) => Effect.Effect<User, Error, never>
  ) {
    super();
  }
}

// Use the service in a loader
const userWithServiceRoute = defineRoute("/users/:id/profile", {
  component: UserProfileComponent,
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  loader: (params) =>
    Effect.gen(function* () {
      const userService = yield* UserService;
      return yield* userService.getUser(params.id);
    }),
});
```

### Layout Routes

```typescript
const layoutRoute = defineRoute("/", {
  component: LayoutComponent,
  layout: true,
  loader: () =>
    Effect.gen(function* () {
      // Load layout configuration
      const config = yield* Effect.sync(() => ({
        title: "My App",
        theme: "dark",
      }));
      
      return config;
    }),
});
```

## Effect Integration Points

### 1. Loader Functions
- Return `Effect.Effect<Data, Error, never>` instead of `Promise<Data>`
- Use `Effect.gen` for complex async operations
- Leverage Effect's error handling and retry mechanisms

### 2. Route Parsing
- Route parsing is wrapped in `Effect.sync` for consistency
- Error handling through Effect's error channel

### 3. Navigation
- Navigation operations use Effect for side effects
- Proper error handling for navigation failures

### 4. Context Management
- Router context uses Effect types for loader data
- Proper typing for Effect-based operations

## Benefits of Effect Integration

1. **Type Safety**: Full type safety throughout the routing system
2. **Error Handling**: Comprehensive error handling with Effect's error channel
3. **Resource Management**: Automatic cleanup and resource management
4. **Composability**: Easy to compose complex routing logic
5. **Testing**: Effect's testing utilities make router testing straightforward
6. **Observability**: Built-in logging and tracing through Effect

## Migration from Promise-based Loaders

If you're migrating from Promise-based loaders:

```typescript
// Before (Promise-based)
loader: (params) => fetch(`/api/users/${params.id}`).then(res => res.json())

// After (Effect-based)
loader: (params) => 
  Effect.tryPromise({
    try: () => fetch(`/api/users/${params.id}`).then(res => res.json()),
    catch: (error) => new Error(`Failed to fetch user: ${error}`),
  })
```

## Error Handling Patterns

### Retry Logic
```typescript
loader: (params) =>
  Effect.retry(
    Effect.tryPromise({
      try: () => fetch(`/api/users/${params.id}`).then(res => res.json()),
      catch: (error) => new Error(`Failed to fetch user: ${error}`),
    }),
    { times: 3, delay: 1000 }
  )
```

### Timeout Handling
```typescript
loader: (params) =>
  Effect.timeout(
    Effect.tryPromise({
      try: () => fetch(`/api/users/${params.id}`).then(res => res.json()),
      catch: (error) => new Error(`Failed to fetch user: ${error}`),
    }),
    "5 seconds"
  )
```

### Fallback Data
```typescript
loader: (params) =>
  Effect.orElse(
    Effect.tryPromise({
      try: () => fetch(`/api/users/${params.id}`).then(res => res.json()),
      catch: (error) => new Error(`Failed to fetch user: ${error}`),
    }),
    () => Effect.succeed({ id: params.id, name: "Unknown User", email: "unknown@example.com" })
  )
```

This router demonstrates how Effect can be used throughout a React application to provide better error handling, resource management, and type safety. 