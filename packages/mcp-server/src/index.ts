import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resolveRelayUrl } from "farsight-core";
import { fetchImage } from "./tools/fetchImage.js";

export function createServer(relayUrl: string = resolveRelayUrl()): McpServer {
  const server = new McpServer({ name: "farsight-mcp", version: "0.2.0" });

  server.registerTool(
    "fetch_image",
    {
      title: "Fetch Farsight image",
      description:
        "Fetches an image sent via `farsight send` on someone's local machine, using the one-time reference " +
        "string they gave you (looks like 'fs_<token>.<key>'). Decrypts it and returns it as an image you can " +
        "see, plus a text confirmation. The reference only works once — the relay deletes the blob after this " +
        "call succeeds — so don't call this tool twice with the same reference expecting it to work again.",
      inputSchema: {
        reference: z.string().describe("The fs_<token>.<key> reference string the user pasted into chat."),
      },
    },
    async ({ reference }) => fetchImage(reference, { relayUrl }),
  );

  return server;
}

export async function main(): Promise<void> {
  // Deliberately no .env loading here, unlike the CLI. The MCP client picks
  // this process's working directory, so any .env we found would be one the
  // user did not necessarily choose -- and it could set FARSIGHT_RELAY_URL
  // and redirect where the agent fetches blobs from. Set the variable in the
  // MCP client's own server config instead; that is both the safe route and
  // the only reliable one.
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
