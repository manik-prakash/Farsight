import { Command } from "commander";
import { send } from "./commands/send.js";
import { recv } from "./commands/recv.js";

export function buildProgram(): Command {
  const program = new Command();
  program.name("farsight").description("Send an image to a terminal/cloud AI agent that has no other way to receive one.");

  program
    .command("send <imagePath>")
    .description("Encrypt and upload an image; prints a one-time reference string to paste into an agent chat.")
    .option("--relay-url <url>", "override the relay URL (defaults to FARSIGHT_RELAY_URL or the public demo relay)")
    .option("--ttl <seconds>", "how long the blob may sit unfetched before it expires", (v) => parseInt(v, 10))
    .action(async (imagePath: string, opts: { relayUrl?: string; ttl?: number }) => {
      const result = await send(imagePath, { relayUrl: opts.relayUrl, ttlSeconds: opts.ttl });
      console.log(result.reference);
      console.error(`(${result.mimeType}, ${result.byteLength} bytes, expires in ${result.ttlSeconds}s if unfetched)`);
    });

  program
    .command("recv <reference> <outputPath>")
    .description("Debug/test only: decrypt a reference straight to a file, bypassing MCP entirely.")
    .option("--relay-url <url>", "override the relay URL")
    .action(async (reference: string, outputPath: string, opts: { relayUrl?: string }) => {
      const result = await recv(reference, outputPath, { relayUrl: opts.relayUrl });
      console.error(`wrote ${result.byteLength} bytes (${result.mimeType}) to ${result.outputPath}`);
    });

  return program;
}
