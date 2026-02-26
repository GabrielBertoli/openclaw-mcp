import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { OpenClawClient } from '../../openclaw/client.js';
import { successResponse, errorResponse, type ToolResponse } from '../../utils/response-helpers.js';
import { validateInputIsObject, validateMessage, validateId } from '../../utils/validation.js';

export const openclawChatTool: Tool = {
  name: 'openclaw_chat',
  description: 'Send a message to OpenClaw and get a response',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to send to OpenClaw',
      },
      session_id: {
        type: 'string',
        description: 'Optional session ID for conversation context',
      },
    },
    required: ['message'],
  },
};

export async function handleOpenclawChat(
  client: OpenClawClient,
  input: unknown
): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) {
    return errorResponse('Invalid input: expected an object');
  }

  const msgResult = validateMessage(input.message);
  if (msgResult.valid === false) {
    return errorResponse(msgResult.error);
  }

  let sessionId: string | undefined;
  if (input.session_id !== undefined) {
    const sidResult = validateId(input.session_id, 'session_id');
    if (sidResult.valid === false) {
      return errorResponse(sidResult.error);
    }
    sessionId = sidResult.value;
  }

  try {
    const response = await client.chat(msgResult.value, sessionId);
    return successResponse(response.response);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to chat with OpenClaw');
  }
}
