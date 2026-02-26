import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { OpenClawClient } from '../../openclaw/client.js';
import { successResponse, errorResponse, type ToolResponse } from '../../utils/response-helpers.js';
import { validateInputIsObject, validateMessage } from '../../utils/validation.js';

export const openclawWebSearchTool: Tool = {
  name: 'openclaw_web_search',
  description: 'Search the web via OpenClaw',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string',
      },
    },
    required: ['query'],
  },
};

export async function handleOpenclawWebSearch(
  client: OpenClawClient,
  input: unknown
): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) {
    return errorResponse('Invalid input: expected an object');
  }

  const queryResult = validateMessage(input.query);
  if (queryResult.valid === false) {
    return errorResponse(queryResult.error);
  }

  try {
    const response = await client.chat(
      `Search the web for: ${queryResult.value}. Return the results.`
    );
    return successResponse(response.response);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to search the web');
  }
}
