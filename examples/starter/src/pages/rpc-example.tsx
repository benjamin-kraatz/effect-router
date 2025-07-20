import { defineRoute } from "effect-router";
import { UsersExample } from "../rpc/client-example";

export const rpcExampleRoute = defineRoute("/rpc-example", {
  component: RpcExamplePage,
});

// eslint-disable-next-line react-refresh/only-export-components
function RpcExamplePage() {
  return (
    <div>
      <h1>Effect Router RPC Example</h1>
      <p>
        This example demonstrates the RPC (Remote Procedure Call) functionality
        of Effect Router. The example below shows type-safe server functions
        with automatic serialization and error handling.
      </p>
      <UsersExample />
    </div>
  );
}