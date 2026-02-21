#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
const destDir = process.platform === 'win32'
  ? path.join(homeDir, 'AppData', 'Roaming', 'opencode', 'plugin')
  : path.join(homeDir, '.config', 'opencode', 'plugin');

const srcDir = __dirname;
const isUpgrade = fs.existsSync(destDir);

console.log(isUpgrade ? 'Upgrading glootie-oc...' : 'Installing glootie-oc...');

try {
  fs.mkdirSync(destDir, { recursive: true });

  const filesToCopy = [
    ['agents', 'agents'],
    ['index.js', 'index.js'],
    ['glootie.mjs', 'glootie.mjs'],
    ['opencode.json', 'opencode.json'],
    ['.mcp.json', '.mcp.json'],
    ['README.md', 'README.md']
  ];

  function copyRecursive(src, dst) {
    if (!fs.existsSync(src)) return;
    if (fs.statSync(src).isDirectory()) {
      fs.mkdirSync(dst, { recursive: true });
      fs.readdirSync(src).forEach(f => copyRecursive(path.join(src, f), path.join(dst, f)));
    } else {
      fs.copyFileSync(src, dst);
    }
  }

  filesToCopy.forEach(([src, dst]) => copyRecursive(path.join(srcDir, src), path.join(destDir, dst)));

  try {
    console.log('Installing dependencies...');
    execSync('npm install', { cwd: destDir, stdio: 'inherit' });
  } catch (e) {
    console.warn('npm install encountered an issue, but installation may still work');
  }

  const destPath = process.platform === 'win32'
    ? destDir.replace(/\\/g, '/')
    : destDir;
  console.log(`✓ glootie-oc ${isUpgrade ? 'upgraded' : 'installed'} to ${destPath}`);
  console.log('Restart OpenCode to activate.');
} catch (e) {
  console.error('Installation failed:', e.message);
  process.exit(1);
}
