import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Define the structure for our example tool arguments
interface CalculatorArgs {
  operation: "add" | "subtract" | "multiply" | "divide";
  a: number;
  b: number;
}

// Create the MCP server instance
const server = new Server(
  {
    name: "example-calculator-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}, // Indicates this server provides tools
    },
  }
);

// Register the tools that this server provides
// This is like creating a "menu" of available functions for the AI
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "calculator",
        description: "Performs basic arithmetic operations on two numbers",
        inputSchema: {
          type: "object",
          properties: {
            operation: {
              type: "string",
              enum: ["add", "subtract", "multiply", "divide"],
              description: "The arithmetic operation to perform",
            },
            a: {
              type: "number",
              description: "The first number",
            },
            b: {
              type: "number",
              description: "The second number",
            },
          },
          required: ["operation", "a", "b"],
        },
      },
    ],
  };
});

// Handle tool execution requests
// This is where the actual work happens when the AI wants to use a tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Type-safe argument handling
  if (name === "calculator") {
    const { operation, a, b } = args as unknown as CalculatorArgs;

    // Validate inputs to prevent errors
    if (typeof a !== "number" || typeof b !== "number") {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Both 'a' and 'b' must be numbers"
      );
    }

    // Perform the calculation based on the operation
    let result: number;
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) {
          throw new McpError(ErrorCode.InvalidParams, "Cannot divide by zero");
        }
        result = a / b;
        break;
      default:
        throw new McpError(
          ErrorCode.InvalidParams,
          `Unknown operation: ${operation}`
        );
    }

    // Return the result in the expected format
    return {
      content: [
        {
          type: "text",
          text: `Result: ${a} ${operation} ${b} = ${result}`,
        },
      ],
    };
  }

  // Handle unknown tools
  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

// Set up the communication transport
// This creates the "communication channel" between the AI and your server
async function main() {
  // Use stdio transport for direct communication
  const transport = new StdioServerTransport();
  
  // Connect the server to the transport
  await server.connect(transport);
  
  // Log that the server is ready (this goes to stderr so it doesn't interfere with MCP communication)
  console.error("Calculator MCP server running on stdio");
}

// Start the server
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});