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
      agent_id: { type: 'string', description: 'Agent identifier to spawn (e.g. "main", "dev")' },
      task: { type: 'string', description: 'Task description for the agent' },
      model: { type: 'string', description: 'Optional model override for the agent' },
    },
    required: ['agent_id', 'task'],
  },
};

export async function handleOpenclawSpawnAgent(client: OpenClawClient, input: unknown): Promise<ToolResponse> {
  if (!validateInputIsObject(input)) return errorResponse('Invalid input: expected an object');

  const agentResult = validateString(input.agent_id, 'agent_id', 64);
  if (!agentResult.valid) return errorResponse(agentResult.error);

  const taskResult = validateMessage(input.task);
  if (!taskResult.valid) return errorResponse(taskResult.error);

  let model: string | undefined;
  if (input.model !== undefined) {
    const modelResult = validateString(input.model, 'model', 128);
    if (!modelResult.valid) return errorResponse(modelResult.error);
    model = modelResult.value;
  }

  try {
    const result = await client.spawnAgent(agentResult.value, taskResult.value, model);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to spawn agent');
  }
}
