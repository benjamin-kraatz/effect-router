# Effect Router Changelog

## Effect Integration (Latest)

### Overview
The entire router has been refactored to use Effect from the ground up, replacing Promise-based operations with Effect-based ones for better error handling, type safety, and composability.

### Major Changes

#### 1. Loader Functions
- **Before**: `loader?: (params: z.infer<P>) => Promise<R>`
- **After**: `loader?: (params: z.infer<P>) => Effect.Effect<R, unknown, never>`

#### 2. Route Types (`types.ts`)
- Updated `RouteWithParams` and `RouteWithNoParams` to use `Effect.Effect` instead of `Promise`
- Added proper Effect imports and type definitions

#### 3. Router Types (`routerTypes.ts`)
- Added `LoaderEffect<Loader>` type for Effect-based loaders
- Added `LoaderExit<Loader>` type for Effect exit handling
- Imported Effect and Exit from the effect package

#### 4. Router Provider (`RouterProvider.tsx`)
- Updated to use `Effect.runPromise` for running Effect-based loaders
- Replaced Promise `.then()` and `.catch()` with Effect-based error handling
- Updated route parsing to use `Effect.sync` for consistency

#### 5. Route Parser (`routeParser.ts`)
- Wrapped route parsing logic in `Effect.sync` for consistency
- Added Effect import for error handling

#### 6. Define Route (`defineRoute.ts`)
- Updated to work with Effect-based loaders
- Fixed imports to use `LoaderResult` from `routerTypes`
- Improved type safety for parameter handling

#### 7. Router Hooks (`routerHooks.ts`)
- Updated context types to use `LoaderResult<unknown>[]`
- Removed duplicate `LoaderResult` type definition
- Fixed imports to use centralized types

#### 8. Effect Router Types (`effect-router.d.ts`)
- Added comprehensive Effect-based type definitions
- Added `EffectRoute` interface for Effect-based routes
- Added `EffectRouterContext` interface for Effect-based context

### Benefits of Effect Integration

1. **Type Safety**: Full type safety throughout the routing system
2. **Error Handling**: Comprehensive error handling with Effect's error channel
3. **Resource Management**: Automatic cleanup and resource management
4. **Composability**: Easy to compose complex routing logic
5. **Testing**: Effect's testing utilities make router testing straightforward
6. **Observability**: Built-in logging and tracing through Effect

### Migration Guide

#### For Loader Functions
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

#### For Complex Loaders
```typescript
// Before
loader: async (params) => {
  const user = await fetch(`/api/users/${params.id}`).then(res => res.json());
  return user;
}

// After
loader: (params) =>
  Effect.gen(function* () {
    const user = yield* Effect.tryPromise({
      try: () => fetch(`/api/users/${params.id}`).then(res => res.json()),
      catch: (error) => new Error(`Failed to fetch user: ${error}`),
    });
    return user;
  })
```

### Breaking Changes

1. **Loader Return Types**: All loaders must now return `Effect.Effect<Data, Error, never>` instead of `Promise<Data>`
2. **Error Handling**: Errors are now handled through Effect's error channel
3. **Async Operations**: Use `Effect.gen` and `yield*` for complex async operations

### New Features

1. **Advanced Error Handling**: Built-in retry logic, timeout handling, and error recovery
2. **Resource Safety**: Automatic cleanup and resource management
3. **Composability**: Easy to compose complex routing logic using Effect's monadic operations
4. **Type Safety**: Full type safety throughout the routing system

### Files Modified

- `types.ts` - Updated route types to use Effect
- `routerTypes.ts` - Added Effect-based type definitions
- `routerHooks.ts` - Updated context types
- `defineRoute.ts` - Updated to work with Effect-based loaders
- `routeParser.ts` - Added Effect integration
- `RouterProvider.tsx` - Updated to use Effect.runPromise
- `router.ts` - Updated base route types
- `effect-router.d.ts` - Added comprehensive Effect types
- `README.md` - Added documentation for Effect usage

### Dependencies

- Added `effect` as a core dependency
- All Effect-based operations use the latest Effect API
- No breaking changes to existing React integration 