#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createTikTokMcpServer } from "./server.js";
import { runCli } from "./cli.js";

async function main() {
  const args = process.argv.slice(2);

  // If user passes CLI arguments (like @username or post URL or --help), run direct CLI mode
  if (args.length > 0 && !args.includes("--stdio")) {
    await runCli(args);
    return;
  }

  // Otherwise, run as standard Model Context Protocol (MCP) server
  const server = createTikTokMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TikTok Downloader MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
