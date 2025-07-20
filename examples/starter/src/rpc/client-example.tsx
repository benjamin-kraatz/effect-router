import React, { useState, useEffect } from "react";
import * as Effect from "effect";
import { createServerFn } from "effect-router/client";
import { UsersRpc, type User } from "./users";

// Create type-safe server function clients
const usersApi = {
  Get: createServerFn(UsersRpc, "Get"),
  List: createServerFn(UsersRpc, "List"),
  Create: createServerFn(UsersRpc, "Create"),
  Update: createServerFn(UsersRpc, "Update"),
  Delete: createServerFn(UsersRpc, "Delete"),
};

export function UsersExample() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "" });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    const result = await Effect.runPromise(
      Effect.gen(function* (_) {
        const response = yield* _(usersApi.List());
        return response.users;
      })
    );

    setUsers(result);
    setLoading(false);
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      setError("Name and email are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await Effect.runPromise(
        Effect.gen(function* (_) {
          const response = yield* _(
            usersApi.Create({ name: newUser.name, email: newUser.email })
          );
          return response.user;
        })
      );

      setUsers([...users, result]);
      setNewUser({ name: "", email: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await Effect.runPromise(
        Effect.gen(function* (_) {
          const response = yield* _(
            usersApi.Update({ id, ...updates })
          );
          return response.user;
        })
      );

      setUsers(users.map((user) => (user.id === id ? result : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          yield* _(usersApi.Delete({ id }));
        })
      );

      setUsers(users.filter((user) => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const getUser = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await Effect.runPromise(
        Effect.gen(function* (_) {
          const response = yield* _(usersApi.Get({ id }));
          return response.user;
        })
      );

      console.log("Retrieved user:", result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get user");
      return null;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <h1>Users Management Example</h1>
      
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error}
        </div>
      )}

      {/* Create User Form */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc" }}>
        <h3>Create New User</h3>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            style={{ marginRight: "10px", padding: "5px" }}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            style={{ marginRight: "10px", padding: "5px" }}
          />
          <button onClick={createUser} disabled={loading}>
            Create User
          </button>
        </div>
      </div>

      {/* Users List */}
      <div>
        <h3>Users ({users.length})</h3>
        <button onClick={loadUsers} disabled={loading} style={{ marginBottom: "10px" }}>
          Refresh Users
        </button>
        
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  border: "1px solid #ddd",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "4px",
                }}
              >
                <div>
                  <strong>ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Name:</strong> {user.name}
                </div>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Created:</strong> {user.createdAt.toLocaleDateString()}
                </div>
                <div style={{ marginTop: "10px" }}>
                  <button
                    onClick={() => getUser(user.id)}
                    style={{ marginRight: "5px" }}
                  >
                    Get User
                  </button>
                  <button
                    onClick={() =>
                      updateUser(user.id, { name: user.name + " (Updated)" })
                    }
                    style={{ marginRight: "5px" }}
                  >
                    Update Name
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{ color: "red" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}