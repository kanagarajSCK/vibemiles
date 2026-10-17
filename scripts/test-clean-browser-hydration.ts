/**
 * VibeMiles Hydration & Clean Browser Verification Script
 * Validates:
 * 1. Server-rendered HTML vs Client-hydrated DOM for <body ...>
 * 2. Absence of `cz-shortcut-listen` in server HTML
 * 3. Absence of `cz-shortcut-listen` in a clean Chrome session (extensions disabled)
 * 4. Verification across multiple routes: /, /packages, /deals, /destinations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ROUTES_TO_TEST = ['/', '/packages', '/deals', '/destinations'];

async function testRoute(route: string) {
  console.log(`\n============================================================`);
  console.log(` TESTING ROUTE: ${route}`);
  console.log(`============================================================`);

  const url = `${BASE_URL}${route}`;

  // 1. Fetch Server-rendered HTML with retry
  let serverHtml = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      serverHtml = await res.text();
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const bodyMatchServer = serverHtml.match(/<body[^>]*>/i);
  const serverBodyTag = bodyMatchServer ? bodyMatchServer[0] : 'NOT FOUND';
  console.log(`[Server HTML] <body> tag: ${serverBodyTag}`);

  const serverHasCz = serverBodyTag.includes('cz-shortcut-listen');
  console.log(`[Server HTML] Contains cz-shortcut-listen: ${serverHasCz ? 'YES (BUG)' : 'NO (CLEAN)'}`);

  // 2. Headless Chrome with Extensions Disabled
  const cleanProfileDir = path.join(os.tmpdir(), `vibemiles-clean-chrome-${Date.now()}`);
  fs.mkdirSync(cleanProfileDir, { recursive: true });

  try {
    const cmd = `"${CHROME_PATH}" --headless=new --disable-extensions --user-data-dir="${cleanProfileDir}" --dump-dom "${url}"`;
    const clientDom = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

    const bodyMatchClient = clientDom.match(/<body[^>]*>/i);
    const clientBodyTag = bodyMatchClient ? bodyMatchClient[0] : 'NOT FOUND';
    console.log(`[Clean Chrome DOM] <body> tag: ${clientBodyTag}`);

    const clientHasCz = clientBodyTag.includes('cz-shortcut-listen');
    console.log(`[Clean Chrome DOM] Contains cz-shortcut-listen: ${clientHasCz ? 'YES (UNEXPECTED)' : 'NO (CLEAN)'}`);

    // Verify attribute consistency
    if (!serverHasCz && !clientHasCz) {
      console.log(`[PASS] Both Server HTML and Clean Chrome DOM are completely free of cz-shortcut-listen!`);
    } else {
      console.error(`[FAIL] Mismatch detected on route ${route}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error dumping Chrome DOM for ${route}:`, message);
  } finally {
    try {
      fs.rmSync(cleanProfileDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }

  await new Promise((r) => setTimeout(r, 1000));
}

async function main() {
  console.log('============================================================');
  console.log(' VIBEMILES HYDRATION & CLEAN BROWSER AUDIT');
  console.log('============================================================');

  for (const route of ROUTES_TO_TEST) {
    await testRoute(route);
  }

  console.log('\n============================================================');
  console.log(' ALL ROUTE CHECKS COMPLETED');
  console.log('============================================================');
}

main().catch(console.error);
