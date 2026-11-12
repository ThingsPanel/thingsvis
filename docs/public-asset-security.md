# Public asset fetching (A-019)

The public asset proxy and remote model import both use `public-asset-fetch.ts`. Arbitrary public HTTP/HTTPS resources and up to five public redirects remain supported; no domain allowlist is introduced. Range headers and streaming responses remain supported.

Each hop rejects URL credentials, loopback/private/link-local/metadata/special-use addresses, IPv4-mapped IPv6 forms, local network interface addresses, the request origin hostname, and explicitly configured self hosts. All DNS answers must be public. Connections use a pinned DNS lookup and a fresh agent, keeping the original URL hostname for HTTP Host and HTTPS certificate verification. Redirection is handled manually; every new hop is resolved and checked again. DNS failures and unsafe targets fail closed. Socket idle timeout is 30 seconds; the overall fetch/body lifetime is two minutes.

When the server is behind public NAT or has other public aliases, set `ASSET_SELF_HOSTS` to the public NAT IPs and aliases (comma separated). AUTH_URL and NEXTAUTH_URL hostnames are also blocked if configured. Unknown public NAT addresses cannot be inferred from local interfaces; ensure they are listed. This only extends the deny list and does not restrict other public asset domains.

Upstream response/error bodies and connection error details are no longer echoed on failure. No deployed addresses or credentials were changed by this patch.

Verification: `pnpm exec vitest run --config apps/server/vitest.assets.config.ts`. Tests mock DNS and network transport and cover encoded IPs, mapped IPv6, mixed DNS results, private redirects, changing DNS after redirects, pinned lookups, normal public redirects, Range and gzip. Deployment/network verification is still required. Implementation references: https://nodejs.org/api/http.html and https://github.com/whitequark/ipaddr.js.
