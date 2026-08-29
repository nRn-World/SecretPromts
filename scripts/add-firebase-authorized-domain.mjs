/**
 * Adds secretpromts.vercel.app to Firebase Auth authorized domains.
 * Uses the local Firebase CLI login session (configstore tokens).
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = 'secretpromts';
const DOMAIN_TO_ADD = 'secretpromts.vercel.app';

function loadFirebaseTokens() {
  const paths = [
    join(homedir(), '.config', 'configstore', 'firebase-tools.json'),
    join(process.env.LOCALAPPDATA || '', 'configstore', 'firebase-tools.json'),
  ].filter(Boolean);

  for (const path of paths) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      if (parsed?.tokens?.access_token) return parsed.tokens;
    } catch {
      // try next path
    }
  }
  throw new Error('Firebase access token not found. Run: firebase login');
}

async function getAuthConfig(accessToken) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`GET config failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function patchAuthConfig(accessToken, config, authorizedDomains) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...config, authorizedDomains }),
    }
  );
  if (!res.ok) throw new Error(`PATCH config failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const tokens = loadFirebaseTokens();
  const config = await getAuthConfig(tokens.access_token);
  const current = config.authorizedDomains || [];

  if (current.includes(DOMAIN_TO_ADD)) {
    console.log(`Already authorized: ${DOMAIN_TO_ADD}`);
    console.log('Current domains:', current.join(', '));
    return;
  }

  const updated = [...current, DOMAIN_TO_ADD];
  await patchAuthConfig(tokens.access_token, config, updated);
  console.log(`Added authorized domain: ${DOMAIN_TO_ADD}`);
  console.log('Authorized domains:', updated.join(', '));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
