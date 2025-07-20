import * as Effect from "effect";
import * as Rpc from "@effect/rpc";
import * as Transport from "@effect/rpc/Transport";
import { createServerHandler, registerRPCGroups } from "effect-router/server";
import { UsersRpc, usersHandlers } from "./users";

// Example of how to set up the RPC server
export function setupRpcServer() {
  // Register all RPC groups
  const allRpcGroups = registerRPCGroups([
    UsersRpc,
    // Add more RPC groups here as needed
  ]);

  // Create server handlers for all groups
  const allHandlers = {
    ...usersHandlers,
    // Add handlers for other RPC groups here
  };

  // Create the server
  const server = createServerHandler(allRpcGroups, allHandlers);

  // Create HTTP transport
  const transport = Transport.http("/api/rpc", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Example of how to run the server
  const program = Effect.gen(function* (_) {
    // In a real application, you would integrate this with your HTTP server
    // For example, with Express.js:
    //
    // app.post("/api/rpc", async (req, res) => {
    //   const result = await Effect.runPromise(
    //     server.handle(req.body, transport)
    //   );
    //   res.json(result);
    // });

    console.log("RPC Server setup complete");
    console.log("Available methods:", Object.keys(allHandlers));
  });

  return { server, transport, program };
}

// Example of how to use the server in an Express.js application
export function createExpressRpcHandler() {
  const { server, transport } = setupRpcServer();

  return async (req: any, res: any) => {
    try {
      const result = await Effect.runPromise(
        server.handle(req.body, transport)
      );
      res.json(result);
    } catch (error) {
      console.error("RPC Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Example of how to use the server in a Node.js HTTP server
export function createNodeHttpRpcHandler() {
  const { server, transport } = setupRpcServer();

  return async (req: any, res: any) => {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const parsedBody = JSON.parse(body);
        const result = await Effect.runPromise(
          server.handle(parsedBody, transport)
        );
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error("RPC Error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
  };
}