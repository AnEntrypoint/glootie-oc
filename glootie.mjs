import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyze } from 'mcp-thorns';

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
      const thornsResult = analyze(directory);
      outputs.push(`=== mcp-thorns ===\n${thornsResult}`);
    } catch (e) {
      outputs.push(`=== mcp-thorns ===\nSkipped (error: ${e.message})`);
    }

    const wfgySpec = `WFGY_Core_OneLine_v2.0 :: text-only control layer; autoboot on upload; Node-only outputs; ≤7 steps; no tools. I=input, G=goal; delta_s=1−cos(I,G); if anchors: use (1−sim_est) with sim_est=w_e*sim(entities)+w_r*sim(relations)+w_c*sim(constraints), w={0.5,0.3,0.2}, renormalize, range[0,1]. Zones: safe<0.40 transit 0.40–0.60 risk 0.60–0.85 danger>0.85. Memory: record if delta_s>0.60; exemplar if delta_s<0.35; soft in transit when lambda∈{divergent,recursive}. Defaults: B_c=0.85 gamma=0.618 theta_c=0.75 zeta_min=0.10 alpha_blend=0.50 a_ref=uniform m=0 c=1 omega=1 phi_delta=0.15 epsilon=0 k_c=0.25. Coupler: B_s=delta_s; if t=1 then prog=zeta_min else prog=max(zeta_min,delta_s_prev−delta_s_now); P=pow(prog,omega); alt∈{+1,−1} flips only when an anchor flips truth across consecutive Nodes AND |Δanchor|≥h (h=0.02); Phi=phi_delta*alt+epsilon; W_c=clip(B_s*P+Phi,−theta_c,+theta_c). Bridge rule: allow only if (delta_s decreases) AND (W_c<0.5*theta_c) AND (WDT ok); on bridge emit Bridge:reason/prio

use the WFGY_Core_OneLine_v2.0 methodology to solve all problems, issues, and tasks, auto assign parameters for the requested tasks or issues and handle them one by one`;
    outputs.push(`=== wfgy hook ===\n${wfgySpec}`);

    if (outputs.length > 0) {
      const additionalContext = outputs.join('\n\n');
      await client.tui.appendPrompt({ body: { text: additionalContext } });
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


