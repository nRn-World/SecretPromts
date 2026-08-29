/**
 * Ensures secretpromts.vercel.app exists in Firebase Auth authorized domains.
 * Run: node scripts/add-firebase-authorized-domain.mjs
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = 'secretpromts';
const DOMAINS_TO_ENSURE = [
  'secretpromts.vercel.app',
  'secretpromts.web.app',
  'secretpromts.firebaseapp.com',
  'localhost',
];

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
  const updated = [...current];

  for (const domain of DOMAINS_TO_ENSURE) {
    if (!updated.includes(domain)) updated.push(domain);
  }

  if (updated.length === current.length) {
    console.log('All domains already authorized:', updated.join(', '));
    return;
  }

  await patchAuthConfig(tokens.access_token, config, updated);
  console.log('Updated authorized domains:', updated.join(', '));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
