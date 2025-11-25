import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

export const GlootiePlugin = async ({ project, client, $, directory, worktree }) => {
  const runSessionStartHook = async () => {
    const outputs = [];

    const projectStartMd = path.join(directory, 'start.md');
    const pluginDir = path.dirname(fileURLToPath(import.meta.url));
    const pluginStartMd = path.join(pluginDir, 'start.md');
    
    let startMdPath = null;
    if (fs.existsSync(projectStartMd)) {
      startMdPath = projectStartMd;
    } else if (fs.existsSync(pluginStartMd)) {
      startMdPath = pluginStartMd;
    }
    
    if (startMdPath) {
      const startMdContent = fs.readFileSync(startMdPath, 'utf-8');
      outputs.push(`=== start.md ===\n${startMdContent}`);
    }

    try {
      const thornsResult = await $`npx mcp-thorns ${directory}`.timeout(180000).nothrow();
      if (thornsResult.exitCode === 0) {
        outputs.push(`=== mcp-thorns ===\n${thornsResult.stdout}`);
      } else {
        outputs.push(`=== mcp-thorns ===\nSkipped (error: ${thornsResult.stderr.split('\n')[0]})`);
      }
    } catch (e) {
      outputs.push(`=== mcp-thorns ===\nSkipped (3min timeout)`);
    }

    try {
      const wfgyResult = await $`npx wfgy hook`.timeout(180000).nothrow();
      if (wfgyResult.exitCode === 0) {
        outputs.push(`=== wfgy hook ===\n${wfgyResult.stdout}`);
      } else {
        outputs.push(`=== wfgy hook ===\nSkipped (error: ${wfgyResult.stderr.split('\n')[0]})`);
      }
    } catch (e) {
      outputs.push(`=== wfgy hook ===\nSkipped (3min timeout)`);
    }

    if (outputs.length > 0) {
      const additionalContext = outputs.join('\n\n');
      await client.append(additionalContext);
    }
  };

  const runStopHook = async () => {
    const blockReasons = [];

    try {
      const aheadResult = await $`git rev-list --count origin/HEAD..HEAD`.timeout(2000).nothrow();
      if (aheadResult.exitCode === 0) {
        const ahead = aheadResult.stdout.trim();
        if (parseInt(ahead) > 0) {
          blockReasons.push(`Git: ${ahead} commit(s) ahead of origin/HEAD, must push to remote`);
        }
      }
    } catch (e) {
    }

    try {
      const behindResult = await $`git rev-list --count HEAD..origin/HEAD`.timeout(2000).nothrow();
      if (behindResult.exitCode === 0) {
        const behind = behindResult.stdout.trim();
        if (parseInt(behind) > 0) {
          blockReasons.push(`Git: ${behind} commit(s) behind origin/HEAD, must merge from remote`);
        }
      }
    } catch (e) {
    }

    if (blockReasons.length > 0) {
      throw new Error(blockReasons.join(' | '));
    }

    const filesToRun = [];

    const evalJsPath = path.join(directory, 'eval.js');
    if (fs.existsSync(evalJsPath)) {
      filesToRun.push('eval.js');
    }

    const evalsDir = path.join(directory, 'evals');
    if (fs.existsSync(evalsDir) && fs.statSync(evalsDir).isDirectory()) {
      const files = fs.readdirSync(evalsDir).filter(f => {
        const fullPath = path.join(evalsDir, f);
        return f.endsWith('.js') && fs.statSync(fullPath).isFile() && !fullPath.includes('/lib/');
      }).sort();
      filesToRun.push(...files.map(f => path.join('evals', f)));
    }

    for (const file of filesToRun) {
      try {
        await $`node ${file}`.timeout(60000);
      } catch (e) {
        const errorOutput = e.stdout || '';
        const errorStderr = e.stderr || '';
        const fullError = `Error: ${e.message}\n\nStdout:\n${errorOutput}\n\nStderr:\n${errorStderr}`;
        throw new Error(`The following errors were reported: ${fullError}`);
      }
    }
  };

  return {
    event: async ({ event }) => {
      if (event.type === 'session.created') {
        await runSessionStartHook();
      } else if (event.type === 'session.idle') {
        await runStopHook();
      }
    }
  };
};


