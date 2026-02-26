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
      level: { type: 'string', enum: ['info', 'warning', 'critical'], description: 'Alert severity level' },
      title: { type: 'string', description: 'Short alert title' },
      details: { type: 'string', description: 'Detailed alert information' },
    },
    required: ['level', 'title', 'details'],
  },
};

export async function handleOpenclawAlert(client: OpenClawClient, input: unknown): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) return errorResponse('Invalid input: expected an object');

  const levelResult = validateString(input.level, 'level', 20);
  if (!levelResult.valid) return errorResponse(levelResult.error);
  if (!['info', 'warning', 'critical'].includes(levelResult.value)) return errorResponse('level must be info, warning, or critical');

  const titleResult = validateString(input.title, 'title', 256);
  if (!titleResult.valid) return errorResponse(titleResult.error);

  const detailsResult = validateMessage(input.details);
  if (!detailsResult.valid) return errorResponse(detailsResult.error);

  try {
    await client.sendAlert(levelResult.value, titleResult.value, detailsResult.value);
    return successResponse(`Alert [${levelResult.value.toUpperCase()}] sent: ${titleResult.value}`);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to send alert');
  }
}
