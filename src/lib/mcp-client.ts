import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.kapruka.com/mcp";

let client: Client | null = null;
let isConnecting = false;

/**
 * Get or create a connected MCP client.
 * Uses a singleton pattern with reconnection on failure.
 */
export async function getMcpClient(): Promise<Client> {
  if (client) {
    return client;
  }

  if (isConnecting) {
    // Wait for the current connection attempt
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (client) return client;
    throw new Error("MCP connection in progress, please retry");
  }

  isConnecting = true;

  try {
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    const newClient = new Client(
      { name: "thisari-agent", version: "1.0.0" },
      { capabilities: {} }
    );

    await newClient.connect(transport);
    client = newClient;
    console.log("[MCP] Connected to Kapruka MCP server");
    return client;
  } catch (error) {
    console.error("[MCP] Connection failed:", error);
    throw new Error(
      `Failed to connect to Kapruka MCP: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    isConnecting = false;
  }
}

/**
 * List all available MCP tools.
 */
export async function listMcpTools() {
  const c = await getMcpClient();
  const result = await c.listTools();
  return result.tools;
}

/**
 * Call an MCP tool by name with arguments.
 */
export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const c = await getMcpClient();

  try {
    const result = await c.callTool({ name: toolName, arguments: args });

    // Extract text content from the result
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content.find(
        (c: { type: string }) => c.type === "text"
      );
      if (textContent && "text" in textContent) {
        return textContent.text as string;
      }
    }

    // Fallback to structured content
    if (result.structuredContent) {
      return JSON.stringify(result.structuredContent);
    }

    return JSON.stringify(result);
  } catch (error) {
    // Reset client on error so next call creates a fresh connection
    client = null;
    console.error(`[MCP] Tool call failed (${toolName}):`, error);
    throw error;
  }
}

/**
 * Reset the MCP client connection (e.g., on error).
 */
export function resetMcpClient() {
  client = null;
  isConnecting = false;
}
