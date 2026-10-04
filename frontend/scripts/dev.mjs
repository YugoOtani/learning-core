import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = resolve(frontendDirectory, '..');
const viteEntry = resolve(frontendDirectory, 'node_modules/vite/bin/vite.js');
const children = [];
let backendChild;
let backendExit;
let stopping = false;

async function isBackendAvailable() {
  try {
    const response = await fetch('http://127.0.0.1:3000/health', {
      signal: AbortSignal.timeout(500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend() {
  while (!(await isBackendAvailable())) {
    if (backendExit?.finished) {
      throw new Error('Rustバックエンドが起動できませんでした。');
    }
    await delay(300);
  }
}

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(exitCode), 1000).unref();
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

try {
  if (!(await isBackendAvailable())) {
    backendChild = spawn('cargo', ['run', '--manifest-path', resolve(repositoryDirectory, 'backend/Cargo.toml')], {
      cwd: repositoryDirectory,
      stdio: 'inherit',
      windowsHide: true,
    });
    children.push(backendChild);
    backendExit = { finished: false };
    backendChild.once('exit', (code) => {
      backendExit.finished = true;
      if (!stopping) stopAll(code ?? 1);
    });
    backendChild.once('error', () => {
      backendExit.finished = true;
      if (!stopping) stopAll(1);
    });
    await waitForBackend();
  }

  const viteChild = spawn(process.execPath, [viteEntry], {
    cwd: frontendDirectory,
    stdio: 'inherit',
    windowsHide: true,
  });
  children.push(viteChild);
  viteChild.once('exit', (code) => stopAll(code ?? 1));
  viteChild.once('error', () => stopAll(1));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  stopAll(1);
}
