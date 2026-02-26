import { execSync } from 'node:child_process';
import { OpenClawConnectionError, OpenClawApiError } from '../utils/errors.js';
import type { OpenClawHealthResponse, OpenClawChatResponse } from './types.js';

const DEFAULT_TIMEOUT_MS = 30_000;

export class OpenClawClient {
  private gatewayUrl: string;
  private gatewayToken: string | undefined;
  private timeoutMs: number;

  constructor(baseUrl: string, gatewayToken?: string, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.gatewayUrl = baseUrl;
    this.gatewayToken = gatewayToken;
    this.timeoutMs = timeoutMs;
  }

  private runCli(args: string[]): string {
    const env: Record<string, string> = { ...process.env as Record<string, string> };
    if (this.gatewayToken) env['OPENCLAW_GATEWAY_TOKEN'] = this.gatewayToken;

    try {
      const result = execSync(`openclaw ${args.map(a => JSON.stringify(a)).join(' ')}`, {
        env,
        timeout: this.timeoutMs,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return result.trim();
    } catch (err: unknown) {
      const e = err as { message?: string; stdout?: string; stderr?: string };
      const stderr = e.stderr?.toString() ?? '';
      const stdout = e.stdout?.toString() ?? '';
      throw new OpenClawConnectionError(
        `openclaw CLI failed: ${e.message ?? 'unknown'}\nstdout: ${stdout}\nstderr: ${stderr}`
      );
    }
  }

  async health(): Promise<OpenClawHealthResponse> {
    try {
      const out = this.runCli(['gateway', 'status', '--json']);
      const data = JSON.parse(out);
      const rpcOk = data?.rpc?.ok === true;
      const url = data?.rpc?.url ?? data?.gateway?.probeUrl ?? '?';
      return {
        status: rpcOk ? 'ok' : 'error',
        message: rpcOk ? `Gateway running at ${url}` : 'Gateway not running',
      };
    } catch (e) {
      throw new OpenClawConnectionError(`Health check failed: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  async chat(message: string, sessionId?: string): Promise<OpenClawChatResponse> {
    // Use openclaw agent CLI to send a message
    const args = ['agent', '--agent', 'main', '--message', message, '--json'];
    if (sessionId) {
      args.push('--session-id', sessionId);
    }
    try {
      const out = this.runCli(args);
      let response = out;
      try {
        const parsed = JSON.parse(out);
        response = parsed?.response ?? parsed?.content ?? parsed?.message ?? out;
      } catch { /* raw text */ }
      return { response, model: 'default', usage: undefined };
    } catch (err) {
      throw new OpenClawApiError(
        `Chat failed: ${err instanceof Error ? err.message : 'unknown'}`,
        500
      );
    }
  }

  async sendMessage(channel: string, target: string, message: string, mediaPath?: string): Promise<void> {
    const args = ['message', 'send', '--channel', channel, '--target', target, '--message', message];
    if (mediaPath) args.push('--media', mediaPath);
    this.runCli(args);
  }

  async readFile(path: string): Promise<string> {
    const args = ['agent', '--agent', 'main', '--message', `Read the file "${path}" and return its full contents verbatim, nothing else.`];
    const out = this.runCli(args);
    return out;
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Write file directly using Node's fs (we have workspace access)
    const { writeFileSync, mkdirSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const workspace = process.env.OPENCLAW_WORKSPACE ?? process.env.HOME + '/.openclaw/workspace';
    const fullPath = path.startsWith('/') ? path : join(workspace, path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
  }

  async webSearch(query: string): Promise<string> {
    const args = ['agent', '--agent', 'main', '--message', `Search the web for: ${query}. Return a concise summary of the top results.`];
    return this.runCli(args);
  }

  async spawnAgent(agentId: string, task: string, model?: string): Promise<string> {
    const msg = model
      ? `Spawn a sub-agent with agentId="${agentId}", model="${model}", task: ${task}`
      : `Spawn a sub-agent with agentId="${agentId}", task: ${task}`;
    const args = ['agent', '--agent', 'main', '--message', msg];
    return this.runCli(args);
  }

  async sendAlert(level: string, title: string, details: string): Promise<void> {
    const emoji = level === 'critical' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';
    const msg = `${emoji} [ALERT ${level.toUpperCase()}] ${title}\n\n${details}`;
    const args = ['message', 'send', '--channel', 'telegram', '--target', process.env.OPENCLAW_TELEGRAM_CHAT_ID ?? '5387133420', '--message', msg];
    this.runCli(args);
  }
}
