# openclaw-mcp (Hardened Fork)

> Hardened fork of [freema/openclaw-mcp](https://github.com/freema/openclaw-mcp) — Model Context Protocol server for OpenClaw AI assistant integration with Claude Code.

## Security Hardening

- **Configurable model**: Uses `OPENCLAW_MODEL` env var (default: `default`) instead of hardcoded model
- **Localhost-only by default**: SSE host defaults to `127.0.0.1` instead of `0.0.0.0`
- **Rate limiting**: Max 60 requests/min by default (configurable via `RATE_LIMIT_PER_MIN`)
- **Input validation**: All tool inputs validated for type, length, and control characters
- **Path traversal protection**: Memory tools reject `..` in paths

## Available Tools

### Core Tools
| Tool | Description |
|------|-------------|
| `openclaw_chat` | Send a message to OpenClaw and get a response |
| `openclaw_status` | Get OpenClaw gateway status and health |
| `openclaw_chat_async` | Send a message asynchronously (returns task ID) |
| `openclaw_task_status` | Check async task status |
| `openclaw_task_list` | List all tasks |
| `openclaw_task_cancel` | Cancel a running task |

### Extended Tools (New)
| Tool | Description |
|------|-------------|
| `openclaw_message` | Send messages on Telegram or WhatsApp |
| `openclaw_memory_read` | Read a workspace memory file |
| `openclaw_memory_write` | Write to a workspace memory file |
| `openclaw_alert` | Send urgent alerts to Gabriel on Telegram |
| `openclaw_spawn_agent` | Spawn an OpenClaw sub-agent |
| `openclaw_web_search` | Search the web via OpenClaw |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_URL` | `http://127.0.0.1:18789` | OpenClaw gateway URL |
| `OPENCLAW_GATEWAY_TOKEN` | — | Bearer token for gateway auth |
| `OPENCLAW_MODEL` | `default` | Model to use for chat completions |
| `RATE_LIMIT_PER_MIN` | `60` | Max tool calls per minute |
| `HOST` | `127.0.0.1` | SSE server bind host |
| `PORT` | `3000` | SSE server port |

### Claude Code Configuration (`.claude.json`)

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "node",
      "args": ["path/to/openclaw-mcp/dist/index.js"],
      "env": {
        "OPENCLAW_URL": "http://127.0.0.1:18789",
        "OPENCLAW_GATEWAY_TOKEN": "your-gateway-token-here",
        "OPENCLAW_MODEL": "default"
      }
    }
  }
}
```

## Install & Run

```bash
npm install
npm run build
npm start           # stdio mode (default)
npm start -- -t sse # SSE mode
```

## Development

```bash
npm run dev         # watch mode
npm run typecheck   # type checking
npm test            # run tests
npm run check:all   # lint + typecheck + test + build
```

## License

MIT
