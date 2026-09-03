import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadDotEnv, resolveRelayUrl } from "@farsight/core";
import { fetchImage } from "./tools/fetchImage.js";

export function createServer(relayUrl: string = resolveRelayUrl()): McpServer {
  const server = new McpServer({ name: "farsight-mcp", version: "0.1.0" });

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
  // Note that the MCP client chooses this process's working directory, so a
  // .env is only picked up if the agent happens to launch us from the
  // directory holding it. Setting the variable in the MCP client's own
  // server config is the reliable route.
  loadDotEnv();
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
