import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { OpenClawClient } from '../../openclaw/client.js';
import { successResponse, errorResponse, type ToolResponse } from '../../utils/response-helpers.js';
import { validateInputIsObject, validateString, validateMessage } from '../../utils/validation.js';

export const openclawMemoryWriteTool: Tool = {
  name: 'openclaw_memory_write',
  description: 'Write content to a memory file in the OpenClaw workspace',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Relative path to the file in the workspace (e.g. "memory/tasks.md")' },
      content: { type: 'string', description: 'Content to write to the file' },
    },
    required: ['path', 'content'],
  },
};

export async function handleOpenclawMemoryWrite(client: OpenClawClient, input: unknown): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) return errorResponse('Invalid input: expected an object');

  const pathResult = validateString(input.path, 'path', 1024);
  if (!pathResult.valid) return errorResponse(pathResult.error);

  if (pathResult.value.includes('..') || pathResult.value.startsWith('/')) {
    return errorResponse('path must be relative and cannot contain ".."');
  }

  const contentResult = validateMessage(input.content);
  if (!contentResult.valid) return errorResponse(contentResult.error);

  try {
    await client.writeFile(pathResult.value, contentResult.value);
    return successResponse(`File written: ${pathResult.value}`);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to write file');
  }
}
