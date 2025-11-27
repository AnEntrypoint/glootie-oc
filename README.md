# Glootie OpenCode Plugin

OpenCode plugin that provides automated session hooks for context loading, validation, and workflow enforcement.

## Features

### Session Start Hook

When a new OpenCode session starts, the plugin automatically:

1. **Loads start.md** - Appends project context from `start.md` file (checks project root first, then plugin directory)
2. **Runs mcp-thorns** - Analyzes codebase structure, dead code, dependencies, and architecture
3. **Loads WFGY spec** - Injects WFGY_Core_OneLine_v2.0 methodology for structured problem-solving

All outputs are automatically appended to the session context.

### Session Idle Hook

When a session becomes idle, the plugin automatically:

1. **Git sync validation** - Ensures repository is in sync with remote:
   - Blocks if commits ahead of origin/HEAD (must push)
   - Blocks if commits behind origin/HEAD (must pull)

2. **Runs evaluation scripts**:
   - Executes `eval.js` in project root (if exists)
   - Executes all `.js` files in `evals/` directory (sorted, excluding `/lib/` subdirectories)
   - Blocks session completion if any eval fails
   - 60 second timeout per script

## Installation

### Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/AnEntrypoint/glootie-oc/main/install.sh | bash
```

### Install Options

```bash
# Global install (default if not in a project)
curl -fsSL https://raw.githubusercontent.com/AnEntrypoint/glootie-oc/main/install.sh | bash -s -- --global

# Local install (in current project)
curl -fsSL https://raw.githubusercontent.com/AnEntrypoint/glootie-oc/main/install.sh | bash
```

### Manual Installation

```bash
# Global install
mkdir -p ~/.config/opencode/plugin
cd ~/.config/opencode/plugin
curl -O https://raw.githubusercontent.com/AnEntrypoint/glootie-oc/main/glootie.mjs
curl -O https://raw.githubusercontent.com/AnEntrypoint/glootie-oc/main/package.json
npm install --production

# Local install (in project directory)
mkdir -p .opencode/plugin
cd .opencode/plugin
curl -O https://raw.githubusercontent.com/AnEntrypoint/glootie-oc/main/glootie.mjs
curl -O https://raw.githubusercontent.com/AnEntrypoint/glootie-oc/main/package.json
npm install --production
```

## Usage

Once installed, the plugin runs automatically. No configuration needed.

### Session Start

The plugin loads context when you start OpenCode:

```bash
opencode
```

### Session Idle

The plugin validates and runs evals when OpenCode becomes idle (after completing a task).

## Project Setup

### Optional: Create start.md

Add a `start.md` file to your project root with context you want loaded at session start:

```markdown
# Project Context

This is a Node.js application that does XYZ...

## Development Guidelines
- Follow CommonJS conventions
- No fallbacks or mocks
- Real execution only
```

### Optional: Add Evaluation Scripts

Create evaluation scripts to validate your project:

```bash
# Single eval file
cat > eval.js << 'EOF'
const assert = require('assert');
const fs = require('fs');

assert(fs.existsSync('package.json'), 'package.json must exist');
console.log('✓ All checks passed');
EOF

# Or multiple evals
mkdir evals
cat > evals/01-structure.js << 'EOF'
const assert = require('assert');
const fs = require('fs');
assert(fs.existsSync('lib'), 'lib directory must exist');
console.log('✓ Structure checks passed');
EOF
```

## How It Works

The plugin hooks into OpenCode events:

| Event | Trigger | Actions |
|-------|---------|---------|
| `session.created` | New session starts | Load start.md, analyze with mcp-thorns, inject WFGY spec |
| `session.idle` | Session becomes idle | Git sync check, run eval scripts |

## Error Handling

- **mcp-thorns failures**: Logged but don't block session start (graceful degradation)
- **Git sync issues**: Block session completion with clear error message
- **Eval failures**: Block session completion with full error output

## Requirements

- Node.js >= 16.0.0
- Git repository (for sync checks)
- OpenCode CLI

Optional:
- `start.md` file in project root
- `eval.js` or `evals/*.js` evaluation scripts

## Dependencies

The plugin bundles these dependencies (installed via `npm install`):
- `mcp-thorns` - Codebase analysis (dead code detection, architecture mapping, dependency graphs)

## Troubleshooting

### Plugin not loading

Check if the plugin file exists:
```bash
ls -la ~/.config/opencode/plugin/glootie.mjs
```

Verify plugin syntax:
```bash
node --input-type=module -c ~/.config/opencode/plugin/glootie.mjs
```

### Dependencies not found

Install dependencies:
```bash
cd ~/.config/opencode/plugin
npm install --production
```

### Hooks not running

Enable verbose OpenCode logging:
```bash
opencode --verbose
```

## Uninstall

### Global uninstall
```bash
rm -rf ~/.config/opencode/plugin/glootie.mjs
rm -rf ~/.config/opencode/plugin/package.json
rm -rf ~/.config/opencode/plugin/node_modules
```

### Local uninstall
```bash
rm -rf .opencode/plugin
```

## Comparison with Claude Code Plugin

This plugin provides equivalent functionality to the Claude Code marketplace plugin:

| Claude Code Hook | OpenCode Event | Functionality |
|-----------------|----------------|---------------|
| SessionStart | session.created | Loads start.md, analyzes codebase, injects WFGY spec |
| Stop | session.idle | Git sync checks, runs eval scripts |

## License

MIT License - see [LICENSE](LICENSE) file for details

## Repository

https://github.com/AnEntrypoint/glootie-oc

## Support

- [Open an issue](https://github.com/AnEntrypoint/glootie-oc/issues)
- [OpenCode Documentation](https://opencode.ai/docs/plugins)
