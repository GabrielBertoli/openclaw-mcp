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
      path: { type: 'string', description: 'Relative path to the file in the workspace (e.g. "memory/tasks.md")' },
    },
    required: ['path'],
  },
};

export async function handleOpenclawMemoryRead(client: OpenClawClient, input: unknown): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) return errorResponse('Invalid input: expected an object');

  const pathResult = validateString(input.path, 'path', 1024);
  if (!pathResult.valid) return errorResponse(pathResult.error);

  // Security: prevent path traversal
  if (pathResult.value.includes('..') || pathResult.value.startsWith('/')) {
    return errorResponse('path must be relative and cannot contain ".."');
  }

  try {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const workspace = process.env.OPENCLAW_WORKSPACE ??
      (process.env.HOME ?? '/Users/openclawbot') + '/.openclaw/workspace';
    const fullPath = join(workspace, pathResult.value);
    const content = readFileSync(fullPath, 'utf8');
    return successResponse(content);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to read file');
  }
}
