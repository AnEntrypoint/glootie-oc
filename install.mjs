#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function isInsideNodeModules() {
  return __dirname.includes(path.sep + 'node_modules' + path.sep);
}

function getProjectRoot() {
  if (!isInsideNodeModules()) {
    return null;
  }

  let current = __dirname;
  while (current !== path.dirname(current)) {
    current = path.dirname(current);
    const parent = path.dirname(current);
    if (path.basename(current) === 'node_modules') {
      return parent;
    }
  }
  return null;
}

function safeCopyDirectory(src, dst) {
  try {
    if (!fs.existsSync(src)) {
      return false;
    }

    fs.mkdirSync(dst, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    entries.forEach(entry => {
      const srcPath = path.join(src, entry.name);
      const dstPath = path.join(dst, entry.name);

      if (entry.isDirectory()) {
        safeCopyDirectory(srcPath, dstPath);
      } else if (entry.isFile()) {
        const content = fs.readFileSync(srcPath, 'utf-8');
        const dstDir = path.dirname(dstPath);
        if (!fs.existsSync(dstDir)) {
          fs.mkdirSync(dstDir, { recursive: true });
        }
        fs.writeFileSync(dstPath, content, 'utf-8');
      }
    });
    return true;
  } catch (err) {
    return false;
  }
}

function install() {
  if (!isInsideNodeModules()) {
    return;
  }

  const projectRoot = getProjectRoot();
  if (!projectRoot) {
    return;
  }

  const ocDir = path.join(projectRoot, '.config', 'opencode', 'plugin');
  const sourceDir = __dirname;

  safeCopyDirectory(path.join(sourceDir, 'agents'), path.join(ocDir, 'agents'));
}

install();
