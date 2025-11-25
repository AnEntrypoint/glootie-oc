# Glootie OpenCode Plugin

This plugin provides automated session hooks for OpenCode.

## Features

- **Session Start Hook**: Loads start.md, runs mcp-thorns, runs wfgy hook
- **Session Idle Hook**: Git sync validation, runs eval scripts

## Hook Pattern

The plugin uses the `event` hook pattern required by OpenCode:

```javascript
return {
  event: async ({ event }) => {
    if (event.type === 'session.created') { ... }
    else if (event.type === 'session.idle') { ... }
  }
};
```

## File Structure

- `glootie.mjs` - Main plugin logic
- `index.js` - Entry point that exports GlootiePlugin
- `package.json` - Package configuration (main: "index.js")
- `install.sh` - Installation script
- `README.md` - Documentation
- `LICENSE` - MIT License

## Testing

To test the plugin:

1. Create a test project with `start.md`
2. Run `opencode` in the project
3. Check that start.md content is loaded into session context
4. Verify session.idle hook runs when session completes

## Troubleshooting

- Plugin must export named function (e.g., `GlootiePlugin`)
- Plugin must use `event` hook, not direct event names
- `package.json` must point to correct main file
- OpenCode loads plugins from `~/.config/opencode/plugin/` or `.opencode/plugin/`
