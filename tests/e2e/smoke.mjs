import { spawn } from 'node:child_process';

const PORT = process.env.E2E_PORT || '4010';
const BASE_URL = `http://127.0.0.1:${PORT}`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      // retry
    }
    await delay(750);
  }
  throw new Error(`Server did not become ready at ${url} in ${timeoutMs}ms`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const e2eDistDir = `.next-e2e-${Date.now()}`;
  const server = spawn('npm', ['run', 'dev', '--', '-p', PORT, '--hostname', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development', NEXT_DIST_DIR: e2eDistDir },
  });

  let serverLogs = '';
  server.stdout.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });

  try {
    await waitForServer(`${BASE_URL}/`);

    const footerRoutes = ['/', '/pricing', '/templates', '/terms', '/privacy'];
    for (const route of footerRoutes) {
      const res = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' });
      assert(res.status === 200, `Expected 200 for ${route}, got ${res.status}`);

      const html = await res.text();
      assert(html.includes('ResumeAI'), `Missing brand text on ${route}`);
      assert(html.includes('/privacy') && html.includes('/terms'), `Missing functional footer links on ${route}`);
      assert(!html.includes('href="#"'), `Found placeholder footer/header link on ${route}`);
    }

    const loginRes = await fetch(`${BASE_URL}/login`, { redirect: 'manual' });
    assert(loginRes.status === 200, `Expected 200 for /login, got ${loginRes.status}`);
    const loginHtml = await loginRes.text();
    assert(loginHtml.includes('Sign in your account'), 'Missing login heading on /login');
    assert(loginHtml.includes('Google'), 'Missing Google auth button on /login');

    const dashboardRes = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    assert(
      [302, 303, 307, 308].includes(dashboardRes.status),
      `Expected redirect for /dashboard when logged out, got ${dashboardRes.status}`
    );
    const dashboardLocation = dashboardRes.headers.get('location') || '';
    assert(
      dashboardLocation.includes('/api/auth/signin') || dashboardLocation.includes('/login'),
      `Expected /dashboard redirect target to include /api/auth/signin or /login, got ${dashboardLocation}`
    );

    const imageRoutes = ['/images/hero-resume-preview.svg', '/images/hero-ats-score.svg'];
    for (const route of imageRoutes) {
      const res = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' });
      assert(res.status === 200, `Expected 200 for ${route}, got ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      assert(contentType.includes('image/svg+xml'), `Expected SVG content-type for ${route}, got ${contentType}`);
    }

    console.log('E2E smoke checks passed.');
  } catch (error) {
    console.error('E2E smoke checks failed.');
    console.error(error instanceof Error ? error.message : error);
    console.error(serverLogs.slice(-4000));
    process.exitCode = 1;
  } finally {
    server.kill('SIGTERM');
    await delay(800);
    if (!server.killed) server.kill('SIGKILL');
  }
}

await run();
