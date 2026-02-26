import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { OpenClawClient } from '../../openclaw/client.js';
import { successResponse, errorResponse, type ToolResponse } from '../../utils/response-helpers.js';
import { validateInputIsObject, validateString } from '../../utils/validation.js';

export const openclawMemoryReadTool: Tool = {
  name: 'openclaw_memory_read',
  description: 'Read a memory file from the OpenClaw workspace',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path to the file in the workspace (e.g. "memory/tasks.md")',
      },
    },
    required: ['path'],
  },
};

export async function handleOpenclawMemoryRead(
  client: OpenClawClient,
  input: unknown
): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) {
    return errorResponse('Invalid input: expected an object');
  }

  const pathResult = validateString(input.path, 'path', 512);
  if (pathResult.valid === false) {
    return errorResponse(pathResult.error);
  }

  // Reject path traversal attempts
  if (pathResult.value.includes('..')) {
    return errorResponse('path must not contain ".." (path traversal)');
  }

  try {
    const response = await client.chat(
      `Read the file ${pathResult.value} and return its contents verbatim.`
    );
    return successResponse(response.response);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to read memory file');
  }
}
