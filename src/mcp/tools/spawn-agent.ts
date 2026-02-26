import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { OpenClawClient } from '../../openclaw/client.js';
import { successResponse, errorResponse, type ToolResponse } from '../../utils/response-helpers.js';
import { validateInputIsObject, validateString, validateMessage } from '../../utils/validation.js';

export const openclawSpawnAgentTool: Tool = {
  name: 'openclaw_spawn_agent',
  description: 'Spawn an OpenClaw sub-agent to perform a task',
  inputSchema: {
    type: 'object',
    properties: {
      agent_id: {
        type: 'string',
        description: 'Agent identifier to spawn',
      },
      task: {
        type: 'string',
        description: 'Task description for the agent',
      },
      model: {
        type: 'string',
        description: 'Optional model override for the agent',
      },
    },
    required: ['agent_id', 'task'],
  },
};

export async function handleOpenclawSpawnAgent(
  client: OpenClawClient,
  input: unknown
): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) {
    return errorResponse('Invalid input: expected an object');
  }

  const agentIdResult = validateString(input.agent_id, 'agent_id', 256);
  if (agentIdResult.valid === false) {
    return errorResponse(agentIdResult.error);
  }

  const taskResult = validateMessage(input.task);
  if (taskResult.valid === false) {
    return errorResponse(taskResult.error);
  }

  let modelStr = '';
  if (input.model !== undefined) {
    const modelResult = validateString(input.model, 'model', 128);
    if (modelResult.valid === false) {
      return errorResponse(modelResult.error);
    }
    modelStr = `, model=${modelResult.value}`;
  }

  const prompt = `Spawn a sub-agent with agentId=${agentIdResult.value}${modelStr}, task=${taskResult.value}`;

  try {
    const response = await client.chat(prompt);
    return successResponse(response.response);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to spawn agent');
  }
}
