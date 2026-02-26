/**
 * Shared tool registration for MCP Server instances.
 *
 * Each SSE/Streamable HTTP connection needs its own Server + Transport pair,
 * but they all register the same set of tools. This module extracts
 * that registration logic into a reusable function.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import type { OpenClawClient } from '../openclaw/client.js';
import { SERVER_ICON_SVG_BASE64 } from '../config/constants.js';
import { log, logError } from '../utils/logger.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import * as tools from '../mcp/tools/index.js';

export interface ToolRegistrationDeps {
  client: OpenClawClient;
  serverName: string;
  serverVersion: string;
}

/**
 * Create a new MCP Server instance with all tools registered.
 */
export function createMcpServer(deps: ToolRegistrationDeps): Server {
  const server = new Server(
    {
      name: deps.serverName,
      version: deps.serverVersion,
      icons: [
        {
          src: `data:image/svg+xml;base64,${SERVER_ICON_SVG_BASE64}`,
          mimeType: 'image/svg+xml',
          sizes: ['128x128'],
        },
      ],
    },
    { capabilities: { tools: {} } }
  );

  registerTools(server, deps);
  return server;
}

/**
 * Register all OpenClaw tools on an existing MCP Server instance.
 */
function registerTools(server: Server, deps: ToolRegistrationDeps): void {
  const { client } = deps;
  const rateLimiter = new RateLimiter();

  const toolHandlers = new Map<
    string,
    (
      input: unknown
    ) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>
  >([
    ['openclaw_chat', (input) => tools.handleOpenclawChat(client, input)],
    ['openclaw_status', (input) => tools.handleOpenclawStatus(client, input)],
    ['openclaw_chat_async', (input) => tools.handleOpenclawChatAsync(client, input)],
    ['openclaw_task_status', (input) => tools.handleOpenclawTaskStatus(client, input)],
    ['openclaw_task_list', (input) => tools.handleOpenclawTaskList(client, input)],
    ['openclaw_task_cancel', (input) => tools.handleOpenclawTaskCancel(client, input)],
    ['openclaw_message', (input) => tools.handleOpenclawMessage(client, input)],
    ['openclaw_memory_read', (input) => tools.handleOpenclawMemoryRead(client, input)],
    ['openclaw_memory_write', (input) => tools.handleOpenclawMemoryWrite(client, input)],
    ['openclaw_alert', (input) => tools.handleOpenclawAlert(client, input)],
    ['openclaw_spawn_agent', (input) => tools.handleOpenclawSpawnAgent(client, input)],
    ['openclaw_web_search', (input) => tools.handleOpenclawWebSearch(client, input)],
  ]);

  const allTools = [
    tools.openclawChatTool,
    tools.openclawStatusTool,
    tools.openclawChatAsyncTool,
    tools.openclawTaskStatusTool,
    tools.openclawTaskListTool,
    tools.openclawTaskCancelTool,
    tools.openclawMessageTool,
    tools.openclawMemoryReadTool,
    tools.openclawMemoryWriteTool,
    tools.openclawAlertTool,
    tools.openclawSpawnAgentTool,
    tools.openclawWebSearchTool,
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: toolArgs } = request.params;
    log(`Executing tool: ${name}`);

    const handler = toolHandlers.get(name);
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    if (!rateLimiter.check()) {
      return {
        content: [{ type: 'text', text: 'Error: Rate limit exceeded. Try again later.' }],
        isError: true,
      };
    }

    try {
      return await handler(toolArgs);
    } catch (error) {
      logError(`Error executing tool ${name}`, error);
      throw error;
    }
  });
}
