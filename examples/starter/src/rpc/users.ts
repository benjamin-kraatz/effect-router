import * as S from "@effect/schema";
import { RPC, registerRPC } from "effect-router/server";

// Define the User schema
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

export class NoUsersError extends S.TaggedError<NoUsersError>()(
  "NoUsersError"
)("NoUsersError", {});

export class InvalidUserDataError extends S.TaggedError<InvalidUserDataError>()(
  "InvalidUserDataError"
)("InvalidUserDataError", {
  message: S.string,
});

// Define the Users RPC group
export const UsersRpc = registerRPC({
  Get: RPC.route("Get", {
    payload: S.struct({ id: S.string }),
    success: S.struct({ user: User }),
    error: UserNotFoundError,
  }),
  List: RPC.route("List", {
    success: S.struct({ users: S.array(User) }),
    error: NoUsersError,
  }),
  Create: RPC.route("Create", {
    payload: S.struct({
      name: S.string,
      email: S.string,
    }),
    success: S.struct({ user: User }),
    error: InvalidUserDataError,
  }),
  Update: RPC.route("Update", {
    payload: S.struct({
      id: S.string,
      name: S.optional(S.string),
      email: S.optional(S.string),
    }),
    success: S.struct({ user: User }),
    error: UserNotFoundError,
  }),
  Delete: RPC.route("Delete", {
    payload: S.struct({ id: S.string }),
    success: S.struct({ deleted: S.boolean }),
    error: UserNotFoundError,
  }),
});

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "user-2",
    name: "Jane Smith",
    email: "jane@example.com",
    createdAt: new Date("2024-01-02"),
  },
];

// Example server handlers (these would typically be in your server code)
export const usersHandlers = {
  Get: (payload: { id: string }) => {
    const user = mockUsers.find((u) => u.id === payload.id);
    if (!user) {
      return new UserNotFoundError({ userId: payload.id });
    }
    return { user };
  },
  List: () => {
    if (mockUsers.length === 0) {
      return new NoUsersError({});
    }
    return { users: mockUsers };
  },
  Create: (payload: { name: string; email: string }) => {
    if (!payload.name || !payload.email) {
      return new InvalidUserDataError({ message: "Name and email are required" });
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      createdAt: new Date(),
    };
    mockUsers.push(newUser);
    return { user: newUser };
  },
  Update: (payload: { id: string; name?: string; email?: string }) => {
    const userIndex = mockUsers.findIndex((u) => u.id === payload.id);
    if (userIndex === -1) {
      return new UserNotFoundError({ userId: payload.id });
    }
    const updatedUser = {
      ...mockUsers[userIndex],
      ...(payload.name && { name: payload.name }),
      ...(payload.email && { email: payload.email }),
    };
    mockUsers[userIndex] = updatedUser;
    return { user: updatedUser };
  },
  Delete: (payload: { id: string }) => {
    const userIndex = mockUsers.findIndex((u) => u.id === payload.id);
    if (userIndex === -1) {
      return new UserNotFoundError({ userId: payload.id });
    }
    mockUsers.splice(userIndex, 1);
    return { deleted: true };
  },
};