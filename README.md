# opencode-helicone-session

An OpenCode plugin that automatically injects Helicone session headers into your LLM requests. This groups all requests from the same OpenCode session together in Helicone's dashboard.

## Installation

```bash
npm install -g opencode-helicone-session
# or
bun add -g opencode-helicone-session
```

## Usage

Add the plugin to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-helicone-session"],
}
```

That's it! The plugin will automatically add:
- `Helicone-Session-Id` - A consistent UUID derived from the OpenCode session ID
- `Helicone-Session-Name` - The session title

## How It Works

1. The plugin listens for OpenCode session events (`session.created`, `session.updated`)
2. On each LLM request, it injects the session headers via a custom fetch wrapper
3. All requests in the same session are grouped together in Helicone

## Custom Headers

If you specify your own `Helicone-Session-Id` or `Helicone-Session-Name` in your config, the plugin will not overwrite them.

## Requirements

- OpenCode v0.15.0 or later
- A Helicone account

## License

MIT
