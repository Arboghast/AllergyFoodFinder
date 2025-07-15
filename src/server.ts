import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolResultSchema} from '@modelcontextprotocol/sdk/types.js';
import { z } from "zod";

const server = new McpServer(
    {
        name: "food-finder",
        version: "1.0.0",
    },
);

// Register tools
server.registerTool("restaurant-data", {
    title: "Google Maps Locator",
    description: "gather nearby restaurant data",
    inputSchema: {
        location: z.string()
    }
    // InputSchema data is passed as parameters to the callback
}, async ({ location }) => ({
    // Returns a JSON Schema
    content: [{ 
        type: "text", 
        text: String(`Hello world ${location}`)
    }]
})
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP server is running...");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});