# Effect Router RPC (Server Functions)

Effect Router now includes a powerful RPC (Remote Procedure Call) system that provides type-safe server functions. This feature allows you to define server functions with full type safety, automatic serialization, and error handling.

## Features

- **Type-safe**: All RPC calls are fully type-safe with TypeScript
- **Automatic serialization**: Payloads and responses are automatically serialized/deserialized
- **Error handling**: Built-in error handling with typed error schemas
- **HTTP transport**: Default HTTP transport with customizable options
- **Custom transports**: Support for custom transport implementations
- **Effect integration**: Full integration with Effect for functional programming

## Quick Start

### 1. Define Your RPC Schema

```typescript
import * as S from "@effect/schema";
import { RPC, registerRPC } from "effect-router/server";

// Define your data schemas
export const User = S.struct({
  id: S.string,
  name: S.string,
  email: S.string,
  createdAt: S.Date,
});

export type User = S.Schema.To<typeof User>;

// Define error schemas
export class UserNotFoundError extends S.TaggedError<UserNotFoundError>()(
  "UserNotFoundError"
)("UserNotFoundError", {
  userId: S.string,
});

// Define your RPC group
export const UsersRpc = registerRPC({
  Get: RPC.route("Get", {
    payload: S.struct({ id: S.string }),
    success: S.struct({ user: User }),
    error: UserNotFoundError,
  }),
  List: RPC.route("List", {
    success: S.struct({ users: S.array(User) }),
    error: S.struct({ message: S.string }),
  }),
});
```

### 2. Create Server Handlers

```typescript
// Server-side handlers
export const usersHandlers = {
  Get: (payload: { id: string }) => {
    const user = findUserById(payload.id);
    if (!user) {
      return new UserNotFoundError({ userId: payload.id });
    }
    return { user };
  },
  List: () => {
    const users = getAllUsers();
    return { users };
  },
};
```

### 3. Set Up the Server

```typescript
import { createServerHandler, registerRPCGroups } from "effect-router/server";
import { UsersRpc, usersHandlers } from "./users";

// Register all RPC groups
const allRpcGroups = registerRPCGroups([UsersRpc]);

// Create server handlers
const allHandlers = { ...usersHandlers };

// Create the server
const server = createServerHandler(allRpcGroups, allHandlers);

// Use with Express.js
app.post("/api/rpc", async (req, res) => {
  const result = await Effect.runPromise(
    server.handle(req.body, transport)
  );
  res.json(result);
});
```

### 4. Create Client Functions

```typescript
import { createServerFn } from "effect-router/client";
import { UsersRpc } from "./users";

// Create type-safe client functions
const usersApi = {
  Get: createServerFn(UsersRpc, "Get"),
  List: createServerFn(UsersRpc, "List"),
};

// Use in your application
const user = await Effect.runPromise(
  Effect.gen(function* (_) {
    const response = yield* _(usersApi.Get({ id: "user-123" }));
    return response.user;
  })
);
```

## API Reference

### Server-Side API

#### `RPC.route(name, definition)`

Creates a new RPC route definition.

```typescript
RPC.route("MethodName", {
  payload?: S.Schema<any, any>,    // Optional payload schema
  success: S.Schema<any, any>,     // Success response schema
  error: S.Schema<any, any>,       // Error schema
})
```

#### `registerRPC(routes)`

Registers a collection of RPC routes into a group.

```typescript
const MyRpc = registerRPC({
  Method1: RPC.route("Method1", { ... }),
  Method2: RPC.route("Method2", { ... }),
});
```

#### `registerRPCGroups(groups)`

Combines multiple RPC groups into a single group.

```typescript
const allGroups = registerRPCGroups([
  UsersRpc,
  ProductsRpc,
  OrdersRpc,
]);
```

#### `createServerHandler(group, handlers)`

Creates a server handler for the given RPC group.

```typescript
const server = createServerHandler(allGroups, allHandlers);
```

### Client-Side API

#### `createServerFn(group, methodName, options?)`

Creates a type-safe server function client.

```typescript
const client = createServerFn(UsersRpc, "Get", {
  url: "/api/rpc",
  headers: { "Authorization": "Bearer token" },
});
```

#### `createServerFnWithTransport(group, methodName, transport)`

Creates a server function client with a custom transport.

```typescript
const client = createServerFnWithTransport(UsersRpc, "Get", customTransport);
```

#### `createRpcClient(group, options?)`

Creates a full RPC client for all methods in a group.

```typescript
const client = createRpcClient(UsersRpc, {
  url: "/api/rpc",
  headers: { "Authorization": "Bearer token" },
});
```

## Error Handling

Effect Router RPC provides comprehensive error handling with typed error schemas:

```typescript
// Define typed errors
export class ValidationError extends S.TaggedError<ValidationError>()(
  "ValidationError"
)("ValidationError", {
  field: S.string,
  message: S.string,
});

export class DatabaseError extends S.TaggedError<DatabaseError>()(
  "DatabaseError"
)("DatabaseError", {
  code: S.string,
  message: S.string,
});

// Use in your RPC routes
RPC.route("Create", {
  payload: S.struct({ name: S.string, email: S.string }),
  success: S.struct({ user: User }),
  error: S.union(ValidationError, DatabaseError),
})
```

## Transport Options

### HTTP Transport (Default)

```typescript
import * as Transport from "@effect/rpc/Transport";

const transport = Transport.http("/api/rpc", {
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer token",
  },
});
```

### Custom Transport

```typescript
const customTransport: Rpc.Transport = {
  send: (message) => Effect.succeed(response),
  // ... other transport methods
};
```

## Advanced Usage

### Multiple RPC Groups

```typescript
// Define multiple RPC groups
export const UsersRpc = registerRPC({ ... });
export const ProductsRpc = registerRPC({ ... });
export const OrdersRpc = registerRPC({ ... });

// Combine them
const allRpcGroups = registerRPCGroups([
  UsersRpc,
  ProductsRpc,
  OrdersRpc,
]);
```

### Custom Error Handling

```typescript
const result = await Effect.runPromise(
  Effect.gen(function* (_) {
    try {
      const response = yield* _(usersApi.Get({ id: "user-123" }));
      return response.user;
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        console.log(`User ${error.userId} not found`);
        return null;
      }
      throw error;
    }
  })
);
```

### Middleware Support

```typescript
// Add authentication middleware
const authenticatedTransport = Transport.http("/api/rpc", {
  headers: {
    "Authorization": `Bearer ${getAuthToken()}`,
  },
});

const authenticatedClient = createRpcClientWithTransport(UsersRpc, authenticatedTransport);
```

## Best Practices

1. **Use descriptive error types**: Create specific error types for different failure scenarios
2. **Validate inputs**: Use schema validation for all inputs and outputs
3. **Handle errors gracefully**: Always handle potential errors in your client code
4. **Use Effect for async operations**: Leverage Effect's powerful async capabilities
5. **Keep handlers pure**: Write pure functions for your RPC handlers when possible
6. **Document your APIs**: Use TypeScript comments to document your RPC methods

## Examples

See the `examples/starter/src/rpc/` directory for complete working examples:

- `users.ts` - Complete RPC definition with schemas and handlers
- `client-example.tsx` - React component demonstrating client usage
- `server-example.ts` - Server setup examples for different frameworks