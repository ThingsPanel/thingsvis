import { pathToFileURL } from 'node:url';

// Run before replacing the running server. No user token or secret is transmitted.
export async function checkPlatformSSO(env = process.env, request = fetch) {
  const secret = env.AUTH_SECRET || '';
  if (
    secret.length < 32 ||
    new Set(secret).size < 12 ||
    /change-me|thingsvis-dev-secret/i.test(secret)
  ) {
    throw new Error('Configure a strong AUTH_SECRET before deployment');
  }
  if (!env.THINGSPANEL_API_URL) throw new Error('Configure THINGSPANEL_API_URL before deployment');
  const url = new URL(env.THINGSPANEL_API_URL);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('Invalid THINGSPANEL_API_URL');
  }
  url.pathname =
    url.pathname.replace(/\/+$/, '').replace(/\/api\/v1$/, '') + '/api/v1/auth/sso/identity';
  const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(5000) });
  // The protected identity endpoint must reject an anonymous request with JSON.
  if (
    response.status !== 401 ||
    !response.headers.get('content-type')?.includes('application/json')
  ) {
    throw new Error(
      `Platform SSO endpoint not ready (HTTP ${response.status}); deploy the matching ThingsPanel backend first`,
    );
  }
  const body = await response.json();
  if (![401, 40100, 40101, 40102, 40103].includes(body.code)) {
    throw new Error('Platform SSO endpoint returned an unexpected authentication response');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkPlatformSSO()
    .then(() => console.log('Platform SSO preflight passed'))
    .catch((error) => {
      console.error(`Platform SSO preflight failed: ${error.message}`);
      process.exitCode = 1;
    });
}
