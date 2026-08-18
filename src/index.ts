#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createTikTokMcpServer } from "./server.js";

async function main() {
  const server = createTikTokMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TikTok Downloader MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in TikTok Downloader MCP Server:", error);
  process.exit(1);
});
