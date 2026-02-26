import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { OpenClawClient } from '../../openclaw/client.js';
import { successResponse, errorResponse, type ToolResponse } from '../../utils/response-helpers.js';
import { validateInputIsObject, validateString, validateMessage } from '../../utils/validation.js';

export const openclawAlertTool: Tool = {
  name: 'openclaw_alert',
  description: 'Send an urgent alert to Gabriel on Telegram via OpenClaw',
  inputSchema: {
    type: 'object',
    properties: {
      level: {
        type: 'string',
        enum: ['info', 'warning', 'critical'],
        description: 'Alert severity level',
      },
      title: {
        type: 'string',
        description: 'Short alert title',
      },
      details: {
        type: 'string',
        description: 'Detailed alert information',
      },
    },
    required: ['level', 'title', 'details'],
  },
};

export async function handleOpenclawAlert(
  client: OpenClawClient,
  input: unknown
): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) {
    return errorResponse('Invalid input: expected an object');
  }

  const levelResult = validateString(input.level, 'level', 20);
  if (levelResult.valid === false) {
    return errorResponse(levelResult.error);
  }
  if (!['info', 'warning', 'critical'].includes(levelResult.value)) {
    return errorResponse('level must be "info", "warning", or "critical"');
  }

  const titleResult = validateString(input.title, 'title', 256);
  if (titleResult.valid === false) {
    return errorResponse(titleResult.error);
  }

  const detailsResult = validateMessage(input.details);
  if (detailsResult.valid === false) {
    return errorResponse(detailsResult.error);
  }

  const prompt = `[ALERT ${levelResult.value.toUpperCase()}] ${titleResult.value}: ${detailsResult.value}. Send this to Gabriel on Telegram immediately.`;

  try {
    const response = await client.chat(prompt);
    return successResponse(response.response);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to send alert');
  }
}
