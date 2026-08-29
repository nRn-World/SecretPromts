/**
 * Ensures OAuth client has required JavaScript origins for Google Sign-In (GIS).
 * Run: node scripts/update-oauth-origins.mjs
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_NUMBER = '854110275451';
const CLIENT_ID = '854110275451-rprkdsdorr5atqamuc5acs8l6mclt4l5.apps.googleusercontent.com';
const ORIGINS_TO_ENSURE = [
  'https://secretpromts.vercel.app',
  'https://secretpromts.web.app',
  'https://secretpromts.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost',
];

function loadFirebaseTokens() {
  const paths = [
    join(homedir(), '.config', 'configstore', 'firebase-tools.json'),
    join(process.env.LOCALAPPDATA || '', 'configstore', 'firebase-tools.json'),
  ].filter(Boolean);

  for (const path of paths) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      if (parsed?.tokens?.refresh_token) return parsed.tokens;
    } catch {
      // try next path
    }
  }
  throw new Error('Firebase refresh token not found. Run: firebase login');
}

async function getAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5iubb5lhl6sst6t9.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaQVWKxrNi',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function listOAuthClients(accessToken) {
  const res = await fetch(
    `https://oauth2.googleapis.com/v2/projects/${PROJECT_NUMBER}/oauthClients`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`List OAuth clients failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getOAuthClient(accessToken, name) {
  const res = await fetch(`https://oauth2.googleapis.com/v2/${name}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Get OAuth client failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function patchOAuthClient(accessToken, name, client) {
  const res = await fetch(`https://oauth2.googleapis.com/v2/${name}?updateMask=allowedOrigins,allowedRedirectUris`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(client),
  });
  if (!res.ok) throw new Error(`Patch OAuth client failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const tokens = loadFirebaseTokens();
  const accessToken = await getAccessToken(tokens.refresh_token);

  const list = await listOAuthClients(accessToken);
  const clients = list.oauthClients || [];
  const match = clients.find((c) => c.name?.includes('rprkdsdorr5atqamuc5acs8l6mclt4l5') || c.displayName?.includes('Web client'));

  if (!match) {
    console.log('OAuth clients found:', clients.map((c) => c.name).join(', ') || '(none)');
    console.log('\nCould not auto-update. Add these JavaScript origins manually in Google Cloud Console:');
    console.log('https://console.cloud.google.com/apis/credentials?project=secretpromts');
    ORIGINS_TO_ENSURE.forEach((o) => console.log(' -', o));
    return;
  }

  const client = await getOAuthClient(accessToken, match.name);
  const origins = [...(client.allowedOrigins || [])];
  const redirects = [...(client.allowedRedirectUris || [])];

  for (const origin of ORIGINS_TO_ENSURE) {
    if (!origins.includes(origin)) origins.push(origin);
  }

  const redirectToEnsure = `https://${PROJECT_NUMBER}.firebaseapp.com/__/auth/handler`;
  if (!redirects.includes(redirectToEnsure)) redirects.push(redirectToEnsure);

  if (
    origins.length === (client.allowedOrigins || []).length &&
    redirects.length === (client.allowedRedirectUris || []).length
  ) {
    console.log('OAuth origins already configured:', origins.join(', '));
    return;
  }

  const updated = await patchOAuthClient(accessToken, match.name, {
    ...client,
    allowedOrigins: origins,
    allowedRedirectUris: redirects,
  });

  console.log('Updated OAuth client:', match.name);
  console.log('Origins:', (updated.allowedOrigins || origins).join(', '));
}

main().catch((err) => {
  console.error(err.message || err);
  console.log('\nManual fix: Google Cloud Console > Credentials > OAuth 2.0 Client IDs');
  console.log('Add authorized JavaScript origins:', ORIGINS_TO_ENSURE.join(', '));
  process.exit(1);
});
