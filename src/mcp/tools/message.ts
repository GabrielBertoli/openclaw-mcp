import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { OpenClawClient } from '../../openclaw/client.js';
import { successResponse, errorResponse, type ToolResponse } from '../../utils/response-helpers.js';
import { validateInputIsObject, validateString, validateMessage } from '../../utils/validation.js';

export const openclawMessageTool: Tool = {
  name: 'openclaw_message',
  description: 'Send a message on Telegram or WhatsApp via the OpenClaw gateway',
  inputSchema: {
    type: 'object',
    properties: {
      channel: {
        type: 'string',
        enum: ['telegram', 'whatsapp'],
        description: 'The messaging channel to use',
      },
      target: {
        type: 'string',
        description: 'Target chat/user ID or JID',
      },
      message: {
        type: 'string',
        description: 'The message text to send',
      },
      media_path: {
        type: 'string',
        description: 'Optional path to a media file to attach',
      },
    },
    required: ['channel', 'target', 'message'],
  },
};

export async function handleOpenclawMessage(
  client: OpenClawClient,
  input: unknown
): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) {
    return errorResponse('Invalid input: expected an object');
  }

  const channelResult = validateString(input.channel, 'channel', 20);
  if (channelResult.valid === false) {
    return errorResponse(channelResult.error);
  }
  if (channelResult.value !== 'telegram' && channelResult.value !== 'whatsapp') {
    return errorResponse('channel must be "telegram" or "whatsapp"');
  }

  const targetResult = validateString(input.target, 'target', 256);
  if (targetResult.valid === false) {
    return errorResponse(targetResult.error);
  }

  const msgResult = validateMessage(input.message);
  if (msgResult.valid === false) {
    return errorResponse(msgResult.error);
  }

  let mediaPath = '';
  if (input.media_path !== undefined) {
    const mediaResult = validateString(input.media_path, 'media_path', 1024);
    if (mediaResult.valid === false) {
      return errorResponse(mediaResult.error);
    }
    mediaPath = mediaResult.value;
  }

  const prompt = mediaPath
    ? `Send a message on ${channelResult.value} to ${targetResult.value}: "${msgResult.value}" with media attachment at path: ${mediaPath}`
    : `Send a message on ${channelResult.value} to ${targetResult.value}: "${msgResult.value}"`;

  try {
    const response = await client.chat(prompt);
    return successResponse(response.response);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to send message');
  }
}
